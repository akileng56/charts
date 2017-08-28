import { Component, createElement } from "react";
import * as classNames from "classnames";

import * as Plotly from "plotly.js/dist/plotly";
import "core-js/es6/promise";

import { LineData } from "../LineChart";
import "../ui/LineChart.css";

interface LineChartProps {
    data?: LineData[];
    config?: Partial<Plotly.Config>;
    layout?: Partial<Plotly.Layout>;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    className?: string;
    style?: object;
    toolTipForm?: string;
}

class LineChart extends Component<LineChartProps, {}> {
    private lineChartNode: HTMLDivElement;
    private toolTipNode: HTMLDivElement;
    private data: LineData[] = [
        {
            connectgaps: true,
            mode: "lines+markers",
            name: "Default data points",
            type: "scatter",
            x: [ 14, 20, 30, 50 ],
            y: [ 14, 30, 20, 40 ]
        }
    ];

    constructor(props: LineChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames("widget-line-chart", this.props.className),
            ref: this.getPlotlyNodeRef,
            style: {
                ...this.getStyle(),
                ...this.props.style
            }
        },
            createElement("div", {
                className: "widget-chart-custom-tooltip",
                ref: (node: HTMLDivElement) => this.toolTipNode = node
            })
        );
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.setUpEvents();
        this.adjustStyle();
    }

    componentWillReceiveProps(newProps: LineChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.lineChartNode) {
            Plotly.purge(this.lineChartNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChartNode = node;
    }

    private adjustStyle() {
        if (this.lineChartNode) {
            const wrapperElement = this.lineChartNode.parentElement;
            if (this.props.heightUnit === "percentageOfParent" && wrapperElement) {
                wrapperElement.style.height = "100%";
                wrapperElement.style.width = "100%";
            }
        }
    }

    private setUpEvents() {
        // A workaround for attaching the resize event to the Iframe window because the plotly
        // library does not support it. This fix will be done in the web modeler preview class when the
        // plotly library starts supporting listening to Iframe events.
        const iFrame = document.getElementsByClassName("t-page-editor-iframe")[0] as HTMLIFrameElement;
        if (iFrame) {
            (iFrame.contentWindow || iFrame.contentDocument).addEventListener("resize", this.onResize);
        } else {
            window.addEventListener("resize", this.onResize);
        }
    }

    private renderChart(props: LineChartProps) {
        const { data, config, layout } = props;
        if (this.lineChartNode) {
            Plotly.newPlot(this.lineChartNode, data && data.length ? data : this.data, layout, config)
                .then(myPlot => {
                    myPlot.on("plotly_hover", Data => {
                        if (this.props.toolTipForm) {
                            Data.points.map((point) => {
                                const distanceYaxis = Data.points[0].yaxis.l2p(point.y) + Data.points[0].yaxis._offset;
                                const distanceXaxis = Data.points[0].xaxis.d2p(point.x) + Data.points[0].xaxis._offset;
                                this.toolTipNode.style.top = distanceYaxis + "px";
                                this.toolTipNode.style.left = distanceXaxis + "px";
                                this.toolTipNode.style.opacity = "1";
                            });
                            window.mx.ui.openForm(this.props.toolTipForm, { domNode: this.toolTipNode });
                        }
                    });
                    myPlot.on("plotly_unhover", () => {
                        this.toolTipNode.innerHTML = "";
                        this.toolTipNode.style.opacity = "0";
                    });
                });
        }
    }

    private getStyle(): object {
        const style: { paddingBottom?: string; width: string, height?: string } = {
            width: this.props.widthUnit === "percentage" ? `${this.props.width}%` : `${this.props.width}`
        };
        if (this.props.heightUnit === "percentageOfWidth") {
            style.paddingBottom = `${this.props.height}%`;
        } else if (this.props.heightUnit === "pixels") {
            style.paddingBottom = `${this.props.height}`;
        } else if (this.props.heightUnit === "percentageOfParent") {
            style.height = `${this.props.height}%`;
        }
        return style;
    }

    private onResize() {
        Plotly.Plots.resize(this.lineChartNode);
    }
}

export { LineChart };

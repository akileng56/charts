import { Component, createElement } from "react";
import * as classNames from "classnames";

import { Config, Layout, PlotlyStatic } from "plotly.js";
import * as Plotly from "plotly.js/dist/plotly";

import { LineData } from "../LineChart";

interface LineChartProps {
    data?: LineData[];
    config?: Partial<Config>;
    layout?: Partial<Layout>;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    className?: string;
    style?: object;
}

class LineChart extends Component<LineChartProps, {}> {
    private lineChart: HTMLDivElement;
    private Plotly: PlotlyStatic;
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

        this.Plotly = Plotly;
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
        });
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
        if (this.lineChart) {
            this.Plotly.purge(this.lineChart);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChart = node;
    }

    private adjustStyle() {
        if (this.lineChart) {
            const wrapperElement = this.lineChart.parentElement;
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
        if (this.lineChart) {
            this.Plotly.newPlot(this.lineChart, data && data.length ? data : this.data, layout, config);
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
        this.Plotly.Plots.resize(this.lineChart);
    }
}

export { LineChart };

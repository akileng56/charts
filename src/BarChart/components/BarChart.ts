import { Component, createElement } from "react";
import * as classNames from "classnames";

import { BarData, BarLayout, Config, PlotlyStatic } from "plotly.js";
import * as Plotly from "plotly.js/dist/plotly";

interface BarChartProps {
    data?: BarData[];
    layout?: Partial<BarLayout>;
    config?: Partial<Config>;
    className?: string;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    style?: object;
}

export class BarChart extends Component<BarChartProps, {}> {
    private plotlyNode: HTMLDivElement;
    private Plotly: PlotlyStatic;
    private data: BarData[] = [
        {
            type: "bar",
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4", "Sample 5", "Sample 6", "Sample 7" ],
            y: [ 20, 14, 23, 25, 50, 32, 44 ]
        }
    ];

    constructor(props: BarChartProps) {
        super(props);

        this.Plotly = Plotly;
        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames("widget-plotly-bar", this.props.className),
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

    componentWillReceiveProps(newProps: BarChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.plotlyNode) {
            this.Plotly.purge(this.plotlyNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.plotlyNode = node;
    }

    private adjustStyle() {
        if (this.plotlyNode) {
            const wrapperElement = this.plotlyNode.parentElement;
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

    private renderChart(props: BarChartProps) {
        const { config, data, layout } = props;
        if (this.plotlyNode) {
            this.Plotly.newPlot(this.plotlyNode, data && data.length ? data : this.data, layout, config);
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
        this.Plotly.Plots.resize(this.plotlyNode);
    }
}

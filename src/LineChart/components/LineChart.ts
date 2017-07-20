import { Component, DOM } from "react";

import * as classNames from "classnames";
import { Config, LineLayout, PlotlyStatic, ScatterData } from "plotly.js";

import "../ui/LineChart.css";

declare function require(name: string): string;

interface LineChartProps {
    data?: ScatterData[];
    config?: Partial<Config>;
    layout?: Partial<LineLayout>;
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
    private data: ScatterData[] = [
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

        this.Plotly = require("plotly.js/dist/plotly") as any;

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return DOM.div({
            className: classNames("widget-line-chart", this.props.className),
            ref: this.getPlotlyNodeRef,
            style: {
                ...this.props.style,
                height: this.getStyle(this.props.height, this.props.heightUnit),
                width: this.getStyle(this.props.width, this.props.widthUnit)
            }
        });
    }

    componentDidMount() {
        const iFrame = this.getIframe();
        this.renderChart(this.props);
        if (iFrame) {
            iFrame.contentWindow.addEventListener("resize", this.onResize);
        } else {
            window.addEventListener("resize", this.onResize);
        }
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

    private getIframe(): HTMLIFrameElement {
        return document.getElementsByClassName("t-page-editor-iframe")[0] as HTMLIFrameElement;
    }

    private renderChart(props: LineChartProps) {
        const { data, config, layout } = props;
        if (this.lineChart) {
            this.Plotly.newPlot(this.lineChart, data && data.length ? data : this.data, layout, config);
        }
    }

    private getStyle(value: string | number, type: string): number | string {
        // when type is auto default browser styles applies
        if (type === "pixels") {
            return value;
        } else if (type === "percentage") {
            return value + "%";
        }

        return "";
    }

    private onResize() {
        this.Plotly.Plots.resize(this.lineChart);
    }
}

export { LineChart };

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
        this.renderChart(this.props.data);
    }

    componentWillReceiveProps(newProps: LineChartProps) {
        this.renderChart(newProps.data);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChart = node;
    }

    private renderChart(data?: ScatterData[]) {
        const { config, layout } = this.props;
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
}

export { LineChart };

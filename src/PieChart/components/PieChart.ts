import { Component, createElement } from "react";

import * as classNames from "classnames";
import { Config, Layout, PlotlyStatic } from "plotly.js";

import { ChartType } from "./PieChartContainer";

declare function require(name: string): string;

interface PieChartProps {
    data?: any[];
    config?: Partial<Config>;
    layout?: Partial<Layout>;
    type: ChartType;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChart: HTMLDivElement;
    private plotly: PlotlyStatic;
    private data: any[] = [ {
        hole: this.props.type === "donut" ? .4 : 0,
        hoverinfo: "label+percent+name",
        labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
        name: "GHG Emissions",
        type: "pie",
        values: [ 16, 15, 12, 6, 5, 4, 42 ]
    } ];

    constructor(props: PieChartProps) {
        super(props);

        this.plotly = require("plotly.js/dist/plotly") as any;

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames("widget-pie-chart"),
            ref: this.getPlotlyNodeRef
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
    }

    componentWillReceiveProps(newProps: PieChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.pieChart) {
            this.plotly.purge(this.pieChart);
        }
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.pieChart = node;
    }

    private renderChart(props: PieChartProps) {
        const { data, config, layout } = props;

        if (this.pieChart) {
            this.plotly.newPlot(this.pieChart, data && data.length ? data : this.data, layout, config);
        }
    }
}

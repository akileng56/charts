import { Component, createElement } from "react";

import * as classNames from "classnames";
import { Config, Layout, PieData, PlotlyStatic, Root } from "plotly.js";
import * as Plotly from "plotly.js/dist/plotly";

import { ChartType } from "./PieChartContainer";

interface PieChartProps {
    data?: PieData[];
    config?: Partial<Config>;
    layout?: Partial<Layout>;
    type: ChartType;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChart: Root;
    private plotly: PlotlyStatic;
    private data: PieData[] = [ {
        hole: this.props.type === "donut" ? .4 : 0,
        hoverinfo: "label+name",
        labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
        name: "GHG Emissions",
        type: "pie",
        values: [ 16, 15, 12, 6, 5, 4, 42 ]
    } ];

    constructor(props: PieChartProps) {
        super(props);

        this.plotly = Plotly;
        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames(`widget-${this.props.type}-chart`),
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

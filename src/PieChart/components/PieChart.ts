import { Component, createElement } from "react";

import * as classNames from "classnames";
import { Config, Layout, PieData, PlotlyStatic } from "plotly.js";
import * as Plotly from "plotly.js/dist/plotly";

import { ChartType } from "./PieChartContainer";

interface PieChartProps {
    data?: PieData[];
    config?: Partial<Config>;
    layout?: Partial<Layout>;
    type: ChartType;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    className?: string;
    style?: object;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChart: HTMLDivElement;
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
            className: classNames(`widget-${this.props.type}-chart`, this.props.className),
            ref: this.getPlotlyNodeRef,
            style: {
                ...this.getStyle(),
                ...this.props.style
            }
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.adjustStyle();
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

    private adjustStyle() {
        if (this.pieChart) {
            const wrapperElement = this.pieChart.parentElement;
            if (this.props.heightUnit === "percentageOfParent" && wrapperElement) {
                wrapperElement.style.height = "100%";
                wrapperElement.style.width = "100%";
            }
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
}

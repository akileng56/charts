import { Component, createElement } from "react";

import { PieChart } from "./PieChart";

export type ChartType = "pie" | "donut";

interface PieChartContainerProps {
    chartType: ChartType;
}

export default class PieChartContainer extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement(PieChart, { type: this.props.chartType });
    }
}

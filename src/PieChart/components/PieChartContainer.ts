import { Component, createElement } from "react";

import { PieChart } from "./PieChart";

interface PieChartContainerProps {
    chartType: ChartType;
}

export type ChartType = "pie" | "donut";

export default class PieChartContainer extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement(PieChart, { type: this.props.chartType });
    }
}

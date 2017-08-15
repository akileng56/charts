import { Component, createElement } from "react";

import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps } from "./components/PieChartContainer";
import { Alert } from "../components/Alert";

declare function require(name: string): string;

type VisibilityMap = {
    [P in keyof PieChartContainerProps]: boolean;
};

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: `widget-${this.props.chartType}-chart-alert`,
                message: PieChartContainer.validateProps(this.props)
            }),
            createElement(PieChart, {
                config: {
                    displayModeBar: this.props.showToolBar
                },
                data: [ {
                    hole: this.props.chartType === "donut" ? .4 : 0,
                    hoverinfo: "label+name",
                    labels: [ "Apples", "Mangoes", "Jackfruit", "Oranges" ],
                    name: "Fruits",
                    type: "pie",
                    values: [ 16, 15, 12, 42 ]
                } ],
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    showlegend: this.props.showLegend
                },
                style: PieChartContainer.parseStyle(this.props.style),
                type: this.props.chartType,
                width: this.props.width,
                widthUnit: this.props.widthUnit
            })
        );
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap) {
    if (valueMap.dataSourceType === "xpath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}

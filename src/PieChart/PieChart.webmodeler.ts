import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { PieChart } from "./components/PieChart";
import PieChartContainer, { PieChartContainerProps } from "./components/PieChartContainer";

type VisibilityMap = {
    [P in keyof PieChartContainerProps]: boolean;
};

// tslint:disable-next-line class-name
export class preview extends Component<PieChartContainerProps, {}> {
    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: `widget-${this.props.chartType}-chart-alert`,
                message: PieChartContainer.validateProps(this.props)
            }),
            createElement(PieChart, {
                config: { displayModeBar: this.props.showToolBar },
                data: [ this.getDefaultData(this.props.chartType) ],
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

    private getDefaultData(chartType: string): Plotly.PieData {
        return {
            hole: chartType === "doughnut" ? .4 : 0,
            hoverinfo: "label+name",
            labels: [ "Apples", "Mangoes", "Jackfruit", "Oranges" ],
            name: "Fruits",
            type: "pie",
            values: [ 16, 15, 12, 42 ]
        };
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}

export function getVisibleProperties(valueMap: PieChartContainerProps, visibilityMap: VisibilityMap) {
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}

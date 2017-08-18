import { Component, createElement } from "react";

import { Alert } from "../components/Alert";
import { BarChart } from "./components/BarChart";
import BarChartContainer, { BarChartContainerProps } from "./components/BarChartContainer";
import { ScatterData } from "plotly.js";

type VisibilityMap = {
    [ P in keyof BarChartContainerProps ]: boolean;
};

// tslint:disable-next-line class-name
export class preview extends Component<BarChartContainerProps, {}> {
    private data: Partial<ScatterData>[] = [ // tslint:disable-line
        {
            type: "bar",
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4", "Sample 5", "Sample 6", "Sample 7" ],
            y: [ 20, 14, 23, 25, 50, 32, 44 ]
        }
    ];

    render() {
        return createElement("div", {},
            createElement(Alert, {
                bootstrapStyle: "danger",
                className: "widget-bar-chart-alert",
                message: BarChartContainer.validateProps(this.props)
            }),
            createElement(BarChart, {
                config: { displayModeBar: this.props.showToolbar },
                data: this.data as ScatterData[],
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    barmode: this.props.barMode,
                    xaxis: { title: this.props.xAxisLabel },
                    yaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.yAxisLabel
                    }
                },
                style: BarChartContainer.parseStyle(this.props.style),
                width: this.props.width,
                widthUnit: this.props.widthUnit
            })
        );
    }
}

export function getPreviewCss() {
    return (require("plotly.js/src/css/style.scss"));
}

export function getVisibleProperties(valueMap: BarChartContainerProps, visibilityMap: VisibilityMap) {
    if (valueMap.dataSourceType === "XPath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.dataSourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}

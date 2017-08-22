import { Component, createElement } from "react";

import { LineChart } from "./components/LineChart";
import LineChartContainer, { LineChartContainerProps } from "./components/LineChartContainer";
import { Alert } from "../components/Alert";
import { LineData, Series } from "./LineChart";

declare function require(name: string): string;

type VisibilityMap = {
    [P in keyof LineChartContainerProps]: boolean;
};

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    private data: LineData[] = [
        {
            connectgaps: true,
            mode: "lines+markers",
            type: "scatter",
            x: [ 14, 20, 30, 50 ],
            y: [ 14, 30, 20, 40 ]
        }
    ];

    render() {
        return createElement("div", {},
            createElement(Alert, {
                className: "widget-line-chart-alert",
                message: LineChartContainer.validateProps(this.props)
            }),
            createElement(LineChart, {
                config: {
                    displayModeBar: this.props.showToolBar,
                    doubleClick: false
                },
                data: this.data,
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    showlegend: this.props.showLegend,
                    xaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.xAxisLabel
                    },
                    yaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.yAxisLabel
                    }
                },
                style: LineChartContainer.parseStyle(this.props.style),
                width: this.props.width,
                widthUnit: this.props.widthUnit
            })
        );
    }
}

export function getPreviewCss() {
    return require("plotly.js/src/css/style.scss");
}

export function getVisibleProperties(valueMap: LineChartContainerProps, visibilityMap: VisibilityMap) {
    valueMap.seriesConfig.forEach((config: Series, index: number) => {
        if (config.sourceType === "xpath") {
            visibilityMap.seriesConfig[index].entityConstraint = true;
            visibilityMap.seriesConfig[index].dataSourceMicroflow = false;
        } else if (config.sourceType === "microflow") {
            visibilityMap.seriesConfig[index].entityConstraint = false;
            visibilityMap.seriesConfig[index].dataSourceMicroflow = true;
        }
    });

    return visibilityMap;
}

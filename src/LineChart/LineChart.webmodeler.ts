import { Component, createElement } from "react";

import { ScatterData } from "plotly.js";
import { LineChart } from "./components/LineChart";
import LineChartContainer, { LineChartContainerProps } from "./components/LineChartContainer";
import { Alert } from "./components/Alert";

declare function require(name: string): string;

type VisibilityMap = {
    [P in keyof LineChartContainerProps]: boolean;
};

// tslint:disable-next-line class-name
export class preview extends Component<LineChartContainerProps, {}> {
    private data: ScatterData[] = [
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
            createElement(Alert, { message: LineChartContainer.validateProps(this.props) }),
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
    return (
        require("./ui/LineChart.css") +
        require("plotly.js/src/css/style.scss")
    );
}

export function getVisibleProperties(valueMap: LineChartContainerProps, visibilityMap: VisibilityMap) {
    if (valueMap.sourceType === "xpath") {
        visibilityMap.entityConstraint = true;
        visibilityMap.dataSourceMicroflow = false;
    } else if (valueMap.sourceType === "microflow") {
        visibilityMap.entityConstraint = false;
        visibilityMap.dataSourceMicroflow = true;
    }

    return visibilityMap;
}

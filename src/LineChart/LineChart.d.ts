/* tslint:disable */
export default ModelProps;

export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines"| "text+lines+markers" | "none";
export interface ModelProps {
    seriesEntity: string;
    seriesNameAttribute: string;
    dataEntity: string;
    sourceType: "xpath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
    mode: Mode;
    lineColor: string;
    width: number;
    height: number;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    widthUnit: "percentage" | "pixels";
    heightUnit: "percentageOfWidth" | "pixels" | "percentageOfParent";
}


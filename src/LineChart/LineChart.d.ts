import { Datum, ScatterLine, ScatterMarker } from "plotly.js";

// tslint:disable-next-line
export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines"| "text+lines+markers" | "none";

export default ModelProps;

export interface ModelProps {
    seriesConfig: Series[];
    seriesEntity: string;
    seriesNameAttribute: string;
    dataEntity: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
    lineColorAttribute: string;
    mode: "lines" | "markers" | "text" | "linesomarkers";
    xAxisLabel: string;
    yAxisLabel: string;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    widthUnit: "percentage" | "pixels";
    width: number;
    heightUnit: "percentageOfWidth" | "pixels" | "percentageOfParent";
    height: number;
    toolTipForm: string;
}

export interface Series {
    name: string;
    dataEntity: string;
    dataSourceType: "XPath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xValueSortAttribute: string;
    mode: "lines" | "markers" | "text" | "linesomarkers";
    lineColor: string;
}

export interface LineData {
    type: "scatter" | "scattergl";
    x: Datum[];
    y: Datum[];
    text?: string | string[];
    line?: Partial<ScatterLine>;
    marker?: Partial<ScatterMarker>;
    mode: Mode;
    hoveron?: "points" | "fills";
    hoverinfo?: "text";
    fill?: "none" | "tozeroy" | "tozerox" | "tonexty" | "tonextx" | "toself" | "tonext";
    fillcolor?: string;
    legendgroup?: string;
    name?: string;
    connectgaps?: boolean;
}

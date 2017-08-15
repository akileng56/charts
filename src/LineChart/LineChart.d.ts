import { Datum, ScatterLine, ScatterMarker } from "plotly.js";

// tslint:disable-next-line
export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines"| "text+lines+markers" | "none";

export default ModelProps;

export interface ModelProps {
    seriesEntity: string;
    seriesNameAttribute: string;
    dataEntity: string;
    dataSourceType: "xpath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    xValueAttribute: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
    mode: "lines" | "markers" | "text" | "linesomarkers";
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

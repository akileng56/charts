/* tslint:disable */
export default ModelProps;

export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines"| "text+lines+markers" | "none";
export interface ModelProps {
    seriesConfig: serieConfig[];
    width: number;
    height: number;
    title?: string;
    showGrid: boolean;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    widthUnit: "percentage" | "pixels" | "auto";
    heightUnit: "percentage" | "pixels" | "auto";
}

export interface serieConfig {
     name: string;
     entity: string;
     sourceType: "xpath" | "microflow";
     entityConstraint: string;
     dataSourceMicroflow: string;
     xAttribute: string;
     yAttribute: string;
     mode: Mode;
     lineColor: string;
 }

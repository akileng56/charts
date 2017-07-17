/* tslint:disable */
export default ModelProps;

export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines"| "text+lines+markers" | "none";
export interface ModelProps {
    seriesConfig: serieConfig[];
    width: number;
    height: number;
    title?: string;
    showGrid: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
    widthUnit: "percentage" | "pixels";
    heightUnit: "percentage" | "pixels" | "auto";
}

export interface SerieConfig {
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

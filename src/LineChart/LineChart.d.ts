export default ModelProps;

export type Mode = "lines" | "markers" | "text" | "lines+markers" | "text+markers" | "text+lines" | "text+lines+markers" | "none";
export interface ModelProps {
    traceConfigs: traceConfig[];
    width: number;
    height: number;
    title?: string;
    showGrid: boolean;
    showLegend: boolean;
    xAxisLabel: string;
    yAxisLabel: string;
}

export interface traceConfig {
     traceName: string;
     entity: string;
     sourceType: "xpath" | "microflow";
     entityConstraint: string;
     dataSourceMicroflow: string;
     xAttribute: string;
     yAttribute: string;
     mode: Mode
 }

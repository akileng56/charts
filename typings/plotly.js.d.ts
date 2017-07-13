import { Layout } from "plotly.js";

declare module "plotly.js" {
    interface ScatterData {
        name?: string;
        legendgroup?: string;
        text?: string | string[];
        fill?: "none" | "tozeroy" | "tozerox" | "tonexty" | "tonextx" | "toself" | "tonext";
        fillcolor?: string;
        line?: Partial<ScatterLine>;
        marker?: Partial<ScatterMarker>;
        hoveron?: "points" | "fills";
        hoverinfo?: "text";
    }

    interface LineLayout extends Layout {
        title?: string;
    }
}

declare module "*.json";
declare module "plotly.js/dist/plotly" {
    const plotly: Plotly;

    export = plotly;
}

import { Component, DOM } from "react";
import { LineLayout, PlotlyStatic, ScatterData } from "plotly.js";

declare function require(name: string): string;

interface LineChartProps {
    mxObject?: mendix.lib.MxObject;
    data?: ScatterData[];
    layout?: Partial<LineLayout>;
}

class LineChart extends Component<LineChartProps, {}> {
    private lineChart: HTMLDivElement;
    private Plotly: PlotlyStatic;
    private data: ScatterData[] = [
        {
            connectgaps: true,
            mode: "lines+markers",
            name: "Default data points",
            type: "scatter",
            x: [ 14, 20, 30, 50 ],
            y: [ 14, 30, 20, 40 ]
        }
    ];

    constructor(props: LineChartProps) {
        super(props);

        this.Plotly = require("plotly.js/dist/plotly") as any;

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
    }

    render() {
        return DOM.div({ className: "widget-line-chart", ref: this.getPlotlyNodeRef });
    }

    componentDidMount() {
        this.renderChart(this.props.data, this.props.mxObject);
    }

    componentWillReceiveProps(newProps: LineChartProps) {
        this.renderChart(newProps.data, newProps.mxObject);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.lineChart = node;
    }

    private renderChart(data?: ScatterData[], mxObject?: mendix.lib.MxObject) {
        if (this.lineChart && mxObject) {
            this.Plotly.newPlot(this.lineChart, data && data.length ? data : this.data, this.props.layout);
        } else {
            this.Plotly.purge(this.lineChart);
        }
    }
}

export { LineChart };

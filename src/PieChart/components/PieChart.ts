import { CSSProperties, Component, createElement } from "react";

import * as classNames from "classnames";
import * as Plotly from "plotly.js/dist/plotly";

import { ChartType } from "./PieChartContainer";

interface PieChartProps {
    data?: Plotly.PieData[];
    config?: Partial<Plotly.Config>;
    layout?: Partial<Plotly.Layout>;
    type: ChartType;
    width: number;
    widthUnit: string;
    height: number;
    heightUnit: string;
    className?: string;
    style?: CSSProperties;
}

export class PieChart extends Component<PieChartProps, {}> {
    private pieChartNode: HTMLDivElement;
    private data: Plotly.PieData[] = [ {
        hole: this.props.type === "doughnut" ? .4 : 0,
        hoverinfo: "label+name",
        labels: [ "US", "China", "European Union", "Russian Federation", "Brazil", "India", "Rest of World" ],
        name: "GHG Emissions",
        type: "pie",
        values: [ 16, 15, 12, 6, 5, 4, 42 ]
    } ];

    constructor(props: PieChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames(`widget-${this.props.type}-chart`, this.props.className),
            ref: this.getPlotlyNodeRef,
            style: { ...this.getStyle(), ...this.props.style }
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.setUpEvents();
    }

    componentWillReceiveProps(newProps: PieChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.pieChartNode) {
            Plotly.purge(this.pieChartNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.pieChartNode = node;
    }

    private renderChart(props: PieChartProps) {
        const { data, config, layout } = props;

        if (this.pieChartNode) {
            if (data && data[0].values.length) {
                Plotly.newPlot(this.pieChartNode, data, layout, config);
            } else {
                Plotly.newPlot(this.pieChartNode, this.data, layout, config);
            }
        }
    }

    private setUpEvents() {
        // A workaround for attaching the resize event to the Iframe window because the plotly
        // library does not support it. This fix will be done in the web modeler preview class when the
        // plotly library starts supporting listening to Iframe events.
        const iFrame = document.getElementsByClassName("t-page-editor-iframe")[0] as HTMLIFrameElement;
        if (iFrame) {
            (iFrame.contentWindow || iFrame.contentDocument).addEventListener("resize", this.onResize);
        } else {
            window.addEventListener("resize", this.onResize);
        }
    }

    private getStyle(): CSSProperties {
        const style: { paddingBottom?: string; width: string, height?: string } = {
            width: this.props.widthUnit === "percentage" ? `${this.props.width}%` : `${this.props.width}`
        };
        if (this.props.heightUnit === "percentageOfWidth") {
            style.paddingBottom = `${this.props.height}%`;
        } else if (this.props.heightUnit === "pixels") {
            style.paddingBottom = `${this.props.height}px`;
        } else if (this.props.heightUnit === "percentageOfParent") {
            style.height = `${this.props.height}%`;
        }

        return style;
    }

    private onResize() {
        Plotly.Plots.resize(this.pieChartNode);
    }
}

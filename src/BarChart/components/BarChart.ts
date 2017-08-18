import { Component, createElement } from "react";
import * as classNames from "classnames";

import { HeightUnit, WidthUnit } from "./BarChartContainer";
import * as Plotly from "plotly.js/dist/plotly";

interface BarChartProps {
    config?: Partial<Plotly.Config>;
    className?: string;
    data?: Plotly.ScatterData[];
    height: number;
    heightUnit: HeightUnit;
    layout?: Partial<Plotly.Layout>;
    style?: object;
    width: number;
    widthUnit: WidthUnit;
}

export class BarChart extends Component<BarChartProps, {}> {
    private intervalID: number | null;
    private plotlyNode: HTMLDivElement;
    private svg: SVGElement;
    private data: Partial<Plotly.ScatterData>[] = [ // tslint:disable-line
        {
            type: "bar",
            x: [ "Sample 1", "Sample 2", "Sample 3", "Sample 4", "Sample 5", "Sample 6", "Sample 7" ],
            y: [ 20, 14, 23, 25, 50, 32, 44 ]
        }
    ];

    constructor(props: BarChartProps) {
        super(props);

        this.getPlotlyNodeRef = this.getPlotlyNodeRef.bind(this);
        this.onResize = this.onResize.bind(this);
    }

    render() {
        return createElement("div", {
            className: classNames("widget-plotly-bar", this.props.className),
            ref: this.getPlotlyNodeRef,
            style: {
                ...this.getStyle(), ...this.props.style
            }
        });
    }

    componentDidMount() {
        this.renderChart(this.props);
        this.setUpEvents();
        this.adjustStyle();
        this.fixChartRendering();
    }

    componentWillReceiveProps(newProps: BarChartProps) {
        this.renderChart(newProps);
    }

    componentWillUnmount() {
        if (this.plotlyNode) {
            Plotly.purge(this.plotlyNode);
        }
        window.removeEventListener("resize", this.onResize);
    }

    private getPlotlyNodeRef(node: HTMLDivElement) {
        this.plotlyNode = node;
    }

    private adjustStyle() {
        if (this.plotlyNode) {
            const wrapperElement = this.plotlyNode.parentElement;
            if (this.props.heightUnit === "percentageOfParent" && wrapperElement) {
                wrapperElement.style.height = "100%";
                wrapperElement.style.width = "100%";
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

    private renderChart(props: BarChartProps) {
        const { config, data, layout } = props;
        if (this.plotlyNode) {
            Plotly.newPlot(this.plotlyNode, data && data.length ? data : this.data, layout, config);
        }
    }

    private getStyle(): object {
        const style: { paddingBottom?: string; width: string, height?: string } = {
            width: this.props.widthUnit === "percentage" ? `${this.props.width}%` : `${this.props.width}`
        };
        if (this.props.heightUnit === "percentageOfWidth") {
            style.paddingBottom = `${this.props.height}%`;
        } else if (this.props.heightUnit === "pixels") {
            style.paddingBottom = `${this.props.height}`;
        } else if (this.props.heightUnit === "percentageOfParent") {
            style.height = `${this.props.height}%`;
        }

        return style;
    }

    private onResize() {
        Plotly.Plots.resize(this.plotlyNode);
    }

    private fixChartRendering() {
        this.intervalID = setInterval(() => {
            if (this.svg && this.svg.parentElement && this.svg.parentElement.offsetHeight !== 0 && this.intervalID) {
                Plotly.Plots.resize(this.plotlyNode);
                clearInterval(this.intervalID);
                this.intervalID = null;
            }
        }, 100);
    }
}

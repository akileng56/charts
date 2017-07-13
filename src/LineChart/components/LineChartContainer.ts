import { Component, createElement } from "react";

import { Datum, ScatterData } from "plotly.js";
import { LineChart } from "./LineChart";
import { Mode, ModelProps, traceConfig } from "../LineChart";

interface LineChartContainerProps extends ModelProps {
    class?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

interface LineChartContainerState {
    data?: ScatterData[];
}

class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandles: number[] = [];
    private data: ScatterData[] = [];

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = { data: [] };
        this.fetchData = this.fetchData.bind(this);
        this.handleSubscription = this.handleSubscription.bind(this);
    }

    render() {
        return createElement(LineChart, {
            data: this.state.data,
            layout: {
                height: this.props.height,
                showlegend: this.props.showLegend,
                title: this.props.title,
                width: this.props.width,
                xaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.xAxisLabel
                },
                yaxis: {
                    showgrid: this.props.showGrid,
                    title: this.props.yAxisLabel
                }
            },
            mxObject: this.props.mxObject
        });
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
        this.subscriptionHandles = [];

        if (mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: this.handleSubscription,
                guid: mxObject.getGuid()
            }));
        }
    }

    private handleSubscription() {
        this.fetchData(this.props.mxObject);
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (mxObject) {
            const { traceConfigs } = this.props;
            traceConfigs.forEach((object, index) => {
                if (object.sourceType === "xpath") {
                    const constraint = object.entityConstraint
                        ? object.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                        : "";
                    const XPath = "//" + object.entity + constraint;
                    this.fetchByXPath(object, XPath, traceConfigs.length, index);
                } else if (object.sourceType === "microflow" && object.dataSourceMicroflow) {
                    this.fetchByMicroflow(mxObject.getGuid(), object, traceConfigs.length, index);
                }
            });
        }
    }

    private fetchByXPath(object: traceConfig, xpath: string, count: number, index: number) {
        window.mx.data.get({
            callback: tracesData => {
                const lineData = this.processData(tracesData, object);
                this.addTraces(lineData, count === index + 1);
            },
            error: () => this.setState({
                data: this.data
            }),
            filter: {
                attributes: [ object.xAttribute, object.yAttribute ],
                sort: [ [ object.xAttribute, "asc" ] ]
            },
            xpath
        });
    }

    private fetchByMicroflow(guid: string, object: traceConfig, count: number, index: number) {
        mx.ui.action(object.dataSourceMicroflow, {
            callback: tracesData => {
                const lineData = this.processData(tracesData as mendix.lib.MxObject[], object);
                this.addTraces(lineData, count === index + 1);
            },
            error: () => this.setState({
                data: this.data
            }),
            params: {
                applyto: "selection",
                guids: [ guid ]
            }
        });
    }

    private processData(tracesData: mendix.lib.MxObject[], object: traceConfig): ScatterData {
        const fetchedData = tracesData.map(value => {
            return {
                x: parseInt(value.get(object.xAttribute) as string, 10) as Datum,
                y: parseInt(value.get(object.yAttribute) as string, 10) as Datum
            };
        });

        const lineData: ScatterData = {
            connectgaps: true,
            mode: object.mode.replace("o", "+") as Mode,
            name: object.traceName,
            type: "scatter",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        };

        return lineData;
    }

    private addTraces(trace: ScatterData, isFinal = false) {
        this.data.push(trace);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

export { LineChartContainer as default, LineChartContainerProps };

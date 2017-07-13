import { Component, createElement } from "react";

import { Datum, ScatterData } from "plotly.js";
import { LineChart } from "./LineChart";
import { Mode, ModelProps, serieConfig } from "../LineChart";

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
                showlegend: true,
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
            const { seriesConfig } = this.props;
            seriesConfig.forEach((serieObject, index) => {
                if (serieObject.sourceType === "xpath") {
                    const constraint = serieObject.entityConstraint
                        ? serieObject.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                        : "";
                    const XPath = "//" + serieObject.entity + constraint;
                    this.fetchByXPath(serieObject, XPath, seriesConfig.length, index);
                } else if (serieObject.sourceType === "microflow" && serieObject.dataSourceMicroflow) {
                    this.fetchByMicroflow(mxObject.getGuid(), serieObject, seriesConfig.length, index);
                }
            });
        }
    }

    private fetchByXPath(seriesObject: serieConfig, xpath: string, count: number, index: number) {
        window.mx.data.get({
            callback: mxObjects => {
                const lineData = this.processData(mxObjects, seriesObject);
                this.addData(lineData, count === index + 1);
            },
            error: () => this.setState({
                data: this.data
            }),
            filter: {
                attributes: [ seriesObject.xAttribute, seriesObject.yAttribute ],
                sort: [ [ seriesObject.xAttribute, "asc" ] ]
            },
            xpath
        });
    }

    private fetchByMicroflow(guid: string, seriesObject: serieConfig, count: number, index: number) {
        mx.ui.action(seriesObject.dataSourceMicroflow, {
            callback: mxObjects => {
                const lineData = this.processData(mxObjects as mendix.lib.MxObject[], seriesObject);
                this.addData(lineData, count === index + 1);
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

    private processData(seriesData: mendix.lib.MxObject[], seriesObject: serieConfig): ScatterData {
        const fetchedData = seriesData.map(value => {
            return {
                x: parseInt(value.get(seriesObject.xAttribute) as string, 10) as Datum,
                y: parseInt(value.get(seriesObject.yAttribute) as string, 10) as Datum
            };
        });

        const lineData: ScatterData = {
            connectgaps: true,
            line: {
                color: seriesObject.lineColor
            },
            mode: seriesObject.mode.replace("o", "+") as Mode,
            name: seriesObject.name,
            type: "scatter",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        };

        return lineData;
    }

    private addData(seriesData: ScatterData, isFinal = false) {
        this.data.push(seriesData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

export { LineChartContainer as default, LineChartContainerProps };

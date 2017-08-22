import { Component, createElement } from "react";

import { Datum } from "plotly.js";
import { Alert } from "./../../components/Alert";
import { LineChart } from "./LineChart";
import { LineData, Mode, ModelProps, Series } from "../LineChart";

interface DataProps {
    serieObject: Series;
    seriesCount: number;
    index: number;
    guid?: string;
    lineColor?: string;
    seriesName?: string;
}

interface WrapperProps {
    class?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

export type LineChartContainerProps = ModelProps & WrapperProps;

interface LineChartContainerState {
    alertMessage?: string;
    data?: LineData[];
}

export default class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandle: number;
    private data: LineData[] = [];

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: LineChartContainer.validateProps(this.props),
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
        if (this.props.mxObject) {
            if (this.state.alertMessage) {
                return createElement(Alert, { className: "widget-line-chart-alert", message: this.state.alertMessage });
            }
            return createElement(LineChart, {
                className: this.props.class,
                config: {
                    displayModeBar: this.props.showToolBar
                },
                data: this.state.data,
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    showlegend: this.props.showLegend,
                    xaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.xAxisLabel
                    },
                    yaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.yAxisLabel
                    }
                },
                style: LineChartContainer.parseStyle(this.props.style),
                width: this.props.width,
                widthUnit: this.props.widthUnit
            });
        }

        return null;
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }
    }

    public static parseStyle(style = ""): {[key: string]: string} {
        try {
            return style.split(";").reduce<{[key: string]: string}>((styleObject, line) => {
                const pair = line.split(":");
                if (pair.length === 2) {
                    const name = pair[0].trim().replace(/(-.)/g, match => match[1].toUpperCase());
                    styleObject[name] = pair[1].trim();
                }
                return styleObject;
            }, {});
        } catch (error) {
            // tslint:disable-next-line no-console
            console.log("Failed to parse style", style, error);
        }

        return {};
    }

    public static validateProps(props: LineChartContainerProps): string {
        let errorMessage = "";
        const incorrectObjectingNames = props.seriesConfig
            .filter(object => object.sourceType === "microflow" && !object.dataSourceMicroflow)
            .map((_inorrect, index) => index + 1)
            .join(", ");

        if (incorrectObjectingNames) {
            errorMessage += `Series item ${incorrectObjectingNames}` +
                ` - 'Data source' type is set to 'Microflow' but 'Microflow' is missing \n`;
        }

        return errorMessage && `Configuration error :\n\n ${errorMessage}`;
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        if (this.subscriptionHandle) {
            window.mx.data.unsubscribe(this.subscriptionHandle);
        }

        if (mxObject) {
            this.subscriptionHandle = window.mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            });
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        this.data = [];
        const { seriesConfig } = this.props;
        seriesConfig.forEach((serieObject, index) => {
            const data: DataProps = {
                guid: mxObject.getGuid(),
                index,
                serieObject,
                seriesCount: seriesConfig.length
            };
            if (serieObject.sourceType === "xpath") {
                this.fetchByXPath(data);
            } else if (serieObject.sourceType === "microflow" && serieObject.dataSourceMicroflow) {
                this.fetchByMicroflow(data);
            }
        });
    }

    private fetchByXPath(data: DataProps) {
        const constraint = data.serieObject.entityConstraint
            ? data.serieObject.entityConstraint.replace("[%CurrentObject%]", data.guid)
            : "";
        const xpath = "//" + data.serieObject.seriesEntity + constraint;
        window.mx.data.get({
            callback: mxObjects => {
                if (data.serieObject.dataEntity && data.serieObject.dataEntity.indexOf("/") > -1) {
                    this.fetchDataFromSeries(mxObjects, data);
                } else {
                    if (mxObjects.length) {
                        data.seriesName = mxObjects[0].get(data.serieObject.seriesNameAttribute) as string;
                        data.lineColor = mxObjects[0].get(data.serieObject.lineColorAttribute) as string;
                    }
                    this.processData(mxObjects, data);
                }
            },
            error: error => {
                mx.ui.error(`An error occurred while retrieving data via XPath (${xpath}): ${error}`);
                this.setState({ data: [] });
            },
            xpath
        });
    }

    private fetchByMicroflow(data: DataProps) {
        const actionname = data.serieObject.dataSourceMicroflow;
        mx.ui.action(actionname, {
            callback: mxObjects => {
                if (data.serieObject.dataEntity && data.serieObject.dataEntity.indexOf("/") > -1) {
                    this.fetchDataFromSeries(mxObjects as mendix.lib.MxObject[], data);
                } else {
                    const resultObjects = mxObjects as mendix.lib.MxObject[];
                    if (resultObjects.length) {
                        data.seriesName = resultObjects[0].get(data.serieObject.seriesNameAttribute) as string;
                        data.lineColor = resultObjects[0].get(data.serieObject.lineColorAttribute) as string;
                    }
                    this.processData(mxObjects as mendix.lib.MxObject[], data);
                }
            },
            error: error => {
                mx.ui.error(`Error while retrieving microflow data ${actionname}: ${error.message}`);
                this.setState({ data: [] });
            },
            params: {
                applyto: "selection",
                guids: [ data.guid ]
            }
        });
    }

    private fetchDataFromSeries(series: mendix.lib.MxObject[], data: DataProps) {
        const seriesCount = series.length;
        series.forEach((object, index) => {
            const seriesData = {
                index,
                lineColor: object.get(data.serieObject.lineColorAttribute) as string,
                serieObject: data.serieObject,
                seriesCount,
                seriesName: object.get(data.serieObject.seriesNameAttribute) as string
            };
            data.index = index;
            data.seriesCount = seriesCount;
            object.fetch(data.serieObject.dataEntity, (values: mendix.lib.MxObject[]) => {
                window.mx.data.get({
                    callback: mxObjects => this.processData(mxObjects, seriesData),
                    error: error => {
                        mx.ui.error(`An error occurred while retrieving data values: ${error}`);
                        this.setState({ data: [] });
                    },
                    filter: {
                        attributes: [ data.serieObject.xValueAttribute, data.serieObject.yValueAttribute ],
                        sort: [ [ data.serieObject.xValueAttribute, "asc" ] ]
                    },
                    guids: values.map(value => value.getGuid())
                });
            });
        });
    }

    private processData(mxObjects: mendix.lib.MxObject[], data?: DataProps) {
        const fetchedData = mxObjects.map(value => {
            return {
                x: value.get(data.serieObject.xValueAttribute) as Datum,
                y: parseInt(value.get(data.serieObject.yValueAttribute) as string, 10) as Datum
            };
        });

        const lineData: LineData = {
            connectgaps: true,
            line: {
                color: data.lineColor
            },
            mode: data.serieObject.mode.replace("o", "+") as Mode,
            name: data.seriesName,
            type: "scatter",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        };

        this.addData(lineData, data.seriesCount === data.index + 1);
    }

    private addData(seriesData: LineData, isFinal = false) {
        this.data.push(seriesData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

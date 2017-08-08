import { Component, createElement } from "react";

import { Datum, ScatterData } from "plotly.js";
import { LineChart } from "./LineChart";
import { Mode, ModelProps } from "../LineChart";
import { Alert } from "./Alert";

interface LineChartContainerProps extends ModelProps {
    class?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

interface LineChartContainerState {
    alertMessage?: string;
    data?: ScatterData[];
}

interface DataProps {
    seriesName: string;
    lineColor: string;
    index: number;
    count: number;
    guid?: string;
}

class LineChartContainer extends Component<LineChartContainerProps, LineChartContainerState> {
    private subscriptionHandles: number[] = [];
    private data: ScatterData[] = [];

    constructor(props: LineChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: LineChartContainer.validateProps(this.props),
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
        this.handleSubscription = this.handleSubscription.bind(this);
    }

    render() {
        if (this.props.mxObject) {
            if (this.state.alertMessage) {
                return createElement(Alert, { message: this.state.alertMessage });
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
        } else {
            return createElement("div", {});
        }
    }

    componentWillReceiveProps(newProps: LineChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandles) {
            this.subscriptionHandles.forEach(mx.data.unsubscribe);
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
        if (props.sourceType === "microflow" && !props.dataSourceMicroflow) {
            errorMessage += ` data source type is set to 'Microflow' but 'Source microflow' is missing \n`;
        }

        return errorMessage && `Configuration error :\n\n ${errorMessage}`;
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
        const { seriesEntity } = this.props;
        if (mxObject && this.props.seriesEntity) {
            if (this.props.sourceType === "xpath") {
                const constraint = this.props.entityConstraint
                    ? this.props.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                    : "";
                const entityName = seriesEntity.indexOf("/") > -1
                    ? seriesEntity.split("/")[seriesEntity.split("/").length - 1]
                    : seriesEntity;
                const XPath = "//" + entityName + constraint;
                this.fetchByXPath(XPath);
            } else if (this.props.sourceType === "microflow" && this.props.dataSourceMicroflow) {
                this.fetchByMicroflow(mxObject.getGuid());
            }

        }
    }

    private fetchByXPath(xpath: string) {
        window.mx.data.get({
            callback: mxObjects => this.fetchDataFromSeries(mxObjects),
            error: error => this.setState({
                alertMessage: `An error occurred while retrieving data via XPath (${xpath}): ${error}`,
                data: []
            }),
            xpath
        });
    }

    private fetchByMicroflow(guid: string) {
        const actionname = this.props.dataSourceMicroflow;
        mx.ui.action(actionname, {
            callback: mxObjects => {
                const series = mxObjects as mendix.lib.MxObject[];
                this.fetchDataFromSeries(series);
            },
            error: error => this.setState({
                alertMessage: `Error while retrieving microflow data ${actionname}: ${error.message}`,
                data: []
            }),
            params: {
                applyto: "selection",
                guids: [ guid ]
            }
        });
    }

    private fetchDataFromSeries(series: mendix.lib.MxObject[]) {
        const seriesCount = series.length;
        series.forEach((object, index) => {
            const data: DataProps = {
                count: seriesCount,
                guid: this.props.mxObject ? this.props.mxObject.getGuid() : "",
                index,
                lineColor: object.get(this.props.lineColor) as string,
                seriesName: object.get(this.props.seriesNameAttribute) as string
            };
            object.fetch(this.props.dataEntity, (values: mendix.lib.MxObject[]) => {
                window.mx.data.get({
                    callback: mxObjects => {
                        const fetchedData = mxObjects.map(value => {
                            return {
                                x: value.get(this.props.xValueAttribute) as Datum,
                                y: parseInt(value.get(this.props.yValueAttribute) as string, 10) as Datum
                            };
                        });

                        const lineData: ScatterData = {
                            connectgaps: true,
                            line: {
                                color: data.lineColor
                            },
                            mode: this.props.mode.replace("o", "+") as Mode,
                            name: data.seriesName,
                            type: "scatter",
                            x: fetchedData.map(value => value.x),
                            y: fetchedData.map(value => value.y)
                        };

                        this.addData(lineData, seriesCount === index + 1);
                    },
                    error: error => this.setState({
                        alertMessage: `An error occurred while retrieving data values: ${error}`,
                        data: []
                    }),
                    filter: {
                        attributes: [ this.props.xValueAttribute, this.props.yValueAttribute ],
                        sort: [ [ this.props.xAxisSortAttribute, "asc" ] ]
                    },
                    guids: values.map(value => value.getGuid())
                });
            });
        });
    }

    private addData(seriesData: ScatterData, isFinal = false) {
        this.data.push(seriesData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

export { LineChartContainer as default, LineChartContainerProps };

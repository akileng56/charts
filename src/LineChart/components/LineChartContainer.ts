import { Component, createElement } from "react";

import { Datum } from "plotly.js";
import { Alert } from "./../../components/Alert";
import { LineChart } from "./LineChart";
import { LineData, Mode, ModelProps } from "../LineChart";

interface DataProps {
    type?: "static" | "dynamic";
    seriesCount?: number;
    index?: number;
    guid?: string;
    lineColor?: string;
    seriesName?: string;
    xValue?: string;
    yValue?: string;
    xSortValue?: string;
    xpath?: string;
    actionname?: string;
    mode?: string;
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
                    hovermode: "closest",
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
                toolTipForm: this.props.toolTipForm,
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
            .filter(Serieobject => Serieobject.dataSourceType === "microflow" && !Serieobject.dataSourceMicroflow)
            .map(Serieobject => Serieobject.name)
            .join(", ");

        if (incorrectObjectingNames) {
            errorMessage += `Static series ${incorrectObjectingNames}` +
                " - 'Data source' is set to 'Microflow' but 'Microflow' is missing \n";
        }
        if (props.dataSourceType === "microflow" && !props.dataSourceMicroflow) {
            errorMessage += "\n - Dynamic series 'Data source' is set to 'Microflow' but 'Microflow' is missing";
        }

        return errorMessage && `Configuration error in line chart:\n\n ${errorMessage}`;
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
                lineColor: serieObject.lineColor,
                mode: serieObject.mode,
                seriesCount: seriesConfig.length,
                seriesName: serieObject.name,
                type: "static",
                xSortValue: serieObject.xValueSortAttribute,
                xValue: serieObject.xValueAttribute,
                yValue: serieObject.yValueAttribute
            };
            if (serieObject.dataSourceType === "XPath") {
                const constraint = serieObject.entityConstraint
                    ? serieObject.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                    : "";
                data.xpath = "//" + serieObject.dataEntity + constraint;
                this.fetchByXPath(data);
            } else if (serieObject.dataSourceType === "microflow" && serieObject.dataSourceMicroflow) {
                data.actionname = serieObject.dataSourceMicroflow;
                this.fetchByMicroflow(data);
            }
        });
        if (this.props.dataSourceType === "XPath") {
            const constraint = this.props.entityConstraint
                ? this.props.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                : "";
            const xpath = "//" + this.props.seriesEntity + constraint;

            this.fetchByXPath({ type: "dynamic", xpath });
        } else if (this.props.dataSourceType === "microflow" && this.props.dataSourceMicroflow) {
            const { dataSourceMicroflow } = this.props;
            this.fetchByMicroflow({ actionname: dataSourceMicroflow, guid: mxObject.getGuid(), type: "dynamic" });
        }
    }

    private fetchByXPath(data: DataProps) {
        window.mx.data.get({
            callback: mxObjects => data.type === "dynamic"
                ? this.fetchDataFromSeries(mxObjects)
                : this.processData(mxObjects, data),
            error: error => {
                mx.ui.error(`An error occurred while retrieving data via XPath (${data.xpath}): ${error}`);
                this.setState({ data: [] });
            },
            xpath: data.xpath
        });
    }

    private fetchByMicroflow(data: DataProps) {
        mx.ui.action(data.actionname, {
            callback: mxObjects => data.type === "dynamic"
                ? this.fetchDataFromSeries(mxObjects as mendix.lib.MxObject[])
                : this.processData(mxObjects as mendix.lib.MxObject[], data),
            error: error => {
                mx.ui.error(`Error while retrieving microflow data ${data.actionname}: ${error.message}`);
                this.setState({ data: [] });
            },
            params: {
                applyto: "selection",
                guids: [ data.guid ]
            }
        });
    }

    private fetchDataFromSeries(series: mendix.lib.MxObject[]) {
        series.forEach((object, index) => {
            const seriesData: DataProps = {
                index,
                lineColor: object.get(this.props.lineColorAttribute) as string,
                mode: this.props.mode,
                seriesCount: series.length,
                seriesName: object.get(this.props.seriesNameAttribute) as string,
                type: "dynamic",
                xSortValue: this.props.xAxisSortAttribute,
                xValue: this.props.xValueAttribute,
                yValue: this.props.yValueAttribute
            };
            object.fetch(this.props.dataEntity, (values: mendix.lib.MxObject[]) => {
                window.mx.data.get({
                    callback: mxObjects => this.processData(mxObjects, seriesData),
                    error: error => {
                        mx.ui.error(`An error occurred while retrieving data values: ${error}`);
                        this.setState({ data: [] });
                    },
                    filter: {
                        attributes: [ this.props.xValueAttribute, this.props.yValueAttribute ],
                        sort: [ [ this.props.xAxisSortAttribute, "asc" ] ]
                    },
                    guids: values.map(value => value.getGuid())
                });
            });
        });
    }

    private processData(mxObjects: mendix.lib.MxObject[], data?: DataProps) {
        const fetchedData = mxObjects.map(value => {
            return {
                x: value.get(data.xValue) as Datum,
                y: parseInt(value.get(data.yValue) as string, 10) as Datum
            };
        });

        const lineData: LineData = {
            connectgaps: true,
            hoveron: "points",
            line: {
                color: data.lineColor
            },
            mode: data.mode.replace("o", "+") as Mode,
            name: data.seriesName,
            type: "scatter",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        };

        if (this.props.toolTipForm) {
            lineData.hoverinfo = "text";
        }

        this.addData(lineData, data.seriesCount === data.index + 1);
    }

    private addData(seriesData: LineData, isFinal = false) {
        this.data.push(seriesData);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

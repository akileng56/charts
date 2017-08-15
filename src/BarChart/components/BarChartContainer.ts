import { Component, createElement } from "react";

import { BarChart } from "./BarChart";
import { Alert } from "../../components/Alert";
import { BarMode, Datum, ScatterData } from "plotly.js";

export interface WrapperProps {
    class?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

export interface BarChartContainerProps extends WrapperProps {
    barMode: BarMode;
    dataSourceMicroflow: string;
    dataSourceType: "xpath" | "microflow";
    entityConstraint: string;
    responsive: boolean;
    title?: string;
    seriesEntity: string;
    seriesNameAttribute: string;
    showGrid: boolean;
    showToolbar: boolean;
    dataEntity: string;
    width: number;
    widthUnit: WidthUnit;
    height: number;
    heightUnit: HeightUnit;
    xAxisLabel: string;
    xValueAttribute: string;
    yAxisLabel: string;
    yValueAttribute: string;
    xAxisSortAttribute: string;
}

interface BarChartContainerState {
    alertMessage?: string;
    data?: ScatterData[];
}

type WidthUnit = "percentage" | "pixels";
type HeightUnit = "percentageOfWidth" | "percentageOfParent" | "pixels";

export default class BarChartContainer extends Component<BarChartContainerProps, BarChartContainerState> {
    private subscriptionHandles: number[] = [];
    private data: ScatterData[] = [];

    constructor(props: BarChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: BarChartContainer.validateProps(this.props),
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
        if (this.props.mxObject) {
            if (this.state.alertMessage) {
                return createElement(Alert, { className: "widget-bar-chart-alert", message: this.state.alertMessage });
            }
            return createElement(BarChart, {
                className: this.props.class,
                config: {
                    displayModeBar: this.props.showToolbar
                },
                data: this.state.data,
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    barmode: this.props.barMode,
                    xaxis: { title: this.props.xAxisLabel },
                    yaxis: {
                        showgrid: this.props.showGrid,
                        title: this.props.yAxisLabel
                    }
                },
                style: BarChartContainer.parseStyle(this.props.style),
                width: this.props.width,
                widthUnit: this.props.widthUnit
            });
        }

        return null;
    }

    componentWillReceiveProps(newProps: BarChartContainerProps) {
        this.resetSubscriptions(newProps.mxObject);
        this.fetchData(newProps.mxObject);
    }

    componentWillUnmount() {
        if (this.subscriptionHandles) {
            this.subscriptionHandles.forEach(mx.data.unsubscribe);
        }
    }

    public static parseStyle(style = ""): { [key: string]: string } {
        try {
            return style.split(";").reduce<{ [key: string]: string }>((styleObject, line) => {
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

    public static validateProps(props: BarChartContainerProps): string {
        let errorMessage = "";
        if (props.dataSourceType === "microflow" && !props.dataSourceMicroflow) {
            errorMessage += ` data source type is set to 'Microflow' but 'Source microflow' is missing \n`;
        }

        return errorMessage && `Configuration error :\n\n ${errorMessage}`;
    }

    private resetSubscriptions(mxObject?: mendix.lib.MxObject) {
        this.subscriptionHandles.forEach(mx.data.unsubscribe);
        this.subscriptionHandles = [];

        if (mxObject) {
            this.subscriptionHandles.push(mx.data.subscribe({
                callback: () => this.fetchData(mxObject),
                guid: mxObject.getGuid()
            }));
        }
    }

    private fetchData(mxObject?: mendix.lib.MxObject) {
        if (mxObject && this.props.seriesEntity) {
            if (this.props.dataSourceType === "xpath") {
                this.fetchByXpath(mxObject);
            } else if (this.props.dataSourceType === "microflow" && this.props.dataSourceMicroflow) {
                this.fetchByMicroflow(mxObject.getGuid());
            }
        }
    }

    private fetchByXpath(mxObject: mendix.lib.MxObject) {
        mxObject.fetch(this.props.seriesEntity, (series: mendix.lib.MxObject[]) => {
            const seriesCount = series.length;
            series.forEach((object, index) => {
                const seriesName = object.get(this.props.seriesNameAttribute) as string;
                object.fetch(this.props.dataEntity, (values: mendix.lib.MxObject[]) => {
                    const { seriesEntity } = this.props;
                    const constraint = this.props.entityConstraint
                        ? this.props.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
                        : "";
                    const entityName = seriesEntity.indexOf("/") > -1
                        ? seriesEntity.split("/")[seriesEntity.split("/").length - 1]
                        : seriesEntity;
                    const xpath = "//" + entityName + constraint;
                    window.mx.data.get({
                        callback: seriesData => this.mapData(
                            seriesData as mendix.lib.MxObject[], seriesName, seriesCount, index
                        ),
                        error: error => window.mx.ui.error(
                            `An error occurred while retrieving data via XPath (${xpath}): ${error}`
                        ),
                        filter: {
                            sort: [ [ this.props.xAxisSortAttribute, "asc" ] ]
                        },
                        guids: values.map(value => value.getGuid())
                    });
                });
            });
        });
    }

    private fetchByMicroflow(guid: string) {
        const actionname = this.props.dataSourceMicroflow;
        mx.ui.action(actionname, {
            callback: mxObjects => this.fetchDataFromSeries(mxObjects as mendix.lib.MxObject[]),
            error: error => window.mx.ui.error(`Error while retrieving microflow data ${actionname}: ${error.message}`),
            params: {
                applyto: "selection",
                guids: [ guid ]
            }
        });
    }

    private fetchDataFromSeries(series: mendix.lib.MxObject[]) {
        const seriesCount = series.length;
        series.forEach((object, index) => {
            const seriesName = object.get(this.props.seriesNameAttribute) as string;
            object.fetch(this.props.dataEntity, (values: mendix.lib.MxObject[]) => {
                window.mx.data.get({
                    callback: seriesData => this.mapData(
                        seriesData as mendix.lib.MxObject[], seriesName, seriesCount, index),
                    error: error => window.mx.ui.error(`An error occurred while retrieving data values: ${error}`
                ),
                    filter: {
                        sort: [ [ this.props.xAxisSortAttribute, "asc" ] ]
                    },
                    guids: values.map(value => value.getGuid())
                });
            });
        });
    }

    private mapData(seriesData: mendix.lib.MxObject[], seriesName: string, seriesCount: number, index: number) {
        const fetchedData = seriesData.map(value => {
            return {
                x: value.get(this.props.xValueAttribute) as Datum,
                y: parseInt(value.get(this.props.yValueAttribute) as string, 10) as Datum
            };
        });

        const barData: Partial<ScatterData> = {
            name: seriesName,
            type: "bar",
            x: fetchedData.map(value => value.x),
            y: fetchedData.map(value => value.y)
        };

        this.addSeries(barData as ScatterData, seriesCount === index + 1);

    }

    private addSeries(series: ScatterData, isFinal = false) {
        this.data.push(series);
        if (isFinal) {
            this.setState({ data: this.data });
        }
    }
}

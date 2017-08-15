import { Component, createElement } from "react";

import { Alert } from "../../components/Alert";
import { PieChart } from "./PieChart";

export type ChartType = "pie" | "donut";

interface WrapperProps {
    class?: string;
    mxform: mxui.lib.form._FormBase;
    mxObject?: mendix.lib.MxObject;
    style?: string;
    readOnly: boolean;
}

interface PieChartContainerProps extends WrapperProps {
    dataEntity: string;
    dataSourceType: "xpath" | "microflow";
    entityConstraint: string;
    dataSourceMicroflow: string;
    nameAttribute: string;
    valueAttribute: string;
    sortAttribute: string;
    chartType: ChartType;
    color: string;
    showToolBar: boolean;
    showLegend: boolean;
    responsive: boolean;
    widthUnit: "percentage" | "pixels";
    width: number;
    heightUnit: "percentageOfWidth" | "pixels" | "percentageOfParent";
    height: number;
}

interface PieChartContainerState {
    alertMessage?: string;
    labels?: string[];
    values?: number[];
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    private subscriptionHandles: number[] = [];
    private data: number[] = [];
    private labels: string[] = [];

    constructor(props: PieChartContainerProps) {
        super(props);

        this.state = {
            alertMessage: PieChartContainer.validateProps(this.props),
            labels: [],
            values: []
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
        if (this.props.mxObject) {
            if (this.state.alertMessage) {
                return createElement(Alert, {
                    className: `widget-${this.props.chartType}-chart-alert`,
                    message: this.state.alertMessage
                });
            }
            return createElement(PieChart, {
                className: this.props.class,
                config: {
                    displayModeBar: this.props.showToolBar
                },
                data: [ {
                    hole: this.props.chartType === "donut" ? .4 : 0,
                    hoverinfo: "label",
                    labels: this.state.labels,
                    type: "pie",
                    values: this.state.values
                } ],
                height: this.props.height,
                heightUnit: this.props.heightUnit,
                layout: {
                    autosize: this.props.responsive,
                    showlegend: this.props.showLegend
                },
                style: PieChartContainer.parseStyle(this.props.style),
                type: this.props.chartType,
                width: this.props.width,
                widthUnit: this.props.widthUnit
            });
        }

        return null;
    }

    componentWillReceiveProps(newProps: PieChartContainerProps) {
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

    public static validateProps(props: PieChartContainerProps): string {
        let errorMessage = "";
        if (props.dataSourceType === "microflow" && !props.dataSourceMicroflow) {
            errorMessage += ` 'Data source' is set to 'Microflow' but 'Microflow' is missing \n`;
        }

        return errorMessage && `Configuration error in ${props.chartType}chart:\n\n ${errorMessage}`;
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
        if (mxObject && this.props.dataEntity) {
            if (this.props.dataSourceType === "xpath") {
                this.fetchByXPath(mxObject);
            } else if (this.props.dataSourceType === "microflow" && this.props.dataSourceMicroflow) {
                this.fetchByMicroflow(mxObject.getGuid());
            }
        }
    }

    private fetchByXPath(mxObject: mendix.lib.MxObject) {
        const constraint = this.props.entityConstraint
            ? this.props.entityConstraint.replace("[%CurrentObject%]", mxObject.getGuid())
            : "";
        const xpath = "//" + this.props.dataEntity + constraint;
        window.mx.data.get({
            callback: mxObjects => this.processData(mxObjects),
            error: error => {
                mx.ui.error(`An error occurred while retrieving data via XPath (${xpath}): ${error}`);
                this.setState({ values: [], labels: [] });
            },
            filter: {
                sort: [ [ this.props.sortAttribute, "asc" ] ]
            },
            xpath
        });
    }

    private fetchByMicroflow(guid: string) {
        const actionname = this.props.dataSourceMicroflow;
        mx.ui.action(actionname, {
            callback: mxObjects => this.processData(mxObjects as mendix.lib.MxObject[]),
            error: error => {
                mx.ui.error(`Error while retrieving microflow data ${actionname}: ${error.message}`);
                this.setState({ values: [], labels: [] });
            },
            params: {
                applyto: "selection",
                guids: [ guid ]
            }
        });
    }

    private processData(mxObjects: mendix.lib.MxObject[]) {
        this.data = [];
        this.labels = [];
        mxObjects.map(value => {
            this.data.push(parseFloat(value.get(this.props.valueAttribute) as string));
            this.labels.push(value.get(this.props.nameAttribute) as string);
        });
        this.setState({
            labels: this.labels,
            values: this.data
        });
    }
}

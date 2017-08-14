import { Component, createElement } from "react";

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
    data?: number[];
    labels?: string[];
}

export default class PieChartContainer extends Component<PieChartContainerProps, PieChartContainerState> {
    private subscriptionHandles: number[] = [];
    private data: number[] = [];
    private labels: string[] = [];

    constructor(props: PieChartContainerProps) {
        super(props);

        this.state = {
            data: []
        };
        this.fetchData = this.fetchData.bind(this);
    }

    render() {
        if (this.props.mxObject) {
            return createElement(PieChart, {
                data: [ {
                    hole: this.props.chartType === "donut" ? .4 : 0,
                    hoverinfo: "label",
                    labels: this.state.labels,
                    type: "pie",
                    values: this.state.data
                } ],
                type: this.props.chartType
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
                // this.fetchByMicroflow(mxObject.getGuid());
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
                this.setState({ data: [], labels: [] });
            },
            filter: {
                sort: [ [ this.props.sortAttribute, "asc" ] ]
            },
            xpath
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
            data: this.data,
            labels: this.labels
        });
    }
}

import { DOM, StatelessComponent } from "react";

export const Alert: StatelessComponent<{ message?: string }> = (props) =>
    props.message
        ? DOM.div({ className: "alert alert-danger widget-line-chart-alert" }, props.message)
        : null;

Alert.displayName = "Alert";

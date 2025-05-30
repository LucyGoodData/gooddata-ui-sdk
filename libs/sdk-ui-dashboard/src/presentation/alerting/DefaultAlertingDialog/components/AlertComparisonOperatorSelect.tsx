// (C) 2024-2025 GoodData Corporation
import {
    IAlertComparisonOperator,
    IAlertRelativeArithmeticOperator,
    IAlertRelativeOperator,
} from "@gooddata/sdk-model";
import { Button, Dropdown, List, OverlayPositionType, SingleSelectListItem } from "@gooddata/sdk-ui-kit";
import cx from "classnames";
import React, { useRef } from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { AlertMetric } from "../../types.js";

import { DROPDOWN_ITEM_HEIGHT, DROPDOWN_SEPARATOR_ITEM_HEIGHT, OPERATORS } from "../constants.js";
import { useOperators } from "../hooks/useOperators.js";

export interface IAlertComparisonOperatorSelectProps {
    measure: AlertMetric | undefined;
    selectedComparisonOperator: IAlertComparisonOperator | undefined;
    selectedRelativeOperator: [IAlertRelativeOperator, IAlertRelativeArithmeticOperator] | undefined;
    onComparisonOperatorChange: (metric: AlertMetric, comparisonOperator: IAlertComparisonOperator) => void;
    onRelativeOperatorChange: (
        metric: AlertMetric,
        relativeOperator: IAlertRelativeOperator,
        relativeArithmeticOperator: IAlertRelativeArithmeticOperator,
    ) => void;
    overlayPositionType?: OverlayPositionType;
    id: string;
    closeOnParentScroll?: boolean;
}

export const AlertComparisonOperatorSelect = (props: IAlertComparisonOperatorSelectProps) => {
    const {
        measure,
        selectedComparisonOperator,
        onComparisonOperatorChange,
        selectedRelativeOperator,
        onRelativeOperatorChange,
        overlayPositionType,
        id,
        closeOnParentScroll,
    } = props;
    const selectedComparisonItem = selectedComparisonOperator
        ? OPERATORS.find((option) => option.id === selectedComparisonOperator)!
        : undefined;
    const selectedRelativeItem = selectedRelativeOperator
        ? OPERATORS.find(
              (option) => option.id === `${selectedRelativeOperator[1]}.${selectedRelativeOperator[0]}`,
          )!
        : undefined;

    const intl = useIntl();
    const ref = useRef<HTMLElement | null>(null);

    const operators = useOperators(props.measure);

    if (!measure) {
        return null;
    }

    return (
        <Dropdown
            closeOnParentScroll={closeOnParentScroll}
            overlayPositionType={overlayPositionType}
            renderButton={({ isOpen, toggleDropdown }) => {
                return (
                    <div
                        ref={(item) => {
                            ref.current = item;
                        }}
                    >
                        <Button
                            id={id}
                            className={cx(
                                "gd-alert-comparison-operator-select__button s-alert-operator-select",
                                {
                                    "is-active": isOpen,
                                },
                            )}
                            size="small"
                            variant="secondary"
                            iconLeft={selectedComparisonItem?.icon ?? selectedRelativeItem?.icon}
                            iconRight={`gd-icon-navigate${isOpen ? "up" : "down"}`}
                            onClick={toggleDropdown}
                        >
                            {intl.formatMessage({
                                id: selectedComparisonItem?.title ?? selectedRelativeItem?.title,
                            })}
                        </Button>
                    </div>
                );
            }}
            renderBody={({ closeDropdown }) => {
                return (
                    <List
                        width={ref.current?.offsetWidth}
                        className="gd-alert-comparison-operator-select__list s-alert-operator-select-list"
                        items={operators}
                        itemHeightGetter={(idx) =>
                            operators[idx].type === "separator"
                                ? DROPDOWN_SEPARATOR_ITEM_HEIGHT
                                : DROPDOWN_ITEM_HEIGHT
                        }
                        renderItem={(prop) => {
                            return (
                                <SingleSelectListItem
                                    key={prop.rowIndex}
                                    type={prop.item.type}
                                    icon={
                                        prop.item.icon ? (
                                            <div
                                                className={cx(
                                                    "gd-alert-comparison-operator-select__icon",
                                                    prop.item.icon,
                                                )}
                                            />
                                        ) : undefined
                                    }
                                    title={
                                        prop.item.title
                                            ? intl.formatMessage({ id: prop.item.title })
                                            : undefined
                                    }
                                    info={
                                        prop.item.info ? (
                                            <FormattedMessage
                                                id={prop.item.info}
                                                values={{
                                                    spacer: (
                                                        <div className="gd-alert-comparison-operator-tooltip-spacer" />
                                                    ),
                                                }}
                                            />
                                        ) : undefined
                                    }
                                    isSelected={
                                        prop.item === selectedComparisonItem ||
                                        prop.item === selectedRelativeItem
                                    }
                                    onClick={() => {
                                        const [first, second] = prop.item.id.split(".");
                                        if (first && !second) {
                                            onComparisonOperatorChange(measure, first);
                                        }
                                        if (first && second) {
                                            onRelativeOperatorChange(
                                                measure,
                                                second as IAlertRelativeOperator,
                                                first as IAlertRelativeArithmeticOperator,
                                            );
                                        }
                                        closeDropdown();
                                    }}
                                />
                            );
                        }}
                    />
                );
            }}
        />
    );
};

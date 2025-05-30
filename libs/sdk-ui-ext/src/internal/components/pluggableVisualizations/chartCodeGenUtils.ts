// (C) 2022-2025 GoodData Corporation
import {
    factoryNotationFor,
    isColorMappingItem,
    IInsightDefinition,
    insightProperties,
} from "@gooddata/sdk-model";
import { IChartConfig } from "@gooddata/sdk-ui-charts";
import { IForecastConfig } from "@gooddata/sdk-backend-spi";
import filter from "lodash/fp/filter.js";
import flow from "lodash/fp/flow.js";
import fromPairs from "lodash/fromPairs.js";
import toPairs from "lodash/toPairs.js";

import { IEmbeddingCodeContext } from "../../interfaces/VisualizationDescriptor.js";
import {
    IAdditionalFactoryDefinition,
    IInsightToPropConversion,
    insightConversion,
    PropMeta,
} from "../../utils/embeddingCodeGenerator/index.js";
import { getChartSupportedControls } from "../../utils/propertiesHelper.js";
import { removeUseless } from "../../utils/removeUseless.js";

const supportedChartConfigProperties = new Set<keyof IChartConfig>([
    "colorMapping",
    "colorPalette",
    "dataLabels",
    "dataPoints",
    "dualAxis",
    "enableChartSorting",
    "enableSeparateTotalLabels",
    "enableJoinedAttributeAxisName",
    "grid",
    "legend",
    "legendLayout",
    "limits",
    "primaryChartType",
    "secondary_xaxis",
    "secondary_yaxis",
    "secondaryChartType",
    "separators",
    "stackMeasures",
    "stackMeasuresToPercent",
    "xaxis",
    "xFormat",
    "xLabel",
    "yaxis",
    "yFormat",
    "yLabel",
    "total",
    "orientation",
    "comparison",
    "cellImageSizing",
    "cellTextWrapping",
    "cellVerticalAlign",
    "rowHeight",
    "inlineVisualizations",
    "hyperLinks",
    "thresholdMeasures",
]);

export function chartConfigFromInsight(
    insight: IInsightDefinition,
    ctx?: IEmbeddingCodeContext,
): IChartConfig {
    const properties = insightProperties(insight);
    const controls = properties?.controls ?? {};
    const includeColorPalette = ctx?.backend?.capabilities.supportsCustomColorPalettes ?? false;
    const { inlineVisualizations, hyperLinks } = properties;

    const withValuesFromContext = {
        ...{
            inlineVisualizations,
            hyperLinks,
        },
        ...controls,
        ...(ctx?.colorPalette && includeColorPalette ? { colorPalette: ctx.colorPalette } : {}),
        ...(ctx?.settings?.separators ? { separators: ctx.settings.separators } : {}),
        ...(ctx?.settings?.enableChartsSorting ? { enableChartSorting: true } : {}),
        ...(ctx?.settings?.enableSeparateTotalLabels ? { enableSeparateTotalLabels: true } : {}),
        ...(ctx?.settings?.enableAxisNameViewByTwoAttributes ? { enableJoinedAttributeAxisName: true } : {}),
    };

    return flow(
        toPairs,
        filter(([key]) => supportedChartConfigProperties.has(key as any)),
        fromPairs,
        (c) => getChartSupportedControls(c, insight, ctx?.settings),
        removeUseless,
    )(withValuesFromContext);
}

export function chartForecastConfigFromInsight(
    insight: IInsightDefinition,
    _ctx?: IEmbeddingCodeContext,
): IForecastConfig | undefined {
    const properties = insightProperties(insight);
    const controls = properties?.controls ?? {};

    if (!controls.forecast || controls.forecast?.enabled === false) {
        return undefined;
    }

    const parsedPeriod = controls.forecast?.period?.toString();
    const forecastPeriod = parsedPeriod ? parseInt(parsedPeriod, 10) : 3;
    const confidenceLevel = controls.forecast?.confidence ?? 0.95;
    const seasonal = controls.forecast?.seasonal;

    return flow(removeUseless)({
        confidenceLevel,
        forecastPeriod,
        seasonal,
    });
}

export function chartAdditionalFactories(options?: {
    getColorMappingPredicatePackage?: string;
}): IAdditionalFactoryDefinition[] {
    const { getColorMappingPredicatePackage = "@gooddata/sdk-ui-charts" } = options ?? {};

    return [
        {
            importInfo: {
                importType: "named",
                name: "getColorMappingPredicate",
                package: getColorMappingPredicatePackage,
            },
            transformation: (obj) => {
                return isColorMappingItem(obj)
                    ? `{predicate: getColorMappingPredicate("${obj.id}"), color: ${factoryNotationFor(
                          obj.color,
                      )}}`
                    : undefined;
            },
        },
    ];
}

const chartConfigPropMeta: PropMeta = {
    typeImport: {
        importType: "named",
        name: "IChartConfig",
        package: "@gooddata/sdk-ui-charts",
    },
    cardinality: "scalar",
};

export function chartConfigInsightConversion<TProps extends object, TPropKey extends keyof TProps>(
    propName: TPropKey,
): IInsightToPropConversion<TProps, TPropKey, IChartConfig> {
    return insightConversion(propName, chartConfigPropMeta, chartConfigFromInsight);
}

const chartForecastConfigPropMeta: PropMeta = {
    typeImport: {
        importType: "named",
        name: "IForecastConfig",
        package: "@gooddata/sdk-backend-spi",
    },
    cardinality: "scalar",
};

export function chartForecastConfigInsightConversion<TProps extends object, TPropKey extends keyof TProps>(
    propName: TPropKey,
): IInsightToPropConversion<TProps, TPropKey, IForecastConfig> {
    return insightConversion(propName, chartForecastConfigPropMeta, chartForecastConfigFromInsight);
}

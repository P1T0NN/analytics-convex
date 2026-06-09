// TYPES
import type {
	typesAnalyticsMetricConfig,
	typesAnalyticsScopeInput,
} from "./types";
import type { GenericDataModel, GenericQueryCtx } from "convex/server";

export type typesQueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;

export type typesMetricName<
	Metrics extends readonly typesAnalyticsMetricConfig[],
> = Metrics[number]["name"];

export type typesMetricConfigForName<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = Extract<Metrics[number], { name: Name }>;

export type typesDimensionNameForMetric<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> =
	typesMetricConfigForName<Metrics, Name> extends {
		dimensions?: readonly (infer Dimension)[];
	}
		? Extract<Dimension, string>
		: never;

export type typesMetricRangeArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = {
	metric: Name;
	from: number;
	to: number;
	scope?: typesAnalyticsScopeInput;
};

export type typesTimeSeriesArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = typesMetricRangeArgs<Metrics, Name> & {
	groupBy?: typesDimensionNameForMetric<Metrics, Name>;
	fill?: boolean;
};

export type typesBreakdownArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = typesMetricRangeArgs<Metrics, Name> & {
	groupBy: typesDimensionNameForMetric<Metrics, Name>;
};

export type typesMetricTotalsByDimensionArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = {
	metric: Name;
	scope?: typesAnalyticsScopeInput;
	dimensionKey: typesDimensionNameForMetric<Metrics, Name>;
	days?: number;
	maxRows?: number;
};

export type typesMetricConversionArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Numerator extends typesMetricName<Metrics>,
	Denominator extends typesMetricName<Metrics>,
> = {
	numeratorMetric: Numerator;
	denominatorMetric: Denominator;
	from: number;
	to: number;
	scope?: typesAnalyticsScopeInput;
};

export type typesMetricEvaluationArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = typesMetricRangeArgs<Metrics, Name>;

export type typesDashboardMetricsArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
> = {
	metrics: typesMetricName<Metrics>[];
	from: number;
	to: number;
	scope?: typesAnalyticsScopeInput;
	includeComparison?: boolean;
	includeEvaluation?: boolean;
};

export type typesFunnelConversionArgs = {
	funnel: string;
	from: number;
	to: number;
	scope?: typesAnalyticsScopeInput;
};

export type typesTopDimensionValueArgs<
	Metrics extends readonly typesAnalyticsMetricConfig[],
	Name extends typesMetricName<Metrics>,
> = Omit<typesMetricTotalsByDimensionArgs<Metrics, Name>, "maxRows">;

// LIBRARIES
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type {
	typesAnalyticsMetricConfig,
	typesAnalyticsRuntimeConfig,
} from "../types/types";
import type {
	typesBreakdownArgs,
	typesDashboardMetricsArgs,
	typesFunnelConversionArgs,
	typesMetricConversionArgs,
	typesMetricEvaluationArgs,
	typesMetricName,
	typesMetricRangeArgs,
	typesMetricTotalsByDimensionArgs,
	typesQueryCtx,
	typesTimeSeriesArgs,
	typesTopDimensionValueArgs,
} from "../types/analyticsReadTypes";

/**
 * Create typed server-side read helpers from your metric config.
 *
 * Use from app queries that already implement their own authorization.
 */
export function createAnalyticsReader<
	const Metrics extends readonly typesAnalyticsMetricConfig[],
>(
	component: ComponentApi,
	_metrics: Metrics,
	config: typesAnalyticsRuntimeConfig,
) {
	const fetchMetricTotalsByDimension = async <
		Name extends typesMetricName<Metrics>,
	>(
		ctx: typesQueryCtx,
		args: typesMetricTotalsByDimensionArgs<Metrics, Name>,
	): Promise<Map<string, number>> => {
		const rows = await ctx.runQuery(
			component.lib.fetchMetricTotalsByDimension,
			{
				config,
				...args,
			},
		);

		return new Map(rows.map((row) => [row.key, row.value]));
	};

	const fetchTopDimensionValue = async <Name extends typesMetricName<Metrics>>(
		ctx: typesQueryCtx,
		args: typesTopDimensionValueArgs<Metrics, Name>,
	): Promise<string | null> => {
		return await ctx.runQuery(component.lib.fetchTopDimensionValue, {
			config,
			...args,
		});
	};

	return {
		fetchConfiguration: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(component.lib.fetchConfiguration, { config });
		},
		fetchSummary: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchSummary, {
				config,
				...args,
			});
		},
		fetchMetricComparison: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricComparison, {
				config,
				...args,
			});
		},
		fetchMetricConversion: async <
			Numerator extends typesMetricName<Metrics>,
			Denominator extends typesMetricName<Metrics>,
		>(
			ctx: typesQueryCtx,
			args: typesMetricConversionArgs<Metrics, Numerator, Denominator>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricConversion, {
				config,
				...args,
			});
		},
		fetchMetricEvaluation: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricEvaluationArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricEvaluation, {
				config,
				...args,
			});
		},
		fetchDashboardMetrics: async (
			ctx: typesQueryCtx,
			args: typesDashboardMetricsArgs<Metrics>,
		) => {
			return await ctx.runQuery(component.lib.fetchDashboardMetrics, {
				config,
				...args,
			});
		},
		fetchFunnelConversion: async (
			ctx: typesQueryCtx,
			args: typesFunnelConversionArgs,
		) => {
			return await ctx.runQuery(component.lib.fetchFunnelConversion, {
				config,
				...args,
			});
		},
		fetchTimeSeries: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesTimeSeriesArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchTimeSeries, {
				config,
				...args,
			});
		},
		fetchBreakdown: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesBreakdownArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchBreakdown, {
				config,
				...args,
			});
		},
		fetchMetricTotalsByDimension,
		fetchDimensionTotals: fetchMetricTotalsByDimension,
		fetchTopDimensionValue,
		fetchTopDimension: fetchTopDimensionValue,
	};
}

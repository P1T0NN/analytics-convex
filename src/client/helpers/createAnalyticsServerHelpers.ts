// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component";

// UTILS
import { internalCreateAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";
import { internalAnalyticsConfigReference } from "../utils/configReference";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
	typesTrackEventInput,
	typesTrackEventsInput,
} from "../../shared/types/index.js";
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
} from "../../shared/types/queryArgs.js";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

type typesWriteTrackInput =
	| typesTrackEventInput
	| {
			events: typesTrackEventsInput;
	  };

function normalizeWriteTrackEvents(
	input: typesWriteTrackInput,
): typesTrackEventsInput {
	if ("events" in input) {
		return input.events;
	}

	return [input];
}

export function internalCreateAnalyticsServerHelpers<
	const Metrics extends readonly typesAnalyticsMetricConfig[],
>(
	component: ComponentApi,
	events: readonly typesAnalyticsEventConfig[],
	metrics: Metrics,
	settings?: Partial<typesAnalyticsSettings>,
	funnels?: typesAnalyticsFunnelsConfig,
) {
	const config = internalCreateAnalyticsConfiguration(
		events,
		metrics,
		settings,
		funnels,
	);
	const configReference = internalAnalyticsConfigReference(config);

	const fetchMetricTotalsByDimension = async <
		Name extends typesMetricName<Metrics>,
	>(
		ctx: typesQueryCtx,
		args: typesMetricTotalsByDimensionArgs<Metrics, Name>,
	): Promise<Map<string, number>> => {
		const rows = await ctx.runQuery(
			component.lib.fetchMetricTotalsByDimension,
			{
				...configReference,
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
			...configReference,
			...args,
		});
	};

	return {
		writeConfiguration: async (
			ctx: typesMutationCtx,
			settings?: Record<string, unknown>,
		) => {
			return await ctx.runMutation(component.lib.writeConfiguration, {
				events: config.events,
				metrics: config.metrics,
				...(config.funnels ? { funnels: config.funnels } : {}),
				settings: {
					...config.settings,
					...(settings ?? {}),
				},
			});
		},

		writeTrack: async (ctx: typesMutationCtx, input: typesWriteTrackInput) => {
			return await ctx.runMutation(component.lib.writeTrack, {
				...configReference,
				events: normalizeWriteTrackEvents(input),
			});
		},

		fetchTimeSeries: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesTimeSeriesArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchTimeSeries, {
				...configReference,
				...args,
			});
		},

		fetchSummary: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchSummary, {
				...configReference,
				...args,
			});
		},

		fetchBreakdown: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesBreakdownArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchBreakdown, {
				...configReference,
				...args,
			});
		},

		fetchMetricComparison: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricRangeArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricComparison, {
				...configReference,
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
				...configReference,
				...args,
			});
		},

		fetchMetricEvaluation: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricEvaluationArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricEvaluation, {
				...configReference,
				...args,
			});
		},

		fetchDashboardMetrics: async (
			ctx: typesQueryCtx,
			args: typesDashboardMetricsArgs<Metrics>,
		) => {
			return await ctx.runQuery(component.lib.fetchDashboardMetrics, {
				...configReference,
				...args,
			});
		},

		fetchFunnelConversion: async (
			ctx: typesQueryCtx,
			args: typesFunnelConversionArgs,
		) => {
			return await ctx.runQuery(component.lib.fetchFunnelConversion, {
				...configReference,
				...args,
			});
		},

		fetchMetricTotalsByDimension,
		fetchTopDimensionValue,

		fetchConfiguration: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(component.lib.fetchConfiguration, configReference);
		},
	};
}

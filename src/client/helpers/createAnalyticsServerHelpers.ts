// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component";

// UTILS
import { internalCreateAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";
import { internalAnalyticsConfigReference } from "../utils/configReference";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfig,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";
import type {
	typesTrackEventInput,
	typesTrackEventsInput,
} from "../../shared/types/tracking.js";
import type {
	typesBreakdownArgs,
	typesDashboardMetricsArgs,
	typesFunnelConversionArgs,
	typesJourneyConversionArgs,
	typesMetricConversionArgs,
	typesMetricEvaluationArgs,
	typesMetricEvaluationConfigArgs,
	typesMetricName,
	typesMetricRangeArgs,
	typesMetricTotalsByDimensionArgs,
	typesQueryCtx,
	typesSetMetricEvaluationArgs,
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
	journeys?: typesAnalyticsJourneysConfig,
) {
	const config = internalCreateAnalyticsConfiguration(
		events,
		metrics,
		settings,
		funnels,
		journeys,
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
				...(config.journeys ? { journeys: config.journeys } : {}),
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

		fetchMetricEvaluationConfig: async <Name extends typesMetricName<Metrics>>(
			ctx: typesQueryCtx,
			args: typesMetricEvaluationConfigArgs<Metrics, Name>,
		) => {
			return await ctx.runQuery(component.lib.fetchMetricEvaluationConfig, {
				...configReference,
				...args,
			});
		},

		setMetricEvaluation: async <Name extends typesMetricName<Metrics>>(
			ctx: typesMutationCtx,
			args: typesSetMetricEvaluationArgs<Metrics, Name>,
		) => {
			return await ctx.runMutation(component.lib.writeMetricEvaluationOverride, {
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

		fetchJourneyConversion: async (
			ctx: typesQueryCtx,
			args: typesJourneyConversionArgs,
		) => {
			return await ctx.runQuery(component.lib.fetchJourneyConversion, {
				...configReference,
				...args,
			});
		},

		fetchMetricTotalsByDimension,
		fetchTopDimensionValue,

		fetchConfiguration: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(component.lib.fetchConfiguration, configReference);
		},

		/**
		 * Ghost-data audit: metrics/journeys with stored rows that the current
		 * config no longer references, plus stale stored-config counts. Cheap —
		 * O(distinct names) index seeks, never a table scan. Wrap in an
		 * admin-guarded query.
		 */
		fetchDataAudit: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(component.lib.fetchDataAudit, configReference);
		},

		/**
		 * High-volume ingestion backlog: pending count vs per-cycle drain
		 * capacity and the oldest pending event's age. Poll from a dashboard or
		 * alert cron.
		 */
		fetchIngestionHealth: async (ctx: typesQueryCtx) => {
			return await ctx.runQuery(
				component.lib.fetchIngestionHealth,
				configReference,
			);
		},

		/**
		 * Delete stored rows for metrics/journeys the config has abandoned
		 * (what `fetchDataAudit` reports). Refuses names still in the config.
		 * Batched and self-scheduling — one call drains everything.
		 */
		pruneData: async (
			ctx: typesMutationCtx,
			args: { metrics?: string[]; journeys?: string[] },
		) => {
			return await ctx.runMutation(component.lib.pruneAnalyticsData, {
				...configReference,
				...(args.metrics ? { metrics: args.metrics } : {}),
				...(args.journeys ? { journeys: args.journeys } : {}),
			});
		},

		/**
		 * One-time migration for pre-2.0 installs using distinctActors metrics:
		 * builds month-tier actor claims from existing day claims so long-range
		 * distinct counts stay exact over historical data. Self-scheduling;
		 * idempotent. Fresh installs never need it.
		 */
		backfillMonthActorClaims: async (ctx: typesMutationCtx) => {
			return await ctx.runMutation(component.lib.backfillMonthActorClaims, {});
		},
	};
}

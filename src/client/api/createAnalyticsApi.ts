// LIBRARIES
import { mutationGeneric, queryGeneric } from "convex/server";
import { ConvexError, v } from "convex/values";

// HELPERS
import { internalAuthorize } from "../helpers/authorize";
import { internalCreateAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";
import { internalAnalyticsConfigReference } from "../utils/configReference";

// SCHEMAS
import {
	breakdownResponseValidator,
	bucketUnitValidator,
	metricComparisonResponseValidator,
	metricSummaryResponseValidator,
	scopeInputValidator,
	timeSeriesResponseValidator,
	trackEventInputFields,
	writeTrackResultValidator,
} from "../../shared/schemas/analyticsSchemas";
import {
	dashboardMetricsResponseValidator,
} from "../../shared/schemas/dashboardSchemas";
import {
	funnelConversionResponseValidator,
} from "../../shared/schemas/funnelSchemas";
import {
	journeyConversionResponseValidator,
} from "../../shared/schemas/journeySchemas";
import {
	metricConversionResponseValidator,
	metricEvaluationResponseValidator,
} from "../../shared/schemas/evaluationSchemas";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsScopeInput,
} from "../../shared/types/scopes.js";
import type {
	typesCreateAnalyticsApiOptionsForConfig,
} from "../../shared/types/operations.js";
import type { ComponentApi } from "../../component/_generated/component.js";

/**
 * @internal Used by `defineAnalytics()` — not part of the public package API.
 *
 * Build the registered Convex functions exposed under `analytics.client`.
 * Everything returned here is a `queryGeneric`/`mutationGeneric` that can be
 * re-exported from a Convex module; plain server helpers live on the
 * `defineAnalytics()` result itself.
 */
export function createAnalyticsApi<
	const Events extends readonly typesAnalyticsEventConfig[],
	const Metrics extends readonly typesAnalyticsMetricConfig<
		string,
		Events[number]["name"]
	>[],
>(
	component: ComponentApi,
	options: typesCreateAnalyticsApiOptionsForConfig<Events, Metrics>,
) {
	type EventName = Events[number]["name"];
	type MetricName = Metrics[number]["name"];

	const eventNameValidator = v.union(
		...options.events.map((e) => v.literal(e.name as EventName)),
	);

	const metricNameValidator = v.union(
		...options.metrics.map((m) => v.literal(m.name as MetricName)),
	);

	const configuration = internalCreateAnalyticsConfiguration(
		options.events,
		options.metrics,
		options.settings,
		options.funnels,
		options.journeys,
	);
	const configReference = internalAnalyticsConfigReference(configuration);

	const funnelNameValidator =
		options.funnels && Object.keys(options.funnels).length > 0
			? v.union(
					...Object.keys(options.funnels).map((name) => v.literal(name)),
				)
			: v.string();

	const journeyNameValidator =
		options.journeys && Object.keys(options.journeys).length > 0
			? v.union(
					...Object.keys(options.journeys).map((name) => v.literal(name)),
				)
			: v.string();

	const singleTrackEventArgs = {
		name: eventNameValidator,
		...trackEventInputFields,
	};

	const writeTrackArgs = {
		name: v.optional(eventNameValidator),
		...trackEventInputFields,
		events: v.optional(v.array(v.object(singleTrackEventArgs))),
	};

	const scopeArg = (scope: unknown) =>
		scope ? { scope: scope as typesAnalyticsScopeInput } : {};

	return {
		writeConfiguration: mutationGeneric({
			args: {},
			returns: v.object({ configHash: v.string() }),
			handler: async (ctx) => {
				await internalAuthorize(options, ctx, { type: "configure" });
				return await ctx.runMutation(
					component.lib.writeConfiguration,
					{
						events: configuration.events,
						metrics: configuration.metrics,
						...(configuration.funnels ? { funnels: configuration.funnels } : {}),
						...(configuration.journeys ? { journeys: configuration.journeys } : {}),
						settings: configuration.settings,
					},
				);
			},
		}),
		writeTrack: mutationGeneric({
			args: writeTrackArgs,
			returns: writeTrackResultValidator,
			handler: async (ctx, args) => {
				const events =
					"events" in args && args.events
						? args.events
						: (() => {
								if (!args.name) {
									throw new ConvexError({
										code: "BAD_REQUEST",
										message: 'writeTrack requires either "name" or "events".',
									});
								}

								const { events: _events, name, ...rest } = args;
								return [{ name, ...rest }];
							})();

				const uniqueEventNames = new Set(events.map((event) => event.name));

				for (const name of uniqueEventNames) {
					await internalAuthorize(options, ctx, {
						type: "track",
						name,
					});
				}

				return await ctx.runMutation(component.lib.writeTrack, {
					...configReference,
					events,
				});
			},
		}),
		metricComparison: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
				bucketUnit: v.optional(bucketUnitValidator),
				timezone: v.optional(v.string()),
			},
			returns: metricComparisonResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "metricComparison",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricComparison, {
					...configReference,
					...args,
				});
			},
		}),
		metricConversion: queryGeneric({
			args: {
				numeratorMetric: metricNameValidator,
				denominatorMetric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
			},
			returns: metricConversionResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "metricConversion",
					metric: args.numeratorMetric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricConversion, {
					...configReference,
					...args,
				});
			},
		}),
		metricEvaluation: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
			},
			returns: metricEvaluationResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "metricEvaluation",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricEvaluation, {
					...configReference,
					...args,
				});
			},
		}),
		dashboardMetrics: queryGeneric({
			args: {
				metrics: v.array(metricNameValidator),
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
				includeComparison: v.optional(v.boolean()),
				includeEvaluation: v.optional(v.boolean()),
			},
			returns: dashboardMetricsResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "dashboardMetrics",
					metrics: args.metrics,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchDashboardMetrics, {
					...configReference,
					...args,
				});
			},
		}),
		funnelConversion: queryGeneric({
			args: {
				funnel: funnelNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
				groupBy: v.optional(v.string()),
			},
			returns: funnelConversionResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "funnelConversion",
					funnel: args.funnel,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchFunnelConversion, {
					...configReference,
					...args,
				});
			},
		}),
		journeyConversion: queryGeneric({
			args: {
				journey: journeyNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
				groupBy: v.optional(v.string()),
			},
			returns: journeyConversionResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "journeyConversion",
					journey: args.journey,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchJourneyConversion, {
					...configReference,
					...args,
				});
			},
		}),
		metricTotalsByDimension: queryGeneric({
			args: {
				metric: metricNameValidator,
				dimensionKey: v.string(),
				scope: v.optional(scopeInputValidator),
				days: v.optional(v.number()),
				maxRows: v.optional(v.number()),
			},
			returns: v.array(v.object({ key: v.string(), value: v.number() })),
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "metricTotalsByDimension",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricTotalsByDimension, {
					...configReference,
					...args,
				});
			},
		}),
		topDimensionValue: queryGeneric({
			args: {
				metric: metricNameValidator,
				dimensionKey: v.string(),
				scope: v.optional(scopeInputValidator),
				days: v.optional(v.number()),
			},
			returns: v.union(v.string(), v.null()),
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "topDimensionValue",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchTopDimensionValue, {
					...configReference,
					...args,
				});
			},
		}),
		timeSeries: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				groupBy: v.optional(v.string()),
				scope: v.optional(scopeInputValidator),
				fill: v.optional(v.boolean()),
				bucketUnit: v.optional(bucketUnitValidator),
				timezone: v.optional(v.string()),
			},
			returns: timeSeriesResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "timeSeries",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchTimeSeries, {
					...configReference,
					...args,
				});
			},
		}),
		summary: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
			},
			returns: metricSummaryResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "summary",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchSummary, {
					...configReference,
					...args,
				});
			},
		}),
		breakdown: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				groupBy: v.string(),
				scope: v.optional(scopeInputValidator),
			},
			returns: breakdownResponseValidator,
			handler: async (ctx, args) => {
				await internalAuthorize(options, ctx, {
					type: "read",
					query: "breakdown",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchBreakdown, {
					...configReference,
					...args,
				});
			},
		}),
	};
}

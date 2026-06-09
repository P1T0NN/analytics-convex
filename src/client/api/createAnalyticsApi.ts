// LIBRARIES
import {
	mutationGeneric,
	queryGeneric,
	type GenericDataModel,
	type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";

// HELPERS
import { authorize } from "../helpers/authorize";
import { createAnalyticsReader } from "../helpers/createAnalyticsReader";
import { createAnalyticsTracker } from "../helpers/createAnalyticsTracker";
import { createAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";

// SCHEMAS
import { scopeInputValidator, trackEventInputFields } from "../schemas/schemas";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsScopeInput,
	typesCreateAnalyticsApiOptionsForConfig,
} from "../types/types";
import type { ComponentApi } from "../../component/_generated/component.js";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

/**
 * Build app-side Convex functions backed by the analytics component.
 *
 * Export these from your app's `convex/analytics.ts` when you want client or
 * route access. It also returns typed server-side helpers for product
 * mutations and app-specific analytics queries.
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

	const configuration = createAnalyticsConfiguration(
		options.events,
		options.metrics,
		options.settings,
		options.funnels,
	);

	const funnelNameValidator =
		options.funnels && Object.keys(options.funnels).length > 0
			? v.union(
					...Object.keys(options.funnels).map((name) => v.literal(name)),
				)
			: v.string();

	const tracker = createAnalyticsTracker(
		component,
		options.events,
		configuration,
	);

	const reader = createAnalyticsReader(
		component,
		options.metrics,
		configuration,
	);

	const singleTrackEventArgs = {
		name: eventNameValidator,
		...trackEventInputFields,
	};

	const writeTrackArgs = {
		name: v.optional(eventNameValidator),
		...trackEventInputFields,
		events: v.optional(v.array(v.object(singleTrackEventArgs))),
	};

	const scopeArg = (scope: unknown) => scope ? { scope: scope as typesAnalyticsScopeInput } : {};

	return {
		...tracker,
		...reader,
		configure: async (ctx: typesMutationCtx) => {
			await ctx.runMutation(component.lib.writeConfiguration, configuration);
		},
		writeConfiguration: mutationGeneric({
			args: {},
			returns: v.null(),
			handler: async (ctx) => {
				await authorize(options, ctx, { type: "configure" });
				await ctx.runMutation(component.lib.writeConfiguration, configuration);
				return null;
			},
		}),
		writeTrack: mutationGeneric({
			args: writeTrackArgs,
			returns: v.any(),
			handler: async (ctx, args) => {
				if (args.events) {
					for (const event of args.events) {
						await authorize(options, ctx, {
							type: "track",
							name: event.name,
						});
					}

					return await ctx.runMutation(component.lib.writeTrack, {
						config: configuration,
						events: args.events,
					});
				}

				if (!args.name) {
					throw new Error('writeTrack requires either "name" or "events".');
				}

				const { events: _events, ...event } = args;

				await authorize(options, ctx, {
					type: "track",
					name: args.name,
				});

				return await ctx.runMutation(component.lib.writeTrack, {
					config: configuration,
					...event,
					name: args.name,
				});
			},
		}),
		metricComparison: queryGeneric({
			args: {
				metric: metricNameValidator,
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
			},
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "metricComparison",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricComparison, {
					config: configuration,
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
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "metricConversion",
					metric: args.numeratorMetric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricConversion, {
					config: configuration,
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
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "metricEvaluation",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchMetricEvaluation, {
					config: configuration,
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
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "dashboardMetrics",
					metrics: args.metrics,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchDashboardMetrics, {
					config: configuration,
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
			},
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "funnelConversion",
					funnel: args.funnel,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchFunnelConversion, {
					config: configuration,
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
			},
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "timeSeries",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchTimeSeries, {
					config: configuration,
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
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "summary",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchSummary, {
					config: configuration,
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
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, {
					type: "read",
					query: "breakdown",
					metric: args.metric,
					...scopeArg(args.scope),
				});
				return await ctx.runQuery(component.lib.fetchBreakdown, {
					config: configuration,
					...args,
				});
			},
		}),
	};
}

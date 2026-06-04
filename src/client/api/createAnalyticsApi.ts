// LIBRARIES
import { mutationGeneric, queryGeneric } from "convex/server";
import { v } from "convex/values";
import type { ComponentApi } from "../../component/_generated/component.js";

// HELPERS
import { authorize } from "../helpers/authorize";
import { serializeEvents } from "../utils/serializeEvents";
import { serializeMetrics } from "../utils/serializeMetrics";

// SCHEMAS
import {
	propertyValueValidator,
	scopeInputValidator,
	scopeValidator,
	sourceValidator,
	subjectValidator,
} from "../schemas/schemas";

// TYPES
import type {
	typesAnalyticsScopeInput,
	typesCreateAnalyticsApiOptions,
} from "../types/types";

/**
 * Build app-side Convex functions backed by the analytics component.
 *
 * Export these from your app's `convex/analytics.ts` when you want client or
 * route access. For product mutations that already run on the server, calling
 * `ctx.runMutation(components.analytics.lib.writeTrack, ...)` directly is also fine.
 */
export function createAnalyticsApi<
	EventName extends string = string,
	MetricName extends string = string,
>(
	component: ComponentApi,
	options: typesCreateAnalyticsApiOptions<EventName, MetricName>,
) {
	const eventNameValidator = v.union(
		...options.events.map((e) => v.literal(e.name as EventName)),
	);
	const metricNameValidator = v.union(
		...options.metrics.map((m) => v.literal(m.name as MetricName)),
	);
	const trackEventArgs = {
		name: eventNameValidator,
		occurredAt: v.optional(v.number()),
		actorId: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		subject: v.optional(subjectValidator),
		scopes: v.optional(v.array(scopeValidator)),
		properties: v.optional(v.record(v.string(), propertyValueValidator)),
		source: v.optional(sourceValidator),
	};

	return {
		writeConfiguration: mutationGeneric({
			args: {},
			returns: v.null(),
			handler: async (ctx) => {
				await authorize(options, ctx, { type: "configure" });
				await ctx.runMutation(component.lib.writeConfiguration, {
					events: serializeEvents(options.events),
					metrics: serializeMetrics(options.metrics),
					...(options.settings ? { settings: options.settings } : {}),
				});
				return null;
			},
		}),
		writeTrack: mutationGeneric({
			args: trackEventArgs,
			returns: v.any(),
			handler: async (ctx, args) => {
				await authorize(options, ctx, { type: "track", name: args.name });
				return await ctx.runMutation(component.lib.writeTrack, args);
			},
		}),
		writeTrackBatch: mutationGeneric({
			args: {
				events: v.array(v.object(trackEventArgs)),
			},
			returns: v.any(),
			handler: async (ctx, args) => {
				for (const event of args.events) {
					await authorize(options, ctx, {
						type: "track",
						name: event.name,
					});
				}
				return await ctx.runMutation(component.lib.writeTrackBatch, args);
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
					...(args.scope
						? { scope: args.scope as typesAnalyticsScopeInput }
						: {}),
				});
				return await ctx.runQuery(component.lib.fetchTimeSeries, args);
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
					...(args.scope
						? { scope: args.scope as typesAnalyticsScopeInput }
						: {}),
				});
				return await ctx.runQuery(component.lib.fetchSummary, args);
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
					...(args.scope
						? { scope: args.scope as typesAnalyticsScopeInput }
						: {}),
				});
				return await ctx.runQuery(component.lib.fetchBreakdown, args);
			},
		}),
	};
}

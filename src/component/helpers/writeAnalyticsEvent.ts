// LIBRARIES
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

// CONFIG
import { getConfig } from "../analyticsConfig";

// HELPERS
import { aggregateEvent } from "./aggregateEvent";

// UTILS
import { hasHighVolumeMetrics } from "../utils/shared/metricUtils";

// SCHEMAS
import { scopeValidator, sourceValidator } from "../schemas/schemas";

// TYPES
import type { typesHighVolumeStatus } from "../types/types";
import type { typesAnalyticsMetricScope } from "../types/types";
import type { typesAnalyticsProperties } from "../types/types";

/**
 * Internal mutation. Do not call directly.
 *
 * Performs the actual analytics event insert and rollup aggregation.
 * Scheduled by `track()` via ctx.scheduler.runAfter.
 *
 * @internal
 */
export const writeAnalyticsEvent = internalMutation({
	args: {
		name: v.string(),
		occurredAt: v.number(),
		actorId: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		subject: v.optional(v.object({ type: v.string(), id: v.string() })),
		scopes: v.optional(v.array(scopeValidator)),
		properties: v.any(),
		source: sourceValidator,
		idempotencyKey: v.string(),
	},
	returns: v.object({
		eventId: v.id("analyticsEvents"),
		duplicate: v.boolean(),
		highVolumeStatus: v.union(
			v.literal("none"),
			v.literal("pending"),
			v.literal("processed"),
		),
	}),
	handler: async (ctx, args) => {
		const config = await getConfig(ctx);

		const existing = await ctx.db
			.query("analyticsEvents")
			.withIndex("by_idempotency_key", (q) =>
				q.eq("idempotencyKey", args.idempotencyKey),
			)
			.first();

		if (existing) {
			const highVolumeStatus: typesHighVolumeStatus =
				existing.highVolumeStatus ?? "none";

			return {
				eventId: existing._id,
				duplicate: true,
				highVolumeStatus,
			};
		}

		const highVolumeStatus: typesHighVolumeStatus = hasHighVolumeMetrics(
			config,
			args.name,
		)
			? "pending"
			: "none";

		const eventId = await ctx.db.insert("analyticsEvents", {
			name: args.name,
			occurredAt: args.occurredAt,
			actorId: args.actorId,
			organizationId: args.organizationId,
			subject: args.subject,
			scopes: args.scopes as typesAnalyticsMetricScope[] | undefined,
			properties: args.properties,
			source: args.source,
			idempotencyKey: args.idempotencyKey,
			highVolumeStatus,
		});

		await aggregateEvent(
			ctx,
			config,
			{
				eventId,
				name: args.name,
				occurredAt: args.occurredAt,
				actorId: args.actorId,
				organizationId: args.organizationId,
				subject: args.subject,
				scopes: args.scopes as typesAnalyticsMetricScope[] | undefined,
				properties: (args.properties ?? {}) as typesAnalyticsProperties,
			},
			"realtime",
		);

		return {
			eventId,
			duplicate: false,
			highVolumeStatus,
		};
	},
});

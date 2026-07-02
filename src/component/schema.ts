// LIBRARIES
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	metricEvaluationConfigValidator,
	storedAnalyticsConfigValidator,
} from "./schemas/schemas";

export default defineSchema({
	analyticsConfigurations: defineTable({
		hash: v.string(),
		config: storedAnalyticsConfigValidator,
		createdAt: v.number(),
	}).index("by_hash", ["hash"]),

	analyticsMetricEvaluationOverrides: defineTable({
		metric: v.string(),
		scopeType: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("resource"),
		),
		scopeId: v.string(),
		evaluation: metricEvaluationConfigValidator,
		updatedAt: v.number(),
	}).index("by_metric_scope", ["metric", "scopeType", "scopeId"]),

	analyticsEvents: defineTable({
		name: v.string(),
		occurredAt: v.number(),
		actorId: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		subject: v.optional(
			v.object({
				type: v.string(),
				id: v.string(),
			}),
		),
		scopes: v.optional(
			v.array(
				v.object({
					scopeType: v.union(
						v.literal("global"),
						v.literal("organization"),
						v.literal("resource"),
					),
					scopeId: v.string(),
				}),
			),
		),
		properties: v.optional(v.any()),
		source: v.optional(
			v.object({
				type: v.union(
					v.literal("server"),
					v.literal("client"),
					v.literal("webhook"),
					v.literal("system"),
				),
				name: v.optional(v.string()),
			}),
		),
		idempotencyKey: v.optional(v.string()),
		highVolumeStatus: v.optional(
			v.union(v.literal("none"), v.literal("pending"), v.literal("processed")),
		),
		highVolumeAggregatedAt: v.optional(v.number()),
	})
		.index("by_high_volume_status_occurred_at", [
			"highVolumeStatus",
			"occurredAt",
		])
		.index("by_idempotency_key", ["idempotencyKey"]),

	analyticsDailyMetrics: defineTable({
		metric: v.string(),
		granularity: v.union(v.literal("day"), v.literal("hour")),
		bucketStart: v.number(),
		scopeType: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("resource"),
		),
		scopeId: v.string(),
		dimensionKey: v.string(),
		dimensionValue: v.string(),
		shard: v.optional(v.number()),
		value: v.number(),
		sampleCount: v.optional(v.number()),
	})
		.index("by_metric_scope_dimension_bucket", [
			"metric",
			"scopeType",
			"scopeId",
			"granularity",
			"dimensionKey",
			"bucketStart",
		])
		.index("by_metric_scope_dimension_value_bucket_shard", [
			"metric",
			"scopeType",
			"scopeId",
			"granularity",
			"dimensionKey",
			"dimensionValue",
			"bucketStart",
			"shard",
		])
		.index("by_bucket_start", ["bucketStart"]),

	analyticsDailyActorClaims: defineTable({
		claimKey: v.string(),
		metric: v.string(),
		bucketStart: v.number(),
		scopeType: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("resource"),
		),
		scopeId: v.string(),
		dimensionKey: v.string(),
		dimensionValue: v.string(),
		actorKey: v.string(),
	})
		.index("by_claim_key", ["claimKey"])
		.index("by_metric_scope_dimension_bucket", [
			"metric",
			"scopeType",
			"scopeId",
			"dimensionKey",
			"bucketStart",
		])
		.index("by_bucket_start", ["bucketStart"]),

	analyticsJourneyStepClaims: defineTable({
		claimKey: v.string(),
		journey: v.string(),
		stepIndex: v.number(),
		bucketStart: v.number(),
		scopeType: v.union(
			v.literal("global"),
			v.literal("organization"),
			v.literal("resource"),
		),
		scopeId: v.string(),
		actorKey: v.string(),
		dimensionKey: v.optional(v.string()),
		dimensionValue: v.optional(v.string()),
	})
		.index("by_claim_key", ["claimKey"])
		.index("by_journey_scope_step_bucket", [
			"journey",
			"scopeType",
			"scopeId",
			"stepIndex",
			"bucketStart",
		])
		.index("by_journey_scope_actor_step_bucket", [
			"journey",
			"scopeType",
			"scopeId",
			"actorKey",
			"stepIndex",
			"bucketStart",
		])
		.index("by_bucket_start", ["bucketStart"]),

	analyticsCounters: defineTable({
		key: v.string(),
		shard: v.number(),
		value: v.number(),
	}).index("by_key_and_shard", ["key", "shard"]),

	analyticsUniqueEvents: defineTable({
		key: v.string(),
		eventName: v.string(),
		actorId: v.optional(v.string()),
		organizationId: v.optional(v.string()),
		subject: v.optional(
			v.object({
				type: v.string(),
				id: v.string(),
			}),
		),
		createdAt: v.number(),
	}).index("by_key", ["key"]),
});

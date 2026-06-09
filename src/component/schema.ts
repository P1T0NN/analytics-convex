// LIBRARIES
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	analyticsConfigurations: defineTable({
		hash: v.string(),
		config: v.any(),
		createdAt: v.number(),
	}).index("by_hash", ["hash"]),

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
		granularity: v.literal("day"),
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
		]),

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

// LIBRARIES
import { v } from "convex/values";

export const propertyValueValidator = v.union(
	v.string(),
	v.number(),
	v.boolean(),
	v.null(),
);

export const sourceValidator = v.object({
	type: v.union(
		v.literal("server"),
		v.literal("client"),
		v.literal("webhook"),
		v.literal("system"),
	),
	name: v.optional(v.string()),
});

export const scopeValidator = v.object({
	scopeType: v.union(
		v.literal("global"),
		v.literal("organization"),
		v.literal("resource"),
	),
	scopeId: v.string(),
});

export const subjectValidator = v.object({
	type: v.string(),
	id: v.string(),
});

export const uniqueScopeValidator = v.literal("forever");

export const uniqueEventValidator = v.object({
	key: v.string(),
	scope: v.optional(uniqueScopeValidator),
});

export const scopeInputValidator = v.union(
	v.object({
		type: v.literal("global"),
		id: v.optional(v.string()),
	}),
	v.object({
		type: v.literal("organization"),
		id: v.string(),
	}),
	v.object({
		type: v.literal("resource"),
		resourceType: v.string(),
		id: v.string(),
	}),
);

export const trackEventInputFields = {
	occurredAt: v.optional(v.number()),
	actorId: v.optional(v.string()),
	organizationId: v.optional(v.string()),
	subject: v.optional(subjectValidator),
	scopes: v.optional(v.array(scopeValidator)),
	properties: v.optional(v.record(v.string(), propertyValueValidator)),
	source: v.optional(sourceValidator),
	unique: v.optional(uniqueEventValidator),
};

export const trackEventInputValidator = v.object({
	name: v.string(),
	...trackEventInputFields,
});

export const writeTrackResultValidator = v.object({
	scheduled: v.boolean(),
	scheduledCount: v.number(),
	deduped: v.optional(v.boolean()),
	dedupedCount: v.optional(v.number()),
});

export const resolvedScopeValidator = v.union(
	v.object({
		type: v.literal("global"),
		id: v.string(),
	}),
	v.object({
		type: v.literal("organization"),
		id: v.string(),
	}),
	v.object({
		type: v.literal("resource"),
		resourceType: v.string(),
		resourceId: v.string(),
		id: v.string(),
	}),
);

export const rangeValidator = v.object({
	from: v.number(),
	to: v.number(),
});

export const chartConfigValidator = v.record(
	v.string(),
	v.object({ label: v.string() }),
);

export const unitValidator = v.union(
	v.literal("count"),
	v.literal("currency"),
	v.literal("bytes"),
);

export const bucketUnitValidator = v.union(
	v.literal("day"),
	v.literal("week"),
	v.literal("month"),
);

export const metricSummaryResponseValidator = v.object({
	metric: v.string(),
	label: v.string(),
	unit: unitValidator,
	scope: resolvedScopeValidator,
	value: v.number(),
	range: rangeValidator,
});

export const metricComparisonResponseValidator = v.object({
	metric: v.string(),
	label: v.string(),
	unit: unitValidator,
	scope: resolvedScopeValidator,
	current: v.number(),
	previous: v.number(),
	delta: v.number(),
	deltaPercent: v.optional(v.number()),
	bucketUnit: bucketUnitValidator,
	timezone: v.string(),
	range: v.object({
		current: rangeValidator,
		previous: rangeValidator,
	}),
});

export const breakdownResponseValidator = v.object({
	data: v.array(
		v.object({
			key: v.string(),
			value: v.number(),
		}),
	),
	config: chartConfigValidator,
	meta: v.object({
		metric: v.string(),
		label: v.string(),
		unit: unitValidator,
		scope: resolvedScopeValidator,
		groupBy: v.string(),
		omittedSeriesCount: v.number(),
		range: rangeValidator,
	}),
});

export const timeSeriesResponseValidator = v.object({
	data: v.array(v.record(v.string(), v.number())),
	x: v.literal("date"),
	config: chartConfigValidator,
	meta: v.object({
		metric: v.string(),
		label: v.string(),
		unit: unitValidator,
		scope: resolvedScopeValidator,
		groupBy: v.optional(v.string()),
		bucketUnit: bucketUnitValidator,
		timezone: v.string(),
		seriesKeys: v.array(v.string()),
		omittedSeriesCount: v.number(),
		xValueType: v.literal("timestamp"),
		range: rangeValidator,
	}),
});

// LIBRARIES
import { v } from "convex/values";

// SCHEMAS
import {
	metricComparisonInputValidator,
	metricEvaluationResultValidator,
} from "./evaluationSchemas.js";

export const dashboardMetricItemValidator = v.object({
	value: v.number(),
	label: v.string(),
	unit: v.union(v.literal("count"), v.literal("currency"), v.literal("bytes")),
	comparison: v.optional(metricComparisonInputValidator),
	evaluation: v.optional(metricEvaluationResultValidator),
	conversion: v.optional(
		v.object({
			numerator: v.number(),
			denominator: v.number(),
			ratePercent: v.optional(v.number()),
			denominatorMetric: v.string(),
		}),
	),
});

export const dashboardMetricsResponseValidator = v.object({
	scope: v.any(),
	range: v.object({
		from: v.number(),
		to: v.number(),
	}),
	metrics: v.record(v.string(), dashboardMetricItemValidator),
});

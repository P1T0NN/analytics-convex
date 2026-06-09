// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalNormalizeConfig } from "../analyticsConfig";

// HELPERS
import { internalBuildDashboardMetricsForRange } from "../helpers/evaluateMetricForRange";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalStartOfUtcDay } from "../utils/common/dateUtils";
import { internalAssertDateRange } from "../validations/validations";
import { internalBadRequest } from "../errors/errors";

// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/constants.js";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
	dashboardMetricsResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Batch dashboard read for multiple metrics over the same date range.
 *
 * Dedupes rollup reads across metrics, comparisons, and evaluation
 * denominators. Labels are computed at query time — never stored in rollups.
 */
export const fetchDashboardMetrics = query({
	args: {
		config: analyticsRuntimeConfigValidator,
		metrics: v.array(v.string()),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
		includeComparison: v.optional(v.boolean()),
		includeEvaluation: v.optional(v.boolean()),
	},
	returns: dashboardMetricsResponseValidator,
	handler: async (ctx, args) => {
		const config = internalNormalizeConfig(args.config);
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		if (args.metrics.length === 0) {
			internalBadRequest("At least one metric must be requested.");
		}

		if (args.metrics.length > ANALYTICS_LIMITS.maxDashboardMetricsPerQuery) {
			internalBadRequest(
				`At most ${ANALYTICS_LIMITS.maxDashboardMetricsPerQuery} metrics can be requested per dashboard query.`,
			);
		}

		const uniqueMetrics = new Set<string>();
		for (const metric of args.metrics) {
			if (uniqueMetrics.has(metric)) {
				internalBadRequest(`Duplicate metric "${metric}" in dashboard request.`);
			}
			uniqueMetrics.add(metric);
			internalGetMetricConfigOrThrow(config, metric);
		}

		const scope = internalResolveScope(args.scope);
		const metrics = await internalBuildDashboardMetricsForRange(ctx, config, {
			metrics: args.metrics,
			scope,
			from: args.from,
			to: args.to,
			includeComparison: args.includeComparison,
			includeEvaluation: args.includeEvaluation,
		});

		return {
			scope,
			range: {
				from: internalStartOfUtcDay(args.from),
				to: internalStartOfUtcDay(args.to),
			},
			metrics,
		};
	},
});

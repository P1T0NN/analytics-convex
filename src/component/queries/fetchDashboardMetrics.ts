// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { buildDashboardMetricsForRange } from "../helpers/evaluateMetricForRange";

// UTILS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { assertDateRange } from "../validations/validations";
import { badRequest } from "../errors/errors";

// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits";

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
		const config = normalizeConfig(args.config);
		assertDateRange({ from: args.from, to: args.to }, config.settings);

		if (args.metrics.length === 0) {
			badRequest("At least one metric must be requested.");
		}

		if (args.metrics.length > ANALYTICS_LIMITS.maxDashboardMetricsPerQuery) {
			badRequest(
				`At most ${ANALYTICS_LIMITS.maxDashboardMetricsPerQuery} metrics can be requested per dashboard query.`,
			);
		}

		const uniqueMetrics = new Set<string>();
		for (const metric of args.metrics) {
			if (uniqueMetrics.has(metric)) {
				badRequest(`Duplicate metric "${metric}" in dashboard request.`);
			}
			uniqueMetrics.add(metric);
			getMetricConfigOrThrow(config, metric);
		}

		const scope = resolveScope(args.scope);
		const metrics = await buildDashboardMetricsForRange(ctx, config, {
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
				from: startOfUtcDay(args.from),
				to: startOfUtcDay(args.to),
			},
			metrics,
		};
	},
});

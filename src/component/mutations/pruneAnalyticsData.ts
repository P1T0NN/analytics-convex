// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// CONSTANTS
import { ANALYTICS_WRITE_BUDGET_CEILING } from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// UTILS
import { internalBadRequest } from "../errors/errors";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

const DEFAULT_PRUNE_CATCHUP_BATCHES = 100;

/**
 * Delete rollup rows and claims for metrics or journeys that are no longer in
 * the configuration — the ghost data `fetchDataAudit` reports.
 *
 * Deliberately explicit: names must be passed, and names still present in the
 * current config are refused, so a config mistake can never mass-delete live
 * data. Deletes in budgeted batches and self-schedules until done.
 *
 * @internal
 */
export const pruneAnalyticsData = mutation({
	args: {
		...configReferenceFields,
		metrics: v.optional(v.array(v.string())),
		journeys: v.optional(v.array(v.string())),
		remainingBatches: v.optional(v.number()),
	},
	returns: v.object({
		deleted: v.number(),
		scheduledNextBatch: v.boolean(),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		const metrics = args.metrics ?? [];
		const journeys = args.journeys ?? [];

		if (metrics.length === 0 && journeys.length === 0) {
			internalBadRequest(
				"pruneAnalyticsData requires at least one metric or journey name.",
			);
		}

		// Refuse anything the config still references — pruning is for data the
		// config has already abandoned, never for live series.
		for (const metric of metrics) {
			if (config.metricByName.has(metric)) {
				internalBadRequest(
					`Metric "${metric}" is still in the configuration and cannot be pruned.`,
				);
			}
		}
		for (const journey of journeys) {
			if (config.journeyByName.has(journey)) {
				internalBadRequest(
					`Journey "${journey}" is still in the configuration and cannot be pruned.`,
				);
			}
		}

		const remainingBatches =
			args.remainingBatches ?? DEFAULT_PRUNE_CATCHUP_BATCHES;
		let remaining = ANALYTICS_WRITE_BUDGET_CEILING;
		let deleted = 0;

		for (const metric of metrics) {
			if (remaining <= 0) break;
			const rollupRows = await ctx.db
				.query("analyticsDailyMetrics")
				.withIndex("by_metric_scope_dimension_bucket", (q) =>
					q.eq("metric", metric),
				)
				.take(remaining);
			for (const row of rollupRows) {
				await ctx.db.delete("analyticsDailyMetrics", row._id);
				deleted += 1;
				remaining -= 1;
			}

			if (remaining <= 0) break;
			const claimRows = await ctx.db
				.query("analyticsDailyActorClaims")
				.withIndex("by_metric_scope_dimension_bucket", (q) =>
					q.eq("metric", metric),
				)
				.take(remaining);
			for (const row of claimRows) {
				await ctx.db.delete("analyticsDailyActorClaims", row._id);
				deleted += 1;
				remaining -= 1;
			}
		}

		for (const journey of journeys) {
			if (remaining <= 0) break;
			const journeyRows = await ctx.db
				.query("analyticsJourneyStepClaims")
				.withIndex("by_journey_scope_step_bucket", (q) =>
					q.eq("journey", journey),
				)
				.take(remaining);
			for (const row of journeyRows) {
				await ctx.db.delete("analyticsJourneyStepClaims", row._id);
				deleted += 1;
				remaining -= 1;
			}
		}

		const scheduledNextBatch = remaining <= 0 && remainingBatches > 0;
		if (scheduledNextBatch) {
			await ctx.scheduler.runAfter(0, api.lib.pruneAnalyticsData, {
				configHash: config.configHash!,
				...(metrics.length > 0 ? { metrics } : {}),
				...(journeys.length > 0 ? { journeys } : {}),
				remainingBatches: remainingBatches - 1,
			});
		}

		return { deleted, scheduledNextBatch };
	},
});

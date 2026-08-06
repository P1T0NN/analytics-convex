// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONSTANTS
import { ANALYTICS_WRITE_BUDGET_CEILING } from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

/**
 * High-volume ingestion backlog visibility.
 *
 * `drainPerCycle` is how many pending events one cron cycle can aggregate
 * (batch size x (1 + catch-up batches)). When `pendingAtLeast` exceeds it —
 * `backlogExceedsCycle` — sustained ingest is outrunning the drain and
 * dashboards for high-volume metrics fall progressively behind: shorten the
 * cron interval, raise the batch size, or raise catch-up batches.
 *
 * Cheap by construction: reads at most `drainPerCycle + 1` pending rows
 * (capped), never the whole table. Poll it from a dashboard or an alert cron.
 */
export const fetchIngestionHealth = query({
	args: {
		...configReferenceFields,
	},
	returns: v.object({
		pendingAtLeast: v.number(),
		drainPerCycle: v.number(),
		backlogExceedsCycle: v.boolean(),
		oldestPendingAgeMs: v.union(v.number(), v.null()),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		const drainPerCycle =
			config.settings.highVolumeBatchSize *
			(1 + config.settings.highVolumeMaxCatchupBatches);
		const sampleLimit = Math.min(drainPerCycle, ANALYTICS_WRITE_BUDGET_CEILING);

		const pending = await ctx.db
			.query("analyticsEvents")
			.withIndex("by_high_volume_status_occurred_at", (q) =>
				q.eq("highVolumeStatus", "pending"),
			)
			.take(sampleLimit + 1);

		// The index orders by occurredAt, so the first pending row is the oldest.
		const oldest = pending[0];

		return {
			pendingAtLeast: pending.length,
			drainPerCycle,
			backlogExceedsCycle: pending.length > sampleLimit,
			oldestPendingAgeMs: oldest ? Date.now() - oldest.occurredAt : null,
		};
	},
});

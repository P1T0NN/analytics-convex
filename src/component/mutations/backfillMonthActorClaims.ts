// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

// HELPERS
import { internalEnsureMonthActorClaim } from "../helpers/claimDailyActorRollup";

/**
 * Backfill month-tier actor claims from existing day claims.
 *
 * Month claims are written automatically from 2.0 onward; day claims recorded
 * by earlier versions have no month tier, so long-range distinct reads over
 * historical data would undercount without this. Paginates the claims table
 * and self-schedules until done. Idempotent — safe to re-run, and safe while
 * live writes continue.
 *
 * Call once per deployment after upgrading a pre-2.0 install that uses
 * distinctActors metrics. Fresh installs never need it.
 *
 * @internal
 */
export const backfillMonthActorClaims = mutation({
	args: {
		cursor: v.optional(v.union(v.string(), v.null())),
	},
	returns: v.object({
		processed: v.number(),
		ensured: v.number(),
		isDone: v.boolean(),
	}),
	handler: async (ctx, args) => {
		// 500 reads + ≤500 claim lookups + ≤500 inserts per run — well under
		// Convex transaction limits; continuation happens via the scheduler.
		const page = await ctx.db
			.query("analyticsDailyActorClaims")
			.paginate({ cursor: args.cursor ?? null, numItems: 500 });

		let ensured = 0;
		for (const row of page.page) {
			if (row.granularity === "month") continue;

			await internalEnsureMonthActorClaim(ctx, {
				metric: row.metric,
				occurredAtBucket: row.bucketStart,
				scopeType: row.scopeType,
				scopeId: row.scopeId,
				dimensionKey: row.dimensionKey,
				dimensionValue: row.dimensionValue,
				actorKey: row.actorKey,
			});
			ensured += 1;
		}

		if (!page.isDone) {
			await ctx.scheduler.runAfter(0, api.lib.backfillMonthActorClaims, {
				cursor: page.continueCursor,
			});
		}

		return {
			processed: page.page.length,
			ensured,
			isDone: page.isDone,
		};
	},
});

// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONSTANTS
import { CONFIGURATION_RETENTION_MS } from "../../shared/constants.js";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// SCHEMAS
import { configReferenceFields } from "../schemas/schemas";

// TYPES
import type { QueryCtx } from "../_generated/server";

/**
 * Enumerate the distinct values of an index's leading string field via index
 * seeks — one point read per distinct value, never a table scan.
 */
async function internalDiscoverLeadingValues(
	seek: (cursor: string) => Promise<string | null>,
	limit = 512,
) {
	const values: string[] = [];
	let cursor = "";

	while (values.length < limit) {
		const next = await seek(cursor);
		if (next === null) break;
		values.push(next);
		cursor = next;
	}

	return values;
}

/**
 * Ghost-data audit: everything stored that the current configuration no
 * longer references, plus stored-config bookkeeping.
 *
 * Cost is O(distinct names), not O(rows) — each distinct metric/journey name
 * costs one index seek, so this is safe to run on any deployment size.
 * Orphans appear when a metric or journey is renamed or removed; their rows
 * are never read by queries again and can be deleted with `pruneAnalyticsData`.
 */
export const fetchDataAudit = query({
	args: {
		...configReferenceFields,
	},
	returns: v.object({
		orphanedMetrics: v.array(v.string()),
		orphanedJourneys: v.array(v.string()),
		configurations: v.object({
			count: v.number(),
			prunableCount: v.number(),
		}),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});

		const rollupMetrics = await internalDiscoverLeadingValues(
			async (cursor) =>
				(
					await ctx.db
						.query("analyticsDailyMetrics")
						.withIndex("by_metric_scope_dimension_bucket", (q) =>
							q.gt("metric", cursor),
						)
						.first()
				)?.metric ?? null,
		);

		const claimMetrics = await internalDiscoverLeadingValues(
			async (cursor) =>
				(
					await ctx.db
						.query("analyticsDailyActorClaims")
						.withIndex("by_metric_scope_dimension_bucket", (q) =>
							q.gt("metric", cursor),
						)
						.first()
				)?.metric ?? null,
		);

		const journeyNames = await internalDiscoverLeadingValues(
			async (cursor) =>
				(
					await ctx.db
						.query("analyticsJourneyStepClaims")
						.withIndex("by_journey_scope_step_bucket", (q) =>
							q.gt("journey", cursor),
						)
						.first()
				)?.journey ?? null,
		);

		const storedMetrics = [...new Set([...rollupMetrics, ...claimMetrics])];
		const orphanedMetrics = storedMetrics
			.filter((metric) => !config.metricByName.has(metric))
			.sort();
		const orphanedJourneys = journeyNames
			.filter((journey) => !config.journeyByName.has(journey))
			.sort();

		const configurations = await internalAuditConfigurations(
			ctx,
			config.configHash,
		);

		return {
			orphanedMetrics,
			orphanedJourneys,
			configurations,
		};
	},
});

async function internalAuditConfigurations(
	ctx: Pick<QueryCtx, "db">,
	activeHash: string | undefined,
) {
	const rows = await ctx.db.query("analyticsConfigurations").take(512);
	const staleBefore = Date.now() - CONFIGURATION_RETENTION_MS;

	return {
		count: rows.length,
		prunableCount: rows.filter(
			(row) => row.hash !== activeHash && row.createdAt < staleBefore,
		).length,
	};
}

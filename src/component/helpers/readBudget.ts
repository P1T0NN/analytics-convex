// LIBRARIES
import { ConvexError } from "convex/values";

// CONSTANTS
import { ANALYTICS_READ_BUDGET_CEILING } from "../../shared/constants.js";

// TYPES
import type { typesAnalyticsSettings } from "../../shared/types/settings.js";

/**
 * Shared read budget for one query invocation.
 *
 * Every rollup/claim index read inside a query draws from the same budget, so
 * the total rows a single query can scan is bounded by
 * `min(settings.maxRollupRowsPerQuery, ANALYTICS_READ_BUDGET_CEILING)` — kept
 * well under Convex's per-transaction document-scan limit. This makes it
 * structurally impossible for an analytics query to hit a raw Convex
 * transaction error: the library's own QUERY_TOO_LARGE always fires first.
 */
export type typesReadBudget = {
	remaining: number;
	readonly initial: number;
};

export function internalCreateReadBudget(
	settings: typesAnalyticsSettings,
): typesReadBudget {
	const initial = Math.min(
		settings.maxRollupRowsPerQuery,
		ANALYTICS_READ_BUDGET_CEILING,
	);
	return { remaining: initial, initial };
}

/** Rows a single index read may take right now. Throws when exhausted. */
export function internalReadBudgetLimit(budget: typesReadBudget) {
	if (budget.remaining <= 0) {
		internalThrowQueryTooLarge(budget);
	}
	return budget.remaining;
}

/** Record rows actually read; throws when the read overran the budget. */
export function internalDrawFromReadBudget(
	budget: typesReadBudget,
	rowsRead: number,
) {
	budget.remaining -= rowsRead;
	if (budget.remaining < 0) {
		internalThrowQueryTooLarge(budget);
	}
}

function internalThrowQueryTooLarge(budget: typesReadBudget): never {
	throw new ConvexError({
		code: "QUERY_TOO_LARGE",
		message:
			`Analytics query would read more than ${budget.initial} rollup rows ` +
			"(the per-query budget that keeps every query under Convex transaction limits). " +
			"Narrow the date range or scope, reduce dimension cardinality, and make sure " +
			"the compaction cron is registered so historical buckets are unsharded.",
	});
}

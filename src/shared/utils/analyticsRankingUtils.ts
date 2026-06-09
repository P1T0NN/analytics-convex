// TYPES
import type {
	typesAnalyticsRankingDirection,
	typesGetAnalyticsRankingArgs,
} from "../types/ranking.js";

export function compareScores(
	direction: typesAnalyticsRankingDirection,
	a: number,
	b: number,
) {
	return direction === "asc" ? a - b : b - a;
}

/**
 * Pure ranking/sorting utility with optional tie-breakers.
 *
 * Sorts items by a scoring function and returns the top N. Supports
 * ascending/descending direction and arbitrary tie-breaker comparators.
 */
export function getAnalyticsRanking<T>(
	args: typesGetAnalyticsRankingArgs<T>,
): T[] {
	const { items, getScore, limit, direction = "desc", tieBreakers = [] } = args;

	const rankedItems = [...items].sort((a, b) => {
		const scoreComparison = compareScores(direction, getScore(a), getScore(b));
		if (scoreComparison !== 0) return scoreComparison;

		for (const tieBreaker of tieBreakers) {
			const tieBreakerComparison = tieBreaker(a, b);
			if (tieBreakerComparison !== 0) return tieBreakerComparison;
		}

		return 0;
	});

	return typeof limit === "number" ? rankedItems.slice(0, limit) : rankedItems;
}

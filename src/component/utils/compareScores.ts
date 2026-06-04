// TYPES
import type { typesAnalyticsRankingDirection } from "../types/types";

export function compareScores(direction: typesAnalyticsRankingDirection, a: number, b: number) {
	return direction === 'asc' ? a - b : b - a;
}

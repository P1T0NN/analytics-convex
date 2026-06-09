export type typesAnalyticsRankingDirection = "asc" | "desc";

export type typesAnalyticsRankingTieBreaker<T> = (a: T, b: T) => number;

export type typesGetAnalyticsRankingArgs<T> = {
	items: T[];
	getScore: (item: T) => number;
	limit?: number;
	direction?: typesAnalyticsRankingDirection;
	tieBreakers?: typesAnalyticsRankingTieBreaker<T>[];
};

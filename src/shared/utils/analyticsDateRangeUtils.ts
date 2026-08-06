// CONSTANTS
import { DAY_MS, HOUR_MS } from "../constants.js";

// TYPES
import type { typesAnalyticsDateRange } from "../types/queries.js";
import type { typesAnalyticsBucketUnit } from "../types/primitives.js";

// UTILS
import {
	addTimeZoneMonths,
	ANALYTICS_UTC_TIMEZONE,
	nextTimeZoneDayStart,
	nextTimeZoneWeekStart,
	startOfTimeZoneDay,
	startOfTimeZoneMonth,
	startOfTimeZoneWeek,
} from "./analyticsTimezoneUtils.js";

export function startOfUtcDay(timestamp: number = Date.now()) {
	const date = new Date(timestamp);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function startOfUtcHour(timestamp: number = Date.now()) {
	const date = new Date(timestamp);
	return Date.UTC(
		date.getUTCFullYear(),
		date.getUTCMonth(),
		date.getUTCDate(),
		date.getUTCHours(),
	);
}

export function countUtcDaysInRange(from: number, to: number) {
	const fromDay = startOfUtcDay(from);
	const toDay = startOfUtcDay(to);
	return Math.floor((toDay - fromDay) / DAY_MS) + 1;
}

export function normalizeAnalyticsDayRange(
	range: typesAnalyticsDateRange,
): typesAnalyticsDateRange {
	return {
		from: startOfUtcDay(range.from),
		to: startOfUtcDay(range.to),
	};
}

/**
 * Build a UTC day range for analytics queries.
 *
 * Defaults to completed days only (`includeToday: false`), ending yesterday.
 * Daily rollups, comparisons, and DAU metrics are defined on UTC calendar days.
 */
export function createAnalyticsDayRange(args: {
	days: number;
	includeToday?: boolean;
	now?: number;
}): typesAnalyticsDateRange {
	if (!Number.isInteger(args.days) || args.days <= 0) {
		throw new Error("`days` must be a positive integer.");
	}

	const today = startOfUtcDay(args.now ?? Date.now());
	const includeToday = args.includeToday ?? false;
	const to = includeToday ? today : today - DAY_MS;
	const from = to - (args.days - 1) * DAY_MS;

	return { from, to };
}

/** Last N complete UTC days, ending yesterday. Best default for reporting dashboards. */
export function createAnalyticsCompletedDayRange(
	days: number,
	now?: number,
): typesAnalyticsDateRange {
	return createAnalyticsDayRange({ days, includeToday: false, now });
}

/** Today only (UTC), for live "so far today" views. */
export function createAnalyticsTodayRange(now?: number): typesAnalyticsDateRange {
	const today = startOfUtcDay(now ?? Date.now());
	return { from: today, to: today };
}

export function analyticsDayRangeIncludesToday(
	range: typesAnalyticsDateRange,
	now?: number,
): boolean {
	const today = startOfUtcDay(now ?? Date.now());
	return startOfUtcDay(range.to) >= today;
}

/** Previous period with the same number of UTC days, without overlapping the current range. */
export function previousAnalyticsDayRange(range: typesAnalyticsDateRange) {
	const current = normalizeAnalyticsDayRange(range);
	const dayCount = countUtcDaysInRange(current.from, current.to);
	const previousTo = current.from - DAY_MS;
	const previousFrom = previousTo - (dayCount - 1) * DAY_MS;

	return {
		current,
		previous: {
			from: previousFrom,
			to: previousTo,
		},
	};
}

/** Start of the UTC calendar month after the one containing `timestamp`. */
export function nextUtcMonthStart(timestamp: number) {
	const date = new Date(timestamp);
	return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1);
}

/** Exclusive UTC end of a rollup bucket, per stored granularity. */
export function utcRollupBucketEnd(
	granularity: "day" | "hour" | "month",
	bucketStart: number,
) {
	if (granularity === "hour") return bucketStart + HOUR_MS;
	if (granularity === "day") return bucketStart + DAY_MS;
	return nextUtcMonthStart(bucketStart);
}

/**
 * Split an inclusive UTC day range into edge day-ranges plus the run of full
 * calendar months it contains, so long-range reads can hit month rollup rows
 * instead of one row per day. `months` is null when no full month fits — the
 * caller should read plain day rows.
 */
export function decomposeUtcRangeForRollups(
	from: number,
	to: number,
): {
	dayRanges: Array<{ from: number; to: number }>;
	months: { from: number; to: number } | null;
} {
	const fromDay = startOfUtcDay(from);
	const toDay = startOfUtcDay(to);

	const firstCandidate =
		fromDay === startOfUtcMonth(fromDay) ? fromDay : nextUtcMonthStart(fromDay);

	let lastFullMonth: number | null = null;
	for (
		let month = firstCandidate;
		nextUtcMonthStart(month) - DAY_MS <= toDay;
		month = nextUtcMonthStart(month)
	) {
		lastFullMonth = month;
	}

	if (lastFullMonth === null) {
		return { dayRanges: [{ from: fromDay, to: toDay }], months: null };
	}

	const dayRanges: Array<{ from: number; to: number }> = [];
	if (fromDay < firstCandidate) {
		dayRanges.push({ from: fromDay, to: firstCandidate - DAY_MS });
	}
	const afterMonths = nextUtcMonthStart(lastFullMonth);
	if (afterMonths <= toDay) {
		dayRanges.push({ from: afterMonths, to: toDay });
	}

	return { dayRanges, months: { from: firstCandidate, to: lastFullMonth } };
}

export function startOfUtcWeek(timestamp: number = Date.now()) {
	return startOfTimeZoneWeek(timestamp, ANALYTICS_UTC_TIMEZONE);
}

export function startOfUtcMonth(timestamp: number = Date.now()) {
	return startOfTimeZoneMonth(timestamp, ANALYTICS_UTC_TIMEZONE);
}

// Bucket starts are recomputed for every rollup row during query-time
// re-bucketing, and non-UTC resolution goes through Intl. Rows repeat the
// same day-aligned timestamps heavily, so a small memo eliminates almost all
// of that cost. Bounded so it can never grow without limit.
const queryBucketStartCache = new Map<string, number>();
const QUERY_BUCKET_CACHE_MAX_ENTRIES = 50_000;

export function getQueryBucketStart(
	timestamp: number,
	bucketUnit: typesAnalyticsBucketUnit,
	timeZone: string = ANALYTICS_UTC_TIMEZONE,
) {
	if (bucketUnit === "day" && timeZone === ANALYTICS_UTC_TIMEZONE) {
		return startOfUtcDay(timestamp);
	}

	const cacheKey = `${bucketUnit}:${timeZone}:${timestamp}`;
	const cached = queryBucketStartCache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	let bucketStart: number;
	switch (bucketUnit) {
		case "day":
			bucketStart = startOfTimeZoneDay(timestamp, timeZone);
			break;
		case "week":
			bucketStart = startOfTimeZoneWeek(timestamp, timeZone);
			break;
		case "month":
			bucketStart = startOfTimeZoneMonth(timestamp, timeZone);
			break;
	}

	if (queryBucketStartCache.size >= QUERY_BUCKET_CACHE_MAX_ENTRIES) {
		queryBucketStartCache.clear();
	}
	queryBucketStartCache.set(cacheKey, bucketStart);

	return bucketStart;
}

export function getQueryBucketEndInclusive(
	bucketStart: number,
	bucketUnit: typesAnalyticsBucketUnit,
	timeZone: string = ANALYTICS_UTC_TIMEZONE,
) {
	switch (bucketUnit) {
		case "day":
			return nextTimeZoneDayStart(bucketStart, timeZone) - 1;
		case "week":
			return nextTimeZoneWeekStart(bucketStart, timeZone) - 1;
		case "month":
			return addTimeZoneMonths(bucketStart, 1, timeZone) - 1;
	}
}

export function listQueryBuckets(
	from: number,
	to: number,
	bucketUnit: typesAnalyticsBucketUnit,
	timeZone: string = ANALYTICS_UTC_TIMEZONE,
) {
	const start = getQueryBucketStart(from, bucketUnit, timeZone);
	const end = getQueryBucketStart(to, bucketUnit, timeZone);
	const buckets: number[] = [];

	// Fixed 24h/7d strides drift off local midnight across DST transitions,
	// so each step re-derives the next bucket start in the timezone.
	for (let bucket = start; bucket <= end; ) {
		buckets.push(bucket);

		if (bucketUnit === "day") {
			bucket = nextTimeZoneDayStart(bucket, timeZone);
			continue;
		}

		if (bucketUnit === "week") {
			bucket = nextTimeZoneWeekStart(bucket, timeZone);
			continue;
		}

		bucket = addTimeZoneMonths(bucket, 1, timeZone);
	}

	return buckets;
}

/** Previous period with the same number of query buckets (day/week/month). */
export function previousAnalyticsPeriodRange(
	range: typesAnalyticsDateRange,
	bucketUnit: typesAnalyticsBucketUnit,
	timeZone: string = ANALYTICS_UTC_TIMEZONE,
) {
	if (bucketUnit === "day") {
		return previousAnalyticsDayRange(range);
	}

	const bucketStarts = listQueryBuckets(range.from, range.to, bucketUnit, timeZone);
	if (bucketStarts.length === 0) {
		throw new Error("Date range did not resolve to any query buckets.");
	}

	const currentFrom = bucketStarts[0]!;
	const currentTo = bucketStarts[bucketStarts.length - 1]!;
	const bucketCount = bucketStarts.length;

	let previousFrom: number;
	let previousTo: number;

	if (bucketUnit === "week") {
		previousTo = currentFrom - 7 * DAY_MS;
		previousFrom = currentFrom - bucketCount * 7 * DAY_MS;
	} else {
		previousTo = addTimeZoneMonths(currentFrom, -1, timeZone);
		previousFrom = addTimeZoneMonths(currentFrom, -bucketCount, timeZone);
	}

	return {
		current: {
			from: currentFrom,
			to: currentTo,
		},
		previous: {
			from: getQueryBucketStart(previousFrom, bucketUnit, timeZone),
			to: getQueryBucketStart(previousTo, bucketUnit, timeZone),
		},
	};
}

export function listRollupBuckets(
	from: number,
	to: number,
	granularity: "day" | "hour",
) {
	if (granularity === "hour") {
		const start = startOfUtcHour(from);
		const end = startOfUtcHour(to);
		const buckets: number[] = [];

		for (let bucket = start; bucket <= end; bucket += HOUR_MS) {
			buckets.push(bucket);
		}

		return buckets;
	}

	const start = startOfUtcDay(from);
	const end = startOfUtcDay(to);
	const buckets: number[] = [];

	for (let bucket = start; bucket <= end; bucket += DAY_MS) {
		buckets.push(bucket);
	}

	return buckets;
}

import { describe, expect, it } from "vitest";

import { DAY_MS } from "../../shared/constants";
import {
	analyticsDayRangeIncludesToday,
	countUtcDaysInRange,
	createAnalyticsCompletedDayRange,
	createAnalyticsDayRange,
	createAnalyticsTodayRange,
	listQueryBuckets,
	previousAnalyticsDayRange,
	previousAnalyticsPeriodRange,
	startOfUtcDay,
	startOfUtcMonth,
	startOfUtcWeek,
} from "../../shared/utils/analyticsDateRangeUtils";

describe("analyticsDateRangeUtils", () => {
	const now = Date.UTC(2026, 0, 8, 15, 30);

	it("builds completed day ranges ending yesterday", () => {
		const range = createAnalyticsCompletedDayRange(7, now);

		expect(range).toEqual({
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 0, 7),
		});
		expect(analyticsDayRangeIncludesToday(range, now)).toBe(false);
	});

	it("builds today-only ranges for live views", () => {
		const range = createAnalyticsTodayRange(now);

		expect(range).toEqual({
			from: Date.UTC(2026, 0, 8),
			to: Date.UTC(2026, 0, 8),
		});
		expect(analyticsDayRangeIncludesToday(range, now)).toBe(true);
	});

	it("can include today in multi-day ranges", () => {
		const range = createAnalyticsDayRange({ days: 7, includeToday: true, now });

		expect(range).toEqual({
			from: Date.UTC(2026, 0, 2),
			to: Date.UTC(2026, 0, 8),
		});
		expect(countUtcDaysInRange(range.from, range.to)).toBe(7);
	});

	it("builds non-overlapping previous periods by UTC day count", () => {
		const current = {
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 0, 7),
		};

		const { previous } = previousAnalyticsDayRange(current);

		expect(previous).toEqual({
			from: Date.UTC(2025, 11, 25),
			to: Date.UTC(2025, 11, 31),
		});
		expect(previous.to + DAY_MS).toBe(startOfUtcDay(current.from));
	});

	it("builds weekly query buckets and previous periods", () => {
		const from = Date.UTC(2026, 0, 5);
		const to = Date.UTC(2026, 0, 18);

		expect(listQueryBuckets(from, to, "week")).toEqual([
			Date.UTC(2026, 0, 5),
			Date.UTC(2026, 0, 12),
		]);

		const { previous } = previousAnalyticsPeriodRange(
			{ from, to },
			"week",
		);

		expect(previous).toEqual({
			from: Date.UTC(2025, 11, 22),
			to: Date.UTC(2025, 11, 29),
		});
	});

	it("builds monthly query buckets", () => {
		const from = Date.UTC(2026, 0, 15);
		const to = Date.UTC(2026, 2, 10);

		expect(listQueryBuckets(from, to, "month")).toEqual([
			Date.UTC(2026, 0, 1),
			Date.UTC(2026, 1, 1),
			Date.UTC(2026, 2, 1),
		]);
		expect(startOfUtcMonth(from)).toBe(Date.UTC(2026, 0, 1));
		expect(startOfUtcWeek(from)).toBe(Date.UTC(2026, 0, 12));
	});
});

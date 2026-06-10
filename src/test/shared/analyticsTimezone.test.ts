import { describe, expect, it } from "vitest";
import {
	addTimeZoneMonths,
	startOfTimeZoneDay,
	startOfTimeZoneMonth,
	startOfTimeZoneWeek,
} from "../../shared/utils/analyticsTimezoneUtils";
import {
	getQueryBucketEndInclusive,
	getQueryBucketStart,
	listQueryBuckets,
} from "../../shared/utils/analyticsDateRangeUtils";
import { DAY_MS, HOUR_MS } from "../../shared/constants";

const localString = (ts: number, tz: string) =>
	new Intl.DateTimeFormat("en-GB", {
		timeZone: tz,
		dateStyle: "short",
		timeStyle: "medium",
	}).format(new Date(ts));

describe("timezone day/week/month starts", () => {
	it("handles half-hour offset zones (Asia/Kolkata, +5:30)", () => {
		const ts = Date.UTC(2026, 0, 15, 10);
		const result = startOfTimeZoneDay(ts, "Asia/Kolkata");
		expect(localString(result, "Asia/Kolkata")).toBe("15/01/2026, 00:00:00");
	});

	it("handles 45-minute offset zones (Asia/Kathmandu, +5:45)", () => {
		const ts = Date.UTC(2026, 0, 15, 10);
		const result = startOfTimeZoneDay(ts, "Asia/Kathmandu");
		expect(localString(result, "Asia/Kathmandu")).toBe("15/01/2026, 00:00:00");
	});

	it("handles extreme positive offsets (Pacific/Kiritimati, +14)", () => {
		// 12:00 UTC on Jan 15 is already Jan 16 02:00 in Kiritimati.
		const ts = Date.UTC(2026, 0, 15, 12);
		const result = startOfTimeZoneDay(ts, "Pacific/Kiritimati");
		expect(localString(result, "Pacific/Kiritimati")).toBe(
			"16/01/2026, 00:00:00",
		);
	});

	it("month start lands on the 1st in negative-offset zones (America/New_York)", () => {
		const ts = Date.UTC(2026, 0, 15, 10);
		const result = startOfTimeZoneMonth(ts, "America/New_York");
		expect(localString(result, "America/New_York")).toBe(
			"01/01/2026, 00:00:00",
		);
	});

	it("survives DST-skipped midnight (America/Santiago spring forward)", () => {
		// Chile skips 00:00 -> 01:00, so this local day has no midnight; the
		// day starts at its first existing instant.
		const ts = Date.UTC(2026, 8, 6, 15);
		const result = startOfTimeZoneDay(ts, "America/Santiago");
		expect(localString(result, "America/Santiago")).toMatch(
			/06\/09\/2026, 01:00:00/,
		);
	});

	it("week start is local midnight Monday across spring-forward (Europe/Berlin)", () => {
		// Berlin DST started Sun 2026-03-29; Wed Apr 1 belongs to the week of Mon Mar 30.
		const ts = Date.UTC(2026, 3, 1, 12);
		const result = startOfTimeZoneWeek(ts, "Europe/Berlin");
		expect(localString(result, "Europe/Berlin")).toBe("30/03/2026, 00:00:00");
	});

	it("addTimeZoneMonths lands on the 1st across year boundaries (America/New_York)", () => {
		const dec = startOfTimeZoneMonth(
			Date.UTC(2025, 11, 15, 10),
			"America/New_York",
		);
		const jan = addTimeZoneMonths(dec, 1, "America/New_York");
		expect(localString(jan, "America/New_York")).toBe("01/01/2026, 00:00:00");
	});
});

describe("query bucket listing across DST", () => {
	it("keeps day buckets aligned to local midnight across spring-forward (Europe/Berlin)", () => {
		// Mar 28 - Mar 31 2026 spans the Mar 29 spring-forward (23h day).
		const from = Date.UTC(2026, 2, 28, 12);
		const to = Date.UTC(2026, 2, 31, 12);
		const buckets = listQueryBuckets(from, to, "day", "Europe/Berlin");

		expect(buckets).toHaveLength(4);
		for (const bucket of buckets) {
			expect(localString(bucket, "Europe/Berlin")).toMatch(/00:00:00$/);
		}
		// The DST day is 23 hours long.
		expect(buckets[2]! - buckets[1]!).toBe(23 * HOUR_MS);
	});

	it("keeps day buckets aligned across fall-back (America/New_York, 25h day)", () => {
		// Nov 1 2026 is the US fall-back date.
		const from = Date.UTC(2026, 9, 31, 12);
		const to = Date.UTC(2026, 10, 3, 12);
		const buckets = listQueryBuckets(from, to, "day", "America/New_York");

		expect(buckets).toHaveLength(4);
		for (const bucket of buckets) {
			expect(localString(bucket, "America/New_York")).toMatch(/00:00:00$/);
		}
		expect(buckets[2]! - buckets[1]!).toBe(25 * HOUR_MS);
	});

	it("lists month buckets on the 1st in negative-offset zones", () => {
		const from = Date.UTC(2026, 0, 10);
		const to = Date.UTC(2026, 3, 10);
		const buckets = listQueryBuckets(from, to, "month", "America/New_York");

		expect(
			buckets.map((bucket) => localString(bucket, "America/New_York")),
		).toEqual([
			"01/01/2026, 00:00:00",
			"01/02/2026, 00:00:00",
			"01/03/2026, 00:00:00",
			"01/04/2026, 00:00:00",
		]);
	});

	it("bucket starts assign rollup rows consistently with listed buckets", () => {
		// Every UTC-day rollup bucket inside the range must map onto one of
		// the listed query buckets, or chart points would silently drop.
		const from = Date.UTC(2026, 2, 25);
		const to = Date.UTC(2026, 3, 5);
		const tz = "Europe/Berlin";
		const dayBuckets = new Set(listQueryBuckets(from, to, "day", tz));

		for (let day = from; day <= to; day += DAY_MS) {
			expect(dayBuckets.has(getQueryBucketStart(day, "day", tz))).toBe(true);
		}
	});

	it("query bucket ends precede the next bucket start by exactly 1ms", () => {
		const tz = "America/New_York";
		const buckets = listQueryBuckets(
			Date.UTC(2026, 9, 31),
			Date.UTC(2026, 10, 3),
			"day",
			tz,
		);

		for (let index = 0; index < buckets.length - 1; index += 1) {
			expect(getQueryBucketEndInclusive(buckets[index]!, "day", tz)).toBe(
				buckets[index + 1]! - 1,
			);
		}
	});
});

/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalPageViewsConfiguration,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import {
	decomposeUtcRangeForRollups,
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils";

const modules = import.meta.glob("../../component/**/*.ts");

function trackedEvent(name: string, occurredAt: number, key: string) {
	return {
		name,
		occurredAt,
		properties: {},
		source: { type: "server" as const },
		idempotencyKey: key,
	};
}

describe("decomposeUtcRangeForRollups", () => {
	it("splits a range into edge days plus full months", () => {
		const from = Date.UTC(2026, 0, 15); // Jan 15
		const to = Date.UTC(2026, 3, 10); // Apr 10

		const { dayRanges, months } = decomposeUtcRangeForRollups(from, to);

		expect(months).toEqual({
			from: Date.UTC(2026, 1, 1), // Feb
			to: Date.UTC(2026, 2, 1), // Mar
		});
		expect(dayRanges).toEqual([
			{ from: Date.UTC(2026, 0, 15), to: Date.UTC(2026, 0, 31) },
			{ from: Date.UTC(2026, 3, 1), to: Date.UTC(2026, 3, 10) },
		]);
	});

	it("returns no months when the range has no full month", () => {
		const { dayRanges, months } = decomposeUtcRangeForRollups(
			Date.UTC(2026, 0, 5),
			Date.UTC(2026, 1, 3),
		);

		expect(months).toBeNull();
		expect(dayRanges).toEqual([
			{ from: Date.UTC(2026, 0, 5), to: Date.UTC(2026, 1, 3) },
		]);
	});

	it("handles ranges aligned exactly to month boundaries", () => {
		const { dayRanges, months } = decomposeUtcRangeForRollups(
			Date.UTC(2026, 0, 1),
			Date.UTC(2026, 2, 31),
		);

		expect(months).toEqual({
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 2, 1),
		});
		expect(dayRanges).toEqual([]);
	});
});

describe("month rollup tier", () => {
	it("writes month rows alongside day rows", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [trackedEvent("page.viewed", Date.UTC(2026, 0, 15, 12), "jan")],
			},
		);

		const granularities = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyMetrics").collect();
			return rows.map((row) => row.granularity).sort();
		});

		expect(granularities).toEqual(["day", "month"]);
	});

	it("answers multi-month summaries exactly, including partial edges", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		// Jan 10, Jan 20, Feb 5 (full month), Mar 3.
		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					trackedEvent("page.viewed", Date.UTC(2026, 0, 10, 6), "jan-10"),
					trackedEvent("page.viewed", Date.UTC(2026, 0, 20, 6), "jan-20"),
					trackedEvent("page.viewed", Date.UTC(2026, 1, 5, 6), "feb-5"),
					trackedEvent("page.viewed", Date.UTC(2026, 2, 3, 6), "mar-3"),
				],
			},
		);

		const summary = (from: number, to: number) =>
			t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "pageViews",
				from,
				to,
			});

		// Full span: edge days (Jan 10-31) + full month (Feb) + edge days (Mar 1-3).
		expect(
			(await summary(Date.UTC(2026, 0, 10), Date.UTC(2026, 2, 3))).value,
		).toBe(4);

		// Partial edge must exclude Jan 10 — proves edges read day rows, not
		// the January month row.
		expect(
			(await summary(Date.UTC(2026, 0, 15), Date.UTC(2026, 2, 3))).value,
		).toBe(3);

		// Month-aligned span reads month rows only.
		expect(
			(await summary(Date.UTC(2026, 0, 1), Date.UTC(2026, 1, 28))).value,
		).toBe(3);
	});

	it("keeps avg and max exact across the month tier", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "job.finished",
					label: "Job finished",
					properties: { durationMs: "number" },
				},
			],
			metrics: [
				{
					name: "avgDuration",
					label: "Avg duration",
					unit: "count",
					eventNames: ["job.finished"],
					aggregation: "avg",
					valueProperty: "durationMs",
				},
				{
					name: "maxDuration",
					label: "Max duration",
					unit: "count",
					eventNames: ["job.finished"],
					aggregation: "max",
					valueProperty: "durationMs",
				},
			],
		});

		const write = (occurredAt: number, durationMs: number, key: string) =>
			t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "job.finished",
							occurredAt,
							properties: { durationMs },
							source: { type: "server" as const },
							idempotencyKey: key,
						},
					],
				},
			);

		await write(Date.UTC(2026, 0, 10, 6), 100, "jan"); // edge days
		await write(Date.UTC(2026, 1, 5, 6), 200, "feb-a"); // full month
		await write(Date.UTC(2026, 1, 6, 6), 400, "feb-b"); // full month
		await write(Date.UTC(2026, 2, 2, 6), 100, "mar"); // edge days

		const range = {
			from: Date.UTC(2026, 0, 10),
			to: Date.UTC(2026, 2, 2),
		};

		const avg = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "avgDuration",
			...range,
		});
		expect(avg.value).toBe((100 + 200 + 400 + 100) / 4);

		const max = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "maxDuration",
			...range,
		});
		expect(max.value).toBe(400);
	});

	it("month time series matches per-month event counts with partial edges", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					trackedEvent("page.viewed", Date.UTC(2026, 0, 10, 6), "jan-10"),
					trackedEvent("page.viewed", Date.UTC(2026, 0, 20, 6), "jan-20"),
					trackedEvent("page.viewed", Date.UTC(2026, 1, 5, 6), "feb-5"),
				],
			},
		);

		// From Jan 15: January is a partial month, so its point must count only
		// the Jan 20 event — full-month rows must not leak into partial edges.
		const series = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: Date.UTC(2026, 0, 15),
			to: Date.UTC(2026, 1, 28),
			bucketUnit: "month",
		});

		expect(series.data.map((point) => point.pageViews)).toEqual([1, 1]);
	});
});

describe("rollup shard compaction", () => {
	it("collapses cold shard rows to shard 0 without changing totals", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		// mediumVolume default → 8 shards.
		const config = internalPageViewsConfiguration();
		const coldDay = startOfUtcDay(Date.now()) - 30 * DAY_MS;

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: Array.from({ length: 24 }, (_, index) =>
					trackedEvent("page.viewed", coldDay + index * 1000, `cold-${index}`),
				),
			},
		);

		const shardsBefore = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyMetrics").collect();
			return rows.filter((row) => (row.shard ?? 0) > 0).length;
		});
		expect(shardsBefore).toBeGreaterThan(0);

		const result = await t.mutation(api.lib.compactAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(result.deleted).toBe(shardsBefore);

		const after = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyMetrics").collect();
			return {
				shardedRows: rows.filter((row) => (row.shard ?? 0) > 0).length,
				// day row + month row, one each, on shard 0
				rowCount: rows.length,
			};
		});
		expect(after.shardedRows).toBe(0);
		expect(after.rowCount).toBe(2);

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: coldDay,
			to: coldDay,
		});
		expect(summary.value).toBe(24);
	});

	it("leaves hot buckets sharded", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();
		const now = Date.now();

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: Array.from({ length: 24 }, (_, index) =>
					trackedEvent("page.viewed", now - index * 1000, `hot-${index}`),
				),
			},
		);

		const shardsBefore = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyMetrics").collect();
			return rows.filter((row) => (row.shard ?? 0) > 0).length;
		});
		expect(shardsBefore).toBeGreaterThan(0);

		const result = await t.mutation(api.lib.compactAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(result.deleted).toBe(0);

		const shardsAfter = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyMetrics").collect();
			return rows.filter((row) => (row.shard ?? 0) > 0).length;
		});
		expect(shardsAfter).toBe(shardsBefore);
	});
});

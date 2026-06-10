/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalPageViewsConfiguration,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils";

const modules = import.meta.glob("../../component/**/*.ts");

type AnalyticsTest = ReturnType<typeof internalCreateAnalyticsComponentTest>;

async function flushScheduledAnalytics(t: AnalyticsTest) {
	await t.finishAllScheduledFunctions(() => vi.runAllTimers());
}

describe("analytics regressions", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("counts identical events in one batch separately", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();
		const now = Date.now();

		// Two genuinely identical events (same name, timestamp, properties)
		// in one batch must both count — e.g. the same button clicked twice.
		const result = await t.mutation(api.lib.writeTrack, {
			...internalAnalyticsConfigArgs(config),
			events: [
				{ name: "page.viewed", occurredAt: now },
				{ name: "page.viewed", occurredAt: now },
			],
		});

		expect(result).toEqual({ scheduled: true, scheduledCount: 2 });

		await flushScheduledAnalytics(t);

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(2);
	});

	it("converts journey steps completed on different days", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayOne = startOfUtcDay(Date.UTC(2026, 0, 10));
		const dayTwo = dayOne + DAY_MS;
		const config = internalRuntimeConfiguration({
			events: [
				{ name: "signup.started", label: "Signup started" },
				{ name: "signup.completed", label: "Signup completed" },
			],
			metrics: [
				{
					name: "signupsStarted",
					label: "Signups started",
					unit: "count",
					eventNames: ["signup.started"],
					aggregation: "count",
				},
			],
			journeys: {
				signup: {
					label: "Signup journey",
					steps: ["signup.started", "signup.completed"],
				},
			},
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "signup.started",
						occurredAt: dayOne + 1,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.started:user-a",
					},
				],
			},
		);
		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "signup.completed",
						occurredAt: dayTwo + 1,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.completed:user-a",
					},
				],
			},
		);

		const conversion = await t.query(api.lib.fetchJourneyConversion, {
			...internalAnalyticsConfigArgs(config),
			journey: "signup",
			from: dayOne,
			to: dayTwo,
		});

		expect(conversion.stepCounts).toEqual([1, 1]);
	});

	it("claims journey steps arriving inside a single batch in step order", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayStart = startOfUtcDay(Date.UTC(2026, 0, 10));
		const config = internalRuntimeConfiguration({
			events: [
				{ name: "signup.started", label: "Signup started" },
				{ name: "signup.completed", label: "Signup completed" },
			],
			metrics: [
				{
					name: "signupsStarted",
					label: "Signups started",
					unit: "count",
					eventNames: ["signup.started"],
					aggregation: "count",
				},
			],
			journeys: {
				signup: {
					label: "Signup journey",
					steps: ["signup.started", "signup.completed"],
				},
			},
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "signup.completed",
						occurredAt: dayStart + 2,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.completed:user-a",
					},
					{
						name: "signup.started",
						occurredAt: dayStart + 1,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: "signup.started:user-a",
					},
				],
			},
		);

		const conversion = await t.query(api.lib.fetchJourneyConversion, {
			...internalAnalyticsConfigArgs(config),
			journey: "signup",
			from: dayStart,
			to: dayStart,
		});

		expect(conversion.stepCounts).toEqual([1, 1]);
	});

	it("returns hourly metric data from dashboard and breakdown reads", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayStart = startOfUtcDay(Date.UTC(2026, 0, 10));
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "page.viewed",
					label: "Page viewed",
					properties: { path: "string" },
				},
			],
			metrics: [
				{
					name: "hourlyViews",
					label: "Hourly views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
					dimensions: ["path"],
					trafficMode: "lowVolume",
					rollupGranularity: "hour",
				},
			],
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "page.viewed",
						occurredAt: dayStart + 1,
						properties: { path: "/home" },
						source: { type: "server" },
						idempotencyKey: "view-1",
					},
					{
						name: "page.viewed",
						occurredAt: dayStart + 2,
						properties: { path: "/pricing" },
						source: { type: "server" },
						idempotencyKey: "view-2",
					},
				],
			},
		);

		const dashboard = await t.query(api.lib.fetchDashboardMetrics, {
			...internalAnalyticsConfigArgs(config),
			metrics: ["hourlyViews"],
			from: dayStart,
			to: dayStart,
		});
		expect(dashboard.metrics.hourlyViews.value).toBe(2);

		const breakdown = await t.query(api.lib.fetchBreakdown, {
			...internalAnalyticsConfigArgs(config),
			metric: "hourlyViews",
			from: dayStart,
			to: dayStart,
			groupBy: "path",
		});
		expect(breakdown.data).toEqual([
			{ key: "/home", value: 1 },
			{ key: "/pricing", value: 1 },
		]);
	});

	it("aligns month buckets to local month starts in negative-offset timezones", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();
		const janEvent = Date.UTC(2026, 0, 15, 12);
		const febEvent = Date.UTC(2026, 1, 15, 12);

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "page.viewed",
						occurredAt: janEvent,
						properties: {},
						source: { type: "server" },
						idempotencyKey: "view-jan",
					},
					{
						name: "page.viewed",
						occurredAt: febEvent,
						properties: {},
						source: { type: "server" },
						idempotencyKey: "view-feb",
					},
				],
			},
		);

		// Noon UTC keeps `from`/`to` inside the intended New York months —
		// Jan 1 00:00 UTC is still Dec 31 in New York.
		const series = await t.query(api.lib.fetchTimeSeries, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: Date.UTC(2026, 0, 1, 12),
			to: Date.UTC(2026, 1, 28, 12),
			bucketUnit: "month",
			timezone: "America/New_York",
		});

		const localDate = (ts: number) =>
			new Intl.DateTimeFormat("en-GB", {
				timeZone: "America/New_York",
				dateStyle: "short",
				timeStyle: "short",
			}).format(new Date(ts));

		// Each bucket must start at local midnight on the 1st — previously the
		// buckets landed on the last day of the prior month for UTC-negative zones.
		expect(series.data.map((point) => localDate(point.date))).toEqual([
			"01/01/2026, 00:00",
			"01/02/2026, 00:00",
		]);
		expect(series.data.map((point) => point.pageViews)).toEqual([1, 1]);
	});

	it("does not overcount distinct actors across days in dashboard reads", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const dayOne = startOfUtcDay(Date.UTC(2026, 0, 10));
		const dayTwo = dayOne + DAY_MS;
		const config = internalRuntimeConfiguration({
			events: [{ name: "session.started", label: "Session started" }],
			metrics: [
				{
					name: "dailyActiveUsers",
					label: "Daily active users",
					unit: "count",
					eventNames: ["session.started"],
					aggregation: "distinctActors",
					trafficMode: "lowVolume",
				},
			],
		});

		const write = async (actorId: string, occurredAt: number, key: string) => {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "session.started",
							occurredAt,
							actorId,
							properties: {},
							source: { type: "server" },
							idempotencyKey: key,
						},
					],
				},
			);
		};

		// user-a is active on both days, user-b only on day one.
		await write("user-a", dayOne + 1, "a:day1");
		await write("user-a", dayTwo + 1, "a:day2");
		await write("user-b", dayOne + 2, "b:day1");

		const dashboard = await t.query(api.lib.fetchDashboardMetrics, {
			...internalAnalyticsConfigArgs(config),
			metrics: ["dailyActiveUsers"],
			from: dayOne,
			to: dayTwo,
		});

		// 2 unique actors — summing the per-day counts would wrongly give 3.
		expect(dashboard.metrics.dailyActiveUsers.value).toBe(2);
	});
});

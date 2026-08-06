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
import { ANALYTICS_LIMITS } from "../../shared/constants";
import { internalPlanAggregateEvent } from "../../component/helpers/aggregateEvent";
import { internalNormalizeConfig } from "../../component/analyticsConfig";

const modules = import.meta.glob("../../component/**/*.ts");

function trackedEvent(
	name: string,
	occurredAt: number,
	key: string,
	extra?: Record<string, unknown>,
) {
	return {
		name,
		occurredAt,
		properties: {},
		source: { type: "server" as const },
		idempotencyKey: key,
		...extra,
	};
}

describe("per-query read budget", () => {
	it("caps settings.maxRollupRowsPerQuery at the budget ceiling", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await expect(
			t.mutation(api.lib.writeConfiguration, {
				events: [{ name: "page.viewed", label: "Page viewed" }],
				metrics: [
					{
						name: "pageViews",
						label: "Page views",
						unit: "count",
						eventNames: ["page.viewed"],
						aggregation: "count",
					},
				],
				settings: {
					maxRollupRowsPerQuery: ANALYTICS_LIMITS.maxRollupRowsPerQuery + 1,
				},
			}),
		).rejects.toThrow(/maxRollupRowsPerQuery/);
	});

	it("shares one budget across every read in a query", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		// Tiny budget so a handful of rollup rows exhausts it.
		const config = internalRuntimeConfiguration({
			events: [{ name: "page.viewed", label: "Page viewed" }],
			metrics: [
				{
					name: "pageViews",
					label: "Page views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
					trafficMode: "lowVolume",
				},
			],
			settings: { maxRollupRowsPerQuery: 5 },
		});

		const dayOne = startOfUtcDay(Date.UTC(2026, 0, 10));
		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: Array.from({ length: 8 }, (_, index) =>
					trackedEvent("page.viewed", dayOne + index * DAY_MS, `d${index}`),
				),
			},
		);

		// 8 day rows > 5 budget — the query must fail loudly with the library's
		// own error, never a raw Convex limit.
		await expect(
			t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "pageViews",
				from: dayOne,
				to: dayOne + 7 * DAY_MS,
			}),
		).rejects.toThrow(/read budget|QUERY_TOO_LARGE|rollup rows/);

		// A range within budget still answers.
		const small = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: dayOne,
			to: dayOne + 3 * DAY_MS,
		});
		expect(small.value).toBe(4);
	});
});

describe("month-tier actor claims", () => {
	const distinctConfig = () =>
		internalRuntimeConfiguration({
			events: [
				{
					name: "session.started",
					label: "Session started",
					properties: { plan: "string" },
				},
			],
			metrics: [
				{
					name: "activeUsers",
					label: "Active users",
					unit: "count",
					eventNames: ["session.started"],
					aggregation: "distinctActors",
					dimensions: ["plan"],
					trafficMode: "lowVolume",
				},
			],
		});

	it("writes a month claim per actor and keeps multi-month counts exact", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = distinctConfig();

		const write = (actorId: string, occurredAt: number, key: string) =>
			t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						trackedEvent("session.started", occurredAt, key, {
							actorId,
							properties: { plan: "pro" },
						}),
					],
				},
			);

		// user-a active in Jan and Feb (many days), user-b only in Feb.
		await write("user-a", Date.UTC(2026, 0, 5, 6), "a-jan-1");
		await write("user-a", Date.UTC(2026, 0, 20, 6), "a-jan-2");
		await write("user-a", Date.UTC(2026, 1, 3, 6), "a-feb");
		await write("user-b", Date.UTC(2026, 1, 10, 6), "b-feb");

		const monthClaims = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyActorClaims").collect();
			return rows.filter((row) => row.granularity === "month").length;
		});
		// (a,Jan) + (a,Feb) + (b,Feb) for __total and same again for plan dim.
		expect(monthClaims).toBe(6);

		// Full months → answered from month claims: 2 distinct actors.
		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "activeUsers",
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 1, 28),
		});
		expect(summary.value).toBe(2);

		// Partial edge (from Jan 10) must use day claims for January — user-a's
		// Jan 5 activity is excluded, but Jan 20 keeps them counted.
		const partial = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "activeUsers",
			from: Date.UTC(2026, 0, 10),
			to: Date.UTC(2026, 1, 28),
		});
		expect(partial.value).toBe(2);

		// Breakdown across months dedupes actors per dimension value.
		const breakdown = await t.query(api.lib.fetchBreakdown, {
			...internalAnalyticsConfigArgs(config),
			metric: "activeUsers",
			from: Date.UTC(2026, 0, 1),
			to: Date.UTC(2026, 1, 28),
			groupBy: "plan",
		});
		expect(breakdown.data).toEqual([{ key: "pro", value: 2 }]);
	});

	it("backfills month claims from pre-2.0 day claims", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = distinctConfig();

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					trackedEvent("session.started", Date.UTC(2026, 0, 5, 6), "a", {
						actorId: "user-a",
						properties: { plan: "pro" },
					}),
				],
			},
		);

		// Simulate a pre-2.0 deployment: strip the month claims.
		await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyActorClaims").collect();
			for (const row of rows) {
				if (row.granularity === "month") {
					await ctx.db.delete("analyticsDailyActorClaims", row._id);
				}
			}
		});

		const result = await t.mutation(api.lib.backfillMonthActorClaims, {});
		expect(result.isDone).toBe(true);
		expect(result.ensured).toBe(2); // __total + plan dimension

		const monthClaims = await t.run(async (ctx) => {
			const rows = await ctx.db.query("analyticsDailyActorClaims").collect();
			return rows.filter((row) => row.granularity === "month").length;
		});
		expect(monthClaims).toBe(2);
	});
});

describe("data audit and prune", () => {
	it("reports orphaned metrics and prunes them, refusing live ones", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const oldConfig = internalPageViewsConfiguration();

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(oldConfig),
				events: [trackedEvent("page.viewed", Date.UTC(2026, 0, 10, 6), "v1")],
			},
		);

		// New config renames the metric — pageViews rows become ghosts.
		const newConfig = internalRuntimeConfiguration({
			events: [{ name: "page.viewed", label: "Page viewed" }],
			metrics: [
				{
					name: "views",
					label: "Views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
				},
			],
		});

		const audit = await t.query(api.lib.fetchDataAudit, {
			...internalAnalyticsConfigArgs(newConfig),
		});
		expect(audit.orphanedMetrics).toEqual(["pageViews"]);
		expect(audit.orphanedJourneys).toEqual([]);

		// Refuses metrics still in the config.
		await expect(
			t.mutation(api.lib.pruneAnalyticsData, {
				...internalAnalyticsConfigArgs(newConfig),
				metrics: ["views"],
			}),
		).rejects.toThrow(/still in the configuration/);

		const pruned = await t.mutation(api.lib.pruneAnalyticsData, {
			...internalAnalyticsConfigArgs(newConfig),
			metrics: ["pageViews"],
		});
		expect(pruned.deleted).toBeGreaterThan(0);

		const after = await t.query(api.lib.fetchDataAudit, {
			...internalAnalyticsConfigArgs(newConfig),
		});
		expect(after.orphanedMetrics).toEqual([]);
	});

	it("auto-prunes stale configuration rows on writeConfiguration", async () => {
		vi.useFakeTimers();
		try {
			const t = internalCreateAnalyticsComponentTest(modules);
			const configArgs = {
				events: [{ name: "page.viewed", label: "Page viewed" }] as Array<{
					name: string;
					label: string;
				}>,
			};

			vi.setSystemTime(Date.UTC(2026, 0, 1));
			await t.mutation(api.lib.writeConfiguration, {
				...configArgs,
				metrics: [
					{
						name: "pageViews",
						label: "Page views",
						unit: "count",
						eventNames: ["page.viewed"],
						aggregation: "count",
					},
				],
			});

			// 100 days later a changed config registers; the stale row goes.
			vi.setSystemTime(Date.UTC(2026, 3, 11));
			await t.mutation(api.lib.writeConfiguration, {
				...configArgs,
				metrics: [
					{
						name: "views",
						label: "Views",
						unit: "count",
						eventNames: ["page.viewed"],
						aggregation: "count",
					},
				],
			});

			const hashes = await t.run(async (ctx) => {
				const rows = await ctx.db.query("analyticsConfigurations").collect();
				return rows.length;
			});
			expect(hashes).toBe(1);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("ingestion health", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("reports pending backlog and oldest age for high-volume metrics", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
			events: [{ name: "event.tracked", label: "Event tracked" }],
			metrics: [
				{
					name: "events",
					label: "Events",
					unit: "count",
					eventNames: ["event.tracked"],
					aggregation: "count",
					trafficMode: "highVolume",
				},
			],
		});

		const healthyBefore = await t.query(api.lib.fetchIngestionHealth, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(healthyBefore.pendingAtLeast).toBe(0);
		expect(healthyBefore.oldestPendingAgeMs).toBeNull();

		const now = Date.now();
		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: Array.from({ length: 5 }, (_, index) =>
					trackedEvent("event.tracked", now - 60_000 + index, `hv-${index}`),
				),
			},
		);

		const health = await t.query(api.lib.fetchIngestionHealth, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(health.pendingAtLeast).toBe(5);
		expect(health.backlogExceedsCycle).toBe(false);
		expect(health.oldestPendingAgeMs).toBeGreaterThanOrEqual(60_000);
		expect(health.drainPerCycle).toBe(
			config.settings.highVolumeBatchSize *
				(1 + config.settings.highVolumeMaxCatchupBatches),
		);
	});
});

describe("adaptive write chunking", () => {
	it("plans merged writes and counts them", () => {
		const config = internalNormalizeConfig(
			internalRuntimeConfiguration({
				events: [
					{
						name: "page.viewed",
						label: "Page viewed",
						properties: { path: "string" },
					},
				],
				metrics: [
					{
						name: "views",
						label: "Views",
						unit: "count",
						eventNames: ["page.viewed"],
						aggregation: "count",
						dimensions: ["path"],
						trafficMode: "lowVolume",
					},
				],
			}),
		);

		const day = Date.UTC(2026, 0, 10, 6);
		const plan = internalPlanAggregateEvent(
			config,
			Array.from({ length: 10 }, (_, index) => ({
				eventId: `evt-${index}` as never,
				name: "page.viewed",
				occurredAt: day,
				properties: { path: `/p${index}` },
			})),
			"realtime",
		);

		// 10 unique paths: (1 total + 10 path) rows x day+month tiers = 22.
		expect(plan.increments).toHaveLength(22);
		expect(plan.plannedWrites).toBe(22);
	});
});

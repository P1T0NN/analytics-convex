/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import { previousAnalyticsDayRange } from "../../shared/utils/analyticsDateRangeUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics edge cases", () => {
	it("rejects config hash mismatches on first writeTrack", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
			events: [{ name: "feature.used", label: "Feature used" }],
			metrics: [
				{
					name: "featureUses",
					label: "Feature uses",
					unit: "count",
					eventNames: ["feature.used"],
					aggregation: "count",
				},
			],
		});

		await expect(
			t.mutation(api.lib.writeTrack, {
				...internalAnalyticsConfigArgs(config),
				configHash: "bad-hash",
				events: [{ name: "feature.used" }],
			}),
		).rejects.toThrow(/configHash/i);
	});

	it("deduplicates duplicate idempotency keys within a batch write", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = internalRuntimeConfiguration({
			events: [{ name: "feature.used", label: "Feature used" }],
			metrics: [
				{
					name: "featureUses",
					label: "Feature uses",
					unit: "count",
					eventNames: ["feature.used"],
					aggregation: "count",
				},
			],
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "feature.used",
						occurredAt: now,
						properties: {},
						source: { type: "server" },
						idempotencyKey: "duplicate-key",
					},
					{
						name: "feature.used",
						occurredAt: now + 1,
						properties: {},
						source: { type: "server" },
						idempotencyKey: "duplicate-key",
					},
				],
			},
		);

		const summary = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "featureUses",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});

		expect(summary.value).toBe(1);
	});

	it("returns non-overlapping comparison periods for dashboard metrics", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
			events: [{ name: "feature.used", label: "Feature used" }],
			metrics: [
				{
					name: "featureUses",
					label: "Feature uses",
					unit: "count",
					eventNames: ["feature.used"],
					aggregation: "count",
				},
			],
		});

		const from = Date.UTC(2026, 0, 1);
		const to = Date.UTC(2026, 0, 7);
		const { previous } = previousAnalyticsDayRange({ from, to });

		for (const [index, dayStart] of [
			previous.from,
			previous.from + DAY_MS,
			from,
			from + DAY_MS,
		].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [
						{
							name: "feature.used",
							occurredAt: dayStart + 1,
							properties: {},
							source: { type: "server" },
							idempotencyKey: `feature.used:comparison:${index}`,
						},
					],
				},
			);
		}

		const comparison = await t.query(api.lib.fetchMetricComparison, {
			...internalAnalyticsConfigArgs(config),
			metric: "featureUses",
			from,
			to,
		});

		expect(comparison.current).toBe(2);
		expect(comparison.previous).toBe(2);
		expect(comparison.range.previous.to).toBeLessThan(comparison.range.current.from);
	});

	it("purges actor claims together with stale rollups", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const old = Date.now() - 10 * DAY_MS;
		const config = internalRuntimeConfiguration({
			events: [{ name: "app.opened", label: "App opened" }],
			metrics: [
				{
					name: "dailyActiveUsers",
					label: "Daily active users",
					unit: "count",
					eventNames: ["app.opened"],
					aggregation: "distinctActors",
				},
			],
			settings: {
				rollupRetentionDays: 7,
				maxRollupDeletesPerRun: 100,
			},
		});

		await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [
					{
						name: "app.opened",
						occurredAt: old,
						actorId: "user-a",
						properties: {},
						source: { type: "server" },
						idempotencyKey: `app.opened:${old}`,
					},
				],
			},
		);

		expect(
			await t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "dailyActiveUsers",
				from: old - DAY_MS,
				to: old + DAY_MS,
			}),
		).toMatchObject({ value: 1 });

		await t.mutation(api.lib.purgeStaleAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});

		expect(
			await t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "dailyActiveUsers",
				from: old - DAY_MS,
				to: old + DAY_MS,
			}),
		).toMatchObject({ value: 0 });
	});
});

/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics retention", () => {
	it("purges rollup rows older than rollupRetentionDays", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const old = now - 10 * DAY_MS;
		const config = internalRuntimeConfiguration({
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
				rollupRetentionDays: 7,
				maxRollupDeletesPerRun: 100,
			},
		});

		await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
			...internalAnalyticsConfigArgs(config),
			events: [{
				name: "page.viewed",
				occurredAt: old,
				properties: {},
				source: { type: "server" },
				idempotencyKey: `page.viewed:${old}`,
			}],
		});

		const before = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: old - DAY_MS,
			to: old + DAY_MS,
		});
		expect(before.value).toBe(1);

		const purged = await t.mutation(api.lib.purgeStaleAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(purged.skipped).toBe(false);
		expect(purged.deleted).toBeGreaterThan(0);

		const after = await t.query(api.lib.fetchSummary, {
			...internalAnalyticsConfigArgs(config),
			metric: "pageViews",
			from: old - DAY_MS,
			to: old + DAY_MS,
		});
		expect(after.value).toBe(0);
	});

	it("skips rollup purge when rollupRetentionDays is 0", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
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
				rollupRetentionDays: 0,
			},
		});

		const result = await t.mutation(api.lib.purgeStaleAnalyticsRollups, {
			...internalAnalyticsConfigArgs(config),
		});
		expect(result).toEqual({
		deleted: 0,
		skipped: true,
		scheduledNextBatch: false,
	});
	});
});

describe("analytics dimension guard", () => {
	it("rejects high-cardinality dimension names when registering config", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "page.viewed",
					label: "Page viewed",
					properties: { userId: "string" },
				},
			],
			metrics: [
				{
					name: "pageViews",
					label: "Page views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
					dimensions: ["userId"],
				},
			],
		});

		await expect(
			t.mutation(api.lib.writeTrack, {
				...internalAnalyticsConfigArgs(config),
				events: [{ name: "page.viewed", properties: { userId: "user_1" } }],
			}),
		).rejects.toThrow(/high-cardinality/i);
	});
});

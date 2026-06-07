/// <reference types="vite/client" />

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../component/_generated/api";
import {
	DAY_MS,
	createAnalyticsComponentTest,
	pageViewsConfiguration,
	revenueConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

type AnalyticsTest = ReturnType<typeof createAnalyticsComponentTest>;

async function flushScheduledAnalytics(t: AnalyticsTest) {
	await t.finishAllScheduledFunctions(() => vi.runAllTimers());
}

describe("analytics unique events", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("deduplicates the same unique key across different timestamps", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();
		const now = Date.now();

		const first = await t.mutation(api.lib.writeTrack, {
			config,
			name: "page.viewed",
			occurredAt: now,
			unique: { key: "guestView:guest_1:hospitality_1" },
		});
		const second = await t.mutation(api.lib.writeTrack, {
			config,
			name: "page.viewed",
			occurredAt: now + DAY_MS,
			unique: { key: "guestView:guest_1:hospitality_1" },
		});

		expect(first).toEqual({ scheduled: true, scheduledCount: 1 });
		expect(second).toEqual({
			scheduled: false,
			scheduledCount: 0,
			deduped: true,
			dedupedCount: 1,
		});

		await flushScheduledAnalytics(t);

		const result = await t.query(api.lib.fetchSummary, {
			config,
			metric: "pageViews",
			from: now - DAY_MS,
			to: now + 2 * DAY_MS,
		});
		expect(result.value).toBe(1);
	});

	it("deduplicates repeated unique keys in a batch and accepts different keys", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();
		const now = Date.now();

		const result = await t.mutation(api.lib.writeTrack, {
			config,
			events: [
				{
					name: "page.viewed",
					occurredAt: now,
					unique: { key: "guestView:guest_1:hospitality_1" },
				},
				{
					name: "page.viewed",
					occurredAt: now + 1,
					unique: { key: "guestView:guest_1:hospitality_1" },
				},
				{
					name: "page.viewed",
					occurredAt: now + 2,
					unique: { key: "guestView:guest_2:hospitality_1" },
				},
			],
		});

		expect(result).toEqual({
			scheduled: true,
			scheduledCount: 2,
			deduped: true,
			dedupedCount: 1,
		});

		await flushScheduledAnalytics(t);

		const summary = await t.query(api.lib.fetchSummary, {
			config,
			metric: "pageViews",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(2);
	});

	it("continues to count non-unique events independently", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();
		const now = Date.now();

		await t.mutation(api.lib.writeTrack, {
			config,
			name: "page.viewed",
			occurredAt: now,
		});
		await t.mutation(api.lib.writeTrack, {
			config,
			name: "page.viewed",
			occurredAt: now + 1,
		});

		await flushScheduledAnalytics(t);

		const summary = await t.query(api.lib.fetchSummary, {
			config,
			metric: "pageViews",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(2);
	});

	it("does not double-count concurrent writes with the same unique key", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();
		const now = Date.now();

		const results = await Promise.all([
			t.mutation(api.lib.writeTrack, {
				config,
				name: "page.viewed",
				occurredAt: now,
				unique: { key: "activation:user_1:resource_1" },
			}),
			t.mutation(api.lib.writeTrack, {
				config,
				name: "page.viewed",
				occurredAt: now + 1,
				unique: { key: "activation:user_1:resource_1" },
			}),
		]);

		expect(results.filter((result) => result.scheduled)).toHaveLength(1);
		expect(results.filter((result) => result.deduped)).toHaveLength(1);

		await flushScheduledAnalytics(t);

		const summary = await t.query(api.lib.fetchSummary, {
			config,
			metric: "pageViews",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(1);
	});

	it("deduplicates high-volume events before pending aggregation", async () => {
		const t = createAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = revenueConfiguration({
			highVolumeBatchSize: 10,
			highVolumeShardCount: 1,
		});

		await t.mutation(api.lib.writeTrack, {
			config,
			name: "purchase.completed",
			occurredAt: now,
			properties: { amount: 10, plan: "pro" },
			unique: { key: "conversion:user_1:campaign_1" },
		});
		const duplicate = await t.mutation(api.lib.writeTrack, {
			config,
			name: "purchase.completed",
			occurredAt: now + DAY_MS,
			properties: { amount: 15, plan: "pro" },
			unique: { key: "conversion:user_1:campaign_1" },
		});

		expect(duplicate).toMatchObject({
			scheduled: false,
			deduped: true,
			dedupedCount: 1,
		});

		await flushScheduledAnalytics(t);

		const processed = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			{ config },
		);
		expect(processed.processed).toBe(1);

		const summary = await t.query(api.lib.fetchSummary, {
			config,
			metric: "revenue",
			from: now - DAY_MS,
			to: now + 2 * DAY_MS,
		});
		expect(summary.value).toBe(10);
	});
});

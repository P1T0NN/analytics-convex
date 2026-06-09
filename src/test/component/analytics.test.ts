/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {DAY_MS,
	internalCreateAnalyticsComponentTest,
	internalPageViewsConfiguration,
	internalRevenueConfiguration,
	internalRuntimeConfiguration, internalAnalyticsConfigArgs } from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics component", () => {
	it("reads runtime configuration back", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
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
					name: "pageViews",
					label: "Page views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
					dimensions: ["path"],
				},
			],
		});

		const result = await t.query(api.lib.fetchConfiguration, internalAnalyticsConfigArgs(config));
		expect(result.events).toHaveLength(1);
		expect(result.events[0].name).toBe("page.viewed");
		expect(result.metrics).toHaveLength(1);
		expect(result.metrics[0].name).toBe("pageViews");
		expect(result.configHash).toEqual(expect.any(String));
	});

	it("returns stable hashes for unchanged runtime configuration", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		const first = await t.query(api.lib.fetchConfiguration, internalAnalyticsConfigArgs(config));
		const second = await t.query(api.lib.fetchConfiguration, internalAnalyticsConfigArgs(config));

		expect(second.configHash).toBe(first.configHash);

		const changedConfig = internalRuntimeConfiguration({
			events: config.events,
			metrics: [
				{
					...config.metrics[0],
					label: "Page views total",
				},
			],
		});
		const third = await t.query(api.lib.fetchConfiguration, internalAnalyticsConfigArgs(changedConfig));

		expect(third.configHash).not.toBe(first.configHash);
	});

	it("tracks an event and queries the summary", async () => {
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

		// Write event directly (bypass scheduler for test determinism)
		const now = Date.now();
		await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
			...internalAnalyticsConfigArgs(config),
			events: [{
				name: "feature.used",
				occurredAt: now,
				properties: {},
				source: { type: "server" },
				idempotencyKey: `feature.used:${now}:server::`,
			}],
		});

		// Query summary
		const result = await t.query(api.lib.fetchSummary, { ...internalAnalyticsConfigArgs(config), metric: "featureUses",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result.value).toBe(1);
		expect(result.metric).toBe("featureUses");
		expect(result.label).toBe("Feature uses");
		expect(result.unit).toBe("count");
	});

	it("queries dimension helper reads through component queries", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const ownerScopeId = "hospitalityOwner:user_123";
		const config = internalRuntimeConfiguration({
			events: [
				{
					name: "reservation.created",
					label: "Reservation created",
					properties: { hospitalityId: "string" },
				},
			],
			metrics: [
				{
					name: "newReservations",
					label: "New reservations",
					unit: "count",
					eventNames: ["reservation.created"],
					aggregation: "count",
					dimensions: ["hospitalityId"],
				},
			],
		});

		for (const [index, hospitalityId] of ["h1", "h1", "h2"].entries()) {
			await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [{
						name: "reservation.created",
						occurredAt: now + index,
						organizationId: ownerScopeId,
						properties: { hospitalityId },
						source: { type: "server" },
						idempotencyKey: `reservation.created:${now}:${index}`,
					}],
				},
			);
		}

		const totals = await t.query(api.lib.fetchMetricTotalsByDimension, { ...internalAnalyticsConfigArgs(config), metric: "newReservations",
			scope: { type: "organization", id: ownerScopeId },
			dimensionKey: "hospitalityId",
			days: 30,
		});

		expect(totals).toEqual([
			{ key: "h1", value: 2 },
			{ key: "h2", value: 1 },
		]);

		const top = await t.query(api.lib.fetchTopDimensionValue, { ...internalAnalyticsConfigArgs(config), metric: "newReservations",
			scope: { type: "organization", id: ownerScopeId },
			dimensionKey: "hospitalityId",
		});

		expect(top).toBe("h1");
	});

	it("deduplicates events with same idempotency key", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		const now = Date.now();
		const idempotencyKey = `page.viewed:${now}:server::`;

		// Write twice with same key
		await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
			...internalAnalyticsConfigArgs(config),
			events: [{
				name: "page.viewed",
				occurredAt: now,
				properties: {},
				source: { type: "server" },
				idempotencyKey,
			}],
		});

		const second = await t.mutation(
			internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
			{
				...internalAnalyticsConfigArgs(config),
				events: [{
					name: "page.viewed",
					occurredAt: now,
					properties: {},
					source: { type: "server" },
					idempotencyKey,
				}],
			},
		);

		expect(second.duplicates).toBe(1);

		// Should only count once
		const result = await t.query(api.lib.fetchSummary, { ...internalAnalyticsConfigArgs(config), metric: "pageViews",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result.value).toBe(1);
	});

	it("batch-aggregates high-volume events without changing totals", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const config = internalRevenueConfiguration({
			highVolumeShardCount: 1,
			highVolumeBatchSize: 10,
		});

		for (const [index, amount] of [10, 15].entries()) {
			const result = await t.mutation(
				internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent,
				{
					...internalAnalyticsConfigArgs(config),
					events: [{
						name: "purchase.completed",
						occurredAt: now + index,
						properties: { amount, plan: "pro" },
						source: { type: "server" },
						idempotencyKey: `purchase.completed:${now}:${index}`,
					}],
				},
			);

			expect(result.pendingHighVolume).toBe(1);
		}

		const before = await t.query(api.lib.fetchSummary, { ...internalAnalyticsConfigArgs(config), metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(before.value).toBe(0);

		const processed = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			internalAnalyticsConfigArgs(config),
		);
		expect(processed).toMatchObject({
			processed: 2,
			scheduledNextBatch: false,
		});

		const summary = await t.query(api.lib.fetchSummary, { ...internalAnalyticsConfigArgs(config), metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
		});
		expect(summary.value).toBe(25);

		const breakdown = await t.query(api.lib.fetchBreakdown, { ...internalAnalyticsConfigArgs(config), metric: "revenue",
			from: now - DAY_MS,
			to: now + DAY_MS,
			groupBy: "plan",
		});
		expect(breakdown.data).toEqual([{ key: "pro", value: 25 }]);
	});

	it("purges only stale non-pending raw events", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const now = Date.now();
		const old = now - 2 * DAY_MS;
		const config = internalRuntimeConfiguration({
			events: [
				{ name: "page.viewed", label: "Page viewed" },
				{ name: "video.played", label: "Video played" },
			],
			metrics: [
				{
					name: "pageViews",
					label: "Page views",
					unit: "count",
					eventNames: ["page.viewed"],
					aggregation: "count",
				},
				{
					name: "videoPlays",
					label: "Video plays",
					unit: "count",
					eventNames: ["video.played"],
					aggregation: "count",
					trafficMode: "highVolume",
				},
			],
			settings: {
				rawEventRetentionDays: 1,
				maxRawEventDeletesPerRun: 10,
				highVolumeBatchSize: 10,
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

		await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
			...internalAnalyticsConfigArgs(config),
			events: [{
				name: "video.played",
				occurredAt: old,
				properties: {},
				source: { type: "server" },
				idempotencyKey: `video.played:${old}`,
			}],
		});

		const firstPurge = await t.mutation(api.lib.purgeStaleAnalyticsEvents, { ...internalAnalyticsConfigArgs(config), });
		expect(firstPurge.deleted).toBe(1);

		const processed = await t.mutation(
			api.lib.processPendingHighVolumeAnalyticsEvents,
			internalAnalyticsConfigArgs(config),
		);
		expect(processed.processed).toBe(1);

		const secondPurge = await t.mutation(api.lib.purgeStaleAnalyticsEvents, { ...internalAnalyticsConfigArgs(config), });
		expect(secondPurge.deleted).toBe(1);
	});
});

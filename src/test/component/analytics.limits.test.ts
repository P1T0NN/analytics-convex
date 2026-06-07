/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api } from "../../component/_generated/api";
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits";
import {
	createAnalyticsComponentTest,
	pageViewsConfiguration,
	runtimeConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics hard limits", () => {
	it("rejects metric configs with too many dimensions", async () => {
		const t = createAnalyticsComponentTest(modules);
		const dimensions = Array.from(
			{ length: ANALYTICS_LIMITS.maxDimensionsPerMetric + 1 },
			(_, index) => `dimension${index}`,
		);
		const properties = Object.fromEntries(
			dimensions.map((dimension) => [dimension, "string"]),
		) as Record<string, "string">;

		await expect(
			t.mutation(api.lib.writeConfiguration, {
				events: [
					{
						name: "feature.used",
						label: "Feature used",
						properties,
					},
				],
				metrics: [
					{
						name: "featureUses",
						label: "Feature uses",
						unit: "count",
						eventNames: ["feature.used"],
						aggregation: "count",
						dimensions,
					},
				],
			}),
		).rejects.toThrow(/dimensions/);
	});

	it("allows mixed-event count metrics when a dimension exists on one event", async () => {
		const t = createAnalyticsComponentTest(modules);

		const config = runtimeConfiguration({
			events: [
				{
					name: "trial.started",
					label: "Trial started",
					properties: { plan: "string" },
				},
				{
					name: "invite.sent",
					label: "Invite sent",
				},
			],
			metrics: [
				{
					name: "activationSignals",
					label: "Activation signals",
					unit: "count",
					eventNames: ["trial.started", "invite.sent"],
					aggregation: "count",
					dimensions: ["plan"],
				},
			],
		});

		const result = await t.query(api.lib.fetchConfiguration, { config });
		expect(result.metrics[0].dimensions).toEqual(["plan"]);
	});

	it("rejects unsafe runtime settings", async () => {
		const t = createAnalyticsComponentTest(modules);

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
					maxBreakdownItems: ANALYTICS_LIMITS.maxBreakdownItems + 1,
				},
			}),
		).rejects.toThrow(/maxBreakdownItems/);
	});

	it("rejects batches larger than the hard batch limit", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();

		const events = Array.from(
			{ length: ANALYTICS_LIMITS.maxTrackBatchSize + 1 },
			(_, index) => ({
				name: "page.viewed",
				occurredAt: Date.now() + index,
			}),
		);

		await expect(
			t.mutation(api.lib.writeTrack, { config, events }),
		).rejects.toThrow(/events/);
	});

	it("rejects oversized property payloads", async () => {
		const t = createAnalyticsComponentTest(modules);

		const config = runtimeConfiguration({
			events: [
				{
					name: "note.created",
					label: "Note created",
					properties: { body: "string" },
				},
			],
			metrics: [
				{
					name: "notes",
					label: "Notes",
					unit: "count",
					eventNames: ["note.created"],
					aggregation: "count",
				},
			],
		});

		await expect(
			t.mutation(api.lib.writeTrack, {
				config,
				name: "note.created",
				properties: {
					body: "x".repeat(ANALYTICS_LIMITS.maxPropertyStringLength + 1),
				},
			}),
		).rejects.toThrow(/body/);
	});

	it("rejects invalid unique event configuration", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = pageViewsConfiguration();

		await expect(
			t.mutation(api.lib.writeTrack, {
				config,
				name: "page.viewed",
				unique: { key: "" },
			}),
		).rejects.toThrow(/unique\.key/);

		await expect(
			t.mutation(api.lib.writeTrack, {
				config,
				name: "page.viewed",
				unique: {
					key: "x".repeat(ANALYTICS_LIMITS.maxUniqueKeyLength + 1),
				},
			}),
		).rejects.toThrow(/unique\.key/);

		await expect(
			t.mutation(api.lib.writeTrack, {
				config,
				name: "page.viewed",
				unique: {
					key: "daily:user_1",
					scope: "daily" as "forever",
				},
			}),
		).rejects.toThrow(/forever/);
	});
});

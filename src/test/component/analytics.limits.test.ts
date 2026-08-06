/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api } from "../../component/_generated/api";
import { ANALYTICS_LIMITS } from "../../shared/constants.js";
import {
	DAY_MS,
	internalAnalyticsConfigArgs,
	internalCreateAnalyticsComponentTest,
	internalPageViewsConfiguration,
	internalRuntimeConfiguration,
} from "../../testUtils/componentTestUtils";
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils.js";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics hard limits", () => {
	it("rejects metric configs with too many dimensions", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
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
		const t = internalCreateAnalyticsComponentTest(modules);

		const config = internalRuntimeConfiguration({
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

		const result = await t.query(api.lib.fetchConfiguration, internalAnalyticsConfigArgs(config));
		expect(result.metrics[0].dimensions).toEqual(["plan"]);
	});

	it("rejects unsafe runtime settings", async () => {
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
					maxBreakdownItems: ANALYTICS_LIMITS.maxBreakdownItems + 1,
				},
			}),
		).rejects.toThrow(/maxBreakdownItems/);
	});

	it("caps the query range at one year and still allows a single day", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();
		const today = startOfUtcDay(Date.UTC(2026, 0, 10));

		expect(ANALYTICS_LIMITS.maxQueryRangeDays).toBe(366);

		// Settings cannot raise the ceiling.
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
					maxQueryRangeDays: ANALYTICS_LIMITS.maxQueryRangeDays + 1,
				},
			}),
		).rejects.toThrow(/maxQueryRangeDays/);

		// Today-only stays valid — there is no minimum range.
		await expect(
			t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "pageViews",
				from: today,
				to: today,
			}),
		).resolves.toMatchObject({ value: 0 });

		// 366 days inclusive is allowed, 367 is not.
		await expect(
			t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "pageViews",
				from: today - 365 * DAY_MS,
				to: today,
			}),
		).resolves.toMatchObject({ value: 0 });

		await expect(
			t.query(api.lib.fetchSummary, {
				...internalAnalyticsConfigArgs(config),
				metric: "pageViews",
				from: today - 366 * DAY_MS,
				to: today,
			}),
		).rejects.toThrow(/limited to 366 days/);
	});

	it("rejects batches larger than the hard batch limit", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		const events = Array.from(
			{ length: ANALYTICS_LIMITS.maxTrackBatchSize + 1 },
			(_, index) => ({
				name: "page.viewed",
				occurredAt: Date.now() + index,
			}),
		);

		await expect(
			t.mutation(api.lib.writeTrack, { ...internalAnalyticsConfigArgs(config), events }),
		).rejects.toThrow(/events/);
	});

	it("rejects oversized property payloads", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		const config = internalRuntimeConfiguration({
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
			...internalAnalyticsConfigArgs(config),
			events: [{ name: "note.created",
				properties: {
					body: "x".repeat(ANALYTICS_LIMITS.maxPropertyStringLength + 1),
				},
			}],
		}),
		).rejects.toThrow(/body/);
	});

	it("rejects invalid unique event configuration", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalPageViewsConfiguration();

		await expect(
			t.mutation(api.lib.writeTrack, {
			...internalAnalyticsConfigArgs(config),
			events: [{ name: "page.viewed",
				unique: { key: "" },
			}],
		}),
		).rejects.toThrow(/unique\.key/);

		await expect(
			t.mutation(api.lib.writeTrack, {
			...internalAnalyticsConfigArgs(config),
			events: [{ name: "page.viewed",
				unique: {
					key: "x".repeat(ANALYTICS_LIMITS.maxUniqueKeyLength + 1),
				},
			}],
		}),
		).rejects.toThrow(/unique\.key/);

		await expect(
			t.mutation(api.lib.writeTrack, {
			...internalAnalyticsConfigArgs(config),
			events: [{ name: "page.viewed",
				unique: {
					key: "daily:user_1",
					scope: "daily" as "forever",
				},
			}],
		}),
		).rejects.toThrow(/forever/);
	});

	it("rejects invalid goal evaluation configs", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await expect(
			t.mutation(api.lib.writeConfiguration, {
				events: [{ name: "qr.scanned", label: "QR scanned" }],
				metrics: [
					{
						name: "qrScans",
						label: "QR scans",
						unit: "count",
						eventNames: ["qr.scanned"],
						aggregation: "count",
						evaluation: {
							kind: "goal",
							targetValue: 0,
							excellentPercentOfGoal: 100,
							goodPercentOfGoal: 75,
							badPercentOfGoal: 50,
						},
					},
				],
			}),
		).rejects.toThrow(/targetValue must be > 0/);

		await expect(
			t.mutation(api.lib.writeConfiguration, {
				events: [{ name: "qr.scanned", label: "QR scanned" }],
				metrics: [
					{
						name: "qrScans",
						label: "QR scans",
						unit: "count",
						eventNames: ["qr.scanned"],
						aggregation: "count",
						evaluation: {
							kind: "goal",
							targetValue: 500,
							excellentPercentOfGoal: 50,
							goodPercentOfGoal: 75,
							badPercentOfGoal: 40,
						},
					},
				],
			}),
		).rejects.toThrow(/excellentPercentOfGoal must be >= goodPercentOfGoal/);
	});
});

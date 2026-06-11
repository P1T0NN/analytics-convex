/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {internalCreateAnalyticsComponentTest,
	internalRuntimeConfiguration, internalAnalyticsConfigArgs } from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

function hospitalityConfig() {
	return internalRuntimeConfiguration({
		events: [
			{ name: "qr.scanned", label: "QR scanned" },
			{ name: "guest.activated", label: "Guest activated" },
			{ name: "reservation.created", label: "Reservation created" },
			{ name: "reservation.cancelled", label: "Reservation cancelled" },
		],
		metrics: [
			{
				name: "qrScans",
				label: "QR scans",
				unit: "count",
				eventNames: ["qr.scanned"],
				aggregation: "count",
			},
			{
				name: "guestActivations",
				label: "Guest activations",
				unit: "count",
				eventNames: ["guest.activated"],
				aggregation: "count",
				evaluation: {
					kind: "conversion",
					denominatorMetric: "qrScans",
					excellentRatePercent: 50,
					goodRatePercent: 20,
					badRatePercent: 10,
					minDenominator: 5,
				},
			},
			{
				name: "newReservations",
				label: "New reservations",
				unit: "count",
				eventNames: ["reservation.created"],
				aggregation: "count",
				evaluation: {
					kind: "comparison",
					excellentGrowthPercent: 25,
					goodGrowthPercent: 5,
					badGrowthPercent: -5,
					minVolumeForComparison: 10,
				},
			},
			{
				name: "cancelledReservations",
				label: "Cancelled reservations",
				unit: "count",
				eventNames: ["reservation.cancelled"],
				aggregation: "count",
				evaluation: {
					kind: "inverseRate",
					denominatorMetric: "newReservations",
					goodRatePercent: 10,
					badRatePercent: 25,
				},
			},
		],
	});
}

async function writeEvent(
	t: ReturnType<typeof internalCreateAnalyticsComponentTest>,
	config: ReturnType<typeof hospitalityConfig>,
	name: string,
	occurredAt: number,
) {
	await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
		...internalAnalyticsConfigArgs(config),
		events: [{
			name,
			occurredAt,
			properties: {},
			source: { type: "server" },
			idempotencyKey: `${name}:${occurredAt}`,
		}],
	});
}

describe("analytics metric evaluation queries", () => {
	it("computes rollup-based metric conversion", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = hospitalityConfig();
		const now = Date.now();

		for (let index = 0; index < 10; index += 1) {
			await writeEvent(t, config, "qr.scanned", now + index);
		}
		for (let index = 0; index < 6; index += 1) {
			await writeEvent(t, config, "guest.activated", now + index);
		}

		const result = await t.query(api.lib.fetchMetricConversion, { ...internalAnalyticsConfigArgs(config), numeratorMetric: "guestActivations",
			denominatorMetric: "qrScans",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result.numerator).toBe(6);
		expect(result.denominator).toBe(10);
		expect(result.ratePercent).toBe(60);
	});

	it("evaluates conversion and inverse-rate metric labels", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = hospitalityConfig();
		const now = Date.now();

		for (let index = 0; index < 10; index += 1) {
			await writeEvent(t, config, "qr.scanned", now + index);
			await writeEvent(t, config, "guest.activated", now + index);
		}
		for (let index = 0; index < 2; index += 1) {
			await writeEvent(t, config, "reservation.cancelled", now + index);
		}
		for (let index = 0; index < 20; index += 1) {
			await writeEvent(t, config, "reservation.created", now + index);
		}

		const activation = await t.query(api.lib.fetchMetricEvaluation, { ...internalAnalyticsConfigArgs(config), metric: "guestActivations",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});
		expect(activation.evaluation).toEqual({
			label: "excellent",
			reason: "conversion_rate",
			sentiment: "positive",
		});
		expect(activation.conversion).toMatchObject({
			numerator: 10,
			denominator: 10,
			ratePercent: 100,
			denominatorMetric: "qrScans",
		});

		const cancellations = await t.query(api.lib.fetchMetricEvaluation, { ...internalAnalyticsConfigArgs(config), metric: "cancelledReservations",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});
		expect(cancellations.evaluation).toEqual({
			label: "good",
			reason: "inverse_rate",
			sentiment: "positive",
		});
	});

	it("returns neutral when comparison volume is below the configured minimum", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = hospitalityConfig();
		const now = Date.now();
		const previous = now - 7 * 86_400_000;

		await writeEvent(t, config, "reservation.created", previous);
		await writeEvent(t, config, "reservation.created", now);
		await writeEvent(t, config, "reservation.created", now + 1);
		await writeEvent(t, config, "reservation.created", now + 2);

		const result = await t.query(api.lib.fetchMetricEvaluation, { ...internalAnalyticsConfigArgs(config), metric: "newReservations",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result.evaluation).toEqual({
			label: "neutral",
			reason: "below_min_volume",
			sentiment: "neutral",
		});
	});

	it("evaluates goal metric labels and returns goal block", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = internalRuntimeConfiguration({
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
						excellentPercentOfGoal: 100,
						goodPercentOfGoal: 75,
						badPercentOfGoal: 50,
					},
				},
			],
		});
		const now = Date.now();

		for (let index = 0; index < 375; index += 1) {
			await writeEvent(t, config, "qr.scanned", now + index);
		}

		const result = await t.query(api.lib.fetchMetricEvaluation, { ...internalAnalyticsConfigArgs(config), metric: "qrScans",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result.value).toBe(375);
		expect(result.evaluation).toEqual({
			label: "good",
			reason: "goal_progress",
			sentiment: "positive",
		});
		expect(result.goal).toEqual({
			targetValue: 500,
			value: 375,
			percentOfGoal: 75,
		});
	});
});

describe("per-scope metric evaluation overrides", () => {
	function goalConfig() {
		return internalRuntimeConfiguration({
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
						excellentPercentOfGoal: 100,
						goodPercentOfGoal: 75,
						badPercentOfGoal: 50,
					},
				},
			],
		});
	}

	async function writeOrgEvent(
		t: ReturnType<typeof internalCreateAnalyticsComponentTest>,
		config: ReturnType<typeof goalConfig>,
		occurredAt: number,
		organizationId: string,
	) {
		await t.mutation(internal.helpers.internalWriteAnalyticsEvent.internalWriteAnalyticsEvent, {
			...internalAnalyticsConfigArgs(config),
			events: [{
				name: "qr.scanned",
				occurredAt,
				organizationId,
				properties: {},
				source: { type: "server" },
				idempotencyKey: `qr.scanned:${organizationId}:${occurredAt}`,
			}],
		});
	}

	it("uses the scope override for evaluation and leaves other scopes on the static config", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = goalConfig();
		const now = Date.now();
		const orgScope = { type: "organization" as const, id: "org1" };
		const range = { from: now - 86_400_000, to: now + 86_400_000 };

		for (let index = 0; index < 100; index += 1) {
			await writeOrgEvent(t, config, now + index, "org1");
		}

		await t.mutation(api.lib.writeMetricEvaluationOverride, {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			scope: orgScope,
			evaluation: {
				kind: "goal",
				targetValue: 100,
				excellentPercentOfGoal: 100,
				goodPercentOfGoal: 75,
				badPercentOfGoal: 50,
			},
		});

		const orgResult = await t.query(api.lib.fetchMetricEvaluation, {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			scope: orgScope,
			...range,
		});
		expect(orgResult.evaluation).toEqual({
			label: "excellent",
			reason: "goal_progress",
			sentiment: "positive",
		});
		expect(orgResult.goal).toEqual({
			targetValue: 100,
			value: 100,
			percentOfGoal: 100,
		});

		const globalResult = await t.query(api.lib.fetchMetricEvaluation, {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			...range,
		});
		expect(globalResult.evaluation).toEqual({
			label: "bad",
			reason: "goal_progress",
			sentiment: "negative",
		});
		expect(globalResult.goal).toMatchObject({ targetValue: 500 });
	});

	it("applies overrides in dashboard metrics and exposes the effective config", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = goalConfig();
		const now = Date.now();
		const orgScope = { type: "organization" as const, id: "org1" };

		for (let index = 0; index < 100; index += 1) {
			await writeOrgEvent(t, config, now + index, "org1");
		}

		await t.mutation(api.lib.writeMetricEvaluationOverride, {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			scope: orgScope,
			evaluation: {
				kind: "goal",
				targetValue: 100,
				excellentPercentOfGoal: 100,
				goodPercentOfGoal: 75,
				badPercentOfGoal: 50,
			},
		});

		const dashboard = await t.query(api.lib.fetchDashboardMetrics, {
			...internalAnalyticsConfigArgs(config),
			metrics: ["qrScans"],
			scope: orgScope,
			from: now - 86_400_000,
			to: now + 86_400_000,
			includeEvaluation: true,
		});
		expect(dashboard.metrics.qrScans.evaluation).toEqual({
			label: "excellent",
			reason: "goal_progress",
			sentiment: "positive",
		});
		expect(dashboard.metrics.qrScans.goal).toMatchObject({ targetValue: 100 });

		const effective = await t.query(api.lib.fetchMetricEvaluationConfig, {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			scope: orgScope,
		});
		expect(effective.source).toBe("override");
		expect(effective.evaluation).toMatchObject({ kind: "goal", targetValue: 100 });
		expect(effective.configEvaluation).toMatchObject({
			kind: "goal",
			targetValue: 500,
		});
	});

	it("clears an override with null and falls back to the static config", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = goalConfig();
		const orgScope = { type: "organization" as const, id: "org1" };
		const overrideArgs = {
			...internalAnalyticsConfigArgs(config),
			metric: "qrScans",
			scope: orgScope,
		};

		await t.mutation(api.lib.writeMetricEvaluationOverride, {
			...overrideArgs,
			evaluation: {
				kind: "goal",
				targetValue: 100,
				excellentPercentOfGoal: 100,
				goodPercentOfGoal: 75,
				badPercentOfGoal: 50,
			},
		});
		await t.mutation(api.lib.writeMetricEvaluationOverride, {
			...overrideArgs,
			evaluation: null,
		});

		const effective = await t.query(api.lib.fetchMetricEvaluationConfig, overrideArgs);
		expect(effective.source).toBe("config");
		expect(effective.evaluation).toMatchObject({ kind: "goal", targetValue: 500 });
	});

	it("rejects overrides that reference unknown denominator metrics", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);
		const config = goalConfig();

		await expect(
			t.mutation(api.lib.writeMetricEvaluationOverride, {
				...internalAnalyticsConfigArgs(config),
				metric: "qrScans",
				scope: { type: "organization" as const, id: "org1" },
				evaluation: {
					kind: "conversion",
					denominatorMetric: "doesNotExist",
					excellentRatePercent: 50,
					goodRatePercent: 20,
					badRatePercent: 10,
				},
			}),
		).rejects.toThrow(/unknown denominator metric/);
	});
});

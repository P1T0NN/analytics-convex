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
		});
		expect(result.goal).toEqual({
			targetValue: 500,
			value: 375,
			percentOfGoal: 75,
		});
	});
});

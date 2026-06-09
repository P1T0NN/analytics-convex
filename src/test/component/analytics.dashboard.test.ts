/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "../../component/_generated/api";
import {
	createAnalyticsComponentTest,
	runtimeConfiguration,
} from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

function hospitalityConfig() {
	return runtimeConfiguration({
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
		funnels: {
			guestActivation: {
				label: "Scan to activation",
				steps: ["qrScans", "guestActivations"],
			},
			reservationFlow: {
				label: "Activation to reservation",
				steps: ["guestActivations", "newReservations"],
			},
		},
	});
}

async function writeEvent(
	t: ReturnType<typeof createAnalyticsComponentTest>,
	config: ReturnType<typeof hospitalityConfig>,
	name: string,
	occurredAt: number,
) {
	await t.mutation(internal.helpers.writeAnalyticsEvent.writeAnalyticsEvent, {
		config,
		name,
		occurredAt,
		properties: {},
		source: { type: "server" },
		idempotencyKey: `${name}:${occurredAt}`,
	});
}

describe("analytics dashboard and funnel queries", () => {
	it("batch-reads dashboard metrics with comparison and evaluation", async () => {
		const t = createAnalyticsComponentTest(modules);
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

		const result = await t.query(api.lib.fetchDashboardMetrics, {
			config,
			metrics: [
				"qrScans",
				"guestActivations",
				"newReservations",
				"cancelledReservations",
			],
			from: now - 86_400_000,
			to: now + 86_400_000,
			includeComparison: true,
			includeEvaluation: true,
		});

		expect(result.metrics.qrScans).toMatchObject({
			value: 10,
			label: "QR scans",
			comparison: {
				current: 10,
				previous: 0,
				delta: 10,
			},
		});
		expect(result.metrics.guestActivations).toMatchObject({
			value: 10,
			evaluation: {
				label: "excellent",
				reason: "conversion_rate",
			},
			conversion: {
				numerator: 10,
				denominator: 10,
				ratePercent: 100,
				denominatorMetric: "qrScans",
			},
		});
		expect(result.metrics.cancelledReservations).toMatchObject({
			value: 2,
			evaluation: {
				label: "good",
				reason: "inverse_rate",
			},
		});
	});

	it("computes named funnel conversion from first to last step", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = hospitalityConfig();
		const now = Date.now();

		for (let index = 0; index < 10; index += 1) {
			await writeEvent(t, config, "qr.scanned", now + index);
		}
		for (let index = 0; index < 4; index += 1) {
			await writeEvent(t, config, "guest.activated", now + index);
		}

		const result = await t.query(api.lib.fetchFunnelConversion, {
			config,
			funnel: "guestActivation",
			from: now - 86_400_000,
			to: now + 86_400_000,
		});

		expect(result).toMatchObject({
			funnel: "guestActivation",
			label: "Scan to activation",
			steps: ["qrScans", "guestActivations"],
			numeratorMetric: "guestActivations",
			denominatorMetric: "qrScans",
			numerator: 4,
			denominator: 10,
			ratePercent: 40,
		});
	});

	it("rejects duplicate metrics in dashboard batch requests", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = hospitalityConfig();
		const now = Date.now();

		await expect(
			t.query(api.lib.fetchDashboardMetrics, {
				config,
				metrics: ["qrScans", "qrScans"],
				from: now - 86_400_000,
				to: now + 86_400_000,
			}),
		).rejects.toThrow(/Duplicate metric/);
	});
});

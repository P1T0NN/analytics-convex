import { describe, expect, it } from "vitest";
import type { ComponentApi } from "../../../component/_generated/component";

// API
import { defineAnalytics } from "../../../client/api/defineAnalytics";

// BUILDERS
import { event } from "../../../client/builders/event";
import { property } from "../../../client/builders/property";

describe("defineAnalytics", () => {
	it("returns server wrappers at top level and client exports under .client", () => {
		const component = {} as ComponentApi;
		const events = {
			productAdded: event("product.added", {
				label: "Product added",
				properties: {
					category: property.string({ required: true }),
					price: property.number(),
					currency: property.string(),
				},
			}),
		};

		const analytics = defineAnalytics(component, {
			events,
			metrics: ({ count, sum }) => ({
				productsAdded: count("Products added")
					.from("product.added")
					.by("category"),
				productValueAdded: sum("Product value added", "currency")
					.from("product.added")
					.value("price")
					.by("category", "currency"),
			}),
		});
		type TotalsInput = Parameters<
			typeof analytics.fetchMetricTotalsByDimension<"productsAdded">
		>[1];
		const validTotalsInput: TotalsInput = {
			metric: "productsAdded",
			dimensionKey: "category",
		};
		const _invalidTotalsInput: TotalsInput = {
			metric: "productsAdded",
			// @ts-expect-error dimensionKey must be a configured dimension.
			dimensionKey: "currency",
		};

		// Server wrappers (top-level) - callable with ctx
		expect(analytics.track).toBeDefined();
		expect(analytics.writeTrack).toBeDefined();
		expect(analytics.writeConfiguration).toBeDefined();
		expect(analytics.fetchSummary).toBeDefined();
		expect(analytics.fetchTimeSeries).toBeDefined();
		expect(analytics.fetchBreakdown).toBeDefined();
		expect(analytics.fetchMetricComparison).toBeDefined();
		expect(analytics.fetchMetricTotalsByDimension).toBeDefined();
		expect(analytics.fetchTopDimensionValue).toBeDefined();
		expect(validTotalsInput.dimensionKey).toBe("category");

		// Client exports (under .client) - registered Convex functions only
		expect(analytics.client.writeTrack).toBeDefined();
		expect(analytics.client.writeConfiguration).toBeDefined();
		expect(analytics.client.breakdown).toBeDefined();
		expect(analytics.client.summary).toBeDefined();
		expect(analytics.client.timeSeries).toBeDefined();
		expect(analytics.client.metricComparison).toBeDefined();
		expect(analytics.client.journeyConversion).toBeDefined();
		expect(analytics.client.metricTotalsByDimension).toBeDefined();
		expect(analytics.client.topDimensionValue).toBeDefined();
		expect(analytics.client).not.toHaveProperty("track");
		expect(analytics.client).not.toHaveProperty("fetchSummary");
		expect(analytics.crons.processPendingHighVolumeAnalyticsEvents).toBeDefined();
		expect(analytics.crons.purgeStaleAnalyticsEvents).toBeDefined();
		expect(analytics.crons.purgeStaleAnalyticsRollups).toBeDefined();
		expect(analytics.registerCrons).toBeDefined();
	});
});

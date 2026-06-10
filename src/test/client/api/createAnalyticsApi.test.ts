import { describe, expect, it, vi } from "vitest";
import type { ComponentApi } from "../../../component/_generated/component";

// API
import { createAnalyticsApi } from "../../../client/api/createAnalyticsApi";
import { defineAnalytics } from "../../../client/api/defineAnalytics";

// BUILDERS
import { event } from "../../../client/builders/event";
import { property } from "../../../client/builders/property";

function buildAnalytics(component: ComponentApi) {
	return defineAnalytics(component, {
		events: {
			productAdded: event("product.added", {
				label: "Product added",
				properties: {
					category: property.string({ required: true }),
					price: property.number(),
				},
			}),
		},
		metrics: ({ count }) => ({
			productsAdded: count("Products added")
				.from("product.added")
				.by("category"),
		}),
	});
}

describe("createAnalyticsApi", () => {
	it("returns only registered Convex functions", () => {
		const component = {} as ComponentApi;
		const client = createAnalyticsApi(component, {
			events: [
				{
					name: "product.added",
					label: "Product added",
					properties: { category: "string", price: "number" },
					requiredProperties: ["category"],
				},
			] as const,
			metrics: [
				{
					name: "productsAdded",
					label: "Products added",
					unit: "count",
					eventNames: ["product.added"],
					aggregation: "count",
					dimensions: ["category"],
				},
			] as const,
		});

		// Registered functions safe to re-export from a convex module.
		expect(client.writeConfiguration).toBeDefined();
		expect(client.writeTrack).toBeDefined();
		expect(client.timeSeries).toBeDefined();
		expect(client.summary).toBeDefined();
		expect(client.breakdown).toBeDefined();
		expect(client.metricComparison).toBeDefined();
		expect(client.metricConversion).toBeDefined();
		expect(client.metricEvaluation).toBeDefined();
		expect(client.dashboardMetrics).toBeDefined();
		expect(client.funnelConversion).toBeDefined();
		expect(client.journeyConversion).toBeDefined();
		expect(client.metricTotalsByDimension).toBeDefined();
		expect(client.topDimensionValue).toBeDefined();

		// Plain helpers live on the defineAnalytics() result, not on .client.
		expect(client).not.toHaveProperty("track");
		expect(client).not.toHaveProperty("fetchSummary");
		expect(client).not.toHaveProperty("configure");
	});

	it("exposes typed server helpers on the defineAnalytics result", () => {
		const component = {} as ComponentApi;
		const analytics = buildAnalytics(component);

		type ProductAddedInput = Parameters<
			typeof analytics.track<"product.added">
		>[2];
		type SummaryInput = Parameters<
			typeof analytics.fetchSummary<"productsAdded">
		>[1];
		type TotalsInput = Parameters<
			typeof analytics.fetchMetricTotalsByDimension<"productsAdded">
		>[1];
		const validInput: ProductAddedInput = {
			properties: {
				category: "Shoes",
				price: 120,
			},
			unique: {
				key: "productAdded:user_1:category_shoes",
				scope: "forever",
			},
		};
		const validSummaryInput: SummaryInput = {
			metric: "productsAdded",
			from: 0,
			to: 1,
			scope: { type: "global" },
		};
		const validTotalsInput: TotalsInput = {
			metric: "productsAdded",
			dimensionKey: "category",
			days: 30,
		};

		const _invalidInput: ProductAddedInput = {
			properties: {
				category: "Shoes",
				// @ts-expect-error price must be a number.
				price: "120",
			},
		};
		const _invalidSummaryInput: SummaryInput = {
			// @ts-expect-error metric must be one of the configured metrics.
			metric: "missingMetric",
			from: 0,
			to: 1,
		};
		const _invalidTotalsInput: TotalsInput = {
			metric: "productsAdded",
			// @ts-expect-error dimensionKey must be a configured dimension.
			dimensionKey: "price",
		};

		expect(analytics.track).toBeDefined();
		expect(analytics.fetchSummary).toBeDefined();
		expect(analytics.fetchMetricTotalsByDimension).toBeDefined();
		expect(analytics.fetchTopDimensionValue).toBeDefined();
		expect(validInput.properties.price).toBe(120);
		expect(validInput.unique?.key).toBe("productAdded:user_1:category_shoes");
		expect(validSummaryInput.metric).toBe("productsAdded");
		expect(validTotalsInput.dimensionKey).toBe("category");
	});

	it("routes dimension helpers through component queries without reading app db", async () => {
		const component = {
			lib: {
				fetchMetricTotalsByDimension: "fetchMetricTotalsByDimensionRef",
				fetchTopDimensionValue: "fetchTopDimensionValueRef",
			},
		} as unknown as ComponentApi;
		const analytics = buildAnalytics(component);
		const runQuery = vi
			.fn()
			.mockResolvedValueOnce([{ key: "Shoes", value: 3 }])
			.mockResolvedValueOnce("Shoes");
		const ctx = {
			runQuery,
			get db(): never {
				throw new Error("app ctx.db should not be accessed");
			},
		};

		const totals = await analytics.fetchMetricTotalsByDimension(ctx, {
			metric: "productsAdded",
			scope: { type: "organization", id: "org_123" },
			dimensionKey: "category",
			days: 30,
		});
		const top = await analytics.fetchTopDimensionValue(ctx, {
			metric: "productsAdded",
			scope: { type: "organization", id: "org_123" },
			dimensionKey: "category",
		});

		expect(totals).toEqual(new Map([["Shoes", 3]]));
		expect(top).toBe("Shoes");
		expect(runQuery).toHaveBeenNthCalledWith(
			1,
			component.lib.fetchMetricTotalsByDimension,
			expect.objectContaining({
				configHash: expect.any(String),
				config: expect.objectContaining({
					events: expect.any(Array),
					metrics: expect.any(Array),
					settings: expect.any(Object),
				}),
				metric: "productsAdded",
				scope: { type: "organization", id: "org_123" },
				dimensionKey: "category",
				days: 30,
			}),
		);
		expect(runQuery).toHaveBeenNthCalledWith(
			2,
			component.lib.fetchTopDimensionValue,
			expect.objectContaining({
				configHash: expect.any(String),
				config: expect.objectContaining({
					events: expect.any(Array),
					metrics: expect.any(Array),
					settings: expect.any(Object),
				}),
				metric: "productsAdded",
				scope: { type: "organization", id: "org_123" },
				dimensionKey: "category",
			}),
		);
	});
});

import { describe, expect, it, vi } from "vitest";
import type { ComponentApi } from "../../../component/_generated/component";

// API
import { createAnalyticsApi } from "../../../client/api/createAnalyticsApi";

describe("createAnalyticsApi", () => {
	it("returns typed server tracking helpers", () => {
		const component = {} as ComponentApi;
		const analytics = createAnalyticsApi(component, {
			events: [
				{
					name: "product.added",
					label: "Product added",
					properties: {
						category: "string",
						price: "number",
					},
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

		type ProductAddedInput = Parameters<
			typeof analytics.track<"product.added">
		>[2];
		type SummaryInput = Parameters<
			typeof analytics.fetchSummary<"productsAdded">
		>[1];
		type TotalsInput = Parameters<
			typeof analytics.fetchMetricTotalsByDimension<"productsAdded">
		>[1];
		type DimensionTotalsInput = Parameters<
			typeof analytics.fetchDimensionTotals<"productsAdded">
		>[1];
		const validInput: ProductAddedInput = {
			properties: {
				category: "Shoes",
				price: 120,
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
		const validDimensionTotalsInput: DimensionTotalsInput = {
			metric: "productsAdded",
			dimensionKey: "category",
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
		expect(analytics.fetchDimensionTotals).toBeDefined();
		expect(analytics.fetchTopDimensionValue).toBeDefined();
		expect(analytics.fetchTopDimension).toBeDefined();
		expect(validInput.properties.price).toBe(120);
		expect(validSummaryInput.metric).toBe("productsAdded");
		expect(validTotalsInput.dimensionKey).toBe("category");
		expect(validDimensionTotalsInput.dimensionKey).toBe("category");
	});

	it("routes dimension helpers through component queries without reading app db", async () => {
		const component = {
			lib: {
				fetchMetricTotalsByDimension: "fetchMetricTotalsByDimensionRef",
				fetchTopDimensionValue: "fetchTopDimensionValueRef",
			},
		} as unknown as ComponentApi;
		const analytics = createAnalyticsApi(component, {
			events: [
				{
					name: "product.added",
					label: "Product added",
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
		const aliasCtx = {
			runQuery: vi
				.fn()
				.mockResolvedValueOnce([{ key: "Shoes", value: 3 }])
				.mockResolvedValueOnce("Shoes"),
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
		const aliasTotals = await analytics.fetchDimensionTotals(aliasCtx, {
			metric: "productsAdded",
			dimensionKey: "category",
		});
		const aliasTop = await analytics.fetchTopDimension(aliasCtx, {
			metric: "productsAdded",
			dimensionKey: "category",
		});

		expect(totals).toEqual(new Map([["Shoes", 3]]));
		expect(top).toBe("Shoes");
		expect(aliasTotals).toEqual(new Map([["Shoes", 3]]));
		expect(aliasTop).toBe("Shoes");
		expect(runQuery).toHaveBeenNthCalledWith(
			1,
			component.lib.fetchMetricTotalsByDimension,
			expect.objectContaining({
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
		expect(aliasCtx.runQuery).toHaveBeenNthCalledWith(
			1,
			component.lib.fetchMetricTotalsByDimension,
			expect.objectContaining({
				config: expect.objectContaining({
					events: expect.any(Array),
					metrics: expect.any(Array),
					settings: expect.any(Object),
				}),
				metric: "productsAdded",
				dimensionKey: "category",
			}),
		);
		expect(aliasCtx.runQuery).toHaveBeenNthCalledWith(
			2,
			component.lib.fetchTopDimensionValue,
			expect.objectContaining({
				config: expect.objectContaining({
					events: expect.any(Array),
					metrics: expect.any(Array),
					settings: expect.any(Object),
				}),
				metric: "productsAdded",
				dimensionKey: "category",
			}),
		);
	});
});

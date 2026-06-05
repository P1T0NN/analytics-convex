import { describe, expect, it } from "vitest";
import type { ComponentApi } from "../../component/_generated/component";

// API
import { createAnalyticsApi } from "./createAnalyticsApi";

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

    expect(analytics.track).toBeDefined();
    expect(analytics.fetchSummary).toBeDefined();
    expect(validInput.properties.price).toBe(120);
    expect(validSummaryInput.metric).toBe("productsAdded");
  });
});

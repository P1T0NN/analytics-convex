import { describe, expect, it } from "vitest";
import type { ComponentApi } from "../../component/_generated/component";

// API
import { defineAnalytics } from "./defineAnalytics";

// BUILDERS
import { event } from "../builders/event";
import { property } from "../builders/property";

describe("defineAnalytics", () => {
  it("returns typed tracking helpers from builder config", () => {
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

    const assertMetricTypeChecks = () => {
      defineAnalytics(component, {
        events,
        metrics: ({ count, sum }) => ({
          // @ts-expect-error event name must exist in the event config.
          badEvent: count("Bad event").from("product.removed"),
          // @ts-expect-error dimensions must be registered event properties.
          badDimension: count("Bad dimension").from("product.added").by("sku"),
          // @ts-expect-error sum valueProperty must be a number property.
          badValue: sum("Bad value").from("product.added").value("category"),
        }),
      });
    };

    type ProductAddedInput = Parameters<
      typeof analytics.track<"product.added">
    >[2];
    type ProductValueBreakdownInput = Parameters<
      typeof analytics.fetchBreakdown<"productValueAdded">
    >[1];

    const validInput: ProductAddedInput = {
      properties: {
        category: "Shoes",
        price: 120,
        currency: "USD",
      },
    };

    const _invalidInput: ProductAddedInput = {
      properties: {
        category: "Shoes",
        // @ts-expect-error price must be a number.
        price: "120",
      },
    };
    const validBreakdownInput: ProductValueBreakdownInput = {
      metric: "productValueAdded",
      from: 0,
      to: 1,
      groupBy: "category",
    };
    const _invalidBreakdownInput: ProductValueBreakdownInput = {
      metric: "productValueAdded",
      from: 0,
      to: 1,
      // @ts-expect-error groupBy must be one of the configured metric dimensions.
      groupBy: "price",
    };

    expect(analytics.track).toBeDefined();
    expect(analytics.fetchSummary).toBeDefined();
    expect(assertMetricTypeChecks).toBeDefined();
    expect(validBreakdownInput.groupBy).toBe("category");
    expect(validInput.properties.price).toBe(120);
  });
});

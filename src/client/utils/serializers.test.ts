// LIBRARIES
import { describe, expect, it } from "vitest";

// UTILS
import { serializeEvents } from "./serializeEvents";
import { serializeMetrics } from "./serializeMetrics";

describe("serializeEvents", () => {
  it("serializes basic event fields", () => {
    const result = serializeEvents([
      { name: "page.viewed", label: "Page viewed" },
    ]);
    expect(result).toEqual([{ name: "page.viewed", label: "Page viewed" }]);
  });

  it("includes properties when present", () => {
    const result = serializeEvents([
      {
        name: "feature.used",
        label: "Feature used",
        properties: { feature: "string" },
      },
    ]);
    expect(result[0].properties).toEqual({ feature: "string" });
  });

  it("includes requiredProperties when present", () => {
    const result = serializeEvents([
      {
        name: "page.viewed",
        label: "Page viewed",
        requiredProperties: ["path"],
      },
    ]);
    expect(result[0].requiredProperties).toEqual(["path"]);
  });
});

describe("serializeMetrics", () => {
  it("serializes basic metric fields", () => {
    const result = serializeMetrics([
      {
        name: "pageViews",
        label: "Page views",
        unit: "count",
        eventNames: ["page.viewed"],
        aggregation: "count",
      },
    ]);
    expect(result[0]).toMatchObject({
      name: "pageViews",
      label: "Page views",
      unit: "count",
      eventNames: ["page.viewed"],
      aggregation: "count",
    });
  });

  it("includes optional fields", () => {
    const result = serializeMetrics([
      {
        name: "revenue",
        label: "Revenue",
        description: "Total revenue",
        unit: "currency",
        eventNames: ["purchase.completed"],
        aggregation: "sum",
        valueProperty: "amount",
        dimensions: ["plan"],
        trafficMode: "highVolume",
        adminOnly: true,
      },
    ]);
    expect(result[0]).toMatchObject({
      description: "Total revenue",
      valueProperty: "amount",
      dimensions: ["plan"],
      trafficMode: "highVolume",
      adminOnly: true,
    });
  });

  it("omits undefined optional fields", () => {
    const result = serializeMetrics([
      {
        name: "pageViews",
        label: "Page views",
        unit: "count",
        eventNames: ["page.viewed"],
        aggregation: "count",
      },
    ]);
    expect(result[0]).not.toHaveProperty("description");
    expect(result[0]).not.toHaveProperty("valueProperty");
    expect(result[0]).not.toHaveProperty("adminOnly");
  });
});

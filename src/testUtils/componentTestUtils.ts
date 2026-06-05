// LIBRARIES
import { convexTest } from "convex-test";

// COMPONENT
import schema from "../component/schema";

// TYPES
import type { typesAnalyticsSettings } from "../component/types/types";

export const DAY_MS = 86_400_000;

export function createAnalyticsComponentTest(
  modules: Record<string, () => Promise<unknown>>,
) {
  return convexTest(schema, modules);
}

export function pageViewsConfiguration() {
  return {
    events: [{ name: "page.viewed", label: "Page viewed" }],
    metrics: [
      {
        name: "pageViews",
        label: "Page views",
        unit: "count" as const,
        eventNames: ["page.viewed"],
        aggregation: "count" as const,
      },
    ],
  };
}

export function revenueConfiguration(
  settings?: Partial<typesAnalyticsSettings>,
) {
  return {
    events: [
      {
        name: "purchase.completed",
        label: "Purchase completed",
        properties: { amount: "number" as const, plan: "string" as const },
      },
    ],
    metrics: [
      {
        name: "revenue",
        label: "Revenue",
        unit: "currency" as const,
        eventNames: ["purchase.completed"],
        aggregation: "sum" as const,
        valueProperty: "amount",
        dimensions: ["plan"],
        trafficMode: "highVolume" as const,
      },
    ],
    ...(settings ? { settings } : {}),
  };
}

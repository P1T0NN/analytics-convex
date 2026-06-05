/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import {
  DAY_MS,
  createAnalyticsComponentTest,
  pageViewsConfiguration,
  revenueConfiguration,
} from "../testUtils/componentTestUtils";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);

describe("analytics component", () => {
  it("configures and reads configuration back", async () => {
    const t = createAnalyticsComponentTest(modules);

    await t.mutation(api.lib.writeConfiguration, {
      events: [
        {
          name: "page.viewed",
          label: "Page viewed",
          properties: { path: "string" },
        },
      ],
      metrics: [
        {
          name: "pageViews",
          label: "Page views",
          unit: "count",
          eventNames: ["page.viewed"],
          aggregation: "count",
          dimensions: ["path"],
        },
      ],
    });

    const config = await t.query(api.lib.fetchConfiguration, {});
    expect(config).not.toBeNull();
    expect(config!.events).toHaveLength(1);
    expect(config!.events[0].name).toBe("page.viewed");
    expect(config!.metrics).toHaveLength(1);
    expect(config!.metrics[0].name).toBe("pageViews");
  });

  it("tracks an event and queries the summary", async () => {
    const t = createAnalyticsComponentTest(modules);

    // Configure first
    await t.mutation(api.lib.writeConfiguration, {
      events: [{ name: "feature.used", label: "Feature used" }],
      metrics: [
        {
          name: "featureUses",
          label: "Feature uses",
          unit: "count",
          eventNames: ["feature.used"],
          aggregation: "count",
        },
      ],
    });

    // Write event directly (bypass scheduler for test determinism)
    const now = Date.now();
    await t.mutation(internal.lib.writeAnalyticsEvent, {
      name: "feature.used",
      occurredAt: now,
      properties: {},
      source: { type: "server" },
      idempotencyKey: `feature.used:${now}:server::`,
    });

    // Query summary
    const result = await t.query(api.lib.fetchSummary, {
      metric: "featureUses",
      from: now - 86_400_000,
      to: now + 86_400_000,
    });

    expect(result.value).toBe(1);
    expect(result.metric).toBe("featureUses");
    expect(result.label).toBe("Feature uses");
    expect(result.unit).toBe("count");
  });

  it("deduplicates events with same idempotency key", async () => {
    const t = createAnalyticsComponentTest(modules);

    await t.mutation(api.lib.writeConfiguration, pageViewsConfiguration());

    const now = Date.now();
    const idempotencyKey = `page.viewed:${now}:server::`;

    // Write twice with same key
    await t.mutation(internal.lib.writeAnalyticsEvent, {
      name: "page.viewed",
      occurredAt: now,
      properties: {},
      source: { type: "server" },
      idempotencyKey,
    });

    const second = await t.mutation(internal.lib.writeAnalyticsEvent, {
      name: "page.viewed",
      occurredAt: now,
      properties: {},
      source: { type: "server" },
      idempotencyKey,
    });

    expect((second as any).duplicate).toBe(true);

    // Should only count once
    const result = await t.query(api.lib.fetchSummary, {
      metric: "pageViews",
      from: now - 86_400_000,
      to: now + 86_400_000,
    });

    expect(result.value).toBe(1);
  });

  it("batch-aggregates high-volume events without changing totals", async () => {
    const t = createAnalyticsComponentTest(modules);
    const now = Date.now();

    await t.mutation(
      api.lib.writeConfiguration,
      revenueConfiguration({
        highVolumeShardCount: 1,
        highVolumeBatchSize: 10,
      }),
    );

    for (const [index, amount] of [10, 15].entries()) {
      const result = await t.mutation(internal.lib.writeAnalyticsEvent, {
        name: "purchase.completed",
        occurredAt: now + index,
        properties: { amount, plan: "pro" },
        source: { type: "server" },
        idempotencyKey: `purchase.completed:${now}:${index}`,
      });

      expect((result as any).highVolumeStatus).toBe("pending");
    }

    const before = await t.query(api.lib.fetchSummary, {
      metric: "revenue",
      from: now - DAY_MS,
      to: now + DAY_MS,
    });
    expect(before.value).toBe(0);

    const processed = await t.mutation(
      api.lib.processPendingHighVolumeAnalyticsEvents,
      {},
    );
    expect(processed).toMatchObject({
      processed: 2,
      scheduledNextBatch: false,
    });

    const summary = await t.query(api.lib.fetchSummary, {
      metric: "revenue",
      from: now - DAY_MS,
      to: now + DAY_MS,
    });
    expect(summary.value).toBe(25);

    const breakdown = await t.query(api.lib.fetchBreakdown, {
      metric: "revenue",
      from: now - DAY_MS,
      to: now + DAY_MS,
      groupBy: "plan",
    });
    expect(breakdown.data).toEqual([{ key: "pro", value: 25 }]);
  });

  it("purges only stale non-pending raw events", async () => {
    const t = createAnalyticsComponentTest(modules);
    const now = Date.now();
    const old = now - 2 * DAY_MS;

    await t.mutation(api.lib.writeConfiguration, {
      events: [
        { name: "page.viewed", label: "Page viewed" },
        { name: "video.played", label: "Video played" },
      ],
      metrics: [
        {
          name: "pageViews",
          label: "Page views",
          unit: "count",
          eventNames: ["page.viewed"],
          aggregation: "count",
        },
        {
          name: "videoPlays",
          label: "Video plays",
          unit: "count",
          eventNames: ["video.played"],
          aggregation: "count",
          trafficMode: "highVolume",
        },
      ],
      settings: {
        rawEventRetentionDays: 1,
        maxRawEventDeletesPerRun: 10,
        highVolumeBatchSize: 10,
      },
    });

    await t.mutation(internal.lib.writeAnalyticsEvent, {
      name: "page.viewed",
      occurredAt: old,
      properties: {},
      source: { type: "server" },
      idempotencyKey: `page.viewed:${old}`,
    });

    await t.mutation(internal.lib.writeAnalyticsEvent, {
      name: "video.played",
      occurredAt: old,
      properties: {},
      source: { type: "server" },
      idempotencyKey: `video.played:${old}`,
    });

    const firstPurge = await t.mutation(api.lib.purgeStaleAnalyticsEvents, {});
    expect(firstPurge.deleted).toBe(1);

    const processed = await t.mutation(
      api.lib.processPendingHighVolumeAnalyticsEvents,
      {},
    );
    expect(processed.processed).toBe(1);

    const secondPurge = await t.mutation(api.lib.purgeStaleAnalyticsEvents, {});
    expect(secondPurge.deleted).toBe(1);
  });
});

// CONSTANTS
import { CONFIG_KEY } from "./constants.js";

// UTILS
import { humanizeKey } from "./utils/common/stringUtils.js";
import { notConfigured } from "./errors/errors.js";

// TYPES
import type {
  typesAnalyticsSettings,
  typesAnalyticsConfigState,
  typesAnalyticsPropertyType,
} from "./types/types.js";
import type { Doc } from "./_generated/dataModel.js";
import type { MutationCtx, QueryCtx } from "./_generated/server.js";

export function defaultSettings(): typesAnalyticsSettings {
  return {
    trafficMode: "mediumVolume",
    mediumVolumeShardCount: 8,
    highVolumeShardCount: 32,
    highVolumeBatchSize: 250,
    highVolumeBatchIntervalMinutes: 1,
    highVolumeMaxCatchupBatches: 4,
    maxQueryRangeDays: 366,
    maxRollupRowsPerQuery: 20_000,
    maxBreakdownItems: 12,
    rawEventRetentionDays: 90,
    maxRawEventDeletesPerRun: 5_000,
  };
}

export function chartConfig(
  seriesKeys: string[],
  labels?: Record<string, string>,
) {
  return Object.fromEntries(
    seriesKeys.map((key) => [
      key,
      {
        label: labels?.[key] ?? humanizeKey(key),
      },
    ]),
  );
}

export async function getConfigDoc(ctx: QueryCtx | MutationCtx) {
  return await ctx.db
    .query("analyticsConfigs")
    .withIndex("by_key", (q) => q.eq("key", CONFIG_KEY))
    .first();
}

export function normalizeConfig(
  doc: Doc<"analyticsConfigs">,
): typesAnalyticsConfigState {
  const events = doc.events.map((event) => ({
    ...event,
    properties: event.properties as
      | Record<string, typesAnalyticsPropertyType>
      | undefined,
  }));
  const metrics = doc.metrics.map((metric) => ({ ...metric }));

  return {
    events,
    metrics,
    eventByName: new Map(events.map((event) => [event.name, event])),
    metricByName: new Map(metrics.map((metric) => [metric.name, metric])),
    settings: doc.settings,
    configHash: doc.configHash,
  };
}

export async function getConfig(ctx: QueryCtx | MutationCtx) {
  const doc = await getConfigDoc(ctx);
  if (!doc) notConfigured();
  return normalizeConfig(doc);
}

// LIBRARIES
import {
  mutationGeneric,
  queryGeneric,
  type GenericDataModel,
  type GenericMutationCtx,
} from "convex/server";
import { v } from "convex/values";
import type { ComponentApi } from "../../component/_generated/component.js";

// HELPERS
import { authorize } from "../helpers/authorize";
import { createAnalyticsReader } from "../helpers/createAnalyticsReader";
import { createAnalyticsTracker } from "../helpers/createAnalyticsTracker";
import { serializeEvents } from "../utils/serializeEvents";
import { serializeMetrics } from "../utils/serializeMetrics";

// SCHEMAS
import { scopeInputValidator, trackEventInputFields } from "../schemas/schemas";

// TYPES
import type {
  typesAnalyticsEventConfig,
  typesAnalyticsMetricConfig,
  typesAnalyticsScopeInput,
  typesCreateAnalyticsApiOptionsForConfig,
} from "../types/types";

type typesMutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "runMutation"
>;

/**
 * Build app-side Convex functions backed by the analytics component.
 *
 * Export these from your app's `convex/analytics.ts` when you want client or
 * route access. It also returns typed server-side helpers for product
 * mutations and app-specific analytics queries.
 */
export function createAnalyticsApi<
  const Events extends readonly typesAnalyticsEventConfig[],
  const Metrics extends readonly typesAnalyticsMetricConfig<
    string,
    Events[number]["name"]
  >[],
>(
  component: ComponentApi,
  options: typesCreateAnalyticsApiOptionsForConfig<Events, Metrics>,
) {
  type EventName = Events[number]["name"];
  type MetricName = Metrics[number]["name"];

  const eventNameValidator = v.union(
    ...options.events.map((e) => v.literal(e.name as EventName)),
  );
  const metricNameValidator = v.union(
    ...options.metrics.map((m) => v.literal(m.name as MetricName)),
  );
  const tracker = createAnalyticsTracker(component, options.events);
  const reader = createAnalyticsReader(component, options.metrics);
  const singleTrackEventArgs = {
    name: eventNameValidator,
    ...trackEventInputFields,
  };
  const writeTrackArgs = {
    name: v.optional(eventNameValidator),
    ...trackEventInputFields,
    events: v.optional(v.array(v.object(singleTrackEventArgs))),
  };
  const configuration = {
    events: serializeEvents(options.events),
    metrics: serializeMetrics(options.metrics),
    ...(options.settings ? { settings: options.settings } : {}),
  };

  return {
    ...tracker,
    ...reader,
    configure: async (ctx: typesMutationCtx) => {
      await ctx.runMutation(component.lib.writeConfiguration, configuration);
    },
    writeConfiguration: mutationGeneric({
      args: {},
      returns: v.null(),
      handler: async (ctx) => {
        await authorize(options, ctx, { type: "configure" });
        await ctx.runMutation(component.lib.writeConfiguration, configuration);
        return null;
      },
    }),
    writeTrack: mutationGeneric({
      args: writeTrackArgs,
      returns: v.any(),
      handler: async (ctx, args) => {
        if (args.events) {
          for (const event of args.events) {
            await authorize(options, ctx, {
              type: "track",
              name: event.name,
            });
          }

          return await ctx.runMutation(component.lib.writeTrack, {
            events: args.events,
          });
        }

        if (!args.name) {
          throw new Error('writeTrack requires either "name" or "events".');
        }

        const { events: _events, ...event } = args;

        await authorize(options, ctx, {
          type: "track",
          name: args.name,
        });

        return await ctx.runMutation(component.lib.writeTrack, {
          ...event,
          name: args.name,
        });
      },
    }),
    metricComparison: queryGeneric({
      args: {
        metric: metricNameValidator,
        from: v.number(),
        to: v.number(),
        scope: v.optional(scopeInputValidator),
      },
      returns: v.any(),
      handler: async (ctx, args) => {
        await authorize(options, ctx, {
          type: "read",
          query: "metricComparison",
          metric: args.metric,
          ...(args.scope
            ? { scope: args.scope as typesAnalyticsScopeInput }
            : {}),
        });
        return await ctx.runQuery(component.lib.fetchMetricComparison, args);
      },
    }),
    timeSeries: queryGeneric({
      args: {
        metric: metricNameValidator,
        from: v.number(),
        to: v.number(),
        groupBy: v.optional(v.string()),
        scope: v.optional(scopeInputValidator),
        fill: v.optional(v.boolean()),
      },
      returns: v.any(),
      handler: async (ctx, args) => {
        await authorize(options, ctx, {
          type: "read",
          query: "timeSeries",
          metric: args.metric,
          ...(args.scope
            ? { scope: args.scope as typesAnalyticsScopeInput }
            : {}),
        });
        return await ctx.runQuery(component.lib.fetchTimeSeries, args);
      },
    }),
    summary: queryGeneric({
      args: {
        metric: metricNameValidator,
        from: v.number(),
        to: v.number(),
        scope: v.optional(scopeInputValidator),
      },
      returns: v.any(),
      handler: async (ctx, args) => {
        await authorize(options, ctx, {
          type: "read",
          query: "summary",
          metric: args.metric,
          ...(args.scope
            ? { scope: args.scope as typesAnalyticsScopeInput }
            : {}),
        });
        return await ctx.runQuery(component.lib.fetchSummary, args);
      },
    }),
    breakdown: queryGeneric({
      args: {
        metric: metricNameValidator,
        from: v.number(),
        to: v.number(),
        groupBy: v.string(),
        scope: v.optional(scopeInputValidator),
      },
      returns: v.any(),
      handler: async (ctx, args) => {
        await authorize(options, ctx, {
          type: "read",
          query: "breakdown",
          metric: args.metric,
          ...(args.scope
            ? { scope: args.scope as typesAnalyticsScopeInput }
            : {}),
        });
        return await ctx.runQuery(component.lib.fetchBreakdown, args);
      },
    }),
  };
}

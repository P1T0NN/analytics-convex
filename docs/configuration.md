# Configuration

### Event config

| Field                | Type                                                | Description                                                             |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| `name`               | `string`                                            | Unique event identifier (e.g. `"page.viewed"`)                          |
| `label`              | `string`                                            | Human-readable label for dashboards                                     |
| `properties`         | `Record<string, "string" \| "number" \| "boolean">` | Optional — registered property types                                    |
| `requiredProperties` | `string[]`                                          | Optional — properties that must be present on every `writeTrack()` call |

### Metric config

| Field           | Type                                            | Description                                                                       |
| --------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `name`          | `string`                                        | Unique metric identifier (e.g. `"pageViews"`)                                     |
| `label`         | `string`                                        | Human-readable label for dashboards                                               |
| `description`   | `string`                                        | Optional — longer description                                                     |
| `unit`          | `"count" \| "currency" \| "bytes"`              | Unit used in query responses                                                      |
| `eventNames`    | `string[]`                                      | Which events feed this metric                                                     |
| `aggregation`   | `"count" \| "sum"`                              | `count` = each event adds 1; `sum` = each event adds the value of `valueProperty` |
| `valueProperty` | `string`                                        | Required when `aggregation` is `"sum"`                                            |
| `dimensions`    | `string[]`                                      | Properties available for `groupBy` in queries                                     |
| `trafficMode`   | `"lowVolume" \| "mediumVolume" \| "highVolume"` | Optional per-metric override                                                      |
| `adminOnly`     | `boolean`                                       | If `true`, the `authorize` callback receives `adminOnly` info for access control  |
| `evaluation`    | `MetricEvaluationConfig`                        | Optional — dashboard label rules: `comparison`, `conversion`, `inverseRate`, or `goal` |

### Settings

Pass a partial `settings` object to `defineAnalytics` to override defaults in code:

| Setting                          | Default          | Description                                            |
| -------------------------------- | ---------------- | ------------------------------------------------------ |
| `trafficMode`                    | `"mediumVolume"` | Global default traffic mode                            |
| `mediumVolumeShardCount`         | `8`              | Shard count for medium-volume metrics                  |
| `highVolumeShardCount`           | `32`             | Shard count for high-volume metrics                    |
| `highVolumeBatchSize`            | `250`            | Events processed per batch                             |
| `highVolumeBatchIntervalMinutes` | `1`              | Cron cadence for batch processing                      |
| `highVolumeMaxCatchupBatches`    | `4`              | Max consecutive catch-up batches per cron tick         |
| `maxQueryRangeDays`              | `366`            | Max inclusive date range for queries                   |
| `maxRollupRowsPerQuery`          | `20_000`         | Hard cap for rows read by a single query               |
| `maxBreakdownItems`              | `12`             | Max dimension values returned by grouped queries       |
| `rawEventRetentionDays`          | `90`             | Days before raw events are purged (`0` = keep forever) |
| `maxRawEventDeletesPerRun`       | `5_000`          | Max raw events deleted per retention cron run          |

### Hard limits

The component enforces hard limits before data is stored or scheduled. Import
`ANALYTICS_LIMITS` if you want to mirror these caps in your own forms, queues,
or ingestion workers.

| Limit                                    |                                  Value |
| ---------------------------------------- | -------------------------------------: |
| Events per configuration                 |                                    200 |
| Metrics per configuration                |                                    200 |
| Properties per event config              |                                     50 |
| Required properties per event            |                                     50 |
| Event names per metric                   |                                     50 |
| Dimensions per metric                    |                                      8 |
| Events per `writeTrack({ events })` call |                                    100 |
| Scopes per tracked event                 |                                     20 |
| Properties per tracked event             |                                     50 |
| Identifier length                        |                              128 chars |
| Label length                             |                              256 chars |
| Description length                       |                            1,024 chars |
| Single string property value             |                            2,048 chars |
| Total property payload                   |                           16,384 chars |
| Unique event key                         |                              512 chars |
| Medium-volume shards                     |                                 64 max |
| High-volume shards                       |                                256 max |
| High-volume batch size                   |                              1,000 max |
| High-volume catch-up batches             |                                 20 max |
| Query range                              |                         3,660 days max |
| Rollup rows per query                    |                            100,000 max |
| Breakdown items                          |                                100 max |
| Raw event retention                      | 3,650 days max, or `0` to keep forever |
| Raw event deletes per retention run      |                             10,000 max |
| Funnels per configuration                |                                     50 |
| Steps per funnel                         |                                     10 |
| Metrics per dashboard batch query        |                                     24 |

---

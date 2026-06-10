# Convex Analytics

Production-grade, server-side analytics for [Convex](https://convex.dev): event
ingestion, daily rollups, dashboard queries, high-volume batching, and raw event
retention — all in your Convex deployment.

**Documentation:** [docs/README.md](./docs/README.md)

## Install

```bash
npm install @piton-/analytics-convex
```

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import analytics from "@piton-/analytics-convex/convex.config.js";

const app = defineApp();
app.use(analytics);

export default app;
```

Run `npx convex dev` to regenerate the component API, then follow the [Quick Start](./docs/quickstart.md).

## What you get

- Server-side event ingestion with idempotency and optional `unique.key`
- Daily (or hourly) rollup metrics with sharding for high-volume traffic
- Dashboard queries: summaries, comparisons, evaluation labels, funnels, journeys, time series, breakdowns
- Distinct-actor metrics (DAU-style) that stay accurate across multi-day ranges
- Typed `defineAnalytics()` setup — one object for tracking, queries, client wrappers, and crons
- Retention crons that purge raw events and rollups, and keep up with high write volume

## Docs map

| Topic | Guide |
| ----- | ----- |
| First integration | [Quick Start](./docs/quickstart.md) |
| Events, metrics, settings | [Configuration](./docs/configuration.md) |
| `writeTrack`, uniqueness | [Tracking](./docs/tracking.md) |
| Dashboard reads | [Querying](./docs/querying.md) |
| Multi-tenant filtering | [Scopes](./docs/scopes.md) |
| Limits and scale | [Scale and limits](./docs/scale-and-limits.md) |

## Development

```bash
npm test
npm run build
```

See [Contributing](./docs/contributing.md) and [Production](./docs/production.md).

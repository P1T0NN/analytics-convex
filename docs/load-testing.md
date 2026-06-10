# Load testing

## Will tests eat my Convex memory / quota?

**No — if you run the repo tests.**

| Command | Where it runs | Convex cloud impact |
| --- | --- | --- |
| `bun test` | Local Node + `convex-test` | **None** — in-memory fake DB |
| `bun run test:volume` | Same | **None** |
| `bun run test:stress` | Same | **None** |
| `bun run dev` (example app) | Your linked dev deployment | **Yes** — real writes, storage, functions |
| `bun run insights` | Reads deployment metrics | **None** on storage; reads telemetry |

Volume tests simulate rollups, sharding, and cron batching **on your machine**.
They validate correctness and print local timing — not Convex cloud limits.

Use `bun run dev` + manual dashboard calls when you want to validate against a
real deployment. Use `bun run insights` after that to inspect documents read,
OCC conflicts, and slow functions.

---

## Volume test harness

Run all traffic modes (low, medium, high):

```bash
bun run test:volume
```

Each mode tracks a full batch through `writeTrack`, scheduled aggregation,
high-volume cron drain (when applicable), and parallel dashboard queries.

Example output:

```text
[volume:lowVolume] events=50 writeTrack=12.3ms aggregate=45.6ms queries=8.1ms total=66.0ms
[volume:mediumVolume] events=100 writeTrack=18.0ms aggregate=92.4ms queries=11.2ms total=121.6ms
[volume:highVolume] events=100 writeTrack=16.5ms aggregate=110.8ms queries=10.9ms total=138.2ms
```

Timings are **local smoke benchmarks**, not guarantees for production traffic.
Treat them as regression signals in CI, not SLA numbers.

### Event counts per mode

| Mode | Events per test | Why |
| --- | ---: | --- |
| `lowVolume` | 50 | Prototype-scale batch |
| `mediumVolume` | 100 | Max `writeTrack` batch size |
| `highVolume` | 100 | Max batch + cron drain |

---

## Testing against a real deployment

When you need cloud-level signals:

1. `npm run build:codegen && npm run dev`
2. Exercise `example/convex/demo.ts` mutations repeatedly
3. `npm run insights`
4. Tune shard counts, traffic modes, and cron intervals from Insights

Clear dev data from the Convex dashboard if the example fills your dev project.

---

## What to watch in Insights

- **OCC conflicts** on rollup writes → more shards or `highVolume`
- **Pending high-volume events** not draining → cron interval / batch size
- **High documents read** on queries → narrower ranges, fewer dimensions
- **Slow mutations** on `writeTrack` or cron processor → traffic mode mismatch

See [Production](./production.md) and [Traffic modes](./traffic-modes.md).

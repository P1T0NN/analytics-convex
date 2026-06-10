# Testing

The package exports helpers for testing analytics in your app with
[`convex-test`](https://www.npmjs.com/package/convex-test).

Add `convex-test` to your app **devDependencies** (optional peer dependency of
`@piton-/analytics-convex`):

```sh
bun add -d convex-test
```

### Imports

```ts
import { convexTest } from "convex-test";
import modules from "../convex/_generated/api.js";
import {
	createAnalyticsComponentTest,
	runtimeConfiguration,
	analyticsConfigArgs,
	pageViewsConfiguration,
	revenueConfiguration,
	DAY_MS,
} from "@piton-/analytics-convex/testing";
```

Volume/load helpers (optional):

```ts
import {
	buildVolumeEvents,
	logVolumeTiming,
	volumeConfiguration,
	VOLUME_EVENT_COUNTS,
	type VolumeTiming,
} from "@piton-/analytics-convex/testing";
```

### Minimal component test

```ts
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api";
import {
	createAnalyticsComponentTest,
	runtimeConfiguration,
	analyticsConfigArgs,
} from "@piton-/analytics-convex/testing";

const modules = import.meta.glob("../convex/**/*.ts");

describe("my analytics", () => {
	it("tracks and reads a summary", async () => {
		const t = createAnalyticsComponentTest(modules);
		const config = runtimeConfiguration({
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

		await t.mutation(api.myModule.trackFeature, {
			...analyticsConfigArgs(config),
			// ...your mutation args
		});

		const summary = await t.query(api.lib.fetchSummary, {
			...analyticsConfigArgs(config),
			metric: "featureUses",
			from: Date.now() - DAY_MS,
			to: Date.now(),
		});

		expect(summary.value).toBe(1);
	});
});
```

### What the helpers do

| Export | Purpose |
| ------ | ------- |
| `createAnalyticsComponentTest(modules)` | `convexTest()` wired to the analytics component schema |
| `runtimeConfiguration({ events, metrics, funnels?, journeys?, settings? })` | Build a runtime config + stable `configHash` |
| `analyticsConfigArgs(config)` | `{ configHash, config }` for component calls |
| `pageViewsConfiguration()` | Ready-made page-view config for examples |
| `revenueConfiguration(settings?)` | High-volume revenue example config |

These mirror the library's own test utilities. They are **not** imported from
`@piton-/analytics-convex` main entry — use the `./testing` subpath only in
tests.

See also [Load testing](./load-testing.md) for volume harness patterns.

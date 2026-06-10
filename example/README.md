# Example app

Minimal Convex app that uses `@piton-/analytics-convex` from this repo's built
`dist/` output.

## Run locally

From the repo root:

```bash
npm run build:codegen
npm run dev
```

Then in the Convex dashboard, run:

- `demo:useFeature` with `{ "feature": "export", "plan": "pro" }`
- `demo:featureUsesSummary` to read the rollup total

## Cloud vs local tests

| What you run | Uses Convex cloud? |
| --- | --- |
| `npm test` / `npm run test:volume` | **No** — in-memory `convex-test` on your machine |
| `npm run dev` (this example) | **Yes** — writes to your linked **dev** deployment |

Volume tests in CI do not consume Convex deployment storage or function quota.
Running this example does — but only on your dev project, not production.

See [Load testing](../docs/load-testing.md).

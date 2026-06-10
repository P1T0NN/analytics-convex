# Developing guide

## Running locally

```sh
npm i
npm run dev
```

## Testing

```sh
bun install --frozen-lockfile
bun run build:clean
bun run typecheck
bun run lint
bun run test
bun run pack:verify
```

Consumer apps can import test helpers from `@piton-/analytics-convex/testing`.
See [Testing](./testing.md).

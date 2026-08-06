/**
 * Exact live counters for `@piton-/analytics-convex`, backed by
 * `@convex-dev/aggregate`.
 *
 * Separate entry point so the package root stays dependency-free — only apps
 * that use counters need `@convex-dev/aggregate` and `convex-helpers`
 * installed.
 *
 * The split this enforces:
 * - **Counters** — "how many right now". Exact, transactional, O(log n).
 * - **Analytics metrics** — "what happened over time". Rollup-based.
 *
 * @example
 * ```ts
 * import { defineCounters } from "@piton-/analytics-convex/counters";
 * ```
 */

export { defineCounters } from "./defineCounters.js";

export type {
	typesCounterApi,
	typesCounterBuilder,
	typesCounterOptions,
	typesCountersApi,
	typesCounterSpec,
} from "./defineCounters.js";

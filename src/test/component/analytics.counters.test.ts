/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { api } from "../../component/_generated/api";
import { internalCreateAnalyticsComponentTest } from "../../testUtils/componentTestUtils";

const modules = import.meta.glob("../../component/**/*.ts");

describe("analytics counters", () => {
	it("bumps and reads a counter back exactly", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(0);

		await t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: 1 });
		await t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: 1 });

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(2);
	});

	it("applies negative deltas without clamping", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: 5 });
		await t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: -8 });

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(-3);
	});

	it("returns 0 for absent keys in getMany", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await t.mutation(api.lib.writeCounterBump, {
			key: "reservations.pending",
			delta: 3,
		});

		const values = await t.query(api.lib.fetchCounters, {
			keys: ["reservations.pending", "reservations.confirmed"],
		});

		expect(values).toEqual({
			"reservations.pending": 3,
			"reservations.confirmed": 0,
		});
	});

	it("sums sharded bumps correctly, including mixed shard configs", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		for (let i = 0; i < 40; i++) {
			await t.mutation(api.lib.writeCounterBump, {
				key: "guests.total",
				delta: 1,
				shards: 4,
			});
		}
		// A call site with a different shard config still sums into the same key.
		await t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: 2 });

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(42);

		const rows = await t.run(async (ctx) => {
			return await ctx.db.query("analyticsCounters").collect();
		});
		expect(rows.length).toBeLessThanOrEqual(4);
		for (const row of rows) {
			expect(row.shard).toBeGreaterThanOrEqual(0);
			expect(row.shard).toBeLessThan(4);
		}
	});

	it("set collapses shards to a single shard-0 row", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		for (let i = 0; i < 20; i++) {
			await t.mutation(api.lib.writeCounterBump, {
				key: "guests.total",
				delta: 1,
				shards: 8,
			});
		}

		await t.mutation(api.lib.writeCounterSet, { key: "guests.total", value: 100 });

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(100);

		const rows = await t.run(async (ctx) => {
			return await ctx.db.query("analyticsCounters").collect();
		});
		expect(rows).toHaveLength(1);
		expect(rows[0].shard).toBe(0);
		expect(rows[0].value).toBe(100);
	});

	it("keeps concurrent bumps to one key exact", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await Promise.all(
			Array.from({ length: 25 }, () =>
				t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: 1 }),
			),
		);

		expect(await t.query(api.lib.fetchCounter, { key: "guests.total" })).toBe(25);
	});

	it("rejects invalid shard counts and non-finite values", async () => {
		const t = internalCreateAnalyticsComponentTest(modules);

		await expect(
			t.mutation(api.lib.writeCounterBump, {
				key: "guests.total",
				delta: 1,
				shards: 0,
			}),
		).rejects.toThrow();
		await expect(
			t.mutation(api.lib.writeCounterBump, { key: "guests.total", delta: NaN }),
		).rejects.toThrow();
		await expect(
			t.mutation(api.lib.writeCounterSet, {
				key: "guests.total",
				value: Infinity,
			}),
		).rejects.toThrow();
	});
});

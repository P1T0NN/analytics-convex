import { describe, expect, it } from "vitest";

import { defineCounters } from "../../counters/defineCounters";

type typesTestDataModel = {
	bookings: {
		document: {
			_id: string;
			_creationTime: number;
			accommodationId: string;
			totalPrice: number;
		};
		fieldPaths: string;
		indexes: Record<string, never>;
		searchIndexes: Record<string, never>;
		vectorIndexes: Record<string, never>;
	};
	members: {
		document: { _id: string; _creationTime: number };
		fieldPaths: string;
		indexes: Record<string, never>;
		searchIndexes: Record<string, never>;
		vectorIndexes: Record<string, never>;
	};
};

/**
 * Aggregate reads bottom out in `ctx.runQuery(component.btree.*)`, so a
 * recording ctx is enough to assert what the wrapper forwards.
 */
function createRecordingCtx(result: { count: number; sum: number }) {
	const calls: Array<{ reference: unknown; args: Record<string, unknown> }> = [];

	return {
		calls,
		ctx: {
			runQuery: async (reference: unknown, args: Record<string, unknown>) => {
				calls.push({ reference, args });
				return result;
			},
			 
		} as any,
	};
}

const fakeComponent = {
	btree: { aggregateBetween: "btree.aggregateBetween" },
	 
} as any;

function createTestCounters() {
	return defineCounters<typesTestDataModel>()((counter) => ({
		bookings: counter("bookings", {
			component: fakeComponent,
			namespace: (doc) => doc.accommodationId,
			sumValue: (doc) => doc.totalPrice,
		}),
		members: counter("members", {
			component: fakeComponent,
		}),
	}));
}

describe("defineCounters", () => {
	it("exposes a counter per definition plus mutation wiring", () => {
		const { counters, mutation, internalMutation, wrapDB, triggers } =
			createTestCounters();

		expect(Object.keys(counters).sort()).toEqual(["bookings", "members"]);
		expect(counters.bookings.count).toBeTypeOf("function");
		expect(counters.bookings.sum).toBeTypeOf("function");
		expect(counters.bookings.backfill).toBeTypeOf("function");
		expect(counters.bookings.aggregate).toBeDefined();
		expect(mutation).toBeTypeOf("function");
		expect(internalMutation).toBeTypeOf("function");
		expect(wrapDB).toBeTypeOf("function");
		expect(triggers).toBeDefined();
	});

	it("registers exactly one trigger per followed table", () => {
		const { triggers } = createTestCounters();

		// Without this registration the aggregate never sees writes and the
		// count silently drifts — the failure mode the wrapper exists to prevent.
		expect(triggers.registered.bookings).toHaveLength(1);
		expect(triggers.registered.members).toHaveLength(1);
	});

	it("forwards the namespace on reads for a namespaced counter", async () => {
		const { counters } = createTestCounters();
		const { ctx, calls } = createRecordingCtx({ count: 7, sum: 250 });

		const count = await counters.bookings.count(ctx, "accommodation-1");
		const sum = await counters.bookings.sum(ctx, "accommodation-1");

		expect(count).toBe(7);
		expect(sum).toBe(250);
		expect(calls).toHaveLength(2);
		for (const call of calls) {
			expect(call.args.namespace).toBe("accommodation-1");
		}
	});

	it("sends an undefined namespace for a counter without one", async () => {
		const { counters } = createTestCounters();
		const { ctx, calls } = createRecordingCtx({ count: 3, sum: 0 });

		expect(await counters.members.count(ctx)).toBe(3);
		expect(calls[0]!.args.namespace).toBeUndefined();
	});

	it("backfills a page and reports the cursor", async () => {
		const { counters } = createTestCounters();
		const inserted: Array<{ accommodationId: string }> = [];

		counters.bookings.aggregate.insertIfDoesNotExist = (async (
			_ctx: unknown,
			doc: { accommodationId: string },
		) => {
			inserted.push(doc);
			 
		}) as any;

		const page = [
			{ _id: "a", _creationTime: 1, accommodationId: "x", totalPrice: 10 },
			{ _id: "b", _creationTime: 2, accommodationId: "y", totalPrice: 20 },
		];

		const ctx = {
			db: {
				query: () => ({
					paginate: async () => ({
						page,
						continueCursor: "cursor-2",
						isDone: false,
					}),
				}),
			},
			 
		} as any;

		const result = await counters.bookings.backfill(ctx, { pageSize: 2 });

		expect(result).toEqual({
			cursor: "cursor-2",
			isDone: false,
			processed: 2,
		});
		expect(inserted).toEqual(page);
	});
});

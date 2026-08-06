// LIBRARIES
import { TableAggregate } from "@convex-dev/aggregate";
import {
	customCtx,
	customMutation,
} from "convex-helpers/server/customFunctions";
import { Triggers } from "convex-helpers/server/triggers";
import {
	internalMutationGeneric,
	mutationGeneric,
	type DocumentByName,
	type GenericDataModel,
	type GenericMutationCtx,
	type GenericQueryCtx,
	type TableNamesInDataModel,
} from "convex/server";
import type { Value as ConvexValue } from "convex/values";

/**
 * The aggregate component handle produced by `app.use(aggregate, { name })`.
 * Derived from the constructor so it tracks the installed version exactly.
 */
type typesAggregateComponent = ConstructorParameters<typeof TableAggregate>[0];

/** Sort keys and namespaces must be Convex values — they live in the B-tree. */
type typesCounterSortKey = ConvexValue;
type typesCounterNamespace = ConvexValue | undefined;

type typesCounterQueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;
type typesCounterMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runQuery" | "runMutation"
>;

export type typesCounterOptions<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<DataModel>,
	Namespace extends typesCounterNamespace,
	Key extends typesCounterSortKey,
> = {
	/** The `components.<name>` handle for this counter's aggregate instance. */
	component: typesAggregateComponent;
	/**
	 * Partitions the counter into independent B-trees. Writes to different
	 * namespaces never contend, so this is the scaling lever — pick the id you
	 * scope counts by (`accommodationId`, `organizationId`).
	 */
	namespace?: (doc: DocumentByName<DataModel, TableName>) => Namespace;
	/** Order within a namespace. Defaults to `_creationTime`. */
	sortKey?: (doc: DocumentByName<DataModel, TableName>) => Key;
	/** Makes `sum()` meaningful — e.g. `(doc) => doc.totalPrice`. */
	sumValue?: (doc: DocumentByName<DataModel, TableName>) => number;
};

/** One declared counter. Produced by the `counter()` builder. */
export type typesCounterSpec<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<DataModel>,
	Namespace extends typesCounterNamespace,
	Key extends typesCounterSortKey,
> = typesCounterOptions<DataModel, TableName, Namespace, Key> & {
	table: TableName;
};

/** Reads take a namespace argument only when the counter declares one. */
type typesCounterRead<Namespace> = undefined extends Namespace
	? (ctx: typesCounterQueryCtx) => Promise<number>
	: (ctx: typesCounterQueryCtx, namespace: Namespace) => Promise<number>;

export type typesCounterApi<
	DataModel extends GenericDataModel,
	TableName extends TableNamesInDataModel<DataModel>,
	Namespace extends typesCounterNamespace,
	Key extends typesCounterSortKey,
> = {
	/** How many rows exist right now. O(log n), exact, transactional. */
	count: typesCounterRead<Namespace>;
	/** Total of `sumValue` across those rows. 0 when `sumValue` is unset. */
	sum: typesCounterRead<Namespace>;
	/**
	 * Insert one page of pre-existing rows into the tree.
	 *
	 * An aggregate only sees rows written after its trigger is wired, so a table
	 * with existing data reads 0 until it is backfilled. Uses
	 * `insertIfDoesNotExist`, so re-running a page is safe.
	 */
	backfill: (
		ctx: GenericMutationCtx<DataModel>,
		opts?: { cursor?: string | null; pageSize?: number },
	) => Promise<{ cursor: string | null; isDone: boolean; processed: number }>;
	/** The underlying aggregate — for min/max/at/indexOf/paginate/clear. */
	aggregate: TableAggregate<{
		Key: Key;
		DataModel: DataModel;
		TableName: TableName;
		Namespace: Namespace;
	}>;
};

type typesCounterSpecConstraint<DataModel extends GenericDataModel> = {
	table: TableNamesInDataModel<DataModel>;
};

/** Erased shape used at runtime, where the per-table generics no longer matter. */
type typesRuntimeCounterSpec<DataModel extends GenericDataModel> = {
	table: TableNamesInDataModel<DataModel>;
	component: typesAggregateComponent;
	 
	namespace?: (doc: any) => ConvexValue;
	 
	sortKey?: (doc: any) => typesCounterSortKey;
	 
	sumValue?: (doc: any) => number;
};

/** Builder handed to the `defineCounters` callback, pre-bound to your DataModel. */
export type typesCounterBuilder<DataModel extends GenericDataModel> = <
	TableName extends TableNamesInDataModel<DataModel>,
	Namespace extends typesCounterNamespace = undefined,
	Key extends typesCounterSortKey = number,
>(
	table: TableName,
	options: typesCounterOptions<DataModel, TableName, Namespace, Key>,
) => typesCounterSpec<DataModel, TableName, Namespace, Key>;

export type typesCountersApi<
	DataModel extends GenericDataModel,
	Specs extends Record<string, typesCounterSpecConstraint<DataModel>>,
> = {
	counters: {
		[Name in keyof Specs]: Specs[Name] extends typesCounterSpec<
			DataModel,
			infer TableName,
			infer Namespace,
			infer Key
		>
			? typesCounterApi<DataModel, TableName, Namespace, Key>
			: never;
	};
	/** Drop-in replacements for `mutation` / `internalMutation`. */
	mutation: ReturnType<typeof customMutation>;
	internalMutation: ReturnType<typeof customMutation>;
	/** Compose into an existing `customMutation` instead of using ours. */
	wrapDB: Triggers<DataModel>["wrapDB"];
	triggers: Triggers<DataModel>;
};

const DEFAULT_BACKFILL_PAGE_SIZE = 200;

/**
 * Declare exact, live counters backed by `@convex-dev/aggregate`.
 *
 * Counters answer "how many rows exist right now" — bookings for an
 * accommodation, members in an organization. They are exact and transactional
 * because the aggregate updates inside the same mutation as the row change.
 * For historical questions ("how many bookings last month") use analytics
 * metrics instead; those are rollup-based and approximate by contract.
 *
 * Curried so the data model is stated once, then a callback receives a
 * `counter` builder already bound to it — each counter infers its own document,
 * namespace, and sort key types from the table it names.
 *
 * @example
 * ```ts
 * // convex/convex.config.ts
 * app.use(aggregate, { name: "bookingsByAccommodation" });
 *
 * // convex/counters.ts
 * export const { counters, mutation } = defineCounters<DataModel>()((counter) => ({
 *   bookings: counter("bookings", {
 *     component: components.bookingsByAccommodation,
 *     namespace: (doc) => doc.accommodationId,
 *     sumValue: (doc) => doc.totalPrice,
 *   }),
 * }));
 *
 * // anywhere
 * const total = await counters.bookings.count(ctx, accommodationId);
 * ```
 *
 * Every mutation that writes a followed table must go through the exported
 * `mutation` (or your own wrapper composed with `wrapDB`). A raw `mutation`
 * skips the trigger and the count drifts silently and permanently.
 */
export function defineCounters<DataModel extends GenericDataModel>() {
	const counter = ((table: string, options: object) => ({
		table,
		...options,
		 
	})) as any as typesCounterBuilder<DataModel>;

	return function createCounters<
		Specs extends Record<string, typesCounterSpecConstraint<DataModel>>,
	>(
		build: (counter: typesCounterBuilder<DataModel>) => Specs,
	): typesCountersApi<DataModel, Specs> {
		const specs = build(counter);

		const triggers = new Triggers<DataModel>();
		const counters = {} as typesCountersApi<DataModel, Specs>["counters"];

		for (const name of Object.keys(specs) as Array<keyof Specs & string>) {
			const spec = specs[
				name
			] as unknown as typesRuntimeCounterSpec<DataModel>;

			const aggregate = new TableAggregate(spec.component, {
				sortKey:
					spec.sortKey ??
					((doc: { _creationTime: number }) => doc._creationTime),
				...(spec.namespace ? { namespace: spec.namespace } : {}),
				...(spec.sumValue ? { sumValue: spec.sumValue } : {}),
				 
			} as any);

			triggers.register(
				spec.table,
				aggregate.trigger<GenericMutationCtx<DataModel>>(),
			);

			const read =
				(method: "count" | "sum") =>
				async (ctx: typesCounterQueryCtx, namespace?: ConvexValue) =>
					await aggregate[method](
						ctx as typesCounterMutationCtx,
						// A namespaced tree requires the namespace; a plain one rejects it.
						 
						...((spec.namespace ? [{ namespace }] : []) as any),
					);

			const backfill = async (
				ctx: GenericMutationCtx<DataModel>,
				opts?: { cursor?: string | null; pageSize?: number },
			) => {
				const page = await ctx.db.query(spec.table).paginate({
					cursor: opts?.cursor ?? null,
					numItems: opts?.pageSize ?? DEFAULT_BACKFILL_PAGE_SIZE,
				});

				for (const doc of page.page) {
					await aggregate.insertIfDoesNotExist(ctx, doc);
				}

				return {
					cursor: page.continueCursor,
					isDone: page.isDone,
					processed: page.page.length,
				};
			};

			counters[name] = {
				count: read("count"),
				sum: read("sum"),
				backfill,
				aggregate,
				 
			} as any;
		}

		return {
			counters,
			mutation: customMutation(mutationGeneric, customCtx(triggers.wrapDB)),
			internalMutation: customMutation(
				internalMutationGeneric,
				customCtx(triggers.wrapDB),
			),
			wrapDB: triggers.wrapDB,
			triggers,
		};
	};
}

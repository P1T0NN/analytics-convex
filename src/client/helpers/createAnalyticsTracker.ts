// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// UTILS
import { internalAnalyticsConfigReference } from "../utils/configReference";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsRuntimeConfig,
	typesTrackEventInput,
	typesTrackEventsInput,
	typesTypedTrackBatchInputForEvents,
	typesTypedTrackEventInputForEvents,
	typesTypedTrackEventOptions,
	typesUnifiedTrackInputForEvents,
} from "../../shared/types/index.js";

type typesMutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"runMutation"
>;

type typesAnalyticsTrackHelper<
	Events extends readonly typesAnalyticsEventConfig[],
> = {
	<Name extends Events[number]["name"]>(
		ctx: typesMutationCtx,
		name: Name,
		input: typesTypedTrackEventOptions<Events, Name>,
	): Promise<unknown>;
	(
		ctx: typesMutationCtx,
		input: typesTypedTrackEventInputForEvents<Events>,
	): Promise<unknown>;
	(
		ctx: typesMutationCtx,
		input: typesTypedTrackBatchInputForEvents<Events>,
	): Promise<unknown>;
};

function isBatchTrackInput<Events extends readonly typesAnalyticsEventConfig[]>(
	input: typesUnifiedTrackInputForEvents<Events>,
): input is typesTypedTrackBatchInputForEvents<Events> {
	return "events" in input;
}

/**
 * @internal Used by `defineAnalytics()` — not part of the public package API.
 *
 * Create typed server-side tracking helpers from your event config.
 */
export function createAnalyticsTracker<
	const Events extends readonly typesAnalyticsEventConfig[],
>(
	component: ComponentApi,
	_events: Events,
	config: typesAnalyticsRuntimeConfig,
) {
	const configReference = internalAnalyticsConfigReference(config);

	const track: typesAnalyticsTrackHelper<Events> = async (
		ctx: typesMutationCtx,
		nameOrInput:
			| Events[number]["name"]
			| typesUnifiedTrackInputForEvents<Events>,
		input?: typesTypedTrackEventOptions<Events, Events[number]["name"]>,
	) => {
		let events: typesTrackEventsInput;

		if (typeof nameOrInput === "string") {
			events = [
				{
					...input,
					name: nameOrInput,
				} as typesTrackEventInput<Events[number]["name"]>,
			];
		} else if (isBatchTrackInput(nameOrInput)) {
			events = [...nameOrInput.events] as typesTrackEventInput[];
		} else {
			events = [nameOrInput as typesTrackEventInput];
		}

		return await ctx.runMutation(component.lib.writeTrack, {
			...configReference,
			events,
		});
	};

	return {
		track,
	};
}

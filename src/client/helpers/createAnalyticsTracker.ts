// LIBRARIES
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type {
  typesAnalyticsEventConfig,
  typesTrackEventInput,
  typesTypedTrackBatchInputForEvents,
  typesTypedTrackEventInputForEvents,
  typesTypedTrackEventOptions,
  typesUnifiedTrackInputForEvents,
} from "../types/types";

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
 * Create typed server-side tracking helpers from your event config.
 *
 * Use from app mutations that already implement their own authorization.
 */
export function createAnalyticsTracker<
  const Events extends readonly typesAnalyticsEventConfig[],
>(component: ComponentApi, _events: Events) {
  const track: typesAnalyticsTrackHelper<Events> = async (
    ctx: typesMutationCtx,
    nameOrInput:
      | Events[number]["name"]
      | typesUnifiedTrackInputForEvents<Events>,
    input?: typesTypedTrackEventOptions<Events, Events[number]["name"]>,
  ) => {
    if (typeof nameOrInput === "string") {
      const event = {
        ...input,
        name: nameOrInput,
      } as typesTrackEventInput<Events[number]["name"]>;

      return await ctx.runMutation(component.lib.writeTrack, event);
    }

    if (isBatchTrackInput(nameOrInput)) {
      const events = [...nameOrInput.events] as typesTrackEventInput[];

      return await ctx.runMutation(component.lib.writeTrack, {
        events,
      });
    }

    return await ctx.runMutation(
      component.lib.writeTrack,
      nameOrInput as typesTrackEventInput,
    );
  };

  return {
    track,
  };
}

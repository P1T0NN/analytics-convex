// TYPES
import type { typesAnalyticsEventConfig } from "./config.js";
import type { typesAnalyticsPropertyType } from "./primitives.js";
import type { typesTrackEventInput } from "./tracking.js";

export type typesPropertyValueForConfig<Type> = Type extends "string"
	? string
	: Type extends "number"
		? number
		: Type extends "boolean"
			? boolean
			: never;

type typesEventConfigForName<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Extract<Events[number], { name: Name }>;

type typesPropertiesConfigForEvent<Event> = Event extends {
	properties: infer Properties;
}
	? Properties
	: Record<string, never>;

type typesRequiredPropertyNamesForEvent<Event> = Event extends {
	requiredProperties: readonly (infer RequiredProperty)[];
}
	? RequiredProperty
	: never;

type typesTypedPropertiesInput<Event> =
	typesPropertiesConfigForEvent<Event> extends Record<
		string,
		typesAnalyticsPropertyType
	>
		? {
				[Key in Extract<
					typesRequiredPropertyNamesForEvent<Event>,
					keyof typesPropertiesConfigForEvent<Event>
				>]: typesPropertyValueForConfig<
					typesPropertiesConfigForEvent<Event>[Key]
				>;
			} & {
				[Key in Exclude<
					keyof typesPropertiesConfigForEvent<Event>,
					typesRequiredPropertyNamesForEvent<Event>
				>]?: typesPropertyValueForConfig<
					typesPropertiesConfigForEvent<Event>[Key]
				> | null;
			}
		: Record<string, never>;

type typesTrackPropertiesField<Event> =
	Extract<
		typesRequiredPropertyNamesForEvent<Event>,
		keyof typesPropertiesConfigForEvent<Event>
	> extends never
		? { properties?: typesTypedPropertiesInput<Event> }
		: { properties: typesTypedPropertiesInput<Event> };

export type typesTypedTrackEventInput<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Omit<typesTrackEventInput<Name>, "name" | "properties"> & {
	name: Name;
} & typesTrackPropertiesField<typesEventConfigForName<Events, Name>>;

export type typesTypedTrackEventOptions<
	Events extends readonly typesAnalyticsEventConfig[],
	Name extends Events[number]["name"],
> = Omit<typesTypedTrackEventInput<Events, Name>, "name">;

export type typesTypedTrackEventInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> = {
	[Name in Events[number]["name"]]: typesTypedTrackEventInput<Events, Name>;
}[Events[number]["name"]];

export type typesTypedTrackBatchInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> = {
	events: readonly typesTypedTrackEventInputForEvents<Events>[];
};

export type typesUnifiedTrackInputForEvents<
	Events extends readonly typesAnalyticsEventConfig[],
> =
	| typesTypedTrackEventInputForEvents<Events>
	| typesTypedTrackBatchInputForEvents<Events>;

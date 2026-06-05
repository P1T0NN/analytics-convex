// TYPES
import type {
  typesAnalyticsAggregation,
  typesAnalyticsEventConfig,
  typesAnalyticsMetricConfig,
  typesAnalyticsTrafficMode,
  typesAnalyticsUnit,
} from "../types/types";

type typesMetricBuilderState = {
  label: string;
  unit: typesAnalyticsUnit;
  eventNames: readonly string[];
  aggregation: typesAnalyticsAggregation;
  valueProperty?: string;
  dimensions?: readonly string[];
  description?: string;
  trafficMode?: typesAnalyticsTrafficMode;
  adminOnly?: boolean;
};

export type typesAnalyticsEventMap = Record<string, typesAnalyticsEventConfig>;

type typesMapValue<Map> = Map[keyof Map];

export type typesEventNameForMap<Events extends typesAnalyticsEventMap> =
  string extends keyof Events
    ? string
    : Extract<typesMapValue<Events>, typesAnalyticsEventConfig>["name"];

type typesEventForName<
  Events extends typesAnalyticsEventMap,
  Name extends string,
> = Extract<typesMapValue<Events>, { name: Name }>;

type typesPropertiesForEvent<Event> = Event extends {
  properties: infer Properties;
}
  ? Properties
  : Record<string, never>;

type typesDimensionNameForEvents<
  Events extends typesAnalyticsEventMap,
  Names extends string,
> = string extends Names
  ? string
  : Names extends string
    ? Extract<
        keyof typesPropertiesForEvent<typesEventForName<Events, Names>>,
        string
      >
    : never;

type typesCommonPropertiesForEvents<
  Events extends typesAnalyticsEventMap,
  Names extends string,
> = typesPropertiesForEvent<typesEventForName<Events, Names>>;

type typesNumberPropertyNameForEvents<
  Events extends typesAnalyticsEventMap,
  Names extends string,
> = string extends Names
  ? string
  : {
      [Key in Extract<
        keyof typesCommonPropertiesForEvents<Events, Names>,
        string
      >]: typesCommonPropertiesForEvents<Events, Names>[Key] extends "number"
        ? Key
        : never;
    }[Extract<keyof typesCommonPropertiesForEvents<Events, Names>, string>];

export type typesAnalyticsMetricBuilder<
  Events extends typesAnalyticsEventMap = Record<
    string,
    typesAnalyticsEventConfig
  >,
  SelectedEventName extends string = typesEventNameForMap<Events>,
  Dimensions extends string = never,
> = {
  from<
    const EventNames extends readonly [
      typesEventNameForMap<Events>,
      ...typesEventNameForMap<Events>[],
    ],
  >(
    ...eventNames: EventNames
  ): typesAnalyticsMetricBuilder<Events, EventNames[number], Dimensions>;
  by<
    const DimensionNames extends readonly typesDimensionNameForEvents<
      Events,
      SelectedEventName
    >[],
  >(
    ...dimensions: DimensionNames
  ): typesAnalyticsMetricBuilder<
    Events,
    SelectedEventName,
    DimensionNames[number]
  >;
  value<
    const Property extends typesNumberPropertyNameForEvents<
      Events,
      SelectedEventName
    >,
  >(
    property: Property,
  ): typesAnalyticsMetricBuilder<Events, SelectedEventName, Dimensions>;
  unit(
    unit: typesAnalyticsUnit,
  ): typesAnalyticsMetricBuilder<Events, SelectedEventName, Dimensions>;
  description(
    description: string,
  ): typesAnalyticsMetricBuilder<Events, SelectedEventName, Dimensions>;
  trafficMode(
    mode: typesAnalyticsTrafficMode,
  ): typesAnalyticsMetricBuilder<Events, SelectedEventName, Dimensions>;
  adminOnly(
    adminOnly?: boolean,
  ): typesAnalyticsMetricBuilder<Events, SelectedEventName, Dimensions>;
  build(name: string): typesAnalyticsMetricConfig<
    string,
    typesEventNameForMap<Events>
  > & {
    dimensions?: readonly Dimensions[];
  };
};

export type typesAnalyticsMetricBuilders<
  Events extends typesAnalyticsEventMap,
> = {
  count(label: string): typesAnalyticsMetricBuilder<Events>;
  sum(
    label: string,
    unit?: typesAnalyticsUnit,
  ): typesAnalyticsMetricBuilder<Events>;
};

class AnalyticsMetricBuilder {
  constructor(private readonly state: typesMetricBuilderState) {}

  from<const EventNames extends readonly [string, ...string[]]>(
    ...eventNames: EventNames
  ) {
    return this.with({ eventNames });
  }

  by<const Dimensions extends readonly string[]>(...dimensions: Dimensions) {
    return this.with({ dimensions });
  }

  value<const Property extends string>(property: Property) {
    return this.with({ valueProperty: property });
  }

  unit(unit: typesAnalyticsUnit) {
    return this.with({ unit });
  }

  description(description: string) {
    return this.with({ description });
  }

  trafficMode(mode: typesAnalyticsTrafficMode) {
    return this.with({ trafficMode: mode });
  }

  adminOnly(adminOnly = true) {
    return this.with({ adminOnly });
  }

  build(name: string): typesAnalyticsMetricConfig {
    return {
      name,
      label: this.state.label,
      unit: this.state.unit,
      eventNames: [...this.state.eventNames],
      aggregation: this.state.aggregation,
      ...(this.state.valueProperty
        ? { valueProperty: this.state.valueProperty }
        : {}),
      ...(this.state.dimensions
        ? { dimensions: [...this.state.dimensions] }
        : {}),
      ...(this.state.description
        ? { description: this.state.description }
        : {}),
      ...(this.state.trafficMode
        ? { trafficMode: this.state.trafficMode }
        : {}),
      ...(this.state.adminOnly !== undefined
        ? { adminOnly: this.state.adminOnly }
        : {}),
    };
  }

  private with(patch: Partial<typesMetricBuilderState>) {
    return new AnalyticsMetricBuilder({
      ...this.state,
      ...patch,
    });
  }
}

function createMetricBuilder<Events extends typesAnalyticsEventMap>(
  state: typesMetricBuilderState,
) {
  return new AnalyticsMetricBuilder(
    state,
  ) as unknown as typesAnalyticsMetricBuilder<Events>;
}

export function count(label: string) {
  return createMetricBuilder<Record<string, typesAnalyticsEventConfig>>({
    label,
    unit: "count",
    eventNames: [],
    aggregation: "count",
  });
}

export function sum(label: string, unit: typesAnalyticsUnit = "count") {
  return createMetricBuilder<Record<string, typesAnalyticsEventConfig>>({
    label,
    unit,
    eventNames: [],
    aggregation: "sum",
  });
}

export function createAnalyticsMetricBuilders<
  Events extends typesAnalyticsEventMap,
>(): typesAnalyticsMetricBuilders<Events> {
  return {
    count: (label) =>
      createMetricBuilder<Events>({
        label,
        unit: "count",
        eventNames: [],
        aggregation: "count",
      }),
    sum: (label, unit = "count") =>
      createMetricBuilder<Events>({
        label,
        unit,
        eventNames: [],
        aggregation: "sum",
      }),
  };
}

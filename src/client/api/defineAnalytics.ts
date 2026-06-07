// LIBRARIES
import type { Auth } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// API
import { createAnalyticsApi } from "./createAnalyticsApi";

// BUILDERS
import { createAnalyticsMetricBuilders } from "../builders/metric";

// HELPERS
import { createAnalyticsServerHelpers } from "../helpers/createAnalyticsServerHelpers";

// CRONS
import { registerAnalyticsCrons } from "../crons/registerAnalyticsCrons";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsOperation,
	typesAnalyticsSettings,
} from "../types/types";
import type {
	typesAnalyticsMetricBuilder,
	typesAnalyticsMetricBuilders,
	typesEventNameForMap,
} from "../builders/metric";

type typesAnalyticsEventMap = Record<string, typesAnalyticsEventConfig>;
type typesAnalyticsMetricBuilderMap<Events extends typesAnalyticsEventMap> =
	Record<
		string,
		typesAnalyticsMetricBuilder<Events, typesEventNameForMap<Events>, string>
	>;
type typesMapValue<Map> = Map[keyof Map];
type typesAnalyticsMetricsInput<
	Events extends typesAnalyticsEventMap,
	Metrics extends typesAnalyticsMetricBuilderMap<Events>,
> = Metrics | ((builders: typesAnalyticsMetricBuilders<Events>) => Metrics);

type typesMetricConfigsForMap<
	Events extends typesAnalyticsEventMap,
	Metrics extends typesAnalyticsMetricBuilderMap<Events>,
> = readonly {
	[Name in Extract<
		keyof Metrics,
		string
	>]: Metrics[Name] extends typesAnalyticsMetricBuilder<
		Events,
		string,
		infer Dimensions
	>
		? typesAnalyticsMetricConfig<Name, typesMapValue<Events>["name"]> & {
				dimensions?: readonly Dimensions[];
			}
		: never;
}[Extract<keyof Metrics, string>][];

export function defineAnalytics<
	const Events extends typesAnalyticsEventMap,
	const Metrics extends typesAnalyticsMetricBuilderMap<Events>,
>(
	component: ComponentApi,
	options: {
		events: Events;
		metrics: typesAnalyticsMetricsInput<Events, Metrics>;
		settings?: Partial<typesAnalyticsSettings>;
		authorize?: (
			ctx: { auth: Auth },
			operation: typesAnalyticsOperation,
		) => Promise<void>;
	},
) {
	const events = Object.values(
		options.events,
	) as unknown as readonly typesMapValue<Events>[];
	const metricBuilders =
		typeof options.metrics === "function"
			? options.metrics(createAnalyticsMetricBuilders<Events>())
			: options.metrics;
	const metrics = Object.entries(metricBuilders).map(([name, metric]) =>
		metric.build(name),
	) as unknown as typesMetricConfigsForMap<Events, Metrics>;

	const config = {
		events: events as any,
		metrics: metrics as any,
		settings: (options.settings ?? {}) as any,
	};

	return {
		...createAnalyticsServerHelpers(
			component,
			events,
			metrics,
			options.settings,
		),
		client: createAnalyticsApi(component, {
			events,
			metrics,
			...(options.settings ? { settings: options.settings } : {}),
			...(options.authorize ? { authorize: options.authorize } : {}),
		}),
		/** The runtime config object — inspect, override, or pass to crons. */
		config,
		/** Register maintenance cron jobs. Call from convex/crons.ts. */
		registerCrons(
			crons: any,
			internalApi: any,
			cronOptions?: {
				highVolumeBatchIntervalMinutes?: number;
				retentionIntervalHours?: number;
			},
		) {
			registerAnalyticsCrons(crons, internalApi, config, cronOptions);
		},
	};
}

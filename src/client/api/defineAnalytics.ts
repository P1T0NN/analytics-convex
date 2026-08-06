// LIBRARIES
import type { Auth, Crons, FunctionReference } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// API
import { createAnalyticsApi } from "./createAnalyticsApi";

// BUILDERS
import { internalCreateAnalyticsMetricBuilders } from "../builders/metric";

// HELPERS
import { internalCreateAnalyticsServerHelpers } from "../helpers/createAnalyticsServerHelpers";
import { createAnalyticsTracker } from "../helpers/createAnalyticsTracker";

// CRONS
import { registerAnalyticsCrons } from "../crons/registerAnalyticsCrons";
import { createAnalyticsCronHandlers } from "../crons/createAnalyticsCronHandlers";

// UTILS
import { internalCreateAnalyticsConfiguration } from "../utils/createAnalyticsConfiguration";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfig,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsOperation,
} from "../../shared/types/operations.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";
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
		funnels?: typesAnalyticsFunnelsConfig;
		journeys?: typesAnalyticsJourneysConfig;
		settings?: Partial<typesAnalyticsSettings>;
		authorize?: (
			ctx: { auth: Auth },
			operation: typesAnalyticsOperation,
		) => Promise<void>;
	},
) {
	const events = Object.values(options.events) as unknown as readonly typesMapValue<Events>[];
	const metricBuilders =
		typeof options.metrics === "function"
			? options.metrics(internalCreateAnalyticsMetricBuilders<Events>())
			: options.metrics;
	const metrics = Object.entries(metricBuilders).map(([name, metric]) =>
		metric.build(name),
	) as unknown as typesMetricConfigsForMap<Events, Metrics>;

	const config = internalCreateAnalyticsConfiguration(
		events,
		metrics,
		options.settings,
		options.funnels,
		options.journeys,
	);

	return {
		...internalCreateAnalyticsServerHelpers(
			component,
			events,
			metrics,
			options.settings,
			options.funnels,
			options.journeys,
		),
		/** Typed `track(ctx, "event.name", {...})` helper for server code. */
		...createAnalyticsTracker(component, events, config),
		/** Registered Convex functions — re-export these from a convex module. */
		client: createAnalyticsApi(component, {
			events,
			metrics,
			...(options.funnels ? { funnels: options.funnels } : {}),
			...(options.journeys ? { journeys: options.journeys } : {}),
			...(options.settings ? { settings: options.settings } : {}),
			...(options.authorize ? { authorize: options.authorize } : {}),
		}),
		/** Internal cron handler mutations — export from `convex/analytics/crons.ts`. */
		crons: createAnalyticsCronHandlers(component, config),
		/** The runtime config object — inspect, override, or pass to crons. */
		config,
		/** Register maintenance cron jobs. Call from convex/crons.ts. */
		registerCrons(
			crons: Crons,
			internalApi: {
				processPendingHighVolumeAnalyticsEvents: FunctionReference<
					"mutation",
					"internal",
					{ configHash: string; remainingCatchupBatches?: number },
					unknown
				>;
				purgeStaleAnalyticsEvents: FunctionReference<
					"mutation",
					"internal",
					{ configHash: string },
					unknown
				>;
				purgeStaleAnalyticsRollups: FunctionReference<
					"mutation",
					"internal",
					{ configHash: string },
					unknown
				>;
				compactAnalyticsRollups: FunctionReference<
					"mutation",
					"internal",
					{ configHash: string },
					unknown
				>;
			},
			cronOptions?: {
				highVolumeBatchIntervalMinutes?: number;
				retentionIntervalHours?: number;
			},
		) {
			registerAnalyticsCrons(crons, internalApi, config, cronOptions);
		},
	};
}

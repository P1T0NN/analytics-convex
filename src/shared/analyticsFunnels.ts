export type typesAnalyticsFunnelConfig = {
	label: string;
	steps: string[];
};

export type typesAnalyticsFunnelsConfig = Record<
	string,
	typesAnalyticsFunnelConfig
>;

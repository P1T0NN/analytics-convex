import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { analytics } from "./analytics";

const crons = cronJobs();

analytics.registerCrons(crons, internal.analytics);

export default crons;

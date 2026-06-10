import { defineApp } from "convex/server";
import analytics from "../../dist/component/convex.config.js";

const app = defineApp();
app.use(analytics);

export default app;

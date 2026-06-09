# Installation

```bash
npm install @piton-/analytics-convex
```

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import analytics from "@piton-/analytics-convex/convex.config.js";

const app = defineApp();
app.use(analytics);

export default app;
```

Run `npx convex dev` to regenerate the generated API.

---

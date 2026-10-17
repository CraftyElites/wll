/**
 * Webever Labs API
 * Single entry: mount routes under /v1, health + /s under public.
 */
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cfg } from "./config.js";
import { corsGuard, originSecret } from "./middleware/security.js";
import { errorHandler } from "./middleware/request.js";
import account from "./routes/account.js";
import data from "./routes/data.js";
import run from "./routes/run.js";
import pub from "./routes/public.js";

const app = new Hono();

app.onError(errorHandler);
app.use("*", corsGuard);
app.use("*", originSecret);

// Public (no auth)
app.route("/v1", pub);

// Authenticated surface
app.route("/v1", account);
app.route("/v1", data);
app.route("/v1", run);

app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));

const port = cfg.PORT;
console.log(`webever-api listening on :${port} (${cfg.NODE_ENV})`);
serve({ fetch: app.fetch, port });

export default app;

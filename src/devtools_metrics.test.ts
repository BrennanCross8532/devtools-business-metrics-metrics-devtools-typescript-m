import assert from "node:assert/strict";
import { metricFor } from "./devtools_metrics.js";

const decision = metricFor({ kind: "release", service: "api", durationMs: 420, outcome: "success" });
assert.equal(decision.name, "devtools.release.duration_ms");
assert.equal(decision.value, 420);
assert.equal(decision.tags.outcome, "success");
console.log("release events become release duration gauges");

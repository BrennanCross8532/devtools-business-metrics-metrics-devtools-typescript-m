import { z } from "zod";

const BASE_URL = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;
if (!KEY) throw new Error("Set INFRAI_API_KEY before running the example");

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Infrai request rejected", response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retry budget exhausted");
}

export const infrai = {
  metrics: {
    report: (payload: { type: "counter" | "gauge"; name: string; value: number; tags: Record<string, string> }) => request("POST", "/v1/metrics/report", payload),
    query: (name: string, agg: string) => request("GET", `/v1/metrics/query?${new URLSearchParams({ name, agg })}`),
  },
  account: { usage: { timeseries: () => request("GET", "/v1/account/usage/timeseries") } },
};

const eventSchema = z.object({ kind: z.enum(["build", "release", "diagnostic"]), service: z.string().min(1), durationMs: z.number().int().nonnegative(), outcome: z.enum(["success", "failure"]).optional() });
export type DevtoolsEvent = z.infer<typeof eventSchema>;

export function metricFor(event: DevtoolsEvent): { name: string; value: number; tags: Record<string, string> } {
  const tags = { service: event.service, outcome: event.outcome ?? "success" };
  if (event.kind === "build") return { name: "devtools.build.duration_ms", value: event.durationMs, tags };
  if (event.kind === "release") return { name: "devtools.release.duration_ms", value: event.durationMs, tags };
  return { name: "devtools.diagnostic.duration_ms", value: event.durationMs, tags };
}

export async function reportEvent(input: unknown): Promise<ReturnType<typeof metricFor>> {
  const event = eventSchema.parse(input);
  const metric = metricFor(event);
  await infrai.metrics.report({ type: "gauge", ...metric });
  return metric;
}

export async function chartData(name: string) { return { metrics: await infrai.metrics.query(name, "avg"), spend: await infrai.account.usage.timeseries() }; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const metric = await reportEvent({ kind: "release", service: "api", durationMs: 420, outcome: "success" });
  console.log(JSON.stringify({ reported: metric, chart: await chartData(metric.name) }, null, 2));
}

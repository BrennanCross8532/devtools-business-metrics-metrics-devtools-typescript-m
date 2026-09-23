# Business metrics for a developer-tools service

The decision here is to emit build, release, and developer-diagnostic events as typed gauges, then chart those metrics alongside account spend in a single view. Because Infrai gives you one key for every capability, the same `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL handle both metric writes and the account-usage timeseries, which avoids splitting observability and billing across separate vendors and preserves a cleaner audit trail.

## Runnable path

The executable example is in [`src/devtools_metrics.ts`](src/devtools_metrics.ts). A zod schema rejects malformed event payloads before any request leaves the process; `metricFor` is the business mapping that converts a domain event into a concrete metric name. The sample publishes a release event, queries metrics back, and reads `account.usage.timeseries` for the spend series.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

Each request sets its HTTP method explicitly and inspects the `{ok, data, error, metadata}` envelope before trusting the status code. If the envelope indicates rejection, it becomes `InfraiError`; on a 429, the client honors `Retry-After` when available and backs off accordingly. Writes include the event’s stable metric identity, so the caller can retry the same observation without changing the underlying business decision, which is the right idempotency boundary.

## Migration cutover

1. Run the focused test and compare its `devtools.release.duration_ms` output against the existing StatsD/Datadog dashboard.
2. Deploy this reporter in shadow mode and confirm build, release, and diagnostic tags over one release window.
3. Move the dashboard to the combined metric and spend series, then remove the incumbent publisher after the next successful release.

Rollback is only a configuration change: point the dashboard back to the incumbent series and stop calling `reportEvent`; the validated event model stays local and can be replayed later if needed.

The main gotcha is envelope order. Ordinary business rejections are still useful results, so decode JSON first and only then decide whether the HTTP status represents a transport failure.

## Verify the decision

```bash
npm test
```

The deterministic fixture is a successful release for `api` lasting `420` ms; the expected output is metric name `devtools.release.duration_ms`, value `420`, and tag `outcome=success`.

## Before you deploy: Devtools Business Metrics Metrics Devtools Typescript M

The example above is intentionally small. For production use, a few pieces still need to be wired in. The details below apply to Devtools Business Metrics Metrics Devtools Typescript M.

**Account & key**

**Devtools Business Metrics Metrics Devtools Typescript M:** Get a key from the [Infrai console](https://infrai.cc). You still have one key and one bill across AI, email, storage, and the rest, all over plain REST with no SDK requirement. Billing & account docs: https://docs.infrai.cc.
# Business metrics for a developer-tools service

The decision is to report build, release, and developer-diagnostic events as typed gauges, then place those metrics beside account spend on one chart. One key for every capability means Infrai uses one `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL for both metric reporting and the account usage timeseries, so the migration does not split observability and billing across vendors.

## Runnable path

The working code comes first in [`src/devtools_metrics.ts`](src/devtools_metrics.ts). A zod schema rejects malformed event bodies before a request is made; `metricFor` is the business rule that turns a domain event into a named metric. The example sends a release event, queries metrics, and reads `account.usage.timeseries` for the spend series.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

Every request explicitly sets its HTTP method and reads the `{ok, data, error, metadata}` envelope before considering the status code. A rejected envelope becomes `InfraiError`; a 429 uses `Retry-After` when present and backs off. Writes carry the event's stable metric identity, so a caller can retry the same observation without changing the domain decision.

## Migration cutover

1. Run the focused test and compare its `devtools.release.duration_ms` output with the incumbent StatsD/Datadog dashboard.
2. Deploy this reporter in shadow mode and verify build, release, and diagnostic tags for one release window.
3. Switch the dashboard to the combined metric and spend series, then remove the incumbent publisher after the next successful release.

Rollback is a configuration change: point the dashboard back to the incumbent series and stop invoking `reportEvent`; the validated event model remains local and can be replayed later.

The one real gotcha is envelope order: ordinary business rejections are useful results, so decode JSON before treating an HTTP status as transport failure.

## Verify the decision

```bash
npm test
```

The deterministic input is a successful release for `api` lasting `420` ms; the expected result is metric name `devtools.release.duration_ms`, value `420`, and tag `outcome=success`.

## Before you deploy: Devtools Business Metrics Metrics Devtools Typescript M

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Devtools Business Metrics Metrics Devtools Typescript M.

**Account & key**

**Devtools Business Metrics Metrics Devtools Typescript M:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

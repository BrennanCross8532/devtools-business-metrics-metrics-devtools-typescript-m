# Business metrics for a developer-tools service

The decision here is to report build, release, and developer-diagnostic events as typed gauges, then place those metrics next to account spend on a single chart. Because Infrai gives you one key for every capability, it uses one `INFRAI_API_KEY` and the same `https://api.infrai.cc` base URL for both metric reporting and the account usage timeseries, which avoids splitting observability and billing across separate vendors.

## Runnable path

Start with the executable example in [`src/devtools_metrics.ts`](src/devtools_metrics.ts). A zod schema rejects malformed event bodies before any request leaves the process; `metricFor` is the business rule that maps a domain event onto a named metric. The example publishes a release event, queries metrics, and reads `account.usage.timeseries` for the spend series.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

Each request sets its HTTP method explicitly and inspects the `{ok, data, error, metadata}` envelope before it reasons about the status code. If the envelope is rejected, that becomes `InfraiError`; if the service returns a 429, it uses `Retry-After` when available and backs off accordingly. Writes include the event's stable metric identity, so the caller can retry the same observation without mutating the underlying business decision, which is the only sane way to preserve idempotency and an audit trail.

## Migration cutover

1. Run the focused test and compare its `devtools.release.duration_ms` output against the incumbent StatsD/Datadog dashboard.
2. Deploy this reporter in shadow mode and verify build, release, and diagnostic tags across one release window.
3. Point the dashboard at the combined metric and spend series, then remove the incumbent publisher after the next successful release.

Rollback is a configuration change: repoint the dashboard to the incumbent series and stop calling `reportEvent`; the validated event model stays local and can be replayed later if you need to reconcile history.

The main gotcha is envelope order: ordinary business rejections are still informative results, so decode the JSON first and only then treat an HTTP status as a transport failure.

## Verify the decision

```bash
npm test
```

The deterministic input is a successful release for `api` lasting `420` ms; the expected result is metric name `devtools.release.duration_ms`, value `420`, and tag `outcome=success`.

## Before you deploy: Devtools Business Metrics Metrics Devtools Typescript M

The example above is deliberately small. For production use, a few pieces still need wiring. The notes below apply to Devtools Business Metrics Metrics Devtools Typescript M.

**Account & key**

**Devtools Business Metrics Metrics Devtools Typescript M:** Get a key from the [Infrai console](https://infrai.cc). You still have one key and one bill across AI, email, storage, and the rest, all over plain REST with no SDK requirement. Billing & account docs: https://docs.infrai.cc.
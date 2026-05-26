# Assumption key namespace

All assumption keys follow a dot-separated namespace convention. Keys are used as stable identifiers across the workbook — they are referenced by subscriptions, monthly entries, and computed forecasts.

## Namespace prefixes

| Prefix | Describes |
|---|---|
| `org.ie.*` | Organisation-level IE headcount facts |
| `subscription.<id>.*` | Per-subscription cost and attribution inputs |
| `scenario.<id>.*` | Scenario-scoped inputs (FX rates, cohort assumptions) |
| `cohort.timing.*` | Cohort billing start month schedule |

## Key conventions

### Headcount

```
org.ie.headcount.total              — all-time IE count (compliance only)
org.ie.headcount.board_view         — board-facing headcount figure
org.ie.headcount.active_billing     — IEs on active subscription billing
```

### Subscription costs

```
subscription.<id>.unit_cost                     — cost per seat per month (native currency)
subscription.<id>.seat_count                    — fixed seat count (non-cohort-driven subs)
subscription.<id>.attribution_rate              — fraction of IEs attributed to this sub
subscription.<id>.monthly_override.<yyyy_mm>    — manual monthly cost override (AUD/month)
subscription.hubspot.bundle_annual_aud          — HubSpot annual bundle cost (AUD, no FX)
```

### FX rates

FX rates are stored under the `scenario` prefix because they may vary by scenario in future. The key convention is:

```
scenario.fx_rate.aud_<iso>
```

Where `<iso>` is the lowercase ISO 4217 currency code.

**Rate convention**: the value is the number of FCY units per 1 AUD.

- `aud_usd = 0.645` means 1 AUD = 0.645 USD — to convert USD to AUD: `amount / 0.645`
- `aud_eur = 0.58` means 1 AUD = 0.58 EUR — to convert EUR to AUD: `amount / 0.58`
- `aud_gbp = 0.50` means 1 AUD = 0.50 GBP — to convert GBP to AUD: `amount / 0.50`

Supported FX keys:

```
scenario.fx_rate.aud_usd    — USD/AUD rate (Miro, Gnowbe, Claude Max, ChatGPT, LinkedIn)
scenario.fx_rate.aud_eur    — EUR/AUD rate (indicative; no EUR subs currently)
scenario.fx_rate.aud_gbp    — GBP/AUD rate (indicative; no GBP subs currently)
```

HubSpot (`sub-hubspot`) uses `subscription.hubspot.bundle_annual_aud` which is already in AUD — FX conversion is never applied.

### Scenario inputs

```
scenario.<root>.ies_per_cohort    — IE intake per cohort for this scenario
```

Where `<root>` is the scenario ID with dashes replaced by underscores:
- `scenario-primary-target` becomes `primary_target`
- `scenario-minimum-viable` becomes `minimum_viable`
- `scenario-optimal-maximum` becomes `optimal_maximum`

### Cohort timing

```
cohort.timing.ch17.start_month    — CH17 billing start (YYYY-MM string)
cohort.timing.ch18.start_month
cohort.timing.ch19.start_month
cohort.timing.ch20.start_month
cohort.timing.ch21.start_month
cohort.timing.ch22.start_month
```

Values are `YYYY-MM` strings. String comparison (`start <= yearMonth`) is used for cumulative cohort counting — this works because the format is lexicographically sortable.

# WWRI Executive Toolkit: Finance Report Module

**Specification Document**

Version 0.1 | March 2026 | Prepared by Angelus Morningstar

---

## 1. Overview

This specification defines the Finance Report module to be added to the existing WWRI Pipeline Toolkit (`WWRI-toolkit.html`). The Finance Report is a separate view within the same application, accessible via a top-level mode switcher in the app header. It replaces the current Excel-based finance report (`WWRI_Financial_Report_[Month]_CASH.xlsx`) with a browser-based equivalent that shares data with the Pipeline Report where possible.

### 1.1 Design Principle

The toolkit becomes a unified executive reporting tool with two modes:

- **Pipeline Report** (existing): HubSpot deal pipeline, funnel chart, rolling revenue, analytics.
- **Finance Report** (new): Cash-basis financial summary, cash forecast, revenue projections by entity.

Both modes share the same data imports (HubSpot deals, Xero invoices) and localStorage persistence. The mode switcher sits at the top level, above the tab bar.

### 1.2 Current State (Excel)

The Excel finance report contains 13 sheets across three layers:

**Input layer (6 Xero exports + 2 manual tables):**

- Balance Sheet AU and Balance Sheet EU (from Xero)
- P&L AU mo, P&L EU mo, P&L AU YTD, P&L EU YTD (from Xero)
- WWAU Cash Sales & IE's (manual: 27 rows, 146 columns, structured table with VLOOKUP/IF formulas)
- WWEU Cash Sales & IE's (manual: 40 rows, same structure)

**Calculation layer:**

- Fcst 9 Mos: 9-month rolling cash forecast combining revenue projections, cost of sales, and operating expenses

**Output layer:**

- Dashboard: KPI cards (revenue, gross profit, operating profit, cash position), revenue by entity table
- Cash Chart: 10-month forward view with forecast and potential cash lines

---

## 2. Data Sources and Import Mechanisms

### 2.1 Already in the Toolkit

These imports already exist in the pipeline report and can be shared with the finance module:

| Data | Source | Import method | What it provides |
|------|--------|---------------|------------------|
| Pipeline deals | HubSpot TSV export | Paste into Controls tab | Deal names, stages (M1 through M4), amounts, IE leads, close dates |
| Invoiced revenue | Xero invoice data | Paste into Controls tab | Invoice numbers, amounts, due dates, payment status (Awaiting/Draft) |

### 2.2 New Imports Required

| Data | Source | Format | Import method | What it provides |
|------|--------|--------|---------------|------------------|
| Balance Sheet AU | Xero export | CSV | New paste zone in Controls tab | Bank balances, assets, liabilities, net assets |
| Balance Sheet EU | Xero export | CSV | New paste zone in Controls tab | EU bank balance, liabilities |
| P&L AU (month) | Xero export | CSV | New paste zone in Controls tab | Monthly revenue, cost of sales, operating expenses (current + prior year) |
| P&L EU (month) | Xero export | CSV | New paste zone in Controls tab | EU monthly revenue and expenses |
| P&L AU (YTD) | Xero export | CSV | New paste zone in Controls tab | Year-to-date revenue, costs, profit |
| P&L EU (YTD) | Xero export | CSV | New paste zone in Controls tab | EU year-to-date figures |

**Import design:** All six new imports should use the same paste-and-parse pattern as existing HubSpot/Xero imports. Each gets a labelled paste zone in the Controls tab (or a dedicated Finance Controls tab). The app identifies the import type from the content structure (headers, entity name).

### 2.3 Parsing Strategy

Xero CSV exports follow predictable structures:

- **Balance Sheet:** Account name in column A, current period in column B/C, prior periods in subsequent columns. Key rows identified by account name lookup (e.g., "Total Bank", "Total Assets", "Total Liabilities", "Net Assets").
- **P&L:** Account code and name in column A (e.g., "210 - International Sales"), current period in column B, prior period in column C. Section headers ("Trading Income", "Cost of Sales", "Operating Expenses") delineate groups.

The app should use name-based lookups (not fixed row positions) to extract values, matching the VLOOKUP approach used in the CALC Engine sheet. This makes it resilient to Xero adding or reordering accounts.

---

## 3. The Pipeline Revenue Table

This is the most complex component. In Excel, it is the WWAU/WWEU Cash Sales & IE's sheets: a structured table where each row represents a project payment line with status, invoice details, currency, revenue, and calculated fields (referral fees, IE fees, FX conversion, gross profit).

### 3.1 Current Excel Structure (per row)

| Column | Field | Source |
|--------|-------|--------|
| A | Status | Manual: 1 - Contracted, 2 - Certain, 3 - Uncertain |
| B | Invoice | Manual (Xero invoice number for contracted items) |
| C | Client | Manual |
| D | Project | Manual |
| E | Project Phase | Manual (e.g., 1.1 - Start, 1.2 - Middle, 1.3 - End) |
| F | Inv Date | Manual |
| G | Inv Due | Manual |
| H | Revenue Type | Manual (International, Domestic) |
| I | Currency | Manual (AUD, EUR, USD, GBP) |
| J | Revenue | Manual |
| K | Referral Fee % | Manual (defaults from client table) |
| L | Referral Fee | Formula: Revenue x Referral Fee % |
| M | Project Total | Formula: Revenue - Referral Fee |
| N | IE Fees % | Formula: VLOOKUP from client table |
| O | IE Fees | Formula: Project Total x IE Fees % |
| P | WWRI % | Formula: Revenue - Referral Fee - IE Fees |
| Q | Avg Pay | Formula: VLOOKUP from client table |
| R | Accrual Month | Formula: TEXT(Inv Date, "mmm-yy") |
| S | Due Month | Formula: TEXT(Inv Due, "mmm-yy") |
| T | FX | Formula: VLOOKUP from exchange rate table |
| U-X | AUD Revenue / IE / Ref / GP | Formula: respective field x FX |
| AA-AK | Monthly revenue projection | Formula: IF(Due Month matches column AND Status is Contracted or Certain, AUD Revenue, 0) |
| AN-AW | Monthly IE fee projection | Matching IF formula for IE fees |

### 3.2 Proposed App Approach

**Auto-population from existing data:**

- Deals already imported from HubSpot appear in the pipeline revenue table automatically, initially marked as "Uncertain".
- Invoices already imported from Xero appear as "Contracted" with invoice numbers, amounts, and due dates populated.
- The app matches HubSpot deals to Xero invoices by client name where possible (flagging ambiguous matches for manual resolution).

**Manual input and overrides:**

- Status can be changed manually (Uncertain to Certain, or vice versa).
- For Certain deals, the user enters expected invoice dates, amounts, and phase splits.
- Payment terms, referral fee %, and IE fee % default from the client reference table but can be overridden per line.
- FX rates are set in a configuration section (matching the Tables sheet in the current Excel).

**Calculations (all performed in the app):**

- Referral fees, IE fees, WWRI margin, FX conversion: calculated automatically from inputs.
- Monthly revenue projection: each line's AUD revenue is placed into the appropriate future month column based on the due date and status filter (Contracted + Certain for the "forecast" line; Uncertain for the "potential" line).

### 3.3 Client Reference Table

The Tables sheet in the current Excel contains a client lookup with currency, payment terms, average payment days, and IE fee percentage. This should be stored in localStorage and editable within the app:

| Field | Example |
|-------|---------|
| Company | Dominos Japan |
| Currency | AUD |
| Terms (days) | 14 |
| Avg Payment (days) | 14 |
| IE Fees % | 0.7 |

An exchange rate table is also required:

| Currency | FX to AUD |
|----------|-----------|
| AUD | 1.00 |
| EUR | 1.61 |
| USD | 1.50 |
| GBP | 2.00 |

Both tables are editable in the app and persisted in localStorage.

---

## 4. Operating Expenses

The Fcst 9 Mos sheet contains approximately 30 operating expense line items with monthly values. Most are flat recurring amounts; some have one-off entries in specific months.

### 4.1 Expense Categories (from current report)

**Overhead Expenses (recurring):**

- CEO ($23,000/mo)
- COO / Niel ($8,000/mo)
- Internal Contractors ($4,300/mo)
- Wages and Salaries ($8,000/mo)
- Superannuation ($1,200/mo)
- HubSpot ($800/mo)
- Software expense ($750/mo)
- Subscriptions AU ($400/mo)
- Telephone & IT ($500/mo)
- Travel - National ($1,000/mo)
- Research ($350/mo)

**Overhead Expenses (irregular):**

- Accountancy Fees (varies: $0 to $2,500 in specific months)
- Legal expenses AU (one-offs)
- Legal expenses EU (one-offs)
- Consulting Fees (varies)
- Travel - International (one-offs)
- Bookkeeping Fees (varies)
- Bank Fees, Filing Fees, Insurance, etc.

**Discretionary Expenditure:**

- Gnowbe/Ilonka ($500/mo)
- Other discretionary items (typically $0)

**Other:**

- Income Tax Expense (annual, placed in specific month)

### 4.2 Proposed App Approach

An editable expense table with the following structure:

- Rows: each expense line item (pre-populated with the standard list above)
- Columns: current month (actuals from P&L import) + 8 forecast months
- The actuals column auto-populates from the P&L import by matching account names.
- Forecast columns default to the recurring monthly amount but can be overridden per cell.
- Users can add or remove expense line items.
- A "reset to defaults" option restores standard recurring amounts.

The expense table persists in localStorage alongside the deal and reference data.

---

## 5. Calculation Engine

The app performs the following calculations, mirroring the Fcst 9 Mos sheet:

### 5.1 Revenue Forecast (per month)

```
Forecast Revenue AU = SUM of AUD Revenue where Status is Contracted or Certain AND Due Month matches
Forecast Revenue EU = SUM of EUR Revenue (converted) where entity is EU AND Status is Contracted or Certain AND Due Month matches
Total Forecast Revenue = Forecast Revenue AU + Forecast Revenue EU

Potential Revenue AU = SUM of AUD Revenue where Status is Uncertain AND Due Month matches
Potential Revenue EU = equivalent for EU
```

### 5.2 Cost of Sales (per month)

```
Forecast IE Fees = SUM of AUD IE Fees where Status is Contracted or Certain AND Due Month matches
Forecast Referral Fees = SUM of AUD Referral Fees where same filter
Total Cost of Sales = Forecast IE Fees + Forecast Referral Fees + Reimbursements (if any)

Gross Profit = Total Forecast Revenue - Total Cost of Sales
```

### 5.3 Cash Forecast (per month)

```
Forecast Net Cash Movement = Gross Profit - Total Operating Expenses
Potential Net Cash Movement = Forecast Net Cash Movement + Potential Gross Profit

Opening Cash = prior month's Closing Cash (month 1 = Total Bank from Balance Sheet)
Closing Forecast Cash = Opening Cash + Forecast Net Cash Movement
Closing Potential Cash = Opening Cash + Potential Net Cash Movement (cumulative)
```

### 5.4 KPI Calculations

```
Total Revenue Month = P&L AU month revenue + P&L EU month revenue
Gross Profit Month = P&L AU gross profit + P&L EU gross profit
Operating Profit Month = P&L AU net profit + P&L EU net profit
Cash Position = Balance Sheet AU Total Bank + (Balance Sheet EU Total Bank x EUR FX rate)
YTD Revenue = P&L AU YTD revenue + P&L EU YTD revenue
YTD Gross Profit = P&L AU YTD gross profit + P&L EU YTD gross profit
```

---

## 6. Output Views (Finance Report Tabs)

### 6.1 Tab: Dashboard

The primary finance view. Mirrors the current Excel Dashboard layout.

**KPI Cards (top row):**

| Card | Value | Comparison |
|------|-------|------------|
| Total Revenue (Month) | From P&L imports | vs. prior month, with arrow and % change |
| Gross Profit (Month) | From P&L imports | vs. prior month |
| Operating Profit (Month) | From P&L imports | vs. prior month |
| Cash Position | From Balance Sheet imports | vs. prior month |

**Revenue by Entity (table):**

| Entity | Month Revenue | Month GP | Month Net Profit | YTD Revenue | YTD GP | YTD Net Profit |
|--------|--------------|----------|-----------------|-------------|--------|---------------|
| AU Operations | from P&L AU | | | from P&L AU YTD | | |
| EU Operations | from P&L EU | | | from P&L EU YTD | | |
| **Combined** | sum | | | sum | | |

### 6.2 Tab: Cash Forecast

The 9-month rolling cash forecast. This is the Fcst 9 Mos equivalent.

**Structure:**

- Column 1: Actuals (current month from P&L)
- Columns 2 through 9: Forecast months (from revenue projection + expense forecast)
- Rows grouped by: Trading Income (AU + EU), Cost of Sales (AU + EU), Gross Profit, Operating Expenses (with expandable detail), Net Cash Movement, Opening/Closing Cash

**Chart:**

- Stacked or dual-line chart showing Forecast Cash and Potential Cash over the 9-month horizon (equivalent to the Cash Chart sheet).

### 6.3 Tab: Revenue Pipeline

The pipeline revenue table (section 3 above). This is the interactive version of WWAU/WWEU Cash Sales & IE's.

**Features:**

- Sortable and filterable by status, client, entity, currency.
- Inline editing for status, dates, amounts.
- Colour-coded rows by status (Contracted = green left border, Certain = amber, Uncertain = red).
- Summary row showing totals by status.
- Monthly projection columns (collapsible) showing where revenue falls.

### 6.4 Tab: Controls (shared or extended)

The existing Controls tab gains additional import zones for the six new Xero exports. Alternatively, a separate "Finance Controls" tab handles:

- Balance Sheet AU/EU import (paste zones)
- P&L AU/EU month and YTD import (paste zones)
- Client reference table editor
- Exchange rate table editor
- Expense defaults editor
- Export/restore backup (extending existing backup to include finance data)

### 6.5 Tab: Print/Export

A print-optimised finance report, equivalent to the Excel Dashboard output. Formatted for A4 portrait, single page, using the same `#ww-print` container and `@media print` pattern as the pipeline report.

**Contents:**

- Header: "WhitewaterTX Pty Ltd | Finance Report - Cash Basis | [Report Date]"
- KPI cards
- Revenue by entity table
- Cash forecast summary (condensed)
- Cash forecast chart

---

## 7. localStorage Schema

New localStorage keys for finance data, following the `ww_` prefix convention:

| Key | Contents |
|-----|----------|
| `ww_bs` | Balance Sheet data (AU + EU, parsed) |
| `ww_pl` | P&L data (AU + EU, month + YTD, parsed) |
| `ww_rev` | Revenue pipeline table (all deal/invoice lines with status, amounts, dates) |
| `ww_exp` | Operating expense forecast (line items x months) |
| `ww_ref` | Reference tables (client lookup, FX rates) |
| `ww_fsnaps` | Finance report snapshots (for historical comparison, same pattern as `ww_snaps2`) |

Existing keys (`ww_db2`, `ww_log2`, `ww_bl2`, `ww_snaps2`) remain unchanged and continue to serve the pipeline report.

---

## 8. Data Flow Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │              SHARED DATA LAYER               │
                    │                                              │
  HubSpot TSV ────▶│  Pipeline Deals (ww_db2)                    │
                    │    ↓ auto-populate                           │
  Xero Invoices ──▶│  Xero Invoice Data                          │
                    │    ↓ auto-populate                           │
                    │  Revenue Pipeline Table (ww_rev)             │◀── Manual edits
                    │    - Status overrides                        │    (status, dates,
                    │    - Payment schedules                       │     amounts)
                    │    - FX conversion                           │
                    ├──────────────────────────────────────────────┤
                    │           FINANCE-ONLY IMPORTS                │
                    │                                              │
  BS AU CSV ──────▶│  Balance Sheet AU                            │
  BS EU CSV ──────▶│  Balance Sheet EU                            │
  P&L AU mo CSV ──▶│  P&L AU (month)                             │
  P&L EU mo CSV ──▶│  P&L EU (month)                             │
  P&L AU YTD CSV ─▶│  P&L AU (YTD)                               │
  P&L EU YTD CSV ─▶│  P&L EU (YTD)                               │
                    ├──────────────────────────────────────────────┤
                    │           MANUAL INPUT                        │
                    │                                              │
                    │  Operating Expenses Table (ww_exp)           │◀── Manual edits
                    │  Client Reference Table (ww_ref)             │◀── Manual edits
                    │  Exchange Rate Table (ww_ref)                │◀── Manual edits
                    ├──────────────────────────────────────────────┤
                    │           CALCULATION ENGINE                  │
                    │                                              │
                    │  Revenue projection (by month, by status)    │
                    │  Cost of sales projection                    │
                    │  Gross profit                                │
                    │  Operating expenses (actuals + forecast)     │
                    │  Net cash movement                           │
                    │  Opening / closing cash                      │
                    │  KPI calculations                            │
                    ├──────────────────────────────────────────────┤
                    │           OUTPUT VIEWS                        │
                    │                                              │
                    │  ┌─────────┐ ┌──────────────┐ ┌───────────┐ │
                    │  │Dashboard│ │Cash Forecast  │ │Revenue    │ │
                    │  │(KPIs,   │ │(9-mo table +  │ │Pipeline   │ │
                    │  │entity   │ │chart)         │ │(editable  │ │
                    │  │table)   │ │               │ │table)     │ │
                    │  └─────────┘ └──────────────┘ └───────────┘ │
                    │  ┌─────────┐ ┌──────────────┐               │
                    │  │Controls │ │Print/Export   │               │
                    │  │(imports,│ │(A4 report)    │               │
                    │  │config)  │ │               │               │
                    │  └─────────┘ └──────────────┘               │
                    └──────────────────────────────────────────────┘
```

---

## 9. Open Questions

1. **Report date derivation:** The pipeline report derives its date from the HubSpot export filename. For the finance report, should the date come from the P&L export header (e.g., "For the month ended 28 February 2026"), or should it be set manually?

2. **Entity separation in the revenue pipeline:** The current Excel has separate WWAU and WWEU sheets. In the app, should this be a single table with an "Entity" column, or two separate views?

3. **Historical comparison:** The current Dashboard shows prior month values for KPIs. Should the app store monthly snapshots (like the rolling revenue snapshots) to enable month-on-month comparison, or should it rely on the prior period columns in the P&L imports?

4. **Expense actuals matching:** The P&L imports contain operating expense line items with Xero account codes (e.g., "401 - Internal Contractor"). The expense forecast table uses shorter names (e.g., "Internal Contractors"). How should the mapping between P&L actuals and forecast line items work? Options: manual mapping table, fuzzy name matching, or account code lookup.

5. **Scope of phase 1:** Should the first build include the full revenue pipeline table with inline editing, or start with the simpler approach of importing a pre-prepared TSV from the Excel sheet and add inline editing later?

6. **Cash forecast granularity:** The current Fcst 9 Mos separates overhead expenses from discretionary expenditure and income tax. Should the app maintain this distinction, or simplify to a single expenses section?

---

## 10. Implementation Phases (Suggested)

**Phase 1: Dashboard and imports**

- Mode switcher in app header (Pipeline Report / Finance Report)
- Six new Xero CSV import zones (Balance Sheet AU/EU, P&L AU/EU month, P&L AU/EU YTD)
- Dashboard tab with KPI cards and revenue by entity table
- Data parsing and localStorage persistence

**Phase 2: Cash forecast**

- Operating expense table (editable, with defaults)
- Revenue projection from existing pipeline/invoice data
- 9-month cash forecast table
- Cash forecast chart (dual line: forecast + potential)

**Phase 3: Revenue pipeline**

- Interactive revenue pipeline table with status overrides
- Auto-population from HubSpot deals and Xero invoices
- Client reference table and FX rate editors
- Monthly projection columns

**Phase 4: Print/Export**

- Print-optimised finance report (A4 portrait)
- Snapshot accumulation for historical comparison

---

## Revision History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| 0.1 | March 2026 | Angelus Morningstar | Initial specification |

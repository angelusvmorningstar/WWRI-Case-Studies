# WWRI Task Backlog

<!-- CONFIG -->
owner: Angelus Morningstar
tz: Australia/Sydney
schema: 1.0
last-triage: 2026-06-18

<!-- SCHEMA
id: OPS-NNN | DEV-NNN
type: ops | dev
status: open | in-progress | waiting | blocked | watch | check-status | deferred | done
priority: high | medium | low
area: HubSpot CRM | Finance | HP Inc. | SharePoint | Rename | Pipeline | AI/Internal | Admin | Tools | Merlin | Case Studies | Dev
counterparty: name or self
due: YYYY-MM-DD UTC or null
notes: freetext
source: direct | retrospective | transcript | email
-->

---

## HIGH PRIORITY

### [OPS-001] Pull full HubSpot Contact and Company property export
- **type:** ops
- **status:** open
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** 2026-10-01
- **source:** retrospective
- **notes:** AS IS verification. Without this, half of Peter's AS IS → TO BE gap assessment is "can this be built" not "does this already exist". Flagged outstanding since April. Blocks Peter's framework design.

### [OPS-002] Decide HubSpot tier upgrade (Sales Hub Professional)
- **type:** ops
- **status:** done
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Nicolette (steer), HubSpot rep (seat split)
- **due:** 2026-10-01
- **source:** retrospective
- **notes:** Decision made (Jun 2026): stay with current licence structure for now, per discussions between Niel and Nicolette. Peter Novak confirmed in HubSpot Next Steps email 15 Jun. Revisit at Oct renewal.

### [OPS-003] Raise with Peter that framework should be built within Starter features
- **type:** ops
- **status:** open
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** 2026-07-15
- **source:** retrospective
- **notes:** Renewal leaning leaner — possibly dropping Data Hub Pro. Peter may be designing for Professional-only capabilities (automation, third pipeline) that the renewal could remove. Raise before go-live.

### [OPS-016] Reinvention rename: Niel/Kane scope confirmation + Nicolette addendum alignment
- **type:** ops
- **status:** open
- **priority:** high
- **area:** Rename
- **counterparty:** Niel, Kane, Nicolette
- **due:** 2026-07-01
- **source:** retrospective
- **notes:** Phase 1 was scheduled to begin 1 June. Legal docs updated. Next: Niel and Kane confirm scope and owners; align with Nicolette on addendum approach and external comms tone.

### [OPS-017] SharePoint automation: Bernard Global Admin consent
- **type:** ops
- **status:** blocked
- **priority:** high
- **area:** SharePoint
- **counterparty:** Bernard Leung
- **due:** null
- **source:** retrospective
- **notes:** Critical path blocker. Application Administrator role cannot grant tenant-wide consent. Bernard must provide Global Admin consent for Graph API write permissions. Also: Niel's decision on whether automation replaces, supplements, or only verifies the manual pass. Simran flagged: fix permissions model first, start with smaller wedge.

### [OPS-030] Accept Xero invitation for WW US entity
- **type:** ops
- **status:** done
- **priority:** high
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** email
- **notes:** Jeremy set up WW US Xero overnight. Angelus imported Renesas invoices (export/import from WW AU). Access confirmed.

### [OPS-031] Send first Renesas invoice from WW US entity
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** Finance
- **counterparty:** Jeremy (owner), Rebecca (four-eyes)
- **due:** null
- **source:** email
- **notes:** Invoice imported to WW US Xero, logo added. **Ownership (clarified 17 Jun finance mtg):** the US-tax / readiness work — US tax accountant confirmation, Business Registration Number, sales-tax coding (template currently 0 tax / "International Sale") — is **Jeremy's** to own, discussed in detail. **Angelus's only role: send the invoice once Jeremy confirms it's ready** (four-eyes with Rebecca). Currently on hold per Jeremy (16 Jun "Re: WW US"). No Angelus action until Jeremy gives the go.

### [OPS-032] Payday Super — set up in Xero before 1 July 2026
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Finance
- **counterparty:** Jeremy (owner)
- **due:** 2026-06-30
- **source:** email
- **notes:** New Australian Payday Super legislation effective 1 July 2026 (Xero emailed setup steps). **Ownership (clarified 17 Jun): this is Jeremy's task, not Angelus's.** Jeremy is handling the super position (meeting Altus 18 Jun re tax; super paid end July if not required sooner). No Angelus action — monitor only.

### [OPS-040] Research e-signature options vs DocuSign — share with Niel/Kane
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** Tools
- **counterparty:** Niel (requester), Kane (point on DocuSign relationship)
- **due:** null
- **source:** email
- **notes:** **DELIVERED 17 Jun:** research done (full brief: downloads/E-Signature Platform Comparison for WWRI_ Switch-or-Renegotiate Decision Brief.pdf) and a digestible summary emailed to Niel + Kane. Key findings: price on *senders* not *signers* (cohorts sign for free); ditch capped DocuSign eSignature plans; best fits — DocuSign IAM Standard (unlimited, deepest M365/SharePoint, ~$3,240/yr) / Zoho Sign Pro (cheapest uncapped, ~$1,150/yr) / PandaDoc Business (~$3,528/yr); avoid Dropbox Sign (dropped SharePoint Mar 2026) and signNow (same 100-sig cap). For Kane's DocuSign call Thu 18 Jun: push IAM Standard (not renew current tier + buy seats) + negotiate 3–5% renewal cap. **17 Jun ops mtg:** Niel read it twice; Kane to read after connect session, finds it useful as negotiation leverage for his DocuSign sales call **Thu 10:30 (info back after 11)**. Kane is exploring a bespoke "buy blocks of envelopes only" deal. Niel steer: if WW adopts a tool, **Whitewater pays via Jeremy**, not Kane personally. **Open Angelus sub-action: update the research doc to include sources/citations** so Kane can trace the figures (committed in mtg). Decision (switch vs renegotiate) parked until after Kane's Thursday call. Likely follow-up: short parallel pilot on a real cohort intake before annual commit.

### [OPS-043] Cost Tracker: BAU vs maximalist budget numbers for Niel
- **type:** ops
- **status:** in-progress
- **priority:** high
- **area:** Tools
- **counterparty:** Niel
- **due:** 2026-06-18
- **source:** direct
- **notes:** Niel (17 Jun ops mtg) asked for two next-FY budget figures from the Cost Tracker, each as a screenshot: **(a) Business-as-usual** — current model (M365 basic + core/standard mix, HubSpot, Miro), **including the recruitment cycle (~50–55 people)**; BAU currently shows ~$51k. **(b) Maximalist** — everyone on full HubSpot, full Miro, Microsoft Standard + Copilot. ⚠️ Maximalist looked wrong (only +$20k) — **Copilot cost appears missing from that view**; investigate/verify the model before sending (Angelus said he'd run it tonight). Design ask: bake in a **"basic + minimal core licences"** fallback (basic + ~6 HubSpot + ~6 Miro seats) as the sustainable floor — ties into the Scenarios redesign. Note: the two existing views are *meant* to answer exactly this by toggling, but Angelus is unsure they calculate correctly — confirm.
- **PARKED (dashboard redesign — incomplete, revisit):** Angelus wants the Cost Tracker **Dashboard** (the $51,265 FY26/27 view) to surface **two headline numbers**. **(1) Business as usual** = current costs + projected costs driven by the **% of RP-linked subscriptions in the Subscription tab** → the baseline/as-is projected cost. **(2) [second number — not yet specified; thought was cut off, likely the maximalist/everyone-gets-everything figure per OPS-043].** Get the rest of this spec from Angelus before building.
- **PROGRESS 17 Jun (cost-tracker refactor):** (1) **DONE + PUSHED** (commit c6fcf06, main → auto-deploys via Azure SWA): attribution moved off the Subscriptions page (now unit-cost only) and onto the Forecast page as per-model editable rates; "Standard" model renamed "Maximum"; new `workbook.modelAttribution` store. (2) **DONE, NOT YET PUSHED** (uncommitted in working tree): both Basic & Maximum now list *every* per-RP subscription with its own editable attribution (0% = exclude), so each model is tailorable. (3) **Copilot price:** corrected in `seed/workbook.json` to AU$26.91/mo Resolved (was 55/Pending) — but seed is NOT used at runtime; the **live value lives in the Azure blob via /api/workbook and still needs updating** (give Claude the deployed URL to patch, or set Unit cost 26.91 on the Copilot row in the app). KEY: only *Resolved* assumptions compute, so Copilot (Pending) was reading as $0 — fixing it makes Maximum finally include Copilot cost (the gap Niel flagged). Uncommitted files: forecast-view.js, dashboard-view.js, subscription-models.js, app.css, seed/workbook.json.
- **PROGRESS 18 Jun (reviewed + fixed + pushed, commit fdd7fbd):** Verified the model logic locally via a compute harness and **found a real bug**: `lookupAssumption` only reads *Resolved* assumptions, but model attribution overrides on *Pending* base assumptions (Copilot, M365 Standard) kept Pending status → ignored → `computeForecast` fell back to **full attribution (1)**. So Copilot + M365 Standard were computing at 100% in **every** model: **Basic/BAU was overstated** and the toggle never moved them. **Fix:** `buildModelAssumptions` now stamps each override `Resolved`. Verified totals (per-RP cohort, FY26/27): **Basic = M365 Basic only ≈ AUD 5,454; Maximum = HubSpot+Copilot+Miro+Standard ≈ AUD 65,241** (Copilot now correctly in Maximum, not in Basic). Production build clean; committed + pushed to main (auto-deploys). **REMAINING before sending Niel:** the live app reads the workbook from the Azure blob — Copilot's **unit cost** isn't model-overridden, so it must be set to **AUD 26.91 + status Resolved on the live workbook** (in-app via Cost Register), else deployed Maximum reads Copilot unit cost as $0. Then screenshot the Dashboard hero total for Basic and Maximum.

### [OPS-046] Package Cathay / "Global Air Cargo Carrier" case study for website
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** Case Studies
- **counterparty:** Nicolette / Niel / Kane
- **due:** null
- **source:** email
- **notes:** From the "Framing for High Tech Industry on WW Website" thread (Niel chasing progress 17 Jun; Nicolette set Angelus to package the Cathay study). **DONE 18 Jun:** ingested the approved one-pager text into case-studies.json ("Global Air Cargo Carrier"); regenerated the Word doc (Output 1); produced the Output 2 web HTML code block (`assets/Air Cargo Case Study — website block for Kane.md`); built a new PDF brochure generator (`.claude/skills/case-study-ingest/scripts/gen_cs_brochure.py`) and produced the branded 2-page PDF (Output 3) with hero image. Replied to Nicolette/Kane 18 Jun with the draft and **asked Kane for website CMS access in-thread** (supersedes the separately-drafted access email). **Waiting on:** Kane re website access to publish + final lead sign-off.

---

## MEDIUM PRIORITY

### [OPS-005] Reconcile capital injection and loan entries
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Injection came through as shareholder and intercompany loans totalling ~AUD 34,785 against AUD 35,000 sought. Confirm whether small shortfall is outstanding or unrecorded. Loan repayments absent from forward forecast — flatters projected position if any fall due within window. This is Angelus's remit, not the CFOs'.

### [OPS-007] HP proposal: resolve four in-deck comments
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Awaiting Nicolette's decision. Items: contents order vs. slide order; Phase 1B starting on a Saturday (1 Aug, 3 Aug if not intended); first-name reference to Horacio; EBITA vs. EBITDA on supply-chain case study.

### [OPS-009] SharePoint duplicate — prepare v2 for side-by-side comparison
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Niel / Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Claude Code work on local SharePoint duplicate. Prepare v2, specify what is required to finish, propose a completion date.

### [OPS-010] Apply HP/Whitewater costing sheet index fix
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** tblInvoicing1 duplicate index issue. A161 index correction plus latent A159 phase flag issue. Fix diagnosed and recommended.

### [OPS-012] Confirm Henri entered 8vance targets into HubSpot
- **type:** ops
- **status:** check-status
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Henri
- **due:** null
- **source:** retrospective
- **notes:** End-of-May threshold (Nicolette's) has passed. Confirm whether company names and individuals have actually been entered into HubSpot, regardless of stage. Separate from the partnership question itself.

### [OPS-014] Reinvention Partner rename: update priority marketing materials
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Rename
- **counterparty:** self
- **due:** 2026-08-30
- **source:** retrospective
- **notes:** Phase 1 deliverables: pitch decks, capability statement, proposal template.

### [OPS-015] Provide billing data to Adam
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Admin
- **counterparty:** Adam Salzer
- **due:** null
- **source:** retrospective
- **notes:** **Unblocked 17 Jun — Luis's travel expenses now in hand** (captured on AP control sheet: Tx1379 Luis $13,484.74 / 9-Jun, Tx1373 Luis $12,887.36 / 4-Mar). Compile billing data and send to Adam.

### [OPS-018] Finance workbook Stage 8: native cashflow charts
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Finance
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Line chart, revenue-by-region column chart, cash sales pipeline stacked column chart. AU plus EU. Handover to Jeremy ongoing.

### [OPS-019] Merlin Initiative: confirm revenue splits and validate IE financial model
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Merlin
- **counterparty:** self
- **due:** null
- **source:** retrospective
- **notes:** Three regional sessions done, cross-regional analysis v2 finalised. SPoT: AUD 30M annual revenue by 30 Jun 2029. Next: confirm regional revenue splits; validate IE financial model (135–180 active IEs, EUR 200K income target per active IE).

### [OPS-020] AI working group: Nicolette steer on Teams chat + Ryan Dancey inclusion
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** AI/Internal
- **counterparty:** Nicolette (steer), Ryan Dancey
- **due:** null
- **source:** retrospective
- **notes:** Email sent to Nicolette (cc Simran) putting two decisions to her: standing up a Teams group chat, and how to bring Ryan in. Ryan asked about a discussion forum — answer pending Nicolette's response.

### [OPS-021] Case study spec: alignment meeting with Nicolette
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Case Studies
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Awaiting Nicolette to schedule. No build begins until format, style, tone and word count are aligned. Her action from 21 April.

### [OPS-022] Miro licence review
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** self
- **due:** 2026-07-15
- **source:** retrospective
- **notes:** Business plan, 22 seats. Guest vs. Visitor access model confirmed. Review ahead of August 2026 renewal.

### [OPS-033] Validate HP Project Costing in HubSpot (weekly)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HP Inc.
- **counterparty:** Nicolette
- **due:** 2026-06-23
- **source:** email
- **notes:** Recurring weekly check. Validated as of 16 Jun. Next due ~23 Jun.

### [OPS-034] Reflect Laurel's warehousing fees in WW systems
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** Finance
- **counterparty:** Jeremy
- **due:** null
- **source:** email
- **notes:** Jeremy's task — Laurel Marshall's IE/referral fees for Renesas (mid-Dec 2026, end-Dec payment) to be reflected in WW systems. Believed handled but not confirmed. Follow up with Jeremy to verify. **17 Jun finance mtg:** Renesas IE payments deferred — **Nicolette to September**, Laurel to December. Angelus added a September note for Nicolette to the AP control sheet (December for Laurel already there). Domino's Phase 2 referral fees deferred to October — Oct marker also added to control sheet.

### [OPS-035] Reply to Seamus re HubSpot deal entry
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Seamus Power
- **due:** null
- **source:** email
- **notes:** Seamus has view-only seat — can't add deals. Decision needed: (A) upgrade to core seat if he'll use HubSpot regularly for BD; (B) reply telling him to email updates to Angelus who will do the data entry for now. Lean toward B unless Seamus confirms regular BD usage. Related to OPS-027.

### [OPS-036] Reschedule Cost Tracker review with Jeremy
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Tools
- **counterparty:** Jeremy
- **due:** null
- **source:** email
- **notes:** Attempted 16 Jun morning — Jeremy's internet was down. Reschedule once Jeremy is back online.

### [OPS-037] Christmas Accelerator IER Payments — outstanding balance
- **type:** ops
- **status:** check-status
- **priority:** high
- **area:** Finance
- **counterparty:** Adam Salzer / Luis Maia
- **due:** null
- **source:** email
- **notes:** Meeting held. Tx1354 renegotiated (CN1370 applied). Tx1371 Final = $17,550. IE split: Adam $7,425 (2×$3,712.50), Luis $3,712.50. Luis paid — AP control sheet had not been updated, hence appeared outstanding. **Update (16–18 Jun, Domino's Japan thread):** Jeremy confirmed "all paid already", paid on the 12th; AP sheet was stale. **Action to close:** verify the AP control sheet reflects all Tx1371 payments (incl. Adam's $3,712.50), then mark done.

### [OPS-039] Schedule meeting with Peter Novak re HubSpot spec
- **type:** ops
- **status:** waiting
- **priority:** high
- **area:** HubSpot CRM
- **counterparty:** Peter Novak
- **due:** null
- **source:** email
- **notes:** Peter emailed 15 Jun asking for a time to meet re the HubSpot specification (his "main areas": two sales processes — Lead-to-Cash and Lead-to-Partner MOU/Contract; Contact/Account lifecycle management; licence stays current for now). **17 Jun: replied asking for his availabilities.** **Update (17 Jun 23:46):** Peter offered Monday or Wednesday next week; Niel confirmed both work; Angelus replied to lock a day. Waiting on Peter to confirm the specific day/time. Related to OPS-001, OPS-003; note also the separate licence-structure meeting (audit item N4).

### [OPS-038] Mark Beliczky — pipeline update (M0/M1)
- **type:** ops
- **status:** done
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Mark Beliczky
- **due:** null
- **source:** direct
- **notes:** DONE — Mark confirmed 17 Jun that all his target companies are in HubSpot. No further action.

### [OPS-041] Pascal Nyckees access — confirm WWRI mailbox access then reissue invite
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** SharePoint
- **counterparty:** Pascal Nyckees
- **due:** null
- **source:** email
- **notes:** Pascal (16 Jun, "Access", from personal **pascal.nyckees@hotmail.com**) never received the ~1 Jun access invitation. Root cause: the invite went to his **WWRI mailbox** (pascal.nyckees@whitewater-ri.com), which he likely hasn't accessed. **17 Jun:** replied (modified version) asking him to confirm he can log into his WWRI email first — that's where the invite is sitting; will reissue if expired/missing. **Update (17 Jun):** Pascal confirmed he has WW-account access but never found the invite; Angelus replied again to his WW account 17 Jun 23:50. Waiting on Pascal. Still to pin down: which system the invite was for (HubSpot most likely).

### [OPS-025] Chase Zuzana Bato re Filip Kegels (potential client)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Zuzana Bato
- **due:** null
- **source:** retrospective
- **notes:** Awaiting her response. Follow up.

### [OPS-026] Confirm Mar Gauci availability (Australia cohort)
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Mar Gauci
- **due:** null
- **source:** retrospective
- **notes:** Australia cohort availability to confirm. Note: "Mar Gauci" not "Mark".

### [OPS-027] Confirm Raj and Seamus availability and activation
- **type:** ops
- **status:** open
- **priority:** medium
- **area:** Pipeline
- **counterparty:** Raj, Seamus Power
- **due:** null
- **source:** retrospective
- **notes:** Availability and activation outstanding. Note: "Power" not "Powers" for Seamus.

### [OPS-044] Carl Meyer — HubSpot onboarding / assist
- **type:** ops
- **status:** waiting
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Carl Meyer (Kane requester)
- **due:** null
- **source:** email
- **notes:** Kane asked 17 Jun to reach out and assist Carl with HubSpot (Carl in Milwaukee — his afternoon/evening = Angelus's morning). **Invite link sent 17 Jun 23:53** with admin-approval-bypass instructions. Waiting on Carl to log in; may need a walkthrough call once he's in.

### [OPS-045] HubSpot Deal Views — add 'RP Support' column
- **type:** ops
- **status:** done
- **priority:** medium
- **area:** HubSpot CRM
- **counterparty:** Niel
- **due:** null
- **source:** email
- **notes:** DONE — Niel 16 Jun asked to add the 'RP Support' column next to Deal Owner across all Deal Views. Completed (confirmed by Angelus 18 Jun).

---

## LOW PRIORITY / WATCH / DEFERRED

### [OPS-008] Compile list of areas where Claude tokens can optimise internal operations
- **type:** ops
- **status:** open
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Nicolette
- **due:** null
- **source:** retrospective
- **notes:** Examples: meeting-note synthesis, case study adaptation. Explicitly not a productisation list. From 21 April action list.

### [OPS-011] Referral-fee formula overstatement — pricing governance
- **type:** ops
- **status:** deferred
- **priority:** low
- **area:** Finance
- **counterparty:** Niel / Nicolette / Adam
- **due:** null
- **source:** retrospective
- **notes:** Template pays referral as 10% of grossed-up client charge, creating a gap absorbed by WWRI margin. DJP locked and illustrative only. Three forward levers: treat referral as inclusive, correct template overstatement, consider capping/tiering on larger engagements. Not a DJP fix — future pricing only.

### [OPS-013] Watch: Accenture / Department of Defence Australia opportunity
- **type:** ops
- **status:** watch
- **priority:** low
- **area:** Pipeline
- **counterparty:** (surfaced via 8vance)
- **due:** null
- **source:** retrospective
- **notes:** Worth not losing if 8vance is wound down.

### [OPS-023] Claude Teams environment proposal to Niel
- **type:** ops
- **status:** open
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Niel
- **due:** null
- **source:** retrospective
- **notes:** Potential broader WWRI rollout of Claude via Teams. Not yet formally put forward.

### [OPS-028] Respond to Ryan Dancey re discussion forum
- **type:** ops
- **status:** blocked
- **priority:** low
- **area:** AI/Internal
- **counterparty:** Ryan Dancey
- **due:** null
- **source:** retrospective
- **notes:** Ryan asked about a discussion forum. Blocked on OPS-020 (Nicolette's steer).

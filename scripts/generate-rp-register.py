"""
Generate updated rpRegister JSON for workbook-seed.json
Sources:
  - rp-register-2026-05-27.csv                        (register data)
  - hubspot-users-portal-145021882-2026-05-27.csv      (hubspot seat status)
  - Miro user data (pasted inline below)
  - users_5_27_2026 10_29_58 PM.csv                   (M365 seat status)
  - IE Intake Master CONTROL SHEET 2025.xlsx           (cohort/NDA/contract/region)
"""
import csv, json, re, openpyxl

REGISTER_CSV = r"D:\WWRI Development\rp-register-2026-05-27.csv"
HUBSPOT_CSV  = r"D:\WWRI Development\hubspot-users-portal-145021882-2026-05-27.csv"
M365_CSV     = r"D:\WWRI Development\users_5_27_2026 10_29_58 PM.csv"
EXCEL_FILE   = r"D:\WWRI Development\IE Intake Master CONTROL SHEET 2025.xlsx"
SEED_FILE    = r"D:\WWRI Development\cost-tracker\seed\workbook-seed.json"

# ── Cohort metadata ───────────────────────────────────────────────────────────
# old_format: cohorts 7-9 split name across "1st Name" + "Surname" columns,
# no NDA/contract columns — only region and training status can be extracted.
COHORT_META = {
    7:  {"key": "ch7",  "startMonth": None,      "completed": True,  "old_format": True},
    8:  {"key": "ch8",  "startMonth": None,      "completed": True,  "old_format": True},
    9:  {"key": "ch9",  "startMonth": None,      "completed": True,  "old_format": True},
    10: {"key": "ch10", "startMonth": None,      "completed": True,  "old_format": False},
    11: {"key": "ch11", "startMonth": None,      "completed": True,  "old_format": False},
    12: {"key": "ch12", "startMonth": None,      "completed": True,  "old_format": False},
    13: {"key": "ch13", "startMonth": None,      "completed": True,  "old_format": False},
    14: {"key": "ch14", "startMonth": "2026-01", "completed": True,  "old_format": False},
    15: {"key": "ch15", "startMonth": "2026-02", "completed": True,  "old_format": False},
    16: {"key": "ch16", "startMonth": "2026-04", "completed": False, "old_format": False},
    17: {"key": "ch17", "startMonth": "2026-06", "completed": False, "old_format": False},
}

# ── Region normalisation ──────────────────────────────────────────────────────
REGION_NORM = {
    "japan":      "apac", "asia":      "apac", "apac":      "apac",
    "au":         "apac", "auspac":    "apac", "singapore": "apac",
    "hk":         "apac", "hong kong": "apac", "australia": "apac",
    "aus":        "apac",
    "eu":         "emea", "uk":        "emea", "emea":      "emea",
    "europe":     "emea", "france":    "emea", "germany":   "emea",
    "italy":      "emea", "uk/switz":  "emea", "middle east": "emea",
    "czech":      "emea",
    "americas":   "americas", "us":    "americas", "usa":   "americas",
    "colorado":   "americas", "us/apac": "americas",  # primary region first
}

# ── Name normalisations (display name -> register name, lowercased) ──────────
NAME_MAP = {
    # HubSpot export mismatches
    "daan vermaas":             "daniel vermaas",
    "eric antwerpen":           "eric van antwerpen",
    # Miro export mismatches
    "derkjan koole":            "derk jan koole",
    "luis faria e maia":        "luis maia",
    "nicolette":                "nicolette grams",
    "kathleen.mcgovern":        "kathleen mcgovern",
    "luis.maia":                "luis maia",
    "peter.novak":              "peter novak",
    # M365 export mismatches
    "dave riegel":              "david riegel",
    "eric van antwerpen":       "eric van antwerpen",   # already matches
    "maria luiza novaes berger": None,                  # not in register
    # Excel cohort sheet mismatches
    "kirstin macron":           "kirstin marcon",       # typo in Excel
    "bev landstreet iv":        None,                   # not in register
    "jan sorcek":               "jan soucek",           # typo in Excel
    "simran gambhir":           "simran gambhir",       # "SImran" normalises fine
    # Non-RP / service accounts — skip
    "accounts team":            None,
    "info":                     None,
    "office 365 alerts":        None,
    "paddle":                   None,
    "zoom user":                None,
    "bruce hamilton":           None,
    "luke schrotberger":        None,
    "maria.berger":             None,
    "beverly landstreet":       None,
    "kate hely":                None,
    "leo lin":                  None,
    "matthias riehle":          None,
    "olivier cotard":           None,
    "rhiannon melan":           None,
    "alexander scandurra":      None,
    "alex scandurra":           None,
    "james vigne":              None,
    "jeremy d cruz":            None,
    "yoshiaki ito":             None,
}

# ── Miro full-license holders (from export) ─────────────────────────────────
MIRO_FULL = {
    "eduard van zyl", "grace mckanna", "henri snijders", "ian riley",
    "jack garzella", "kane salzer", "kathleen mcgovern", "laurel marshall",
    "luis maia", "nicolette grams", "niel malan", "peter thommen",
    "robert bruce", "seamus power", "simran gambhir", "tom pedersen",
    "winfried schultz",
}

# ── Miro guest/teams holders ─────────────────────────────────────────────────
MIRO_FREE = {
    "alain crozier", "anouk de blieck", "derk jan koole", "ilonka malan",
    "marc gauci", "peter chrenko", "peter novak",
}

# ── Helpers ──────────────────────────────────────────────────────────────────
def slugify(name):
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = re.sub(r" +", "-", s)
    return "rp-" + s

def bool_val(v):
    return str(v).strip().lower() == "true"

def nullable(v):
    v = str(v).strip()
    return v if v else None

def norm_name(raw):
    n = raw.strip().lower()
    n = re.sub(r"[^a-z ]", " ", n).strip()
    n = re.sub(r" +", " ", n)
    return NAME_MAP.get(n, n)

def norm_region(raw):
    if not raw: return None
    return REGION_NORM.get(str(raw).strip().lower())

def parse_bool_excel(v):
    """Parse Excel NDA/Contract cell. Returns True/False/None."""
    if v is None: return None
    s = str(v).strip().lower()
    if not s or s == "none": return None
    if "signed" in s or s == "y": return True
    if s in ("n", "n/a", "no") or "sent" in s or "prep" in s: return False
    return None  # ambiguous (HOLD, Followup dates, etc.)

def is_yes(v):
    if v is None: return False
    return str(v).strip().lower() in ("y", "yes")

def find_col(hdr, *names):
    for name in names:
        for j, h in enumerate(hdr):
            if str(h or "").strip().lower() == name:
                return j
    return None

# ── Build M365 lookup: normalised name -> 'standard' | 'basic' | None ────────
m365_seats = {}
with open(M365_CSV, newline="", encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        display = row["Display name"].strip()
        key = norm_name(display)
        if key is None:
            continue
        licenses = row["Licenses"].strip()
        if "Business Standard" in licenses:
            m365_seats[key] = "standard"
        elif "Business Basic" in licenses:
            m365_seats[key] = "basic"

# ── Build HubSpot lookup: normalised name -> 'core' | 'free' ─────────────────
hs_seats = {}
with open(HUBSPOT_CSV, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        full = f"{row['First Name'].strip()} {row['Last Name'].strip()}"
        key  = norm_name(full)
        if key is None:
            continue
        paid = row["Paid Seat"].strip().lower() == "yes"
        hs_seats[key] = "core" if paid else "free"

# ── Build Excel cohort lookup ─────────────────────────────────────────────────
# excel_data[norm_name] = {cohort_num, nda, contract, region, ynm}
# Latest cohort (highest number) takes precedence on conflicts.
excel_data = {}
wb = openpyxl.load_workbook(EXCEL_FILE, data_only=True)
for sh_name in wb.sheetnames:
    m = re.match(r"Cohort (\d+)$", sh_name)
    if not m:
        continue
    cohort_num = int(m.group(1))
    if cohort_num not in COHORT_META:
        continue
    ws = wb[sh_name]

    hdr_row = None
    hdr_idx = None
    for i, row in enumerate(ws.iter_rows(min_row=1, max_row=10, values_only=True), 1):
        if any(str(c).strip().lower() == "name" if c else False for c in row):
            hdr_row = list(row)
            hdr_idx = i
            break
    if hdr_row is None:
        continue

    name_col = find_col(hdr_row, "name")
    nda_col  = find_col(hdr_row, "nda")
    ctr_col  = find_col(hdr_row, "contract")
    rgn_col  = find_col(hdr_row, "region")
    ynm_col  = 0  # Y/N/M is always the first column

    if name_col is None:
        continue

    for row in ws.iter_rows(min_row=hdr_idx + 1, max_row=200, values_only=True):
        if not row or all(c is None for c in row):
            break
        raw_name = row[name_col] if len(row) > name_col else None
        if not raw_name or str(raw_name).strip() == "":
            continue

        norm = norm_name(str(raw_name).strip())
        if norm is None:
            continue  # excluded name

        ynm = row[ynm_col] if len(row) > ynm_col else None
        nda = parse_bool_excel(row[nda_col] if nda_col is not None and len(row) > nda_col else None)
        ctr = parse_bool_excel(row[ctr_col] if ctr_col is not None and len(row) > ctr_col else None)
        rgn = norm_region(row[rgn_col] if rgn_col is not None and len(row) > rgn_col else None)

        existing = excel_data.get(norm)
        if existing is None or cohort_num > existing["cohort_num"]:
            excel_data[norm] = {
                "cohort_num": cohort_num,
                "nda":        nda,
                "contract":   ctr,
                "region":     rgn,
                "ynm":        ynm,
            }

# ── Build rpRegister ─────────────────────────────────────────────────────────
register = {}
with open(REGISTER_CSV, newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        name = row["Name"].strip()
        key  = slugify(name)
        norm = norm_name(name)

        # ── CSV base values ──────────────────────────────────────────────────
        nda      = bool_val(row["NDA"])
        contract = bool_val(row["Contract"])
        training = bool_val(row["Training"])
        active   = bool_val(row["Active"])
        start_m  = nullable(row["Start Month"]) or ""
        cohort   = nullable(row["Cohort"])
        region   = nullable(row["Region"])

        # ── Excel overrides ──────────────────────────────────────────────────
        xl = excel_data.get(norm) if norm else None
        if xl:
            cn   = xl["cohort_num"]
            meta = COHORT_META.get(cn, {})

            if xl["nda"] is not None:
                nda = xl["nda"]
            if xl["contract"] is not None:
                contract = xl["contract"]
            if xl["region"] is not None:
                region = xl["region"]

            # Cohort ID and start month (only override if we have metadata)
            if meta.get("key"):
                cohort = meta["key"]
            if meta.get("startMonth"):
                start_m = meta["startMonth"]

            # Training: mark complete only for finished cohorts with Y status
            if meta.get("completed") and is_yes(xl["ynm"]):
                training = True

        # ── Subscription lookups ─────────────────────────────────────────────
        hubspot_csv = nullable(row.get("HubSpot", ""))
        hubspot = hs_seats.get(norm)
        if hubspot is None and hubspot_csv in ("core", "free"):
            hubspot = hubspot_csv

        miro_csv = nullable(row.get("Miro", ""))
        if norm in MIRO_FULL:
            miro = "paid"
        elif norm in MIRO_FREE:
            miro = "free"
        elif miro_csv in ("paid", "free"):
            miro = miro_csv
        else:
            miro = None

        m365_csv = nullable(row.get("M365", ""))
        m365 = m365_seats.get(norm) or (m365_csv if m365_csv in ("standard", "basic") else None)

        register[key] = {
            "id":         key,
            "name":       name,
            "nda":        nda,
            "contract":   contract,
            "training":   training,
            "active":     active,
            "startMonth": start_m,
            "cohort":     cohort,
            "region":     region,
            "subscriptions": {
                "m365":    m365,
                "hubspot": hubspot,
                "miro":    miro,
                "copilot": bool_val(row.get("Copilot", "false")),
            },
        }

# ── Validate seed before writing ─────────────────────────────────────────────
import re as _re, datetime as _dt

def _validate_seed(seed):
    YYYY_MM = _re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
    RP_ID   = _re.compile(r"^rp-[a-z0-9-]+$")

    def err(path, msg):
        raise ValueError(f"[Schema] {path}: {msg}")

    def one_of(val, allowed, path):
        if val not in allowed:
            err(path, f"must be one of {allowed}, got {val!r}")

    def nullable_one_of(val, allowed, path):
        if val is not None and val not in allowed:
            err(path, f"must be one of {allowed} or None, got {val!r}")

    if seed.get("schemaVersion") != 1:
        err("schemaVersion", f"expected 1, got {seed.get('schemaVersion')}")

    for key, rp in seed.get("rpRegister", {}).items():
        p = f"rpRegister.{key}"
        if not RP_ID.match(rp.get("id", "")):
            err(f"{p}.id", f"must match rp-[a-z0-9-]+, got {rp.get('id')!r}")
        if not rp.get("name", "").strip():
            err(f"{p}.name", "must be a non-empty string")
        for bfield in ("nda", "contract", "training", "active"):
            if not isinstance(rp.get(bfield), bool):
                err(f"{p}.{bfield}", f"must be bool, got {type(rp.get(bfield)).__name__}")
        sm = rp.get("startMonth", "")
        if sm and not YYYY_MM.match(sm):
            err(f"{p}.startMonth", f"must be YYYY-MM or empty, got {sm!r}")
        nullable_one_of(rp.get("region"), ["apac", "emea", "americas"], f"{p}.region")
        subs = rp.get("subscriptions", {})
        nullable_one_of(subs.get("m365"),    ["basic", "standard"],  f"{p}.subscriptions.m365")
        nullable_one_of(subs.get("hubspot"), ["core", "free"],       f"{p}.subscriptions.hubspot")
        nullable_one_of(subs.get("miro"),    ["paid", "free"],       f"{p}.subscriptions.miro")
        if not isinstance(subs.get("copilot"), bool):
            err(f"{p}.subscriptions.copilot", "must be bool")

    print(f"Schema validation passed ({len(seed.get('rpRegister', {}))} RPs)")

_validate_seed({**{}, "schemaVersion": 1, "rpRegister": register})  # validate register slice first

# ── Patch seed ───────────────────────────────────────────────────────────────
with open(SEED_FILE, "r", encoding="utf-8") as f:
    seed = json.load(f)

seed["rpRegister"] = register
seed["updatedAt"]  = "2026-05-28T00:00:00Z"

_validate_seed(seed)  # validate full seed before writing

with open(SEED_FILE, "w", encoding="utf-8") as f:
    json.dump(seed, f, indent=2, ensure_ascii=False)

# ── Summary ──────────────────────────────────────────────────────────────────
active_trained   = [r for r in register.values() if r["active"] and r["training"]]
active_untrained = [r for r in register.values() if r["active"] and not r["training"]]
inactive         = [r for r in register.values() if not r["active"]]
hs_core  = [r for r in register.values() if r["subscriptions"]["hubspot"] == "core"]
hs_free  = [r for r in register.values() if r["subscriptions"]["hubspot"] == "free"]
miro_paid   = [r for r in register.values() if r["subscriptions"]["miro"] == "paid"]
miro_free   = [r for r in register.values() if r["subscriptions"]["miro"] == "free"]
m365_std    = [r for r in register.values() if r["subscriptions"]["m365"] == "standard"]
m365_basic  = [r for r in register.values() if r["subscriptions"]["m365"] == "basic"]

excel_matched = [r for r in register.values() if norm_name(r["name"]) in excel_data]
excel_unmatched = [k for k in excel_data if k not in {norm_name(r["name"]) for r in register.values()}]

print(f"Done - {len(register)} RPs written to rpRegister")
print(f"  Active + trained:   {len(active_trained)}")
print(f"  Active + untrained: {len(active_untrained)}")
print(f"  Inactive:           {len(inactive)}")
print(f"  Excel matched:      {len(excel_matched)}")
print(f"  M365 Standard:      {len(m365_std)}  - {', '.join(r['name'] for r in m365_std)}")
print(f"  M365 Basic:         {len(m365_basic)}")
print(f"  HubSpot core:       {len(hs_core)}  - {', '.join(r['name'] for r in hs_core)}")
print(f"  HubSpot free:       {len(hs_free)}")
print(f"  Miro paid:          {len(miro_paid)}")
print(f"  Miro free/guest:    {len(miro_free)}")
if excel_unmatched:
    print(f"\nExcel names not matched in register ({len(excel_unmatched)}):")
    for nm in sorted(excel_unmatched):
        xl = excel_data[nm]
        print(f"  [ch{xl['cohort_num']}] {nm!r}")

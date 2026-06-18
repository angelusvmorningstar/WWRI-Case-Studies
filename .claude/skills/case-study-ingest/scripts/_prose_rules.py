"""
Shared prose-conformance rules for the case-study pipeline.

Single source of truth for the style standard (CASE-STUDIES.md §7), imported by
both normalize_prose.py (auto-fix) and validate_entries.py (check). Keeping the
rule tables here means the two tools can never disagree.

Run from the repo root; these are pure functions with no side effects.
"""
import re

# ── Fields ────────────────────────────────────────────────────────────────────
# Narrative text fields the style rules apply to.
SCALAR_NARRATIVE = [
    'hook', 'ambition', 'challenge', 'solutions', 'client_insight',
    'title', 'duration', 'type_of_reinvention',
]
ARRAY_NARRATIVE = ['benefits', 'challenges', 'activities']

# Body paragraph fields where em-dashes are NOT permitted (hook + benefits are OK).
BODY_PARAGRAPH_FIELDS = ['ambition', 'challenge', 'solutions', 'client_insight']

# Fields required for a complete entry (Stage A). [TO COMPLETE] counts as present
# but pending; a missing/empty key is an error.
REQUIRED_FIELDS = [
    'id', 'category', 'title', 'client_name', 'public_client_name',
    'hook', 'ambition', 'challenge', 'solutions', 'benefits', 'client_insight',
    'industry', 'geography', 'type_of_reinvention',
]

# ── Spelling: British → American ──────────────────────────────────────────────
SPELLING_PAIRS = [
    # -isation → -ization
    ('organisation', 'organization'), ('organisations', 'organizations'),
    ('specialisation', 'specialization'), ('utilisation', 'utilization'),
    ('optimisation', 'optimization'), ('standardisation', 'standardization'),
    ('characterisation', 'characterization'), ('mobilisation', 'mobilization'),
    ('prioritisation', 'prioritization'), ('capitalisation', 'capitalization'),
    ('personalisation', 'personalization'), ('digitalisation', 'digitalization'),
    ('commercialisation', 'commercialization'), ('visualisation', 'visualization'),
    ('harmonisation', 'harmonization'), ('stabilisation', 'stabilization'),
    ('localisation', 'localization'), ('localisations', 'localizations'),
    ('underutilisation', 'underutilization'), ('decentralisation', 'decentralization'),
    ('finalisation', 'finalization'),
    # -ise → -ize
    ('organised', 'organized'), ('organise', 'organize'),
    ('recognised', 'recognized'), ('recognise', 'recognize'),
    ('customised', 'customized'), ('customise', 'customize'),
    ('personalised', 'personalized'), ('personalise', 'personalize'),
    ('realised', 'realized'), ('realise', 'realize'),
    ('finalised', 'finalized'), ('finalise', 'finalize'),
    ('prioritised', 'prioritized'), ('prioritise', 'prioritize'),
    ('optimised', 'optimized'), ('optimise', 'optimize'),
    ('utilised', 'utilized'), ('utilise', 'utilize'),
    ('specialised', 'specialized'), ('specialise', 'specialize'),
    ('mobilised', 'mobilized'), ('mobilise', 'mobilize'),
    ('standardised', 'standardized'), ('standardise', 'standardize'),
    ('capitalised', 'capitalized'), ('capitalise', 'capitalize'),
    ('emphasised', 'emphasized'), ('emphasise', 'emphasize'),
    ('minimised', 'minimized'), ('minimise', 'minimize'),
    ('maximised', 'maximized'), ('maximise', 'maximize'),
    ('summarised', 'summarized'), ('summarise', 'summarize'),
    ('characterised', 'characterized'), ('characterise', 'characterize'),
    ('analysed', 'analyzed'), ('analyse', 'analyze'),
    ('localised', 'localized'), ('localise', 'localize'),
    ('underutilised', 'underutilized'), ('underutilise', 'underutilize'),
    ('stabilised', 'stabilized'), ('stabilise', 'stabilize'),
    ('decentralised', 'decentralized'), ('decentralise', 'decentralize'),
    ('reorganised', 'reorganized'), ('reorganise', 'reorganize'),
    ('unionised', 'unionized'), ('unionise', 'unionize'),
    ('revitalised', 'revitalized'), ('revitalise', 'revitalize'),
    ('synchronised', 'synchronized'), ('synchronise', 'synchronize'),
    ('unsynchronised', 'unsynchronized'),
    ('materialised', 'materialized'), ('materialise', 'materialize'),
    ('productised', 'productized'), ('productise', 'productize'),
    # -our → -or
    ('labour', 'labor'), ('labours', 'labors'),
    ('colour', 'color'), ('colours', 'colors'), ('coloured', 'colored'),
    ('behaviour', 'behavior'), ('behaviours', 'behaviors'),
    ('behavioural', 'behavioral'),
    ('favour', 'favor'), ('favours', 'favors'), ('favoured', 'favored'),
    ('favourite', 'favorite'), ('harbour', 'harbor'),
    ('honour', 'honor'), ('honoured', 'honored'), ('humour', 'humor'),
    ('neighbour', 'neighbor'), ('neighbours', 'neighbors'),
    ('rumour', 'rumor'), ('savour', 'savor'),
    # -re → -er
    ('centre', 'center'), ('centres', 'centers'), ('centred', 'centered'),
    ('theatre', 'theater'), ('fibre', 'fiber'), ('litre', 'liter'),
    ('metre', 'meter'), ('metres', 'meters'),
    # -ogue → -og
    ('catalogue', 'catalog'), ('dialogue', 'dialog'),
    # -ence → -ense
    ('defence', 'defense'), ('licence', 'license'),
    # -ll- doublings
    ('travelling', 'traveling'), ('traveller', 'traveler'),
    ('modelling', 'modeling'), ('counselling', 'counseling'),
    ('signalling', 'signaling'),
    # programme → program
    ('programmes', 'programs'), ('programme', 'program'),
]


def _replace_word(text, british, american):
    def _sub(m):
        w = m.group(0)
        if w.isupper():
            return american.upper()
        if w[0].isupper():
            return american[0].upper() + american[1:]
        return american
    return re.sub(r'\b' + re.escape(british) + r'\b', _sub, text, flags=re.IGNORECASE)


def normalize_text(text):
    """Apply American spelling + Latin-abbreviation punctuation. Idempotent."""
    if not text:
        return text
    for british, american in SPELLING_PAIRS:
        text = _replace_word(text, british, american)
    # Latin abbreviations: bare ie/eg → i.e./e.g. (not already punctuated)
    text = re.sub(r'\bie\b(?!\.)', 'i.e.', text)
    text = re.sub(r'\beg\b(?!\.)', 'e.g.', text)
    return text


# ── Detectors (read-only, for the validator) ─────────────────────────────────
_MARKER_RE = re.compile(r'\[(DRAFT|AI)[^\]]*\]')


def find_british_spellings(text):
    """Return the British spellings present in text (for reporting)."""
    if not text:
        return []
    hits = []
    for british, _ in SPELLING_PAIRS:
        if re.search(r'\b' + re.escape(british) + r'\b', text, flags=re.IGNORECASE):
            hits.append(british)
    return hits


def find_body_emdashes(text):
    """True if an em-dash appears outside a provenance marker."""
    if not text:
        return False
    stripped = _MARKER_RE.sub('', text)
    return '—' in stripped


def find_bare_latin_abbr(text):
    """Return bare 'ie'/'eg' occurrences (unpunctuated)."""
    if not text:
        return []
    hits = []
    if re.search(r'\bie\b(?!\.)', text):
        hits.append('ie')
    if re.search(r'\beg\b(?!\.)', text):
        hits.append('eg')
    return hits


def is_placeholder(value):
    """True if a value is an unfilled owner placeholder."""
    return bool(value) and str(value).strip().startswith('[TO COMPLETE]')

"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { INTRO_SECTIONS } from "@/lib/topic-library";
import {
  startSessionAction,
  saveScoresAction,
  saveNoteAction,
  saveBackgroundAction,
  completeSessionAction,
  reopenSessionAction,
} from "@/actions/scoringActions";

// ── Colour constants (matching prototype exactly) ────────────────────────────
const C = {
  bg: "#F5F4F0",
  sur: "#FFFFFF",
  elv: "#F0EFEC",
  brd: "#DDDBD6",
  mut: "#888884",
  sub: "#555550",
  wht: "#1A1A1A",
  tel: "#009898",
  amb: "#C07A00",
  red: "#C0392B",
  grn: "#1E8C4A",
};

const sc = (v: number | null) =>
  v == null ? C.mut : v >= 70 ? C.grn : v >= 40 ? C.amb : C.red;
const fmt = (s: number) =>
  String(Math.floor(s / 60)) + ":" + String(s % 60).padStart(2, "0");

// ── Types ────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  question: string;
  purpose: string;
  mins: number;
  criteria: { id: string; name: string; hi: string; lo: string }[];
}

interface InterviewClientProps {
  accessKey: string;
  engagementId: string;
  interviewee: {
    id: string;
    name: string;
    title: string;
    category: string;
    interviewerNames: string[];
  };
  questions: Question[];
  activeTopicNames: string[];
  existingSession: {
    id: string;
    status: string;
    scores: Record<string, number>;
    notes: Record<string, string>;
    background: Record<string, string>;
  } | null;
  guidanceData: {
    boilerplateOverrides: Record<string, string>;
    bespokeSection: string;
  } | null;
  sidebarData: {
    id: string;
    name: string;
    title: string;
    category: string;
    status: string;
    isCurrent: boolean;
  }[];
}

type Step = "intro" | "background" | "questions" | "complete";

// ── Score Slider (prototype-faithful) ────────────────────────────────────────
function ScoreSlider({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const pct = value != null ? value : 50;
  const col =
    value == null
      ? "#888884"
      : value >= 70
        ? "#1E8C4A"
        : value >= 40
          ? "#C07A00"
          : "#C0392B";
  const trackBg =
    value != null
      ? `linear-gradient(to right, ${col} ${pct}%, #DDDBD6 ${pct}%)`
      : "#DDDBD6";

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            color: "#C0392B",
            fontWeight: 700,
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          LOW
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={pct}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            background: trackBg,
            outline: "none",
            cursor: disabled ? "default" : "pointer",
            appearance: "none",
            WebkitAppearance: "none",
          } as React.CSSProperties}
        />
        <div
          style={{
            minWidth: 46,
            textAlign: "center",
            background: value == null ? "#F0EFEC" : col + "18",
            borderRadius: 4,
            padding: "2px 6px",
            color: value == null ? "#888884" : col,
            fontSize: 13,
            fontWeight: 800,
            border: `1.5px solid ${value == null ? "#DDDBD6" : col + "55"}`,
            lineHeight: 1.5,
            flexShrink: 0,
          }}
        >
          {value == null ? "\u2014" : value + "%"}
        </div>
        <span
          style={{
            fontSize: 10,
            color: "#1E8C4A",
            fontWeight: 700,
            letterSpacing: "0.05em",
            flexShrink: 0,
          }}
        >
          HIGH
        </span>
      </div>
      {value == null && (
        <p
          style={{
            fontSize: 11,
            color: "#C07A00",
            marginTop: 3,
            textAlign: "center",
          }}
        >
          Move the slider to record a score.
        </p>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function InterviewClient({
  accessKey,
  engagementId,
  interviewee,
  questions,
  activeTopicNames,
  existingSession,
  guidanceData,
  sidebarData,
}: InterviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Determine initial step from existing session
  const initialStep: Step = existingSession
    ? existingSession.status === "complete"
      ? "complete"
      : "questions"
    : "intro";

  // Session state
  const [sessionId, setSessionId] = useState(existingSession?.id || "");
  const [step, setStep] = useState<Step>(initialStep);
  const [qIdx, setQIdx] = useState(0);

  // Scores, notes, background (local state, auto-saved)
  const [scores, setScores] = useState<Record<string, number>>(
    existingSession?.scores || {}
  );
  const [notes, setNotes] = useState<Record<string, string>>(
    existingSession?.notes || {}
  );
  const [background, setBackground] = useState<Record<string, string>>(
    existingSession?.background || {}
  );

  // Timer
  const [secs, setSecs] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-save
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const dirtyScores = useRef<{ criteriaId: string; value: number }[]>([]);
  const dirtyNotes = useRef<{ questionId: string; text: string }[]>([]);
  const dirtyBackground = useRef<Record<string, string> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived question data ────────────────────────────────────────────────
  const currentQ = questions[qIdx];

  // Build active topic list from questions (preserving order, deduped)
  const activeTopicIds = [...new Set(questions.map((q) => q.topicId))];

  // Current question's topic position
  let topicIdx = 0;
  let qInTopic = 0;
  let totalInTopic = 1;
  if (currentQ) {
    topicIdx = activeTopicIds.findIndex((id) => id === currentQ.topicId);
    const tqs = questions.filter((q) => q.topicId === currentQ.topicId);
    qInTopic = tqs.findIndex((q) => q.id === currentQ.id);
    totalInTopic = tqs.length;
  }

  // ── Timer effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      (step === "intro" || step === "background" || step === "questions") &&
      !paused
    ) {
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step, paused]);

  // ── Auto-save logic ──────────────────────────────────────────────────────
  const flushSave = useCallback(async () => {
    if (!sessionId) return;
    const scoresToSave = [...dirtyScores.current];
    const notesToSave = [...dirtyNotes.current];
    const bgToSave = dirtyBackground.current;
    dirtyScores.current = [];
    dirtyNotes.current = [];
    dirtyBackground.current = null;

    if (scoresToSave.length === 0 && notesToSave.length === 0 && !bgToSave)
      return;

    setSaveStatus("saving");
    try {
      if (scoresToSave.length > 0)
        await saveScoresAction(sessionId, scoresToSave);
      for (const n of notesToSave)
        await saveNoteAction(sessionId, n.questionId, n.text);
      if (bgToSave) await saveBackgroundAction(sessionId, bgToSave);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      dirtyScores.current.push(...scoresToSave);
      dirtyNotes.current.push(...notesToSave);
      if (bgToSave) dirtyBackground.current = bgToSave;
    }
  }, [sessionId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 15000);
  }, [flushSave]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartSession = async () => {
    const id = await startSessionAction(interviewee.id);
    setSessionId(id);
    setStep("questions");
  };

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: value }));
    dirtyScores.current.push({ criteriaId, value });
    scheduleSave();
  };

  const handleNoteChange = (questionId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [questionId]: text }));
    dirtyNotes.current = dirtyNotes.current.filter(
      (n) => n.questionId !== questionId
    );
    dirtyNotes.current.push({ questionId, text });
    scheduleSave();
  };

  const handleBgChange = (field: string, value: string) => {
    setBackground((prev) => {
      const next = { ...prev, [field]: value };
      dirtyBackground.current = next;
      scheduleSave();
      return next;
    });
  };

  const handleNextQ = () => {
    if (qIdx < questions.length - 1) {
      setQIdx((q) => q + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevQ = () => {
    if (qIdx > 0) setQIdx((q) => q - 1);
  };

  const handleComplete = () => {
    flushSave();
    startTransition(async () => {
      await completeSessionAction(sessionId);
      setStep("complete");
    });
  };

  const handleReopen = () => {
    startTransition(async () => {
      await reopenSessionAction(sessionId);
      setStep("questions");
    });
  };

  const backToList = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.push(`/engagement/${accessKey}`);
  };

  const beginQs = () => {
    handleStartSession();
  };

  // ── Shared inline styles ─────────────────────────────────────────────────
  const fld: React.CSSProperties = {
    background: "#FFFFFF",
    border: "1.5px solid #AAAAA5",
    borderRadius: 6,
    color: "#1A1A1A",
    fontSize: 15,
    padding: "11px 14px",
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
    transition: "border-color .1s",
  };

  const lbl: React.CSSProperties = {
    fontSize: 14,
    color: C.sub,
    display: "block",
    marginBottom: 8,
    fontWeight: 600,
  };

  const isComplete = step === "complete";

  // ── Sticky sub-header ────────────────────────────────────────────────────
  const StickyHeader = () => {
    const interviewerStr =
      interviewee.interviewerNames.length > 0
        ? " \u00b7 " + interviewee.interviewerNames.join(", ")
        : "";

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 36px",
          borderBottom: `1px solid ${C.brd}`,
          background: C.sur,
          position: "sticky",
          top: 52,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            className="ww-btn-ghost"
            onClick={backToList}
            style={{ height: 40 }}
          >
            <span style={{ fontSize: 16 }}>{"\u2190"}</span> Back
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {interviewee.name}
            </div>
            <div style={{ color: C.mut, fontSize: 12 }}>
              {interviewee.title} &middot; {interviewee.category}
              {interviewerStr}
            </div>
          </div>
        </div>

        {(step === "intro" ||
          step === "background" ||
          step === "questions") && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saveStatus === "saving" && (
              <span style={{ fontSize: 11, color: C.amb }}>Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span style={{ fontSize: 11, color: C.grn }}>Saved</span>
            )}
            {saveStatus === "error" && (
              <span style={{ fontSize: 11, color: C.red }}>
                Save failed &mdash; retrying
              </span>
            )}
            <button
              onClick={() => setPaused((p) => !p)}
              style={{
                background: paused
                  ? "rgba(192,122,0,.1)"
                  : "rgba(0,0,0,.05)",
                border: `1px solid ${paused ? C.amb : C.brd}`,
                borderRadius: 6,
                padding: "6px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: paused ? C.amb : C.sub,
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              {paused ? "\u25b6  Resume" : "\u23f8  Pause"}
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: paused
                  ? "rgba(192,122,0,.08)"
                  : "rgba(0,0,0,.04)",
                padding: "7px 14px",
                borderRadius: 6,
                border: `1px solid ${paused ? C.amb : C.brd}`,
              }}
            >
              <span>{"\u23f1"}</span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: paused ? C.amb : C.sub,
                  minWidth: 44,
                }}
              >
                {fmt(secs)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // INTRO STEP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "intro") {
    return (
      <div>
        <StickyHeader />
        <div style={{ padding: "36px", maxWidth: 780, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Interviewer&rsquo;s introduction
          </h2>
          <p
            style={{ color: C.sub, fontSize: 15, marginBottom: 24 }}
          >
            Read each section to the interviewee before beginning.
          </p>

          <div
            style={{
              border: `1px solid ${C.brd}`,
              borderRadius: 10,
              overflow: "hidden",
              marginBottom: 32,
            }}
          >
            {INTRO_SECTIONS.map((s, i) => {
              const overrideText =
                guidanceData?.boilerplateOverrides[s.label];
              const content = overrideText || s.content;
              const paragraphs = content.split("\n\n");

              return (
                <div
                  key={s.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    borderBottom:
                      i < INTRO_SECTIONS.length - 1
                        ? `1px solid ${C.brd}`
                        : "none",
                  }}
                >
                  <div
                    style={{
                      padding: 20,
                      background: C.elv,
                      borderRight: `1px solid ${C.brd}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: C.sub,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div style={{ padding: "20px 24px", background: C.sur }}>
                    {paragraphs.map((para, pi) => {
                      // Bullet lists
                      if (para.startsWith("\u2022")) {
                        const lines = para
                          .split("\n")
                          .filter((l) => l.startsWith("\u2022"));
                        return (
                          <ul
                            key={pi}
                            style={{
                              margin: "8px 0",
                              paddingLeft: 18,
                              listStyle: "disc",
                            }}
                          >
                            {lines.map((line, li) => (
                              <li
                                key={li}
                                style={{
                                  fontSize: 15,
                                  color: "#1A1A1A",
                                  lineHeight: 1.7,
                                  marginBottom: 2,
                                }}
                              >
                                {line.replace("\u2022 ", "")}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      // Emphasis highlight
                      if (
                        !overrideText &&
                        "emphasis" in s &&
                        s.emphasis &&
                        para.includes(s.emphasis)
                      ) {
                        const parts = para.split(s.emphasis);
                        return (
                          <p
                            key={pi}
                            style={{
                              fontSize: 15,
                              color: "#1A1A1A",
                              lineHeight: 1.75,
                              margin: pi > 0 ? "10px 0 0" : "0",
                            }}
                          >
                            {parts[0]}
                            <span
                              style={{
                                textDecoration: "underline",
                                fontWeight: 600,
                              }}
                            >
                              {s.emphasis}
                            </span>
                            {parts[1]}
                          </p>
                        );
                      }

                      // Normal paragraph
                      return (
                        <p
                          key={pi}
                          style={{
                            fontSize: 15,
                            color: "#1A1A1A",
                            lineHeight: 1.75,
                            margin: pi > 0 ? "10px 0 0" : "0",
                          }}
                        >
                          {para}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {guidanceData?.bespokeSection && (
            <div
              style={{
                border: `1px solid ${C.brd}`,
                borderLeft: `4px solid ${C.tel}`,
                borderRadius: 10,
                padding: 24,
                marginBottom: 32,
                background: C.sur,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Engagement Context
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: C.sub,
                  lineHeight: 1.75,
                  whiteSpace: "pre-line",
                }}
              >
                {guidanceData.bespokeSection}
              </p>
            </div>
          )}

          <button
            className="ww-btn-primary"
            onClick={() => setStep("background")}
            style={{
              height: 56,
              fontSize: 16,
              paddingLeft: 28,
              paddingRight: 28,
            }}
          >
            Interviewee is ready &mdash; continue &nbsp;&rarr;
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND STEP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "background") {
    return (
      <div>
        <StickyHeader />
        <div style={{ padding: "36px", maxWidth: 640, margin: "0 auto" }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Background information
          </h2>
          <p style={{ color: C.sub, fontSize: 15, marginBottom: 28 }}>
            Fill in at the start of the meeting, before questions begin.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginBottom: 16,
            }}
          >
            <div>
              <label style={lbl}>Time with organisation</label>
              <input
                style={fld}
                value={background.tenure || ""}
                onChange={(e) => handleBgChange("tenure", e.target.value)}
                placeholder="e.g. 8 years"
                onFocus={(e) =>
                  (e.target.style.borderColor = C.tel)
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#AAAAA5")
                }
              />
            </div>
            <div>
              <label style={lbl}>Time in current role</label>
              <input
                style={fld}
                value={background.timeInRole || ""}
                onChange={(e) =>
                  handleBgChange("timeInRole", e.target.value)
                }
                placeholder="e.g. 2 years"
                onFocus={(e) =>
                  (e.target.style.borderColor = C.tel)
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#AAAAA5")
                }
              />
            </div>
            <div>
              <label style={lbl}>Reports to</label>
              <input
                style={fld}
                value={background.reportsTo || ""}
                onChange={(e) =>
                  handleBgChange("reportsTo", e.target.value)
                }
                placeholder="Name and title"
                onFocus={(e) =>
                  (e.target.style.borderColor = C.tel)
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#AAAAA5")
                }
              />
            </div>
            <div>
              <label style={lbl}>Direct reports</label>
              <input
                style={fld}
                value={background.directReports || ""}
                onChange={(e) =>
                  handleBgChange("directReports", e.target.value)
                }
                placeholder="e.g. 6"
                onFocus={(e) =>
                  (e.target.style.borderColor = C.tel)
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#AAAAA5")
                }
              />
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <label style={lbl}>
              Division overview and daily interactions (optional)
            </label>
            <textarea
              style={{
                ...fld,
                minHeight: 80,
                resize: "vertical" as const,
                lineHeight: 1.6,
              }}
              value={background.notes || ""}
              onChange={(e) => handleBgChange("notes", e.target.value)}
              placeholder="Brief notes on their area and how it interacts with others..."
              onFocus={(e) => (e.target.style.borderColor = C.tel)}
              onBlur={(e) =>
                (e.target.style.borderColor = "#AAAAA5")
              }
            />
          </div>

          <button
            className="ww-btn-primary"
            onClick={beginQs}
            style={{
              height: 56,
              fontSize: 16,
              paddingLeft: 28,
              paddingRight: 28,
            }}
          >
            Begin questions &nbsp;&rarr;
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTION STEP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "questions" && currentQ) {
    return (
      <div>
        <StickyHeader />

        {/* Topic progress bar */}
        <div
          style={{
            padding: "12px 36px",
            borderBottom: `1px solid ${C.brd}`,
            background: C.sur,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          {/* Topic dots */}
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {activeTopicIds.map((id, i) => (
              <div
                key={id}
                style={{
                  height: 6,
                  width: i === topicIdx ? 22 : 6,
                  borderRadius: 3,
                  background: i <= topicIdx ? C.tel : C.brd,
                  transition: "all .3s",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, color: C.sub }}>
            Topic {topicIdx + 1} of {activeTopicIds.length}:{" "}
            <strong style={{ color: C.wht }}>{currentQ.topicName}</strong>
          </span>
          <span
            style={{ marginLeft: "auto", fontSize: 13, color: C.mut }}
          >
            Q{qInTopic + 1} of {totalInTopic} &middot; ~{currentQ.mins}{" "}
            min
          </span>
        </div>

        {/* Question content */}
        <div
          style={{
            padding: "16px 36px 20px",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {/* Subtopic label */}
          <div
            style={{
              fontSize: 11,
              color: C.tel,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            {currentQ.subtopicName}
          </div>

          {/* Question card */}
          <div
            style={{
              background: C.elv,
              border: `2px solid ${C.brd}`,
              borderRadius: 8,
              padding: "14px 28px",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: C.wht,
                fontWeight: 600,
                fontStyle: "italic",
              }}
            >
              &ldquo;{currentQ.question}&rdquo;
            </div>
          </div>

          {/* Purpose callout */}
          <div
            style={{
              background: "rgba(0,152,152,.07)",
              border: "1px solid rgba(0,152,152,.2)",
              borderRadius: 6,
              padding: "7px 14px",
              marginBottom: 14,
              display: "flex",
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                color: C.tel,
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Purpose:
            </span>
            <span
              style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}
            >
              {currentQ.purpose}
            </span>
          </div>

          {/* Two-column: reply + criteria */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {/* Left: Interviewee's reply */}
            <div
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.mut,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Interviewee&rsquo;s reply
              </div>
              <textarea
                value={notes[currentQ.id] || ""}
                onChange={(e) =>
                  handleNoteChange(currentQ.id, e.target.value)
                }
                placeholder="Key points, quotes, observations from this answer..."
                disabled={isComplete}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid #AAAAA5",
                  borderRadius: 6,
                  color: "#1A1A1A",
                  fontSize: 14,
                  padding: 12,
                  fontFamily: "inherit",
                  width: "100%",
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.6,
                  flex: 1,
                  minHeight: 260,
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = C.tel)
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "#AAAAA5")
                }
              />
            </div>

            {/* Right: Assessment criteria */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: C.mut,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                Assessment criteria
              </div>
              {currentQ.criteria.map((c) => (
                <div
                  key={c.id}
                  className="ww-card"
                  style={{ padding: "12px 14px" }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: C.wht,
                      marginBottom: 6,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 8,
                      fontSize: 12,
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      style={{
                        color: C.red,
                        fontWeight: 700,
                        fontSize: 10,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      LOW:
                    </span>
                    <span style={{ color: C.sub, flex: 1 }}>
                      {c.lo}
                    </span>
                    <span
                      style={{
                        color: C.mut,
                        flexShrink: 0,
                        margin: "0 4px",
                      }}
                    >
                      |
                    </span>
                    <span
                      style={{
                        color: C.grn,
                        fontWeight: 700,
                        fontSize: 10,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      HIGH:
                    </span>
                    <span style={{ color: C.sub, flex: 1 }}>
                      {c.hi}
                    </span>
                  </div>
                  <ScoreSlider
                    value={
                      scores[c.id] != null ? scores[c.id] : null
                    }
                    onChange={(v) => handleScoreChange(c.id, v)}
                    disabled={isComplete}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
            }}
          >
            <button
              className="ww-btn-ghost"
              onClick={handlePrevQ}
              disabled={qIdx === 0}
              style={{ height: 44, fontSize: 15 }}
            >
              &larr; Previous
            </button>
            <button
              className="ww-btn-primary"
              onClick={handleNextQ}
              disabled={isPending}
              style={{
                height: 44,
                fontSize: 15,
                paddingLeft: 28,
                paddingRight: 28,
              }}
            >
              {qIdx === questions.length - 1
                ? isPending
                  ? "Completing..."
                  : "Complete interview"
                : "Next question \u00a0\u2192"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPLETE STEP
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "complete") {
    // Compute per-topic average scores
    const topScores = activeTopicIds.map((tId, i) => {
      const tQs = questions.filter((q) => q.topicId === tId);
      const vals = tQs
        .flatMap((q) => q.criteria.map((c) => scores[c.id]))
        .filter((v): v is number => v != null);
      const avg =
        vals.length > 0
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : null;
      return {
        name: activeTopicNames[i] || tQs[0]?.topicName || "Topic",
        avg,
      };
    });

    return (
      <div>
        <StickyHeader />
        <div style={{ padding: "48px 36px", maxWidth: 560, margin: "0 auto" }}>
          {/* Green checkmark circle */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(30,140,74,.12)",
              border: `2px solid ${C.grn}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              fontSize: 32,
            }}
          >
            {"\u2713"}
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Interview complete
          </h2>
          <p
            style={{
              color: C.sub,
              textAlign: "center",
              fontSize: 16,
              marginBottom: 36,
            }}
          >
            {interviewee.name} &middot; {interviewee.title}
          </p>

          {/* Score summary card */}
          <div
            className="ww-card"
            style={{ padding: 26, marginBottom: 32 }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.mut,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              Score summary
            </div>
            {topScores.map((t) => (
              <div
                key={t.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: C.sub,
                    lineHeight: 1.3,
                  }}
                >
                  {t.name}
                </span>
                <div
                  style={{
                    width: 110,
                    height: 8,
                    background: C.elv,
                    borderRadius: 4,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {t.avg != null && (
                    <div
                      style={{
                        width: `${t.avg}%`,
                        height: "100%",
                        background: sc(t.avg),
                        borderRadius: 4,
                      }}
                    />
                  )}
                </div>
                <span
                  style={{
                    minWidth: 40,
                    fontSize: 15,
                    fontWeight: 700,
                    color: t.avg == null ? C.mut : sc(t.avg),
                    textAlign: "right",
                    fontFamily: "monospace",
                  }}
                >
                  {t.avg == null ? "\u2014" : t.avg + "%"}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <button
              className="ww-btn-ghost"
              onClick={handleReopen}
              disabled={isPending}
              style={{
                height: 52,
                fontSize: 16,
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              Reopen for editing
            </button>
            <button
              className="ww-btn-primary"
              onClick={backToList}
              style={{
                height: 52,
                fontSize: 16,
                paddingLeft: 32,
                paddingRight: 32,
              }}
            >
              Back to interviewee list
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not reach here)
  return null;
}

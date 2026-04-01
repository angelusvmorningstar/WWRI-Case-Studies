"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { INTRO_SECTIONS } from "@/lib/topic-library";
import {
  startSessionAction,
  saveScoresAction,
  saveNoteAction,
  completeSessionAction,
  reopenSessionAction,
} from "@/actions/scoringActions";

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
  interviewee: { id: string; name: string; title: string; category: string };
  questions: Question[];
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
  sidebarData: { id: string; name: string; title: string; category: string; status: string; isCurrent: boolean }[];
}

type Step = "intro" | "questions" | "complete";

export function InterviewClient({
  accessKey,
  engagementId,
  interviewee,
  questions,
  existingSession,
  guidanceData,
  sidebarData,
}: InterviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Session state
  const [sessionId, setSessionId] = useState(existingSession?.id || "");
  const [step, setStep] = useState<Step>(existingSession ? "questions" : "intro");
  const [introIdx, setIntroIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [isComplete, setIsComplete] = useState(existingSession?.status === "complete");

  // Scores & notes (local state, auto-saved)
  const [scores, setScores] = useState<Record<string, number>>(existingSession?.scores || {});
  const [notes, setNotes] = useState<Record<string, string>>(existingSession?.notes || {});

  // Timer
  const [secs, setSecs] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-save
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const dirtyScores = useRef<{ criteriaId: string; value: number }[]>([]);
  const dirtyNotes = useRef<{ questionId: string; text: string }[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer effect
  useEffect(() => {
    if (step === "questions" && !paused && !isComplete) {
      timerRef.current = setInterval(() => setSecs((s) => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, paused, isComplete]);

  // Auto-save effect
  const flushSave = useCallback(async () => {
    if (!sessionId) return;
    const scoresToSave = [...dirtyScores.current];
    const notesToSave = [...dirtyNotes.current];
    dirtyScores.current = [];
    dirtyNotes.current = [];

    if (scoresToSave.length === 0 && notesToSave.length === 0) return;

    setSaveStatus("saving");
    try {
      if (scoresToSave.length > 0) await saveScoresAction(sessionId, scoresToSave);
      for (const n of notesToSave) await saveNoteAction(sessionId, n.questionId, n.text);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1500);
    } catch {
      setSaveStatus("error");
      // Put items back for retry
      dirtyScores.current.push(...scoresToSave);
      dirtyNotes.current.push(...notesToSave);
    }
  }, [sessionId]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flushSave, 15000); // 15 second debounce
  }, [flushSave]);

  // Start session
  const handleStartSession = async () => {
    const id = await startSessionAction(interviewee.id);
    setSessionId(id);
    setStep("questions");
  };

  // Score change
  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores((prev) => ({ ...prev, [criteriaId]: value }));
    dirtyScores.current.push({ criteriaId, value });
    scheduleSave();
  };

  // Note change
  const handleNoteChange = (questionId: string, text: string) => {
    setNotes((prev) => ({ ...prev, [questionId]: text }));
    dirtyNotes.current = dirtyNotes.current.filter((n) => n.questionId !== questionId);
    dirtyNotes.current.push({ questionId, text });
    scheduleSave();
  };

  // Complete
  const handleComplete = () => {
    flushSave();
    startTransition(async () => {
      await completeSessionAction(sessionId);
      setIsComplete(true);
    });
  };

  // Reopen
  const handleReopen = () => {
    startTransition(async () => {
      await reopenSessionAction(sessionId);
      setIsComplete(false);
    });
  };

  // Manual save
  const handleManualSave = () => flushSave();

  const currentQ = questions[qIdx];
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className="w-56 border-r border-ww-border bg-ww-surface overflow-y-auto flex-shrink-0">
        <div className="p-3">
          <Link href={`/engagement/${accessKey}`} className="text-[11px] text-ww-teal no-underline hover:underline block mb-3">
            &larr; Dashboard
          </Link>
          <h3 className="text-[11px] font-semibold text-ww-text-muted uppercase tracking-wider mb-2">Interviews</h3>
          {sidebarData.map((person) => {
            const variant = person.status === "complete" ? "green" : person.status === "in-progress" ? "teal" : "muted" as const;
            return (
              <Link
                key={person.id}
                href={`/engagement/${accessKey}/interview/${person.id}`}
                className={`block p-2 rounded-md mb-1 no-underline transition-colors ${
                  person.isCurrent ? "bg-ww-teal/10 border border-ww-teal/30" : "hover:bg-ww-bg"
                }`}
              >
                <div className="text-[12px] font-semibold text-ww-text truncate">{person.name}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant={variant}>{person.status}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-ww-text">{interviewee.name}</h1>
              <p className="text-sm text-ww-text-muted">{interviewee.title} · {interviewee.category}</p>
            </div>
            <div className="flex items-center gap-3">
              {step === "questions" && (
                <span className="font-mono text-md text-ww-text">{formatTime(secs)}</span>
              )}
              {step === "questions" && (
                <Button size="sm" variant="ghost" onClick={() => setPaused(!paused)}>
                  {paused ? "Resume" : "Pause"}
                </Button>
              )}
              {saveStatus === "saving" && <span className="text-[11px] text-ww-amber">Saving...</span>}
              {saveStatus === "saved" && <span className="text-[11px] text-ww-green">Saved</span>}
              {saveStatus === "error" && <span className="text-[11px] text-ww-red">Save failed — retrying</span>}
              <Button size="sm" variant="ghost" onClick={handleManualSave}>Save</Button>
            </div>
          </div>

          {/* === INTRO STEP === */}
          {step === "intro" && (
            <div>
              {(() => {
                const section = INTRO_SECTIONS[introIdx];
                const overrideText = guidanceData?.boilerplateOverrides[section.label];
                return (
                  <Card>
                    <h2 className="text-md font-semibold text-ww-text mb-3">{section.label}</h2>
                    <p className="text-[13px] text-ww-text-secondary whitespace-pre-line leading-relaxed">
                      {overrideText || section.content}
                    </p>
                    {"emphasis" in section && section.emphasis && !overrideText && (
                      <p className="text-[13px] font-semibold text-ww-text mt-3">{section.emphasis}</p>
                    )}
                  </Card>
                );
              })()}

              {guidanceData?.bespokeSection && introIdx === INTRO_SECTIONS.length - 1 && (
                <Card className="mt-4 border-l-4 border-l-ww-teal">
                  <h2 className="text-md font-semibold text-ww-text mb-2">Engagement Context</h2>
                  <p className="text-[13px] text-ww-text-secondary whitespace-pre-line">{guidanceData.bespokeSection}</p>
                </Card>
              )}

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setIntroIdx(Math.max(0, introIdx - 1))} disabled={introIdx === 0}>
                  &larr; Previous
                </Button>
                {introIdx < INTRO_SECTIONS.length - 1 ? (
                  <Button onClick={() => setIntroIdx(introIdx + 1)}>Next &rarr;</Button>
                ) : (
                  <Button onClick={handleStartSession}>Begin Interview &rarr;</Button>
                )}
              </div>
            </div>
          )}

          {/* === QUESTIONS STEP === */}
          {step === "questions" && currentQ && (
            <div>
              {/* Progress */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[11px] text-ww-text-muted">
                  Question {qIdx + 1} of {questions.length}
                </span>
                <div className="flex-1 h-1 bg-ww-border rounded-full">
                  <div
                    className="h-1 bg-ww-teal rounded-full transition-all"
                    style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-ww-text-muted">{currentQ.mins} min</span>
              </div>

              {/* Topic context */}
              <div className="text-[11px] text-ww-text-muted mb-1">{currentQ.topicName}</div>
              <h2 className="text-md font-semibold text-ww-text mb-2">{currentQ.subtopicName}</h2>
              <p className="text-[12px] text-ww-text-muted mb-4">{currentQ.purpose}</p>

              {/* Question */}
              <Card className="mb-4">
                <p className="text-[13px] text-ww-text-secondary italic">&ldquo;{currentQ.question}&rdquo;</p>
              </Card>

              {/* Notes */}
              <div className="mb-4">
                <label className="ww-label block">Notes</label>
                <textarea
                  value={notes[currentQ.id] || ""}
                  onChange={(e) => handleNoteChange(currentQ.id, e.target.value)}
                  rows={3}
                  placeholder="Capture key points from the response..."
                  className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y"
                  disabled={isComplete}
                />
              </div>

              {/* Criteria scoring */}
              <div className="flex flex-col gap-4">
                {currentQ.criteria.map((crit) => (
                  <Card key={crit.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-semibold text-ww-text">{crit.name}</span>
                      <span className="font-mono text-md font-semibold text-ww-teal">
                        {scores[crit.id] ?? 0}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={scores[crit.id] ?? 0}
                      onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                      className="w-full mb-2"
                      disabled={isComplete}
                    />
                    <div className="flex justify-between text-[11px]">
                      <span className="text-ww-red max-w-[45%]">{crit.lo}</span>
                      <span className="text-ww-green max-w-[45%] text-right">{crit.hi}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={() => setQIdx(Math.max(0, qIdx - 1))} disabled={qIdx === 0}>
                  &larr; Previous
                </Button>
                <div className="flex gap-2">
                  {isComplete ? (
                    <Button variant="ghost" onClick={handleReopen}>Reopen for Editing</Button>
                  ) : qIdx === questions.length - 1 ? (
                    <Button onClick={handleComplete} disabled={isPending}>
                      {isPending ? "Completing..." : "Complete Interview"}
                    </Button>
                  ) : (
                    <Button onClick={() => setQIdx(qIdx + 1)}>Next &rarr;</Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* === COMPLETE STEP === */}
          {isComplete && step === "questions" && qIdx === questions.length - 1 && (
            <Card className="mt-6 border-l-4 border-l-ww-green bg-ww-green/5">
              <p className="text-[13px] text-ww-text-secondary">
                Interview complete. You can review and edit scores above, or navigate to another interviewee using the sidebar.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

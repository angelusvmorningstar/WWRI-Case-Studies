"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TOPIC_LIBRARY, INTRO_SECTIONS } from "@/lib/topic-library";
import {
  updateTopicConfigAction,
  saveQuestionOverrideAction,
  addIntervieweeAction,
  updateIntervieweeAction,
  deleteIntervieweeAction,
  addInterviewerAction,
  updateInterviewerAdjustmentAction,
  deleteInterviewerAction,
  assignInterviewersAction,
  saveGuidanceAction,
} from "@/actions/setupActions";
import { archiveEngagementAction } from "@/actions/engagementActions";

interface SetupTabProps {
  engagementId: string;
  accessKey: string;
  clientName: string;
  topicConfigMap: Record<string, { enabled: boolean; selectedSubtopics: string[] }>;
  questionOverrideMap: Record<string, { customQuestion: string | null; customMins: number | null }>;
  guidanceOverride: { boilerplateOverrides: Record<string, string>; bespokeSection: string } | null;
  interviewees: { id: string; name: string; title: string; category: string; status: string; interviewerNames: string[]; interviewerIds: string[] }[];
  interviewers: { id: string; name: string; adjustment: number; assignedCount: number }[];
}

const CATEGORIES = ["Executive", "Senior Management", "Middle Management"];

export function SetupTab({
  engagementId,
  accessKey,
  clientName,
  topicConfigMap: initialTopicConfig,
  questionOverrideMap: initialQuestionOverrides,
  guidanceOverride: initialGuidance,
  interviewees: initialInterviewees,
  interviewers: initialInterviewers,
}: SetupTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Topic config
  const [topicConfig, setTopicConfig] = useState(initialTopicConfig);
  const [questionOverrides, setQuestionOverrides] = useState(initialQuestionOverrides);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Interviewer
  const [newIvwName, setNewIvwName] = useState("");
  const [ivwAdjustments, setIvwAdjustments] = useState<Record<string, number>>(
    Object.fromEntries(initialInterviewers.map((iv) => [iv.id, iv.adjustment]))
  );

  // Interviewee modal
  const [modal, setModal] = useState<"add" | "edit" | "delete" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", title: "", category: "Executive", interviewerIds: [] as string[] });

  // Guidance
  const [bespokeSection, setBespokeSection] = useState(initialGuidance?.bespokeSection || "");
  const [boilerplateOverrides, setBoilerplateOverrides] = useState<Record<string, string>>(initialGuidance?.boilerplateOverrides || {});

  // --- Interviewer handlers ---
  const addInterviewer = () => {
    const n = newIvwName.trim();
    if (!n) return;
    startTransition(async () => {
      await addInterviewerAction(engagementId, n);
      setNewIvwName("");
      router.refresh();
    });
  };

  const handleAdjChange = (id: string, val: number) => {
    setIvwAdjustments((p) => ({ ...p, [id]: val }));
    startTransition(() => updateInterviewerAdjustmentAction(id, val));
  };

  const handleDeleteInterviewer = (id: string) => {
    startTransition(async () => {
      await deleteInterviewerAction(id);
      router.refresh();
    });
  };

  // --- Interviewee modal handlers ---
  const openAdd = () => { setForm({ name: "", title: "", category: "Executive", interviewerIds: [] }); setEditId(null); setModal("add"); };
  const openEdit = (p: typeof initialInterviewees[0]) => {
    setForm({ name: p.name, title: p.title, category: p.category, interviewerIds: p.interviewerIds });
    setEditId(p.id);
    setModal("edit");
  };
  const openDelete = (id: string) => { setEditId(id); setModal("delete"); };

  const saveInterviewee = () => {
    if (!form.name.trim()) return;
    startTransition(async () => {
      if (editId) {
        await updateIntervieweeAction(editId, form.name.trim(), form.title.trim(), form.category);
        await assignInterviewersAction(editId, form.interviewerIds);
      } else {
        await addIntervieweeAction(engagementId, form.name.trim(), form.title.trim(), form.category);
      }
      setModal(null);
      router.refresh();
    });
  };

  const deleteInterviewee = () => {
    if (!editId) return;
    startTransition(async () => {
      await deleteIntervieweeAction(editId);
      setModal(null);
      router.refresh();
    });
  };

  // --- Topic handlers ---
  const handleToggleTopic = (topicId: string) => {
    const current = topicConfig[topicId];
    const updated = { ...current, enabled: !current.enabled };
    setTopicConfig({ ...topicConfig, [topicId]: updated });
    startTransition(() => updateTopicConfigAction(engagementId, topicId, updated.enabled, updated.selectedSubtopics));
  };

  const handleToggleSubtopic = (topicId: string, subtopicId: string) => {
    const current = topicConfig[topicId];
    const selected = current.selectedSubtopics.includes(subtopicId)
      ? current.selectedSubtopics.filter((s) => s !== subtopicId)
      : current.selectedSubtopics.length < 3
        ? [...current.selectedSubtopics, subtopicId]
        : current.selectedSubtopics;
    const updated = { ...current, selectedSubtopics: selected };
    setTopicConfig({ ...topicConfig, [topicId]: updated });
    startTransition(() => updateTopicConfigAction(engagementId, topicId, updated.enabled, selected));
  };

  const handleQuestionChange = (subtopicId: string, question: string) => {
    setQuestionOverrides({ ...questionOverrides, [subtopicId]: { ...questionOverrides[subtopicId], customQuestion: question } });
    startTransition(() => saveQuestionOverrideAction(engagementId, subtopicId, question || null, questionOverrides[subtopicId]?.customMins ?? null));
  };

  const handleMinsChange = (subtopicId: string, mins: number) => {
    setQuestionOverrides({ ...questionOverrides, [subtopicId]: { ...questionOverrides[subtopicId], customMins: mins } });
    startTransition(() => saveQuestionOverrideAction(engagementId, subtopicId, questionOverrides[subtopicId]?.customQuestion ?? null, mins));
  };

  // --- Guidance ---
  const handleSaveGuidance = () => {
    startTransition(() => saveGuidanceAction(engagementId, boilerplateOverrides, bespokeSection));
  };

  const statusBadge = (status: string) => {
    const colours: Record<string, string> = {
      complete: "bg-ww-green/15 text-ww-green",
      "in-progress": "bg-ww-amber/15 text-ww-amber",
      pending: "bg-ww-text-muted/10 text-ww-text-muted",
    };
    return (
      <span className={`inline-flex items-center gap-[5px] px-3 py-[3px] rounded-full text-[12px] font-semibold ${colours[status] || colours.pending}`}>
        <span className="w-[6px] h-[6px] rounded-full bg-current" />
        {status === "in-progress" ? "In progress" : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div style={{ padding: "32px 36px", maxWidth: 900, margin: "0 auto" }}>

      {/* ── Engagement name + reset ── */}
      <div style={{ marginBottom: 40 }}>
        <div className="flex justify-between items-end mb-2">
          <label className="text-[14px] text-ww-text-secondary font-semibold">Engagement name</label>
          <button
            onClick={() => startTransition(async () => { await archiveEngagementAction(engagementId); router.push("/"); })}
            className="bg-transparent border border-ww-border rounded-md px-3.5 py-1.5 cursor-pointer text-[13px] text-ww-text-muted font-sans flex items-center gap-1.5 hover:border-ww-text-muted transition-colors"
          >
            ↻ Reset engagement
          </button>
        </div>
        <div className="text-[22px] font-bold max-w-[500px] py-3.5 px-4 border border-ww-border rounded-lg bg-ww-surface">
          {clientName}
        </div>
      </div>

      {/* ── Interviewers section ── */}
      <div style={{ marginBottom: 40 }}>
        <div className="mb-3.5">
          <h2 className="text-[20px] font-bold mb-0.5">Interviewers</h2>
          <p className="text-ww-text-secondary text-[13px] m-0">
            Add the consultants conducting interviews. Use the slider to calibrate each interviewer&apos;s scoring tendency.
          </p>
        </div>

        <div className="flex gap-2.5 mb-4">
          <input
            className="flex-1 max-w-[280px] px-4 py-2.5 border border-ww-border rounded-lg text-[14px] outline-none focus:border-ww-teal bg-ww-surface font-sans"
            value={newIvwName}
            onChange={(e) => setNewIvwName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newIvwName.trim()) addInterviewer(); }}
            placeholder="Interviewer name, press Enter"
          />
          <button
            className="h-[44px] px-5 bg-ww-teal text-white border-0 rounded-lg cursor-pointer text-[14px] font-semibold font-sans flex items-center gap-1.5 hover:bg-ww-teal-hover flex-shrink-0"
            onClick={addInterviewer}
          >
            <span className="text-[18px] leading-none">+</span> Add
          </button>
        </div>

        {initialInterviewers.length === 0 ? (
          <div className="ww-card text-center py-8 text-ww-text-muted">
            <p className="m-0 text-[15px]">No interviewers added yet.</p>
            <p className="m-0 mt-1 text-[13px]">Add the consultants who will be conducting interviews.</p>
          </div>
        ) : (
          <div className="ww-card overflow-hidden !p-0">
            {initialInterviewers.map((ivw, i) => {
              const adj = ivwAdjustments[ivw.id] ?? ivw.adjustment;
              const adjCol = adj > 0 ? "text-ww-amber" : adj < 0 ? "text-ww-teal" : "text-ww-text-muted";
              return (
                <div
                  key={ivw.id}
                  className={`grid items-center gap-4 px-5 py-3.5 ${i < initialInterviewers.length - 1 ? "border-b border-ww-border" : ""}`}
                  style={{ gridTemplateColumns: "200px 1fr 100px 40px" }}
                >
                  <div>
                    <div className="font-bold text-[15px]">{ivw.name}</div>
                    <div className="text-[12px] text-ww-text-muted">{ivw.assignedCount} interviewee{ivw.assignedCount !== 1 ? "s" : ""}</div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-[11px] text-ww-text-muted">
                      <span>Score adjustment</span>
                      <span className={`font-bold ${adjCol}`}>{adj === 0 ? "±0%" : (adj > 0 ? "+" : "") + adj + "%"}</span>
                    </div>
                    <input
                      type="range" min="-20" max="20" step="1"
                      value={adj}
                      onChange={(e) => handleAdjChange(ivw.id, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full outline-none cursor-pointer appearance-none bg-ww-border accent-ww-teal"
                    />
                    <div className="flex justify-between text-[10px] text-ww-text-muted mt-0.5">
                      <span>−20%</span><span>0</span><span>+20%</span>
                    </div>
                  </div>
                  {adj !== 0 ? (
                    <button
                      className="h-8 px-3 bg-transparent border border-ww-border rounded-md cursor-pointer text-[12px] text-ww-text-muted font-sans hover:border-ww-text-muted"
                      onClick={() => handleAdjChange(ivw.id, 0)}
                    >Reset</button>
                  ) : <div />}
                  <button
                    onClick={() => handleDeleteInterviewer(ivw.id)}
                    className="bg-transparent border-0 text-ww-text-muted cursor-pointer text-[16px] p-1 hover:text-ww-red"
                  >🗑</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Interviewees section ── */}
      <div style={{ marginBottom: 40 }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-[20px] font-bold mb-0.5">Interviewees</h2>
            <p className="text-ww-text-secondary text-[13px] m-0">
              {initialInterviewees.length} person{initialInterviewees.length !== 1 ? "s" : ""} on this engagement
            </p>
          </div>
          <button
            className="h-[44px] px-5 bg-ww-teal text-white border-0 rounded-lg cursor-pointer text-[14px] font-semibold font-sans flex items-center gap-1.5 hover:bg-ww-teal-hover"
            onClick={openAdd}
          >
            <span className="text-[20px] leading-none">+</span> Add person
          </button>
        </div>

        {initialInterviewees.length === 0 ? (
          <div className="ww-card text-center py-12 text-ww-text-muted">
            <div className="text-[40px] mb-2.5 opacity-30">👥</div>
            <p className="m-0 text-[16px]">No interviewees added yet.</p>
            <p className="m-0 mt-1.5 text-[14px]">Click &quot;Add person&quot; above to get started.</p>
          </div>
        ) : (
          <div className="ww-card overflow-hidden !p-0">
            <div
              className="grid px-5 py-2.5 border-b border-ww-border text-[11px] text-ww-text-muted font-bold tracking-[0.07em] uppercase"
              style={{ gridTemplateColumns: "1.4fr 1fr 170px 116px 80px" }}
            >
              <span>Name</span><span>Title</span><span>Category</span><span>Status</span><span />
            </div>
            {initialInterviewees.map((p, i) => (
              <div
                key={p.id}
                className={`grid items-center px-5 py-3.5 ${i < initialInterviewees.length - 1 ? "border-b border-ww-border" : ""}`}
                style={{ gridTemplateColumns: "1.4fr 1fr 170px 116px 80px" }}
              >
                <div>
                  <div className="font-bold text-[15px]">{p.name}</div>
                  <div className="text-[12px] text-ww-text-muted mt-0.5">
                    {p.interviewerNames.length > 0 ? `Interviewer: ${p.interviewerNames.join(", ")}` : "No interviewer assigned"}
                  </div>
                </div>
                <span className="text-ww-text-secondary text-[14px]">{p.title}</span>
                <span className="text-ww-text-muted text-[13px]">{p.category}</span>
                {statusBadge(p.status)}
                <div className="flex gap-1 justify-end">
                  <button onClick={() => openEdit(p)} className="bg-transparent border-0 text-ww-text-muted cursor-pointer p-2 rounded text-[16px] hover:text-ww-teal">✏</button>
                  <button onClick={() => openDelete(p.id)} className="bg-transparent border-0 text-ww-text-muted cursor-pointer p-2 rounded text-[16px] hover:text-ww-red">🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Topic configuration ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>Topics &amp; questions</h2>
          <p style={{ color: "#555550", fontSize: 13 }}>Expand a topic to select subtopics (up to 3 per topic) and write the interview question for each.</p>
        </div>

        {TOPIC_LIBRARY.map((topic) => {
          const config = topicConfig[topic.id];
          const isExpanded = expandedTopic === topic.id;
          const atCap = (config?.selectedSubtopics.length || 0) >= 3;
          return (
            <div key={topic.id} className="topic-block">
              <div className="topic-block-header" onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}>
                <input
                  type="checkbox" checked={config?.enabled ?? true}
                  onChange={(e) => { e.stopPropagation(); handleToggleTopic(topic.id); }}
                  style={{ width: 18, height: 18, accentColor: "#009898", cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: config?.enabled ? "#1A1A1A" : "#888884" }}>{topic.name}</span>
                {(config?.selectedSubtopics.length || 0) > 0 && (
                  <span style={{ fontSize: 12, color: "#009898", fontWeight: 600, background: "rgba(0,152,152,.1)", borderRadius: 12, padding: "2px 10px", marginRight: 8, whiteSpace: "nowrap" }}>
                    {config?.selectedSubtopics.length} / 3 subtopics
                  </span>
                )}
                <span style={{ color: "#888884", fontSize: 13, display: "inline-block", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
              </div>

              {isExpanded && (
                <div className="topic-block-body">
                  <p style={{ fontSize: 13, color: atCap ? "#C07A00" : "#555550", marginBottom: 12, fontWeight: atCap ? 600 : 400 }}>
                    {atCap ? "Maximum of 3 subtopics selected. Deselect one to choose a different subtopic." : "Select the subtopics to include in this engagement."}
                  </p>

                  {/* Subtopic card grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 10, marginBottom: 24 }}>
                    {topic.subtopics.map((sub) => {
                      const isSel = config?.selectedSubtopics.includes(sub.id);
                      const isCapped = !isSel && atCap;
                      return (
                        <div
                          key={sub.id}
                          className={`subtopic-card${isSel ? " selected" : ""}${isCapped ? " capped" : ""}`}
                          onClick={() => { if (!isCapped) handleToggleSubtopic(topic.id, sub.id); }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: isSel ? "#009898" : "#1A1A1A", lineHeight: 1.3, flex: 1 }}>{sub.name}</span>
                            {isSel && <span style={{ color: "#009898", fontSize: 15, marginLeft: 8, flexShrink: 0 }}>✓</span>}
                          </div>
                          <p style={{ fontSize: 12, color: "#555550", lineHeight: 1.4, margin: 0 }}>
                            {sub.purpose.length > 85 ? sub.purpose.slice(0, 85) + "…" : sub.purpose}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected subtopic question editors */}
                  {(config?.selectedSubtopics.length || 0) > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: "#888884", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 14 }}>
                        Question text for each selected subtopic
                      </div>
                      {config?.selectedSubtopics.map((stId) => {
                        const sub = topic.subtopics.find((s) => s.id === stId);
                        if (!sub) return null;
                        const override = questionOverrides[stId];
                        return (
                          <div key={stId} style={{ background: "#FFFFFF", border: "1.5px solid #009898", borderRadius: 8, padding: "18px 20px", marginBottom: 14 }}>
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontWeight: 700, fontSize: 15, color: "#009898", marginBottom: 6 }}>{sub.name}</div>
                              <div style={{ fontSize: 13, color: "#555550", lineHeight: 1.5, padding: "8px 12px", background: "rgba(0,152,152,.06)", borderRadius: 6, borderLeft: "3px solid #009898" }}>
                                <span style={{ fontWeight: 700, color: "#009898" }}>Purpose: </span>{sub.purpose}
                              </div>
                            </div>
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ fontSize: 11, color: "#888884", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                                Example phrasings — click to use
                              </p>
                              {sub.examples.map((ex, i) => (
                                <button key={i} className="example-row" onClick={() => handleQuestionChange(stId, ex)}>
                                  &ldquo;{ex}&rdquo;
                                </button>
                              ))}
                            </div>
                            <div>
                              <p style={{ fontSize: 11, color: "#888884", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                                Your question
                              </p>
                              <textarea
                                value={override?.customQuestion ?? sub.examples[0]}
                                onChange={(e) => handleQuestionChange(stId, e.target.value)}
                                placeholder="Write or edit the question to be asked in the interview..."
                                style={{ background: "#FFFFFF", border: "1.5px solid #AAAAA5", borderRadius: 6, color: "#1A1A1A", fontSize: 14, padding: "10px 12px", fontFamily: "inherit", width: "100%", outline: "none", resize: "vertical", lineHeight: 1.6, minHeight: 72 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Interviewer guidance ── */}
      <div style={{ marginBottom: 40 }}>
        <h2 className="text-[20px] font-bold mb-0.5">Interviewer Guidance</h2>
        <p className="text-ww-text-secondary text-[13px] m-0 mb-4">
          Customise the introductory guidance shown to the interviewer before each interview.
        </p>

        {INTRO_SECTIONS.map((section) => (
          <div key={section.label} className="ww-card mb-3">
            <h3 className="text-[15px] font-bold mb-1">{section.label}</h3>
            <p className="text-[12px] text-ww-text-muted whitespace-pre-line mb-2">{section.content}</p>
            <textarea
              value={boilerplateOverrides[section.label] || ""}
              onChange={(e) => setBoilerplateOverrides({ ...boilerplateOverrides, [section.label]: e.target.value })}
              rows={2} placeholder="Override this section (leave empty to use default)"
              className="w-full px-3 py-2 border border-ww-border rounded-md text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y font-sans" />
          </div>
        ))}

        <div className="ww-card mb-3">
          <h3 className="text-[15px] font-bold mb-1">Bespoke Engagement Context</h3>
          <p className="text-[12px] text-ww-text-muted mb-2">
            Add engagement-specific context — goals, client background, areas of focus.
          </p>
          <textarea
            value={bespokeSection}
            onChange={(e) => setBespokeSection(e.target.value)}
            rows={4} placeholder="e.g. This engagement focuses on post-acquisition integration..."
            className="w-full px-3 py-2 border border-ww-border rounded-md text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y font-sans" />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveGuidance} disabled={isPending}
            className="h-[44px] px-5 bg-ww-teal text-white border-0 rounded-lg cursor-pointer text-[14px] font-semibold font-sans hover:bg-ww-teal-hover disabled:opacity-50">
            {isPending ? "Saving..." : "Save Guidance"}
          </button>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={() => setModal(null)}>
          <div className="bg-ww-surface rounded-xl p-6 w-[480px] max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-5">{editId ? "Edit interviewee" : "Add interviewee"}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[13px] text-ww-text-secondary font-semibold block mb-1.5">Full name *</label>
                <input className="w-full px-4 py-2.5 border border-ww-border rounded-lg text-[14px] outline-none focus:border-ww-teal bg-ww-surface font-sans"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sandra Veltman" autoFocus />
              </div>
              <div>
                <label className="text-[13px] text-ww-text-secondary font-semibold block mb-1.5">Job title</label>
                <input className="w-full px-4 py-2.5 border border-ww-border rounded-lg text-[14px] outline-none focus:border-ww-teal bg-ww-surface font-sans"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chief Marketing Officer" />
              </div>
              <div>
                <label className="text-[13px] text-ww-text-secondary font-semibold block mb-1.5">Category</label>
                <select className="w-full px-4 py-2.5 border border-ww-border rounded-lg text-[14px] outline-none focus:border-ww-teal bg-ww-surface font-sans"
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[13px] text-ww-text-secondary font-semibold block mb-1.5">Interviewers (select up to 3)</label>
                {initialInterviewers.length === 0 ? (
                  <p className="text-[13px] text-ww-text-muted italic">No interviewers defined yet. Add them in the Interviewers section above.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {initialInterviewers.map((ivw) => {
                      const checked = form.interviewerIds.includes(ivw.id);
                      const atCap = !checked && form.interviewerIds.length >= 3;
                      return (
                        <label key={ivw.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md border-[1.5px] cursor-pointer select-none transition-colors ${
                            checked ? "border-ww-teal bg-ww-teal/5" : "border-ww-border bg-ww-surface"
                          } ${atCap ? "opacity-40 cursor-not-allowed" : ""}`}>
                          <input type="checkbox" checked={checked} disabled={atCap}
                            onChange={() => {
                              if (checked) setForm({ ...form, interviewerIds: form.interviewerIds.filter((x) => x !== ivw.id) });
                              else if (!atCap) setForm({ ...form, interviewerIds: [...form.interviewerIds, ivw.id] });
                            }}
                            className="w-4 h-4 accent-ww-teal flex-shrink-0" />
                          <span className={`text-[14px] ${checked ? "font-semibold text-ww-teal" : ""}`}>{ivw.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex gap-2.5 justify-end mt-2">
                <button onClick={() => setModal(null)} className="h-10 px-4 bg-transparent border border-ww-border rounded-lg cursor-pointer text-[13px] font-semibold font-sans hover:bg-ww-bg">Cancel</button>
                <button onClick={saveInterviewee} disabled={!form.name.trim() || isPending}
                  className="h-10 px-5 bg-ww-teal text-white border-0 rounded-lg cursor-pointer text-[13px] font-semibold font-sans hover:bg-ww-teal-hover disabled:opacity-40">
                  {editId ? "Save changes" : "Add interviewee"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {modal === "delete" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]" onClick={() => setModal(null)}>
          <div className="bg-ww-surface rounded-xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-bold mb-3">Remove interviewee</h2>
            <p className="text-ww-text-secondary text-[15px] mb-2">
              This will remove <strong className="text-ww-text">{initialInterviewees.find((p) => p.id === editId)?.name}</strong> and all their interview data.
            </p>
            <p className="text-ww-text-muted text-[14px] mb-7">This cannot be undone.</p>
            <div className="flex gap-2.5 justify-end">
              <button onClick={() => setModal(null)} className="h-10 px-4 bg-transparent border border-ww-border rounded-lg cursor-pointer text-[13px] font-semibold font-sans hover:bg-ww-bg">Cancel</button>
              <button onClick={deleteInterviewee}
                className="h-10 px-5 bg-ww-red text-white border-0 rounded-lg cursor-pointer text-[13px] font-semibold font-sans hover:bg-ww-red-hover">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { TOPIC_LIBRARY, INTRO_SECTIONS } from "@/lib/topic-library";
import Link from "next/link";
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

interface SetupClientProps {
  engagementId: string;
  accessKey: string;
  topicConfigMap: Record<string, { enabled: boolean; selectedSubtopics: string[] }>;
  questionOverrideMap: Record<string, { customQuestion: string | null; customMins: number | null }>;
  guidanceOverride: { boilerplateOverrides: Record<string, string>; bespokeSection: string } | null;
  interviewees: { id: string; name: string; title: string; category: string; interviewerIds: string[] }[];
  interviewers: { id: string; name: string; adjustment: number }[];
}

const CATEGORIES = ["Executive", "Senior Management", "Middle Management"];

export function SetupClient({
  engagementId,
  accessKey,
  topicConfigMap: initialTopicConfig,
  questionOverrideMap: initialQuestionOverrides,
  guidanceOverride: initialGuidance,
  interviewees: initialInterviewees,
  interviewers: initialInterviewers,
}: SetupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"topics" | "interviewees" | "interviewers" | "guidance">("topics");
  const [topicConfig, setTopicConfig] = useState(initialTopicConfig);
  const [questionOverrides, setQuestionOverrides] = useState(initialQuestionOverrides);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Interviewee form
  const [newName, setNewName] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Senior Management");

  // Interviewer form
  const [newInterviewerName, setNewInterviewerName] = useState("");

  // Guidance
  const [bespokeSection, setBespokeSection] = useState(initialGuidance?.bespokeSection || "");
  const [boilerplateOverrides, setBoilerplateOverrides] = useState<Record<string, string>>(
    initialGuidance?.boilerplateOverrides || {}
  );

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

  // --- Interviewee handlers ---
  const handleAddInterviewee = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      await addIntervieweeAction(engagementId, newName.trim(), newTitle.trim(), newCategory);
      setNewName("");
      setNewTitle("");
      setNewCategory("Senior Management");
      router.refresh();
    });
  };

  const handleDeleteInterviewee = (id: string) => {
    startTransition(async () => {
      await deleteIntervieweeAction(id);
      router.refresh();
    });
  };

  // --- Interviewer handlers ---
  const handleAddInterviewer = () => {
    if (!newInterviewerName.trim()) return;
    startTransition(async () => {
      await addInterviewerAction(engagementId, newInterviewerName.trim());
      setNewInterviewerName("");
      router.refresh();
    });
  };

  const handleAdjustmentChange = (id: string, adjustment: number) => {
    startTransition(() => updateInterviewerAdjustmentAction(id, adjustment));
  };

  const handleDeleteInterviewer = (id: string) => {
    startTransition(async () => {
      await deleteInterviewerAction(id);
      router.refresh();
    });
  };

  const handleAssignInterviewer = (intervieweeId: string, interviewerId: string, checked: boolean) => {
    const current = initialInterviewees.find((i) => i.id === intervieweeId)?.interviewerIds || [];
    const updated = checked ? [...current, interviewerId] : current.filter((id) => id !== interviewerId);
    startTransition(() => assignInterviewersAction(intervieweeId, updated));
  };

  // --- Guidance handlers ---
  const handleSaveGuidance = () => {
    startTransition(() => saveGuidanceAction(engagementId, boilerplateOverrides, bespokeSection));
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/engagement/${accessKey}`} className="text-sm text-ww-teal no-underline hover:underline">
          &larr; Dashboard
        </Link>
        <h1 className="text-lg font-semibold text-ww-text">Setup</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ww-border mb-6">
        {(["topics", "interviewees", "interviewers", "guidance"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer capitalize ${
              activeTab === tab
                ? "text-ww-teal border-ww-teal"
                : "text-ww-text-muted border-transparent hover:text-ww-text-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* === TOPICS TAB === */}
      {activeTab === "topics" && (
        <div className="flex flex-col gap-4">
          {TOPIC_LIBRARY.map((topic) => {
            const config = topicConfig[topic.id];
            const isExpanded = expandedTopic === topic.id;
            return (
              <Card key={topic.id} className={!config?.enabled ? "opacity-50" : ""}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config?.enabled ?? true}
                        onChange={() => handleToggleTopic(topic.id)}
                      />
                      <span className="text-md font-semibold text-ww-text">{topic.name}</span>
                    </label>
                    <Badge variant="muted">{config?.selectedSubtopics.length || 0}/3 subtopics</Badge>
                  </div>
                  <button
                    onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                    className="text-sm text-ww-teal cursor-pointer hover:underline"
                  >
                    {isExpanded ? "Collapse" : "Expand"}
                  </button>
                </div>

                {isExpanded && config?.enabled && (
                  <div className="flex flex-col gap-3 mt-4">
                    {topic.subtopics.map((sub) => {
                      const isSelected = config.selectedSubtopics.includes(sub.id);
                      const override = questionOverrides[sub.id];
                      return (
                        <div key={sub.id} className={`border border-ww-border rounded-md p-3 ${isSelected ? "border-ww-teal/30 bg-ww-teal/5" : ""}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSubtopic(topic.id, sub.id)}
                                disabled={!isSelected && config.selectedSubtopics.length >= 3}
                              />
                              <span className="text-[13px] font-semibold text-ww-text">{sub.name}</span>
                            </label>
                            {isSelected && (
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={override?.customMins ?? sub.defaultMins}
                                onChange={(e) => handleMinsChange(sub.id, Number(e.target.value))}
                                className="w-14 px-2 py-1 border border-ww-border rounded text-[12px] font-mono text-right outline-none focus:border-ww-teal"
                              />
                            )}
                            {isSelected && <span className="text-[11px] text-ww-text-muted">min</span>}
                          </div>
                          {isSelected && (
                            <>
                              <p className="text-[11px] text-ww-text-muted mb-2">{sub.purpose}</p>
                              <textarea
                                value={override?.customQuestion ?? sub.examples[0]}
                                onChange={(e) => handleQuestionChange(sub.id, e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y"
                                placeholder={sub.examples[0]}
                              />
                              {sub.examples.length > 1 && (
                                <details className="mt-1">
                                  <summary className="text-[11px] text-ww-teal cursor-pointer">More example questions</summary>
                                  <ul className="mt-1 text-[11px] text-ww-text-muted list-disc pl-4">
                                    {sub.examples.slice(1).map((ex, i) => (
                                      <li key={i} className="mb-1">{ex}</li>
                                    ))}
                                  </ul>
                                </details>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* === INTERVIEWEES TAB === */}
      {activeTab === "interviewees" && (
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Add Interviewee</h2>
            <div className="flex items-end gap-3">
              <Input label="Name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Claire Beaumont" />
              <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Chief Operating Officer" />
              <Select label="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Button onClick={handleAddInterviewee} disabled={!newName.trim() || isPending}>Add</Button>
            </div>
          </Card>

          {initialInterviewees.length > 0 && (
            <Card>
              <h2 className="text-md font-semibold text-ww-text mb-4">Interviewees ({initialInterviewees.length})</h2>
              <div className="flex flex-col gap-2">
                {initialInterviewees.map((person) => (
                  <div key={person.id} className="flex items-center justify-between border border-ww-border rounded-md p-3">
                    <div>
                      <span className="text-[13px] font-semibold text-ww-text">{person.name}</span>
                      {person.title && <span className="text-[12px] text-ww-text-muted ml-2">{person.title}</span>}
                      <Badge variant="muted" className="ml-2">{person.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {initialInterviewers.map((iv) => (
                        <label key={iv.id} className="flex items-center gap-1 text-[11px] text-ww-text-secondary cursor-pointer">
                          <input
                            type="checkbox"
                            checked={person.interviewerIds.includes(iv.id)}
                            onChange={(e) => handleAssignInterviewer(person.id, iv.id, e.target.checked)}
                          />
                          {iv.name}
                        </label>
                      ))}
                      <Button variant="danger" size="sm" onClick={() => handleDeleteInterviewee(person.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* === INTERVIEWERS TAB === */}
      {activeTab === "interviewers" && (
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-4">Add Interviewer</h2>
            <div className="flex items-end gap-3">
              <Input label="Name" value={newInterviewerName} onChange={(e) => setNewInterviewerName(e.target.value)} placeholder="e.g. Adam" />
              <Button onClick={handleAddInterviewer} disabled={!newInterviewerName.trim() || isPending}>Add</Button>
            </div>
          </Card>

          {initialInterviewers.length > 0 && (
            <Card>
              <h2 className="text-md font-semibold text-ww-text mb-4">Interviewers ({initialInterviewers.length})</h2>
              <div className="flex flex-col gap-3">
                {initialInterviewers.map((iv) => (
                  <div key={iv.id} className="flex items-center justify-between border border-ww-border rounded-md p-3">
                    <div className="flex items-center gap-4">
                      <span className="text-[13px] font-semibold text-ww-text w-24">{iv.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ww-text-muted">Calibration:</span>
                        <input
                          type="range"
                          min="-100"
                          max="100"
                          value={iv.adjustment}
                          onChange={(e) => handleAdjustmentChange(iv.id, Number(e.target.value))}
                          className="w-32"
                        />
                        <span className="text-[12px] font-mono text-ww-text w-10 text-right">{iv.adjustment > 0 ? "+" : ""}{iv.adjustment}</span>
                      </div>
                    </div>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteInterviewer(iv.id)}>Remove</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* === GUIDANCE TAB === */}
      {activeTab === "guidance" && (
        <div className="flex flex-col gap-4">
          {INTRO_SECTIONS.map((section) => (
            <Card key={section.label}>
              <h2 className="text-md font-semibold text-ww-text mb-2">{section.label}</h2>
              <p className="text-[12px] text-ww-text-muted mb-3 whitespace-pre-line">{section.content}</p>
              {"emphasis" in section && section.emphasis && (
                <p className="text-[12px] font-semibold text-ww-text mb-3">{section.emphasis}</p>
              )}
              <textarea
                value={boilerplateOverrides[section.label] || ""}
                onChange={(e) => setBoilerplateOverrides({ ...boilerplateOverrides, [section.label]: e.target.value })}
                rows={2}
                placeholder="Override this section (leave empty to use default)"
                className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y"
              />
            </Card>
          ))}

          <Card>
            <h2 className="text-md font-semibold text-ww-text mb-2">Bespoke Engagement Context</h2>
            <p className="text-[12px] text-ww-text-muted mb-3">
              Add engagement-specific context that the interviewer should know — goals, client background, areas of focus.
            </p>
            <textarea
              value={bespokeSection}
              onChange={(e) => setBespokeSection(e.target.value)}
              rows={5}
              placeholder="e.g. This engagement focuses on post-acquisition integration. The CEO has communicated a vision of becoming market leader within 3 years..."
              className="w-full px-3 py-2 border border-ww-border rounded-[6px] text-[13px] text-ww-text bg-ww-surface outline-none focus:border-ww-teal resize-y"
            />
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGuidance} disabled={isPending}>
              {isPending ? "Saving..." : "Save Guidance"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

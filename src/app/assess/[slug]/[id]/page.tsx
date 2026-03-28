"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  MSA_DIMENSIONS,
  MSA_INTRO_TEXT,
  type ScenarioOption,
  type QuadrantTag,
} from "@/lib/manager-questions";
import { calculateQuadrant, type ResponseScore } from "@/lib/quadrant-scoring";

// Deterministically shuffle an array using Fisher-Yates with a seed
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  // Simple hash from seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = result.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface ScenarioAnswer {
  scenarioId: number;
  dimension: string;
  questionIndex: number;
  situationText: string;
  quadrantTag: QuadrantTag;
  a_score: number;
  c_score: number;
  displayOrder: number[]; // indices of options as shown
}

// Assessment flow steps
type Step =
  | { type: "intro" }
  | { type: "screening" }
  | { type: "qualifying" } // 1:1 frequency — shown before Structured Feedback
  | { type: "scenario"; dimensionIndex: number; scenarioIndex: number };

export default function ManagerAssessmentSurvey() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<ScenarioAnswer[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Screening data
  const [directReports, setDirectReports] = useState("");
  const [teamType, setTeamType] = useState("");

  // Qualifying question
  const [oneOnOneFrequency, setOneOnOneFrequency] = useState("");

  // Build the step sequence
  const steps = useMemo<Step[]>(() => {
    const s: Step[] = [{ type: "intro" }, { type: "screening" }];
    for (let di = 0; di < MSA_DIMENSIONS.length; di++) {
      // Insert qualifying question before Structured Feedback (dimension index 1)
      if (di === 1) {
        s.push({ type: "qualifying" });
      }
      for (let si = 0; si < MSA_DIMENSIONS[di].scenarios.length; si++) {
        s.push({ type: "scenario", dimensionIndex: di, scenarioIndex: si });
      }
    }
    return s;
  }, []);

  const currentStep = steps[stepIndex];
  const totalScenarios = 20;
  const answeredScenarios = answers.length;
  const progress = Math.round((answeredScenarios / totalScenarios) * 100);

  // Generate randomized option orders per scenario (stable for this session)
  const optionOrders = useMemo(() => {
    const orders: Record<number, number[]> = {};
    for (const dim of MSA_DIMENSIONS) {
      for (const scenario of dim.scenarios) {
        const indices = [0, 1, 2, 3];
        const shuffled = seededShuffle(indices, `${sessionId}-${scenario.id}`);
        orders[scenario.id] = shuffled;
      }
    }
    return orders;
  }, [sessionId]);

  // Verify session exists
  useEffect(() => {
    async function verify() {
      const { data } = await supabase
        .from("manager_sessions")
        .select("id, status")
        .eq("id", sessionId)
        .single();

      if (!data) {
        router.push(`/assess/${slug}`);
        return;
      }

      if (data.status === "completed") {
        router.push(`/assess/${slug}/${sessionId}/result`);
        return;
      }

      setLoading(false);
    }
    verify();
  }, [sessionId, slug, router]);

  const selectOption = useCallback(
    (
      scenarioId: number,
      dimension: string,
      questionIndex: number,
      situationText: string,
      option: ScenarioOption,
      displayOrder: number[]
    ) => {
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.scenarioId !== scenarioId);
        return [
          ...filtered,
          {
            scenarioId,
            dimension,
            questionIndex,
            situationText,
            quadrantTag: option.quadrant,
            a_score: option.a_score,
            c_score: option.c_score,
            displayOrder,
          },
        ];
      });
    },
    []
  );

  function canAdvance(): boolean {
    if (!currentStep) return false;
    if (currentStep.type === "intro") return true;
    if (currentStep.type === "screening")
      return directReports !== "" && teamType !== "";
    if (currentStep.type === "qualifying") return oneOnOneFrequency !== "";
    if (currentStep.type === "scenario") {
      const dim = MSA_DIMENSIONS[currentStep.dimensionIndex];
      const scenario = dim.scenarios[currentStep.scenarioIndex];
      return answers.some((a) => a.scenarioId === scenario.id);
    }
    return false;
  }

  function handleNext() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);

    try {
      // Save all responses
      const responseRows = answers.map((a) => ({
        session_id: sessionId,
        dimension: a.dimension,
        question_index: a.questionIndex,
        question_text: a.situationText.split("\n")[0], // First line as summary
        quadrant_tag: a.quadrantTag,
        a_score: a.a_score,
        c_score: a.c_score,
        display_order: a.displayOrder,
      }));

      const { error: responseError } = await supabase
        .from("manager_responses")
        .insert(responseRows);

      if (responseError) throw responseError;

      // Calculate quadrant scores
      const responseData: ResponseScore[] = answers.map((a) => ({
        a_score: a.a_score,
        c_score: a.c_score,
        dimension: a.dimension,
      }));
      const result = calculateQuadrant(responseData);

      // Update session with scores, screening data, and mark complete
      const { error: updateError } = await supabase
        .from("manager_sessions")
        .update({
          status: "completed",
          quadrant: result.quadrant,
          x_score: result.cScore, // x = Support & Connection
          y_score: result.aScore, // y = Accountability & Structure
          direct_reports: parseInt(directReports) || null,
          team_type: teamType || null,
          one_on_one_frequency: oneOnOneFrequency || null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      router.push(`/assess/${slug}/${sessionId}/result`);
    } catch (err) {
      console.error("Error submitting assessment:", err);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-navy/40">Loading assessment...</p>
      </main>
    );
  }

  if (submitting) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy">
            Building Your Report
          </h2>
          <p className="mt-2 text-navy/60">
            This usually takes 30 to 60 seconds...
          </p>
        </div>
      </main>
    );
  }

  // Get the current dimension name for scenarios
  const currentDimensionName =
    currentStep.type === "scenario"
      ? MSA_DIMENSIONS[currentStep.dimensionIndex].name
      : null;

  // Is this the first scenario of a new dimension?
  const isNewDimension =
    currentStep.type === "scenario" && currentStep.scenarioIndex === 0;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Progress Bar — hidden on intro */}
        {currentStep.type !== "intro" && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-navy/50 mb-2">
              <span>
                {answeredScenarios} of {totalScenarios} scenarios
              </span>
              <span>{progress}% complete</span>
            </div>
            <div className="w-full bg-navy/10 rounded-full h-2">
              <div
                className="bg-blue h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* === INTRO STEP === */}
        {currentStep.type === "intro" && (
          <div>
            <h1 className="text-3xl font-bold text-navy mb-6">
              Manager Skills Assessment
            </h1>
            <div className="bg-white rounded-lg border border-navy/10 p-8">
              {MSA_INTRO_TEXT.split("\n\n").map((para, i) => (
                <p key={i} className="text-navy/70 leading-relaxed mb-4 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* === SCREENING STEP === */}
        {currentStep.type === "screening" && (
          <div>
            <h1 className="text-2xl font-bold text-navy mb-2">
              Before You Begin
            </h1>
            <p className="text-navy/60 mb-8">
              These questions help us contextualize your report. They do not
              affect your assessment score.
            </p>

            <div className="space-y-8">
              {/* Direct reports */}
              <div className="bg-white rounded-lg border border-navy/10 p-6">
                <p className="text-navy font-medium mb-4">
                  How many direct reports do you currently manage?
                </p>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={directReports}
                  onChange={(e) => setDirectReports(e.target.value)}
                  className="w-32 px-4 py-3 rounded-md border border-navy/20 bg-white text-navy text-lg focus:outline-none focus:ring-2 focus:ring-blue"
                  placeholder="e.g. 8"
                />
              </div>

              {/* Team type */}
              <div className="bg-white rounded-lg border border-navy/10 p-6">
                <p className="text-navy font-medium mb-4">
                  Is your team primarily in-person, hybrid, or remote?
                </p>
                <div className="flex gap-3">
                  {[
                    { value: "in_person", label: "In-Person" },
                    { value: "hybrid", label: "Hybrid" },
                    { value: "remote", label: "Remote" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTeamType(opt.value)}
                      className={`px-5 py-3 rounded-md border text-sm font-medium transition-colors ${
                        teamType === opt.value
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-navy border-navy/20 hover:border-navy/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === QUALIFYING STEP (1:1 frequency) === */}
        {currentStep.type === "qualifying" && (
          <div>
            <h1 className="text-2xl font-bold text-navy mb-2">
              One More Question
            </h1>
            <p className="text-navy/60 mb-8">
              This response is used to contextualize your report. It does not
              affect your assessment score.
            </p>

            <div className="bg-white rounded-lg border border-navy/10 p-6">
              <p className="text-navy font-medium mb-4">
                How frequently do you currently hold scheduled one on one
                meetings with your individual direct reports?
              </p>
              <div className="space-y-3">
                {[
                  { value: "weekly_biweekly", label: "Weekly or bi-weekly" },
                  { value: "monthly", label: "Monthly" },
                  {
                    value: "occasional",
                    label: "Occasionally but not on a set schedule",
                  },
                  {
                    value: "never",
                    label: "I do not currently hold regular one on one meetings",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setOneOnOneFrequency(opt.value)}
                    className={`w-full text-left px-5 py-3 rounded-md border text-sm font-medium transition-colors ${
                      oneOnOneFrequency === opt.value
                        ? "bg-navy text-white border-navy"
                        : "bg-white text-navy border-navy/20 hover:border-navy/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === SCENARIO STEP === */}
        {currentStep.type === "scenario" && (() => {
          const dim = MSA_DIMENSIONS[currentStep.dimensionIndex];
          const scenario = dim.scenarios[currentStep.scenarioIndex];
          const order = optionOrders[scenario.id];
          const selectedAnswer = answers.find(
            (a) => a.scenarioId === scenario.id
          );

          return (
            <div>
              {/* Dimension header — only show at first scenario of each dimension */}
              {isNewDimension && (
                <div className="mb-6">
                  <div className="inline-block px-3 py-1 bg-blue/10 rounded-full text-xs font-semibold text-blue mb-2">
                    {currentDimensionName}
                  </div>
                </div>
              )}

              {/* Scenario */}
              <div className="bg-white rounded-lg border border-navy/10 p-6 mb-6">
                <p className="text-xs font-semibold text-navy/40 uppercase tracking-wide mb-3">
                  Scenario {scenario.id} of 20
                </p>
                {scenario.situation.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    className={`text-navy leading-relaxed ${
                      i === 0 ? "font-medium mb-3" : "text-navy/60 italic mb-0"
                    }`}
                  >
                    {para}
                  </p>
                ))}
              </div>

              {/* Response options (randomized order) */}
              <div className="space-y-3">
                {order.map((optIdx) => {
                  const option = scenario.options[optIdx];
                  const isSelected =
                    selectedAnswer?.quadrantTag === option.quadrant;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() =>
                        selectOption(
                          scenario.id,
                          dim.key,
                          currentStep.scenarioIndex,
                          scenario.situation,
                          option,
                          order
                        )
                      }
                      className={`w-full text-left px-5 py-4 rounded-lg border text-sm leading-relaxed transition-all ${
                        isSelected
                          ? "bg-navy text-white border-navy shadow-md"
                          : "bg-white text-navy/80 border-navy/15 hover:border-navy/30 hover:bg-navy/[0.02]"
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Navigation */}
        <div className="flex justify-between mt-10 pb-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="px-6 py-3 text-navy/60 font-medium hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance()}
            className="px-8 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stepIndex === steps.length - 1
              ? "Submit Assessment"
              : currentStep.type === "intro"
              ? "Begin"
              : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

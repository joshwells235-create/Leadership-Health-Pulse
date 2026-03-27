"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ELITE5_DIMENSIONS } from "@/lib/manager-questions";
import {
  calculateQuadrant,
  type ResponseData,
} from "@/lib/quadrant-scoring";

// Rating labels
const RATING_LABELS = [
  "",
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

function RatingButton({
  value,
  selected,
  onClick,
}: {
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-3 rounded-md border transition-colors min-w-[60px] ${
        selected
          ? "bg-navy text-white border-navy"
          : "bg-white text-navy border-navy/20 hover:border-navy/40"
      }`}
    >
      <span className="text-lg font-bold">{value}</span>
      <span
        className={`text-[10px] leading-tight text-center ${
          selected ? "text-white/80" : "text-navy/50"
        }`}
      >
        {RATING_LABELS[value]}
      </span>
    </button>
  );
}

interface Answer {
  dimension: string;
  questionIndex: number;
  questionText: string;
  rating: number;
  axis: "accountability" | "supportiveness";
  reverse?: boolean;
}

export default function ManagerAssessmentSurvey() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const sessionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);

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

  const currentDimension = ELITE5_DIMENSIONS[currentDimensionIndex];
  const totalDimensions = ELITE5_DIMENSIONS.length;
  const totalQuestions = ELITE5_DIMENSIONS.reduce(
    (sum, d) => sum + d.questions.length,
    0
  );
  const answeredQuestions = answers.length;
  const progress = Math.round((answeredQuestions / totalQuestions) * 100);

  // Get answers for current dimension
  const currentAnswers = answers.filter(
    (a) => a.dimension === currentDimension?.key
  );

  const allCurrentQuestionsAnswered =
    currentDimension &&
    currentDimension.questions.length === currentAnswers.length;

  const setRating = useCallback(
    (questionIndex: number, rating: number) => {
      const question = currentDimension.questions[questionIndex];
      setAnswers((prev) => {
        const filtered = prev.filter(
          (a) =>
            !(
              a.dimension === currentDimension.key &&
              a.questionIndex === questionIndex
            )
        );
        return [
          ...filtered,
          {
            dimension: currentDimension.key,
            questionIndex,
            questionText: question.text,
            rating,
            axis: question.axis,
            ...(question.reverse ? { reverse: true } : {}),
          },
        ];
      });
    },
    [currentDimension]
  );

  async function handleNext() {
    if (currentDimensionIndex < totalDimensions - 1) {
      setCurrentDimensionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Submit
      await handleSubmit();
    }
  }

  function handleBack() {
    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);

    try {
      // Save all responses to database
      const responseRows = answers.map((a) => ({
        session_id: sessionId,
        dimension: a.dimension,
        question_index: a.questionIndex,
        question_text: a.questionText,
        rating: a.rating,
        axis: a.axis,
      }));

      const { error: responseError } = await supabase
        .from("manager_responses")
        .insert(responseRows);

      if (responseError) throw responseError;

      // Calculate quadrant scores
      const responseData: ResponseData[] = answers.map((a) => ({
        rating: a.rating,
        axis: a.axis,
        ...(a.reverse ? { reverse: true } : {}),
      }));
      const result = calculateQuadrant(responseData);

      // Update session with scores and mark complete
      const { error: updateError } = await supabase
        .from("manager_sessions")
        .update({
          status: "completed",
          quadrant: result.quadrant,
          x_score: result.xScore,
          y_score: result.yScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (updateError) throw updateError;

      // Navigate to result page (which triggers report generation)
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
            Generating Your Report
          </h2>
          <p className="mt-2 text-navy/60">
            This takes about 30 seconds...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-navy/50 mb-2">
            <span>
              {currentDimensionIndex + 1} of {totalDimensions} sections
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

        {/* Dimension Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy">
            {currentDimension.name}
          </h1>
          <p className="mt-2 text-navy/60">{currentDimension.description}</p>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {currentDimension.questions.map((question, qIndex) => {
            const answer = currentAnswers.find(
              (a) => a.questionIndex === qIndex
            );
            return (
              <div
                key={`${currentDimension.key}-${qIndex}`}
                className="bg-white rounded-lg border border-navy/10 p-6"
              >
                <p className="text-navy font-medium mb-4">{question.text}</p>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <RatingButton
                      key={value}
                      value={value}
                      selected={answer?.rating === value}
                      onClick={() => setRating(qIndex, value)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-10 pb-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentDimensionIndex === 0}
            className="px-6 py-3 text-navy/60 font-medium hover:text-navy disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!allCurrentQuestionsAnswered}
            className="px-8 py-3 bg-navy text-white font-semibold rounded-md hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {currentDimensionIndex === totalDimensions - 1
              ? "Submit Assessment"
              : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getTiersForPath,
  DIMENSIONS_ORDER,
  CAPSTONE_QUESTIONS,
  type TierData,
  type Dimension,
} from "@/lib/questions";

// ============================================
// Types for tracking survey state
// ============================================
type SurveyPhase = "loading" | "tier_intro" | "questions" | "capstone" | "submitting";

interface RatingAnswer {
  tier: string;
  dimension: Dimension;
  questionIndex: number;
  questionText: string;
  rating: number;
}

interface OpenAnswer {
  tier: string;
  dimension: Dimension;
  promptText: string;
  response: string;
}

// ============================================
// Rating Button Component
// ============================================
function RatingButton({
  value,
  selected,
  onClick,
}: {
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  const labels = ["", "Strongly Disagree", "Disagree", "Neutral / Mixed", "Agree", "Strongly Agree"];

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
        {labels[value]}
      </span>
    </button>
  );
}

// ============================================
// Progress Bar Component
// ============================================
function ProgressBar({
  currentTierIndex,
  totalTiers,
  currentDimensionIndex,
  totalDimensions,
  phase,
}: {
  currentTierIndex: number;
  totalTiers: number;
  currentDimensionIndex: number;
  totalDimensions: number;
  phase: SurveyPhase;
}) {
  let progress = 0;
  const tierWeight = 100 / (totalTiers + 1); // +1 for capstone

  if (phase === "capstone") {
    progress = totalTiers * tierWeight;
  } else if (phase === "questions") {
    const dimensionWeight = tierWeight / totalDimensions;
    progress =
      currentTierIndex * tierWeight + currentDimensionIndex * dimensionWeight;
  } else if (phase === "tier_intro") {
    progress = currentTierIndex * tierWeight;
  }

  return (
    <div className="w-full bg-navy/10 rounded-full h-2">
      <div
        className="bg-blue h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

// ============================================
// Main Survey Page
// ============================================
export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  // Survey metadata
  const [surveyPath, setSurveyPath] = useState<"two_tier" | "three_tier">("three_tier");
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [phase, setPhase] = useState<SurveyPhase>("loading");

  // Navigation state
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);

  // Answer state
  const [ratings, setRatings] = useState<RatingAnswer[]>([]);
  const [openAnswers, setOpenAnswers] = useState<OpenAnswer[]>([]);
  const [capstoneOne, setCapstoneOne] = useState("");
  const [capstoneTwo, setCapstoneTwo] = useState("");

  // Load survey data
  useEffect(() => {
    async function loadSurvey() {
      const { data, error } = await supabase
        .from("surveys")
        .select("survey_path")
        .eq("id", surveyId)
        .single();

      if (error || !data) {
        console.error("Failed to load survey:", error);
        return;
      }

      const path = data.survey_path as "two_tier" | "three_tier";
      setSurveyPath(path);
      setTiers(getTiersForPath(path));
      setPhase("tier_intro");
    }

    loadSurvey();
  }, [surveyId]);

  // Current tier and dimension
  const currentTier = tiers[currentTierIndex];
  const currentDimension = currentTier
    ? DIMENSIONS_ORDER[currentDimensionIndex]
    : null;
  const currentDimensionData =
    currentTier && currentDimension
      ? currentTier.dimensions[currentDimension]
      : null;

  // Get a rating for a specific question
  const getRating = useCallback(
    (tier: string, dimension: Dimension, questionIndex: number) => {
      return ratings.find(
        (r) =>
          r.tier === tier &&
          r.dimension === dimension &&
          r.questionIndex === questionIndex
      )?.rating;
    },
    [ratings]
  );

  // Set a rating
  function setRating(
    tier: string,
    dimension: Dimension,
    questionIndex: number,
    questionText: string,
    rating: number
  ) {
    setRatings((prev) => {
      const filtered = prev.filter(
        (r) =>
          !(
            r.tier === tier &&
            r.dimension === dimension &&
            r.questionIndex === questionIndex
          )
      );
      return [
        ...filtered,
        { tier, dimension, questionIndex, questionText, rating },
      ];
    });
  }

  // Get an open-ended answer
  const getOpenAnswer = useCallback(
    (tier: string, dimension: Dimension) => {
      return openAnswers.find(
        (a) => a.tier === tier && a.dimension === dimension
      )?.response || "";
    },
    [openAnswers]
  );

  // Set an open-ended answer
  function setOpenAnswer(
    tier: string,
    dimension: Dimension,
    promptText: string,
    response: string
  ) {
    setOpenAnswers((prev) => {
      const filtered = prev.filter(
        (a) => !(a.tier === tier && a.dimension === dimension)
      );
      return [...filtered, { tier, dimension, promptText, response }];
    });
  }

  // Check if current dimension is complete (all ratings filled)
  function isDimensionComplete(): boolean {
    if (!currentTier || !currentDimension || !currentDimensionData) return false;

    const questionCount = currentDimensionData.ratingQuestions.length;
    for (let i = 0; i < questionCount; i++) {
      if (!getRating(currentTier.key, currentDimension, i)) return false;
    }
    return true;
  }

  // Navigate to next dimension or tier
  function handleNext() {
    if (currentDimensionIndex < DIMENSIONS_ORDER.length - 1) {
      // Next dimension within same tier
      setCurrentDimensionIndex(currentDimensionIndex + 1);
      window.scrollTo(0, 0);
    } else if (currentTierIndex < tiers.length - 1) {
      // Next tier — show tier intro
      setCurrentTierIndex(currentTierIndex + 1);
      setCurrentDimensionIndex(0);
      setPhase("tier_intro");
      window.scrollTo(0, 0);
    } else {
      // All tiers done — go to capstone
      setPhase("capstone");
      window.scrollTo(0, 0);
    }
  }

  // Navigate back
  function handleBack() {
    if (phase === "capstone") {
      setCurrentTierIndex(tiers.length - 1);
      setCurrentDimensionIndex(DIMENSIONS_ORDER.length - 1);
      setPhase("questions");
      window.scrollTo(0, 0);
      return;
    }

    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex(currentDimensionIndex - 1);
      window.scrollTo(0, 0);
    } else if (currentTierIndex > 0) {
      setCurrentTierIndex(currentTierIndex - 1);
      setCurrentDimensionIndex(DIMENSIONS_ORDER.length - 1);
      setPhase("questions");
      window.scrollTo(0, 0);
    }
  }

  // Submit all answers
  async function handleSubmit() {
    setPhase("submitting");

    try {
      // Save all ratings
      if (ratings.length > 0) {
        const { error: ratingsError } = await supabase
          .from("survey_ratings")
          .insert(
            ratings.map((r) => ({
              survey_id: surveyId,
              tier: r.tier,
              dimension: r.dimension,
              question_index: r.questionIndex + 1,
              question_text: r.questionText,
              rating: r.rating,
            }))
          );
        if (ratingsError) throw ratingsError;
      }

      // Save all open-ended responses
      const filledOpenAnswers = openAnswers.filter((a) => a.response.trim());
      if (filledOpenAnswers.length > 0) {
        const { error: openError } = await supabase
          .from("survey_open_responses")
          .insert(
            filledOpenAnswers.map((a) => ({
              survey_id: surveyId,
              tier: a.tier,
              dimension: a.dimension,
              prompt_text: a.promptText,
              response: a.response,
            }))
          );
        if (openError) throw openError;
      }

      // Save capstone responses and mark survey as completed
      const { error: surveyError } = await supabase
        .from("surveys")
        .update({
          capstone_one_response: capstoneOne || null,
          capstone_two_response: capstoneTwo || null,
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", surveyId);

      if (surveyError) throw surveyError;

      // Navigate to report generation
      router.push(`/report/${surveyId}`);
    } catch (err) {
      console.error("Error submitting survey:", err);
      setPhase("capstone");
      alert("Something went wrong saving your responses. Please try again.");
    }
  }

  // ============================================
  // RENDER: Loading
  // ============================================
  if (phase === "loading") {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-navy/60 text-lg">Loading your diagnostic...</p>
      </main>
    );
  }

  // ============================================
  // RENDER: Submitting
  // ============================================
  if (phase === "submitting") {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-navy/20 border-t-navy rounded-full animate-spin mx-auto" />
          <p className="text-navy text-lg font-medium">
            Saving your responses...
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: Tier Introduction Screen
  // ============================================
  if (phase === "tier_intro" && currentTier) {
    return (
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="max-w-xl w-full">
          <ProgressBar
            currentTierIndex={currentTierIndex}
            totalTiers={tiers.length}
            currentDimensionIndex={0}
            totalDimensions={DIMENSIONS_ORDER.length}
            phase={phase}
          />

          <div className="mt-16 text-center space-y-6">
            <p className="text-sm font-semibold text-blue uppercase tracking-wide">
              {currentTierIndex === 0
                ? "Let's begin"
                : `Section ${currentTierIndex + 1} of ${tiers.length}`}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-navy">
              {currentTier.label}
            </h1>
            <p className="text-lg text-navy/70 leading-relaxed max-w-md mx-auto">
              {currentTier.introText}
            </p>
            <div className="pt-6">
              <button
                onClick={() => setPhase("questions")}
                className="bg-navy text-white text-lg font-semibold px-10 py-4 rounded-md hover:bg-navy/90 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: Capstone Questions
  // ============================================
  if (phase === "capstone") {
    return (
      <main className="flex-1 flex flex-col items-center px-4 py-8">
        <div className="max-w-xl w-full">
          <ProgressBar
            currentTierIndex={currentTierIndex}
            totalTiers={tiers.length}
            currentDimensionIndex={0}
            totalDimensions={DIMENSIONS_ORDER.length}
            phase={phase}
          />

          <div className="mt-10 space-y-8">
            <div className="text-center">
              <p className="text-sm font-semibold text-blue uppercase tracking-wide">
                Final Questions
              </p>
              <h2 className="text-2xl font-bold text-navy mt-2">
                The Big Picture
              </h2>
              <p className="text-navy/60 mt-2">
                These two questions help us focus your report on what matters
                most to you.
              </p>
            </div>

            {/* Capstone 1 */}
            <div className="bg-white rounded-xl p-6 border border-navy/10 shadow-sm">
              <p className="text-navy font-medium mb-3">
                {CAPSTONE_QUESTIONS[0]}
              </p>
              <textarea
                value={capstoneOne}
                onChange={(e) => setCapstoneOne(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-md border border-navy/20 bg-light-gray text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
                placeholder="Take your time with this one..."
              />
            </div>

            {/* Capstone 2 */}
            <div className="bg-white rounded-xl p-6 border border-navy/10 shadow-sm">
              <p className="text-navy font-medium mb-3">
                {CAPSTONE_QUESTIONS[1]}
              </p>
              <textarea
                value={capstoneTwo}
                onChange={(e) => setCapstoneTwo(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-md border border-navy/20 bg-light-gray text-navy focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
                placeholder="Be honest..."
              />
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="text-navy/60 font-medium hover:text-navy transition-colors"
              >
                &larr; Back
              </button>
              <button
                onClick={handleSubmit}
                className="bg-magenta text-white text-lg font-semibold px-10 py-4 rounded-md hover:bg-magenta/90 transition-colors"
              >
                Generate My Report
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // RENDER: Questions (Rating + Open-Ended)
  // ============================================
  if (!currentTier || !currentDimension || !currentDimensionData) return null;

  return (
    <main className="flex-1 flex flex-col items-center px-4 py-8">
      <div className="max-w-xl w-full">
        <ProgressBar
          currentTierIndex={currentTierIndex}
          totalTiers={tiers.length}
          currentDimensionIndex={currentDimensionIndex}
          totalDimensions={DIMENSIONS_ORDER.length}
          phase={phase}
        />

        {/* Tier + Dimension Header */}
        <div className="mt-8 mb-6">
          <p className="text-sm font-semibold text-blue uppercase tracking-wide">
            {currentTier.label} &mdash; {currentDimensionData.label}
          </p>
          <p className="text-xs text-navy/40 mt-1">
            Dimension {currentDimensionIndex + 1} of {DIMENSIONS_ORDER.length}
          </p>
        </div>

        {/* Rating Questions */}
        <div className="space-y-6">
          {currentDimensionData.ratingQuestions.map((question, qIndex) => {
            const currentRating = getRating(
              currentTier.key,
              currentDimension,
              qIndex
            );

            return (
              <div
                key={qIndex}
                className="bg-white rounded-xl p-5 border border-navy/10 shadow-sm"
              >
                <p className="text-navy font-medium text-sm mb-4">
                  {question.text}
                </p>
                <div className="flex justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <RatingButton
                      key={value}
                      value={value}
                      selected={currentRating === value}
                      onClick={() =>
                        setRating(
                          currentTier.key,
                          currentDimension,
                          qIndex,
                          question.text,
                          value
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Open-Ended Prompt */}
          <div className="bg-white rounded-xl p-5 border border-navy/10 shadow-sm">
            <p className="text-navy font-medium text-sm mb-3">
              {currentDimensionData.openEndedPrompt}
            </p>
            <textarea
              value={getOpenAnswer(currentTier.key, currentDimension)}
              onChange={(e) =>
                setOpenAnswer(
                  currentTier.key,
                  currentDimension,
                  currentDimensionData.openEndedPrompt,
                  e.target.value
                )
              }
              rows={4}
              className="w-full px-4 py-3 rounded-md border border-navy/20 bg-light-gray text-navy text-sm focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
              placeholder="Share your thoughts..."
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-8 pb-4">
          <button
            onClick={handleBack}
            className={`text-navy/60 font-medium hover:text-navy transition-colors ${
              currentTierIndex === 0 && currentDimensionIndex === 0
                ? "invisible"
                : ""
            }`}
          >
            &larr; Back
          </button>
          <button
            onClick={handleNext}
            disabled={!isDimensionComplete()}
            className="bg-navy text-white font-semibold px-8 py-3 rounded-md hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentTierIndex === tiers.length - 1 &&
            currentDimensionIndex === DIMENSIONS_ORDER.length - 1
              ? "Final Questions"
              : "Next"}
          </button>
        </div>
      </div>
    </main>
  );
}

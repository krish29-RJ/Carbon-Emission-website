import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Target, CheckCircle, Clock, Filter } from "lucide-react";
import RecommendationCard from "@/components/RecommendationCard";
import GoalCard from "@/components/GoalCard";
import { EmptyState } from "@/components/EmptyState";
import { getRecommendationsByCategory } from "@/lib/aiInsights";
import type { AIRecommendation } from "@/lib/aiInsights";

type Tab = "recommended" | "active" | "completed";
type FilterCategory = "all" | "transport" | "energy" | "food" | "lifestyle";
type FilterDifficulty = "all" | "easy" | "medium" | "hard";

interface GoalItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  estimated_saving: number;
  difficulty: string;
  status: string;
  completed_at: string | null;
}

/**
 * ActionsPage component.
 * 
 * @returns {JSX.Element} The rendered component.
 */
export default function ActionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("recommended");
  const [catFilter, setCatFilter] = useState<FilterCategory>("all");
  const [diffFilter, setDiffFilter] = useState<FilterDifficulty>("all");
  const [goals, setGoals] = useState<GoalItem[]>([]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    if (!isSupabaseConfigured) {
      setGoals([]);
      return;
    }

    const { data } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as GoalItem[]) || []);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  // Build recommendations from all categories
  const allRecommendations: AIRecommendation[] = [
    ...getRecommendationsByCategory("transport"),
    ...getRecommendationsByCategory("energy"),
    ...getRecommendationsByCategory("food"),
    ...getRecommendationsByCategory("lifestyle"),
  ];

  // Filter out already-accepted recommendations
  const acceptedTitles = new Set(goals.map(g => g.title));
  const filteredRecommendations = allRecommendations
    .filter(r => !acceptedTitles.has(r.title))
    .filter(r => catFilter === "all" || r.category === catFilter)
    .filter(r => diffFilter === "all" || r.difficulty === diffFilter);

  const tabs: {
    key: Tab;
    label: string;
    icon: typeof Target;
    count: number;
  }[] = [
    {
      key: "recommended",
      label: "Recommended",
      icon: Target,
      count: filteredRecommendations.length,
    },
    {
      key: "active",
      label: "Active Goals",
      icon: Clock,
      count: activeGoals.length,
    },
    {
      key: "completed",
      label: "Completed",
      icon: CheckCircle,
      count: completedGoals.length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Actions & Goals
          </h1>
          <p className="text-sm text-slate-500">
            {tab === "recommended" &&
              "Personalized recommendations based on your footprint."}
            {tab === "active" && `${activeGoals.length} goals in progress.`}
            {tab === "completed" && `${completedGoals.length} goals completed.`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters for recommendations */}
        {tab === "recommended" && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase">
              Category:
            </span>
            {(
              [
                "all",
                "transport",
                "energy",
                "food",
                "lifestyle",
              ] as FilterCategory[]
            ).map(c => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  catFilter === c
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
            <span className="text-xs font-medium text-slate-500 uppercase ml-4">
              Difficulty:
            </span>
            {(["all", "easy", "medium", "hard"] as FilterDifficulty[]).map(
              d => (
                <button
                  key={d}
                  onClick={() => setDiffFilter(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    diffFilter === d
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              )
            )}
          </div>
        )}

        {/* Content */}
        {tab === "recommended" && (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredRecommendations.length > 0 ? (
              filteredRecommendations.map((rec, i) => (
                <RecommendationCard
                  key={`${rec.title}-${i}`}
                  recommendation={rec}
                  onAccept={fetchGoals}
                />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  icon={<Target className="w-8 h-8 text-slate-400" />}
                  title="No recommendations match"
                  description="Try adjusting your filters or check your active goals — you may have already accepted all available recommendations!"
                />
              </div>
            )}
          </div>
        )}

        {tab === "active" && (
          <div className="grid md:grid-cols-2 gap-4">
            {activeGoals.length > 0 ? (
              activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  icon={<Clock className="w-8 h-8 text-slate-400" />}
                  title="No active goals"
                  description="Browse recommendations and accept challenges to start reducing your footprint."
                  action={{
                    label: "Browse Recommendations",
                    onClick: () => setTab("recommended"),
                  }}
                />
              </div>
            )}
          </div>
        )}

        {tab === "completed" && (
          <div className="grid md:grid-cols-2 gap-4">
            {completedGoals.length > 0 ? (
              completedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={fetchGoals} />
              ))
            ) : (
              <div className="md:col-span-2">
                <EmptyState
                  icon={<CheckCircle className="w-8 h-8 text-slate-400" />}
                  title="No completed goals yet"
                  description="Complete your active goals to see them here and earn badges!"
                  action={{
                    label: "View Active Goals",
                    onClick: () => setTab("active"),
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

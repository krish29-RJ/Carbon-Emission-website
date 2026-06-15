import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Target,
  Zap,
  Apple,
  Car,
  ShoppingBag,
  Check,
  Leaf,
} from "lucide-react";
import type { AIRecommendation } from "@/lib/aiInsights";

const categoryIcons: Record<string, typeof Car> = {
  transport: Car,
  energy: Zap,
  food: Apple,
  lifestyle: ShoppingBag,
};

const categoryColors: Record<
  string,
  {
    border: string;
    bg: string;
    badge: string;
    badgeText: string;
    iconBg: string;
  }
> = {
  transport: {
    border: "border-l-sky-500",
    bg: "bg-sky-50/50",
    badge: "bg-sky-100 text-sky-700",
    badgeText: "text-sky-600",
    iconBg: "bg-sky-100",
  },
  energy: {
    border: "border-l-orange-500",
    bg: "bg-orange-50/50",
    badge: "bg-orange-100 text-orange-700",
    badgeText: "text-orange-600",
    iconBg: "bg-orange-100",
  },
  food: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-700",
    badgeText: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  lifestyle: {
    border: "border-l-violet-500",
    bg: "bg-violet-50/50",
    badge: "bg-violet-100 text-violet-700",
    badgeText: "text-violet-600",
    iconBg: "bg-violet-100",
  },
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

interface Props {
  recommendation: AIRecommendation;
  onAccept?: () => void;
}

export default function RecommendationCard({
  recommendation,
  onAccept,
}: Props) {
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const Icon = categoryIcons[recommendation.category] || Target;
  const colors =
    categoryColors[recommendation.category] || categoryColors.transport;

  const handleAccept = async () => {
    if (!user || accepted) return;
    if (!isSupabaseConfigured) {
      setAccepted(true);
      toast.success("🎯 Challenge accepted! Check your Actions page.");
      onAccept?.();
      return;
    }

    setLoading(true);

    // First try: full insert with all fields
    const fullPayload = {
      user_id: user.id,
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      estimated_saving: recommendation.estimatedSaving,
      difficulty: recommendation.difficulty,
      status: "active",
      source: "recommendation",
      recommendation_data: recommendation,
    };

    const { error: fullError } = await supabase
      .from("goals")
      .insert(fullPayload);

    if (!fullError) {
      setAccepted(true);
      toast.success("🎯 Challenge accepted! Check your Actions page.");
      onAccept?.();
      setLoading(false);
      return;
    }

    // Fallback: insert without optional columns that may not exist in DB
    const minimalPayload = {
      user_id: user.id,
      title: recommendation.title,
      description: recommendation.description,
      category: recommendation.category,
      estimated_saving: recommendation.estimatedSaving,
      difficulty: recommendation.difficulty,
      status: "active",
    };

    const { error: minimalError } = await supabase
      .from("goals")
      .insert(minimalPayload);

    if (!minimalError) {
      setAccepted(true);
      toast.success("🎯 Challenge accepted! Check your Actions page.");
      onAccept?.();
    } else {
      // Both failed — show specific error
      const msg = minimalError.message || "Unknown error";
      toast.error(`Failed to accept goal: ${msg}`);
      console.error("Insert error (full):", fullError);
      console.error("Insert error (minimal):", minimalError);
    }

    setLoading(false);
  };

  return (
    <div
      className={`group bg-white rounded-2xl shadow-sm border border-slate-100 border-l-4 ${colors.border} p-5 hover:shadow-lg hover:border-l-[6px] transition-all duration-300 cursor-default`}
    >
      {/* Header badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}
          >
            {recommendation.category}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${difficultyColors[recommendation.difficulty]}`}
          >
            {recommendation.difficulty}
          </span>
        </div>
        <div
          className={`w-8 h-8 rounded-xl ${colors.iconBg} flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity`}
        >
          <Icon className={`w-4 h-4 ${colors.badgeText}`} />
        </div>
      </div>

      <h4 className="text-base font-semibold text-slate-900 mb-1.5 group-hover:text-emerald-800 transition-colors">
        {recommendation.title}
      </h4>
      <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
        {recommendation.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">
            Save ~{recommendation.estimatedSaving} kg/mo
          </span>
        </div>

        {accepted ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
            <Check className="w-4 h-4" />
            Accepted!
          </span>
        ) : (
          <button
            onClick={handleAccept}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-emerald-200 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Adding...
              </span>
            ) : (
              "Accept Challenge"
            )}
          </button>
        )}
      </div>
    </div>
  );
}

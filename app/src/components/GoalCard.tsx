import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Check,
  X,
  Target,
  Zap,
  Apple,
  Car,
  ShoppingBag,
  Award,
} from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  estimated_saving: number;
  difficulty: string;
  status: string;
  completed_at: string | null;
}

const categoryIcons: Record<string, typeof Car> = {
  transport: Car,
  energy: Zap,
  food: Apple,
  lifestyle: ShoppingBag,
};

const categoryColors: Record<string, { dot: string; badge: string }> = {
  transport: { dot: "bg-sky-500", badge: "bg-sky-100 text-sky-700" },
  energy: { dot: "bg-orange-500", badge: "bg-orange-100 text-orange-700" },
  food: { dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  lifestyle: { dot: "bg-violet-500", badge: "bg-violet-100 text-violet-700" },
};

const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

interface Props {
  goal: Goal;
  onUpdate?: () => void;
}

export default function GoalCard({ goal, onUpdate }: Props) {
  const [completing, setCompleting] = useState(false);
  const [removed, setRemoved] = useState(false);

  const Icon = categoryIcons[goal.category] || Target;
  const colors = categoryColors[goal.category] || categoryColors.transport;
  const isCompleted = goal.status === "completed";

  const handleComplete = async () => {
    if (!isSupabaseConfigured) {
      toast.success("Goal completed! Great work!");
      onUpdate?.();
      return;
    }

    setCompleting(true);
    const { error } = await supabase
      .from("goals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", goal.id);

    if (error) {
      toast.error("Failed to complete goal.");
    } else {
      toast.success("Goal completed! Great work!");
      setTimeout(() => {
        onUpdate?.();
      }, 300);
    }
    setCompleting(false);
  };

  const handleAbandon = async () => {
    setRemoved(true);
    if (!isSupabaseConfigured) {
      toast.success("Goal removed.");
      onUpdate?.();
      return;
    }

    try {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);

      if (error) {
        setRemoved(false);
        toast.error("Failed to remove goal.");
      } else {
        toast.success("Goal removed.");
        // Give Supabase a tiny window to propagate before calling parent update
        setTimeout(() => {
          onUpdate?.();
        }, 300);
      }
    } catch {
      setRemoved(false);
    }
  };

  if (removed) return null;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-white/8 p-5 hover:border-white/15 hover:bg-slate-800/60 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full opacity-90 ${colors.badge}`}
          >
            {goal.category}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full opacity-90 ${difficultyColors[goal.difficulty]}`}
          >
            {goal.difficulty}
          </span>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${isCompleted ? "bg-emerald-500" : colors.dot}`}
        />
      </div>

      <h4
        className={`text-base font-semibold mb-1.5 ${isCompleted ? "text-slate-500 line-through" : "text-white"}`}
      >
        {goal.title}
      </h4>
      {goal.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
          {goal.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-emerald-400">
            {isCompleted ? "Saved" : "Save"} ~{goal.estimated_saving} kg/mo
          </span>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">
              {goal.completed_at
                ? new Date(goal.completed_at).toLocaleDateString()
                : "Done"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAbandon}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Remove goal"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {completing ? "..." : "Complete"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

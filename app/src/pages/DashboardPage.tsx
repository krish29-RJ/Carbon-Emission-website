import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Leaf,
  Car,
  Zap,
  Apple,
  ShoppingBag,
  Target,
  Award,
  Calculator,
  ChevronRight,
  Flame,
  Trophy,
  Globe,
  Landmark,
  Users,
  Sliders,
  RotateCcw,
  Utensils,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  getImpactColor,
  getImpactLabel,
  calculateFootprint,
} from "@/lib/calculator";
import type { CalculatorInput } from "@/lib/calculator";
import StatCard from "@/components/StatCard";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import FootprintTrendChart from "@/components/FootprintTrendChart";
import GoalCard from "@/components/GoalCard";
import BadgeCard from "@/components/BadgeCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import EcoWorld from "@/components/EcoWorld";

// ─── Simulator helpers (inline) ────────────────────────────────────────────
const safeN = (v: unknown, fb = 0): number => {
  const n = Number(v);
  return isFinite(n) && !isNaN(n) ? n : fb;
};
function sanitiseCalcInput(raw: Record<string, unknown>): CalculatorInput {
  return {
    carKmPerWeek: safeN(raw.carKmPerWeek, 80),
    busKmPerWeek: safeN(raw.busKmPerWeek, 20),
    metroKmPerWeek: safeN(raw.metroKmPerWeek, 10),
    flightHoursPerYear: safeN(raw.flightHoursPerYear, 4),
    electricityKwhPerMonth: safeN(raw.electricityKwhPerMonth, 200),
    acHoursPerDay: safeN(raw.acHoursPerDay, 4),
    renewableEnergy: Boolean(raw.renewableEnergy),
    householdSize: Math.max(1, safeN(raw.householdSize, 1)),
    dietType: ["vegan", "vegetarian", "mixed", "meat-heavy"].includes(
      raw.dietType as string
    )
      ? (raw.dietType as CalculatorInput["dietType"])
      : "mixed",
    meatMealsPerWeek: safeN(raw.meatMealsPerWeek, 5),
    foodWasteKgPerWeek: safeN(raw.foodWasteKgPerWeek, 1),
    shoppingOrdersPerMonth: safeN(raw.shoppingOrdersPerMonth, 4),
    deliveryOrdersPerMonth: safeN(raw.deliveryOrdersPerMonth, 6),
    recyclesOften: Boolean(raw.recyclesOften),
  };
}
interface SimAdj {
  carToPublic: number;
  reduceMeat: number;
  reduceElec: number;
  reduceShopping: number;
  reduceDelivery: number;
  addSolar: boolean;
  goVeg: boolean;
}
const SIM_DEFAULT: SimAdj = {
  carToPublic: 0,
  reduceMeat: 0,
  reduceElec: 0,
  reduceShopping: 0,
  reduceDelivery: 0,
  addSolar: false,
  goVeg: false,
};
const DEMO_BASE = sanitiseCalcInput({});
function applySimAdj(base: CalculatorInput, adj: SimAdj): CalculatorInput {
  const shifted = base.carKmPerWeek * (adj.carToPublic / 100);
  return {
    ...base,
    carKmPerWeek: Math.max(0, Math.round(base.carKmPerWeek - shifted)),
    busKmPerWeek: Math.round(base.busKmPerWeek + shifted * 0.5),
    metroKmPerWeek: Math.round(base.metroKmPerWeek + shifted * 0.5),
    meatMealsPerWeek: Math.max(
      0,
      Math.round(base.meatMealsPerWeek * (1 - adj.reduceMeat / 100))
    ),
    electricityKwhPerMonth: Math.max(
      0,
      Math.round(base.electricityKwhPerMonth * (1 - adj.reduceElec / 100))
    ),
    shoppingOrdersPerMonth: Math.max(
      0,
      Math.round(base.shoppingOrdersPerMonth * (1 - adj.reduceShopping / 100))
    ),
    deliveryOrdersPerMonth: Math.max(
      0,
      Math.round(base.deliveryOrdersPerMonth * (1 - adj.reduceDelivery / 100))
    ),
    renewableEnergy: base.renewableEnergy || adj.addSolar,
    dietType:
      adj.goVeg && base.dietType !== "vegan" ? "vegetarian" : base.dietType,
  };
}

interface Report {
  id: string;
  total_co2e: number;
  transport_co2e: number;
  energy_co2e: number;
  food_co2e: number;
  lifestyle_co2e: number;
  created_at: string;
}

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

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [previousReport, setPreviousReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [aiInsight, setAiInsight] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Simulator state
  const [simBase, setSimBase] = useState<CalculatorInput>(DEMO_BASE);
  const [simAdj, setSimAdj] = useState<SimAdj>(SIM_DEFAULT);
  const [simLoaded, setSimLoaded] = useState(false);

  // Gamification states
  const [xp, setXp] = useState(150);
  const [streak, setStreak] = useState(3);
  const [levelName, setLevelName] = useState("Seedling");
  const [nextLevelXp, setNextLevelXp] = useState(500);
  const [levelProgress, setLevelProgress] = useState(30);

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!user) {
        setLoading(false);
        return;
      }
      if (!isSupabaseConfigured) {
        setReports([]);
        setLatestReport(null);
        setPreviousReport(null);
        setGoals([]);
        setBadges([]);
        setAiInsight(null);
        setLoading(false);
        return;
      }

      if (!isBackground) {
        setLoading(true);
      }

      // Fetch reports
      const { data: reportsData } = await supabase
        .from("footprint_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      let fetchedReports: Report[] = [];
      if (reportsData && reportsData.length > 0) {
        const typed = reportsData as Report[];
        fetchedReports = typed;
        setReports(typed);
        setLatestReport(typed[0]);
        if (typed.length > 1) setPreviousReport(typed[1]);
      }

      // Fetch active goals
      const { data: goalsData } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);
      const allUserGoals = (goalsData as GoalItem[]) || [];
      setGoals(allUserGoals.filter(g => g.status === "active").slice(0, 3));

      // Fetch badges
      const { data: allBadges } = await supabase.from("badges").select("*");
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);

      const earnedIds = new Set((userBadges || []).map(ub => ub.badge_id));
      setBadges(
        (allBadges || []).map(b => ({
          ...b,
          earned: earnedIds.has(b.id),
        })) as BadgeItem[]
      );

      // Fetch latest AI insight
      const { data: insightsData } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (insightsData && insightsData.length > 0) {
        setAiInsight(insightsData[0]);
      }

      // Compute dynamic Gamification metrics
      const completedGoalsCount = allUserGoals.filter(
        g => g.status === "completed"
      ).length;
      const activeGoalsCount = allUserGoals.filter(
        g => g.status === "active"
      ).length;
      const calculatedXp =
        fetchedReports.length * 100 +
        completedGoalsCount * 150 +
        activeGoalsCount * 50 +
        150;
      setXp(calculatedXp);

      // Streaks – real consecutive-day algorithm
      // 1. Collect unique calendar days (YYYY-MM-DD) from all reports, newest first
      const uniqueDays = Array.from(
        new Set(fetchedReports.map(r => r.created_at.slice(0, 10)))
      ).sort((a, b) => (a < b ? 1 : -1)); // descending

      let calculatedStreak = 0;
      if (uniqueDays.length > 0) {
        // Start from today; if the user logged today count it, else start from yesterday
        const todayStr = new Date().toISOString().slice(0, 10);
        const mostRecent = uniqueDays[0];
        const msDiff =
          new Date(todayStr).getTime() - new Date(mostRecent).getTime();
        const daysBehind = Math.round(msDiff / 86_400_000);

        // Only count a streak if the most-recent log is today or yesterday
        if (daysBehind <= 1) {
          calculatedStreak = 1;
          for (let i = 1; i < uniqueDays.length; i++) {
            const prev = new Date(uniqueDays[i - 1]).getTime();
            const curr = new Date(uniqueDays[i]).getTime();
            const gap = Math.round((prev - curr) / 86_400_000);
            if (gap === 1) {
              calculatedStreak++;
            } else {
              break; // chain broken
            }
          }
        }
      }
      setStreak(calculatedStreak);

      // Levels mapping: Seedling (0-500 XP) -> Sapling (501-1500 XP) -> Tree (1501-3000 XP) -> Forest Guardian (3001+ XP)
      if (calculatedXp <= 500) {
        setLevelName("Seedling");
        setNextLevelXp(500);
        setLevelProgress((calculatedXp / 500) * 100);
      } else if (calculatedXp <= 1500) {
        setLevelName("Sapling");
        setNextLevelXp(1500);
        setLevelProgress(((calculatedXp - 500) / 1000) * 100);
      } else if (calculatedXp <= 3000) {
        setLevelName("Tree");
        setNextLevelXp(3000);
        setLevelProgress(((calculatedXp - 1500) / 1500) * 100);
      } else {
        setLevelName("Forest Guardian");
        setNextLevelXp(5000);
        setLevelProgress(Math.min(((calculatedXp - 3000) / 2000) * 100, 100));
      }

      setLoading(false);

      // Load simulator base from latest report input_data
      if (reportsData && reportsData.length > 0) {
        const raw = reportsData[0] as any;
        if (raw.input_data) {
          setSimBase(
            sanitiseCalcInput(raw.input_data as Record<string, unknown>)
          );
          setSimLoaded(true);
        }
      }
    },
    [user]
  );

  // Fetch leaderboard data separately
  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLeaderboardLoading(true);
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, city");
      const { data: reports } = await supabase
        .from("footprint_reports")
        .select("user_id, total_co2e, created_at")
        .order("created_at", { ascending: true });
      const { data: goalsData } = await supabase
        .from("goals")
        .select("user_id, status");

      if (!profiles || !reports) return;

      // Group each user's reports chronologically
      const userReportsMap: Record<string, number[]> = {};
      reports.forEach((r: any) => {
        if (!userReportsMap[r.user_id]) userReportsMap[r.user_id] = [];
        userReportsMap[r.user_id].push(r.total_co2e);
      });

      const completedGoals: Record<string, number> = {};
      (goalsData || []).forEach((g: any) => {
        if (g.status === "completed") {
          completedGoals[g.user_id] = (completedGoals[g.user_id] || 0) + 1;
        }
      });

      const board = profiles
        .map((p: any) => {
          const reps = userReportsMap[p.id] || [];
          if (reps.length === 0) return null;
          const latest = reps[reps.length - 1];
          const previous = reps.length > 1 ? reps[reps.length - 2] : null;
          const hasPrevious = reps.length > 1;

          // Compare latest report with previous report
          const improvement =
            hasPrevious && previous && previous > 0
              ? Math.round(((previous - latest) / previous) * 100)
              : 0;
          return {
            user_id: p.id,
            full_name: p.full_name || "Anonymous",
            city: p.city || "",
            latest_footprint: Math.round(latest * 100) / 100,
            improvement_pct: improvement,
            hasPrevious: hasPrevious,
            completed_goals: completedGoals[p.id] || 0,
            isCurrentUser: user?.id === p.id,
          };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => {
          // Primary: lowest footprint wins
          return a.latest_footprint - b.latest_footprint;
        })
        .slice(0, 5);

      setLeaderboard(board);
    } catch {
      /* silent */
    } finally {
      setLeaderboardLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchLeaderboard();

    if (!isSupabaseConfigured || !user) return;

    const channel = supabase
      .channel("dashboard_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "footprint_reports",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData(true);
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData(true);
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_badges",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchLeaderboard, user]);

  // All hooks must come before any early returns (Rules of Hooks)
  // Memoize EcoWorld props — only re-initializes canvas when numbers actually change
  const ecoWorldProps = useMemo(
    () => ({
      total: latestReport?.total_co2e ?? 0,
      transport: latestReport?.transport_co2e ?? 0,
      energy: latestReport?.energy_co2e ?? 0,
      food: latestReport?.food_co2e ?? 0,
      lifestyle: latestReport?.lifestyle_co2e ?? 0,
      interactive: true,
    }),
    [
      latestReport?.total_co2e,
      latestReport?.transport_co2e,
      latestReport?.energy_co2e,
      latestReport?.food_co2e,
      latestReport?.lifestyle_co2e,
    ]
  );

  const breakdown = useMemo(() => {
    if (!latestReport) return [];
    return [
      {
        category: "Transport",
        value: latestReport.transport_co2e,
        percentage: Math.round(
          (latestReport.transport_co2e / latestReport.total_co2e) * 100
        ),
        color: "#0EA5E9",
      },
      {
        category: "Energy",
        value: latestReport.energy_co2e,
        percentage: Math.round(
          (latestReport.energy_co2e / latestReport.total_co2e) * 100
        ),
        color: "#F97316",
      },
      {
        category: "Food",
        value: latestReport.food_co2e,
        percentage: Math.round(
          (latestReport.food_co2e / latestReport.total_co2e) * 100
        ),
        color: "#10B981",
      },
      {
        category: "Lifestyle",
        value: latestReport.lifestyle_co2e,
        percentage: Math.round(
          (latestReport.lifestyle_co2e / latestReport.total_co2e) * 100
        ),
        color: "#8B5CF6",
      },
    ];
  }, [latestReport]);

  const trendData = useMemo(
    () =>
      reports.map(r => ({
        date: r.created_at,
        total: r.total_co2e,
        transport: r.transport_co2e,
        energy: r.energy_co2e,
        food: r.food_co2e,
        lifestyle: r.lifestyle_co2e,
      })),
    [reports]
  );

  const hasData = !!latestReport;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading ecosystem sandbox...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-[#030712] pt-20 px-4 text-white">
        <div className="max-w-4xl mx-auto py-10">
          <EmptyState
            icon={<Calculator className="w-10 h-10 text-emerald-400/80" />}
            title="Create Your First Ecological Footprint"
            description="You don't have any logged activities or calculations yet. Launch the Smart Tracker tool to evaluate your carbon score and generate your interactive sandbox world."
            action={{
              label: "Start Tracking",
              onClick: () => navigate("/log"),
            }}
          />
        </div>
      </div>
    );
  }

  const trend =
    latestReport && previousReport
      ? Math.round(
          ((latestReport.total_co2e - previousReport.total_co2e) /
            previousReport.total_co2e) *
            100
        )
      : undefined;

  const impactLevel =
    latestReport!.total_co2e < 500
      ? "low"
      : latestReport!.total_co2e <= 1000
        ? "moderate"
        : "high";
  const impactColor = getImpactColor(impactLevel);

  return (
    <div className="min-h-screen bg-[#030712] text-white pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gamification Progress & Header Header */}
        <div className="glass-card rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {profile?.full_name || "Ecosystem Commander"}
                </h2>
                <span className="bg-cyan-500/15 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                  Level {levelName}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {/* Progress bar */}
                <div className="w-40 sm:w-56 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {xp} / {nextLevelXp} XP
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 justify-between md:justify-end">
            <div
              className={`flex items-center gap-2 border px-4 py-2 rounded-2xl transition-colors duration-300 ${
                streak > 0
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                  : "bg-slate-800/50 border-slate-700/40 text-slate-500"
              }`}
            >
              <Flame
                className={`w-5 h-5 transition-colors ${streak > 0 ? "fill-amber-400/20 text-amber-400" : "fill-slate-700 text-slate-600"}`}
              />
              <div>
                <p className="text-[9px] text-slate-400 leading-none uppercase font-semibold">
                  Active Streak
                </p>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={streak}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-black mt-0.5"
                  >
                    {streak > 0
                      ? `${streak} Day${streak === 1 ? "" : "s"} Logged`
                      : "No streak yet"}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => navigate("/log")}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl transition-all duration-300"
              >
                <Calculator className="w-4 h-4 mr-2" /> Log Activity
              </Button>
            </div>
          </div>
        </div>

        {/* Sandbox Island and Benchmarks Split */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <EcoWorld {...ecoWorldProps} />
          </div>

          <div className="lg:col-span-4 flex flex-col justify-between glass-card rounded-2xl p-6 border border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1.5">
                <Globe className="w-5 h-5 text-cyan-400" />
                Global & Regional Benchmarks
              </h3>
              <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                Compare your current monthly ecological footprint of{" "}
                <span className="font-semibold text-white">
                  {latestReport.total_co2e} kg CO₂e
                </span>{" "}
                to regional averages.
              </p>

              {/* Progress bars comparing to benchmarks */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-slate-400" />
                      India Monthly Average
                    </span>
                    <span className="text-slate-400">150 kg</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: "37%" }}
                    />
                    <div
                      className={`absolute top-0 w-1 h-full bg-red-400 ${latestReport.total_co2e > 150 ? "left-[37%]" : "hidden"}`}
                      title="Your Position"
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">
                    {latestReport.total_co2e > 150
                      ? `⚠️ You exceed the India average by ${Math.round((latestReport.total_co2e / 150) * 100) - 100}%`
                      : "🏆 Excellent! You are under the regional average."}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      Global Monthly Average
                    </span>
                    <span className="text-slate-400">400 kg</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full"
                      style={{ width: "80%" }}
                    />
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">
                    {latestReport.total_co2e > 400
                      ? `⚠️ You exceed the global threshold limit.`
                      : "🏆 You are well within the global carbon bounds."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 bg-slate-900/20 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Historical Offset Impact
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-lg font-black text-white leading-none">
                    {Math.max(
                      Math.round((1000 - latestReport.total_co2e) * 0.08),
                      2
                    )}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">
                    Equivalent Trees Saved
                  </p>
                </div>
                <div>
                  <p className="text-lg font-black text-white leading-none">
                    {Math.max(
                      Math.round((1000 - latestReport.total_co2e) * 4.2),
                      15
                    )}
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">
                    Saved Km Driving
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Leaf className="w-5 h-5 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            label="Total Footprint"
            value={latestReport.total_co2e}
            unit="kg CO2e/mo"
            trend={trend}
            trendLabel="vs previous"
          />
          <StatCard
            icon={<Car className="w-5 h-5 text-sky-400" />}
            iconBg="bg-sky-500/10"
            label="Transport"
            value={latestReport.transport_co2e}
            unit="kg"
            subtext={`${breakdown[0].percentage}% of total`}
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-orange-400" />}
            iconBg="bg-orange-500/10"
            label="Energy"
            value={latestReport.energy_co2e}
            unit="kg"
            subtext={`${breakdown[1].percentage}% of total`}
          />
          <StatCard
            icon={<Apple className="w-5 h-5 text-emerald-400" />}
            iconBg="bg-emerald-500/10"
            label="Food"
            value={latestReport.food_co2e}
            unit="kg"
            subtext={`${breakdown[2].percentage}% of total`}
          />
          <StatCard
            icon={<ShoppingBag className="w-5 h-5 text-violet-400" />}
            iconBg="bg-violet-500/10"
            label="Lifestyle"
            value={latestReport.lifestyle_co2e}
            unit="kg"
            subtext={`${breakdown[3].percentage}% of total`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CategoryBreakdownChart
              data={breakdown}
              total={latestReport.total_co2e}
            />
          </div>
          <div className="lg:col-span-5">
            <FootprintTrendChart data={trendData} />
          </div>
        </div>

        {/* AI Insights + Goals Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 border border-white/5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                AI Coach Insights
              </h3>
              <span
                className="ml-auto px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: impactColor }}
              >
                {getImpactLabel(impactLevel)}
              </span>
            </div>

            {aiInsight ? (
              <>
                <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                  {aiInsight.summary}
                </p>
                {aiInsight.recommendations?.length > 0 && (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Core Improvement Areas
                    </h4>
                    <div className="space-y-2">
                      {(aiInsight.recommendations as any[])
                        .slice(0, 3)
                        .map((rec, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-white/5"
                          >
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-400">
                                {i + 1}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs sm:text-sm font-semibold text-slate-200">
                                {rec.title}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-normal">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => navigate("/actions")}
                  className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  View Action Plan <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                No AI insights generated yet. Click on Log Activity above to
                enter your current routine and trigger analysis.
              </p>
            )}
          </motion.div>

          {/* Active Goals */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Active Goals</h3>
              </div>
              <button
                onClick={() => navigate("/actions")}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
              >
                View All
              </button>
            </div>

            {goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={fetchData} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-400 mb-4">
                  No active weekly reduction targets accepted yet.
                </p>
                <Button
                  onClick={() => navigate("/actions")}
                  size="sm"
                  variant="outline"
                  className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                >
                  Accept Challenges
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Badges + Recent Activity Row */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Badges */}
          <div className="lg:col-span-4 glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                Earned Achievements
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </div>

          {/* Recent Calculations */}
          <div className="lg:col-span-8 glass-card rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4">
              Recent Computations
            </h3>
            {reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400">
                      <th className="text-left text-xs font-semibold uppercase tracking-wider py-2 pr-4">
                        Date
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider py-2 px-4">
                        Total
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider py-2 px-4 hidden sm:table-cell">
                        Transport
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider py-2 px-4 hidden sm:table-cell">
                        Energy
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider py-2 px-4 hidden md:table-cell">
                        Food
                      </th>
                      <th className="text-right text-xs font-semibold uppercase tracking-wider py-2 pl-4 hidden md:table-cell">
                        Lifestyle
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.slice(0, 5).map(report => (
                      <tr
                        key={report.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 pr-4 text-xs sm:text-sm text-slate-300">
                          {format(parseISO(report.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-xs sm:text-sm font-bold text-emerald-400">
                            {report.total_co2e}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1">
                            kg
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-xs sm:text-sm text-slate-300 hidden sm:table-cell">
                          {report.transport_co2e}
                        </td>
                        <td className="py-3 px-4 text-right text-xs sm:text-sm text-slate-300 hidden sm:table-cell">
                          {report.energy_co2e}
                        </td>
                        <td className="py-3 px-4 text-right text-xs sm:text-sm text-slate-300 hidden md:table-cell">
                          {report.food_co2e}
                        </td>
                        <td className="py-3 pl-4 text-right text-xs sm:text-sm text-slate-300 hidden md:table-cell">
                          {report.lifestyle_co2e}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4">
                No logged computations.
              </p>
            )}
          </div>
        </div>

        {/* Community Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 border border-white/5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Community Leaderboard
                </h3>
                <p className="text-[11px] text-slate-400">
                  Top performers ranked by emission improvement
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/leaderboard")}
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              View Full Board <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured
                  ? "Be the first to appear here!"
                  : "Connect Supabase to load rankings."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry: any, i: number) => {
                const medals = ["🥇", "🥈", "🥉"];
                const rankColors = [
                  "from-amber-500/20 to-amber-600/10 border-amber-500/30",
                  "from-slate-400/20 to-slate-500/10 border-slate-400/30",
                  "from-orange-700/20 to-orange-800/10 border-orange-700/30",
                ];
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all duration-200 ${
                      entry.isCurrentUser
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : i < 3
                          ? `bg-gradient-to-r ${rankColors[i]}`
                          : "bg-white/3 border-white/5 hover:bg-white/6"
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-8 text-center shrink-0">
                      {i < 3 ? (
                        <span className="text-xl">{medals[i]}</span>
                      ) : (
                        <span className="text-sm font-bold text-slate-400">
                          #{i + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar + Name */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        entry.isCurrentUser
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {entry.full_name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {entry.full_name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold border border-emerald-500/20">
                            YOU
                          </span>
                        )}
                      </p>
                      {entry.city && (
                        <p className="text-[10px] text-slate-500 truncate">
                          {entry.city}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        {entry.hasPrevious ? (
                          entry.improvement_pct > 0 ? (
                            <span className="flex items-center gap-0.5 text-sm font-bold text-emerald-400">
                              ↑ {entry.improvement_pct}%
                            </span>
                          ) : entry.improvement_pct < 0 ? (
                            <span className="flex items-center gap-0.5 text-sm font-bold text-red-400">
                              ↓ {Math.abs(entry.improvement_pct)}%
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {entry.latest_footprint} kg CO₂e
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Inline What-If Simulator ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6 border border-white/5"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  What-If Simulator
                </h3>
                <p className="text-[11px] text-slate-400">
                  Drag sliders to see real-time carbon savings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!simLoaded && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Info className="w-3 h-3" /> Demo data
                </span>
              )}
              {JSON.stringify(simAdj) !== JSON.stringify(SIM_DEFAULT) && (
                <button
                  onClick={() => setSimAdj(SIM_DEFAULT)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
              <button
                onClick={() => navigate("/simulator")}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              >
                Full Simulator <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {(() => {
            const proj = applySimAdj(simBase, simAdj);
            const cur = calculateFootprint(simBase);
            const pro = calculateFootprint(proj);
            const savKg = Math.max(0, cur.totalCO2 - pro.totalCO2);
            const savPct =
              cur.totalCO2 > 0 ? Math.round((savKg / cur.totalCO2) * 100) : 0;
            const barData = [
              {
                cat: "Transport",
                current: cur.transportCO2,
                projected: pro.transportCO2,
                fill: "#0EA5E9",
              },
              {
                cat: "Energy",
                current: cur.energyCO2,
                projected: pro.energyCO2,
                fill: "#F97316",
              },
              {
                cat: "Food",
                current: cur.foodCO2,
                projected: pro.foodCO2,
                fill: "#10B981",
              },
              {
                cat: "Lifestyle",
                current: cur.lifestyleCO2,
                projected: pro.lifestyleCO2,
                fill: "#8B5CF6",
              },
            ];
            const sliders: {
              key: keyof SimAdj;
              label: string;
              sub: string;
              max: number;
              color: string;
              icon: React.ReactNode;
            }[] = [
              {
                key: "carToPublic",
                label: "Car → Public Transit",
                sub: `${Math.max(0, Math.round(simBase.carKmPerWeek * (1 - simAdj.carToPublic / 100)))} km/wk left`,
                max: 100,
                color: "#0EA5E9",
                icon: <Car className="w-3.5 h-3.5" />,
              },
              {
                key: "reduceMeat",
                label: "Reduce Meat Meals",
                sub: `${Math.max(0, Math.round(simBase.meatMealsPerWeek * (1 - simAdj.reduceMeat / 100)))} meals/wk left`,
                max: 100,
                color: "#10B981",
                icon: <Utensils className="w-3.5 h-3.5" />,
              },
              {
                key: "reduceElec",
                label: "Reduce Electricity",
                sub: `${Math.max(0, Math.round(simBase.electricityKwhPerMonth * (1 - simAdj.reduceElec / 100)))} kWh/mo left`,
                max: 30,
                color: "#F97316",
                icon: <Zap className="w-3.5 h-3.5" />,
              },
              {
                key: "reduceShopping",
                label: "Reduce Shopping",
                sub: `${Math.max(0, Math.round(simBase.shoppingOrdersPerMonth * (1 - simAdj.reduceShopping / 100)))} orders/mo left`,
                max: 50,
                color: "#8B5CF6",
                icon: <ShoppingBag className="w-3.5 h-3.5" />,
              },
              {
                key: "reduceDelivery",
                label: "Reduce Deliveries",
                sub: `${Math.max(0, Math.round(simBase.deliveryOrdersPerMonth * (1 - simAdj.reduceDelivery / 100)))} orders/mo left`,
                max: 50,
                color: "#EC4899",
                icon: <ShoppingBag className="w-3.5 h-3.5" />,
              },
            ];
            return (
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Controls */}
                <div className="lg:col-span-5 space-y-1">
                  {/* KPI strip */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      {
                        label: "Current",
                        val: `${cur.totalCO2.toFixed(1)} kg`,
                        color: "#94a3b8",
                      },
                      {
                        label: "Projected",
                        val: `${pro.totalCO2.toFixed(1)} kg`,
                        color:
                          pro.totalCO2 < cur.totalCO2 ? "#10B981" : "#EF4444",
                      },
                      {
                        label: "You Save",
                        val: savKg > 0 ? `${savPct}%` : "—",
                        color: "#10B981",
                      },
                    ].map(k => (
                      <div
                        key={k.label}
                        className="bg-white/5 rounded-xl p-3 text-center border border-white/5"
                      >
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {k.label}
                        </p>
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={k.val}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-bold"
                            style={{ color: k.color }}
                          >
                            {k.val}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  {/* Sliders */}
                  {sliders.map(s => {
                    const pct = ((simAdj[s.key] as number) / s.max) * 100;
                    return (
                      <div
                        key={s.key as string}
                        className="py-3 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center"
                            style={{
                              background: `${s.color}20`,
                              color: s.color,
                            }}
                          >
                            {s.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-slate-300">
                                {s.label}
                              </span>
                              <span
                                className="text-xs font-bold tabular-nums"
                                style={{ color: s.color }}
                              >
                                {simAdj[s.key] as number}%
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500">
                              {s.sub}
                            </p>
                          </div>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-white/10">
                          <motion.div
                            className="absolute top-0 left-0 h-1.5 rounded-full"
                            style={{ background: s.color }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.1 }}
                          />
                          <input
                            type="range"
                            min={0}
                            max={s.max}
                            value={simAdj[s.key] as number}
                            onChange={e =>
                              setSimAdj(p => ({
                                ...p,
                                [s.key]: +e.target.value,
                              }))
                            }
                            className="absolute inset-0 w-full opacity-0 cursor-pointer h-1.5"
                            style={{ zIndex: 10 }}
                          />
                          {pct > 0 && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-md pointer-events-none"
                              style={{
                                left: `calc(${pct}% - 7px)`,
                                background: s.color,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Toggles */}
                  {[
                    {
                      key: "addSolar" as keyof SimAdj,
                      label: "Switch to Solar",
                      sub: "Cuts energy CO₂ by 25%",
                      color: "#F59E0B",
                      icon: <Zap className="w-3.5 h-3.5" />,
                    },
                    {
                      key: "goVeg" as keyof SimAdj,
                      label: "Go Vegetarian",
                      sub: "Switches diet baseline",
                      color: "#10B981",
                      icon: <Leaf className="w-3.5 h-3.5" />,
                    },
                  ].map(t => (
                    <div
                      key={t.key as string}
                      className="py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: `${t.color}20`, color: t.color }}
                        >
                          {t.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-300">
                            {t.label}
                          </p>
                          <p className="text-[10px] text-slate-500">{t.sub}</p>
                        </div>
                        <button
                          onClick={() =>
                            setSimAdj(p => ({ ...p, [t.key]: !p[t.key] }))
                          }
                          className="relative w-9 h-5 rounded-full transition-colors duration-200"
                          style={{
                            background: simAdj[t.key] ? t.color : "#334155",
                          }}
                          role="switch"
                          aria-checked={simAdj[t.key] as boolean}
                        >
                          <span
                            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                            style={{
                              transform: simAdj[t.key]
                                ? "translateX(16px)"
                                : "translateX(0)",
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + breakdown */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Bar chart */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Emissions by Category
                    </p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={barData}
                        barCategoryGap="30%"
                        barGap={3}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="cat"
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <RechartTooltip
                          cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid #1e293b",
                            borderRadius: "10px",
                            fontSize: 12,
                            color: "#e2e8f0",
                          }}
                          itemStyle={{ color: "#e2e8f0" }}
                          formatter={(v: number) => [`${v.toFixed(1)} kg`]}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: 11,
                            color: "#64748b",
                            paddingTop: 8,
                          }}
                        />
                        <Bar
                          dataKey="current"
                          name="Current"
                          radius={[4, 4, 0, 0]}
                        >
                          {barData.map((d, i) => (
                            <Cell key={i} fill={`${d.fill}44`} />
                          ))}
                        </Bar>
                        <Bar
                          dataKey="projected"
                          name="Projected"
                          radius={[4, 4, 0, 0]}
                        >
                          {barData.map((d, i) => (
                            <Cell key={i} fill={d.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Per-category savings */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Savings Breakdown
                    </p>
                    <div className="space-y-3">
                      {barData.map(d => {
                        const saving = d.current - d.projected;
                        const pct =
                          d.current > 0
                            ? Math.round((saving / d.current) * 100)
                            : 0;
                        const barW =
                          d.current > 0
                            ? Math.max(
                                0,
                                Math.min(100, (d.projected / d.current) * 100)
                              )
                            : 100;
                        return (
                          <div key={d.cat}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-400">
                                {d.cat}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-slate-500">
                                  {d.current.toFixed(1)}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-600" />
                                <span
                                  className="font-bold"
                                  style={{ color: d.fill }}
                                >
                                  {d.projected.toFixed(1)} kg
                                </span>
                                {saving > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                    −{pct}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <div
                              className="relative h-1.5 rounded-full overflow-hidden"
                              style={{ background: `${d.fill}22` }}
                            >
                              <motion.div
                                className="h-1.5 rounded-full"
                                style={{ background: d.fill }}
                                animate={{ width: `${barW}%` }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Annual projection — only when saving */}
                  <AnimatePresence>
                    {savKg > 0 && (
                      <motion.div
                        key="annual"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        className="rounded-xl p-4 border border-emerald-500/20"
                        style={{
                          background:
                            "linear-gradient(135deg,rgba(16,185,129,0.1),rgba(5,150,105,0.05))",
                        }}
                      >
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                          Annual Projection
                        </p>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {[
                            {
                              label: "CO₂ Saved/yr",
                              val: `${(savKg * 12).toFixed(0)} kg`,
                            },
                            {
                              label: "Trees equiv.",
                              val: `${Math.round((savKg * 12) / 21)}`,
                            },
                            { label: "Reduction", val: `${savPct}%` },
                          ].map(s => (
                            <div key={s.label}>
                              <AnimatePresence mode="wait">
                                <motion.p
                                  key={s.val}
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 4 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-lg font-bold text-emerald-400"
                                >
                                  {s.val}
                                </motion.p>
                              </AnimatePresence>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {s.label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })()}
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Users, Target, Calculator, Star } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

type Period = "week" | "month" | "all";

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  city: string | null;
  latest_footprint: number;
  first_footprint: number;
  improvement_pct: number;
  hasPrevious: boolean;
  completed_goals: number;
  isCurrentUser: boolean;
}

interface ReportRow {
  user_id: string;
  total_co2e: number;
  created_at: string;
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setEntries([]);
      setLoading(false);
      return;
    }

    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, city");
      const { data: reports } = await supabase
        .from("footprint_reports")
        .select("user_id, total_co2e, created_at")
        .order("created_at", { ascending: true });
      const { data: goals } = await supabase
        .from("goals")
        .select("user_id, status, completed_at");

      if (!profiles || !reports) {
        setEntries([]);
        return;
      }

      const periodStart =
        period === "week"
          ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : period === "month"
            ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            : null;

      const visibleReports = (reports as ReportRow[]).filter(report => {
        if (!periodStart) return true;
        return new Date(report.created_at) >= periodStart;
      });

      // Group each user's reports chronologically
      const userReportsMap: Record<string, number[]> = {};
      visibleReports.forEach(r => {
        if (!userReportsMap[r.user_id]) userReportsMap[r.user_id] = [];
        userReportsMap[r.user_id].push(r.total_co2e);
      });

      const userGoals: Record<string, number> = {};
      (goals || []).forEach(g => {
        if (g.status === "completed") {
          if (
            periodStart &&
            (!g.completed_at || new Date(g.completed_at) < periodStart)
          )
            return;
          userGoals[g.user_id] = (userGoals[g.user_id] || 0) + 1;
        }
      });

      const leaderboard: LeaderboardEntry[] = profiles
        .map(p => {
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
            city: p.city,
            latest_footprint: Math.round(latest * 100) / 100,
            first_footprint: previous
              ? Math.round(previous * 100) / 100
              : Math.round(latest * 100) / 100,
            improvement_pct: improvement,
            hasPrevious,
            completed_goals: userGoals[p.id] || 0,
            isCurrentUser: user?.id === p.id,
          };
        })
        .filter(
          (e): e is LeaderboardEntry => e !== null && e.latest_footprint > 0
        );

      leaderboard.sort((a, b) => {
        // Primary: lowest footprint
        return a.latest_footprint - b.latest_footprint;
      });

      setEntries(leaderboard);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();

    if (!isSupabaseConfigured) return;

    // Real-time channel subscription for instant leaderboard updates
    const channel = supabase
      .channel("leaderboard_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "footprint_reports" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  const currentUserEntry = entries.find(e => e.isCurrentUser);
  const currentUserRank = currentUserEntry
    ? entries.indexOf(currentUserEntry) + 1
    : null;

  const rankMedals = ["🥇", "🥈", "🥉"];
  const rankColors = ["bg-amber-400", "bg-slate-300", "bg-amber-600"];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Community Leaderboard
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Ranked by improvement, not perfection. Everyone starts somewhere.
          </p>
        </div>

        {/* Period Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(["week", "month", "all"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p === "all"
                  ? "All Time"
                  : p === "week"
                    ? "This Week"
                    : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Current User Status Banner */}
        {user && (
          <div
            className={`mb-6 rounded-2xl p-4 border ${
              currentUserEntry
                ? "bg-emerald-50 border-emerald-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm ${
                    currentUserEntry ? "bg-emerald-600" : "bg-amber-500"
                  }`}
                >
                  {currentUserRank
                    ? currentUserRank <= 3
                      ? rankMedals[currentUserRank - 1]
                      : `#${currentUserRank}`
                    : "?"}
                </div>
                <div>
                  {currentUserEntry ? (
                    <>
                      <p className="text-sm font-semibold text-emerald-800">
                        You are ranked <strong>#{currentUserRank}</strong> on
                        the leaderboard!
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        {currentUserEntry.hasPrevious
                          ? currentUserEntry.improvement_pct > 0
                            ? `↑ ${currentUserEntry.improvement_pct}% improvement · `
                            : currentUserEntry.improvement_pct < 0
                              ? `↓ ${Math.abs(currentUserEntry.improvement_pct)}% decline · `
                              : ""
                          : ""}
                        {currentUserEntry.latest_footprint} kg CO₂e ·{" "}
                        {currentUserEntry.completed_goals} goals completed
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-amber-800">
                        You are not on the board yet
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Submit your first footprint calculation to appear here.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {!currentUserEntry && (
                <Button
                  size="sm"
                  onClick={() => navigate("/calculator")}
                  className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                >
                  <Calculator className="w-3.5 h-3.5 mr-1.5" />
                  Calculate Now
                </Button>
              )}
            </div>
          </div>
        )}

        {entries.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title={
              isSupabaseConfigured ? "Be the first!" : "Leaderboard unavailable"
            }
            description={
              isSupabaseConfigured
                ? "Complete your first calculation to appear on the leaderboard."
                : "Connect Supabase to load community rankings."
            }
            action={
              isSupabaseConfigured
                ? {
                    label: "Start Calculator",
                    onClick: () => navigate("/calculator"),
                  }
                : undefined
            }
          />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">User</div>
              <div className="col-span-2 text-right">Latest</div>
              <div className="col-span-3 text-right">Improvement</div>
              <div className="col-span-2 text-right">Goals</div>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => (
              <div
                key={entry.user_id}
                className={`grid grid-cols-12 gap-2 px-4 py-4 border-b border-slate-50 last:border-0 items-center hover:bg-slate-50/50 transition-colors ${
                  entry.isCurrentUser
                    ? "bg-emerald-50/60 border-l-4 border-l-emerald-400"
                    : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1">
                  {i < 3 ? (
                    <div
                      className={`w-8 h-8 rounded-full ${rankColors[i]} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                    >
                      {i + 1}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium">
                      {i + 1}
                    </div>
                  )}
                </div>

                {/* User */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        entry.isCurrentUser
                          ? "bg-emerald-200"
                          : "bg-emerald-100"
                      }`}
                    >
                      <span className="text-sm font-bold text-emerald-700">
                        {entry.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {entry.full_name}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                            You
                          </span>
                        )}
                      </p>
                      {entry.city && (
                        <p className="text-xs text-slate-400 truncate">
                          {entry.city}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Latest Footprint */}
                <div className="col-span-2 text-right">
                  <span className="text-sm font-semibold text-slate-700">
                    {entry.latest_footprint}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">kg</span>
                </div>

                {/* Improvement */}
                <div className="col-span-3 text-right">
                  {entry.hasPrevious ? (
                    entry.improvement_pct > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                        ↑ {entry.improvement_pct}%
                      </span>
                    ) : entry.improvement_pct < 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-500">
                        ↓ {Math.abs(entry.improvement_pct)}%
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>

                {/* Goals */}
                <div className="col-span-2 text-right">
                  <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                    <Target className="w-3.5 h-3.5" />
                    {entry.completed_goals}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {entries.length > 0 && (
          <div className="mt-4 flex items-center gap-2 justify-center text-xs text-slate-400">
            <Star className="w-3.5 h-3.5" />
            <span>
              Ranked by % improvement in CO₂ emissions, then lowest footprint
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

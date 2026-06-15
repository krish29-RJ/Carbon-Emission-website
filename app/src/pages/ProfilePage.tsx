import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  Home,
  Mail,
  Edit3,
  Check,
  X,
  Leaf,
  Target,
  Award,
  BarChart3,
  Calendar,
  TrendingDown,
  TrendingUp,
  Calculator,
  ChevronRight,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Report {
  id: string;
  total_co2e: number;
  transport_co2e: number;
  energy_co2e: number;
  food_co2e: number;
  lifestyle_co2e: number;
  created_at: string;
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
}

const categoryColors: Record<string, string> = {
  transport: "text-sky-600 bg-sky-50",
  energy: "text-orange-600 bg-orange-50",
  food: "text-emerald-600 bg-emerald-50",
  lifestyle: "text-violet-600 bg-violet-50",
};

const avatarPresets = [
  { name: "Initials Fallback", url: "" },
  {
    name: "Eco Leaf",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=150&auto=format&fit=crop&q=60",
  },
  {
    name: "Sunlight",
    url: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=150&auto=format&fit=crop&q=60",
  },
  {
    name: "Ocean Wave",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=150&auto=format&fit=crop&q=60",
  },
  {
    name: "Mountain",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=150&auto=format&fit=crop&q=60",
  },
  {
    name: "Blossom",
    url: "https://images.unsplash.com/photo-1522748906645-95d8adfd52c7?w=150&auto=format&fit=crop&q=60",
  },
];

const bannerPresets = [
  { name: "Default Gradient", url: "" },
  {
    name: "Deep Forest",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Snowy Peak",
    url: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Sunny Beach",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Desert Oasis",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=60",
  },
  {
    name: "Aurora Sky",
    url: "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=800&auto=format&fit=crop&q=60",
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [activeGoalsCount, setActiveGoalsCount] = useState(0);
  const [completedGoalsCount, setCompletedGoalsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editHousehold, setEditHousehold] = useState(1);
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [editBannerUrl, setEditBannerUrl] = useState("");
  const [showCustomUrls, setShowCustomUrls] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const [reportsRes, allBadgesRes, userBadgesRes, goalsRes] =
      await Promise.all([
        supabase
          .from("footprint_reports")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("badges").select("*"),
        supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
        supabase.from("goals").select("id, status").eq("user_id", user.id),
      ]);

    setReports((reportsRes.data as Report[]) || []);

    const earnedIds = new Set(
      (userBadgesRes.data || []).map(ub => ub.badge_id)
    );
    const rawBadges = (allBadgesRes.data || []) as any[];
    setBadges(
      rawBadges.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        category: b.category,
        earned: earnedIds.has(b.id),
      }))
    );

    const goals = goalsRes.data || [];
    setActiveGoalsCount(goals.filter(g => g.status === "active").length);
    setCompletedGoalsCount(goals.filter(g => g.status === "completed").length);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startEditing = () => {
    setEditName(profile?.full_name || "");
    setEditCity(profile?.city || "");
    setEditHousehold(profile?.household_size || 1);
    setEditAvatarUrl(profile?.avatar_url || "");
    setEditBannerUrl(profile?.banner_url || "");
    setShowCustomUrls(false);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveProfile = async () => {
    if (!user || !isSupabaseConfigured) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName.trim() || null,
        city: editCity.trim() || null,
        household_size: editHousehold,
        avatar_url: editAvatarUrl.trim() || null,
        banner_url: editBannerUrl.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile.");
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
      setEditing(false);
    }
    setSaving(false);
  };

  const latestReport = reports[0];
  const previousReport = reports[1];
  const trend =
    latestReport && previousReport
      ? Math.round(
          ((latestReport.total_co2e - previousReport.total_co2e) /
            previousReport.total_co2e) *
            100
        )
      : null;

  const earnedBadges = badges.filter(b => b.earned);
  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  const memberSince = user?.created_at
    ? format(parseISO(user.created_at), "MMMM yyyy")
    : "Recently";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-16 px-4 light text-foreground">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Hero Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {/* Banner image or fallback gradient */}
          <div className="h-28 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 relative overflow-hidden">
            {editing ? (
              editBannerUrl ? (
                <img
                  src={editBannerUrl}
                  alt="Banner Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                    backgroundSize: "30px 30px",
                  }}
                />
              )
            ) : profile?.banner_url ? (
              <img
                src={profile.banner_url}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                  {editing ? (
                    editAvatarUrl ? (
                      <img
                        src={editAvatarUrl}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">
                          {initials}
                        </span>
                      </div>
                    )
                  ) : profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
                {earnedBadges.length > 0 && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white">
                    <Award className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="border-slate-200 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEdit}
                    className="border-slate-200"
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {saving ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Info / Edit Form */}
            {!editing ? (
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {user?.email}
                  </span>
                  {profile?.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {profile.city}
                    </span>
                  )}
                  {profile?.household_size && (
                    <span className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" /> {profile.household_size}{" "}
                      {profile.household_size === 1 ? "person" : "people"}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Member since{" "}
                    {memberSince}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4 mt-2">
                  <div>
                    <Label
                      htmlFor="editName"
                      className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="editName"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="editCity"
                      className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      City
                    </Label>
                    <Input
                      id="editCity"
                      value={editCity}
                      onChange={e => setEditCity(e.target.value)}
                      placeholder="Your city"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="editHousehold"
                      className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
                    >
                      Household Size
                    </Label>
                    <select
                      id="editHousehold"
                      value={editHousehold}
                      onChange={e => setEditHousehold(parseInt(e.target.value))}
                      className="mt-1.5 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "person" : "people"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 space-y-6 border-t border-slate-100 pt-6">
                  {/* Profile Picture (Avatar) Selector */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                      Choose Profile Picture
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {avatarPresets.map(av => (
                        <button
                          key={av.name}
                          type="button"
                          onClick={() => setEditAvatarUrl(av.url)}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            editAvatarUrl === av.url
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-105"
                              : "border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                          title={av.name}
                        >
                          {av.url ? (
                            <img
                              src={av.url}
                              alt={av.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {initials}
                              </span>
                            </div>
                          )}
                          {editAvatarUrl === av.url && (
                            <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banner Selector */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                      Choose Profile Banner
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {bannerPresets.map(bp => (
                        <button
                          key={bp.name}
                          type="button"
                          onClick={() => setEditBannerUrl(bp.url)}
                          className={`relative h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            editBannerUrl === bp.url
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 scale-105"
                              : "border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                          title={bp.name}
                        >
                          {bp.url ? (
                            <img
                              src={bp.url}
                              alt={bp.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400" />
                          )}
                          {editBannerUrl === bp.url && (
                            <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Custom URL fields */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCustomUrls(!showCustomUrls)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      {showCustomUrls
                        ? "Hide Custom Image URL Inputs"
                        : "Use Custom Image URLs"}
                    </button>

                    {showCustomUrls && (
                      <div className="grid sm:grid-cols-2 gap-4 mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <Label
                            htmlFor="customAvatar"
                            className="text-xs font-semibold text-slate-500"
                          >
                            Custom Avatar Image URL
                          </Label>
                          <Input
                            id="customAvatar"
                            value={editAvatarUrl}
                            onChange={e => setEditAvatarUrl(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="customBanner"
                            className="text-xs font-semibold text-slate-500"
                          >
                            Custom Banner Image URL
                          </Label>
                          <Input
                            id="customBanner"
                            value={editBannerUrl}
                            onChange={e => setEditBannerUrl(e.target.value)}
                            placeholder="https://example.com/banner.jpg"
                            className="mt-1 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              label: "Calculations",
              value: reports.length,
              icon: <Calculator className="w-5 h-5 text-sky-600" />,
              iconBg: "bg-sky-50",
              sub:
                reports.length === 0
                  ? "None yet"
                  : `Latest: ${latestReport?.total_co2e ?? "-"} kg`,
            },
            {
              label: "Active Goals",
              value: activeGoalsCount,
              icon: <Target className="w-5 h-5 text-emerald-600" />,
              iconBg: "bg-emerald-50",
              sub: `${completedGoalsCount} completed`,
            },
            {
              label: "Badges Earned",
              value: earnedBadges.length,
              icon: <Award className="w-5 h-5 text-amber-600" />,
              iconBg: "bg-amber-50",
              sub: `${badges.length - earnedBadges.length} remaining`,
            },
            {
              label: "CO₂ Trend",
              value: trend !== null ? `${Math.abs(trend)}%` : "—",
              icon:
                trend !== null && trend < 0 ? (
                  <TrendingDown className="w-5 h-5 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-red-500" />
                ),
              iconBg:
                trend !== null && trend < 0 ? "bg-emerald-50" : "bg-red-50",
              sub:
                trend !== null
                  ? trend < 0
                    ? "Improvement!"
                    : "Needs attention"
                  : "Need 2+ calculations",
              valueColor:
                trend !== null
                  ? trend < 0
                    ? "text-emerald-700"
                    : "text-red-600"
                  : "text-slate-400",
            },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div
                className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3`}
              >
                {stat.icon}
              </div>
              <p
                className={`text-2xl font-bold mb-0.5 ${stat.valueColor ?? "text-slate-900"}`}
              >
                {stat.value}
              </p>
              <p className="text-xs font-semibold text-slate-700">
                {stat.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Bottom Row: Badges + Recent Calculations */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Badges Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">
                Achievements
              </h3>
              {earnedBadges.length > 0 && (
                <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  {earnedBadges.length}/{badges.length}
                </span>
              )}
            </div>

            {badges.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Complete calculations to earn badges!
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/calculator")}
                  className="mt-3 border-emerald-500 text-emerald-700"
                >
                  Start Calculator
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {badges.map(badge => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-center ${
                      badge.earned
                        ? "border-amber-200 bg-amber-50 shadow-sm"
                        : "border-slate-100 bg-slate-50 opacity-40 grayscale"
                    }`}
                  >
                    <span className="text-2xl mb-1">{badge.icon}</span>
                    <p
                      className={`text-[10px] font-semibold leading-tight ${badge.earned ? "text-amber-700" : "text-slate-400"}`}
                    >
                      {badge.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Recent Calculations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  Recent Calculations
                </h3>
              </div>
              <button
                onClick={() => navigate("/calculator")}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                New <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-10">
                <Leaf className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1 font-medium">
                  No calculations yet
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Track your carbon footprint to get started.
                </p>
                <Button
                  onClick={() => navigate("/calculator")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Calculator className="w-4 h-4 mr-2" /> Start Calculator
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map((report, i) => {
                  const prevReport = reports[i + 1];
                  const change = prevReport
                    ? Math.round(
                        ((report.total_co2e - prevReport.total_co2e) /
                          prevReport.total_co2e) *
                          100
                      )
                    : null;
                  return (
                    <div
                      key={report.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-700">
                          #{reports.length - i}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400">
                          {format(
                            parseISO(report.created_at),
                            "MMM d, yyyy · h:mm a"
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {(
                            [
                              "transport",
                              "energy",
                              "food",
                              "lifestyle",
                            ] as const
                          ).map(cat => {
                            const val =
                              cat === "transport"
                                ? report.transport_co2e
                                : cat === "energy"
                                  ? report.energy_co2e
                                  : cat === "food"
                                    ? report.food_co2e
                                    : report.lifestyle_co2e;
                            return (
                              <span
                                key={cat}
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${categoryColors[cat]}`}
                              >
                                {val}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-slate-900">
                          {report.total_co2e}
                        </p>
                        <p className="text-[10px] text-slate-400">kg CO₂e</p>
                      </div>
                      {change !== null && (
                        <div
                          className={`flex items-center gap-0.5 text-xs font-semibold ${change <= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {change <= 0 ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <TrendingUp className="w-3.5 h-3.5" />
                          )}
                          {Math.abs(change)}%
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              label: "Go to Dashboard",
              sub: "View your full footprint overview",
              icon: <BarChart3 className="w-5 h-5" />,
              path: "/dashboard",
              color: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
            },
            {
              label: "Browse Actions",
              sub: "Accept challenges to reduce emissions",
              icon: <Target className="w-5 h-5" />,
              path: "/actions",
              color: "text-sky-700 bg-sky-50 hover:bg-sky-100",
            },
            {
              label: "Run Simulator",
              sub: "Explore what-if scenarios",
              icon: <Leaf className="w-5 h-5" />,
              path: "/simulator",
              color: "text-violet-700 bg-violet-50 hover:bg-violet-100",
            },
          ].map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 ${action.color} transition-all duration-200 text-left group hover:shadow-md`}
            >
              <div className="shrink-0">{action.icon}</div>
              <div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{action.sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto opacity-40 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

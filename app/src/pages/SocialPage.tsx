import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Trophy,
  Flame,
  Plus,
  X,
  Crown,
  Leaf,
  Target,
  TrendingDown,
  Share2,
  Copy,
  CheckCheck,
  Star,
  Zap,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CircleMember {
  name: string;
  avatar: string;
  xp: number;
  monthlyKg: number;
  streak: number;
  level: string;
  change: number; // % change from last week
}

interface Circle {
  id: string;
  name: string;
  emoji: string;
  goal: number; // monthly kg CO2e goal
  current: number;
  members: CircleMember[];
  category: string;
}

// ─── Static Demo Data ─────────────────────────────────────────────────────────
const DEMO_CIRCLES: Circle[] = [
  {
    id: "hostel-a",
    name: "Hostel A Green Squad",
    emoji: "🏠",
    goal: 800,
    current: 612,
    category: "Residence",
    members: [
      {
        name: "Riya S.",
        avatar: "R",
        xp: 2340,
        monthlyKg: 88,
        streak: 14,
        level: "Forest Guardian",
        change: -22,
      },
      {
        name: "Arjun K.",
        avatar: "A",
        xp: 1890,
        monthlyKg: 115,
        streak: 9,
        level: "Tree",
        change: -11,
      },
      {
        name: "Meera P.",
        avatar: "M",
        xp: 1650,
        monthlyKg: 132,
        streak: 7,
        level: "Tree",
        change: -5,
      },
      {
        name: "Dev T.",
        avatar: "D",
        xp: 980,
        monthlyKg: 189,
        streak: 3,
        level: "Sapling",
        change: +8,
      },
      {
        name: "Nisha R.",
        avatar: "N",
        xp: 720,
        monthlyKg: 88,
        streak: 2,
        level: "Seedling",
        change: -3,
      },
    ],
  },
  {
    id: "engineering-dept",
    name: "Engineering Department",
    emoji: "⚙️",
    goal: 2000,
    current: 1430,
    category: "Academic",
    members: [
      {
        name: "Prof. Shah",
        avatar: "S",
        xp: 3100,
        monthlyKg: 72,
        streak: 21,
        level: "Forest Guardian",
        change: -30,
      },
      {
        name: "Kabir M.",
        avatar: "K",
        xp: 2200,
        monthlyKg: 98,
        streak: 12,
        level: "Forest Guardian",
        change: -18,
      },
      {
        name: "Priya G.",
        avatar: "P",
        xp: 1700,
        monthlyKg: 141,
        streak: 8,
        level: "Tree",
        change: -7,
      },
      {
        name: "Rahul V.",
        avatar: "R",
        xp: 1100,
        monthlyKg: 176,
        streak: 5,
        level: "Sapling",
        change: +2,
      },
      {
        name: "Anjali B.",
        avatar: "A",
        xp: 890,
        monthlyKg: 198,
        streak: 3,
        level: "Seedling",
        change: -1,
      },
      {
        name: "Tejas L.",
        avatar: "T",
        xp: 450,
        monthlyKg: 745,
        streak: 1,
        level: "Seedling",
        change: +15,
      },
    ],
  },
];

// Circles the user hasn't joined yet
const DISCOVER_CIRCLES = [
  {
    name: "Vegan Warriors 🌱",
    members: 34,
    goal: 50,
    category: "Diet",
    emoji: "🌱",
  },
  {
    name: "Metro Champions 🚇",
    members: 56,
    goal: 120,
    category: "Transport",
    emoji: "🚇",
  },
  {
    name: "Zero Waste Lab ♻️",
    members: 18,
    goal: 40,
    category: "Lifestyle",
    emoji: "♻️",
  },
  {
    name: "Solar Rooftop Club ☀️",
    members: 12,
    goal: 30,
    category: "Energy",
    emoji: "☀️",
  },
];

const LEVEL_COLORS: Record<string, string> = {
  Seedling: "#94a3b8",
  Sapling: "#34d399",
  Tree: "#10b981",
  "Forest Guardian": "#f59e0b",
};

const LEADERBOARD_MEDALS = ["🥇", "🥈", "🥉"];

function getLevelEmoji(level: string) {
  const map: Record<string, string> = {
    Seedling: "🌱",
    Sapling: "🌿",
    Tree: "🌳",
    "Forest Guardian": "🌲",
  };
  return map[level] || "🌱";
}

// ─── Create Circle Modal ──────────────────────────────────────────────────────
function CreateCircleModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(500);
  const [emoji, setEmoji] = useState("🌿");
  const EMOJIS = ["🌿", "🏠", "⚙️", "🚇", "☀️", "♻️", "🌊", "🏔️"];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative glass-card-neon rounded-2xl p-6 w-full max-w-md border border-emerald-500/20"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Create a Circle</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Pick an Emoji
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-xl transition-all ${
                    emoji === e
                      ? "bg-emerald-500/20 border border-emerald-500/40"
                      : "bg-slate-800 hover:bg-slate-700"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Circle Name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Hostel B Eco Team"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Monthly Goal:{" "}
              <span className="text-emerald-400 font-bold">{goal} kg CO₂e</span>
            </label>
            <input
              type="range"
              min={100}
              max={5000}
              step={100}
              value={goal}
              onChange={e => setGoal(Number(e.target.value))}
              className="w-full"
              aria-label="Monthly carbon goal"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>100 kg</span>
              <span>5000 kg</span>
            </div>
          </div>

          <Button
            disabled={!name.trim()}
            onClick={onClose}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold py-2.5 rounded-xl disabled:opacity-40"
          >
            Create {emoji} {name || "Circle"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Share Card ───────────────────────────────────────────────────────────────
function ShareCard({
  circle,
  onClose,
}: {
  circle: Circle;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `Join our CarbonWise circle "${circle.name}"! We're tracking our footprint together 🌍`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topMember = circle.members[0];
  const totalSaved = circle.members.reduce(
    (s, m) => s + Math.abs((Math.min(m.change, 0) * m.monthlyKg) / 100),
    0
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Shareable Card Design */}
        <div
          id="share-card"
          className="rounded-2xl p-6 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #022c22 0%, #042f2e 50%, #0f172a 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-400 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-cyan-400 blur-2xl" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{circle.emoji}</span>
                <div>
                  <p className="font-bold text-sm">{circle.name}</p>
                  <p className="text-xs text-emerald-400">
                    {circle.members.length} members
                  </p>
                </div>
              </div>
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                {
                  label: "CO₂ This Month",
                  value: `${circle.current} kg`,
                  icon: Globe,
                },
                {
                  label: "Avg Reduction",
                  value: `${Math.abs(Math.round(circle.members.reduce((s, m) => s + m.change, 0) / circle.members.length))}%`,
                  icon: TrendingDown,
                },
                {
                  label: "Total Saved",
                  value: `${totalSaved.toFixed(0)} kg`,
                  icon: Leaf,
                },
              ].map(s => (
                <div
                  key={s.label}
                  className="bg-white/5 rounded-xl p-2.5 text-center"
                >
                  <p className="text-lg font-extrabold text-emerald-400">
                    {s.value}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
              <Crown className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-xs font-semibold">
                  {topMember.name} leads with {topMember.monthlyKg} kg/mo
                </p>
                <p className="text-[10px] text-slate-400">
                  {topMember.streak} day streak ·{" "}
                  {getLevelEmoji(topMember.level)} {topMember.level}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
              <p className="text-[10px] text-slate-500">
                CarbonWise — carbonwise.app
              </p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <span className="text-[10px] text-emerald-400">Live data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl glass-card text-sm font-semibold transition-all hover:border-white/20"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function SocialPage() {
  const [selectedCircle, setSelectedCircle] = useState<Circle>(DEMO_CIRCLES[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [joined, setJoined] = useState<Set<string>>(new Set());

  const goalProgress = Math.min(
    (selectedCircle.current / selectedCircle.goal) * 100,
    100
  );
  const avgChange =
    selectedCircle.members.reduce((s, m) => s + m.change, 0) /
    selectedCircle.members.length;

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-20 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Social Circles
              </h1>
              <p className="text-sm text-slate-400">
                Track, compete, and reduce together
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            New Circle
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Sidebar: My Circles */}
          <div className="lg:col-span-4 space-y-4">
            {/* My Circles */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                My Circles
              </h2>
              <div className="space-y-2">
                {DEMO_CIRCLES.map(circle => {
                  const pct = Math.min(
                    (circle.current / circle.goal) * 100,
                    100
                  );
                  const isSelected = selectedCircle.id === circle.id;
                  return (
                    <motion.button
                      key={circle.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedCircle(circle)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? "glass-card-neon border-emerald-500/30 bg-emerald-500/5"
                          : "glass-card border-white/5 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{circle.emoji}</span>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {circle.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {circle.members.length} members ·{" "}
                              {circle.category}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{circle.current} kg</span>
                        <span>Goal: {circle.goal} kg</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: pct > 80 ? "#ef4444" : "#10b981",
                          }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Discover */}
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
                Discover Circles
              </h2>
              <div className="space-y-2">
                {DISCOVER_CIRCLES.map(c => (
                  <div
                    key={c.name}
                    className="glass-card rounded-xl p-3 border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {c.members} members
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setJoined(prev => {
                          const s = new Set(prev);
                          if (s.has(c.name)) {
                            s.delete(c.name);
                          } else {
                            s.add(c.name);
                          }
                          return s;
                        })
                      }
                      className={`text-[10px] font-semibold px-3 py-1 rounded-lg transition-all ${
                        joined.has(c.name)
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 hover:text-white border border-white/8"
                      }`}
                    >
                      {joined.has(c.name) ? "✓ Joined" : "Join"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main: Circle Detail */}
          <div className="lg:col-span-8 space-y-4">
            {/* Circle Header */}
            <motion.div
              key={selectedCircle.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card-neon rounded-2xl p-6 border border-emerald-500/20"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-3xl">{selectedCircle.emoji}</span>
                    <h2 className="text-xl font-bold">{selectedCircle.name}</h2>
                  </div>
                  <p className="text-sm text-slate-400">
                    {selectedCircle.members.length} members ·{" "}
                    {selectedCircle.category}
                  </p>
                </div>
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card text-sm text-slate-400 hover:text-white transition-all border border-white/8 hover:border-white/20"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  {
                    label: "Total This Month",
                    value: `${selectedCircle.current} kg`,
                    icon: Globe,
                    color: "#10b981",
                  },
                  {
                    label: "Avg Change",
                    value: `${avgChange > 0 ? "+" : ""}${avgChange.toFixed(1)}%`,
                    icon: TrendingDown,
                    color: avgChange < 0 ? "#10b981" : "#ef4444",
                  },
                  {
                    label: "Goal Remaining",
                    value: `${Math.max(0, selectedCircle.goal - selectedCircle.current)} kg`,
                    icon: Target,
                    color: "#06b6d4",
                  },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-slate-800/40 rounded-xl p-3 text-center"
                  >
                    <s.icon
                      className="w-4 h-4 mx-auto mb-1.5"
                      style={{ color: s.color }}
                    />
                    <p
                      className="text-lg font-extrabold"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>Monthly Goal Progress</span>
                  <span className="font-semibold text-white">
                    {goalProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        goalProgress > 80
                          ? "linear-gradient(to right, #ef4444, #dc2626)"
                          : "linear-gradient(to right, #10b981, #06b6d4)",
                    }}
                    animate={{ width: `${goalProgress}%` }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  {goalProgress > 80
                    ? "⚠️ Approaching monthly goal — encourage the team to log green activities!"
                    : `✅ On track! ${(100 - goalProgress).toFixed(0)}% budget remaining this month.`}
                </p>
              </div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              key={selectedCircle.id + "-lb"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl border border-white/5"
            >
              <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-white/5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Leaderboard</h3>
                <span className="ml-auto text-[10px] text-slate-500">
                  Ranked by monthly kg CO₂e ↑
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {selectedCircle.members.map((member, idx) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors"
                  >
                    {/* Rank */}
                    <div className="w-8 text-center">
                      {idx < 3 ? (
                        <span className="text-xl">
                          {LEADERBOARD_MEDALS[idx]}
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-slate-500">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        background: `${LEVEL_COLORS[member.level]}20`,
                        color: LEVEL_COLORS[member.level],
                      }}
                    >
                      {member.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {member.name}
                        </span>
                        <span className="text-xs">
                          {getLevelEmoji(member.level)}
                        </span>
                        {idx === 0 && (
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] text-slate-500">
                            {member.streak}d streak
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          <span className="text-[10px] text-slate-500">
                            {member.xp} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star
                            className="w-3 h-3"
                            style={{ color: LEVEL_COLORS[member.level] }}
                          />
                          <span
                            className="text-[10px]"
                            style={{ color: LEVEL_COLORS[member.level] }}
                          >
                            {member.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footprint */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white">
                        {member.monthlyKg} kg
                      </p>
                      <p
                        className={`text-[10px] font-semibold ${member.change < 0 ? "text-emerald-400" : "text-red-400"}`}
                      >
                        {member.change < 0 ? "↓" : "↑"}{" "}
                        {Math.abs(member.change)}% vs last month
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateCircleModal onClose={() => setShowCreate(false)} />
        )}
        {showShare && (
          <ShareCard
            circle={selectedCircle}
            onClose={() => setShowShare(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

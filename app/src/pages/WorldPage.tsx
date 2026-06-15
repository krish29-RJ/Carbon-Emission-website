import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Globe, TrendingDown, Zap, Info } from "lucide-react";
import EcoWorld from "@/components/EcoWorld";

const PRESETS = [
  {
    label: "Eco Champion 🌿",
    total: 180,
    transport: 30,
    energy: 60,
    food: 50,
    lifestyle: 40,
    renewable: true,
  },
  {
    label: "City Average 🏙️",
    total: 520,
    transport: 140,
    energy: 180,
    food: 120,
    lifestyle: 80,
    renewable: false,
  },
  {
    label: "Heavy Carbon 🏭",
    total: 1350,
    transport: 420,
    energy: 480,
    food: 280,
    lifestyle: 170,
    renewable: false,
  },
];

const TIPS = [
  {
    level: "low",
    icon: "🌱",
    text: "Your eco-island is thriving! Clean skies, lush forests, and zero-emission transit.",
  },
  {
    level: "moderate",
    icon: "⚠️",
    text: "Some haze in the sky. A few lifestyle changes can bring back the blue.",
  },
  {
    level: "high",
    icon: "🏭",
    text: "Heavy smog and dead trees. Major shifts in transport and energy needed.",
  },
];

export default function WorldPage() {
  const [preset, setPreset] = useState(PRESETS[1]);
  const [transport, setTransport] = useState(preset.transport);
  const [energy, setEnergy] = useState(preset.energy);
  const [food, setFood] = useState(preset.food);
  const [lifestyle, setLifestyle] = useState(preset.lifestyle);
  const [renewable, setRenewable] = useState(preset.renewable);

  const total = transport + energy + food + lifestyle;
  const isLow = total < 500;
  const isHigh = total > 1000;
  const tip = isLow ? TIPS[0] : isHigh ? TIPS[2] : TIPS[1];

  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setPreset(p);
    setTransport(p.transport);
    setEnergy(p.energy);
    setFood(p.food);
    setLifestyle(p.lifestyle);
    setRenewable(p.renewable);
  };

  const sliders = [
    {
      key: "transport",
      label: "Transport",
      value: transport,
      onChange: setTransport,
      max: 600,
      color: "#ef4444",
      icon: "🚗",
    },
    {
      key: "energy",
      label: "Energy",
      value: energy,
      onChange: setEnergy,
      max: 600,
      color: "#f59e0b",
      icon: "⚡",
    },
    {
      key: "food",
      label: "Food & Diet",
      value: food,
      onChange: setFood,
      max: 500,
      color: "#10b981",
      icon: "🥗",
    },
    {
      key: "lifestyle",
      label: "Shopping",
      value: lifestyle,
      onChange: setLifestyle,
      max: 400,
      color: "#8b5cf6",
      icon: "🛍️",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] pt-20 pb-20 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Living World Sandbox
            </h1>
            <p className="text-sm text-slate-400">
              Drag the sliders to watch your eco-island transform in real time
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* World Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-8"
          >
            <EcoWorld
              total={total}
              transport={transport}
              energy={energy}
              food={food}
              lifestyle={lifestyle}
              renewable={renewable}
              interactive={true}
            />

            {/* Status bar */}
            <motion.div
              key={tip.level}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 flex items-center gap-3 p-4 rounded-xl border ${
                isLow
                  ? "bg-emerald-500/8 border-emerald-500/20"
                  : isHigh
                    ? "bg-red-500/8 border-red-500/20"
                    : "bg-amber-500/8 border-amber-500/20"
              }`}
            >
              <span className="text-xl">{tip.icon}</span>
              <div>
                <p className="text-sm font-medium text-white">{tip.text}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Monthly footprint:{" "}
                  <span className="font-semibold text-white">
                    {total} kg CO₂e
                  </span>
                  &nbsp;·&nbsp;India avg: 150 kg · Global avg: 400 kg
                </p>
              </div>
            </motion.div>

            {/* Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    preset.label === p.label
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      : "glass-card text-slate-400 hover:text-white hover:border-white/15"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-4"
          >
            <div className="glass-card-neon rounded-2xl p-5">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Carbon Controls
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Drag or click on the progress bars (scrollers) below to adjust
                  individual carbon values and watch your island transform.
                </p>
              </div>

              <div className="space-y-5">
                {sliders.map(s => (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{s.icon}</span>
                        <span className="text-sm font-medium text-white">
                          {s.label}
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: s.color }}
                      >
                        {s.value} kg
                      </span>
                    </div>
                    <div className="relative h-2 bg-slate-800 rounded-full">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${(s.value / s.max) * 100}%`,
                          background: `linear-gradient(to right, ${s.color}60, ${s.color})`,
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={s.max}
                        step={10}
                        value={s.value}
                        onChange={e => s.onChange(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        style={{ height: "8px", top: 0 }}
                        aria-label={`${s.label} carbon amount`}
                      />
                    </div>
                  </div>
                ))}

                {/* Renewable toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">
                      Renewable Energy
                    </span>
                  </div>
                  <button
                    onClick={() => setRenewable(!renewable)}
                    className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                      renewable ? "bg-emerald-500" : "bg-slate-700"
                    }`}
                    aria-label="Toggle renewable energy"
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                        renewable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Comparison Card */}
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  Impact vs Benchmarks
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Your Footprint",
                    value: total,
                    color: isLow ? "#10b981" : isHigh ? "#ef4444" : "#f59e0b",
                    max: 1400,
                  },
                  {
                    label: "India Avg (150 kg)",
                    value: 150,
                    color: "#06b6d4",
                    max: 1400,
                  },
                  {
                    label: "Global Avg (400 kg)",
                    value: 400,
                    color: "#8b5cf6",
                    max: 1400,
                  },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>{item.label}</span>
                      <span className="font-semibold text-white">
                        {item.value} kg
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                        animate={{
                          width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Click any glowing node on the world to get specific
                    environmental impact tips for that zone.
                  </p>
                </div>
              </div>
            </div>

            {/* Leaf score */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 text-center">
              <Leaf
                className={`w-8 h-8 mx-auto mb-2 ${isLow ? "text-emerald-400" : isHigh ? "text-red-400" : "text-amber-400"}`}
              />
              <p className="text-2xl font-extrabold">
                {isLow ? "A+" : isHigh ? "D" : "B"}
              </p>
              <p className="text-xs text-slate-400 mt-1">Eco Rating</p>
              <p className="text-[10px] text-slate-500 mt-2">
                {isLow
                  ? "Outstanding — top 10% globally"
                  : isHigh
                    ? "High impact — action needed urgently"
                    : "Room to improve with small changes"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

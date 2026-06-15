import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders, RotateCcw, Zap, Car, Utensils, ShoppingBag,
  TrendingDown, Leaf, AlertCircle, ChevronRight, Info
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { calculateFootprint } from '@/lib/calculator';
import type { CalculatorInput } from '@/lib/calculator';

// ─── Defaults & helpers ────────────────────────────────────────────────────────

/** Safe number: returns v if finite, else fallback */
const safeNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return isFinite(n) && !isNaN(n) ? n : fallback;
};

/** Sanitise whatever comes out of Supabase so calculateFootprint never gets NaN */
function sanitiseInput(raw: Record<string, unknown>): CalculatorInput {
  return {
    carKmPerWeek:           safeNum(raw.carKmPerWeek,          80),
    busKmPerWeek:           safeNum(raw.busKmPerWeek,          20),
    metroKmPerWeek:         safeNum(raw.metroKmPerWeek,        10),
    flightHoursPerYear:     safeNum(raw.flightHoursPerYear,     4),
    electricityKwhPerMonth: safeNum(raw.electricityKwhPerMonth,200),
    acHoursPerDay:          safeNum(raw.acHoursPerDay,          4),
    renewableEnergy:        Boolean(raw.renewableEnergy),
    householdSize:          Math.max(1, safeNum(raw.householdSize, 1)),
    dietType:               (['vegan','vegetarian','mixed','meat-heavy'].includes(raw.dietType as string)
                              ? raw.dietType as CalculatorInput['dietType']
                              : 'mixed'),
    meatMealsPerWeek:       safeNum(raw.meatMealsPerWeek,       5),
    foodWasteKgPerWeek:     safeNum(raw.foodWasteKgPerWeek,     1),
    shoppingOrdersPerMonth: safeNum(raw.shoppingOrdersPerMonth, 4),
    deliveryOrdersPerMonth: safeNum(raw.deliveryOrdersPerMonth, 6),
    recyclesOften:          Boolean(raw.recyclesOften),
  };
}

const DEMO_INPUT: CalculatorInput = sanitiseInput({});   // pure defaults

interface Adjustments {
  carToPublic:        number; // 0-100 %
  reduceMeat:         number; // 0-100 %
  reduceElectricity:  number; // 0-30  %
  reduceShopping:     number; // 0-50  %
  reduceDelivery:     number; // 0-50  %
  addSolar:           boolean;
  goVegetarian:       boolean;
}

const DEFAULT_ADJ: Adjustments = {
  carToPublic: 0, reduceMeat: 0, reduceElectricity: 0,
  reduceShopping: 0, reduceDelivery: 0, addSolar: false, goVegetarian: false,
};

function applyAdjustments(base: CalculatorInput, adj: Adjustments): CalculatorInput {
  const shiftedPublic = base.carKmPerWeek * (adj.carToPublic / 100);
  return {
    ...base,
    carKmPerWeek:           Math.max(0, Math.round(base.carKmPerWeek - shiftedPublic)),
    busKmPerWeek:           Math.round(base.busKmPerWeek + shiftedPublic * 0.5),
    metroKmPerWeek:         Math.round(base.metroKmPerWeek + shiftedPublic * 0.5),
    meatMealsPerWeek:       Math.max(0, Math.round(base.meatMealsPerWeek * (1 - adj.reduceMeat / 100))),
    electricityKwhPerMonth: Math.max(0, Math.round(base.electricityKwhPerMonth * (1 - adj.reduceElectricity / 100))),
    shoppingOrdersPerMonth: Math.max(0, Math.round(base.shoppingOrdersPerMonth * (1 - adj.reduceShopping / 100))),
    deliveryOrdersPerMonth: Math.max(0, Math.round(base.deliveryOrdersPerMonth * (1 - adj.reduceDelivery / 100))),
    renewableEnergy:        base.renewableEnergy || adj.addSolar,
    dietType:               adj.goVegetarian && base.dietType !== 'vegan' ? 'vegetarian' : base.dietType,
  };
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl text-sm border border-slate-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: <strong>{Number(p.value).toFixed(1)} kg</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Slider control ──────────────────────────────────────────────────────────
interface SliderProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: number;
  max?: number;
  color: string;
  onChange: (v: number) => void;
}
function SliderRow({ icon, label, sub, value, max = 100, color, onChange }: SliderProps) {
  const pct = (value / max) * 100;
  return (
    <div className="sim-slider-row">
      <div className="flex items-start gap-3">
        <div className="sim-icon-wrap" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
            <span className="text-sm font-bold tabular-nums" style={{ color }}>
              {value}%
            </span>
          </div>
          <div className="relative h-2 rounded-full bg-slate-200 overflow-visible">
            <div
              className="absolute top-0 left-0 h-2 rounded-full transition-all duration-150"
              style={{ width: `${pct}%`, background: color }}
            />
            <input
              type="range" min={0} max={max} value={value}
              onChange={e => onChange(+e.target.value)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-2"
              style={{ zIndex: 10 }}
            />
            {pct > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md border-2 border-white transition-all duration-150"
                style={{ left: `calc(${pct}% - 8px)`, background: color, pointerEvents: 'none' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle control ───────────────────────────────────────────────────────────
function ToggleRow({
  icon, label, sub, value, color, onChange,
}: { icon: React.ReactNode; label: string; sub: string; value: boolean; color: string; onChange: (v: boolean) => void }) {
  return (
    <div className="sim-slider-row">
      <div className="flex items-center gap-3">
        <div className="sim-icon-wrap" style={{ background: `${color}18`, color }}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
        <button
          onClick={() => onChange(!value)}
          className="relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1"
          style={{ background: value ? color : '#CBD5E1', '--tw-ring-color': color } as React.CSSProperties}
          aria-checked={value}
          role="switch"
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
            style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      </div>
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={value.toFixed(decimals)}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.18 }}
        className="tabular-nums"
      >
        {isNaN(value) ? '—' : value.toFixed(decimals)}
      </motion.span>
    </AnimatePresence>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function SimulatorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [baseInput, setBaseInput] = useState<CalculatorInput>(DEMO_INPUT);
  const [isDemo, setIsDemo] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJ);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setLoading(false); return; }
    const userId = user.id;
    async function loadData() {
      try {
        const { data } = await supabase
          .from('footprint_reports')
          .select('input_data, total_co2e')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.input_data) {
          const raw = data.input_data as Record<string, unknown>;
          const safe = sanitiseInput(raw);
          setBaseInput(safe);
          setIsDemo(false);
        }
      } catch (err) {
        console.error('Failed to load footprint input data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const set = useCallback(<K extends keyof Adjustments>(key: K, value: Adjustments[K]) => {
    setAdjustments(prev => ({ ...prev, [key]: value }));
  }, []);

  const currentResult  = calculateFootprint(baseInput);
  const projectedInput = applyAdjustments(baseInput, adjustments);
  const projectedResult = calculateFootprint(projectedInput);

  const savingKg  = currentResult.totalCO2 - projectedResult.totalCO2;
  const savingPct = currentResult.totalCO2 > 0
    ? Math.round((savingKg / currentResult.totalCO2) * 100)
    : 0;

  const barData = [
    { cat: 'Transport', current: currentResult.transportCO2,  projected: projectedResult.transportCO2,  fill: '#0EA5E9' },
    { cat: 'Energy',    current: currentResult.energyCO2,     projected: projectedResult.energyCO2,     fill: '#F97316' },
    { cat: 'Food',      current: currentResult.foodCO2,       projected: projectedResult.foodCO2,       fill: '#10B981' },
    { cat: 'Lifestyle', current: currentResult.lifestyleCO2,  projected: projectedResult.lifestyleCO2,  fill: '#8B5CF6' },
  ];

  const biggestWin = [...barData].sort((a, b) => (b.current - b.projected) - (a.current - a.projected))[0];

  const hasChanges = JSON.stringify(adjustments) !== JSON.stringify(DEFAULT_ADJ);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#ecfdf5 40%,#f8fafc 100%)' }}>
      <style>{`
        .sim-slider-row {
          padding: 14px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .sim-slider-row:last-child { border-bottom: none; }
        .sim-icon-wrap {
          width: 36px; height: 36px; border-radius: 10px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .sim-card {
          background: white; border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
          border: 1px solid #f1f5f9;
        }
        .sim-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding: 4px 12px; border-radius:99px; font-size:12px; font-weight:600;
        }
        input[type=range]:focus { outline: none; }
      `}</style>

      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Sliders className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">What-If Simulator</h1>
            </div>
            <p className="text-sm text-slate-500">Drag sliders to explore how habit changes reduce your carbon footprint — in real time.</p>
          </div>

          {isDemo && (
            <div className="sim-badge" style={{ background: '#FEF9C3', color: '#854D0E' }}>
              <Info className="w-3.5 h-3.5" />
              Demo mode — <button className="underline" onClick={() => navigate('/calculator')}>log your data</button>
            </div>
          )}
        </div>

        {/* ── Summary strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Current Footprint',
              value: <><Counter value={currentResult.totalCO2} decimals={1} /><span className="text-sm font-normal text-slate-400 ml-1">kg CO₂e/mo</span></>,
              accent: '#64748b',
              bg: '#f8fafc',
            },
            {
              label: 'Projected Footprint',
              value: <><Counter value={projectedResult.totalCO2} decimals={1} /><span className="text-sm font-normal text-slate-400 ml-1">kg CO₂e/mo</span></>,
              accent: projectedResult.totalCO2 < 500 ? '#10B981' : projectedResult.totalCO2 <= 1000 ? '#F59E0B' : '#EF4444',
              bg: projectedResult.totalCO2 < currentResult.totalCO2 ? '#f0fdf4' : '#fef2f2',
            },
            {
              label: 'You Would Save',
              value: savingKg > 0 ? <><Counter value={savingKg} decimals={1} /><span className="text-sm font-normal text-slate-400 ml-1">kg/mo</span></> : <span className="text-slate-400 text-sm">— move a slider</span>,
              accent: '#10B981',
              bg: savingKg > 0 ? '#f0fdf4' : '#f8fafc',
            },
            {
              label: 'Reduction',
              value: savingPct > 0 ? <><Counter value={savingPct} />%</> : <span className="text-slate-400 text-sm">0%</span>,
              accent: '#10B981',
              bg: savingPct > 0 ? '#f0fdf4' : '#f8fafc',
            },
          ].map(item => (
            <div key={item.label} className="sim-card p-4" style={{ background: item.bg }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-xl font-bold" style={{ color: item.accent }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">

          {/* ── Controls ── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="sim-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Adjust Your Habits</h2>
                {hasChanges && (
                  <button
                    onClick={() => setAdjustments(DEFAULT_ADJ)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                  </button>
                )}
              </div>

              <SliderRow
                icon={<Car className="w-4 h-4" />}
                label="Switch Car to Public Transit"
                sub={`${Math.round(baseInput.carKmPerWeek * (1 - adjustments.carToPublic / 100))} km/wk remaining`}
                value={adjustments.carToPublic}
                max={100}
                color="#0EA5E9"
                onChange={v => set('carToPublic', v)}
              />
              <SliderRow
                icon={<Utensils className="w-4 h-4" />}
                label="Reduce Meat Meals"
                sub={`${Math.max(0, Math.round(baseInput.meatMealsPerWeek * (1 - adjustments.reduceMeat / 100)))} meals/wk remaining`}
                value={adjustments.reduceMeat}
                max={100}
                color="#10B981"
                onChange={v => set('reduceMeat', v)}
              />
              <SliderRow
                icon={<Zap className="w-4 h-4" />}
                label="Reduce Electricity Usage"
                sub={`${Math.max(0, Math.round(baseInput.electricityKwhPerMonth * (1 - adjustments.reduceElectricity / 100)))} kWh/mo remaining`}
                value={adjustments.reduceElectricity}
                max={30}
                color="#F97316"
                onChange={v => set('reduceElectricity', v)}
              />
              <SliderRow
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Reduce Online Shopping"
                sub={`${Math.max(0, Math.round(baseInput.shoppingOrdersPerMonth * (1 - adjustments.reduceShopping / 100)))} orders/mo remaining`}
                value={adjustments.reduceShopping}
                max={50}
                color="#8B5CF6"
                onChange={v => set('reduceShopping', v)}
              />
              <SliderRow
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Reduce Food Deliveries"
                sub={`${Math.max(0, Math.round(baseInput.deliveryOrdersPerMonth * (1 - adjustments.reduceDelivery / 100)))} orders/mo remaining`}
                value={adjustments.reduceDelivery}
                max={50}
                color="#EC4899"
                onChange={v => set('reduceDelivery', v)}
              />
              <ToggleRow
                icon={<Zap className="w-4 h-4" />}
                label="Switch to Solar / Renewables"
                sub="Cuts energy CO₂ by 25%"
                value={adjustments.addSolar}
                color="#F59E0B"
                onChange={v => set('addSolar', v)}
              />
              <ToggleRow
                icon={<Leaf className="w-4 h-4" />}
                label="Go Vegetarian"
                sub="Switches diet baseline to vegetarian"
                value={adjustments.goVegetarian}
                color="#10B981"
                onChange={v => set('goVegetarian', v)}
              />
            </div>

            {/* Biggest win */}
            {savingKg > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="sim-card p-5"
                style={{ background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderColor: '#bbf7d0' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Biggest Impact</p>
                    <p className="text-sm font-bold text-emerald-900">
                      {biggestWin.cat} saves <strong>{Math.round(biggestWin.current - biggestWin.projected)} kg CO₂/mo</strong>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Charts & breakdown ── */}
          <div className="lg:col-span-7 space-y-6">

            {/* Bar chart */}
            <div className="sim-card p-6">
              <h3 className="text-base font-bold text-slate-900 mb-5">Emissions by Category</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} barCategoryGap="30%" barGap={4} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="cat"
                    tick={{ fontSize: 12, fill: '#94A3B8' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94A3B8' }}
                    axisLine={false} tickLine={false}
                    tickFormatter={v => `${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    formatter={(v) => <span style={{ color: '#64748b' }}>{v}</span>}
                  />
                  <Bar dataKey="current" name="Current" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={`${d.fill}55`} />
                    ))}
                  </Bar>
                  <Bar dataKey="projected" name="Projected" radius={[6, 6, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Per-category saving breakdown */}
            <div className="sim-card p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Savings Breakdown</h3>
              <div className="space-y-3">
                {barData.map(d => {
                  const saving = d.current - d.projected;
                  const pct = d.current > 0 ? Math.round((saving / d.current) * 100) : 0;
                  const barW = d.current > 0 ? Math.max(0, Math.min(100, (d.projected / d.current) * 100)) : 100;
                  return (
                    <div key={d.cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{d.cat}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">{d.current.toFixed(1)} kg</span>
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                          <span className="font-semibold" style={{ color: d.fill }}>{d.projected.toFixed(1)} kg</span>
                          {saving > 0 && (
                            <span className="sim-badge" style={{ background: '#f0fdf4', color: '#166534' }}>
                              −{pct}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: `${d.fill}22` }}>
                        <motion.div
                          className="h-2 rounded-full"
                          style={{ background: d.fill }}
                          animate={{ width: `${barW}%` }}
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {savingKg <= 0 && (
                <div className="mt-4 flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-500">Move any slider or toggle above to see your projected savings appear here in real time.</p>
                </div>
              )}
            </div>

            {/* Annual projection */}
            {savingKg > 0 && (
              <motion.div
                key={savingKg}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="sim-card p-6"
                style={{ background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)', borderColor: '#334155' }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Annual Projection</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'CO₂ Saved / Year',    value: `${(savingKg * 12).toFixed(0)} kg` },
                    { label: 'Trees Equivalent',     value: `${Math.round(savingKg * 12 / 21)}` },
                    { label: 'Reduction',            value: `${savingPct}%` },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">* 1 mature tree absorbs ~21 kg CO₂/year</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Car, Bus, Train, Plane, Zap, Wind, Sun, Users,
  Apple, Trash2, ShoppingBag, Truck, Recycle,
  ChevronLeft, ChevronRight, Check, Leaf, Info,
  ArrowRight, BarChart3
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { calculateFootprint, getImpactLabel, getImpactColor } from '@/lib/calculator';
import { generateAIInsights } from '@/lib/aiInsights';
import type { CalculatorInput, CalculatorResult } from '@/lib/calculator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import CategoryBreakdownChart from '@/components/CategoryBreakdownChart';
import RecommendationCard from '@/components/RecommendationCard';

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const dietOptions = [
  { value: 'vegan', label: 'Vegan', icon: Leaf },
  { value: 'vegetarian', label: 'Vegetarian', icon: Apple },
  { value: 'mixed', label: 'Mixed', icon: Apple },
  { value: 'meat-heavy', label: 'Meat-Heavy', icon: Apple },
];

export default function CalculatorPage() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiInsight, setAiInsight] = useState<any>(null);

  const [data, setData] = useState<CalculatorInput>({
    carKmPerWeek: 0,
    busKmPerWeek: 0,
    metroKmPerWeek: 0,
    flightHoursPerYear: 0,
    electricityKwhPerMonth: 0,
    acHoursPerDay: 0,
    renewableEnergy: false,
    householdSize: 1,
    dietType: 'mixed',
    meatMealsPerWeek: 7,
    foodWasteKgPerWeek: 2,
    shoppingOrdersPerMonth: 5,
    deliveryOrdersPerMonth: 3,
    recyclesOften: false,
  });

  const update = (key: keyof CalculatorInput, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, 5));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 0));
  };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const calcResult = calculateFootprint(data);
    setResult(calcResult);

    if (user && isSupabaseConfigured) {
      // Save report
      const { data: report, error: reportError } = await supabase
        .from('footprint_reports')
        .insert({
          user_id: user.id,
          total_co2e: calcResult.totalCO2,
          transport_co2e: calcResult.transportCO2,
          energy_co2e: calcResult.energyCO2,
          food_co2e: calcResult.foodCO2,
          lifestyle_co2e: calcResult.lifestyleCO2,
          input_data: data,
        })
        .select()
        .single();

      if (reportError) {
        console.error('Failed to save report:', reportError);
        toast.error(`Failed to save report: ${reportError.message}. Please run the setup script in supabase_schema.sql!`);
      } else if (report) {
        // Save activities
        const activities = calcResult.activities.map(a => ({
          user_id: user.id,
          report_id: report.id,
          ...a,
        }));
        const { error: activitiesError } = await supabase.from('user_activities').insert(activities);
        if (activitiesError) {
          console.error('Failed to save activities:', activitiesError);
          toast.error(`Failed to save activities: ${activitiesError.message}`);
        }

        // Check first report badge
        const { count } = await supabase
          .from('footprint_reports')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (count === 1) {
          const { data: badge } = await supabase
            .from('badges')
            .select('id')
            .eq('condition_key', 'first_report')
            .single();
          if (badge) {
            await supabase.from('user_badges').insert({
              user_id: user.id,
              badge_id: badge.id,
            });
            toast.success('Badge earned: First Report!');
          }
        }

        // Generate AI insights
        const insight = await generateAIInsights(calcResult, {
          fullName: profile?.full_name || undefined,
          city: profile?.city || undefined,
          householdSize: profile?.household_size || undefined,
        });
        setAiInsight(insight);

        const { error: insightError } = await supabase.from('ai_insights').insert({
          user_id: user.id,
          report_id: report.id,
          summary: insight.summary,
          recommendations: insight.recommendations,
          impact_level: insight.impactLevel,
        });
        if (insightError) {
          console.error('Failed to save AI insights:', insightError);
          toast.error(`Failed to save AI insights: ${insightError.message}`);
        }
      }
    } else {
      // Demo mode - just calculate without saving
      const insight = await generateAIInsights(calcResult, {
        fullName: profile?.full_name || undefined,
        city: profile?.city || undefined,
        householdSize: profile?.household_size || undefined,
      });
      setAiInsight(insight);
    }

    setSubmitting(false);
    setStep(6); // Result step
  };

  const impactColor = result ? getImpactColor(result.impactLevel) : '#10B981';
  const impactLabel = result ? getImpactLabel(result.impactLevel) : '';

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12 px-4 light text-foreground">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step {step + 1} of 5
              </span>
              <span className="text-xs text-slate-400">
                {['Transport', 'Home Energy', 'Food', 'Lifestyle', 'Review'][step]}
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((step + 1) / 5) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <StepTransport key="transport" data={data} update={update} onNext={nextStep} custom={direction} />
          )}
          {step === 1 && (
            <StepEnergy key="energy" data={data} update={update} onNext={nextStep} onBack={prevStep} custom={direction} />
          )}
          {step === 2 && (
            <StepFood key="food" data={data} update={update} onNext={nextStep} onBack={prevStep} custom={direction} />
          )}
          {step === 3 && (
            <StepLifestyle key="lifestyle" data={data} update={update} onNext={nextStep} onBack={prevStep} custom={direction} />
          )}
          {step === 4 && (
            <StepReview key="review" data={data} onSubmit={handleSubmit} onBack={prevStep} onEdit={goToStep} submitting={submitting} custom={direction} />
          )}
          {step === 6 && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultView result={result} aiInsight={aiInsight} impactColor={impactColor} impactLabel={impactLabel} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ===================== STEP COMPONENTS ===================== */

function StepTransport({ data, update, onNext, custom }: { data: CalculatorInput; update: (k: keyof CalculatorInput, v: any) => void; onNext: () => void; custom: number }) {
  return (
    <motion.div key="transport" custom={custom} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-sky-100 flex items-center justify-center mx-auto mb-4">
          <Car className="w-7 h-7 text-sky-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Transport</h2>
        <p className="text-slate-600">How do you get around?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <NumberField icon={<Car className="w-5 h-5 text-sky-500" />} label="Car kilometers per week" value={data.carKmPerWeek} onChange={v => update('carKmPerWeek', v)} placeholder="e.g., 150" />
        <NumberField icon={<Bus className="w-5 h-5 text-sky-500" />} label="Bus kilometers per week" value={data.busKmPerWeek} onChange={v => update('busKmPerWeek', v)} placeholder="e.g., 50" />
        <NumberField icon={<Train className="w-5 h-5 text-sky-500" />} label="Train/metro kilometers per week" value={data.metroKmPerWeek} onChange={v => update('metroKmPerWeek', v)} placeholder="e.g., 30" />
        <NumberField icon={<Plane className="w-5 h-5 text-sky-500" />} label="Flight hours per year" value={data.flightHoursPerYear} onChange={v => update('flightHoursPerYear', v)} placeholder="e.g., 10" />

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">Short flights have a much higher carbon cost per kilometer. One hour of flying equals about 90 kg CO2e.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function StepEnergy({ data, update, onNext, onBack, custom }: { data: CalculatorInput; update: (k: keyof CalculatorInput, v: any) => void; onNext: () => void; onBack: () => void; custom: number }) {
  return (
    <motion.div key="energy" custom={custom} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-7 h-7 text-orange-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Home Energy</h2>
        <p className="text-slate-600">How much energy does your home use?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <NumberField icon={<Zap className="w-5 h-5 text-orange-500" />} label="Monthly electricity usage (kWh)" value={data.electricityKwhPerMonth} onChange={v => update('electricityKwhPerMonth', v)} placeholder="e.g., 250" />
        <NumberField icon={<Wind className="w-5 h-5 text-orange-500" />} label="AC hours per day" value={data.acHoursPerDay} onChange={v => update('acHoursPerDay', v)} placeholder="e.g., 4" />

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-orange-500" />
            <div>
              <Label className="text-sm font-medium text-slate-700">Use renewable energy?</Label>
              <p className="text-xs text-slate-500">Solar, wind, or green energy plan</p>
            </div>
          </div>
          <Switch checked={data.renewableEnergy} onCheckedChange={v => update('renewableEnergy', v)} />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-orange-500" />
            <Label className="text-sm font-medium text-slate-700">Household size</Label>
          </div>
          <select
            value={data.householdSize}
            onChange={e => update('householdSize', parseInt(e.target.value))}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">The average household uses about 900 kWh per month. Check your electricity bill!</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </motion.div>
  );
}

function StepFood({ data, update, onNext, onBack, custom }: { data: CalculatorInput; update: (k: keyof CalculatorInput, v: any) => void; onNext: () => void; onBack: () => void; custom: number }) {
  return (
    <motion.div key="food" custom={custom} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Apple className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Food</h2>
        <p className="text-slate-600">What does your diet look like?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">Diet type</Label>
          <div className="grid grid-cols-2 gap-3">
            {dietOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => update('dietType', opt.value)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    data.dietType === opt.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${data.dietType === opt.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`text-sm font-medium ${data.dietType === opt.value ? 'text-emerald-700' : 'text-slate-600'}`}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <NumberField icon={<Apple className="w-5 h-5 text-emerald-500" />} label="Meat-containing meals per week" value={data.meatMealsPerWeek} onChange={v => update('meatMealsPerWeek', v)} placeholder="e.g., 7" />
        <NumberField icon={<Trash2 className="w-5 h-5 text-emerald-500" />} label="Food waste (kg per week)" value={data.foodWasteKgPerWeek} onChange={v => update('foodWasteKgPerWeek', v)} placeholder="e.g., 2" />

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">Reducing meat by just 2 meals per week saves ~36 kg CO2e per month.</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </motion.div>
  );
}

function StepLifestyle({ data, update, onNext, onBack, custom }: { data: CalculatorInput; update: (k: keyof CalculatorInput, v: any) => void; onNext: () => void; onBack: () => void; custom: number }) {
  return (
    <motion.div key="lifestyle" custom={custom} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-violet-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Lifestyle</h2>
        <p className="text-slate-600">Your shopping and consumption habits.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        <NumberField icon={<ShoppingBag className="w-5 h-5 text-violet-500" />} label="Online shopping orders per month" value={data.shoppingOrdersPerMonth} onChange={v => update('shoppingOrdersPerMonth', v)} placeholder="e.g., 5" />
        <NumberField icon={<Truck className="w-5 h-5 text-violet-500" />} label="Food delivery orders per month" value={data.deliveryOrdersPerMonth} onChange={v => update('deliveryOrdersPerMonth', v)} placeholder="e.g., 3" />

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Recycle className="w-5 h-5 text-violet-500" />
            <div>
              <Label className="text-sm font-medium text-slate-700">Recycle regularly?</Label>
              <p className="text-xs text-slate-500">Paper, plastic, glass, electronics</p>
            </div>
          </div>
          <Switch checked={data.recyclesOften} onCheckedChange={v => update('recyclesOften', v)} />
        </div>

        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700">Recycling can reduce your lifestyle footprint by up to 5%.</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">Review <ChevronRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </motion.div>
  );
}

function StepReview({ data, onSubmit, onBack, onEdit, submitting, custom }: { data: CalculatorInput; onSubmit: () => void; onBack: () => void; onEdit: (s: number) => void; submitting: boolean; custom: number }) {
  const sections = [
    { title: 'Transport', step: 0, items: [
      { label: 'Car', value: `${data.carKmPerWeek} km/week` },
      { label: 'Bus', value: `${data.busKmPerWeek} km/week` },
      { label: 'Train/Metro', value: `${data.metroKmPerWeek} km/week` },
      { label: 'Flights', value: `${data.flightHoursPerYear} hrs/year` },
    ]},
    { title: 'Home Energy', step: 1, items: [
      { label: 'Electricity', value: `${data.electricityKwhPerMonth} kWh/month` },
      { label: 'AC usage', value: `${data.acHoursPerDay} hrs/day` },
      { label: 'Renewable energy', value: data.renewableEnergy ? 'Yes' : 'No' },
      { label: 'Household', value: `${data.householdSize} people` },
    ]},
    { title: 'Food', step: 2, items: [
      { label: 'Diet', value: data.dietType.charAt(0).toUpperCase() + data.dietType.slice(1) },
      { label: 'Meat meals', value: `${data.meatMealsPerWeek}/week` },
      { label: 'Food waste', value: `${data.foodWasteKgPerWeek} kg/week` },
    ]},
    { title: 'Lifestyle', step: 3, items: [
      { label: 'Shopping orders', value: `${data.shoppingOrdersPerMonth}/month` },
      { label: 'Delivery orders', value: `${data.deliveryOrdersPerMonth}/month` },
      { label: 'Recycles', value: data.recyclesOften ? 'Yes' : 'No' },
    ]},
  ];

  return (
    <motion.div key="review" custom={custom} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Review</h2>
        <p className="text-slate-600">Double-check your answers before calculating.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8 space-y-6">
        {sections.map(section => (
          <div key={section.title} className="border-b border-slate-100 last:border-0 pb-5 last:pb-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{section.title}</h3>
              <button onClick={() => onEdit(section.step)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Edit</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {section.items.map(item => (
                <div key={item.label} className="flex justify-between py-1.5">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calculating...
              </span>
            ) : (
              <>Calculate My Footprint</>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ===================== RESULT VIEW ===================== */

function ResultView({ result, aiInsight, impactColor, impactLabel }: { result: CalculatorResult; aiInsight: any; impactColor: string; impactLabel: string }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Carbon Footprint</h2>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-5xl font-extrabold text-slate-900">{result.totalCO2}</span>
          <div className="text-left">
            <span className="text-lg text-slate-500 block">kg CO2e</span>
            <span className="text-sm text-slate-400">per month</span>
          </div>
        </div>
        <span
          className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-white mt-2"
          style={{ backgroundColor: impactColor }}
        >
          {impactLabel}
        </span>
      </motion.div>

      {/* Category breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {result.breakdown.map(cat => (
          <div key={cat.category} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: cat.color }} />
            <p className="text-xl font-bold text-slate-900">{cat.value}</p>
            <p className="text-xs text-slate-500">{cat.category}</p>
            <p className="text-xs font-medium text-slate-400">{cat.percentage}%</p>
          </div>
        ))}
      </div>

      {/* Donut chart */}
      <CategoryBreakdownChart data={result.breakdown} total={result.totalCO2} />

      {/* AI Insight */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-900">AI Insight</h3>
          </div>
          <p className="text-slate-700 mb-4 leading-relaxed">{aiInsight.summary}</p>

          {aiInsight.recommendations?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Top Recommendations</h4>
              {aiInsight.recommendations.slice(0, 2).map((rec: any, i: number) => (
                <RecommendationCard key={i} recommendation={rec} />
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => navigate('/dashboard')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-xl">
          View Full Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button onClick={() => navigate('/simulator')} variant="outline" className="flex-1 py-5 rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50">
          <BarChart3 className="w-4 h-4 mr-2" /> Run Simulator
        </Button>
      </div>
    </div>
  );
}

/* ===================== SHARED FIELD COMPONENTS ===================== */

function NumberField({ icon, label, value, onChange, placeholder }: { icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void; placeholder: string }) {
  return (
    <div>
      <Label className="text-sm font-medium text-slate-700 mb-2 block">{label}</Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>
        <Input
          type="number"
          min={0}
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          className="pl-12"
        />
      </div>
    </div>
  );
}

import { useState } from 'react';
import { FileCheck, Flag, CheckCircle, TrendingDown, Car, Apple, Zap, ShoppingBag, Sliders, Trophy, Lock } from 'lucide-react';

const iconMap: Record<string, typeof FileCheck> = {
  FileCheck,
  Flag,
  CheckCircle,
  TrendingDown,
  Car,
  Apple,
  Zap,
  ShoppingBag,
  Sliders,
  Trophy,
};

const categoryColors: Record<string, { earned: string; locked: string }> = {
  transport: { earned: 'bg-sky-500', locked: 'bg-slate-200' },
  energy: { earned: 'bg-orange-500', locked: 'bg-slate-200' },
  food: { earned: 'bg-emerald-500', locked: 'bg-slate-200' },
  lifestyle: { earned: 'bg-violet-500', locked: 'bg-slate-200' },
  general: { earned: 'bg-emerald-600', locked: 'bg-slate-200' },
};

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
}

interface Props {
  badge: Badge;
}

export default function BadgeCard({ badge }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const Icon = iconMap[badge.icon] || FileCheck;
  const colors = categoryColors[badge.category] || categoryColors.general;

  return (
    <div
      className="relative flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`w-12 h-12 rounded-full ${badge.earned ? colors.earned : colors.locked} flex items-center justify-center transition-all`}>
        {badge.earned ? (
          <Icon className="w-6 h-6 text-white" />
        ) : (
          <Lock className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <span className={`text-[11px] font-medium text-center leading-tight ${badge.earned ? 'text-slate-700' : 'text-slate-400'}`}>
        {badge.name}
      </span>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10">
          <p className="font-semibold mb-0.5">{badge.name}</p>
          <p className="text-slate-300 text-[11px]">{badge.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}

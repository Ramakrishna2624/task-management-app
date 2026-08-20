import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{value}</p>
        </div>
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Tv, DollarSign, Wallet, TrendingUp, Layers, Tag, Calendar, BarChart3, Settings, ShieldCheck, Check } from 'lucide-react';
import { Panel, DailyRecord } from '../types';
import { AppSettings } from '../utils/storage';
import { calculateDailySummary, formatShekel } from '../utils/calculations';

interface HeaderProps {
  activeTab: 'daily' | 'history' | 'panels' | 'plans' | 'simulator' | 'settings';
  setActiveTab: (tab: 'daily' | 'history' | 'panels' | 'plans' | 'simulator' | 'settings') => void;
  panels: Panel[];
  records: DailyRecord[];
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenBuyPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  panels,
  records,
  settings,
  onUpdateSettings,
  onOpenBuyPanel,
}) => {
  const [showRateModal, setShowRateModal] = useState(false);
  const [tempRate, setTempRate] = useState(settings.usdExchangeRate.toString());

  // Compute this month's stats
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthRecords = records.filter((r) => r.date.startsWith(currentMonthStr));
  
  let monthProfit = 0;
  let monthRevenue = 0;
  let totalSoldThisMonth = 0;
  let totalPanelsSoldThisMonth = 0;

  monthRecords.forEach((r) => {
    const sum = calculateDailySummary(r, panels, []);
    monthProfit += sum.netProfit;
    monthRevenue += sum.grossRevenue;
    totalSoldThisMonth += sum.totalAccountsSold;
    totalPanelsSoldThisMonth += sum.totalPanelsSold;
  });

  // Calculate total consumed months across all records
  let totalMonthsConsumed = 0;
  records.forEach((r) => {
    (r.sales || []).forEach((s) => {
      totalMonthsConsumed += (Number(s.count) || 0) * (Number(s.durationMonths) || 1);
    });
  });

  const totalPanelCapacityMonths = panels.reduce((acc, p) => acc + p.totalYears * 12, 0);
  const remainingMonths = Math.max(0, totalPanelCapacityMonths - totalMonthsConsumed);
  const remainingYears = (remainingMonths / 12).toFixed(1);

  const handleSaveRate = () => {
    const rate = parseFloat(tempRate);
    if (!isNaN(rate) && rate > 0) {
      onUpdateSettings({ ...settings, usdExchangeRate: rate });
      setShowRateModal(false);
    }
  };

  interface NavItem {
    id: 'daily' | 'history' | 'panels' | 'plans' | 'simulator' | 'settings';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }

  const navItems: NavItem[] = [
    { id: 'daily', label: 'تسجيل اليومية', icon: Calendar },
    { id: 'history', label: 'سجل الأيام', icon: BarChart3, badge: records.length },
    { id: 'panels', label: 'اللوحات والسيرفرات', icon: Layers, badge: `${panels.length}` },
    { id: 'plans', label: 'أسعار الباقات', icon: Tag },
    { id: 'simulator', label: 'حاسبة الأهداف', icon: TrendingUp },
    { id: 'settings', label: 'النسخ والبيانات', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black shrink-0">
              <Tv className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-black tracking-tight text-white">أرباح IPTV</h1>
                <span className="hidden xs:inline-block text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  برو
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[170px] sm:max-w-none">
                حساب الأرباح وإدارة اللوحات والإعلانات
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Buy Panel Button */}
            <button
              onClick={onOpenBuyPanel}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
              <span>شراء لوحة</span>
            </button>

            {/* Exchange Rate Badge */}
            <button
              onClick={() => setShowRateModal(true)}
              title="سعر صرف الدولار مقابل الشيكل"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] sm:text-xs">1$={settings.usdExchangeRate}₪</span>
            </button>
          </div>
        </div>

        {/* Mobile-Friendly Swipeable / Wrap KPI Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80">
          
          {/* Monthly Profit Badge */}
          <div className="bg-slate-800/80 rounded-xl p-2 sm:px-3.5 sm:py-2 border border-slate-700/80 text-center sm:text-right">
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">أرباح الشهر</div>
            <div className="text-xs sm:text-base font-bold text-emerald-400 font-mono tracking-tight truncate">
              {formatShekel(monthProfit)}
            </div>
          </div>

          {/* Total accounts sold this month */}
          <div className="bg-slate-800/80 rounded-xl p-2 sm:px-3.5 sm:py-2 border border-slate-700/80 text-center sm:text-right">
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">مبيعات الشهر</div>
            <div className="text-xs sm:text-base font-bold text-white font-mono truncate">
              {totalSoldThisMonth} <span className="text-[9px] sm:text-xs text-slate-400 font-normal">حساب</span>
              {totalPanelsSoldThisMonth > 0 && (
                <span className="text-[10px] text-purple-300 font-bold mr-1">+ {totalPanelsSoldThisMonth}ل</span>
              )}
            </div>
          </div>

          {/* Remaining Panel Credits */}
          <div
            onClick={onOpenBuyPanel}
            className="bg-slate-800/80 hover:bg-slate-750 cursor-pointer rounded-xl p-2 sm:px-3.5 sm:py-2 border border-slate-700/80 text-center sm:text-right transition group"
            title="انقر لشراء لوحة إضافية"
          >
            <div className="text-[10px] sm:text-[11px] text-amber-400 font-medium truncate flex items-center justify-center sm:justify-start gap-1">
              <span>رصيد اللوحات</span>
              <span className="text-[9px] text-emerald-400 font-bold">+شراء</span>
            </div>
            <div className="text-xs sm:text-base font-bold text-amber-300 font-mono truncate">
              {remainingYears} <span className="text-[9px] sm:text-xs text-slate-400 font-normal">سنة</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Shown on tablets & desktop; mobile uses bottom navigation bar) */}
        <div className="hidden sm:flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Exchange Rate Edit Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">سعر صرف الدولار (USD / ILS)</h3>
                <p className="text-xs text-slate-400">يستخدم لتحويل ميزانيات الإعلانات الممولة بدقة للشيكل</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                سعر 1 دولار أمريكي ($) بالشيكل (₪):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="10"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-left"
                  dir="ltr"
                  placeholder="3.70"
                  autoFocus
                />
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₪</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                مثال: إذا روجت بـ 10$ على فيسبوك وكان السعر 3.70 ₪، فستُحسب التكلفة بـ 37 شيكل.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveRate}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                <Check className="w-4 h-4" />
                حفظ السعر
              </button>
              <button
                onClick={() => setShowRateModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

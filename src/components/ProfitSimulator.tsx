import React, { useState } from 'react';
import { TrendingUp, Target, DollarSign, Calculator, Sparkles, Tv, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Panel, PlanConfig } from '../types';
import { AppSettings } from '../utils/storage';
import { getPanelCostPerMonth, formatShekel, formatUSD } from '../utils/calculations';

interface ProfitSimulatorProps {
  panels: Panel[];
  plans: PlanConfig[];
  settings: AppSettings;
}

export const ProfitSimulator: React.FC<ProfitSimulatorProps> = ({
  panels,
  plans,
  settings,
}) => {
  const defaultPanel = panels.find((p) => p.isDefault) || panels[0];
  const costPerMonth = defaultPanel ? getPanelCostPerMonth(defaultPanel) : 1;

  // Simulator state: Daily sales scenario
  const [dailyMonth1, setDailyMonth1] = useState<number>(2); // 2 accounts/day of 1 month
  const [dailyMonth3, setDailyMonth3] = useState<number>(1); // 1 account/day of 3 months
  const [dailyMonth6, setDailyMonth6] = useState<number>(1); // 1 account/day of 6 months
  const [dailyYear1, setDailyYear1] = useState<number>(2); // 2 accounts/day of 1 year
  const [monthlyPanelsSold, setMonthlyPanelsSold] = useState<number>(2); // 2 full panels sold per month to resellers
  
  // Daily ad budget
  const [dailyAdUSD, setDailyAdUSD] = useState<number>(5); // $5/day on ads

  // Target profit planner
  const [targetMonthlyProfit, setTargetMonthlyProfit] = useState<number>(settings.monthlyProfitTarget || 3000);
  const [targetAdBudgetILS, setTargetAdBudgetILS] = useState<number>(300); // 300 ₪ ads budget

  // Rates for plans
  const plan1m = plans.find((p) => p.id === '1_month') || { defaultPrice: 15, durationMonths: 1 };
  const plan3m = plans.find((p) => p.id === '3_months') || { defaultPrice: 30, durationMonths: 3 };
  const plan6m = plans.find((p) => p.id === '6_months') || { defaultPrice: 50, durationMonths: 6 };
  const plan1y = plans.find((p) => p.id === '1_year') || { defaultPrice: 70, durationMonths: 12 };

  // Reseller Full Panel Sale Economics (Cost 120₪, Sell 350₪ -> Profit +230₪)
  const panelSalePrice = 350;
  const panelSaleCost = 120;
  const panelSaleProfitPerUnit = panelSalePrice - panelSaleCost; // 230 ₪

  const monthlyPanelSalesRevenue = monthlyPanelsSold * panelSalePrice;
  const monthlyPanelSalesProfit = monthlyPanelsSold * panelSaleProfitPerUnit;
  const dailyPanelSalesProfit = monthlyPanelSalesProfit / 30;

  // Calculations for Scenario 1: Daily Pace
  const dailySubsRevenue =
    dailyMonth1 * plan1m.defaultPrice +
    dailyMonth3 * plan3m.defaultPrice +
    dailyMonth6 * plan6m.defaultPrice +
    dailyYear1 * plan1y.defaultPrice;

  const dailySubsPanelCost =
    (dailyMonth1 * plan1m.durationMonths +
      dailyMonth3 * plan3m.durationMonths +
      dailyMonth6 * plan6m.durationMonths +
      dailyYear1 * plan1y.durationMonths) *
    costPerMonth;

  const dailyAdCostILS = dailyAdUSD * settings.usdExchangeRate;
  const dailyNetProfit = dailySubsRevenue - dailySubsPanelCost - dailyAdCostILS + dailyPanelSalesProfit;
  const monthlyNetProfit = (dailySubsRevenue - dailySubsPanelCost - dailyAdCostILS) * 30 + monthlyPanelSalesProfit;
  const monthlyRevenue = dailySubsRevenue * 30 + monthlyPanelSalesRevenue;
  const monthlyAdCostILS = dailyAdCostILS * 30;
  const annualNetProfit = monthlyNetProfit * 12;

  // Calculations for Scenario 2: Target Goal Planning
  // Let's compute how many 1-year subs or mixed subs or panels are needed to reach targetMonthlyProfit
  const profitPerYearSub = plan1y.defaultPrice - 12 * costPerMonth; // e.g. 70 - 12 = 58 ₪
  const profitPerMonthSub = plan1m.defaultPrice - 1 * costPerMonth; // e.g. 15 - 1 = 14 ₪
  const totalNeededProfit = targetMonthlyProfit + targetAdBudgetILS;
  const neededPanelsOnly = Math.ceil(totalNeededProfit / (panelSaleProfitPerUnit || 1));
  const neededYearSubsOnly = Math.ceil(totalNeededProfit / (profitPerYearSub || 1));
  const neededMonthSubsOnly = Math.ceil(totalNeededProfit / (profitPerMonthSub || 1));

  // Balanced mix: 60% revenue from 1-year, 40% from shorter
  const averageSubProfit = (profitPerYearSub * 2 + profitPerMonthSub * 3) / 5; // weighted average ~ 31.6 ₪
  const neededTotalAccounts = Math.ceil(totalNeededProfit / averageSubProfit);

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">حاسبة التوقعات والأهداف المالية (IPTV Simulator)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            خطط لمستقبل مبيعاتك: جرب سيناريوهات المبيعات اليومية أو حدد هدفاً شهرياً واعرف بالضبط كم اشتراك تحتاج تبيعه وميزانية الإعلانات المناسبة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scenario 1: Interactive Daily Pace Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">محاكي المبيعات اليومية وتوقع الأرباح</h3>
            </div>
            <span className="text-xs text-slate-400">حرك العدادات لترى الأثر</span>
          </div>

          <div className="space-y-4">
            {/* 1 Year Plan Slider */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">اشتراكات سنة كاملة (70 ₪) يومياً:</span>
                <span className="font-mono text-emerald-400 font-bold text-base">{dailyYear1} حساب / يوم</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={dailyYear1}
                onChange={(e) => setDailyYear1(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400 flex justify-between">
                <span>ربح الحساب الواحد: +{(plan1y.defaultPrice - 12 * costPerMonth).toFixed(1)} ₪</span>
                <span>شهرياً: {dailyYear1 * 30} حساب</span>
              </div>
            </div>

            {/* 6 Months Plan Slider */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">اشتراكات 6 شهور (50 ₪) يومياً:</span>
                <span className="font-mono text-purple-400 font-bold text-base">{dailyMonth6} حساب / يوم</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={dailyMonth6}
                onChange={(e) => setDailyMonth6(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* 3 Months Plan Slider */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">اشتراكات 3 شهور (30 ₪) يومياً:</span>
                <span className="font-mono text-amber-400 font-bold text-base">{dailyMonth3} حساب / يوم</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={dailyMonth3}
                onChange={(e) => setDailyMonth3(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* 1 Month Plan Slider */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">اشتراكات شهر (15 ₪) يومياً:</span>
                <span className="font-mono text-blue-400 font-bold text-base">{dailyMonth1} حساب / يوم</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={dailyMonth1}
                onChange={(e) => setDailyMonth1(parseInt(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Reseller Full Panel Sales Slider */}
            <div className="bg-purple-950/30 p-3.5 rounded-xl border border-purple-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-200">بيع لوحات كاملة للموزعين (350 ₪ - ربحك 230 ₪):</span>
                <span className="font-mono text-purple-300 font-bold text-base">{monthlyPanelsSold} لوحة / شهر</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={monthlyPanelsSold}
                onChange={(e) => setMonthlyPanelsSold(parseInt(e.target.value) || 0)}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="text-[11px] text-purple-300/80 flex justify-between font-mono">
                <span>ربحك من بيع اللوحة: +{panelSaleProfitPerUnit} ₪</span>
                <span>إجمالي ربح اللوحات شهرياً: +{formatShekel(monthlyPanelSalesProfit)}</span>
              </div>
            </div>

            {/* Daily Ad Spend Slider */}
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">ميزانية الإعلانات الممولة اليومية ($):</span>
                <span className="font-mono text-cyan-400 font-bold text-base">
                  ${dailyAdUSD} / يوم ({formatShekel(dailyAdCostILS)})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={dailyAdUSD}
                onChange={(e) => setDailyAdUSD(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="text-[11px] text-slate-400">
                شهرياً: ${dailyAdUSD * 30} ({formatShekel(monthlyAdCostILS)})
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-emerald-300">نتيجة هذا السيناريو التقديرية:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">صافي الربح اليومي</div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  +{formatShekel(dailyNetProfit)}
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400">صافي الربح الشهري</div>
                <div className="text-lg font-black font-mono text-emerald-400">
                  +{formatShekel(monthlyNetProfit)}
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400">صافي الربح السنوي المتوقع</div>
                <div className="text-lg font-black font-mono text-cyan-400">
                  +{formatShekel(annualNetProfit)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 2: Target Goal Calculator (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">تحديد هدف الربح الشهري</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كم تريد أن تربح صافياً في جيبك شهرياً؟
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={targetMonthlyProfit}
                  onChange={(e) => setTargetMonthlyProfit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono font-bold text-xl focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-3 text-emerald-400 font-bold text-sm">شيكل (₪)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ميزانية الإعلانات المتوقعة شهرياً:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  min="0"
                  value={targetAdBudgetILS}
                  onChange={(e) => setTargetAdBudgetILS(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-mono">
                  ₪ (~${(targetAdBudgetILS / settings.usdExchangeRate).toFixed(0)})
                </span>
              </div>
            </div>

            {/* Target Breakdown Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 text-xs">
              <div className="font-bold text-white text-sm">
                لتحقيق ربح صافي قدره <span className="text-emerald-400 font-mono">{formatShekel(targetMonthlyProfit)}</span>:
              </div>

              <div className="space-y-2 text-slate-300">
                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>إذا اعتمدت على اشتراكات السنة (70 ₪):</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {neededYearSubsOnly} حساب / شهر
                    <span className="text-[10px] text-slate-400 block text-left">
                      (~ {(neededYearSubsOnly / 30).toFixed(1)} حساب باليوم)
                    </span>
                  </span>
                </div>

                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>إذا اعتمدت على اشتراكات الشهر (15 ₪):</span>
                  <span className="font-mono font-bold text-blue-400">
                    {neededMonthSubsOnly} حساب / شهر
                    <span className="text-[10px] text-slate-400 block text-left">
                      (~ {(neededMonthSubsOnly / 30).toFixed(1)} حساب باليوم)
                    </span>
                  </span>
                </div>

                <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-purple-300 font-bold block">إذا اعتمدت على بيع لوحات الموزعين (350 ₪):</span>
                    <span className="text-[10px] text-slate-400">ربحك الصافي 230 ₪ لكل لوحة بالكامل</span>
                  </div>
                  <span className="font-mono font-bold text-purple-300 text-sm text-left">
                    {neededPanelsOnly} لوحة / شهر فقط
                    <span className="text-[10px] text-emerald-400 block font-normal">
                      (تكفي لتحقيق هدفك كاملاً!)
                    </span>
                  </span>
                </div>

                <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span>مزيج واقعي (سنة + شهور متنوعة):</span>
                  <span className="font-mono font-bold text-cyan-400">
                    ~ {neededTotalAccounts} حساب / شهر
                    <span className="text-[10px] text-slate-400 block text-left">
                      (~ {(neededTotalAccounts / 30).toFixed(1)} حساب باليوم)
                    </span>
                  </span>
                </div>
              </div>

              {/* Panel credit requirement note */}
              <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400 space-y-1">
                <div>
                  💡 ستحتاج رصيد لوحة يغطي حوالي{' '}
                  <strong className="text-white font-mono">
                    {((neededYearSubsOnly * 12) / 12).toFixed(1)} سنة
                  </strong>{' '}
                  (أي ما يقارب لوحة واحدة من فئة 10 سنوات التي تشتريها بـ 120 شيكل).
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

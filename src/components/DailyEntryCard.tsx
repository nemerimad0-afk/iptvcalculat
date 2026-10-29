import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Minus,
  Sparkles,
  TrendingUp,
  DollarSign,
  Layers,
  Save,
  RotateCcw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Megaphone,
  Tag,
  Share2,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { Panel, PlanConfig, DailyRecord, AdExpense, SaleItem, PanelSaleItem } from '../types';
import { AppSettings } from '../utils/storage';
import {
  getPanelCostPerMonth,
  calculateDailySummary,
  formatShekel,
  formatUSD,
  formatMonthsDuration,
  DEFAULT_PANEL_SALE_COST,
  DEFAULT_PANEL_SALE_PRICE,
} from '../utils/calculations';

interface DailyEntryCardProps {
  panels: Panel[];
  plans: PlanConfig[];
  settings: AppSettings;
  records: DailyRecord[];
  onSaveRecord: (record: DailyRecord) => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onOpenBuyPanel?: () => void;
}

export const DailyEntryCard: React.FC<DailyEntryCardProps> = ({
  panels,
  plans,
  settings,
  records,
  onSaveRecord,
  selectedDate: propSelectedDate,
  onSelectDate,
  onOpenBuyPanel,
}) => {
  // Current date
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState<string>(propSelectedDate || todayStr);

  // Selected default panel for today
  const defaultPanel = useMemo(
    () => panels.find((p) => p.isDefault) || panels[0] || { id: 'panel_default', name: 'لوحة أساسية', totalYears: 10, cost: 120, purchaseDate: todayStr },
    [panels, todayStr]
  );
  const [selectedPanelId, setSelectedPanelId] = useState<string>(defaultPanel.id);

  // Sales state keyed by planId
  const [salesCounts, setSalesCounts] = useState<Record<string, { count: number; customPrice?: number }>>({});

  // Full Panel Sales state (بيع اللوحات بالكامل: سعر التكلفة 120 ₪ وسعر البيع 350 ₪)
  const [panelSalesCount, setPanelSalesCount] = useState<number>(0);
  const [panelSalePrice, setPanelSalePrice] = useState<number>(DEFAULT_PANEL_SALE_PRICE);
  const [panelSaleCost, setPanelSaleCost] = useState<number>(DEFAULT_PANEL_SALE_COST);
  const [panelSaleNotes, setPanelSaleNotes] = useState<string>('');
  const [showCustomPanelPrice, setShowCustomPanelPrice] = useState<boolean>(false);
  
  // Marketing & Ads state
  const [adAmount, setAdAmount] = useState<string>('');
  const [adCurrency, setAdCurrency] = useState<'ILS' | 'USD'>('USD');
  const [adPlatform, setAdPlatform] = useState<string>('facebook');
  const [adNotes, setAdNotes] = useState<string>('');
  const [adCampaigns, setAdCampaigns] = useState<AdExpense[]>([]);

  // Other expenses & notes
  const [otherExpenses, setOtherExpenses] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Feedback notification
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync date if prop changes
  useEffect(() => {
    if (propSelectedDate && propSelectedDate !== date) {
      setDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Load existing record for selected date if one exists
  useEffect(() => {
    const existing = records.find((r) => r.date === date);
    if (existing) {
      // Load sales
      const newCounts: Record<string, { count: number; customPrice?: number }> = {};
      existing.sales.forEach((s) => {
        newCounts[s.planId] = {
          count: s.count,
          customPrice: s.pricePerUnit,
        };
      });
      setSalesCounts(newCounts);

      // Load panel sales
      if (existing.panelSales && existing.panelSales.length > 0) {
        const ps = existing.panelSales[0];
        setPanelSalesCount(ps.count || 0);
        setPanelSalePrice(ps.pricePerUnit !== undefined ? ps.pricePerUnit : DEFAULT_PANEL_SALE_PRICE);
        setPanelSaleCost(ps.costPerUnit !== undefined ? ps.costPerUnit : DEFAULT_PANEL_SALE_COST);
        setPanelSaleNotes(ps.notes || '');
      } else {
        setPanelSalesCount(0);
        setPanelSalePrice(DEFAULT_PANEL_SALE_PRICE);
        setPanelSaleCost(DEFAULT_PANEL_SALE_COST);
        setPanelSaleNotes('');
      }

      setAdCampaigns(existing.adExpenses || []);
      setOtherExpenses(existing.otherExpenses ? existing.otherExpenses.toString() : '');
      setNotes(existing.notes || '');
      
      // If sale had a panel, select it
      if (existing.sales.length > 0 && existing.sales[0].panelId) {
        setSelectedPanelId(existing.sales[0].panelId);
      }
    } else {
      // Reset for fresh day
      setSalesCounts({});
      setPanelSalesCount(0);
      setPanelSalePrice(DEFAULT_PANEL_SALE_PRICE);
      setPanelSaleCost(DEFAULT_PANEL_SALE_COST);
      setPanelSaleNotes('');
      setAdCampaigns([]);
      setAdAmount('');
      setOtherExpenses('');
      setNotes('');
    }
  }, [date, records]);

  // Handle plan count increment/decrement
  const updateCount = (planId: string, delta: number) => {
    setSalesCounts((prev) => {
      const current = prev[planId]?.count || 0;
      const nextCount = Math.max(0, current + delta);
      return {
        ...prev,
        [planId]: {
          ...prev[planId],
          count: nextCount,
        },
      };
    });
  };

  const setCountDirectly = (planId: string, value: number) => {
    setSalesCounts((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        count: Math.max(0, value),
      },
    }));
  };

  const setCustomPrice = (planId: string, price: number | undefined) => {
    setSalesCounts((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        count: prev[planId]?.count || 0,
        customPrice: price,
      },
    }));
  };

  // Add ad campaign
  const handleAddAdCampaign = () => {
    const amountNum = parseFloat(adAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newAd: AdExpense = {
      amount: amountNum,
      currency: adCurrency,
      platform: (adPlatform as any) || 'other',
      notes: adNotes,
    };

    setAdCampaigns((prev) => [...prev, newAd]);
    setAdAmount('');
    setAdNotes('');
  };

  const handleRemoveAdCampaign = (index: number) => {
    setAdCampaigns((prev) => prev.filter((_, i) => i !== index));
  };

  // Active panel object
  const currentPanel = panels.find((p) => p.id === selectedPanelId) || defaultPanel;
  const panelCostPerMonth = getPanelCostPerMonth(currentPanel);

  // Build the temporary daily record to compute live calculation
  const currentSalesItems: SaleItem[] = useMemo(() => {
    const items: SaleItem[] = [];
    plans.forEach((plan) => {
      const data = salesCounts[plan.id];
      const count = data?.count || 0;
      if (count > 0) {
        items.push({
          id: `${plan.id}_${Date.now()}`,
          planId: plan.id,
          planName: plan.name,
          durationMonths: plan.durationMonths,
          count: count,
          pricePerUnit: data?.customPrice !== undefined ? data.customPrice : plan.defaultPrice,
          panelId: currentPanel.id,
        });
      }
    });
    return items;
  }, [salesCounts, plans, currentPanel]);

  // Build full panel sales items
  const currentPanelSalesItems: PanelSaleItem[] = useMemo(() => {
    if (panelSalesCount <= 0) return [];
    return [
      {
        id: `panel_sale_${date}`,
        panelName: 'لوحة سيرفر كاملة (10 سنوات)',
        count: panelSalesCount,
        costPerUnit: panelSaleCost,
        pricePerUnit: panelSalePrice,
        notes: panelSaleNotes,
      },
    ];
  }, [panelSalesCount, panelSaleCost, panelSalePrice, panelSaleNotes, date]);

  // Combine ad campaigns + currently typed ad if not yet added
  const allAdExpenses: AdExpense[] = useMemo(() => {
    const list = [...adCampaigns];
    const pendingAmount = parseFloat(adAmount);
    if (!isNaN(pendingAmount) && pendingAmount > 0) {
      list.push({
        amount: pendingAmount,
        currency: adCurrency,
        platform: (adPlatform as any) || 'other',
        notes: adNotes,
      });
    }
    return list;
  }, [adCampaigns, adAmount, adCurrency, adPlatform, adNotes]);

  const liveRecord: DailyRecord = useMemo(() => {
    return {
      id: date,
      date: date,
      sales: currentSalesItems,
      panelSales: currentPanelSalesItems,
      adExpenses: allAdExpenses,
      usdExchangeRate: settings.usdExchangeRate,
      otherExpenses: parseFloat(otherExpenses) || 0,
      notes: notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }, [date, currentSalesItems, currentPanelSalesItems, allAdExpenses, settings.usdExchangeRate, otherExpenses, notes]);

  const liveSummary = useMemo(() => {
    return calculateDailySummary(liveRecord, panels, plans);
  }, [liveRecord, panels, plans]);

  // Save the record
  const handleSave = () => {
    // If user has a pending ad amount typed in the box, add it automatically
    let finalAdExpenses = [...adCampaigns];
    const pendingAmount = parseFloat(adAmount);
    if (!isNaN(pendingAmount) && pendingAmount > 0) {
      finalAdExpenses.push({
        amount: pendingAmount,
        currency: adCurrency,
        platform: (adPlatform as any) || 'other',
        notes: adNotes,
      });
      setAdCampaigns(finalAdExpenses);
      setAdAmount('');
      setAdNotes('');
    }

    const recordToSave: DailyRecord = {
      id: date,
      date: date,
      sales: currentSalesItems,
      panelSales: currentPanelSalesItems,
      adExpenses: finalAdExpenses,
      usdExchangeRate: settings.usdExchangeRate,
      otherExpenses: parseFloat(otherExpenses) || 0,
      notes: notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveRecord(recordToSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleReset = () => {
    setSalesCounts({});
    setPanelSalesCount(0);
    setPanelSalePrice(DEFAULT_PANEL_SALE_PRICE);
    setPanelSaleCost(DEFAULT_PANEL_SALE_COST);
    setPanelSaleNotes('');
    setAdCampaigns([]);
    setAdAmount('');
    setOtherExpenses('');
    setNotes('');
  };

  // Check if this date already has records
  const isExistingRecord = records.some((r) => r.date === date);

  return (
    <div className="space-y-6 pb-36 sm:pb-24 lg:pb-6">
      {/* Date & Panel Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Date Picker & Quick Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-white">تاريخ المبيعات:</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (onSelectDate) onSelectDate(e.target.value);
                }}
                className="bg-slate-800 border border-slate-700 text-white font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              
              {/* Quick Date Presets */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition ${
                    date === todayStr
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setDate(yesterday.toISOString().split('T')[0]);
                  }}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  أمس
                </button>
              </div>
            </div>

            {isExistingRecord && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                هذا اليوم مسجل مسبقاً (سيتم التحديث)
              </span>
            )}
          </div>

          {/* Panel Selector & Buy Panel Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <label className="text-xs font-semibold text-slate-300 whitespace-nowrap">اللوحة المستخدمة:</label>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedPanelId}
                onChange={(e) => setSelectedPanelId(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-500 font-medium max-w-full sm:max-w-[240px]"
              >
                {panels.map((p) => {
                  const costMonth = getPanelCostPerMonth(p).toFixed(1);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.totalYears} سنوات - {costMonth} ₪/شهر)
                    </option>
                  );
                })}
              </select>

              {onOpenBuyPanel && (
                <button
                  type="button"
                  onClick={onOpenBuyPanel}
                  className="bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1 shrink-0 shadow-md shadow-emerald-600/20 active:scale-95"
                  title="شراء لوحة جديدة أو إضافة رصيد"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>شراء لوحة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Panel Cost Info Banner */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>
              تكلفة رصيد السيرفر الحالية: <strong className="text-emerald-400 font-mono">{panelCostPerMonth.toFixed(2)} شيكل</strong> لكل شهر اشتراك
              (أي <strong className="text-emerald-400 font-mono">{(panelCostPerMonth * 12).toFixed(1)} شيكل</strong> لاشتراك السنة الكاملة)
            </span>
          </div>
          <div className="text-slate-400">
            اللوحة: {currentPanel.name} (السعر: {currentPanel.cost} ₪ مقابل {currentPanel.totalYears} سنوات)
          </div>
        </div>
      </div>

      {/* Main Grid: Subscriptions Counter & Marketing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Subscriptions Count Cards (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">الاشتراكات المباعة اليوم</h2>
              <span className="text-xs text-slate-400">(حدد كم حساب بعت من كل باقة)</span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              تصفير العدادات
            </button>
          </div>

          {/* Cards for each plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const currentData = salesCounts[plan.id];
              const count = currentData?.count || 0;
              const unitPrice = currentData?.customPrice !== undefined ? currentData.customPrice : plan.defaultPrice;
              const subRevenue = count * unitPrice;
              
              // Calculate panel cost for this plan
              const unitPanelCost = plan.durationMonths * panelCostPerMonth;
              const totalPlanPanelCost = count * unitPanelCost;
              const unitNetProfit = unitPrice - unitPanelCost;
              const totalPlanProfit = count * unitNetProfit;

              const badgeColors: Record<string, string> = {
                blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              };

              return (
                <div
                  key={plan.id}
                  className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                    count > 0
                      ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5 bg-slate-900/90'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColors[plan.badgeColor || 'emerald']}`}>
                          {plan.durationMonths === 12
                            ? 'سنة كاملة'
                            : plan.durationMonths === 1
                            ? 'شهر واحد'
                            : `${plan.durationMonths} شهور`}
                        </span>
                        <h3 className="font-bold text-white text-base">{plan.name}</h3>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>سعر البيع: <strong className="text-white font-mono">{unitPrice} ₪</strong></span>
                        <span>•</span>
                        <span>تكلفة السيرفر: <strong className="text-rose-400 font-mono">{unitPanelCost.toFixed(1)} ₪</strong></span>
                      </div>
                    </div>

                    {/* Single unit profit pill */}
                    <div className="text-left bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                      <div className="text-[10px] text-emerald-400">ربح كل حساب</div>
                      <div className="text-xs font-bold text-emerald-300 font-mono">+{unitNetProfit.toFixed(1)} ₪</div>
                    </div>
                  </div>

                  {/* Quantity Counter Control - Mobile Optimized */}
                  <div className="bg-slate-800/80 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between mb-3 border border-slate-700/60 select-none">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCount(plan.id, -1)}
                        disabled={count <= 0}
                        aria-label="إنقاص"
                        className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-25 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition active:scale-90 text-xl font-bold touch-manipulation shadow-sm"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={count === 0 ? '' : count}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setCountDirectly(plan.id, val);
                        }}
                        placeholder="0"
                        className="w-16 h-12 sm:h-11 text-center bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-xl focus:outline-none focus:border-emerald-500"
                      />

                      <button
                        type="button"
                        onClick={() => updateCount(plan.id, 1)}
                        aria-label="زيادة"
                        className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition active:scale-90 shadow-md shadow-emerald-600/30 text-xl font-bold touch-manipulation"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quick +2 and +5 presets */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCount(plan.id, 2)}
                        className="min-w-[42px] min-h-[44px] sm:min-h-[40px] px-3 py-2 sm:py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 transition font-mono font-bold text-xs flex items-center justify-center touch-manipulation"
                      >
                        +2
                      </button>
                      <button
                        type="button"
                        onClick={() => updateCount(plan.id, 5)}
                        className="min-w-[42px] min-h-[44px] sm:min-h-[40px] px-3 py-2 sm:py-1.5 rounded-xl bg-slate-700/70 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 transition font-mono font-bold text-xs flex items-center justify-center touch-manipulation"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Calculations breakdown for this tier */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">المبيعات: </span>
                      <span className="font-bold text-white font-mono">{formatShekel(subRevenue)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">صافي الربح: </span>
                      <span className={`font-bold font-mono ${totalPlanProfit > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        +{formatShekel(totalPlanProfit)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Panel Sales Section (بيع لوحات كاملة: تكلفة 120 ₪ - بيع 350 ₪ - ربح 230 ₪) */}
          <div className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-xl ${
            panelSalesCount > 0
              ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/60 shadow-amber-500/10'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shadow-lg shadow-amber-500/10 shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">بيع لوحة كاملة (للموزعين / ريسيلر)</h3>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                      +{(panelSalePrice - panelSaleCost)} ₪ ربح صافي! 🔥
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    سعر اللوحة عليك <span className="text-rose-400 font-mono font-bold">{panelSaleCost} ₪</span> • وتبيعها بسعر <span className="text-emerald-400 font-mono font-bold">{panelSalePrice} ₪</span> (صافي ربحك <span className="text-white font-mono font-bold">+{panelSalePrice - panelSaleCost} ₪</span> لكل لوحة)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomPanelPrice(!showCustomPanelPrice)}
                className="text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/60 transition self-start sm:self-auto flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>{showCustomPanelPrice ? 'إخفاء تخصيص السعر' : 'تعديل السعر أو التكلفة'}</span>
              </button>
            </div>

            {/* Custom Price Inputs if toggled */}
            {showCustomPanelPrice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 animate-in fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    سعر بيع اللوحة للزبون (شيكل):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={panelSalePrice}
                    onChange={(e) => setPanelSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    placeholder="350"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">السعر الذي يقبضه الموزع منك</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    تكلفة شراء اللوحة عليك (شيكل):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={panelSaleCost}
                    onChange={(e) => setPanelSaleCost(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-500"
                    placeholder="120"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">التكلفة الأصلية للوحة 10 سنوات</span>
                </div>
              </div>
            )}

            {/* Quantity Counter Control & Calculations - Mobile First */}
            <div className="bg-slate-800/80 rounded-2xl p-3 flex flex-col gap-3 border border-slate-700/60 select-none">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPanelSalesCount(Math.max(0, panelSalesCount - 1))}
                    disabled={panelSalesCount <= 0}
                    aria-label="إنقاص"
                    className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-25 disabled:hover:bg-slate-700 text-white flex items-center justify-center transition active:scale-90 text-xl font-bold touch-manipulation shadow-sm"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={panelSalesCount === 0 ? '' : panelSalesCount}
                    onChange={(e) => setPanelSalesCount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-16 h-12 sm:h-11 text-center bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-xl focus:outline-none focus:border-amber-500"
                  />

                  <button
                    type="button"
                    onClick={() => setPanelSalesCount(panelSalesCount + 1)}
                    aria-label="زيادة"
                    className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center transition active:scale-90 shadow-md shadow-amber-600/30 text-xl font-bold touch-manipulation"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick presets */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPanelSalesCount(panelSalesCount + 1)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 transition font-mono font-bold text-xs flex items-center justify-center touch-manipulation"
                  >
                    +1 لوحة
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanelSalesCount(panelSalesCount + 2)}
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 active:bg-slate-600 active:scale-95 text-slate-200 transition font-mono font-bold text-xs flex items-center justify-center touch-manipulation"
                  >
                    +2 لوحة
                  </button>
                </div>
              </div>

              {/* Financial breakdown for panel sales - Responsive 3 Column Card Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-center font-mono">
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">المبيعات</div>
                  <div className="font-bold text-white text-xs sm:text-sm mt-0.5">{formatShekel(panelSalesCount * panelSalePrice)}</div>
                </div>
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-sans">التكلفة</div>
                  <div className="font-bold text-rose-400 text-xs sm:text-sm mt-0.5">-{formatShekel(panelSalesCount * panelSaleCost)}</div>
                </div>
                <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 font-sans font-bold">صافي الربح</div>
                  <div className="font-bold text-emerald-300 text-xs sm:text-sm mt-0.5">+{formatShekel(panelSalesCount * (panelSalePrice - panelSaleCost))}</div>
                </div>
              </div>
            </div>

            {/* Note for panel sale */}
            {panelSalesCount > 0 && (
              <div className="mt-3">
                <input
                  type="text"
                  value={panelSaleNotes}
                  onChange={(e) => setPanelSaleNotes(e.target.value)}
                  placeholder="ملاحظات بيع اللوحة (اسم المشتري، المدينة، كود اللوحة...)"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Social Media Advertising Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">مصاريف الترويج والإعلانات الممولة</h3>
                  <p className="text-xs text-slate-400">فيسبوك، تيك توك، انستغرام (بالدولار $ أو بالشيكل ₪)</p>
                </div>
              </div>

              {/* Currency conversion reminder badge */}
              <div className="text-xs bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-slate-300 font-mono">
                1$ = {settings.usdExchangeRate} ₪
              </div>
            </div>

            {/* Ad Input Box */}
            <div className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* Amount */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    المبلغ المصروف على الإعلانات:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={adAmount}
                      onChange={(e) => setAdAmount(e.target.value)}
                      placeholder="مثال: 10 أو 50"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Currency Selector (USD or ILS) */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    العملة:
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setAdCurrency('USD')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        adCurrency === 'USD'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      دولار ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdCurrency('ILS')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        adCurrency === 'ILS'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      شيكل (₪)
                    </button>
                  </div>
                </div>

                {/* Platform */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    المنصة:
                  </label>
                  <select
                    value={adPlatform}
                    onChange={(e) => setAdPlatform(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="facebook">فيسبوك (Facebook Ads)</option>
                    <option value="tiktok">تيك توك (TikTok Ads)</option>
                    <option value="instagram">انستغرام (Instagram)</option>
                    <option value="snapchat">سناب شات (Snapchat)</option>
                    <option value="other">منصة أخرى / ترويج مباشر</option>
                  </select>
                </div>

                {/* Add button */}
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddAdCampaign}
                    disabled={!adAmount || parseFloat(adAmount) <= 0}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة
                  </button>
                </div>
              </div>

              {/* Real-time conversion preview for what is typed */}
              {adAmount && parseFloat(adAmount) > 0 && (
                <div className="text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg flex items-center justify-between">
                  <span>
                    المبلغ المدخل:{' '}
                    <strong>
                      {adCurrency === 'USD' ? formatUSD(parseFloat(adAmount)) : formatShekel(parseFloat(adAmount))}
                    </strong>
                  </span>
                  <span>
                    يعادل بالشيكل:{' '}
                    <strong className="text-white font-mono font-bold">
                      {adCurrency === 'USD'
                        ? formatShekel(parseFloat(adAmount) * settings.usdExchangeRate)
                        : formatShekel(parseFloat(adAmount))}
                    </strong>
                    {adCurrency === 'ILS' && (
                      <span className="text-slate-400 font-mono"> ({formatUSD(parseFloat(adAmount) / settings.usdExchangeRate)})</span>
                    )}
                  </span>
                </div>
              )}

              {/* List of added ad campaigns */}
              {adCampaigns.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">الحملات المضافة لهذا اليوم:</div>
                  <div className="space-y-1.5">
                    {adCampaigns.map((ad, idx) => {
                      const amountILS = ad.currency === 'USD' ? ad.amount * settings.usdExchangeRate : ad.amount;
                      return (
                        <div
                          key={idx}
                          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {ad.platform === 'facebook'
                                ? 'فيسبوك'
                                : ad.platform === 'tiktok'
                                ? 'تيك توك'
                                : ad.platform === 'instagram'
                                ? 'انستغرام'
                                : 'إعلان ممول'}
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="font-mono text-blue-300 font-bold">
                              {ad.currency === 'USD' ? formatUSD(ad.amount) : formatShekel(ad.amount)}
                            </span>
                            {ad.currency === 'USD' && (
                              <span className="text-slate-400 font-mono">({formatShekel(amountILS)})</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdCampaign(idx)}
                            className="text-slate-400 hover:text-rose-400 font-medium transition"
                          >
                            حذف
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Other expenses and notes in collapsible / clean rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  مصاريف أخرى (شيكل):
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                  placeholder="عمولات، تحويل، شرائح اتصالات... (اختياري)"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ملاحظات اليوم:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: مباريات دوري أبطال أوروبا، إقبال ممتاز"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: LIVE FINANCIAL AUDIT BOX (Sticky on desktop) */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl sticky top-28 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">تقرير أرباح اليوم الفوري</h3>
                  <p className="text-[11px] text-slate-400">{date}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  {liveSummary.totalAccountsSold} حساب
                </span>
                {liveSummary.totalPanelsSold > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono font-bold">
                    {liveSummary.totalPanelsSold} لوحة
                  </span>
                )}
              </div>
            </div>

            {/* Financial Line Items */}
            <div className="space-y-3 text-sm">
              
              {/* Gross Revenue */}
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">إجمالي المبيعات (الدخل):</span>
                  <span className="font-mono font-bold text-white text-base">
                    {formatShekel(liveSummary.grossRevenue)}
                  </span>
                </div>
                {liveSummary.totalPanelsSold > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 font-mono">
                    <span>اشتراكات: {formatShekel(liveSummary.subscriptionsRevenue)}</span>
                    <span className="text-purple-300">لوحات موزعين: {formatShekel(liveSummary.panelSalesRevenue)}</span>
                  </div>
                )}
              </div>

              {/* Panel Server Cost */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>تكلفة اللوحات والسيرفرات:</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400">
                    - {formatShekel(liveSummary.panelCost)}
                  </span>
                </div>
                {liveSummary.totalPanelsSold > 0 ? (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pr-3 font-mono">
                    <span>رصيد الحسابات ({liveSummary.totalMonthsSold} شهر): -{formatShekel(liveSummary.subscriptionPanelCost)}</span>
                    <span className="text-rose-400">لوحات كاملة ({liveSummary.totalPanelsSold}): -{formatShekel(liveSummary.panelSalesCost)}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 pr-3 font-mono">
                    (تغطي {liveSummary.totalMonthsSold} شهر اشتراك)
                  </div>
                )}
              </div>

              {/* Marketing / Ad Spend */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>مصاريف الإعلانات والترويج:</span>
                </div>
                <div className="text-left font-mono">
                  <span className="font-bold text-rose-400">- {formatShekel(liveSummary.adExpenseILS)}</span>
                  {liveSummary.adExpenseUSD > 0 && (
                    <div className="text-[10px] text-slate-400">({formatUSD(liveSummary.adExpenseUSD)})</div>
                  )}
                </div>
              </div>

              {/* Other Expenses */}
              {liveSummary.otherExpenses > 0 && (
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">مصاريف أخرى:</span>
                  <span className="font-mono font-bold text-rose-400">- {formatShekel(liveSummary.otherExpenses)}</span>
                </div>
              )}

              {/* Total Expenses Divider */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>إجمالي المصاريف والتكاليف:</span>
                <span className="font-mono font-semibold text-rose-300">
                  {formatShekel(liveSummary.totalExpenses)}
                </span>
              </div>
            </div>

            {/* BIG NET PROFIT CARD */}
            <div className={`p-4 rounded-xl border text-center transition-all ${
              liveSummary.netProfit > 0
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : liveSummary.netProfit < 0
                ? 'bg-rose-950/40 border-rose-500/40'
                : 'bg-slate-800/60 border-slate-700'
            }`}>
              <div className="text-xs font-semibold text-slate-300 mb-1">
                صافي الربح الفعلي لليوم (في جيبك):
              </div>
              <div className={`text-3xl font-black font-mono tracking-tight ${
                liveSummary.netProfit > 0
                  ? 'text-emerald-400'
                  : liveSummary.netProfit < 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}>
                {liveSummary.netProfit > 0 ? '+' : ''}{formatShekel(liveSummary.netProfit)}
              </div>
              
              <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                <span>يعادل: <strong className="text-emerald-300">{formatUSD(liveSummary.netProfitUSD)}</strong></span>
                <span>•</span>
                <span>هامش الربح: <strong className="text-cyan-400">{liveSummary.profitMargin.toFixed(0)}%</strong></span>
              </div>
            </div>

            {/* Plan breakdown mini list */}
            {(liveSummary.totalAccountsSold > 0 || liveSummary.totalPanelsSold > 0) && (
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 text-xs space-y-2">
                <div className="font-semibold text-slate-300">تفاصيل مبيعات اليوم:</div>
                
                {liveSummary.totalPanelsSold > 0 && (
                  <div className="flex items-center justify-between text-purple-300 bg-purple-950/30 p-2 rounded-lg border border-purple-800/40">
                    <span className="font-bold">• لوحات كاملة (موزعين):</span>
                    <span className="font-mono font-bold">
                      {liveSummary.totalPanelsSold} لوحة ({formatShekel(liveSummary.panelSalesRevenue)})
                      <span className="text-emerald-400 text-[10px] mr-1.5">[ربح: +{formatShekel(liveSummary.panelSalesProfit)}]</span>
                    </span>
                  </div>
                )}

                {plans.map((pl) => {
                  const data = liveSummary.salesByPlan[pl.id];
                  if (!data || data.count === 0) return null;
                  return (
                    <div key={pl.id} className="flex items-center justify-between text-slate-400 px-1">
                      <span>• {pl.name}:</span>
                      <span className="font-mono font-bold text-white">
                        {data.count} حساب ({formatShekel(data.revenue)})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Button */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-base active:scale-[0.98]"
              >
                <Save className="w-5 h-5" />
                <span>حفظ بيانات هذا اليوم وتثبيتها</span>
              </button>

              {savedSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  تم حفظ بيانات اليوم بنجاح في السجل الدائم!
                </div>
              )}
            </div>

            {/* Helpful tip */}
            <div className="text-[11px] text-slate-400 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                يتم حفظ كل يوم بشكل مستقل في ذاكرة التطبيق الدائمة. يمكنك الرجوع لأي يوم في تبويب "سجل الأيام" وتعديله في أي وقت.
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Sticky Floating Summary & Quick Save Bar */}
      <div className="lg:hidden fixed bottom-[68px] sm:bottom-4 left-3 right-3 z-30 bg-slate-900/95 backdrop-blur-lg border border-emerald-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 select-none">
        <div className="flex flex-col">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>صافي الربح اليوم:</span>
            <span className="font-mono text-cyan-400 font-bold">
              ({liveSummary.totalAccountsSold} حساب{liveSummary.totalPanelsSold > 0 ? ` + ${liveSummary.totalPanelsSold} لوحة` : ''})
            </span>
          </div>
          <div className={`text-base font-black font-mono ${
            liveSummary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {liveSummary.netProfit > 0 ? '+' : ''}{formatShekel(liveSummary.netProfit)}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 active:scale-95 touch-manipulation min-h-[42px]"
        >
          <Save className="w-4 h-4" />
          <span>حفظ اليوم</span>
        </button>
      </div>
    </div>
  );
};

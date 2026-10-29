import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Tv,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { DailyRecord, Panel, PlanConfig } from '../types';
import { AppSettings, exportToCSV } from '../utils/storage';
import { calculateDailySummary, formatShekel, formatUSD } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface HistoryViewProps {
  records: DailyRecord[];
  panels: Panel[];
  plans: PlanConfig[];
  settings: AppSettings;
  onEditRecord: (date: string) => void;
  onDeleteRecord: (id: string) => void;
  onClearAllRecords?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  panels,
  plans,
  settings,
  onEditRecord,
  onDeleteRecord,
  onClearAllRecords,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month' | 'last_month'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // In-app deletion dialog states
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; date: string } | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Filter records
  const filteredRecords = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    return records
      .filter((rec) => {
        // Date filter
        if (filterPeriod === 'today') {
          if (rec.date !== todayStr) return false;
        } else if (filterPeriod === 'week') {
          const recDate = new Date(rec.date);
          const diffDays = (today.getTime() - recDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7 || diffDays < 0) return false;
        } else if (filterPeriod === 'month') {
          const currentMonthPrefix = todayStr.substring(0, 7);
          if (!rec.date.startsWith(currentMonthPrefix)) return false;
        } else if (filterPeriod === 'last_month') {
          const lastMonthDate = new Date();
          lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
          const lastMonthPrefix = lastMonthDate.toISOString().substring(0, 7);
          if (!rec.date.startsWith(lastMonthPrefix)) return false;
        }

        // Search text
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDate = rec.date.includes(q);
          const matchNotes = (rec.notes || '').toLowerCase().includes(q);
          if (!matchDate && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, filterPeriod, searchQuery]);

  // Aggregate stats for the filtered list
  const totals = useMemo(() => {
    let grossRevenue = 0;
    let panelCost = 0;
    let adExpenseILS = 0;
    let adExpenseUSD = 0;
    let otherExpenses = 0;
    let netProfit = 0;
    let totalAccounts = 0;
    let totalPanelsSold = 0;
    let panelSalesProfit = 0;
    let panelSalesRevenue = 0;

    filteredRecords.forEach((rec) => {
      const sum = calculateDailySummary(rec, panels, plans);
      grossRevenue += sum.grossRevenue;
      panelCost += sum.panelCost;
      adExpenseILS += sum.adExpenseILS;
      adExpenseUSD += sum.adExpenseUSD;
      otherExpenses += sum.otherExpenses;
      netProfit += sum.netProfit;
      totalAccounts += sum.totalAccountsSold;
      totalPanelsSold += sum.totalPanelsSold;
      panelSalesProfit += sum.panelSalesProfit;
      panelSalesRevenue += sum.panelSalesRevenue;
    });

    const netProfitUSD = settings.usdExchangeRate > 0 ? netProfit / settings.usdExchangeRate : 0;
    const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      grossRevenue,
      panelCost,
      adExpenseILS,
      adExpenseUSD,
      otherExpenses,
      netProfit,
      netProfitUSD,
      totalAccounts,
      totalPanelsSold,
      panelSalesProfit,
      panelSalesRevenue,
      margin,
    };
  }, [filteredRecords, panels, plans, settings.usdExchangeRate]);

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, panels, plans);
  };

  const handleConfirmSingleDelete = () => {
    if (recordToDelete) {
      onDeleteRecord(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  const handleConfirmClearAll = () => {
    if (onClearAllRecords) {
      onClearAllRecords();
    }
    setShowClearAllDialog(false);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Top Banner & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">سجل الأيام والتقارير المالية</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              عرض تفاصيل كل يوم: الاشتراكات المباعة، تكلفة اللوحات، مصاريف الإعلانات، وصافي الأرباح.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {records.length > 0 && onClearAllRecords && (
              <button
                onClick={() => setShowClearAllDialog(true)}
                className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>تصفير كافة السجلات</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              disabled={records.length === 0}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير إكسل (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto scrollbar-none flex-nowrap shrink-0">
            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                filterPeriod === 'all'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              جميع الأيام ({records.length})
            </button>
            <button
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                filterPeriod === 'today'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setFilterPeriod('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                filterPeriod === 'week'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                filterPeriod === 'month'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setFilterPeriod('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 whitespace-nowrap ${
                filterPeriod === 'last_month'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              الشهر الماضي
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالتاريخ أو الملاحظات..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary Cards for selected period */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Net Profit Card */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-lg col-span-2 sm:col-span-1">
          <div className="text-[11px] text-slate-400 font-medium mb-1">صافي الربح للفترة</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {formatShekel(totals.netProfit)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            يعادل: {formatUSD(totals.netProfitUSD)}
          </div>
        </div>

        {/* Gross Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-medium mb-1">إجمالي المبيعات</div>
          <div className="text-xl font-bold text-white font-mono">{formatShekel(totals.grossRevenue)}</div>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">هامش الربح: {totals.margin.toFixed(0)}%</div>
        </div>

        {/* Total Accounts & Panels Sold */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-medium mb-1">المبيعات الإجمالية</div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {totals.totalAccounts} <span className="text-xs text-slate-400 font-normal">حساب</span>
            </span>
            {totals.totalPanelsSold > 0 && (
              <span className="text-sm font-bold text-purple-300 font-mono">
                + {totals.totalPanelsSold} لوحة
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {totals.totalPanelsSold > 0 ? (
              <span className="text-purple-300 font-semibold">أرباح بيع اللوحات: +{formatShekel(totals.panelSalesProfit)}</span>
            ) : (
              `معدل ${filteredRecords.length > 0 ? (totals.totalAccounts / filteredRecords.length).toFixed(1) : 0} حساب / يوم`
            )}
          </div>
        </div>

        {/* Ads Spend */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-medium mb-1">مصاريف الإعلانات</div>
          <div className="text-xl font-bold text-rose-400 font-mono">{formatShekel(totals.adExpenseILS)}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {totals.adExpenseUSD > 0 ? `(${formatUSD(totals.adExpenseUSD)})` : '0$'}
          </div>
        </div>

        {/* Panel credits cost */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="text-[11px] text-slate-400 font-medium mb-1">تكلفة رصيد السيرفر</div>
          <div className="text-xl font-bold text-amber-400 font-mono">{formatShekel(totals.panelCost)}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">مخصوم من اللوحات</div>
        </div>
      </div>

      {/* Days List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 sm:p-12 text-center shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">السجلات فارغة تماماً</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            لا توجد أيام مسجلة حالياً. يمكنك الذهاب إلى تبويب "اليومية" والبدء في تسجيل مبيعاتك اليومية وحفظها.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((rec) => {
            const sum = calculateDailySummary(rec, panels, plans);
            const isExpanded = expandedRecordId === rec.id;

            return (
              <div
                key={rec.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg transition"
              >
                {/* Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Date & Counts */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-center font-mono shrink-0">
                      <span className="text-[10px] text-slate-400">{rec.date.split('-')[1]}</span>
                      <span className="text-sm font-black text-white">{rec.date.split('-')[2]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm sm:text-base font-mono">{rec.date}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                          {sum.totalAccountsSold} حساب
                        </span>
                        {sum.totalPanelsSold > 0 && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono font-bold">
                            {sum.totalPanelsSold} لوحة موزعين
                          </span>
                        )}
                      </div>

                      {/* Quick plan breakdown chips */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-400">
                        {sum.totalPanelsSold > 0 && (
                          <span className="bg-purple-950/60 border border-purple-800/50 text-purple-300 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold">
                            لوحات: {sum.totalPanelsSold} (ربح: +{formatShekel(sum.panelSalesProfit)})
                          </span>
                        )}
                        {plans.map((pl) => {
                          const count = sum.salesByPlan[pl.id]?.count || 0;
                          if (count === 0) return null;
                          return (
                            <span key={pl.id} className="bg-slate-800/80 px-2 py-0.5 rounded-md text-[11px] font-mono">
                              {pl.name}: <strong className="text-slate-200">{count}</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics in Row */}
                  <div className="flex items-center gap-3 sm:gap-6 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    
                    {/* Revenue */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">المبيعات</div>
                      <div className="font-mono font-bold text-white text-sm">{formatShekel(sum.grossRevenue)}</div>
                    </div>

                    {/* Ads Spend */}
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">الإعلانات</div>
                      <div className="font-mono font-bold text-rose-400 text-sm">
                        {sum.adExpenseILS > 0 ? `-${formatShekel(sum.adExpenseILS)}` : '0 ₪'}
                      </div>
                    </div>

                    {/* Net Profit Pill */}
                    <div className="text-left bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
                      <div className="text-[10px] text-emerald-400">صافي الربح</div>
                      <div className="font-mono font-black text-emerald-300 text-sm sm:text-base">
                        +{formatShekel(sum.netProfit)}
                      </div>
                    </div>

                    {/* Actions: Edit, Delete, Expand */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditRecord(rec.date)}
                        title="تعديل هذا اليوم في لوحة الإدخال"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* In-app delete trigger (works 100% in iframes) */}
                      <button
                        onClick={() => setRecordToDelete({ id: rec.id, date: rec.date })}
                        title="حذف هذا اليوم"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 text-xs animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Subscriptions & Panel breakdown */}
                      <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="font-bold text-slate-200">الاشتراكات واللوحات المباعة:</div>
                        
                        {rec.panelSales && rec.panelSales.length > 0 && rec.panelSales.map((ps, idx) => (
                          <div key={`p-${idx}`} className="flex justify-between items-center text-purple-300 bg-purple-950/30 px-2 py-1.5 rounded-lg border border-purple-800/40">
                            <span className="font-semibold">لوحة كاملة ({ps.count}×):</span>
                            <span className="font-mono font-bold">
                              {formatShekel(ps.count * (ps.pricePerUnit || 350))}
                              <span className="text-emerald-400 text-[10px] mr-1"> (+{formatShekel(ps.count * ((ps.pricePerUnit || 350) - (ps.costPerUnit || 120)))})</span>
                            </span>
                          </div>
                        ))}

                        {rec.sales.map((s, idx) => (
                          <div key={idx} className="flex justify-between text-slate-300 px-1">
                            <span>{s.planName} ({s.count}×):</span>
                            <span className="font-mono font-bold text-white">
                              {formatShekel(s.count * s.pricePerUnit)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Cost details */}
                      <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="font-bold text-slate-200">تفاصيل التكاليف والمصاريف:</div>
                        {sum.totalPanelsSold > 0 ? (
                          <>
                            <div className="flex justify-between text-slate-400">
                              <span>رصيد السيرفر ({sum.totalMonthsSold} شهر):</span>
                              <span className="font-mono text-rose-400">-{formatShekel(sum.subscriptionPanelCost)}</span>
                            </div>
                            <div className="flex justify-between text-purple-300">
                              <span>تكلفة شراء اللوحات ({sum.totalPanelsSold} لوحة):</span>
                              <span className="font-mono text-rose-400">-{formatShekel(sum.panelSalesCost)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-slate-400">
                            <span>تكلفة رصيد السيرفر ({sum.totalMonthsSold} شهر):</span>
                            <span className="font-mono text-rose-400">-{formatShekel(sum.panelCost)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-400">
                          <span>مصاريف الإعلانات:</span>
                          <span className="font-mono text-rose-400">
                            -{formatShekel(sum.adExpenseILS)}
                            {sum.adExpenseUSD > 0 && ` (${formatUSD(sum.adExpenseUSD)})`}
                          </span>
                        </div>
                        {sum.otherExpenses > 0 && (
                          <div className="flex justify-between text-slate-400">
                            <span>مصاريف أخرى:</span>
                            <span className="font-mono text-rose-400">-{formatShekel(sum.otherExpenses)}</span>
                          </div>
                        )}
                      </div>

                      {/* Profit and margin */}
                      <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="font-bold text-slate-200">مؤشرات الأداء:</div>
                        <div className="flex justify-between text-slate-300">
                          <span>صافي الربح بالدولار:</span>
                          <span className="font-mono font-bold text-emerald-400">{formatUSD(sum.netProfitUSD)}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>نسبة هامش الربح:</span>
                          <span className="font-mono font-bold text-cyan-400">{sum.profitMargin.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>سعر صرف الدولار المعتمد:</span>
                          <span className="font-mono text-slate-400">1$ = {rec.usdExchangeRate || 3.70} ₪</span>
                        </div>
                      </div>
                    </div>

                    {rec.notes && (
                      <div className="text-slate-300 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800 italic">
                        <strong>ملاحظات:</strong> {rec.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* In-app Single Record Delete Confirmation Modal (100% iframe safe) */}
      <ConfirmDialog
        isOpen={recordToDelete !== null}
        title="حذف سجل اليوم"
        message={`هل أنت متأكد من حذف سجل يوم ${recordToDelete?.date || ''} نهائياً؟ سيتم استرجاع رصيد اللوحة المحسوب وحذف الأرباح المرتبطة به.`}
        confirmLabel="نعم، احذف اليوم"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={handleConfirmSingleDelete}
        onCancel={() => setRecordToDelete(null)}
      />

      {/* In-app Clear All Records Confirmation Modal */}
      <ConfirmDialog
        isOpen={showClearAllDialog}
        title="تصفير وحذف كافة السجلات"
        message="هل أنت متأكد من تصفير كافة سجلات الأيام نهائياً؟ سيتم حذف جميع المبيعات السابقة وتصفير رصيد السيرفرات المستهلكة."
        confirmLabel="نعم، قم بتصفير الكل"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={handleConfirmClearAll}
        onCancel={() => setShowClearAllDialog(false)}
      />
    </div>
  );
};

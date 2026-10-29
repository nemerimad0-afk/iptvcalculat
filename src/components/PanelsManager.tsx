import React, { useState } from 'react';
import { Layers, Plus, Trash2, Edit3, Check, Calendar, AlertCircle, Sparkles, Clock, CheckCircle2, ShoppingCart, Zap, TrendingUp, CheckCircle } from 'lucide-react';
import { Panel, DailyRecord } from '../types';
import { getPanelCostPerMonth, getPanelCostPerYear, formatShekel, formatMonthsDuration } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface PanelsManagerProps {
  panels: Panel[];
  records: DailyRecord[];
  onUpdatePanels: (panels: Panel[]) => void;
  onOpenBuyModal?: () => void;
}

export const PanelsManager: React.FC<PanelsManagerProps> = ({
  panels,
  records,
  onUpdatePanels,
  onOpenBuyModal,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [panelToDelete, setPanelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formYears, setFormYears] = useState('10');
  const [formCost, setFormCost] = useState('120');
  const [formNotes, setFormNotes] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate consumed months per panel
  const consumedByPanel: Record<string, number> = {};
  records.forEach((rec) => {
    (rec.sales || []).forEach((sale) => {
      const pId = sale.panelId || panels[0]?.id || 'panel_default';
      const months = (Number(sale.count) || 0) * (Number(sale.durationMonths) || 1);
      consumedByPanel[pId] = (consumedByPanel[pId] || 0) + months;
    });
  });

  // Aggregate stats across all panels
  const totalPanelsCount = panels.length;
  const totalInvestedInPanels = panels.reduce((sum, p) => sum + p.cost, 0);
  const totalYearsAllPanels = panels.reduce((sum, p) => sum + p.totalYears, 0);
  const totalMonthsAllPanels = totalYearsAllPanels * 12;
  const totalMonthsConsumed = Object.values(consumedByPanel).reduce((sum, val) => sum + val, 0);
  const totalMonthsRemaining = Math.max(0, totalMonthsAllPanels - totalMonthsConsumed);

  const openAddModal = () => {
    setEditingPanelId(null);
    setFormName(`لوحة سيرفر إضافية #${panels.length + 1}`);
    setFormYears('10');
    setFormCost('120');
    setFormNotes('لوحة 10 سنوات بسعر 120 شيكل');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleQuickBuy = (years: number, cost: number, title: string) => {
    const newPanel: Panel = {
      id: `panel_${Date.now()}`,
      name: `${title} #${panels.length + 1}`,
      totalYears: years,
      cost: cost,
      notes: `${years} سنوات مقابل ${cost} شيكل`,
      purchaseDate: new Date().toISOString().split('T')[0],
      isDefault: true,
    };

    onUpdatePanels([...panels, newPanel]);
    setToastMessage(`تهانينا! تم شراء وإضافة ${title} بنجاح إلى رصيدك.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openEditModal = (p: Panel) => {
    setEditingPanelId(p.id);
    setFormName(p.name);
    setFormYears(p.totalYears.toString());
    setFormCost(p.cost.toString());
    setFormNotes(p.notes || '');
    setFormDate(p.purchaseDate || new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleSavePanel = () => {
    const years = parseFloat(formYears);
    const cost = parseFloat(formCost);

    if (!formName.trim() || isNaN(years) || years <= 0 || isNaN(cost) || cost < 0) {
      setToastMessage('يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (editingPanelId) {
      const updated = panels.map((p) =>
        p.id === editingPanelId
          ? {
              ...p,
              name: formName.trim(),
              totalYears: years,
              cost: cost,
              notes: formNotes,
              purchaseDate: formDate,
            }
          : p
      );
      onUpdatePanels(updated);
    } else {
      const newPanel: Panel = {
        id: `panel_${Date.now()}`,
        name: formName.trim(),
        totalYears: years,
        cost: cost,
        notes: formNotes,
        purchaseDate: formDate,
        isDefault: panels.length === 0,
      };
      onUpdatePanels([...panels, newPanel]);
    }

    setShowAddModal(false);
  };

  const handleDeletePanel = (panel: Panel) => {
    if (panels.length <= 1) {
      setToastMessage('يجب الإبقاء على لوحة واحدة على الأقل لحساب التكاليف.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setPanelToDelete({ id: panel.id, name: panel.name });
  };

  const confirmDeletePanel = () => {
    if (panelToDelete) {
      onUpdatePanels(panels.filter((p) => p.id !== panelToDelete.id));
      setPanelToDelete(null);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = panels.map((p) => ({
      ...p,
      isDefault: p.id === id,
    }));
    onUpdatePanels(updated);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">إدارة وشراء لوحات السيرفرات (IPTV Panels)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            يمكنك امتلاك وشراء أي عدد من اللوحات (مثل لوحة 10 سنوات بـ 120 شيكل). يحسب التطبيق تلقائياً تكلفة كل اشتراك ويتابع الرصيد المتبقي بدقة.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20 text-xs sm:text-sm active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>شراء لوحة جديدة</span>
          </button>
        </div>
      </div>

      {/* QUICK BUY PRESET PACKAGES (Direct One-Click Purchase) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">شراء سريع لباقة لوحة جديدة بضغطة واحدة:</h3>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">تُضاف مباشرة إلى قائمة لوحاتك ورصيدك</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 10 Years Preset */}
          <div className="bg-slate-800/90 border-2 border-emerald-500/60 rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 left-0 bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-br-lg">
              الخيار القياسي
            </div>
            <div>
              <div className="font-black text-white text-sm">لوحة 10 سنوات (120 شهر)</div>
              <div className="text-xs text-slate-400 mt-1">
                تكلفة الشهر 1.00 ₪ فقط • تكلفة السنة 12 ₪
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/80">
              <span className="text-base font-black text-emerald-400 font-mono">120 ₪</span>
              <button
                type="button"
                onClick={() => handleQuickBuy(10, 120, 'لوحة 10 سنوات (120 شيكل)')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-md active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>شراء الآن</span>
              </button>
            </div>
          </div>

          {/* 5 Years Preset */}
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-600 transition">
            <div>
              <div className="font-bold text-white text-sm">لوحة 5 سنوات (60 شهر)</div>
              <div className="text-xs text-slate-400 mt-1">
                تكلفة الشهر ~1.08 ₪ • باقة تجربة مصغرة
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/80">
              <span className="text-base font-black text-white font-mono">65 ₪</span>
              <button
                type="button"
                onClick={() => handleQuickBuy(5, 65, 'لوحة 5 سنوات (65 شيكل)')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>شراء الآن</span>
              </button>
            </div>
          </div>

          {/* 20 Years Preset */}
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-slate-600 transition">
            <div>
              <div className="font-bold text-white text-sm">لوحة 20 سنة (240 شهر)</div>
              <div className="text-xs text-slate-400 mt-1">
                تكلفة الشهر ~0.91 ₪ • توفير بالجملة
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/80">
              <span className="text-base font-black text-cyan-400 font-mono">220 ₪</span>
              <button
                type="button"
                onClick={() => handleQuickBuy(20, 220, 'لوحة 20 سنة (220 شيكل)')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>شراء الآن</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Panels Financial KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">عدد اللوحات المملوكة</div>
          <div className="text-lg font-bold text-white font-mono">{totalPanelsCount} لوحة</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">إجمالي مدفوعات شراء اللوحات</div>
          <div className="text-lg font-bold text-emerald-400 font-mono">{formatShekel(totalInvestedInPanels)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">الرصيد الكلي المشترى</div>
          <div className="text-lg font-bold text-cyan-400 font-mono">{totalYearsAllPanels} سنة ({totalMonthsAllPanels} شهر)</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <div className="text-[11px] text-slate-400">الرصيد المتبقي حالياً</div>
          <div className="text-lg font-bold text-amber-400 font-mono">{(totalMonthsRemaining / 12).toFixed(1)} سنة ({totalMonthsRemaining} شهر)</div>
        </div>
      </div>

      {/* Panels Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {panels.map((panel) => {
          const costPerMonth = getPanelCostPerMonth(panel);
          const costPerYear = getPanelCostPerYear(panel);
          const totalMonths = panel.totalYears * 12;
          const consumedMonths = consumedByPanel[panel.id] || 0;
          const remainingMonths = Math.max(0, totalMonths - consumedMonths);
          const consumedPercent = totalMonths > 0 ? Math.min(100, (consumedMonths / totalMonths) * 100) : 0;
          const remainingValue = remainingMonths * costPerMonth;

          return (
            <div
              key={panel.id}
              className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition relative overflow-hidden ${
                panel.isDefault ? 'border-cyan-500/50 bg-slate-900/90' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {panel.isDefault && (
                <div className="absolute top-0 left-0 bg-cyan-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-br-xl">
                  اللوحة الافتراضية للبيع
                </div>
              )}

              <div>
                {/* Title & Cost */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-base">{panel.name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>تاريخ الشراء: {panel.purchaseDate || 'غير محدد'}</span>
                    </div>
                  </div>

                  <div className="text-left font-mono">
                    <div className="text-xs text-slate-400">سعر اللوحة</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-400">{formatShekel(panel.cost)}</div>
                  </div>
                </div>

                {/* Duration breakdown pill */}
                <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mb-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">مدة اللوحة:</span>
                    <span className="font-bold text-white font-mono">
                      {panel.totalYears} سنوات ({totalMonths} شهر)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تكلفة كل شهر في السيرفر:</span>
                    <span className="font-bold text-emerald-300 font-mono">
                      {costPerMonth.toFixed(2)} ₪ / شهر
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">تكلفة كل سنة كاملة:</span>
                    <span className="font-bold text-emerald-300 font-mono">
                      {costPerYear.toFixed(1)} ₪ / سنة
                    </span>
                  </div>
                </div>

                {/* Progress bar of consumed credits */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">الرصيد المتبقي:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatMonthsDuration(remainingMonths)}
                    </span>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        consumedPercent > 85
                          ? 'bg-rose-500'
                          : consumedPercent > 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(3, 100 - consumedPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span>تم استهلاك: {formatMonthsDuration(consumedMonths)}</span>
                    <span>قيمة المتبقي: {formatShekel(remainingValue)}</span>
                  </div>
                </div>

                {panel.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-800/40 p-2 rounded-lg border border-slate-800/80 mb-3 truncate">
                    "{panel.notes}"
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                {!panel.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(panel.id)}
                    className="text-xs text-slate-400 hover:text-cyan-400 font-semibold transition py-1"
                  >
                    تعيين كافتراضية
                  </button>
                ) : (
                  <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    الافتراضية
                  </span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(panel)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="تعديل"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePanel(panel)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  {editingPanelId ? 'تعديل بيانات اللوحة' : 'شراء وإضافة لوحة سيرفر جديدة'}
                </h3>
                <p className="text-xs text-slate-400">حدد مدة اللوحة وسعرها لحساب تكلفة كل اشتراك بدقة</p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم اللوحة / السيرفر:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: لوحة 10 سنوات بسعر 120 شيكل"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    المدة بالسنوات:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.5"
                    value={formYears}
                    onChange={(e) => setFormYears(e.target.value)}
                    placeholder="10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {parseFloat(formYears) ? `${parseFloat(formYears) * 12} شهر` : ''}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    سعر الشراء (شيكل ₪):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(e.target.value)}
                    placeholder="120"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-emerald-400 mt-1 block">
                    {parseFloat(formYears) && parseFloat(formCost)
                      ? `~ ${(parseFloat(formCost) / (parseFloat(formYears) * 12)).toFixed(2)} ₪ لكل شهر`
                      : ''}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  تاريخ الشراء:
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ملاحظات إضافية (اختياري):
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="رابط اللوحة، الدعم الفني..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSavePanel}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
              >
                <Check className="w-4 h-4" />
                حفظ وإضافة اللوحة
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Panel Confirm Dialog */}
      <ConfirmDialog
        isOpen={panelToDelete !== null}
        title="حذف اللوحة"
        message={`هل أنت متأكد من حذف ${panelToDelete?.name || ''}؟ لن تتمكن من التراجع عن هذه الخطوة.`}
        confirmLabel="نعم، حذف اللوحة"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={confirmDeletePanel}
        onCancel={() => setPanelToDelete(null)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

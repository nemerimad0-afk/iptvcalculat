import React, { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, Check, RotateCcw, Sparkles, TrendingUp, CheckCircle } from 'lucide-react';
import { Panel, PlanConfig } from '../types';
import { DEFAULT_PLANS, getPanelCostPerMonth, formatShekel } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface PlansManagerProps {
  plans: PlanConfig[];
  panels: Panel[];
  onUpdatePlans: (plans: PlanConfig[]) => void;
}

export const PlansManager: React.FC<PlansManagerProps> = ({
  plans,
  panels,
  onUpdatePlans,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formMonths, setFormMonths] = useState('1');
  const [formPrice, setFormPrice] = useState('15');
  const [formColor, setFormColor] = useState('emerald');

  const defaultPanel = panels.find((p) => p.isDefault) || panels[0];
  const costPerMonth = defaultPanel ? getPanelCostPerMonth(defaultPanel) : 1;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName('');
    setFormMonths('12');
    setFormPrice('70');
    setFormColor('emerald');
    setShowModal(true);
  };

  const handleOpenEdit = (plan: PlanConfig) => {
    setEditingId(plan.id);
    setFormName(plan.name);
    setFormMonths(plan.durationMonths.toString());
    setFormPrice(plan.defaultPrice.toString());
    setFormColor(plan.badgeColor || 'emerald');
    setShowModal(true);
  };

  const handleSave = () => {
    const months = parseFloat(formMonths);
    const price = parseFloat(formPrice);

    if (!formName.trim() || isNaN(months) || months <= 0 || isNaN(price) || price < 0) {
      setToastMessage('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (editingId) {
      const updated = plans.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: formName.trim(),
              durationMonths: months,
              defaultPrice: price,
              badgeColor: formColor,
            }
          : p
      );
      onUpdatePlans(updated);
    } else {
      const newPlan: PlanConfig = {
        id: `plan_${Date.now()}`,
        name: formName.trim(),
        durationMonths: months,
        defaultPrice: price,
        badgeColor: formColor,
      };
      onUpdatePlans([...plans, newPlan]);
    }

    setShowModal(false);
  };

  const handleDelete = (plan: PlanConfig) => {
    if (plans.length <= 1) {
      setToastMessage('يجب الإبقاء على باقة واحدة على الأقل.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    setPlanToDelete({ id: plan.id, name: plan.name });
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      onUpdatePlans(plans.filter((p) => p.id !== planToDelete.id));
      setPlanToDelete(null);
    }
  };

  const confirmResetDefaults = () => {
    onUpdatePlans(DEFAULT_PLANS);
    setShowResetConfirm(false);
    setToastMessage('تمت استعادة باقات الأسعار الافتراضية بنجاح.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">تسعير باقات الاشتراكات وهامش الربح</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            الباقات الـ 4 الأساسية محددة كما طلبت، ويمكنك تعديل أي سعر أو إضافة باقات خاصة. يتم احتساب صافي الربح وهامش الربح بناءً على تكلفة اللوحة الحالية ({costPerMonth.toFixed(2)} ₪ / شهر).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            استعادة الافتراضي
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs sm:text-sm shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            إضافة باقة جديدة
          </button>
        </div>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const panelDurationCost = plan.durationMonths * costPerMonth;
          const netProfitPerUnit = plan.defaultPrice - panelDurationCost;
          const profitMargin = plan.defaultPrice > 0 ? (netProfitPerUnit / plan.defaultPrice) * 100 : 0;

          return (
            <div
              key={plan.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                      {plan.durationMonths === 12
                        ? '12 شهر (سنة)'
                        : plan.durationMonths === 1
                        ? 'شهر واحد'
                        : `${plan.durationMonths} شهور`}
                    </span>
                    <h3 className="font-bold text-white text-base">{plan.name}</h3>
                  </div>

                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>

                {/* Selling Price Big Display */}
                <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60 mb-4 text-center">
                  <div className="text-[11px] text-slate-400 mb-0.5">سعر البيع للزبون</div>
                  <div className="text-2xl font-black text-white font-mono">{formatShekel(plan.defaultPrice)}</div>
                </div>

                {/* Profit Metrics Breakdown */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>تكلفة السيرفر:</span>
                    <span className="font-mono text-rose-400 font-bold">
                      - {formatShekel(panelDurationCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>صافي ربحك في الحساب:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      + {formatShekel(netProfitPerUnit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span>نسبة هامش الربح:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(plan)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(plan)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in zoom-in-95 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">
              {editingId ? 'تعديل سعر الباقة' : 'إضافة باقة جديدة'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الباقة:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: اشتراك 3 شهور VIP"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">المدة (بالشهور):</label>
                  <input
                    type="number"
                    min="1"
                    value={formMonths}
                    onChange={(e) => setFormMonths(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">سعر البيع (شيكل):</label>
                  <input
                    type="number"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition text-sm flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                حفظ
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Plan Confirm Dialog */}
      <ConfirmDialog
        isOpen={planToDelete !== null}
        title="حذف الباقة"
        message={`هل أنت متأكد من حذف ${planToDelete?.name || ''}؟`}
        confirmLabel="نعم، حذف الباقة"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={confirmDeletePlan}
        onCancel={() => setPlanToDelete(null)}
      />

      {/* Reset Defaults Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="استعادة الباقات الافتراضية"
        message="هل تريد استعادة باقات الأسعار الافتراضية (شهر بـ 15₪، 3 شهور بـ 30₪، 6 شهور بـ 50₪، سنة بـ 70₪)؟"
        confirmLabel="نعم، استعادة"
        cancelLabel="إلغاء"
        isDestructive={false}
        onConfirm={confirmResetDefaults}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-purple-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-purple-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

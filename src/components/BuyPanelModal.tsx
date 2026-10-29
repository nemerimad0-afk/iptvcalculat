import React, { useState } from 'react';
import { ShoppingCart, Check, X, Sparkles, Layers, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { Panel } from '../types';
import { formatShekel } from '../utils/calculations';

interface BuyPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBuyPanel: (newPanel: Panel) => void;
  existingPanelsCount: number;
}

interface PanelPreset {
  title: string;
  years: number;
  cost: number;
  isPopular?: boolean;
  description: string;
}

const PRESET_PACKAGES: PanelPreset[] = [
  {
    title: 'لوحة 10 سنوات (الأساسية)',
    years: 10,
    cost: 120, // 120 شيكل كما طلب المستخدم
    isPopular: true,
    description: '120 شهر اشتراك • تكلفة الشهر 1.00 ₪ فقط • تكلفة السنة 12 ₪',
  },
  {
    title: 'لوحة 5 سنوات (مصغرة)',
    years: 5,
    cost: 65,
    description: '60 شهر اشتراك • تكلفة الشهر ~1.08 ₪ • خيار رائع للتجربة والتنويع',
  },
  {
    title: 'لوحة 20 سنة (كمية كبيرة)',
    years: 20,
    cost: 220,
    description: '240 شهر اشتراك • تكلفة الشهر ~0.91 ₪ • أعلى هامش ربح وتوفير بالجملة',
  },
];

export const BuyPanelModal: React.FC<BuyPanelModalProps> = ({
  isOpen,
  onClose,
  onBuyPanel,
  existingPanelsCount,
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Form state
  const [panelName, setPanelName] = useState(`لوحة سيرفر #${existingPanelsCount + 1}`);
  const [years, setYears] = useState<string>('10');
  const [cost, setCost] = useState<string>('120');
  const [notes, setNotes] = useState<string>('شراء لوحة جديدة 10 سنوات بـ 120 شيكل');
  const [setAsDefault, setSetAsDefault] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSelectPreset = (index: number) => {
    const preset = PRESET_PACKAGES[index];
    setSelectedPresetIndex(index);
    setIsCustom(false);
    setYears(preset.years.toString());
    setCost(preset.cost.toString());
    setPanelName(`${preset.title} #${existingPanelsCount + 1}`);
    setNotes(preset.description);
  };

  const handleCustomMode = () => {
    setIsCustom(true);
    setPanelName(`لوحة مخصصة #${existingPanelsCount + 1}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedYears = parseFloat(years);
    const parsedCost = parseFloat(cost);

    if (isNaN(parsedYears) || parsedYears <= 0 || isNaN(parsedCost) || parsedCost < 0) {
      alert('يرجى التأكد من كتابة المدة وسعر الشراء بالشكل الصحيح.');
      return;
    }

    const newPanel: Panel = {
      id: `panel_${Date.now()}`,
      name: panelName.trim() || `لوحة سيرفر #${existingPanelsCount + 1}`,
      totalYears: parsedYears,
      cost: parsedCost,
      notes: notes.trim(),
      purchaseDate: new Date().toISOString().split('T')[0],
      isDefault: setAsDefault,
    };

    onBuyPanel(newPanel);
    onClose();
  };

  const currentYears = parseFloat(years) || 1;
  const currentCost = parseFloat(cost) || 0;
  const costPerMonth = currentCost / (currentYears * 12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-lg">شراء لوحة IPTV جديدة</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  إضافة رصيد
                </span>
              </div>
              <p className="text-xs text-slate-400">اختر باقة اللوحة لإضافتها إلى رصيدك وحساب تكاليفها تلقائياً</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
          {/* Preset Packages */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-300">
              اختر باقة اللوحة السريعة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PRESET_PACKAGES.map((pkg, idx) => {
                const isSelected = !isCustom && selectedPresetIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(idx)}
                    className={`relative p-3 rounded-2xl text-right transition border text-xs flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-md shadow-emerald-500/10 text-white'
                        : 'bg-slate-800/60 border-slate-700/80 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    {pkg.isPopular && (
                      <span className="absolute -top-2 left-2 bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                        الأكثر طلباً
                      </span>
                    )}

                    <div className="font-bold text-sm text-white">{pkg.title}</div>
                    
                    <div className="mt-2 flex items-baseline justify-between w-full">
                      <span className="text-xs text-slate-400 font-mono">{pkg.years} سنوات</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{pkg.cost} ₪</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom option button */}
            <div className="text-left">
              <button
                type="button"
                onClick={handleCustomMode}
                className={`text-xs px-3 py-1 rounded-xl transition font-medium ${
                  isCustom
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                أو إدخال مدة وسعر مخصص ⚙️
              </button>
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                اسم اللوحة / السيرفر:
              </label>
              <input
                type="text"
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="مثال: لوحة 10 سنوات بسعر 120 شيكل"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المدة الإجمالية (بالسنوات):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0.5"
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-400">سنة</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  سعر الشراء بالشيكل:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute left-3 top-2 text-xs text-slate-400">₪</span>
                </div>
              </div>
            </div>

            {/* Calculated cost pill */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">تكلفة الشهر في هذه اللوحة:</span>
              <span className="font-mono font-bold text-emerald-400">
                {costPerMonth.toFixed(2)} شيكل / شهر
                <span className="text-slate-400 text-[11px] font-normal mr-2">
                  ({(costPerMonth * 12).toFixed(1)} ₪ / سنة)
                </span>
              </span>
            </div>

            {/* Set as default checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs text-slate-300 select-none">
                تعيين هذه اللوحة الجديدة كلوحة افتراضية للمبيعات القادمة
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 text-sm active:scale-95"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>تأكيد شراء وإضافة اللوحة (+{years} سنوات)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

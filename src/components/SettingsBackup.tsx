import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, ShieldCheck, Database, FileText, CheckCircle2, AlertTriangle, HelpCircle, CheckCircle } from 'lucide-react';
import { AppSettings, exportAllData, importAllData, savePanels, savePlans, saveRecords, saveSettings } from '../utils/storage';
import { DEFAULT_PANELS, DEFAULT_PLANS, DEFAULT_USD_EXCHANGE_RATE } from '../utils/calculations';
import { ConfirmDialog } from './ConfirmDialog';

interface SettingsBackupProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onReloadAllData: () => void;
}

export const SettingsBackup: React.FC<SettingsBackupProps> = ({
  settings,
  onUpdateSettings,
  onReloadAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetAppConfirm, setShowResetAppConfirm] = useState(false);

  const handleExport = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_iptv_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importAllData(content);
      if (success) {
        setImportStatus('تم استعادة البيانات والنسخة الاحتياطية بنجاح!');
        onReloadAllData();
      } else {
        setImportStatus('حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmResetToDefaults = () => {
    localStorage.clear();
    savePanels(DEFAULT_PANELS);
    savePlans(DEFAULT_PLANS);
    saveRecords([]);
    saveSettings({
      usdExchangeRate: DEFAULT_USD_EXCHANGE_RATE,
      currencyDisplay: 'BOTH',
      monthlyProfitTarget: 3000,
    });
    onReloadAllData();
    setShowResetAppConfirm(false);
    setImportStatus('تمت إعادة ضبط المصنع وتصفير السجلات بنجاح!');
    setTimeout(() => setImportStatus(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20 sm:pb-8">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">إدارة البيانات والنسخ الاحتياطي</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              بياناتك محفوظة محلياً في متصفحك بشكل آمن وخاص 100%. يمكنك تنزيل نسخة احتياطية في أي وقت لنقلها لجهاز آخر.
            </p>
          </div>
        </div>
      </div>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">تصدير وحفظ نسخة احتياطية</h3>
          </div>
          <p className="text-xs text-slate-400">
            احفظ جميع بيانات اللوحات، سجلات الأيام المحفوظة، المبيعات ومصاريف الإعلانات في ملف آمن على جهازك.
          </p>
          <button
            onClick={handleExport}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            تنزيل ملف النسخة الاحتياطية (JSON)
          </button>
        </div>

        {/* Import */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">استرجاع نسخة احتياطية</h3>
          </div>
          <p className="text-xs text-slate-400">
            إذا كنت تملك ملف نسخة احتياطية سابق، يمكنك رفعه هنا لاستعادة كافة السجلات واللوحات المحفوظة.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            اختيار ملف واستعادة البيانات
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {importStatus}
        </div>
      )}

      {/* Guide & FAQ on IPTV Calculation formula */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white text-base">دليل معادلة حساب أرباح IPTV في التطبيق</h3>
        </div>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-white block">1. كيف تُحسب تكلفة رصيد اللوحة؟</strong>
            <p className="text-slate-400">
              عند شراء لوحة 10 سنوات بسعر 120 شيكل، تحتوي اللوحة على 120 شهر اشتراك. تكلفة الشهر الواحد = 120 ÷ 120 = 1.00 شيكل.
              <br />
              • اشتراك الشهر: يستهلك 1 شهر من اللوحة = تكلفة 1 شيكل.
              <br />
              • اشتراك 3 شهور: يستهلك 3 شهور = تكلفة 3 شيكل.
              <br />
              • اشتراك 6 شهور: يستهلك 6 شهور = تكلفة 6 شيكل.
              <br />
              • اشتراك سنة: يستهلك 12 شهر = تكلفة 12 شيكل.
            </p>
          </div>

          <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-white block">2. كيف يُحسب صافي ربح اليوم؟</strong>
            <p className="text-slate-400">
              <strong className="text-emerald-400">صافي الربح الفعلي</strong> = (إجمالي المبيعات) - (تكلفة رصيد اللوحة المستهلك) - (مصاريف الإعلانات والترويج) - (المصاريف الأخرى).
            </p>
          </div>

          <div className="bg-slate-850/60 p-3 rounded-xl border border-slate-800 space-y-1">
            <strong className="text-white block">3. كيف يتم تحويل إعلانات الدولار؟</strong>
            <p className="text-slate-400">
              سعر الصرف الافتراضي هو 3.70 شيكل لكل 1 دولار (ويمكنك تغييره من الشريط العلوي). إذا صرفت 10$ على فيسبوك، يتم خصم 37 شيكل من صافي ربحك تلقائياً.
            </p>
          </div>
        </div>

        {/* Factory Reset */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              إعادة ضبط التطبيق للوضع الافتراضي
            </div>
            <div className="text-[11px] text-slate-500">حذف كافة السجلات وإعادة الباقات واللوحات الافتراضية</div>
          </div>
          <button
            onClick={() => setShowResetAppConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-300 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة الضبط
          </button>
        </div>
      </div>

      {/* Reset App Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetAppConfirm}
        title="إعادة ضبط التطبيق"
        message="هل أنت متأكد من إعادة ضبط التطبيق للوضع الافتراضي؟ سيتم تصفير كافة سجلات الأيام نهائياً."
        confirmLabel="نعم، إعادة الضبط"
        cancelLabel="إلغاء"
        isDestructive={true}
        onConfirm={confirmResetToDefaults}
        onCancel={() => setShowResetAppConfirm(false)}
      />
    </div>
  );
};

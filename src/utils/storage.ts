import { DailyRecord, Panel, PlanConfig } from '../types';
import { DEFAULT_PANELS, DEFAULT_PLANS, DEFAULT_USD_EXCHANGE_RATE } from './calculations';

export const STORAGE_KEYS = {
  PANELS: 'iptv_panels_v1',
  PLANS: 'iptv_plans_v1',
  RECORDS: 'iptv_records_v1',
  SETTINGS: 'iptv_settings_v1',
};

// In-memory fallback cache to ensure zero data loss in restricted environments
const memoryCache: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryCache[key] = val;
      return val;
    }
  } catch (e) {
    console.warn('localStorage read error, using cache:', e);
  }
  return memoryCache[key] ?? null;
}

function safeSet(key: string, value: string): void {
  memoryCache[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('localStorage write error:', e);
  }
}

export interface AppSettings {
  usdExchangeRate: number;
  currencyDisplay: 'ILS' | 'BOTH';
  monthlyProfitTarget: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  usdExchangeRate: DEFAULT_USD_EXCHANGE_RATE,
  currencyDisplay: 'BOTH',
  monthlyProfitTarget: 3000, // 3000 شيكل شهرياً كهدف افتراضي
};

/**
 * Generate initial sample records to give the user a clear, immediate working view
 */
function getInitialSampleRecords(): DailyRecord[] {
  const today = new Date();
  const formatDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(today.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: formatDate(2),
      date: formatDate(2),
      sales: [
        {
          id: 's1',
          planId: '1_year',
          planName: 'اشتراك سنة (12 شهر)',
          durationMonths: 12,
          count: 2,
          pricePerUnit: 70,
          panelId: 'panel_default',
        },
        {
          id: 's2',
          planId: '6_months',
          planName: 'اشتراك 6 شهور',
          durationMonths: 6,
          count: 1,
          pricePerUnit: 50,
          panelId: 'panel_default',
        },
        {
          id: 's3',
          planId: '3_months',
          planName: 'اشتراك 3 شهور',
          durationMonths: 3,
          count: 2,
          pricePerUnit: 30,
          panelId: 'panel_default',
        },
      ],
      adExpenses: [
        {
          amount: 10,
          currency: 'USD',
          platform: 'facebook',
          notes: 'حملة إعلانات ممولة على فيسبوك',
        },
      ],
      usdExchangeRate: 3.70,
      otherExpenses: 0,
      notes: 'يوم ممتاز، تفاعل قوي مع إعلانات فيسبوك',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: formatDate(1),
      date: formatDate(1),
      sales: [
        {
          id: 's4',
          planId: '1_year',
          planName: 'اشتراك سنة (12 شهر)',
          durationMonths: 12,
          count: 3,
          pricePerUnit: 70,
          panelId: 'panel_default',
        },
        {
          id: 's5',
          planId: '1_month',
          planName: 'اشتراك شهر (1 شهر)',
          durationMonths: 1,
          count: 4,
          pricePerUnit: 15,
          panelId: 'panel_default',
        },
      ],
      adExpenses: [
        {
          amount: 50,
          currency: 'ILS',
          platform: 'tiktok',
          notes: 'ترويج فيديو تيك توك',
        },
      ],
      usdExchangeRate: 3.70,
      otherExpenses: 0,
      notes: 'طلب كبير على اشتراكات السنة والشهر',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadPanels(): Panel[] {
  try {
    const data = safeGet(STORAGE_KEYS.PANELS);
    if (!data) {
      savePanels(DEFAULT_PANELS);
      return DEFAULT_PANELS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PANELS;
  } catch {
    return DEFAULT_PANELS;
  }
}

export function savePanels(panels: Panel[]): void {
  try {
    safeSet(STORAGE_KEYS.PANELS, JSON.stringify(panels));
  } catch (e) {
    console.error('Failed to save panels', e);
  }
}

export function loadPlans(): PlanConfig[] {
  try {
    const data = safeGet(STORAGE_KEYS.PLANS);
    if (!data) {
      savePlans(DEFAULT_PLANS);
      return DEFAULT_PLANS;
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PLANS;
  } catch {
    return DEFAULT_PLANS;
  }
}

export function savePlans(plans: PlanConfig[]): void {
  try {
    safeSet(STORAGE_KEYS.PLANS, JSON.stringify(plans));
  } catch (e) {
    console.error('Failed to save plans', e);
  }
}

export function loadRecords(): DailyRecord[] {
  try {
    const data = safeGet(STORAGE_KEYS.RECORDS);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearAllRecords(): void {
  try {
    safeSet(STORAGE_KEYS.RECORDS, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear records', e);
  }
}

export function saveRecords(records: DailyRecord[]): void {
  try {
    safeSet(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const data = safeGet(STORAGE_KEYS.SETTINGS);
    if (!data) {
      saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    safeSet(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

/**
 * Export all data to JSON
 */
export function exportAllData(): string {
  const payload = {
    exportDate: new Date().toISOString(),
    app: 'IPTV Profit Tracker',
    panels: loadPanels(),
    plans: loadPlans(),
    records: loadRecords(),
    settings: loadSettings(),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import data from JSON
 */
export function importAllData(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.panels && Array.isArray(parsed.panels)) savePanels(parsed.panels);
    if (parsed.plans && Array.isArray(parsed.plans)) savePlans(parsed.plans);
    if (parsed.records && Array.isArray(parsed.records)) saveRecords(parsed.records);
    if (parsed.settings) saveSettings(parsed.settings);
    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
}

/**
 * Export daily records to CSV for Excel
 */
export function exportToCSV(records: DailyRecord[], panels: Panel[], plans: PlanConfig[]): void {
  import('./calculations').then(({ calculateDailySummary }) => {
    const headers = [
      'التاريخ',
      'إجمالي الحسابات المباعة',
      'الشهور المستهلكة',
      'اللوحات الكاملة المباعة',
      'أرباح بيع اللوحات (شيكل)',
      'إجمالي المبيعات (شيكل)',
      'إجمالي تكلفة اللوحات (شيكل)',
      'مصاريف الإعلانات (شيكل)',
      'مصاريف الإعلانات (دولار)',
      'مصاريف أخرى (شيكل)',
      'صافي الربح (شيكل)',
      'صافي الربح (دولار)',
      'هامش الربح %',
      'ملاحظات',
    ];

    const rows = records
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((rec) => {
        const summary = calculateDailySummary(rec, panels, plans);
        return [
          rec.date,
          summary.totalAccountsSold,
          summary.totalMonthsSold,
          summary.totalPanelsSold || 0,
          (summary.panelSalesProfit || 0).toFixed(2),
          summary.grossRevenue.toFixed(2),
          summary.panelCost.toFixed(2),
          summary.adExpenseILS.toFixed(2),
          summary.adExpenseUSD.toFixed(2),
          summary.otherExpenses.toFixed(2),
          summary.netProfit.toFixed(2),
          summary.netProfitUSD.toFixed(2),
          summary.profitMargin.toFixed(1) + '%',
          `"${(rec.notes || '').replace(/"/g, '""')}"`,
        ].join(',');
      });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `تقارير_ارباح_iptv_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

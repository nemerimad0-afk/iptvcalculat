import { DailyRecord, DailySummary, Panel, PlanConfig } from '../types';

export const DEFAULT_USD_EXCHANGE_RATE = 3.70;

export const DEFAULT_PLANS: PlanConfig[] = [
  {
    id: '1_month',
    name: 'اشتراك شهر (1 شهر)',
    durationMonths: 1,
    defaultPrice: 15, // 15 شيكل كما طلب المستخدم
    badgeColor: 'blue',
  },
  {
    id: '3_months',
    name: 'اشتراك 3 شهور',
    durationMonths: 3,
    defaultPrice: 30, // 30 شيكل كما طلب المستخدم
    badgeColor: 'amber',
  },
  {
    id: '6_months',
    name: 'اشتراك 6 شهور',
    durationMonths: 6,
    defaultPrice: 50, // 50 شيكل كما طلب المستخدم
    badgeColor: 'purple',
  },
  {
    id: '1_year',
    name: 'اشتراك سنة (12 شهر)',
    durationMonths: 12,
    defaultPrice: 70, // 70 شيكل كما طلب المستخدم
    badgeColor: 'emerald',
  },
];

export const DEFAULT_PANELS: Panel[] = [
  {
    id: 'panel_default',
    name: 'لوحة السيرفر الأساسية (10 سنوات)',
    totalYears: 10,
    cost: 120, // 120 شيكل لكل 10 سنوات كما طلب المستخدم
    notes: '10 سنوات = 120 شهر، تكلفة الشهر = 1 شيكل، تكلفة السنة = 12 شيكل',
    purchaseDate: new Date().toISOString().split('T')[0],
    isDefault: true,
  },
];

/**
 * Calculate the cost of 1 month of subscription for a panel
 */
export function getPanelCostPerMonth(panel: Panel): number {
  if (!panel || panel.totalYears <= 0) return 0;
  const totalMonths = panel.totalYears * 12;
  return panel.cost / totalMonths;
}

/**
 * Calculate the cost of 1 year of subscription for a panel
 */
export function getPanelCostPerYear(panel: Panel): number {
  if (!panel || panel.totalYears <= 0) return 0;
  return panel.cost / panel.totalYears;
}

export const DEFAULT_PANEL_SALE_COST = 120; // سعر تكلفة اللوحة: 120 شيكل كما طلب المستخدم
export const DEFAULT_PANEL_SALE_PRICE = 350; // سعر بيع اللوحة: 350 شيكل كما طلب المستخدم
// صافي ربح بيع اللوحة الواحدة = 350 - 120 = 230 شيكل

/**
 * Summarize a single daily record
 */
export function calculateDailySummary(
  record: DailyRecord,
  panels: Panel[],
  plans: PlanConfig[]
): DailySummary {
  const panelMap = new Map<string, Panel>(panels.map((p) => [p.id, p]));
  const defaultPanel = panels.find((p) => p.isDefault) || panels[0];

  let totalAccountsSold = 0;
  let totalMonthsSold = 0;
  let subscriptionsRevenue = 0;
  let subscriptionPanelCost = 0;

  const salesByPlan: Record<string, { count: number; revenue: number; months: number }> = {};

  plans.forEach((pl) => {
    salesByPlan[pl.id] = { count: 0, revenue: 0, months: 0 };
  });

  (record.sales || []).forEach((sale) => {
    const count = Number(sale.count) || 0;
    if (count <= 0) return;

    const duration = Number(sale.durationMonths) || 1;
    const price = Number(sale.pricePerUnit) || 0;
    const revenue = count * price;
    const months = count * duration;

    totalAccountsSold += count;
    totalMonthsSold += months;
    subscriptionsRevenue += revenue;

    const panel = panelMap.get(sale.panelId) || defaultPanel;
    const costPerMonth = panel ? getPanelCostPerMonth(panel) : 1;
    subscriptionPanelCost += months * costPerMonth;

    if (!salesByPlan[sale.planId]) {
      salesByPlan[sale.planId] = { count: 0, revenue: 0, months: 0 };
    }
    salesByPlan[sale.planId].count += count;
    salesByPlan[sale.planId].revenue += revenue;
    salesByPlan[sale.planId].months += months;
  });

  // Calculate Full Panel Sales (بيع اللوحات بالكامل: سعر التكلفة 120 ₪ وسعر البيع 350 ₪)
  let totalPanelsSold = 0;
  let panelSalesRevenue = 0;
  let panelSalesCost = 0;

  (record.panelSales || []).forEach((ps) => {
    const count = Number(ps.count) || 0;
    if (count <= 0) return;
    const cost = Number(ps.costPerUnit) !== undefined && !isNaN(Number(ps.costPerUnit)) ? Number(ps.costPerUnit) : DEFAULT_PANEL_SALE_COST;
    const price = Number(ps.pricePerUnit) !== undefined && !isNaN(Number(ps.pricePerUnit)) ? Number(ps.pricePerUnit) : DEFAULT_PANEL_SALE_PRICE;

    totalPanelsSold += count;
    panelSalesRevenue += count * price;
    panelSalesCost += count * cost;
  });

  const panelSalesProfit = panelSalesRevenue - panelSalesCost;
  const grossRevenue = subscriptionsRevenue + panelSalesRevenue;
  const totalPanelCost = subscriptionPanelCost + panelSalesCost;

  // Calculate Ad Expenses
  const exchangeRate = record.usdExchangeRate > 0 ? record.usdExchangeRate : DEFAULT_USD_EXCHANGE_RATE;
  let adExpenseILS = 0;
  let adExpenseUSD = 0;

  (record.adExpenses || []).forEach((ad) => {
    const amount = Number(ad.amount) || 0;
    if (amount <= 0) return;

    if (ad.currency === 'USD') {
      adExpenseUSD += amount;
      adExpenseILS += amount * exchangeRate;
    } else {
      adExpenseILS += amount;
      adExpenseUSD += amount / exchangeRate;
    }
  });

  const otherExpenses = Number(record.otherExpenses) || 0;
  const totalExpenses = totalPanelCost + adExpenseILS + otherExpenses;
  const netProfit = grossRevenue - totalExpenses;
  const netProfitUSD = netProfit / exchangeRate;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  return {
    date: record.date,
    totalAccountsSold,
    totalMonthsSold,
    totalPanelsSold,
    panelSalesRevenue,
    panelSalesCost,
    panelSalesProfit,
    subscriptionsRevenue,
    grossRevenue,
    panelCost: totalPanelCost,
    subscriptionPanelCost,
    adExpenseILS,
    adExpenseUSD,
    otherExpenses,
    totalExpenses,
    netProfit,
    netProfitUSD,
    profitMargin,
    salesByPlan,
  };
}

/**
 * Format currency in Shekels (₪)
 */
export function formatILS(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ₪`;
}

/**
 * Format in standard digits with ILS
 */
export function formatShekel(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ₪`;
}

/**
 * Format USD ($)
 */
export function formatUSD(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return `$${rounded.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`;
}

/**
 * Convert months to readable years and months in Arabic
 */
export function formatMonthsDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = Math.round((months % 12) * 10) / 10;

  const parts: string[] = [];
  if (years > 0) {
    if (years === 1) parts.push('سنة واحدة');
    else if (years === 2) parts.push('سنتان');
    else if (years >= 3 && years <= 10) parts.push(`${years} سنوات`);
    else parts.push(`${years} سنة`);
  }

  if (remainingMonths > 0) {
    if (remainingMonths === 1) parts.push('شهر واحد');
    else if (remainingMonths === 2) parts.push('شهران');
    else if (remainingMonths >= 3 && remainingMonths <= 10) parts.push(`${remainingMonths} شهور`);
    else parts.push(`${remainingMonths} شهر`);
  }

  return parts.length > 0 ? parts.join(' و ') : '0 شهر';
}

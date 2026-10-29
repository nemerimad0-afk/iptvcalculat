export type PlanType = '1_month' | '3_months' | '6_months' | '1_year' | 'custom';

export interface PlanConfig {
  id: string;
  name: string;
  durationMonths: number;
  defaultPrice: number; // in ILS (شيكل)
  badgeColor?: string;
}

export interface Panel {
  id: string;
  name: string;
  totalYears: number; // e.g., 10 years
  cost: number; // e.g., 120 ILS
  notes?: string;
  purchaseDate: string;
  isDefault?: boolean;
}

export interface SaleItem {
  id: string;
  planId: string;
  planName: string;
  durationMonths: number;
  count: number;
  pricePerUnit: number; // in ILS
  panelId: string;
  customerNote?: string;
}

export interface PanelSaleItem {
  id: string;
  panelName: string;
  count: number;
  costPerUnit: number; // default 120 ILS
  pricePerUnit: number; // default 350 ILS
  notes?: string;
}

export interface AdExpense {
  amount: number;
  currency: 'ILS' | 'USD';
  platform?: 'facebook' | 'tiktok' | 'instagram' | 'snapchat' | 'other';
  notes?: string;
}

export interface DailyRecord {
  id: string; // usually YYYY-MM-DD
  date: string; // YYYY-MM-DD
  sales: SaleItem[];
  panelSales?: PanelSaleItem[]; // بيع لوحات كاملة (شراء 120 ₪ بيع 350 ₪)
  adExpenses: AdExpense[];
  usdExchangeRate: number; // exchange rate used on that day (e.g., 3.70)
  otherExpenses: number; // other costs in ILS
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  totalAccountsSold: number;
  totalMonthsSold: number;
  totalPanelsSold: number;
  panelSalesRevenue: number;
  panelSalesCost: number;
  panelSalesProfit: number;
  subscriptionsRevenue: number; // in ILS (subscriptions only)
  grossRevenue: number; // in ILS (subscriptions revenue + panel sales revenue)
  panelCost: number; // in ILS (cost of consumed months + cost of full panels sold)
  subscriptionPanelCost: number; // in ILS
  adExpenseILS: number; // in ILS
  adExpenseUSD: number; // in USD
  otherExpenses: number; // in ILS
  totalExpenses: number; // in ILS
  netProfit: number; // in ILS
  netProfitUSD: number; // in USD
  profitMargin: number; // percentage
  salesByPlan: Record<string, { count: number; revenue: number; months: number }>;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DailyEntryCard } from './components/DailyEntryCard';
import { HistoryView } from './components/HistoryView';
import { PanelsManager } from './components/PanelsManager';
import { PlansManager } from './components/PlansManager';
import { ProfitSimulator } from './components/ProfitSimulator';
import { SettingsBackup } from './components/SettingsBackup';
import { BuyPanelModal } from './components/BuyPanelModal';
import { Panel, PlanConfig, DailyRecord } from './types';
import {
  Calendar,
  BarChart3,
  Layers,
  ShoppingCart,
  MoreHorizontal,
  Tag,
  TrendingUp,
  Settings,
} from 'lucide-react';
import {
  loadPanels,
  savePanels,
  loadPlans,
  savePlans,
  loadRecords,
  saveRecords,
  loadSettings,
  saveSettings,
  AppSettings,
} from './utils/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'daily' | 'history' | 'panels' | 'plans' | 'simulator' | 'settings'>('daily');
  const [panels, setPanels] = useState<Panel[]>(() => loadPanels());
  const [plans, setPlans] = useState<PlanConfig[]>(() => loadPlans());
  const [records, setRecords] = useState<DailyRecord[]>(() => loadRecords());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Buy Panel Modal state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  
  // Mobile extra menu sheet
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Reload all persisted data from storage
  const reloadData = useCallback(() => {
    setPanels(loadPanels());
    setPlans(loadPlans());
    setSettings(loadSettings());
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    // Keep local state in sync on mount
    reloadData();

    // Sync across tabs if user opens app in multiple tabs
    const handleStorageChange = () => {
      reloadData();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reloadData]);

  // Handlers
  const handleSaveRecord = (record: DailyRecord) => {
    setRecords((prev) => {
      const existingIndex = prev.findIndex((r) => r.date === record.date);
      let updated: DailyRecord[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = record;
      } else {
        updated = [record, ...prev];
      }
      saveRecords(updated);
      return updated;
    });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRecords(updated);
      return updated;
    });
  };

  const handleClearAllRecords = () => {
    setRecords([]);
    saveRecords([]);
  };

  const handleEditRecordFromHistory = (date: string) => {
    setSelectedDateForEntry(date);
    setActiveTab('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdatePanels = (newPanels: Panel[]) => {
    setPanels(newPanels);
    savePanels(newPanels);
  };

  const handleBuyNewPanel = (newPanel: Panel) => {
    let updated = [...panels];
    if (newPanel.isDefault) {
      updated = updated.map((p) => ({ ...p, isDefault: false }));
    }
    updated.push(newPanel);
    setPanels(updated);
    savePanels(updated);
  };

  const handleUpdatePlans = (newPlans: PlanConfig[]) => {
    setPlans(newPlans);
    savePlans(newPlans);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-white pb-32 sm:pb-8">
      {/* Header with Navigation and KPIs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        panels={panels}
        records={records}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenBuyPanel={() => setIsBuyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {activeTab === 'daily' && (
          <DailyEntryCard
            panels={panels}
            plans={plans}
            settings={settings}
            records={records}
            onSaveRecord={handleSaveRecord}
            selectedDate={selectedDateForEntry}
            onSelectDate={setSelectedDateForEntry}
            onOpenBuyPanel={() => setIsBuyModalOpen(true)}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            records={records}
            panels={panels}
            plans={plans}
            settings={settings}
            onEditRecord={handleEditRecordFromHistory}
            onDeleteRecord={handleDeleteRecord}
            onClearAllRecords={handleClearAllRecords}
          />
        )}

        {activeTab === 'panels' && (
          <PanelsManager
            panels={panels}
            records={records}
            onUpdatePanels={handleUpdatePanels}
            onOpenBuyModal={() => setIsBuyModalOpen(true)}
          />
        )}

        {activeTab === 'plans' && (
          <PlansManager
            plans={plans}
            panels={panels}
            onUpdatePlans={handleUpdatePlans}
          />
        )}

        {activeTab === 'simulator' && (
          <ProfitSimulator
            panels={panels}
            plans={plans}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsBackup
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onReloadAllData={reloadData}
          />
        )}
      </main>

      {/* Buy Panel Modal */}
      <BuyPanelModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
        onBuyPanel={handleBuyNewPanel}
        existingPanelsCount={panels.length}
      />

      {/* Mobile Extra Menu Modal (when tapping More on mobile bottom bar) */}
      {showMobileMoreMenu && (
        <div
          className="sm:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in"
          onClick={() => setShowMobileMoreMenu(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl p-4 shadow-2xl space-y-2 mb-16"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center font-bold text-white text-sm pb-2 border-b border-slate-800">
              خيارات إضافية
            </div>

            <button
              onClick={() => {
                setActiveTab('plans');
                setShowMobileMoreMenu(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 text-slate-200 text-sm font-semibold transition"
            >
              <Tag className="w-5 h-5 text-purple-400" />
              <span>أسعار الباقات وهوامش الربح</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('simulator');
                setShowMobileMoreMenu(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 text-slate-200 text-sm font-semibold transition"
            >
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>حاسبة الأهداف والتوقعات</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setShowMobileMoreMenu(false);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-800 text-slate-200 text-sm font-semibold transition"
            >
              <Settings className="w-5 h-5 text-amber-400" />
              <span>النسخ الاحتياطي والبيانات</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Native-Style Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl transition active:scale-95 touch-manipulation ${
            activeTab === 'daily' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">اليومية</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl transition active:scale-95 touch-manipulation ${
            activeTab === 'history' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">السجل</span>
        </button>

        {/* Highlighted Buy Panel Button on Mobile Bar */}
        <button
          onClick={() => setIsBuyModalOpen(true)}
          className="flex flex-col items-center -mt-4 active:scale-90 transition touch-manipulation"
          title="شراء لوحة IPTV جديدة"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border border-emerald-400/30">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <span className="text-[10px] text-emerald-400 font-bold mt-1">شراء لوحة</span>
        </button>

        <button
          onClick={() => setActiveTab('panels')}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl transition active:scale-95 touch-manipulation ${
            activeTab === 'panels' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">اللوحات</span>
        </button>

        <button
          onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
          className={`flex flex-col items-center justify-center min-w-[54px] min-h-[48px] py-1 px-2 rounded-xl transition active:scale-95 touch-manipulation ${
            ['plans', 'simulator', 'settings'].includes(activeTab)
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">المزيد</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="hidden sm:block border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>حاسبة أرباح IPTV الذكية • مصممة خصيصاً لموزعي وبائعي اشتراكات الـ IPTV</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            جميع البيانات والعمليات الحسابية تحفظ تلقائياً في جهازك
          </div>
        </div>
      </footer>
    </div>
  );
}

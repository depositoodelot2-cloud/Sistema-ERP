import React, { useEffect, useState } from 'react';
import { BottomNav, NavTab } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { ThemeProvider } from './hooks/useTheme';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { MorePage } from './pages/MorePage';
import { PDVPage } from './pages/PDVPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';

import { useFirestoreSync } from './hooks/useFirestoreSync';

function AppContent() {
  useFirestoreSync();
  const { isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('pdv');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'critical'>('all');

  // Restrict non-admin operators to only 'pdv', 'inventory', and 'sales'
  useEffect(() => {
    if (!isAdmin && (currentTab === 'inicio' || currentTab === 'more')) {
      setCurrentTab('pdv');
    }
  }, [isAdmin, currentTab]);

  const handleTabChange = (tab: NavTab) => {
    if (!isAdmin && (tab === 'inicio' || tab === 'more')) {
      return;
    }
    if (tab === 'inventory') {
      setInventoryFilter('all');
    }
    setCurrentTab(tab);
  };

  const handleNavigateToInventory = (filter: 'all' | 'critical' = 'critical') => {
    setInventoryFilter(filter);
    setCurrentTab('inventory');
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-100 dark:bg-[#050b16] text-slate-900 dark:text-white selection:bg-[#2563eb] selection:text-white overflow-hidden transition-colors">
      {currentTab === 'pdv' && <Header currentTab={currentTab} />}

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {currentTab === 'inicio' && isAdmin && (
          <DashboardPage onNavigateToInventory={handleNavigateToInventory} />
        )}
        {currentTab === 'pdv' && <PDVPage />}
        {currentTab === 'inventory' && (
          <InventoryPage
            initialFilter={inventoryFilter}
            onFilterChange={setInventoryFilter}
          />
        )}
        {currentTab === 'sales' && <SalesHistoryPage />}
        {currentTab === 'more' && isAdmin && <MorePage />}
      </main>

      <BottomNav
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

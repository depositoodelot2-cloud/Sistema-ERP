import React, { useState } from 'react';
import { BottomNav, NavTab } from './components/BottomNav';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { ThemeProvider } from './hooks/useTheme';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { MorePage } from './pages/MorePage';
import { PDVPage } from './pages/PDVPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('pdv');

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-100 dark:bg-[#050b16] text-slate-900 dark:text-white selection:bg-[#2563eb] selection:text-white overflow-hidden transition-colors">
      <Header />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {currentTab === 'inicio' && (
          <DashboardPage onNavigateToInventory={() => setCurrentTab('inventory')} />
        )}
        {currentTab === 'pdv' && <PDVPage />}
        {currentTab === 'inventory' && <InventoryPage />}
        {currentTab === 'sales' && <SalesHistoryPage />}
        {currentTab === 'more' && <MorePage />}
      </main>

      <BottomNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
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

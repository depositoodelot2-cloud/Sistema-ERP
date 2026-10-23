import React from 'react';
import { FileText, LayoutGrid, Menu, Package, ShoppingCart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';

export type NavTab = 'inicio' | 'pdv' | 'inventory' | 'sales' | 'more';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
}) => {
  const { totalItems } = useCart();
  const { isAdmin } = useAuth();

  const allTabs: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }> = [
    {
      id: 'inicio',
      label: 'INÍCIO',
      icon: <LayoutGrid className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      id: 'pdv',
      label: 'PDV',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      id: 'inventory',
      label: 'ESTOQUE',
      icon: <Package className="w-5 h-5" />,
    },
    {
      id: 'sales',
      label: 'VENDAS',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'more',
      label: 'MAIS',
      icon: <Menu className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  const tabs = allTabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#070e1c] border-t border-slate-200 dark:border-[#131f38] select-none transition-colors">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                isActive
                  ? 'text-[#2563eb]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#2563eb] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1.5 font-bold tracking-wider">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

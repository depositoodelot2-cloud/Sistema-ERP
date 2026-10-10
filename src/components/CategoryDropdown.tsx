import React from 'react';
import { Category } from '../types';

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  className?: string;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none ${className}`}>
      <button
        type="button"
        onClick={() => onSelectCategory('all')}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
          selectedCategoryId === 'all'
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
            : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        Todas Categorias
      </button>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all select-none ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: isSelected ? 'white' : cat.color }}
            />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

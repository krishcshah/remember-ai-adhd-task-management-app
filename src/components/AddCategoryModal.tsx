import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { COLOR_PALETTES } from '../types';
import { X, Tag, Plus, Check } from 'lucide-react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryId: string) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const { addCategory } = useTaskContext();
  const [label, setLabel] = useState('');
  const [selectedPalette, setSelectedPalette] = useState(COLOR_PALETTES[0].id);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const newCat = addCategory(label.trim(), selectedPalette);
    setLabel('');
    if (onCategoryCreated) {
      onCategoryCreated(newCat.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-stone-200/80 dark:border-stone-800 animate-slideUp">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
              New Category
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              placeholder="e.g. Side Hustle, Fitness, Home, Finance..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PALETTES.map((pal) => (
                <button
                  key={pal.id}
                  type="button"
                  onClick={() => setSelectedPalette(pal.id)}
                  className={`h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold border transition-all ${
                    selectedPalette === pal.id
                      ? `${pal.bgLight} ${pal.bgDark} ${pal.borderColor} ${pal.textColor} ring-2 ring-teal-600/30`
                      : 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: pal.dotColor }}
                  />
                  <span className="text-[11px] truncate">{pal.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim()}
              className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-amber-300 font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5px]" />
              Save Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

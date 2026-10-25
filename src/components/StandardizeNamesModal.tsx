import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Product } from '../types';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../lib/firestoreSync';
import { isAllUpper, standardizeUppercaseName } from '../utils/formatters';
import { saveStoredProducts } from '../utils/storage';

interface StandardizeNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSuccess?: () => void;
}

interface ItemChange {
  product: Product;
  currentName: string;
  newName: string;
}

export const StandardizeNamesModal: React.FC<StandardizeNamesModalProps> = ({
  isOpen,
  onClose,
  products,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [errorList, setErrorList] = useState<Array<{ id: string; name: string; error: string }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  if (!isOpen) return null;

  // Compute products that have completely uppercase names and would change
  const itemsToChange: ItemChange[] = products
    .filter((p) => isAllUpper(p.name))
    .map((p) => {
      const newName = standardizeUppercaseName(p.name);
      return {
        product: p,
        currentName: p.name,
        newName,
      };
    })
    .filter((item) => item.currentName !== item.newName);

  // Trigger download of full JSON backup
  const downloadBackupFile = () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupData = JSON.stringify(products, null, 2);
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_produtos_odelot_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
      return true;
    } catch (err) {
      console.error('Falha ao gerar backup de produtos:', err);
      return false;
    }
  };

  const handleApplyChanges = async () => {
    if (itemsToChange.length === 0) return;

    setIsProcessing(true);
    setErrorList([]);

    // 1. Mandatory Backup Download before any modification
    const backupOk = downloadBackupFile();
    if (!backupOk) {
      setIsProcessing(false);
      alert('Não foi possível gerar o backup de segurança. A operação foi cancelada por precaução.');
      return;
    }

    // 2. Perform updates in chunks of 400 (under Firestore's 500 limit)
    // Only updating the `name` field in Firestore
    const chunkSize = 400;
    const failures: Array<{ id: string; name: string; error: string }> = [];
    let processedSuccess = 0;

    const updatedProductsMap = new Map<string, string>();

    for (let i = 0; i < itemsToChange.length; i += chunkSize) {
      const chunk = itemsToChange.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((item) => {
        const ref = doc(db, COLLECTIONS.PRODUCTS, item.product.id);
        // Only updates the `name` field; preserves all other document fields
        batch.update(ref, {
          name: item.newName,
        });
      });

      try {
        await batch.commit();
        chunk.forEach((item) => {
          updatedProductsMap.set(item.product.id, item.newName);
          processedSuccess++;
        });
      } catch (batchErr) {
        console.warn('Batch write failed, trying individual item fallback:', batchErr);
        // Fallback to updateDoc one by one so single document issues don't cancel other items
        for (const item of chunk) {
          try {
            const ref = doc(db, COLLECTIONS.PRODUCTS, item.product.id);
            await updateDoc(ref, { name: item.newName });
            updatedProductsMap.set(item.product.id, item.newName);
            processedSuccess++;
          } catch (individualErr: unknown) {
            const msg = individualErr instanceof Error ? individualErr.message : String(individualErr);
            failures.push({
              id: item.product.id,
              name: item.currentName,
              error: msg,
            });
          }
        }
      }
    }

    // 3. Update local state and storage
    if (updatedProductsMap.size > 0) {
      const updatedProducts = products.map((p) => {
        if (updatedProductsMap.has(p.id)) {
          return { ...p, name: updatedProductsMap.get(p.id)! };
        }
        return p;
      });
      saveStoredProducts(updatedProducts);
    }

    setSuccessCount(processedSuccess);
    setErrorList(failures);
    setIsComplete(true);
    setIsProcessing(false);
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                Padronizar Nomes de Produtos
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                Converte maiúsculas para formato legível com backup
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Rules & Safeguards Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-950 dark:text-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Garantia de Segurança dos Dados</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
              <li>Um arquivo de <strong>backup JSON completo</strong> é baixado no seu dispositivo antes de qualquer alteração.</li>
              <li>Apenas produtos com nomes <strong>totalmente em maiúsculas</strong> são alterados.</li>
              <li>Siglas conhecidas (ex: <strong>PVC, EPI, LED, EAN</strong>) e medidas são preservadas.</li>
              <li><strong>Preço, estoque, código, código de barras e fotos são 100% preservados</strong> (somente o campo de nome é atualizado).</li>
            </ul>
          </div>

          {/* Success Summary if completed */}
          {isComplete && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Padronização Concluída com Sucesso!</span>
              </div>
              <p className="text-[11px]">
                <strong>{successCount}</strong> produto(s) atualizado(s) no Firestore e sincronizados em tempo real.
              </p>
              {errorList.length > 0 && (
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-rose-600 dark:text-rose-400">
                  <p className="font-bold">Alguns itens não puderam ser alterados ({errorList.length}):</p>
                  <ul className="list-disc pl-4 mt-1 text-[10px]">
                    {errorList.map((err) => (
                      <li key={err.id}>{err.name}: {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preview list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Prévia das alterações ({itemsToChange.length} encontrados)
              </span>
              <button
                type="button"
                onClick={downloadBackupFile}
                className="text-[11px] font-bold text-[#2563eb] dark:text-blue-400 hover:underline flex items-center gap-1"
                title="Baixar cópia de segurança antes de alterar"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar backup JSON</span>
              </button>
            </div>

            {itemsToChange.length === 0 ? (
              <div className="py-8 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                <p className="font-bold text-slate-700 dark:text-slate-200">Nenhum produto em maiúsculas pendente</p>
                <p className="text-[11px] mt-0.5">Todos os produtos já estão com a primeira letra maiúscula e formatação adequada.</p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {itemsToChange.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 text-xs flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span className="font-mono text-slate-500 dark:text-slate-400 truncate flex-1" title={item.currentName}>
                      {item.currentName}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate flex-1 text-right" title={item.newName}>
                      {item.newName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1527] flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
          >
            {isComplete ? 'Fechar' : 'Cancelar'}
          </button>

          {!isComplete && itemsToChange.length > 0 && (
            <button
              type="button"
              onClick={handleApplyChanges}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Atualizando Firestore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.2]" />
                  <span>Baixar Backup e Padronizar ({itemsToChange.length})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

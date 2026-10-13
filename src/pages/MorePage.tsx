import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle,
  Cloud,
  Database,
  Download,
  Edit2,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Shield,
  Tag,
  Trash2,
  Upload,
  User,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { batchSyncAllToFirestore } from '../lib/firestoreSync';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { UserFormModal } from '../components/UserFormModal';
import { useAuth } from '../hooks/useAuth';
import { Category, Customer, Operator, Sale, StoreSettings } from '../types';
import { formatCurrency, formatDocument, formatPhone } from '../utils/formatters';
import { filterAndRankCustomers } from '../utils/semanticSearch';
import {
  getStoredCategories,
  getStoredCustomers,
  getStoredOperators,
  getStoredProducts,
  getStoredSales,
  getStoredSettings,
  saveStoredCategories,
  saveStoredCustomers,
  saveStoredOperators,
  saveStoredProducts,
  saveStoredSales,
  saveStoredSettings,
} from '../utils/storage';

export const MorePage: React.FC = () => {
  const { isAdmin, currentOperator } = useAuth();

  // Active section tab: default is 'categories' as shown in the screenshot
  const [activeSection, setActiveSection] = useState<
    'customers' | 'categories' | 'operators' | 'store' | 'backup'
  >('categories');

  // Master data state
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings);
  const [customers, setCustomers] = useState<Customer[]>(getStoredCustomers);
  const [categories, setCategories] = useState<Category[]>(getStoredCategories);
  const [operators, setOperators] = useState<Operator[]>(getStoredOperators);

  // Search state for customers
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [showOperatorModal, setShowOperatorModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);

  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);
  const [printerSaveSuccess, setPrinterSaveSuccess] = useState(false);
  const [showTestReceiptModal, setShowTestReceiptModal] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCust = () => setCustomers(getStoredCustomers());
    const handleCat = () => setCategories(getStoredCategories());
    const handleOps = () => setOperators(getStoredOperators());
    const handleSet = () => setSettings(getStoredSettings());

    window.addEventListener('odelot_customers_changed', handleCust);
    window.addEventListener('odelot_categories_changed', handleCat);
    window.addEventListener('odelot_operators_changed', handleOps);
    window.addEventListener('odelot_settings_changed', handleSet);

    return () => {
      window.removeEventListener('odelot_customers_changed', handleCust);
      window.removeEventListener('odelot_categories_changed', handleCat);
      window.removeEventListener('odelot_operators_changed', handleOps);
      window.removeEventListener('odelot_settings_changed', handleSet);
    };
  }, []);

  // Save Store Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveStoredSettings(settings);
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 2500);
  };

  // Save Thermal Printer Settings
  const handleSavePrinterSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveStoredSettings(settings);
    setPrinterSaveSuccess(true);
    setTimeout(() => setPrinterSaveSuccess(false), 2500);
  };

  const sampleTestSale: Sale = {
    id: 'test-print-receipt',
    code: 'TEST-001',
    date: new Date().toISOString(),
    operatorId: currentOperator?.id || 'op-carlos',
    operatorName: currentOperator?.name || 'Carlos Admin',
    items: [
      {
        productId: 'prod-test-1',
        productCode: '1001',
        productName: 'PRODUTO TESTE IMPRESSÃO TÉRMICA',
        barcode: '7891234567890',
        quantity: 2,
        unitPrice: 12.5,
        costPrice: 8.0,
        discount: 0,
        subtotal: 25.0,
        unit: 'un',
      },
      {
        productId: 'prod-test-2',
        productCode: '1002',
        productName: 'BOBINA DE PAPEL TÉRMICO',
        barcode: '7899876543210',
        quantity: 1,
        unitPrice: 9.9,
        costPrice: 5.0,
        discount: 0,
        subtotal: 9.9,
        unit: 'un',
      },
    ],
    subtotal: 34.9,
    discount: 0,
    total: 34.9,
    paymentMethod: 'pix',
    amountPaid: 34.9,
    change: 0,
    status: 'completed',
    customerName: 'CLIENTE TESTE',
  };

  // Customers CRUD
  const handleSaveCustomer = (
    data: Omit<Customer, 'id' | 'totalSpent' | 'purchasesCount' | 'createdAt'>
  ) => {
    if (editingCustomer) {
      const updated = customers.map((c) =>
        c.id === editingCustomer.id ? { ...c, ...data } : c
      );
      setCustomers(updated);
      saveStoredCustomers(updated);
      setEditingCustomer(null);
    } else {
      const newCust: Customer = {
        ...data,
        id: `cust-${Date.now()}`,
        totalSpent: 0,
        purchasesCount: 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [newCust, ...customers];
      setCustomers(updated);
      saveStoredCustomers(updated);
    }
    setShowCustomerModal(false);
  };

  const handleDeleteCustomer = () => {
    if (!customerToDelete) return;
    const updated = customers.filter((c) => c.id !== customerToDelete.id);
    setCustomers(updated);
    saveStoredCustomers(updated);
    setCustomerToDelete(null);
  };

  // Categories CRUD
  const handleSaveCategory = (data: Omit<Category, 'id'>) => {
    if (editingCategory) {
      const updated = categories.map((c) =>
        c.id === editingCategory.id ? { ...c, ...data } : c
      );
      setCategories(updated);
      saveStoredCategories(updated);
      setEditingCategory(null);
    } else {
      const newCat: Category = {
        ...data,
        id: `cat-${Date.now()}`,
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      saveStoredCategories(updated);
    }
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = () => {
    if (!categoryToDelete) return;
    const updated = categories.filter((c) => c.id !== categoryToDelete.id);
    setCategories(updated);
    saveStoredCategories(updated);
    setCategoryToDelete(null);
  };

  // Operators CRUD
  const handleSaveOperator = (data: Omit<Operator, 'id'>) => {
    if (editingOperator) {
      const updated = operators.map((o) =>
        o.id === editingOperator.id ? { ...o, ...data } : o
      );
      setOperators(updated);
      saveStoredOperators(updated);
      setEditingOperator(null);
    } else {
      const newOp: Operator = {
        ...data,
        id: `op-${Date.now()}`,
      };
      const updated = [...operators, newOp];
      setOperators(updated);
      saveStoredOperators(updated);
    }
    setShowOperatorModal(false);
  };

  const handleDeleteOperator = () => {
    if (!operatorToDelete) return;
    const updated = operators.filter((o) => o.id !== operatorToDelete.id);
    setOperators(updated);
    saveStoredOperators(updated);
    setOperatorToDelete(null);
  };

  // Export Backup JSON
  const handleExportBackup = () => {
    const backupData = {
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      store: settings,
      products: getStoredProducts(),
      categories: getStoredCategories(),
      customers: getStoredCustomers(),
      operators: getStoredOperators(),
      sales: getStoredSales(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_deposito_odelot_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setBackupMessage('Backup exportado com sucesso!');
    setTimeout(() => setBackupMessage(null), 3000);
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.store) saveStoredSettings(parsed.store);
        if (Array.isArray(parsed.products)) saveStoredProducts(parsed.products);
        if (Array.isArray(parsed.categories)) saveStoredCategories(parsed.categories);
        if (Array.isArray(parsed.customers)) saveStoredCustomers(parsed.customers);
        if (Array.isArray(parsed.operators)) saveStoredOperators(parsed.operators);
        if (Array.isArray(parsed.sales)) saveStoredSales(parsed.sales);

        setBackupMessage('Backup restaurado com sucesso! Os dados foram atualizados.');
        setTimeout(() => setBackupMessage(null), 3500);
      } catch (err) {
        setBackupMessage('Erro ao importar backup: arquivo JSON inválido.');
        setTimeout(() => setBackupMessage(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      await batchSyncAllToFirestore({
        products: getStoredProducts(),
        categories: getStoredCategories(),
        customers: getStoredCustomers(),
        operators: getStoredOperators(),
        sales: getStoredSales(),
        settings: getStoredSettings(),
      });
      setBackupMessage('Nuvem Firebase Firestore sincronizada com sucesso!');
    } catch {
      setBackupMessage('Erro ao sincronizar com Firebase. Verifique a conexão.');
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setBackupMessage(null), 3500);
    }
  };

  // Filtered customers with semantic, partial & intent matching
  const filteredCustomers = filterAndRankCustomers(customers, customerSearch);

  // DB stats
  const totalProducts = getStoredProducts().length;
  const totalSales = getStoredSales().length;

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#070e1c] text-slate-900 dark:text-white p-4 sm:p-5 max-w-xl mx-auto w-full pb-24 space-y-4 transition-colors">
      
      {/* ========================================================
          1. HEADER: Title "Configurações", Subtitle
         ======================================================== */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Configurações
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Clientes, categorias, operadores e dados da loja
        </p>
      </div>

      {/* ========================================================
          2. NAVIGATION CONTAINER: 5 Cards (Clientes, Categorias, Operadores, Dados, Banco)
         ======================================================== */}
      <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-3 shadow-xs space-y-2">
        {/* Row 1: Clientes & Categorias */}
        <div className="grid grid-cols-2 gap-2">
          {/* Clientes Tab */}
          <button
            type="button"
            onClick={() => setActiveSection('customers')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              activeSection === 'customers'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200/80 dark:border-[#1e3056]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeSection === 'customers'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {customers.length}
            </span>
          </button>

          {/* Categorias Tab */}
          <button
            type="button"
            onClick={() => setActiveSection('categories')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              activeSection === 'categories'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200/80 dark:border-[#1e3056]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Categorias</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeSection === 'categories'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {categories.length}
            </span>
          </button>
        </div>

        {/* Row 2: Operadores & Dados da Loja */}
        <div className="grid grid-cols-2 gap-2">
          {/* Operadores Tab */}
          <button
            type="button"
            onClick={() => setActiveSection('operators')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              activeSection === 'operators'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200/80 dark:border-[#1e3056]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Operadores</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeSection === 'operators'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {operators.length}
            </span>
          </button>

          {/* Dados da Loja Tab */}
          <button
            type="button"
            onClick={() => setActiveSection('store')}
            className={`p-3 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              activeSection === 'store'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200/80 dark:border-[#1e3056]'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Dados da Loja</span>
          </button>
        </div>

        {/* Row 3: Banco de Dados Tab */}
        <div>
          <button
            type="button"
            onClick={() => setActiveSection('backup')}
            className={`w-full p-2.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-98 ${
              activeSection === 'backup'
                ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200/80 dark:border-[#1e3056]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Banco de Dados</span>
          </button>
        </div>
      </div>

      {/* Global message/feedback if any */}
      {backupMessage && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold animate-in fade-in flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{backupMessage}</span>
        </div>
      )}

      {/* ========================================================
          3. SECTION: CATEGORIAS (Matches Screenshot)
         ======================================================== */}
      {activeSection === 'categories' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Categorias de Produtos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agrupamento para filtros rápidos no PDV
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              className="h-10 px-3.5 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nova Categoria</span>
            </button>
          </div>

          {/* Categories List Cards */}
          <div className="space-y-2.5">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                Nenhuma categoria cadastrada.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 flex items-center justify-between shadow-xs transition-all hover:border-slate-300 dark:hover:border-[#22355c]"
                >
                  <div className="flex items-center gap-3">
                    {/* Color dot */}
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color || '#ea580c' }}
                    />
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {cat.name}
                    </span>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(cat);
                        setShowCategoryModal(true);
                      }}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#152342] flex items-center justify-center transition-colors"
                      title="Editar categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(cat)}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          4. SECTION: CLIENTES (Full CRUD)
         ======================================================== */}
      {activeSection === 'customers' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cadastro de Clientes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão de clientes, contatos e limites de crédito
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCustomer(null);
                setShowCustomerModal(true);
              }}
              className="h-10 px-3.5 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Buscar por nome, documento, telefone, cidade ou intenção..."
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#2563eb] shadow-2xs"
            />
            {customerSearch && (
              <button
                type="button"
                onClick={() => setCustomerSearch('')}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Customers List Cards */}
          <div className="space-y-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                Nenhum cliente encontrado.
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 flex items-center justify-between shadow-xs transition-all hover:border-slate-300 dark:hover:border-[#22355c]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-[#2563eb] flex items-center justify-center font-black text-sm shrink-0">
                      {c.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase truncate">
                        {c.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        {c.document && <span>{formatDocument(c.document)}</span>}
                        {c.phone && <span>• {formatPhone(c.phone)}</span>}
                        {c.creditLimit && c.creditLimit > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            • Limite: {formatCurrency(c.creditLimit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomer(c);
                        setShowCustomerModal(true);
                      }}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#152342] flex items-center justify-center transition-colors"
                      title="Editar cliente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerToDelete(c)}
                      className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors"
                      title="Excluir cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. SECTION: OPERADORES (Full CRUD)
         ======================================================== */}
      {activeSection === 'operators' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Operadores & Acessos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Usuários do sistema, permissões e senhas PIN
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingOperator(null);
                setShowOperatorModal(true);
              }}
              className="h-10 px-3.5 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Operador</span>
            </button>
          </div>

          {/* Operators List Cards */}
          <div className="space-y-2.5">
            {operators.map((op) => (
              <div
                key={op.id}
                className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 flex items-center justify-between shadow-xs transition-all hover:border-slate-300 dark:hover:border-[#22355c]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#131f38] border border-slate-200 dark:border-[#1e3056] text-slate-700 dark:text-slate-200 flex items-center justify-center font-black text-sm shrink-0">
                    <User className="w-5 h-5 text-[#2563eb]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {op.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wide bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] border border-blue-200 dark:border-blue-900">
                        {op.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      PIN: {op.pin ? '••••' : 'Sem PIN'} • {op.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOperator(op);
                      setShowOperatorModal(true);
                    }}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#152342] flex items-center justify-center transition-colors"
                    title="Editar operador"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatorToDelete(op)}
                    disabled={operators.length <= 1}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Excluir operador"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          6. SECTION: DADOS DA LOJA (Formulário da Empresa)
         ======================================================== */}
      {activeSection === 'store' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Dados da Loja
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Informações impressas no comprovante de venda e cabeçalho
            </p>
          </div>

          <form
            onSubmit={handleSaveSettings}
            className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 sm:p-5 shadow-xs space-y-3.5"
          >
            {saveSettingsSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Dados da empresa salvos com sucesso!</span>
              </div>
            )}

            {/* Nome Fantasia */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                Nome Fantasia da Loja
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                required
              />
            </div>

            {/* CNPJ e Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  CNPJ / CPF
                </label>
                <input
                  type="text"
                  value={settings.document}
                  onChange={(e) => setSettings({ ...settings, document: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            {/* Endereço */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Rua, Número, Bairro"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Cidade / UF */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                Cidade / Estado
              </label>
              <input
                type="text"
                value={settings.cityState}
                onChange={(e) => setSettings({ ...settings, cityState: e.target.value })}
                placeholder="São Paulo - SP"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            {/* Chave PIX e Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={settings.pixKey}
                  onChange={(e) => setSettings({ ...settings, pixKey: e.target.value })}
                  placeholder="Chave PIX para pagamentos"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Tipo da Chave
                </label>
                <select
                  value={settings.pixKeyType}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pixKeyType: e.target.value as StoreSettings['pixKeyType'],
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
            </div>

            {/* Mensagem Rodapé */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                Mensagem no Rodapé do Comprovante
              </label>
              <textarea
                value={settings.receiptFooter}
                onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                rows={2}
                placeholder="Ex: Obrigado pela preferência! Volte sempre!"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb] resize-none"
              />
            </div>

            {/* Largura de Impressão Térmica */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                  Largura da Bobina Térmica
                </label>
                <select
                  value={settings.printerWidth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      printerWidth: e.target.value as '80mm' | '58mm',
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#131f38] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#2563eb]"
                >
                  <option value="80mm">80mm (Padrão comercial)</option>
                  <option value="58mm">58mm (Mini impressora)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2.5 rounded-2xl border border-slate-200 dark:border-[#1a2846] bg-slate-50 dark:bg-[#131f38] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableSound}
                    onChange={(e) =>
                      setSettings({ ...settings, enableSound: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bip sonoro no PDV
                  </span>
                </label>
              </div>
            </div>

            {/* Salvar Botão */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Salvar Informações da Loja</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          7. SECTION: BANCO DE DADOS & BACKUP
         ======================================================== */}
      {activeSection === 'backup' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              Banco de Dados & Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Segurança, exportação, restauração e gestão de dados
            </p>
          </div>

          {/* Quick DB Summary */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 shadow-xs grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-[#1a2846]">
            <div className="p-2.5">
              <span className="text-[11px] text-slate-500 block">Total Produtos</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {totalProducts} itens
              </span>
            </div>
            <div className="p-2.5">
              <span className="text-[11px] text-slate-500 block">Total Vendas</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {totalSales} registros
              </span>
            </div>
            <div className="p-2.5">
              <span className="text-[11px] text-slate-500 block">Total Clientes</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {customers.length} cadastrados
              </span>
            </div>
            <div className="p-2.5">
              <span className="text-[11px] text-slate-500 block">Total Categorias</span>
              <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                {categories.length} cadastradas
              </span>
            </div>
          </div>

          {/* Cloud Firebase Firestore Status */}
          <div className="rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-[#0c1830] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Cloud className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Google Cloud & Firebase Firestore
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Conectado" />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Projeto: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">gen-lang-client-0201148502</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSyncCloud}
                disabled={isSyncingCloud}
                className="px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Nuvem'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Banco de dados em nuvem ativo. As vendas, produtos, clientes e configurações são salvos e sincronizados com a nuvem Firestore.
            </p>
          </div>

          {/* Backup Actions */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 space-y-3 shadow-xs">
            {/* Export */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#131f38] border border-slate-200 dark:border-[#1e3056]">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Exportar Backup Completo
                </h4>
                <p className="text-[11px] text-slate-500">
                  Baixe todos os produtos, clientes, vendas e configurações em JSON
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3.5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-blue-600 flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#131f38] border border-slate-200 dark:border-[#1e3056]">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">
                  Restaurar de Arquivo JSON
                </h4>
                <p className="text-[11px] text-slate-500">
                  Carregue um arquivo de backup previamente exportado
                </p>
              </div>
              <label className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* ========================================================
              Configuração de Impressora Térmica (Recibos / Cupons)
             ======================================================== */}
          <div className="rounded-3xl border border-slate-200 dark:border-[#1a2846] bg-white dark:bg-[#0e172a] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1e2f52] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-[#2563eb] flex items-center justify-center shrink-0">
                  <Printer className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Impressora Térmica
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ajustes de bobina e impressão dos recibos e comprovantes
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {settings.printerWidth || '80mm'}
              </span>
            </div>

            {printerSaveSuccess && (
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Configurações da impressora térmica salvas com sucesso!</span>
              </div>
            )}

            {/* Largura da Bobina */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                Largura da Bobina / Papel Térmico
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerWidth: '80mm' })}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    settings.printerWidth === '80mm'
                      ? 'border-[#2563eb] bg-blue-50/60 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-300 shadow-2xs ring-1 ring-[#2563eb]'
                      : 'border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black text-sm">80mm</span>
                  <span className="text-[10px] font-medium text-slate-500">Bobina Padrão (PDV Comercial)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerWidth: '58mm' })}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    settings.printerWidth === '58mm'
                      ? 'border-[#2563eb] bg-blue-50/60 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-300 shadow-2xs ring-1 ring-[#2563eb]'
                      : 'border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-black text-sm">58mm</span>
                  <span className="text-[10px] font-medium text-slate-500">Mini Bobina (Bluetooth / USB)</span>
                </button>
              </div>
            </div>

            {/* Vias do Cupom */}
            <div>
              <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1.5">
                Vias de Impressão por Venda
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerCopies: 1 })}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    (settings.printerCopies || 1) === 1
                      ? 'border-[#2563eb] bg-blue-50/60 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-300 shadow-2xs ring-1 ring-[#2563eb]'
                      : 'border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>1 Via (Via Cliente)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, printerCopies: 2 })}
                  className={`py-2 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    settings.printerCopies === 2
                      ? 'border-[#2563eb] bg-blue-50/60 dark:bg-blue-950/40 text-[#2563eb] dark:text-blue-300 shadow-2xs ring-1 ring-[#2563eb]'
                      : 'border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>2 Vias (Cliente + Loja)</span>
                </button>
              </div>
            </div>

            {/* Opções de Impressão Automática e Modo Condensado */}
            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings.autoPrintOnSale}
                  onChange={(e) =>
                    setSettings({ ...settings, autoPrintOnSale: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Impressão automática ao concluir venda
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Abre a tela de impressão sem necessidade de clicar no botão
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-200 dark:border-[#1e2f52] bg-slate-50 dark:bg-[#131f38] cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings.condensedFont}
                  onChange={(e) =>
                    setSettings({ ...settings, condensedFont: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Modo econômico condensado
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Reduz espaçamento entre linhas para economizar papel térmico
                  </span>
                </div>
              </label>
            </div>

            {/* Botões: Testar e Salvar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowTestReceiptModal(true)}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Testar Impressão</span>
              </button>

              <button
                type="button"
                onClick={handleSavePrinterSettings}
                className="py-2.5 px-3 rounded-2xl bg-[#2563eb] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Salvar Impressora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS
         ======================================================== */}
      {/* Category Modal */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        initialCategory={editingCategory}
      />

      {/* Customer Modal */}
      <CustomerFormModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveCustomer}
        initialCustomer={editingCustomer}
      />

      {/* Operator Modal */}
      <UserFormModal
        isOpen={showOperatorModal}
        onClose={() => {
          setShowOperatorModal(false);
          setEditingOperator(null);
        }}
        onSave={handleSaveOperator}
        initialOperator={editingOperator}
      />

      {/* Delete Category Confirmation */}
      <ConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir a categoria "${categoryToDelete?.name}"?`}
        confirmText="Excluir"
        isDestructive
      />

      {/* Delete Customer Confirmation */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={handleDeleteCustomer}
        title="Excluir Cliente"
        message={`Tem certeza que deseja excluir o cliente "${customerToDelete?.name}"?`}
        confirmText="Excluir"
        isDestructive
      />

      {/* Delete Operator Confirmation */}
      <ConfirmModal
        isOpen={!!operatorToDelete}
        onClose={() => setOperatorToDelete(null)}
        onConfirm={handleDeleteOperator}
        title="Excluir Operador"
        message={`Tem certeza que deseja excluir o operador "${operatorToDelete?.name}"?`}
        confirmText="Excluir"
        isDestructive
      />

      {/* Test Print Receipt Modal */}
      {showTestReceiptModal && (
        <ReceiptModal
          isOpen={showTestReceiptModal}
          onClose={() => setShowTestReceiptModal(false)}
          sale={sampleTestSale}
        />
      )}
    </div>
  );
};

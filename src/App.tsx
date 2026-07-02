/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  Boxes, 
  ArrowUpRight, 
  FileText, 
  TrendingDown, 
  Scale, 
  Clock, 
  Calendar, 
  Building2, 
  Menu, 
  X,
  CreditCard,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Users
} from 'lucide-react';

// Types
import { Product, SalesEntry, PaymentRecord, ExpenseRecord, CompanyProfile, Employee, PayrollEntry } from './types';

// Mock Defaults
import { 
  defaultCompanyProfile, 
  defaultProducts, 
  defaultSales, 
  defaultPayments, 
  defaultExpenses 
} from './mockData';

// Screens
import DashboardScreen from './components/DashboardScreen';
import ProductsScreen from './components/ProductsScreen';
import SalesScreen from './components/SalesScreen';
import InvoiceScreen from './components/InvoiceScreen';
import PaymentsScreen from './components/PaymentsScreen';
import ExpensesScreen from './components/ExpensesScreen';
import GSTSummaryScreen from './components/GSTSummaryScreen';
import DailyReportsScreen from './components/DailyReportsScreen';
import MonthlyReportsScreen from './components/MonthlyReportsScreen';
import CompanyProfileScreen from './components/CompanyProfileScreen';
import PayrollScreen from './components/PayrollScreen';

// Formatter helper
import { formatINR } from './utils/format';

export default function App() {
  
  // One-time check to clear any stale demo data from previous sessions
  if (typeof window !== 'undefined' && !localStorage.getItem('fc_fresh_start_v3')) {
    localStorage.removeItem('fc_products');
    localStorage.removeItem('fc_sales');
    localStorage.removeItem('fc_payments');
    localStorage.removeItem('fc_expenses');
    localStorage.removeItem('fc_employees');
    localStorage.removeItem('fc_payroll');
    localStorage.setItem('fc_fresh_start_v3', 'true');
  }

  // Navigation
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');

  // --- PERSISTENT CORE STATES ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const cached = localStorage.getItem('fc_company_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.businessName === "Prana Wellness Pvt Ltd" || !parsed.businessName) {
          parsed.businessName = "Rastafari Wellness";
          parsed.businessState = "Maharashtra";
          parsed.businessEmail = "finance@rastafariwellness.com";
          localStorage.setItem('fc_company_profile', JSON.stringify(parsed));
        }
        return parsed;
      } catch (e) {
        return defaultCompanyProfile;
      }
    }
    return defaultCompanyProfile;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('fc_products');
    return cached ? JSON.parse(cached) : defaultProducts;
  });

  const [sales, setSales] = useState<SalesEntry[]>(() => {
    const cached = localStorage.getItem('fc_sales');
    return cached ? JSON.parse(cached) : defaultSales;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const cached = localStorage.getItem('fc_payments');
    return cached ? JSON.parse(cached) : defaultPayments;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const cached = localStorage.getItem('fc_expenses');
    return cached ? JSON.parse(cached) : defaultExpenses;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = localStorage.getItem('fc_employees');
    return cached ? JSON.parse(cached) : [];
  });

  const [payroll, setPayroll] = useState<PayrollEntry[]>(() => {
    const cached = localStorage.getItem('fc_payroll');
    return cached ? JSON.parse(cached) : [];
  });

  // --- WRITE TO LOCAL STORAGE EFFECT ---
  useEffect(() => {
    localStorage.setItem('fc_company_profile', JSON.stringify(companyProfile));
  }, [companyProfile]);

  useEffect(() => {
    localStorage.setItem('fc_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('fc_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('fc_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('fc_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('fc_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('fc_payroll', JSON.stringify(payroll));
  }, [payroll]);

  // --- ACTIONS ---
  // Products
  const handleAddProduct = (p: Product) => {
    setProducts(prev => [p, ...prev]);
  };
  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.code === updated.code ? updated : p));
  };
  const handleDeleteProduct = (code: string) => {
    setProducts(prev => prev.filter(p => p.code !== code));
  };

  // Sales
  const handleAddSale = (s: SalesEntry) => {
    setSales(prev => [s, ...prev]);
  };
  const handleUpdateSale = (updated: SalesEntry) => {
    setSales(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const handleDeleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  };

  // Payments
  const handleAddPayment = (p: PaymentRecord) => {
    setPayments(prev => [p, ...prev]);
  };
  const handleDeletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Expenses
  const handleAddExpense = (e: ExpenseRecord) => {
    setExpenses(prev => [e, ...prev]);
  };
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Employees
  const handleAddEmployee = (emp: Employee) => {
    setEmployees(prev => [emp, ...prev]);
  };
  const handleUpdateEmployee = (updated: Employee) => {
    setEmployees(prev => prev.map(e => e.id === updated.id ? updated : e));
  };
  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  // Payroll
  const handleAddPayroll = (entry: PayrollEntry) => {
    setPayroll(prev => [entry, ...prev]);
  };
  const handleUpdatePayroll = (updated: PayrollEntry) => {
    setPayroll(prev => prev.map(p => p.id === updated.id ? updated : p));
  };
  const handleDeletePayroll = (id: string) => {
    setPayroll(prev => prev.filter(p => p.id !== id));
  };

  // Profile Update
  const handleUpdateProfile = (profile: CompanyProfile) => {
    setCompanyProfile(profile);
  };

  // Navigation controller with deep-linking trigger for invoice generation
  const handleViewInvoiceFromSale = (sale: SalesEntry) => {
    setSelectedSaleId(sale.id);
    setActiveScreen('invoice');
  };

  // Helper to calculate total active stock low products count for warning dots
  const getClosingStock = (product: Product) => {
    const soldQty = sales
      .filter(s => s.productCode === product.code)
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const purchasedQty = expenses
      .filter(e => e.type === 'Purchase' && e.product === product.code)
      .reduce((sum, e) => sum + (e.quantity || 0), 0);

    return product.openingStock + purchasedQty - soldQty;
  };

  const lowStockCount = products.filter(p => getClosingStock(p) <= p.minimumStock).length;
  const unmatchedPaymentsCount = payments.filter(p => p.matchStatus === 'Unmatched' || p.matchStatus === 'Missing Order').length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Stock', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-500' },
    { id: 'sales', label: 'Sales Entry', icon: ArrowUpRight },
    { id: 'invoice', label: 'Invoice Generator', icon: FileText },
    { id: 'payments', label: 'Payment Tracker', icon: CreditCard, badge: unmatchedPaymentsCount > 0 ? unmatchedPaymentsCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'expenses', label: 'Purchases & Expenses', icon: TrendingDown },
    { id: 'payroll', label: 'Payroll', icon: Users },
    { id: 'gst', label: 'GST Summary', icon: Scale },
    { id: 'daily', label: 'Daily Reports', icon: Calendar },
    { id: 'monthly', label: 'Monthly Reports', icon: Clock },
    { id: 'profile', label: 'Company Profile', icon: Building2 }
  ];

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            products={products} 
            sales={sales} 
            payments={payments} 
            expenses={expenses}
            employees={employees}
            payroll={payroll}
            onNavigate={(screen) => setActiveScreen(screen)}
          />
        );
      case 'products':
        return (
          <ProductsScreen 
            products={products} 
            sales={sales} 
            expenses={expenses}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        );
      case 'sales':
        return (
          <SalesScreen 
            sales={sales} 
            products={products}
            businessState={companyProfile.businessState}
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onDeleteSale={handleDeleteSale}
            onViewInvoice={handleViewInvoiceFromSale}
          />
        );
      case 'invoice':
        return (
          <InvoiceScreen 
            sales={sales} 
            products={products} 
            companyProfile={companyProfile}
            selectedSaleId={selectedSaleId}
            onUpdateSale={handleUpdateSale}
            onSelectSale={(id) => setSelectedSaleId(id)}
          />
        );
      case 'payments':
        return (
          <PaymentsScreen 
            payments={payments} 
            sales={sales}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
          />
        );
      case 'expenses':
        return (
          <ExpensesScreen 
            expenses={expenses} 
            products={products}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        );
      case 'payroll':
        return (
          <PayrollScreen
            employees={employees}
            payroll={payroll}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onAddPayroll={handleAddPayroll}
            onUpdatePayroll={handleUpdatePayroll}
            onDeletePayroll={handleDeletePayroll}
          />
        );
      case 'gst':
        return (
          <GSTSummaryScreen 
            sales={sales} 
            expenses={expenses} 
            companyProfile={companyProfile} 
          />
        );
      case 'daily':
        return (
          <DailyReportsScreen 
            sales={sales} 
            payments={payments} 
            expenses={expenses} 
            products={products} 
          />
        );
      case 'monthly':
        return (
          <MonthlyReportsScreen 
            sales={sales} 
            payments={payments} 
            expenses={expenses} 
            products={products} 
            payroll={payroll}
          />
        );
      case 'profile':
        return (
          <CompanyProfileScreen 
            companyProfile={companyProfile} 
            onUpdateProfile={handleUpdateProfile} 
          />
        );
      default:
        return <div className="p-8 text-center text-sm">Screen not found.</div>;
    }
  };

  // Quick core summary for sidebar widget
  const totalSalesOverall = sales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalNetBanked = payments.reduce((sum, p) => sum + p.netReceived, 0);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8F9FA] text-slate-800">
      
      {/* MOBILE HEADER (non-print) */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center no-print sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold font-display">
            FC
          </div>
          <span className="font-display font-bold text-sm text-slate-900">Finance Control</span>
        </div>
        
        <button 
          id="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 border border-slate-200 rounded text-slate-500 hover:bg-slate-50"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* SIDEBAR NAVIGATION (non-print) */}
      <aside className={`
        fixed inset-y-0 left-0 transform md:relative md:translate-x-0 transition-transform duration-200 ease-in-out
        w-64 bg-white border-r border-slate-200 py-6 px-4 flex flex-col justify-between z-40 no-print
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `} id="app-sidebar">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-indigo-600 rounded flex items-center justify-center text-white text-sm font-bold font-display shadow-xs">
              FC
            </div>
            <div>
              <h1 className="font-display font-semibold text-slate-900 text-sm tracking-tight">Finance Control</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Internal ERP Ledger</p>
            </div>
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] space-y-1.5">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Outward Revenue:</span>
              <span className="font-mono text-slate-800 font-bold">{formatINR(totalSalesOverall)}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Cash in Bank:</span>
              <span className="font-mono text-emerald-800 font-bold">{formatINR(totalNetBanked + 350000 - 120174)}</span>
            </div>
          </div>

          {/* Menu items */}
          <nav className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => {
                    setActiveScreen(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 pt-4 px-2 text-[10px] text-slate-400 leading-normal font-semibold">
          <p>{companyProfile.businessName}</p>
          <p className="mt-0.5 font-mono text-[9px]">v1.0 (GST Compliant)</p>
        </div>
      </aside>

      {/* MOBILE MENUS BACKDROP (non-print) */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/25 z-30 md:hidden no-print"
        />
      )}

      {/* MAIN WORKSPACE VIEWPORT */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto w-full max-w-7xl mx-auto" id="app-workspace">
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="h-full"
        >
          {renderActiveScreen()}
        </motion.div>
      </main>

    </div>
  );
}

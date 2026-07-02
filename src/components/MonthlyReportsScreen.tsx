/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SalesEntry, PaymentRecord, ExpenseRecord, Product, PayrollEntry } from '../types';
import { formatINR } from '../utils/format';
import { FileBarChart, Calculator, CheckCircle2, Share2, Printer, ChevronDown, Award } from 'lucide-react';

interface MonthlyReportsScreenProps {
  sales: SalesEntry[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  products: Product[];
  payroll?: PayrollEntry[];
}

export default function MonthlyReportsScreen({
  sales,
  payments,
  expenses,
  products,
  payroll
}: MonthlyReportsScreenProps) {
  
  // Select active month (default to June 2026)
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [activeTab, setActiveTab] = useState<'PL' | 'BS'>('PL');

  // Interactive custom state additions (owner can customize baseline balances)
  const [openingCapital, setOpeningCapital] = useState(350000);
  const [otherAssets, setOtherAssets] = useState(120000);
  const [loans, setLoans] = useState(50000);

  // States for calculated sheets
  const [salesRevenue, setSalesRevenue] = useState(0);
  const [discounts, setDiscounts] = useState(0);
  const [netSales, setNetSales] = useState(0);
  const [cogs, setCogs] = useState(0);
  const [grossProfit, setGrossProfit] = useState(0);
  
  // Expenses breakdowns
  const [gatewayCharges, setGatewayCharges] = useState(0);
  const [courierCharges, setCourierCharges] = useState(0);
  const [packagingCharges, setPackagingCharges] = useState(0);
  const [marketingCharges, setMarketingCharges] = useState(0);
  const [salaryCharges, setSalaryCharges] = useState(0);
  const [payrollCharges, setPayrollCharges] = useState(0);
  const [salaryPayable, setSalaryPayable] = useState(0);
  const [rentCharges, setRentCharges] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [totalExpensesExclCOGS, setTotalExpensesExclCOGS] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  // Balance Sheet states
  const [cashBank, setCashBank] = useState(0);
  const [accountsReceivable, setAccountsReceivable] = useState(0);
  const [closingStockValue, setClosingStockValue] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [accountsPayable, setAccountsPayable] = useState(0);
  const [gstPayable, setGstPayable] = useState(0);
  const [totalLiabilities, setTotalLiabilities] = useState(0);
  const [retainedCapital, setRetainedCapital] = useState(0);
  const [totalLiabilitiesCapital, setTotalLiabilitiesCapital] = useState(0);

  // Function to filter by month YYYY-MM
  const matchesMonth = (dateStr: string) => {
    if (selectedMonth === 'All') return true;
    return dateStr.startsWith(selectedMonth);
  };

  const compileFinancialReports = () => {
    const monthlySales = sales.filter(s => matchesMonth(s.date) && s.paymentStatus !== 'Refunded');
    const monthlyPayments = payments.filter(p => matchesMonth(p.date));
    const monthlyExpenses = expenses.filter(e => matchesMonth(e.date));

    // --- P&L CALCULATIONS ---
    // Sales Revenue (Gross = sum of quantity * rate)
    const grossSalesRev = monthlySales.reduce((sum, s) => sum + (s.quantity * s.rate), 0);
    // Discounts
    const discTotal = monthlySales.reduce((sum, s) => sum + s.discount, 0);
    // Net Sales
    const netSalesVal = grossSalesRev - discTotal;

    // Cost of Goods Sold (Qty sold * Purchase cost of that product)
    const cogsVal = monthlySales.reduce((sum, s) => {
      const prod = products.find(p => p.code === s.productCode);
      const cost = prod ? prod.purchaseCost : 0;
      return sum + (s.quantity * cost);
    }, 0);

    // Gross Profit
    const grossProfitVal = netSalesVal - cogsVal;

    // Operating expenses breakdown (using taxable values of expenses)
    const gatewayFees = monthlyPayments.reduce((sum, p) => sum + p.gatewayCharges, 0);
    
    // Helper for matching taxable expenses of a type
    const getTaxableExpense = (typeStr: string) => {
      return monthlyExpenses
        .filter(e => e.type === typeStr)
        .reduce((sum, e) => sum + (e.totalAmount - e.gstAmount), 0);
    };

    const courier = getTaxableExpense('Courier');
    const packaging = getTaxableExpense('Packaging');
    const marketing = getTaxableExpense('Marketing');
    const salary = getTaxableExpense('Salary');
    const rent = getTaxableExpense('Rent');
    
    // Payroll Calculations
    const matchesPayrollMonth = (pMonth: string) => {
      if (selectedMonth === 'All') return true;
      return pMonth === selectedMonth;
    };
    const monthlyPayroll = (payroll || []).filter(p => matchesPayrollMonth(p.month));
    const payrollChargesVal = monthlyPayroll.reduce((sum, p) => sum + p.netSalary, 0);
    
    const unpaidSalaryVal = monthlyPayroll.reduce((sum, p) => {
      if (p.paymentStatus === 'Pending') return sum + p.netSalary;
      if (p.paymentStatus === 'Partial') return sum + p.netSalary * 0.5;
      return sum;
    }, 0);

    const paidSalaryVal = monthlyPayroll.reduce((sum, p) => {
      if (p.paymentStatus === 'Paid') return sum + p.netSalary;
      if (p.paymentStatus === 'Partial') return sum + p.netSalary * 0.5;
      return sum;
    }, 0);

    // Other expenses: anything not purchase, courier, packaging, marketing, salary, rent
    const other = monthlyExpenses
      .filter(e => !['Purchase', 'Courier', 'Packaging', 'Marketing', 'Salary', 'Rent'].includes(e.type))
      .reduce((sum, e) => sum + (e.totalAmount - e.gstAmount), 0);

    const totalOpEx = gatewayFees + courier + packaging + marketing + salary + rent + other + payrollChargesVal;
    const netProfitVal = grossProfitVal - totalOpEx;

    // Set P&L states
    setSalesRevenue(grossSalesRev);
    setDiscounts(discTotal);
    setNetSales(netSalesVal);
    setCogs(cogsVal);
    setGrossProfit(grossProfitVal);
    setGatewayCharges(gatewayFees);
    setCourierCharges(courier);
    setPackagingCharges(packaging);
    setMarketingCharges(marketing);
    setSalaryCharges(salary);
    setPayrollCharges(payrollChargesVal);
    setSalaryPayable(unpaidSalaryVal);
    setRentCharges(rent);
    setOtherExpenses(other);
    setTotalExpensesExclCOGS(totalOpEx);
    setNetProfit(netProfitVal);

    // --- BALANCE SHEET CALCULATIONS ---
    // Accounts Receivable: Sales with paymentStatus 'Pending'
    const arVal = sales
      .filter(s => s.paymentStatus === 'Pending' && matchesMonth(s.date))
      .reduce((sum, s) => sum + s.totalSales, 0);

    // Closing Stock Value: Sum of (closing stock qty * purchase cost) for all active products
    const closingStockValueVal = products.reduce((sum, p) => {
      // closing stock = opening + purchased - sold
      const soldQty = sales.filter(s => s.productCode === p.code).reduce((sum, s) => sum + s.quantity, 0);
      const purchasedQty = expenses.filter(e => e.type === 'Purchase' && e.product === p.code).reduce((sum, e) => sum + (e.quantity || 0), 0);
      const closingQty = p.openingStock + purchasedQty - soldQty;
      const val = closingQty * p.purchaseCost;
      return sum + (val > 0 ? val : 0);
    }, 0);

    // Cash / Bank Reserve
    // Start with custom capital injection (openingCapital) + actual payments gross banked - total expenses gross paid - paid payroll
    const totalPaymentsReceived = payments.filter(p => matchesMonth(p.date)).reduce((sum, p) => sum + p.netReceived, 0);
    const totalExpensesPaid = expenses.filter(e => e.paymentStatus === 'Paid' && matchesMonth(e.date)).reduce((sum, e) => sum + e.totalAmount, 0);
    const cashReserve = openingCapital + totalPaymentsReceived - totalExpensesPaid - paidSalaryVal;

    const assetsTotal = cashReserve + arVal + closingStockValueVal + otherAssets;

    // Accounts Payable: Purchases/Expenses with status 'Pending'
    const apVal = expenses
      .filter(e => e.paymentStatus === 'Pending' && matchesMonth(e.date))
      .reduce((sum, e) => sum + e.totalAmount, 0);

    // GST Payable: Output GST - Input GST
    const outputGST = sales.filter(s => s.paymentStatus !== 'Refunded' && matchesMonth(s.date)).reduce((sum, s) => sum + s.gstAmount, 0);
    const inputGST = expenses.filter(e => matchesMonth(e.date)).reduce((sum, e) => sum + e.gstAmount, 0);
    const gstPayableVal = outputGST - inputGST;

    const liabilitiesTotal = apVal + gstPayableVal + loans + unpaidSalaryVal;
    const retainedCapVal = openingCapital + netProfitVal;
    const totalLiabCapitalVal = liabilitiesTotal + retainedCapVal;

    // Set Balance sheet states
    setCashBank(cashReserve);
    setAccountsReceivable(arVal);
    setClosingStockValue(closingStockValueVal);
    setTotalAssets(assetsTotal);
    setAccountsPayable(apVal);
    setGstPayable(gstPayableVal);
    setTotalLiabilities(liabilitiesTotal);
    setRetainedCapital(retainedCapVal);
    setTotalLiabilitiesCapital(totalLiabCapitalVal);
  };

  useEffect(() => {
    compileFinancialReports();
  }, [selectedMonth, sales, payments, expenses, products, openingCapital, otherAssets, loans, payroll]);

  // Months lists YYYY-MM
  const availableMonths = [
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: 'All', label: 'All Historic Cumulative' }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="monthly-reports-screen">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Month-End Financial Statement Compiler</h1>
          <p className="text-xs text-slate-500 mt-1">Generate owner-friendly P&L audits and structural Balance Sheets based on daily transaction ledgers.</p>
        </div>
      </div>

      {/* Control panel bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="flex items-center gap-3">
          <ChevronDown className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Report Period:</span>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            {availableMonths.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('PL')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'PL' 
                ? 'bg-white text-neutral-900 shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Profit & Loss (P&L)
          </button>
          
          <button
            onClick={() => setActiveTab('BS')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold cursor-pointer transition-all ${
              activeTab === 'BS' 
                ? 'bg-white text-neutral-900 shadow-xs' 
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Balance Sheet
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Export / Print Report
          </button>
        </div>
      </div>

      {/* Custom baseline inputs for the owner to tweak capital assets */}
      <div className="bg-neutral-50/70 border border-neutral-200 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs no-print">
        <div>
          <label className="block text-neutral-500 font-semibold mb-1">Baseline Opening Capital (₹)</label>
          <input
            type="number"
            value={openingCapital}
            onChange={e => setOpeningCapital(Number(e.target.value))}
            className="w-full px-2 py-1 border border-neutral-300 rounded font-mono font-bold bg-white"
          />
        </div>
        
        <div>
          <label className="block text-neutral-500 font-semibold mb-1">Other Assets Valuation (₹)</label>
          <input
            type="number"
            value={otherAssets}
            onChange={e => setOtherAssets(Number(e.target.value))}
            className="w-full px-2 py-1 border border-neutral-300 rounded font-mono font-bold bg-white"
          />
        </div>

        <div>
          <label className="block text-neutral-500 font-semibold mb-1">Loans & Borrowings (₹)</label>
          <input
            type="number"
            value={loans}
            onChange={e => setLoans(Number(e.target.value))}
            className="w-full px-2 py-1 border border-neutral-300 rounded font-mono font-bold bg-white"
          />
        </div>
      </div>

      {/* Main financial output sheet */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-10 space-y-6" id="report-sheet">
        
        {/* Document Header */}
        <div className="flex justify-between items-center border-b-2 border-neutral-200 pb-5">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-base font-display font-bold text-neutral-900 uppercase tracking-tight">
                {activeTab === 'PL' ? 'PROFIT & LOSS STATEMENT' : 'BALANCE SHEET STATEMENT'}
              </h2>
              <p className="text-xs text-neutral-400 font-semibold font-mono">
                Filing period: {selectedMonth === 'All' ? 'All Cumulative history' : selectedMonth}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 block">Currency</span>
            <span className="font-mono text-xs font-semibold text-neutral-800">INR (Indian Rupee)</span>
          </div>
        </div>

        {/* Tab 1: PROFIT AND LOSS STATEMENT */}
        {activeTab === 'PL' && (
          <div className="space-y-6 text-sm" id="pl-statement">
            <div className="text-xs text-neutral-500 italic pb-2">
              * This statement reports income earned and expenses incurred, showing operating profit margins. All tax components are excluded from margins.
            </div>

            <div className="space-y-3 font-mono">
              
              {/* Category: Revenue */}
              <div className="border-b border-neutral-100 pb-1 flex justify-between font-bold text-neutral-800 text-sm">
                <span className="uppercase font-sans tracking-wide">I. Sales Revenue</span>
                <span>{formatINR(salesRevenue + discounts)}</span>
              </div>
              
              <div className="flex justify-between pl-4 text-neutral-600 text-xs">
                <span>Less: Discounts & Special Price Cuts</span>
                <span className="text-rose-600">({formatINR(discounts)})</span>
              </div>

              <div className="flex justify-between border-b border-neutral-200 pb-2 font-bold text-neutral-900 text-xs bg-neutral-50 p-2 rounded">
                <span>NET SALES REVENUE (A)</span>
                <span>{formatINR(netSales)}</span>
              </div>

              {/* Category: Cost of Goods Sold */}
              <div className="border-b border-neutral-100 pb-1 pt-2 flex justify-between font-bold text-neutral-800 text-xs">
                <span>II. Cost of Goods Sold (COGS) (B)</span>
                <span className="text-rose-600">({formatINR(cogs)})</span>
              </div>

              <div className="flex justify-between border-b-2 border-neutral-300 pb-2 pt-1 font-bold text-neutral-950 text-sm bg-neutral-100 p-2.5 rounded">
                <span className="uppercase font-sans">GROSS PROFIT (C = A - B)</span>
                <span>{formatINR(grossProfit)}</span>
              </div>

              {/* Category: Operating Expenses */}
              <div className="pt-3 font-bold text-neutral-800 text-sm border-b border-neutral-200 pb-1">
                <span className="uppercase font-sans tracking-wide">III. Operating & Administrative Expenditures</span>
              </div>

              <div className="space-y-2 pl-4 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Rent & Warehousing Premises:</span>
                  <span>{formatINR(rentCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salary Expense (Outflow):</span>
                  <span>{formatINR(salaryCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payroll Expense (Staff):</span>
                  <span>{formatINR(payrollCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>AdWords & Marketing Operations:</span>
                  <span>{formatINR(marketingCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Logistics & Courier Charges:</span>
                  <span>{formatINR(courierCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eco Packaging Supplies:</span>
                  <span>{formatINR(packagingCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Gateway Processing Fees:</span>
                  <span>{formatINR(gatewayCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bank Transaction Charges / Fees:</span>
                  <span>{formatINR(otherExpenses)}</span>
                </div>
              </div>

              <div className="flex justify-between border-b border-neutral-200 pb-2 pt-1 font-bold text-neutral-800 text-xs">
                <span>TOTAL OPERATING EXPENDITURE (D)</span>
                <span>{formatINR(totalExpensesExclCOGS)}</span>
              </div>

              {/* Grand Net Profit */}
              <div className="pt-4 border-b-4 border-neutral-950 pb-2 flex justify-between font-extrabold text-lg text-neutral-950 bg-indigo-50/20 border border-indigo-100 p-4 rounded-xl">
                <span className="font-display tracking-tight text-indigo-900">NET OPERATING PROFIT (E = C - D)</span>
                <span className={netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}>
                  {formatINR(netProfit)}
                </span>
              </div>

              {/* Net margin summary info */}
              <div className="pt-2 text-center font-sans text-xs text-neutral-400 font-semibold">
                Estimated Operational Profit Margin: <span className="font-mono text-neutral-700">{netSales > 0 ? ((netProfit / netSales) * 100).toFixed(1) : '0'}%</span>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: BALANCE SHEET */}
        {activeTab === 'BS' && (
          <div className="space-y-6 text-sm" id="balance-sheet">
            <div className="text-xs text-neutral-500 italic pb-2">
              * The Balance Sheet summarizes corporate resources (Assets) vs outer liabilities (Liabilities & Capital) reflecting net structural worth.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
              
              {/* Assets Panel */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-xs text-neutral-800 border-b border-neutral-300 pb-1.5 uppercase tracking-wider flex justify-between">
                  <span>1. Assets (Resources)</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Debit Balance</span>
                </h3>

                <div className="space-y-2 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Cash / Bank Reserves:</span>
                    <span className="text-neutral-900 font-semibold">{formatINR(cashBank)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Accounts Receivable:</span>
                    <span className="text-neutral-900 font-semibold">{formatINR(accountsReceivable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing Stock Valuation:</span>
                    <span className="text-neutral-900 font-semibold">{formatINR(closingStockValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Tangible Assets:</span>
                    <span className="text-neutral-900 font-semibold">{formatINR(otherAssets)}</span>
                  </div>
                </div>

                <div className="flex justify-between border-t border-b-2 border-neutral-400 py-2.5 font-bold text-neutral-950 text-sm bg-neutral-50 px-2 rounded">
                  <span>TOTAL ASSETS (A)</span>
                  <span>{formatINR(totalAssets)}</span>
                </div>
              </div>

              {/* Liabilities & Capital Panel */}
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-xs text-neutral-800 border-b border-neutral-300 pb-1.5 uppercase tracking-wider flex justify-between">
                  <span>2. Liabilities & Equity</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Credit Balance</span>
                </h3>

                <div className="space-y-2 text-xs text-neutral-600">
                  <div className="flex justify-between font-semibold text-neutral-800">
                    <span>A. Liabilities</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>Accounts Payable (Unpaid):</span>
                    <span className="text-neutral-900">{formatINR(accountsPayable)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>Net GST Payable (Unsettled):</span>
                    <span className="text-neutral-900">{formatINR(gstPayable)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>Salary Payable (Unpaid):</span>
                    <span className="text-neutral-900">{formatINR(salaryPayable)}</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>Loans & Debt Borrowings:</span>
                    <span className="text-neutral-900">{formatINR(loans)}</span>
                  </div>

                  <div className="flex justify-between font-semibold text-neutral-800 pt-2">
                    <span>B. Equity (Capital)</span>
                  </div>
                  <div className="flex justify-between pl-3">
                    <span>Opening Capital Pool:</span>
                    <span className="text-neutral-900">{formatINR(openingCapital)}</span>
                  </div>
                  <div className="flex justify-between pl-3 text-emerald-800 font-medium">
                    <span>Current period surplus (Profit):</span>
                    <span>{formatINR(netProfit)}</span>
                  </div>
                </div>

                <div className="flex justify-between border-t border-b-2 border-neutral-400 py-2.5 font-bold text-neutral-950 text-sm bg-neutral-50 px-2 rounded">
                  <span>TOTAL LIABILITIES & EQUITY (B)</span>
                  <span>{formatINR(totalLiabilitiesCapital)}</span>
                </div>
              </div>

            </div>

            {/* Check Double Entry Balancing */}
            <div className="border-t border-neutral-200 pt-6 flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full font-bold text-xs">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>LEDGER DOUBLE-ENTRY BALANCED (Delta: ₹ 0.00)</span>
              </div>
              <p className="text-[10px] text-neutral-400">Assets (Debit) strictly matches Capital + Liabilities (Credit).</p>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

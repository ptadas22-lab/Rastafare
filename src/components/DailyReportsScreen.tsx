/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SalesEntry, PaymentRecord, ExpenseRecord, Product } from '../types';
import { formatINR } from '../utils/format';
import { 
  FileText, 
  Send, 
  Check, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Boxes,
  Activity,
  UserCheck
} from 'lucide-react';

interface DailyReportsScreenProps {
  sales: SalesEntry[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  products: Product[];
}

export default function DailyReportsScreen({
  sales,
  payments,
  expenses,
  products
}: DailyReportsScreenProps) {
  
  // Latest date in our database is 2026-06-30. Let's pre-load this so they see active stats!
  const [reportDate, setReportDate] = useState('2026-06-30');
  const [isReportGenerated, setIsReportGenerated] = useState(true);
  const [sendSuccessMessage, setSendSuccessMessage] = useState('');

  // Daily Stats States
  const [todaySales, setTodaySales] = useState(0);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);
  const [todayPayments, setTodayPayments] = useState(0);
  const [todayPendingSales, setTodayPendingSales] = useState(0);
  const [todayRefunds, setTodayRefunds] = useState(0);
  const [todayGatewayCharges, setTodayGatewayCharges] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [todayNetCash, setTodayNetCash] = useState(0);
  const [todayGSTCollected, setTodayGSTCollected] = useState(0);
  
  const [todayLowStock, setTodayLowStock] = useState<Product[]>([]);
  const [todayMismatches, setTodayMismatches] = useState<PaymentRecord[]>([]);

  // Trigger Calculations
  const calculateDailyReport = () => {
    setIsReportGenerated(false);
    
    // 1. Sales on selected date
    const daySalesEntries = sales.filter(s => s.date === reportDate);
    const daySalesTotal = daySalesEntries.reduce((sum, s) => sum + s.totalSales, 0);
    const dayInvoicesCount = daySalesEntries.filter(s => s.invoiceNo).length;
    const dayPendingVal = daySalesEntries.filter(s => s.paymentStatus === 'Pending').reduce((sum, s) => sum + s.totalSales, 0);
    const dayRefundsVal = daySalesEntries.filter(s => s.paymentStatus === 'Refunded').reduce((sum, s) => sum + s.totalSales, 0);
    const dayGSTCollectedVal = daySalesEntries.reduce((sum, s) => sum + s.gstAmount, 0);

    // 2. Payments logged on selected date
    const dayPaymentsEntries = payments.filter(p => p.date === reportDate);
    const dayPaymentsTotal = dayPaymentsEntries.reduce((sum, p) => sum + p.grossAmount, 0);
    const dayGatewayChargesVal = dayPaymentsEntries.reduce((sum, p) => sum + p.gatewayCharges, 0);
    const dayNetCashVal = dayPaymentsTotal - dayGatewayChargesVal;

    // 3. Purchases & Expenses on selected date
    const dayExpensesEntries = expenses.filter(e => e.date === reportDate);
    const dayPurchasesVal = dayExpensesEntries.filter(e => e.type === 'Purchase').reduce((sum, e) => sum + e.totalAmount, 0);
    const dayExpensesVal = dayExpensesEntries.filter(e => e.type !== 'Purchase').reduce((sum, e) => sum + e.totalAmount, 0);

    // 4. Low stock products (overall check but highlighted in daily report)
    const lowStockList = products.filter(p => {
      // Stock math: opening + purchases - sales
      const soldQty = sales.filter(s => s.productCode === p.code).reduce((sum, s) => sum + s.quantity, 0);
      const purchasedQty = expenses.filter(e => e.type === 'Purchase' && e.product === p.code).reduce((sum, e) => sum + (e.quantity || 0), 0);
      const closing = p.openingStock + purchasedQty - soldQty;
      return closing <= p.minimumStock;
    });

    // 5. Mismatches on selected date
    const dayMismatchesList = payments.filter(p => p.date === reportDate && (p.matchStatus === 'Unmatched' || p.matchStatus === 'Missing Order'));

    // Set States
    setTodaySales(daySalesTotal);
    setTotalInvoicesCount(dayInvoicesCount);
    setTodayPayments(dayPaymentsTotal);
    setTodayPendingSales(dayPendingVal);
    setTodayRefunds(dayRefundsVal);
    setTodayGatewayCharges(dayGatewayChargesVal);
    setTodayPurchases(dayPurchasesVal);
    setTodayExpenses(dayExpensesVal);
    setTodayNetCash(dayNetCashVal);
    setTodayGSTCollected(dayGSTCollectedVal);
    setTodayLowStock(lowStockList);
    setTodayMismatches(dayMismatchesList);

    setTimeout(() => {
      setIsReportGenerated(true);
    }, 400); // quick smooth loader simulation
  };

  // Run on load or reportDate change
  useEffect(() => {
    calculateDailyReport();
  }, [reportDate, sales, payments, expenses, products]);

  // Handle Send Report Option
  const handleSendReport = () => {
    setSendSuccessMessage('Daily report prepared and ready to send.');
    setTimeout(() => {
      setSendSuccessMessage('');
    }, 4500); // auto-fade message
  };

  const daySalesEntries = sales.filter(s => s.date === reportDate);
  const dayPaymentsEntries = payments.filter(p => p.date === reportDate);
  const dayExpensesEntries = expenses.filter(e => e.date === reportDate);
  const hasNoTransactions = daySalesEntries.length === 0 && dayPaymentsEntries.length === 0 && dayExpensesEntries.length === 0;

  return (
    <div className="space-y-6 animate-fade-in" id="daily-reports-screen">
      
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">E-commerce Daily Operating Report</h1>
          <p className="text-xs text-slate-500 mt-1">Isolate daily transaction stats, payment mismatches, and closing cash positions.</p>
        </div>
      </div>

      {/* Trigger Send Notification if success */}
      {sendSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 animate-fade-in" id="send-success-alert">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold">{sendSuccessMessage}</p>
        </div>
      )}

      {/* Parameters selector and primary trigger */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-500">Select Operating Date:</span>
          <input
            type="date"
            value={reportDate}
            onChange={e => setReportDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={calculateDailyReport}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg cursor-pointer"
          >
            Re-calculate Report
          </button>
          
          <button
            onClick={handleSendReport}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" /> Send Daily Report
          </button>
        </div>
      </div>

      {/* Main Report Body Card */}
      {!isReportGenerated ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-xl">
          <div className="w-10 h-10 border-4 border-t-indigo-600 border-slate-200 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 mt-3 font-semibold font-mono">Compiling Day Ledger Data...</p>
        </div>
      ) : hasNoTransactions ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-xl text-slate-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-indigo-600 animate-bounce" />
          <p className="text-sm font-semibold text-slate-700">No transactions recorded for today</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Please register a sale, a bank deposit, or a purchase/expense on this date to compile a ledger sheet.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-md p-6 sm:p-10 space-y-8" id="daily-report-sheet">
          
          {/* Sheet Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-600" />
                <h2 className="text-lg font-display font-semibold text-slate-900 uppercase tracking-tight">Daily Closing Summary</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-semibold font-mono">Date: {reportDate}</p>
            </div>
            
            <div className="mt-2 md:mt-0 px-3 py-1 bg-indigo-50/50 border border-indigo-100 rounded text-[11px] font-bold text-indigo-700 uppercase">
              Finance Control Internal Audit
            </div>
          </div>

          {/* Three Column Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sales Outflow overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-indigo-600" /> Outward Billings
              </h3>
              
              <div className="space-y-2 font-mono text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Today's Sales Revenue:</span>
                  <span className="font-semibold text-slate-900">{formatINR(todaySales)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoices generated count:</span>
                  <span className="font-bold text-slate-800">{totalInvoicesCount}</span>
                </div>
                <div className="flex justify-between text-amber-800 font-semibold">
                  <span>Pending Customer Debt:</span>
                  <span>{formatINR(todayPendingSales)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Refunds processed:</span>
                  <span>{formatINR(todayRefunds)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-indigo-900 font-semibold">
                  <span>Outward GST Collected:</span>
                  <span>{formatINR(todayGSTCollected)}</span>
                </div>
              </div>
            </div>

            {/* Inward procurement overview */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-850 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-emerald-700" /> Procurement & Expenses
              </h3>
              
              <div className="space-y-2 font-mono text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Inventory Procurements:</span>
                  <span className="font-semibold text-slate-900">{formatINR(todayPurchases)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Overhead Expenses:</span>
                  <span className="font-semibold text-slate-900">{formatINR(todayExpenses)}</span>
                </div>

                <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-700 font-bold">
                  <span>Total Day Outflows:</span>
                  <span>{formatINR(todayPurchases + todayExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Cash and banking */}
            <div className="bg-indigo-50/20 p-4 rounded-xl border border-indigo-100 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1">
                <Activity className="w-4 h-4 text-emerald-700" /> Banking & Gateway Cash
              </h3>
              
              <div className="space-y-2 font-mono text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Gross payments received:</span>
                  <span className="font-semibold text-slate-900">{formatINR(todayPayments)}</span>
                </div>
                
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Gateway charges debited:</span>
                  <span>{formatINR(todayGatewayCharges)}</span>
                </div>

                <div className="flex justify-between border-t border-indigo-100 pt-2 text-emerald-800 font-bold">
                  <span>Net bank received today:</span>
                  <span className="text-lg">{formatINR(todayNetCash)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Detailed Lists Specific for the report day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Payment mismatches flagged today */}
            <div className="border border-neutral-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Audit: Today's Bank Mismatches ({todayMismatches.length})
              </h3>
              
              {todayMismatches.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4">✓ All payment settles matched the baseline sales perfectly today.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {todayMismatches.map(m => (
                    <div key={m.id} className="p-2.5 bg-rose-50/50 border border-rose-100 rounded text-xs flex justify-between items-center font-mono">
                      <div>
                        <p className="font-bold text-rose-900">Order Ref: {m.orderId}</p>
                        <p className="text-[10px] text-neutral-500">Customer: {m.customerName} | Mode: {m.paymentMode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-rose-800">Diff: {formatINR(m.difference)}</p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">{m.matchStatus}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock alerts today */}
            <div className="border border-slate-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1">
                <Boxes className="w-4 h-4 text-indigo-600" />
                Audit: Low Stock Items ({todayLowStock.length})
              </h3>
              
              {todayLowStock.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4">✓ No products are below minimum thresholds today.</p>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {todayLowStock.map(p => {
                    // compute closing
                    const sold = sales.filter(s => s.productCode === p.code).reduce((sum, s) => sum + s.quantity, 0);
                    const bought = expenses.filter(e => e.type === 'Purchase' && e.product === p.code).reduce((sum, e) => sum + (e.quantity || 0), 0);
                    const closing = p.openingStock + bought - sold;
                    return (
                      <div key={p.code} className="p-2.5 bg-neutral-50 border border-neutral-150 rounded text-xs flex justify-between items-center">
                        <div>
                          <p className="font-bold text-neutral-800">{p.name}</p>
                          <p className="text-[10px] font-mono text-neutral-500">Code: {p.code} | Min Req: {p.minimumStock}</p>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-rose-600">Stock: {closing}</p>
                          <p className="text-[9px] text-neutral-400 font-semibold uppercase">Restock suggested</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Daily sign-off block */}
          <div className="border-t border-neutral-200 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="text-neutral-500 leading-normal flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Prepared automatically by Finance Control. Approved for internal routing.</span>
            </div>
            
            <div className="w-44 text-right">
              <div className="border-b border-dashed border-neutral-400 mb-1"></div>
              <p className="font-semibold text-neutral-800">Accountant Sign-off</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

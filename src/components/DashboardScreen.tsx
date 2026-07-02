/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  ShoppingBag, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Scale, 
  Activity, 
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Users
} from 'lucide-react';
import { Product, SalesEntry, PaymentRecord, ExpenseRecord, Employee, PayrollEntry } from '../types';
import { formatINR } from '../utils/format';

interface DashboardProps {
  products: Product[];
  sales: SalesEntry[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  employees?: Employee[];
  payroll?: PayrollEntry[];
  onNavigate: (screen: string) => void;
}

export default function DashboardScreen({ products, sales, payments, expenses, employees, payroll, onNavigate }: DashboardProps) {
  
  // Helper to compute live stock level for a product code
  const getClosingStock = (product: Product) => {
    const soldQty = sales
      .filter(s => s.productCode === product.code)
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const purchasedQty = expenses
      .filter(e => e.type === 'Purchase' && e.product === product.code)
      .reduce((sum, e) => sum + (e.quantity || 0), 0);

    return product.openingStock + purchasedQty - soldQty;
  };

  // 1. Total Sales (aggregate of all sales entry total values)
  const totalSalesVal = sales.reduce((sum, s) => sum + s.totalSales, 0);

  // 2. Payment Received (gross amount received in logged payments)
  const totalPaymentReceived = payments.reduce((sum, p) => sum + p.grossAmount, 0);

  // 3. Pending Payments (Calculated per order based on payments logged)
  let pendingPaymentsVal = 0;
  let unpaidInvoicesCount = 0;
  
  sales.forEach(sale => {
    const totalPaymentsForOrder = payments
      .filter(p => p.orderId === sale.orderId)
      .reduce((sum, p) => sum + p.grossAmount, 0);
      
    if (totalPaymentsForOrder < sale.totalSales) {
      pendingPaymentsVal += (sale.totalSales - totalPaymentsForOrder);
      unpaidInvoicesCount++;
    }
  });

  // 4. Total Purchases (expenses marked as 'Purchase')
  const totalPurchasesVal = expenses
    .filter(e => e.type === 'Purchase')
    .reduce((sum, e) => sum + e.totalAmount, 0);

  // Payroll Calculations
  const paidPayrollVal = (payroll || []).reduce((sum, p) => {
    if (p.paymentStatus === 'Paid') return sum + p.netSalary;
    if (p.paymentStatus === 'Partial') return sum + (p.netSalary * 0.5);
    return sum;
  }, 0);

  const payrollPayableVal = (payroll || []).reduce((sum, p) => {
    if (p.paymentStatus === 'Pending') return sum + p.netSalary;
    if (p.paymentStatus === 'Partial') return sum + (p.netSalary * 0.5);
    return sum;
  }, 0);

  // 5. Total Expenses (non-Purchase expenses including paid payroll)
  const totalExpensesVal = expenses
    .filter(e => e.type !== 'Purchase')
    .reduce((sum, e) => sum + e.totalAmount, 0) + paidPayrollVal;

  // 6. Gateway Charges (from payments logged)
  const totalGatewayCharges = payments.reduce((sum, p) => sum + p.gatewayCharges, 0);

  // 7. Net Cash Received (gross amount - gateway charges)
  const netCashReceived = totalPaymentReceived - totalGatewayCharges;

  // 8. GST Payable (Output GST - Input GST)
  const totalOutputGST = sales.reduce((sum, s) => sum + s.gstAmount, 0);
  const totalInputGST = expenses.reduce((sum, e) => sum + e.gstAmount, 0);
  const gstPayable = totalOutputGST - totalInputGST;

  // 9. Estimated Profit
  // Profit = Total Sales (Revenue) - Discounts - Cost of Goods Sold (for quantities sold) - Operating Expenses - Gateway Charges
  // Taxable Sales Revenue = Sum of Taxable values
  const totalTaxableSales = sales.reduce((sum, s) => {
    const salesAmt = s.quantity * s.rate;
    return sum + (salesAmt - s.discount);
  }, 0);

  // COGS = sum of (quantity sold * purchase cost of that product)
  const costOfGoodsSold = sales.reduce((sum, s) => {
    const product = products.find(p => p.code === s.productCode);
    const cost = product ? product.purchaseCost : 0;
    return sum + (s.quantity * cost);
  }, 0);

  // Operating Expenses = sum of (non-Purchase expenses taxable amount) + paid payroll
  // Taxable amount of expense = totalAmount - gstAmount
  const operatingExpensesExclTax = expenses
    .filter(e => e.type !== 'Purchase')
    .reduce((sum, e) => sum + (e.totalAmount - e.gstAmount), 0) + paidPayrollVal;

  const estimatedProfit = totalTaxableSales - costOfGoodsSold - operatingExpensesExclTax - totalGatewayCharges;

  // 10. Low Stock Alerts
  const lowStockProducts = products.filter(p => {
    const closing = getClosingStock(p);
    return closing <= p.minimumStock;
  });
  const lowStockAlertsCount = lowStockProducts.length;

  // Recent sales for display
  const recentSales = [...sales].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  
  // Payment mismatches
  const mismatches = payments.filter(p => p.matchStatus === 'Unmatched' || p.matchStatus === 'Missing Order');

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-screen">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 p-6 rounded-xl shadow-xs">
        <div>
          <h1 className="text-2xl font-display font-semibold tracking-tight text-slate-900" id="welcome-title">
            Rastafare Workspace
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time business health, compliance check, and automated invoice routing.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-3">
          <button 
            id="quick-sales-btn"
            onClick={() => onNavigate('sales')}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            + New Sale
          </button>
          <button 
            id="quick-expense-btn"
            onClick={() => onNavigate('expenses')}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="metrics-grid">
        {/* Total Sales */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-total-sales">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Outward Sales</span>
            <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-slate-900">{formatINR(totalSalesVal)}</span>
            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Gross Revenue
            </div>
          </div>
        </div>

        {/* Payments Received */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-payments-received">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Received</span>
            <div className="p-1.5 bg-emerald-50 rounded-md text-emerald-700">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-slate-900">{formatINR(totalPaymentReceived)}</span>
            <div className="text-xs text-slate-500 mt-1">Gross cash logged</div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-pending-payments">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payments</span>
            <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-amber-600">{formatINR(pendingPaymentsVal)}</span>
            <div className="text-xs text-slate-500 mt-1">Unpaid customer invoices</div>
            {totalSalesVal > totalPaymentReceived && (
              <div className="text-[10px] text-rose-600 font-semibold mt-1.5 bg-rose-50 p-1.5 rounded border border-rose-100 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Sales recorded but payment not logged
              </div>
            )}
          </div>
        </div>

        {/* Total Purchases */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-total-purchases">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <div className="p-1.5 bg-indigo-50 rounded-md text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-slate-900">{formatINR(totalPurchasesVal)}</span>
            <div className="text-xs text-slate-500 mt-1">Raw materials & inventory</div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-total-expenses">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating Expenses</span>
            <div className="p-1.5 bg-rose-50 rounded-md text-rose-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-slate-900">{formatINR(totalExpensesVal)}</span>
            <div className="text-xs text-rose-600 font-medium flex items-center mt-1">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> Rent, salaries, ads
            </div>
          </div>
        </div>

        {/* Payroll Payable */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-payroll-payable">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Payable</span>
            <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl font-mono font-bold ${payrollPayableVal > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{formatINR(payrollPayableVal)}</span>
            <div className="text-xs text-slate-500 mt-1">Salaries, advances, deductions</div>
          </div>
        </div>

        {/* Gateway Charges */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-gateway-charges">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gateway Charges</span>
            <div className="p-1.5 bg-slate-100 rounded-md text-slate-700">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-slate-700">{formatINR(totalGatewayCharges)}</span>
            <div className="text-xs text-slate-500 mt-1">Razorpay & card processing</div>
          </div>
        </div>

        {/* Net Cash Received */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-net-cash">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Cash Received</span>
            <div className="p-1.5 bg-emerald-50 rounded-md text-emerald-800">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl font-mono font-bold text-emerald-900">{formatINR(netCashReceived)}</span>
            <div className="text-xs text-emerald-700 font-medium mt-1">Received in Bank</div>
          </div>
        </div>

        {/* GST Payable */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-gst-payable">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net GST Payable</span>
            <div className="p-1.5 bg-amber-50 rounded-md text-amber-800">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl font-mono font-bold ${gstPayable >= 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
              {formatINR(gstPayable)}
            </span>
            <div className="text-xs text-slate-500 mt-1">Output GST minus ITC</div>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-est-profit">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">Estimated Profit</span>
            <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl font-mono font-bold ${estimatedProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
              {formatINR(estimatedProfit)}
            </span>
            <div className="text-xs text-indigo-800 font-medium mt-1">Taxable profit estimate</div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`border p-5 rounded-xl shadow-xs flex flex-col justify-between ${lowStockAlertsCount > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-white border-slate-200'}`} id="metric-stock-alerts">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Alerts</span>
            <div className={`p-1.5 rounded-md ${lowStockAlertsCount > 0 ? 'bg-rose-100 text-rose-800' : 'bg-indigo-50 text-indigo-700'}`}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl font-mono font-bold ${lowStockAlertsCount > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {lowStockAlertsCount} Items
            </span>
            <div className="text-xs text-slate-500 mt-1">Below minimum threshold</div>
          </div>
        </div>

        {/* Invoices Not Paid */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs flex flex-col justify-between" id="metric-invoices-not-paid">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoices Not Paid</span>
            <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-xl font-mono font-bold ${unpaidInvoicesCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {unpaidInvoicesCount} <span className="text-sm font-sans font-medium text-slate-500">Sales</span>
            </span>
            <div className="text-xs text-slate-500 mt-1">Lacking full payment</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Stock Alerts & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Low Stock Details & Alerts */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-display font-semibold text-base text-slate-900 flex items-center">
              <Boxes className="w-5 h-5 mr-2 text-indigo-600" />
              Critical Low Stock Warnings
            </h2>
            <button 
              id="view-all-stock"
              onClick={() => onNavigate('products')}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Manage Stock
            </button>
          </div>

          {products.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No products added yet. Add your first product to begin tracking stock.
            </div>
          ) : lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              ✓ All product inventory levels are healthy!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2">Code</th>
                    <th className="py-2">Product Name</th>
                    <th className="py-2 text-right">Current Stock</th>
                    <th className="py-2 text-right">Min Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockProducts.map(p => {
                    const current = getClosingStock(p);
                    return (
                      <tr key={p.code} className="hover:bg-slate-50">
                        <td className="py-2.5 font-mono text-slate-400 font-medium">{p.code}</td>
                        <td className="py-2.5 font-semibold text-slate-800">{p.name}</td>
                        <td className="py-2.5 text-right font-bold text-rose-600 font-mono">{current}</td>
                        <td className="py-2.5 text-right font-mono text-slate-500">{p.minimumStock}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Payment Tracker Warnings */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-display font-semibold text-base text-slate-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
              Payment Mismatches & Mappings
            </h2>
            <button 
              id="view-all-payments"
              onClick={() => onNavigate('payments')}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
            >
              Verify Receipts
            </button>
          </div>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No payments added yet.
            </div>
          ) : mismatches.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              ✓ No gateway or bank receipt mismatches flagged!
            </div>
          ) : (
            <div className="space-y-2">
              {mismatches.map(m => (
                <div key={m.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg flex justify-between items-start text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <span>Order ID: {m.orderId}</span>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-normal text-[10px]">
                        {m.matchStatus}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">Customer: {m.customerName}</p>
                    <p className="text-slate-400 font-mono text-[10px]">Bank Logged: {m.date}</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-semibold text-amber-900">{formatINR(m.grossAmount)}</p>
                    <p className="text-xs text-rose-600 mt-0.5 font-semibold">
                      Diff: {formatINR(m.difference)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outward Sales Timeline preview */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="font-display font-semibold text-base text-slate-900">
            Recent Outward Sales Entries
          </h2>
          <button 
            id="view-all-sales"
            onClick={() => onNavigate('sales')}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            All Sales Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Order ID</th>
                <th className="py-2.5">Customer Name</th>
                <th className="py-2.5">State</th>
                <th className="py-2.5 text-right">Taxable Amt</th>
                <th className="py-2.5 text-right">GST Collected</th>
                <th className="py-2.5 text-right">Total Invoice</th>
                <th className="py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                    No sales recorded yet. Add your first sale to generate invoice and GST summary.
                  </td>
                </tr>
              ) : (
                recentSales.map(s => {
                  const salesAmt = s.quantity * s.rate;
                  const taxable = salesAmt - s.discount + s.shippingCharge;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="py-3 text-slate-500 font-mono">{s.date}</td>
                      <td className="py-3 font-semibold text-slate-800 font-mono">{s.orderId}</td>
                      <td className="py-3 text-slate-800 font-semibold">{s.customerName}</td>
                      <td className="py-3 text-slate-500">{s.customerState}</td>
                      <td className="py-3 text-right font-mono">{formatINR(taxable)}</td>
                      <td className="py-3 text-right font-mono text-amber-700">{formatINR(s.gstAmount)}</td>
                      <td className="py-3 text-right font-semibold font-mono text-slate-900">{formatINR(s.totalSales)}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          s.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {s.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

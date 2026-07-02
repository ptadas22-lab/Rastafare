/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SalesEntry, ExpenseRecord, CompanyProfile } from '../types';
import { formatINR } from '../utils/format';
import { Scale, Calendar, ShieldAlert, TrendingUp, TrendingDown, ArrowRightLeft, Clock } from 'lucide-react';

interface GSTSummaryScreenProps {
  sales: SalesEntry[];
  expenses: ExpenseRecord[];
  companyProfile: CompanyProfile;
}

export default function GSTSummaryScreen({
  sales,
  expenses,
  companyProfile
}: GSTSummaryScreenProps) {
  
  // Filter settings
  const [dateFilter, setDateFilter] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('This Month');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first of current month
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Determine date ranges
  const filterByDate = (dateStr: string) => {
    const itemDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilter === 'Today') {
      const itemD = new Date(dateStr);
      itemD.setHours(0,0,0,0);
      return itemD.getTime() === today.getTime();
    }
    
    if (dateFilter === 'This Week') {
      // Last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0,0,0,0);
      return itemDate >= sevenDaysAgo && itemDate <= new Date();
    }
    
    if (dateFilter === 'This Month') {
      // First to last of current month
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
    }
    
    if (dateFilter === 'Custom') {
      const from = new Date(fromDate);
      from.setHours(0,0,0,0);
      const to = new Date(toDate);
      to.setHours(23,59,59,999);
      return itemDate >= from && itemDate <= to;
    }

    return true;
  };

  // Helper to split GST for outward sales based on customer state
  const getOutwardGSTDetails = (s: SalesEntry) => {
    const isLocal = s.customerState.toLowerCase().trim() === companyProfile.businessState.toLowerCase().trim();
    const gst = s.gstAmount;
    
    const cgst = isLocal ? gst / 2 : 0;
    const sgst = isLocal ? gst / 2 : 0;
    const igst = isLocal ? 0 : gst;

    const salesAmt = s.quantity * s.rate;
    const taxableValue = salesAmt - s.discount;

    return { taxableValue, cgst, sgst, igst, totalGst: gst };
  };

  // Helper to split Input GST for purchases/expenses
  // Assume local if supplier is Bandra, Apex, EcoPack, HDFC, Warehouse or if rent/salaries/bank fees (intrastate standard)
  const getInwardGSTDetails = (e: ExpenseRecord) => {
    const name = e.supplierParty.toLowerCase();
    const isInterstate = name.includes('himalayan') || name.includes('adwords') || name.includes('google');
    const isLocal = !isInterstate;
    const gst = e.gstAmount;
    
    const cgst = isLocal ? gst / 2 : 0;
    const sgst = isLocal ? gst / 2 : 0;
    const igst = isLocal ? 0 : gst;
    
    const taxableValue = e.totalAmount - e.gstAmount;

    return { taxableValue, cgst, sgst, igst, totalGst: gst };
  };

  // Filter lists
  const activeSales = sales.filter(s => filterByDate(s.date) && s.paymentStatus !== 'Refunded');
  const activeRefunds = sales.filter(s => filterByDate(s.date) && s.paymentStatus === 'Refunded');
  const activeExpenses = expenses.filter(e => filterByDate(e.date));

  // Compute aggregated outward values
  let totalTaxableOutward = 0;
  let outputCGST = 0;
  let outputSGST = 0;
  let outputIGST = 0;
  let totalOutputGST = 0;

  activeSales.forEach(s => {
    const { taxableValue, cgst, sgst, igst, totalGst } = getOutwardGSTDetails(s);
    totalTaxableOutward += taxableValue;
    outputCGST += cgst;
    outputSGST += sgst;
    outputIGST += igst;
    totalOutputGST += totalGst;
  });

  // Compute aggregated inward values (ITC)
  let totalTaxableInward = 0;
  let inputCGST = 0;
  let inputSGST = 0;
  let inputIGST = 0;
  let totalInputGST = 0;

  activeExpenses.forEach(e => {
    const { taxableValue, cgst, sgst, igst, totalGst } = getInwardGSTDetails(e);
    totalTaxableInward += taxableValue;
    inputCGST += cgst;
    inputSGST += sgst;
    inputIGST += igst;
    totalInputGST += totalGst;
  });

  // Refunds / Credit Notes logic
  const totalRefundAmount = activeRefunds.reduce((sum, r) => sum + r.totalSales, 0);
  const totalRefundGSTCredit = activeRefunds.reduce((sum, r) => sum + r.gstAmount, 0);

  // Net GST Payable = Total Output GST - Total Input GST
  const netGSTPayable = totalOutputGST - totalInputGST;

  // Month-wise aggregation (all records)
  const getMonthlyAggregate = () => {
    const monthsMap: { [key: string]: { month: string, output: number, input: number, net: number } } = {};
    
    sales.forEach(s => {
      if (s.paymentStatus === 'Refunded') return;
      // Extract YYYY-MM
      const monthStr = s.date.substring(0, 7); 
      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = { month: monthStr, output: 0, input: 0, net: 0 };
      }
      monthsMap[monthStr].output += s.gstAmount;
    });

    expenses.forEach(e => {
      const monthStr = e.date.substring(0, 7);
      if (!monthsMap[monthStr]) {
        monthsMap[monthStr] = { month: monthStr, output: 0, input: 0, net: 0 };
      }
      monthsMap[monthStr].input += e.gstAmount;
    });

    const sortedMonths = Object.values(monthsMap).sort((a, b) => b.month.localeCompare(a.month));
    return sortedMonths.map(m => {
      // format month label e.g., "Jun 2026"
      const parts = m.month.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return {
        ...m,
        label,
        net: m.output - m.input
      };
    });
  };

  const monthlySummary = getMonthlyAggregate();

  return (
    <div className="space-y-6 animate-fade-in" id="gst-summary-screen">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">GST Compliance Planner (GSTR-1 & GSTR-3B)</h1>
          <p className="text-xs text-slate-500 mt-1">Audit taxable supplies, CGST/SGST/IGST splits, and Input Tax Credits (ITC) for filing audits.</p>
        </div>
      </div>

      {/* Compliance Warning Card (Required Disclaimer) */}
      <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl flex items-start gap-3" id="gst-disclaimer">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <p className="font-bold uppercase tracking-wider text-amber-800">Compliance Audit Advisory</p>
          <p className="font-medium leading-relaxed">
            This GST compliance dashboard is for internal estimation, credit verification, and review only. All outward tax collections and Input Tax Credit (ITC) lines should be cross-verified on the official GSTN Portal before submitting GSTR-1, GSTR-3B, or GSTR-9 returns.
          </p>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['Today', 'This Week', 'This Month', 'Custom'] as const).map(option => (
            <button
              key={option}
              onClick={() => setDateFilter(option)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                dateFilter === option 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {dateFilter === 'Custom' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-neutral-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-2 py-1 border border-neutral-300 rounded font-mono"
            />
            <span className="font-semibold text-neutral-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-2 py-1 border border-neutral-300 rounded font-mono"
            />
          </div>
        )}

        <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Filtered: <span className="text-slate-900 font-bold uppercase">{dateFilter === 'Custom' ? 'Custom Range' : dateFilter}</span>
        </div>
      </div>

      {/* Outward vs Inward GST Core Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Outward Liability Summary */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <h2 className="font-display font-semibold text-base text-neutral-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Outward Supplies (Liability - GSTR-1)
            </h2>
            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-bold uppercase font-mono">
              {activeSales.length} Invoices
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Total Taxable Value</span>
              <span className="text-lg font-mono font-bold text-neutral-900 mt-1 block">{formatINR(totalTaxableOutward)}</span>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider block">Total Output GST</span>
              <span className="text-lg font-mono font-bold text-amber-900 mt-1 block">{formatINR(totalOutputGST)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Output Split Breakdown</span>
            
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Output CGST (Central Tax):</span>
                <span>{formatINR(outputCGST)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Output SGST (State Tax):</span>
                <span>{formatINR(outputSGST)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Output IGST (Integrated Tax):</span>
                <span>{formatINR(outputIGST)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inward Purchases Summary (ITC) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <h2 className="font-display font-semibold text-base text-neutral-900 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-700" />
              Inward Supplies (Input Credit - GSTR-3B)
            </h2>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold uppercase font-mono">
              {activeExpenses.length} Records
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block">Total Taxable Purchases</span>
              <span className="text-lg font-mono font-bold text-neutral-900 mt-1 block">{formatINR(totalTaxableInward)}</span>
            </div>

            <div className="bg-[#f0f9f1] p-3 rounded-lg border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-semibold uppercase tracking-wider block">Total Input Tax Credit</span>
              <span className="text-lg font-mono font-bold text-emerald-800 mt-1 block">{formatINR(totalInputGST)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Input Credit Split Breakdown</span>
            
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Input CGST (Central Tax):</span>
                <span>{formatINR(inputCGST)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Input SGST (State Tax):</span>
                <span>{formatINR(inputSGST)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Input IGST (Integrated Tax):</span>
                <span>{formatINR(inputIGST)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Liability & Credit Notes Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Grand Net Liability */}
        <div className="bg-indigo-50/20 border border-indigo-100 rounded-xl p-5 space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-700" />
            <h3 className="font-display font-semibold text-sm text-slate-900 uppercase tracking-wider">Net Liability Computation</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 font-mono">
            <div className="text-xs">
              <p className="text-slate-400">Total Output (A)</p>
              <p className="text-base font-bold text-slate-900 mt-1">{formatINR(totalOutputGST)}</p>
            </div>
            
            <div className="text-xs">
              <p className="text-slate-400">Total Input ITC (B)</p>
              <p className="text-base font-bold text-emerald-700 mt-1">{formatINR(totalInputGST)}</p>
            </div>

            <div className="text-xs bg-white border border-slate-200 p-2.5 rounded-lg">
              <p className="text-indigo-800 font-semibold">Net GST Payable (A - B)</p>
              <p className={`text-lg font-bold mt-1 ${netGSTPayable >= 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {formatINR(netGSTPayable)}
              </p>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 italic leading-normal border-t border-slate-200 pt-2">
            {netGSTPayable >= 0 ? (
              <span>⚠️ Cash ledger deposit of <strong>{formatINR(netGSTPayable)}</strong> is required to settle this period's GSTR-3B.</span>
            ) : (
              <span className="text-emerald-700">✓ Balance credit of <strong>{formatINR(Math.abs(netGSTPayable))}</strong> will roll over to Electronic Credit Ledger for next tax period.</span>
            )}
          </div>
        </div>

        {/* Refunds / Credit Notes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <h3 className="font-display font-semibold text-sm text-slate-800">Refunds & Credit Notes</h3>
          </div>

          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Credit Note Count:</span>
              <span className="font-bold text-rose-600">{activeRefunds.length}</span>
            </div>
            
            <div className="flex justify-between text-slate-500">
              <span>Gross Refunded:</span>
              <span className="font-semibold text-rose-600">{formatINR(totalRefundAmount)}</span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>GST Adjusted Credit:</span>
              <span className="font-semibold text-slate-900">{formatINR(totalRefundGSTCredit)}</span>
            </div>
          </div>
          
          <p className="text-[9px] text-slate-400 italic leading-relaxed border-t border-slate-100 pt-1.5">
            Credit notes decrease your overall tax liability. Form GSTR-1 Table 9B requires reporting these adjustments.
          </p>
        </div>
      </div>

      {/* Month-wise Filing aggregate timeline */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <h3 className="font-display font-semibold text-sm text-slate-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-600" />
          Compliance Chronology (Month-by-Month Outward vs Inward Tax Ledger)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="p-2.5">Filing Period</th>
                <th className="p-2.5 text-right">Output Tax Collected (Outward)</th>
                <th className="p-2.5 text-right">Input Tax Credit Allowed (Inward)</th>
                <th className="p-2.5 text-right">Ledger Liability / Carry Forward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono">
              {monthlySummary.map(m => (
                <tr key={m.month} className="hover:bg-slate-50/50">
                  <td className="p-2.5 font-sans font-bold text-slate-800">{m.label}</td>
                  <td className="p-2.5 text-right text-amber-800 font-semibold">{formatINR(m.output)}</td>
                  <td className="p-2.5 text-right text-emerald-800 font-semibold">{formatINR(m.input)}</td>
                  <td className={`p-2.5 text-right font-extrabold ${m.net >= 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {formatINR(m.net)} {m.net < 0 && '(Carryover)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

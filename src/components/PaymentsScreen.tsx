/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PaymentRecord, SalesEntry } from '../types';
import { formatINR } from '../utils/format';
import { CheckCircle2, AlertTriangle, HelpCircle, PlusCircle, Search, Trash2, Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface PaymentsScreenProps {
  payments: PaymentRecord[];
  sales: SalesEntry[];
  onAddPayment: (payment: PaymentRecord) => void;
  onDeletePayment: (id: string) => void;
}

export default function PaymentsScreen({
  payments,
  sales,
  onAddPayment,
  onDeletePayment
}: PaymentsScreenProps) {
  
  // Summary Metrics
  const totalBanked = payments.reduce((sum, p) => sum + p.grossAmount, 0);
  const totalGatewayFees = payments.reduce((sum, p) => sum + (p.gatewayCharges || 0), 0);
  const totalNetSettled = payments.reduce((sum, p) => sum + (p.netReceived || 0), 0);
  const matchedAmount = payments.filter(p => p.matchStatus === 'Matched').reduce((sum, p) => sum + p.grossAmount, 0);
  const unmatchedAmount = payments.filter(p => p.matchStatus !== 'Matched').reduce((sum, p) => sum + p.grossAmount, 0);
  const mismatchCount = payments.filter(p => p.matchStatus !== 'Matched').length;

  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formOrderId, setFormOrderId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentRecord['paymentMode']>('UPI');
  const [formGrossAmount, setFormGrossAmount] = useState(0);
  const [formGatewayCharges, setFormGatewayCharges] = useState(0);
  const [formBankReceivedDate, setFormBankReceivedDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [formError, setFormError] = useState('');

  // Import states
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Live matching preview feedback
  const [matchingSale, setMatchingSale] = useState<SalesEntry | null>(null);
  const [liveSaleAmount, setLiveSaleAmount] = useState(0);
  const [liveDifference, setLiveDifference] = useState(0);
  const [liveMatchStatus, setLiveMatchStatus] = useState<PaymentRecord['matchStatus']>('Missing Order');

  // Effect to lookup Order ID and prefill customer info & calculate reconciliation live
  useEffect(() => {
    if (!formOrderId.trim()) {
      setMatchingSale(null);
      setLiveSaleAmount(0);
      setLiveDifference(formGrossAmount);
      setLiveMatchStatus('Missing Order');
      return;
    }

    const sale = sales.find(s => s.orderId.toUpperCase() === formOrderId.trim().toUpperCase());
    if (sale) {
      setMatchingSale(sale);
      setFormCustomerName(sale.customerName); // prefill customer name!
      setLiveSaleAmount(sale.totalSales);
      
      const diff = formGrossAmount - sale.totalSales;
      setLiveDifference(diff);
      
      // Matched if Gross equals Sales precisely (within 0.1 rounding margin)
      if (Math.abs(diff) < 0.1) {
        setLiveMatchStatus('Matched');
      } else if (diff < -0.1) {
        setLiveMatchStatus('Partial');
      } else {
        setLiveMatchStatus('Excess');
      }
    } else {
      setMatchingSale(null);
      setLiveSaleAmount(0);
      setLiveDifference(formGrossAmount);
      setLiveMatchStatus('Missing Order');
    }
  }, [formOrderId, formGrossAmount, sales]);

  // Import Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const parsedData = data.map((row: any) => {
        const getVal = (keys: string[]) => {
          for (const key of keys) {
            if (row[key] !== undefined) return row[key];
          }
          return undefined;
        };

        const rDate = getVal(['Deposit Date', 'Date', 'Payment Date', 'Transaction Date']);
        const rOrderId = getVal(['Order ID', 'Order No', 'Order Number', 'Receipt No', 'Invoice No']);
        const rCustName = getVal(['Customer Name', 'Buyer Name', 'Client Name', 'Customer']);
        const rMode = getVal(['Payment Mode', 'Mode', 'Method', 'Payment Method']) || 'Other';
        const rGross = Number(getVal(['Gross Settled', 'Amount', 'Gross Amount', 'Gross Payment'])) || 0;
        const rFees = Number(getVal(['Gateway Fees', 'Fees', 'Charges', 'Gateway Charges', 'MDR'])) || 0;
        const rSettleDate = getVal(['Settlement Date', 'Bank Date', 'Credit Date']);
        const rTxnId = getVal(['Transaction ID', 'UTR', 'Ref No', 'Payment ID']);
        const rRemarks = getVal(['Remarks']);

        const netSettle = rGross - rFees;
        let matchStatus = 'Missing Order';
        let mismatchReason = 'Missing Order ID';
        let diff = rGross;
        let saleAmt = 0;
        let matchedSale = null;

        if (rOrderId) {
           matchedSale = sales.find(s => s.orderId.toUpperCase() === String(rOrderId).toUpperCase().trim());
           if (matchedSale) {
              saleAmt = matchedSale.totalSales;
              diff = rGross - saleAmt;
              if (Math.abs(diff) < 0.1) {
                 matchStatus = 'Matched';
                 mismatchReason = 'Ready to import';
              } else if (diff < -0.1) {
                 matchStatus = 'Partial';
                 mismatchReason = 'Amount less than invoice value';
              } else {
                 matchStatus = 'Excess';
                 mismatchReason = 'Amount greater than invoice value';
              }
           } else {
              matchStatus = 'Missing Order';
              mismatchReason = 'No matching order found';
           }
        } else {
           // Soft match
           matchedSale = sales.find(s => 
             s.customerName.toLowerCase() === String(rCustName || '').toLowerCase().trim() && 
             Math.abs(s.totalSales - rGross) < 0.1
           );
           if (matchedSale) {
              saleAmt = matchedSale.totalSales;
              diff = rGross - saleAmt;
              matchStatus = 'Matched';
              mismatchReason = 'Possible customer/date match';
           } else {
              matchStatus = 'Unmatched';
              mismatchReason = 'No matching order found';
           }
        }

        if (rFees > 0 && matchStatus === 'Matched') {
           mismatchReason = 'Gateway fee present';
        }
        
        // Duplicate check
        if (rTxnId && payments.some(p => p.transactionId === String(rTxnId))) {
           matchStatus = 'Unmatched';
           mismatchReason = 'Duplicate Transaction ID';
        }

        return {
          date: rDate || new Date().toISOString().split('T')[0],
          orderId: matchedSale ? matchedSale.orderId : String(rOrderId || ''),
          customerName: String(rCustName || (matchedSale ? matchedSale.customerName : '')),
          paymentMode: String(rMode),
          grossAmount: rGross,
          gatewayCharges: rFees,
          netReceived: netSettle,
          bankReceivedDate: rSettleDate || (rDate || new Date().toISOString().split('T')[0]),
          saleAmount: saleAmt,
          difference: diff,
          matchStatus: matchStatus,
          mismatchReason: mismatchReason,
          transactionId: rTxnId ? String(rTxnId) : undefined,
          remarks: rRemarks ? String(rRemarks) : undefined
        };
      });

      setImportPreviewData(parsedData);
      setIsImportPreviewOpen(true);
      setImportSuccessMsg('');
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportPayments = () => {
    const validRows = importPreviewData.filter(r => r.matchStatus === 'Matched' || r.matchStatus === 'Partial');
    validRows.forEach((r, idx) => {
      onAddPayment({
        id: 'P-IMP-' + Date.now() + idx,
        date: r.date,
        orderId: r.orderId,
        customerName: r.customerName,
        paymentMode: r.paymentMode as any,
        grossAmount: r.grossAmount,
        gatewayCharges: r.gatewayCharges,
        netReceived: r.netReceived,
        bankReceivedDate: r.bankReceivedDate,
        saleAmount: r.saleAmount,
        difference: r.difference,
        matchStatus: r.matchStatus as any,
        transactionId: r.transactionId,
        remarks: r.remarks
      });
    });
    setImportSuccessMsg('Reconciliation records imported successfully');
    setIsImportPreviewOpen(false);
    setTimeout(() => setImportSuccessMsg(''), 3000);
  };

  const downloadReconciliationTemplate = () => {
    const headers = [
      'Deposit Date', 'Order ID', 'Customer Name', 'Payment Mode', 'Gross Settled', 
      'Gateway Fees', 'Net Bank Settlement', 'Settlement Date', 'Transaction ID', 'Remarks'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reconciliation_Template");
    XLSX.writeFile(wb, "Bank_Reconciliation_Template.csv");
  };

  // Submit new payment
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formOrderId.trim()) {
      setFormError('Order ID is required to match with sales.');
      return;
    }
    if (!formCustomerName.trim()) {
      setFormError('Customer Name is required.');
      return;
    }
    if (formGrossAmount <= 0) {
      setFormError('Gross Amount received must be positive.');
      return;
    }

    const netReceived = formGrossAmount - formGatewayCharges;
    const diff = formGrossAmount - liveSaleAmount;
    
    let matchStatus: PaymentRecord['matchStatus'] = 'Missing Order';
    if (matchingSale) {
      if (Math.abs(diff) < 0.1) matchStatus = 'Matched';
      else if (diff < -0.1) matchStatus = 'Partial';
      else matchStatus = 'Excess';
    }

    const payload: PaymentRecord = {
      id: 'P-' + Date.now(),
      date: formDate,
      orderId: formOrderId.trim().toUpperCase(),
      customerName: formCustomerName.trim(),
      paymentMode: formPaymentMode,
      grossAmount: Number(formGrossAmount),
      gatewayCharges: Number(formGatewayCharges),
      netReceived: Number(netReceived),
      bankReceivedDate: formBankReceivedDate,
      saleAmount: liveSaleAmount,
      difference: Number(diff),
      matchStatus
    };

    onAddPayment(payload);

    // Reset Form
    setFormOrderId('');
    setFormCustomerName('');
    setFormGrossAmount(0);
    setFormGatewayCharges(0);
    setFormError('');
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || p.matchStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="payments-screen">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Gateway & Bank Reconciliation</h1>
          <p className="text-xs text-slate-500 mt-1">Audit payment deposits from payment gateways against registered customer orders to isolate mismatches.</p>
        </div>
      </div>

      {importSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-semibold">{importSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Banked</div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">{formatINR(totalBanked)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gateway Fees</div>
          <div className="text-lg font-mono font-bold text-rose-600 mt-1">{formatINR(totalGatewayFees)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Settled</div>
          <div className="text-lg font-mono font-bold text-indigo-600 mt-1">{formatINR(totalNetSettled)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Matched Amount</div>
          <div className="text-lg font-mono font-bold text-emerald-600 mt-1">{formatINR(matchedAmount)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unmatched Amount</div>
          <div className="text-lg font-mono font-bold text-amber-600 mt-1">{formatINR(unmatchedAmount)}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mismatch Count</div>
          <div className="text-lg font-mono font-bold text-slate-900 mt-1">{mismatchCount}</div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="font-display font-semibold text-slate-900 text-base">Import Bank / Gateway Statement</h2>
            <p className="text-xs text-slate-500 mt-1">Upload Razorpay, UPI, bank statement, or payment gateway Excel/CSV and auto-match payments with outward sales orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              Upload Bank / Gateway Excel
              <input type="file" accept=".xlsx, .csv" className="hidden" onChange={handleFileUpload} />
            </label>
            <button
              onClick={downloadReconciliationTemplate}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-display font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                  Preview Reconciliation
                </h2>
                <p className="text-xs text-slate-500 mt-1">Only Matched and Partial records will be imported.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsImportPreviewOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold text-sm hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportPayments}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  Import Matched Payments
                </button>
              </div>
            </div>
            <div className="overflow-auto p-0 flex-1">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Deposit Date</th>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Gross Settled</th>
                    <th className="p-3 text-right">Gateway Fees</th>
                    <th className="p-3 text-right">Net Bank Settled</th>
                    <th className="p-3 text-right">Sale Amount</th>
                    <th className="p-3 text-right">Difference</th>
                    <th className="p-3 text-center">Match Status</th>
                    <th className="p-3">Mismatch Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importPreviewData.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-slate-600">{r.date}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{r.orderId}</td>
                      <td className="p-3 text-slate-700 font-medium">{r.customerName}</td>
                      <td className="p-3 text-slate-600">{r.paymentMode}</td>
                      <td className="p-3 text-right font-mono text-slate-900">{formatINR(r.grossAmount)}</td>
                      <td className="p-3 text-right font-mono text-rose-600">{formatINR(r.gatewayCharges)}</td>
                      <td className="p-3 text-right font-mono text-indigo-700 font-bold">{formatINR(r.netReceived)}</td>
                      <td className="p-3 text-right font-mono text-slate-700">{formatINR(r.saleAmount)}</td>
                      <td className={`p-3 text-right font-mono font-bold ${r.difference === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.difference === 0 ? '₹0.00' : (r.difference > 0 ? '+' : '') + formatINR(r.difference)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.matchStatus === 'Matched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          r.matchStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          r.matchStatus === 'Excess' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}>
                          {r.matchStatus}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[10px]">{r.mismatchReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-1" id="payment-form-card">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sticky top-6">
            <h2 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
              Record Bank / Gateway Deposit
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Deposit Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Target Order ID *</label>
                <input
                  type="text"
                  placeholder="e.g. ORD-2026-1001"
                  value={formOrderId}
                  onChange={e => setFormOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="Will auto-fill if Order exists"
                  value={formCustomerName}
                  onChange={e => setFormCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Mode</label>
                  <select
                    value={formPaymentMode}
                    onChange={e => setFormPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Razorpay">Razorpay Gateway</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Settlement Date</label>
                  <input
                    type="date"
                    value={formBankReceivedDate}
                    onChange={e => setFormBankReceivedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gross Settled (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1957.76"
                    value={formGrossAmount || ''}
                    onChange={e => setFormGrossAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gateway Fees (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="39.16"
                    value={formGatewayCharges || ''}
                    onChange={e => setFormGatewayCharges(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Real-time Matching Preview widget */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1.5">
                <div className="flex justify-between font-medium text-slate-500">
                  <span>Net Bank Settlement:</span>
                  <span className="font-mono text-slate-900 font-semibold">{formatINR(formGrossAmount - formGatewayCharges)}</span>
                </div>
                
                <div className="border-t border-slate-200 pt-1.5 space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>Baseline Order Value:</span>
                    <span className="font-mono text-slate-900">
                      {matchingSale ? formatINR(liveSaleAmount) : 'No matching order'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between font-bold">
                    <span>Reconciliation Delta:</span>
                    <span className={`font-mono ${liveDifference === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {formatINR(liveDifference)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-1 flex flex-col items-center gap-1">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    liveMatchStatus === 'Matched' ? 'bg-emerald-100 text-emerald-800' :
                    liveMatchStatus === 'Partial' ? 'bg-amber-100 text-amber-800' :
                    liveMatchStatus === 'Excess' ? 'bg-rose-100 text-rose-800' :
                    liveMatchStatus === 'Unmatched' ? 'bg-orange-100 text-orange-800' :
                    'bg-neutral-150 text-neutral-700'
                  }`}>
                    Match Preview: {liveMatchStatus}
                  </span>
                  {liveMatchStatus === 'Excess' && (
                    <span className="text-[9px] text-rose-600 font-bold animate-pulse">Overpayment detected. Review before posting.</span>
                  )}
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log Reconciliation
              </button>
            </form>
          </div>
        </div>

        {/* Payments Table Panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search matching order ID or customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Match Statuses</option>
              <option value="Matched">✓ Matched Only</option>
              <option value="Unmatched">⚠️ Unmatched Delta Only</option>
              <option value="Missing Order">❓ Missing Order Only</option>
            </select>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Audit Details</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Gross Banked</th>
                    <th className="p-3 text-right">Gateway Fees</th>
                    <th className="p-3 text-right">Net Received</th>
                    <th className="p-3 text-right">Order Baseline</th>
                    <th className="p-3 text-right">Match Delta</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-sm">
                        No payments found or registered.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 text-xs">{p.customerName}</div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5 space-y-0.5">
                            <p className="font-bold text-indigo-600">Order: {p.orderId}</p>
                            <p>Logged: {p.date}</p>
                            <p>Settle Date: {p.bankReceivedDate}</p>
                          </div>
                        </td>
                        <td className="p-3 font-medium text-neutral-700">
                          {p.paymentMode}
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-800">
                          {formatINR(p.grossAmount)}
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-500">
                          {formatINR(p.gatewayCharges)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-neutral-800">
                          {formatINR(p.netReceived)}
                        </td>
                        <td className="p-3 text-right font-mono text-neutral-600">
                          {p.saleAmount > 0 ? formatINR(p.saleAmount) : '—'}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${
                          p.matchStatus === 'Matched' ? 'text-emerald-700' : 'text-rose-600'
                        }`}>
                          {p.difference === 0 ? '₹ 0.00' : (p.difference > 0 ? '+' : '') + formatINR(p.difference)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.matchStatus === 'Matched' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.matchStatus === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            p.matchStatus === 'Excess' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            p.matchStatus === 'Unmatched' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                            'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            {p.matchStatus === 'Matched' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {p.matchStatus === 'Partial' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                            {p.matchStatus === 'Excess' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                            {p.matchStatus === 'Unmatched' && <AlertTriangle className="w-3 h-3 text-orange-600" />}
                            {p.matchStatus === 'Missing Order' && <HelpCircle className="w-3 h-3 text-neutral-500" />}
                            {p.matchStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Delete this bank reconciliation record?')) {
                                onDeletePayment(p.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

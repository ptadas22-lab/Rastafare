/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PaymentRecord, SalesEntry } from '../types';
import { formatINR } from '../utils/format';
import { CheckCircle2, AlertTriangle, HelpCircle, PlusCircle, Search, Trash2 } from 'lucide-react';

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
      } else {
        setLiveMatchStatus('Unmatched');
      }
    } else {
      setMatchingSale(null);
      setLiveSaleAmount(0);
      setLiveDifference(formGrossAmount);
      setLiveMatchStatus('Missing Order');
    }
  }, [formOrderId, formGrossAmount, sales]);

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
      matchStatus = Math.abs(diff) < 0.1 ? 'Matched' : 'Unmatched';
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

                <div className="border-t border-slate-200 pt-1 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    liveMatchStatus === 'Matched' ? 'bg-emerald-100 text-emerald-800' :
                    liveMatchStatus === 'Unmatched' ? 'bg-amber-100 text-amber-800' :
                    'bg-neutral-150 text-neutral-700'
                  }`}>
                    Match Preview: {liveMatchStatus}
                  </span>
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
                            p.matchStatus === 'Unmatched' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-neutral-100 text-neutral-700 border border-neutral-200'
                          }`}>
                            {p.matchStatus === 'Matched' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {p.matchStatus === 'Unmatched' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
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

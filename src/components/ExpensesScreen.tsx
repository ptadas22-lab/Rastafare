/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ExpenseRecord, Product } from '../types';
import { formatINR } from '../utils/format';
import { PlusCircle, Search, Edit2, Trash2, Tag, Calendar, Truck, Landmark } from 'lucide-react';

interface ExpensesScreenProps {
  expenses: ExpenseRecord[];
  products: Product[];
  onAddExpense: (expense: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_TYPES = [
  "Purchase", "Expense", "Refund", "Courier", "Packaging", 
  "Bank Charge", "Marketing", "Salary", "Rent", "Other"
];

const CATEGORIES = [
  "Inventory Purchase", "Rent & Property", "Salaries & Wages", 
  "Marketing & Ads", "Shipping & Courier", "Packaging Supplies", 
  "Bank Fees & Interest", "Office Utilities", "Travel", "Software & Tools", "Other"
];

export default function ExpensesScreen({
  expenses,
  products,
  onAddExpense,
  onDeleteExpense
}: ExpensesScreenProps) {
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Form states
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState<ExpenseRecord['type']>('Purchase');
  const [formSupplierParty, setFormSupplierParty] = useState('');
  const [formProductCode, setFormProductCode] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formRate, setFormRate] = useState(0);
  const [formGstRate, setFormGstRate] = useState(18);
  const [formTotalAmount, setFormTotalAmount] = useState(0);
  const [formIsInclusive, setFormIsInclusive] = useState(true); // default true for non-purchase expenses
  const [formPaymentStatus, setFormPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [formCategory, setFormCategory] = useState('Inventory Purchase');
  const [formRemarks, setFormRemarks] = useState('');

  const [formError, setFormError] = useState('');

  // Auto-set Category when Type changes to simplify user work
  useEffect(() => {
    if (formType === 'Purchase') {
      setFormCategory('Inventory Purchase');
    } else if (formType === 'Rent') {
      setFormCategory('Rent & Property');
    } else if (formType === 'Salary') {
      setFormCategory('Salaries & Wages');
    } else if (formType === 'Marketing') {
      setFormCategory('Marketing & Ads');
    } else if (formType === 'Courier') {
      setFormCategory('Shipping & Courier');
    } else if (formType === 'Packaging') {
      setFormCategory('Packaging Supplies');
    } else if (formType === 'Bank Charge') {
      setFormCategory('Bank Fees & Interest');
    } else {
      setFormCategory('Other');
    }
  }, [formType]);

  // Pull baseline cost and GST when Product is chosen in Purchase type
  useEffect(() => {
    if (formType === 'Purchase' && formProductCode) {
      const selectedProduct = products.find(p => p.code === formProductCode);
      if (selectedProduct) {
        setFormRate(selectedProduct.purchaseCost);
        setFormGstRate(selectedProduct.gstRate);
      }
    }
  }, [formType, formProductCode, products]);

  // Compute live amounts based on form type and pricing mode
  const getLiveCalculations = () => {
    if (formType === 'Purchase') {
      const taxable = Number(formQuantity) * Number(formRate);
      const tax = taxable * (Number(formGstRate) / 100);
      const total = taxable + tax;
      return {
        taxable,
        tax,
        total
      };
    } else {
      // Normal Expense manual entry
      const total = Number(formTotalAmount);
      if (formIsInclusive) {
        // GST Inclusive math: taxable = total / (1 + gstRate/100)
        const taxable = total / (1 + Number(formGstRate) / 100);
        const tax = total - taxable;
        return {
          taxable: Number(taxable.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          total
        };
      } else {
        // GST Exclusive math: tax = total * gstRate / 100
        const tax = total * (Number(formGstRate) / 100);
        const fullTotal = total + tax;
        return {
          taxable: total,
          tax: Number(tax.toFixed(2)),
          total: Number(fullTotal.toFixed(2))
        };
      }
    }
  };

  const { taxable: liveTaxable, tax: liveTax, total: liveTotal } = getLiveCalculations();

  // Submit Expense
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formSupplierParty.trim()) {
      setFormError('Supplier / Party name is required.');
      return;
    }

    if (formType === 'Purchase') {
      if (!formProductCode) {
        setFormError('Please select a product for the inventory purchase.');
        return;
      }
      if (formQuantity <= 0 || formRate <= 0) {
        setFormError('Quantity and Rate must be positive numbers.');
        return;
      }
    } else {
      if (formTotalAmount <= 0) {
        setFormError('Total Amount must be greater than zero.');
        return;
      }
    }

    const payload: ExpenseRecord = {
      id: 'E-' + Date.now(),
      date: formDate,
      type: formType,
      supplierParty: formSupplierParty.trim(),
      product: formType === 'Purchase' ? formProductCode : undefined,
      quantity: formType === 'Purchase' ? Number(formQuantity) : undefined,
      rate: formType === 'Purchase' ? Number(formRate) : undefined,
      gstRate: Number(formGstRate),
      gstAmount: liveTax,
      totalAmount: liveTotal,
      paymentStatus: formPaymentStatus,
      category: formCategory,
      remarks: formRemarks.trim() || undefined
    };

    onAddExpense(payload);

    // Reset Form
    setFormSupplierParty('');
    setFormProductCode('');
    setFormTotalAmount(0);
    setFormRemarks('');
  };

  // Filter List
  const filteredExpenses = expenses.filter(e => {
    const pCode = e.product || '';
    const pObj = products.find(p => p.code === pCode);
    const pName = pObj ? pObj.name : '';
    
    const matchesSearch = e.supplierParty.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (e.remarks && e.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'All' || e.type === typeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="expenses-screen">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Purchases & Business Expenditures</h1>
          <p className="text-xs text-slate-500 mt-1">Audit operational overhead, salaries, marketing bills, and inventory raw material supplies for cash-flow compliance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-1" id="expenses-form-card">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sticky top-6">
            <h2 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
              Log Procurement / Outflow
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Billing Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Expenditure Type *</label>
                  <select
                    value={formType}
                    onChange={e => {
                      const val = e.target.value as ExpenseRecord['type'];
                      setFormType(val);
                      // Force inclusive/exclusive settings based on type
                      if (val === 'Purchase') {
                        setFormIsInclusive(false);
                      } else {
                        setFormIsInclusive(true);
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {EXPENSE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Vendor / Counterparty *</label>
                <input
                  type="text"
                  placeholder="e.g. EcoPack Ltd, Apex Herbal"
                  value={formSupplierParty}
                  onChange={e => setFormSupplierParty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Purchase Specific Inputs */}
              {formType === 'Purchase' ? (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Inventory Purchase Parameters</span>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select Product *</label>
                    <select
                      value={formProductCode}
                      onChange={e => setFormProductCode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Stock Product --</option>
                      {products.map(p => (
                        <option key={p.code} value={p.code}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Qty Procured *</label>
                      <input
                        type="number"
                        min="1"
                        value={formQuantity}
                        onChange={e => setFormQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Unit Cost (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formRate || ''}
                        onChange={e => setFormRate(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Non-Purchase Normal Expenses Inputs */
                <div className="p-3 bg-indigo-50/20 border border-indigo-100 rounded-lg space-y-3">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">Overhead Expense Parameters</span>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Total Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 35000"
                      value={formTotalAmount || ''}
                      onChange={e => setFormTotalAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="inclusive-tax-chk"
                      checked={formIsInclusive}
                      onChange={e => setFormIsInclusive(e.target.checked)}
                      className="accent-indigo-600"
                    />
                    <label htmlFor="inclusive-tax-chk" className="text-xs font-medium text-slate-500 cursor-pointer">
                      Amount is GST Inclusive
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">GST Rate (%)</label>
                  <select
                    value={formGstRate}
                    onChange={e => setFormGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category Group</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Automatic Calculation feedback panel */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1.5 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Taxable Cost base:</span>
                  <span className="text-slate-900 font-semibold">{formatINR(liveTaxable)}</span>
                </div>
                <div className="flex justify-between text-amber-800">
                  <span>Input Tax Credit (ITC):</span>
                  <span>{formatINR(liveTax)}</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-xs">
                  <span>Gross Total Amount:</span>
                  <span>{formatINR(liveTotal)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status</label>
                  <select
                    value={formPaymentStatus}
                    onChange={e => setFormPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending / Unpaid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks / Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Google ads campaign June"
                    value={formRemarks}
                    onChange={e => setFormRemarks(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Log Procurement
              </button>
            </form>
          </div>
        </div>

        {/* Right list table */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search vendor party, category grouping, remarks, product codes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="All">All Outflows</option>
              {EXPENSE_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Expenses Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Procurement / Party</th>
                    <th className="p-3">Type & Group</th>
                    <th className="p-3">Product details</th>
                    <th className="p-3 text-right">Taxable base</th>
                    <th className="p-3 text-center">Tax %</th>
                    <th className="p-3 text-right">ITC Collected</th>
                    <th className="p-3 text-right">Total Outflow</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-sm">
                        No transactions found under specified filters.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(e => {
                      const productObj = e.product ? products.find(p => p.code === e.product) : null;
                      const taxable = e.totalAmount - e.gstAmount;
                      
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-semibold text-sm text-slate-900">{e.supplierParty}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex gap-1.5">
                              <span>ID: {e.id}</span>
                              <span>|</span>
                              <span>Date: {e.date}</span>
                            </div>
                            {e.remarks && (
                              <div className="text-[10px] text-neutral-500 italic mt-1 font-medium bg-neutral-50 border border-neutral-100 p-1 rounded">
                                Note: "{e.remarks}"
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-neutral-100 font-bold text-neutral-800 rounded font-mono text-[9px] uppercase">{e.type}</span>
                            </div>
                            <div className="text-[10px] text-neutral-500 font-semibold mt-1 flex items-center gap-1">
                              <Tag className="w-3 h-3 text-indigo-600" /> {e.category}
                            </div>
                          </td>
                          <td className="p-3">
                            {e.type === 'Purchase' && e.product ? (
                              <div>
                                <div className="font-medium text-slate-900 truncate max-w-[150px]" title={productObj ? productObj.name : e.product}>
                                  {productObj ? productObj.name : e.product}
                                </div>
                                <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                  Qty: {e.quantity} × {formatINR(e.rate || 0)}
                                </div>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic font-medium">Overhead Cost</span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-neutral-700">
                            {formatINR(taxable)}
                          </td>
                          <td className="p-3 text-center font-mono text-neutral-600">
                            {e.gstRate}%
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                            {formatINR(e.gstAmount)}
                          </td>
                          <td className="p-3 text-right font-bold font-mono text-slate-900">
                            {formatINR(e.totalAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              e.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {e.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Remove this expense record to ${e.supplierParty}?`)) {
                                  onDeleteExpense(e.id);
                                }
                              }}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>
    </div>
  );
}

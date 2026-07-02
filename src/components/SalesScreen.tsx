/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SalesEntry } from '../types';
import { formatINR } from '../utils/format';
import { PlusCircle, Search, Edit, Trash2, Receipt, Sparkles } from 'lucide-react';

interface SalesScreenProps {
  sales: SalesEntry[];
  products: Product[];
  businessState: string;
  onAddSale: (sale: SalesEntry) => void;
  onUpdateSale: (sale: SalesEntry) => void;
  onDeleteSale: (id: string) => void;
  onViewInvoice: (sale: SalesEntry) => void;
}

// Common Indian States
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

export default function SalesScreen({
  sales,
  products,
  businessState,
  onAddSale,
  onUpdateSale,
  onDeleteSale,
  onViewInvoice
}: SalesScreenProps) {
  
  // Search / Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formOrderId, setFormOrderId] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerGSTIN, setFormCustomerGSTIN] = useState('');
  const [formCustomerState, setFormCustomerState] = useState('Maharashtra');
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formProductCode, setFormProductCode] = useState('');
  const [formQuantity, setFormQuantity] = useState(1);
  const [formRate, setFormRate] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formShippingCharge, setFormShippingCharge] = useState(0);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'Paid' | 'Pending' | 'Refunded'>('Paid');
  const [formError, setFormError] = useState('');

  // Auto-calculated states for live-feedback
  const [liveSalesAmount, setLiveSalesAmount] = useState(0);
  const [liveTaxableValue, setLiveTaxableValue] = useState(0);
  const [liveGstPercent, setLiveGstPercent] = useState(0);
  const [liveGstAmount, setLiveGstAmount] = useState(0);
  const [liveTotalSales, setLiveTotalSales] = useState(0);

  // Auto-fill form values when a product is selected
  useEffect(() => {
    if (formProductCode) {
      const selectedProduct = products.find(p => p.code === formProductCode);
      if (selectedProduct) {
        setFormRate(selectedProduct.sellingPrice);
        setLiveGstPercent(selectedProduct.gstRate);
      }
    }
  }, [formProductCode, products]);

  // Recalculate Live calculations whenever factors change
  useEffect(() => {
    const salesAmount = Number(formQuantity) * Number(formRate);
    const taxableValue = salesAmount - Number(formDiscount) + Number(formShippingCharge);
    
    // Fetch product gst rate if not set
    let gstPct = liveGstPercent;
    if (formProductCode) {
      const selectedProduct = products.find(p => p.code === formProductCode);
      if (selectedProduct) {
        gstPct = selectedProduct.gstRate;
      }
    }
    
    const gstAmount = taxableValue > 0 ? taxableValue * (gstPct / 100) : 0;
    const totalSales = taxableValue > 0 ? taxableValue + gstAmount : 0;

    setLiveSalesAmount(salesAmount);
    setLiveTaxableValue(taxableValue);
    setLiveGstPercent(gstPct);
    setLiveGstAmount(gstAmount);
    setLiveTotalSales(totalSales);
  }, [formProductCode, formQuantity, formRate, formDiscount, formShippingCharge, liveGstPercent, products]);

  // Handle Edit Trigger
  const handleEdit = (sale: SalesEntry) => {
    setIsEditing(true);
    setEditingId(sale.id);
    setFormDate(sale.date);
    setFormOrderId(sale.orderId);
    setFormCustomerName(sale.customerName);
    setFormCustomerPhone(sale.customerPhone);
    setFormCustomerGSTIN(sale.customerGSTIN || '');
    setFormCustomerState(sale.customerState);
    setFormBillingAddress(sale.billingAddress);
    setFormProductCode(sale.productCode);
    setFormQuantity(sale.quantity);
    setFormRate(sale.rate);
    setFormDiscount(sale.discount);
    setFormShippingCharge(sale.shippingCharge);
    setFormPaymentStatus(sale.paymentStatus);
    setFormError('');

    // Scroll to form card
    document.getElementById('sales-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormOrderId('');
    setFormCustomerName('');
    setFormCustomerPhone('');
    setFormCustomerGSTIN('');
    setFormCustomerState(businessState || 'Maharashtra');
    setFormBillingAddress('');
    setFormProductCode('');
    setFormQuantity(1);
    setFormRate(0);
    setFormDiscount(0);
    setFormShippingCharge(0);
    setFormPaymentStatus('Paid');
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!formOrderId.trim()) {
      setFormError('Order ID is required.');
      return;
    }
    if (!formCustomerName.trim()) {
      setFormError('Customer Name is required.');
      return;
    }
    if (!formProductCode) {
      setFormError('Please select a product.');
      return;
    }
    if (formQuantity <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }
    if (formRate <= 0) {
      setFormError('Rate must be greater than zero.');
      return;
    }

    // Check Order ID duplicates for new entries
    if (!isEditing && sales.some(s => s.orderId.toUpperCase() === formOrderId.toUpperCase())) {
      setFormError(`An entry for Order ID '${formOrderId}' already exists.`);
      return;
    }

    const salesAmt = Number(formQuantity) * Number(formRate);
    const taxable = salesAmt - Number(formDiscount) + Number(formShippingCharge);
    const calculatedGst = taxable * (liveGstPercent / 100);
    const total = taxable + calculatedGst;

    const payload: SalesEntry = {
      id: isEditing ? editingId : 'S-' + Date.now(),
      date: formDate,
      orderId: formOrderId.trim().toUpperCase(),
      customerName: formCustomerName.trim(),
      customerPhone: formCustomerPhone.trim(),
      customerGSTIN: formCustomerGSTIN.trim() || undefined,
      customerState: formCustomerState,
      billingAddress: formBillingAddress.trim(),
      productCode: formProductCode,
      quantity: Number(formQuantity),
      rate: Number(formRate),
      discount: Number(formDiscount),
      shippingCharge: Number(formShippingCharge),
      gstRate: liveGstPercent,
      gstAmount: Number(calculatedGst.toFixed(2)),
      totalSales: Number(total.toFixed(2)),
      paymentStatus: formPaymentStatus,
      // Keep or assign invoiceNo
      invoiceNo: isEditing 
        ? sales.find(s => s.id === editingId)?.invoiceNo 
        : undefined // will be auto-assigned dynamically by index or generator if needed
    };

    if (isEditing) {
      onUpdateSale(payload);
    } else {
      onAddSale(payload);
    }

    resetForm();
  };

  // Filter Sales Entries
  const filteredSales = sales.filter(s => {
    const product = products.find(p => p.code === s.productCode);
    const productName = product ? product.name : '';
    
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.invoiceNo && s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || s.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="sales-screen">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Outward Sales Register</h1>
          <p className="text-xs text-slate-500 mt-1">Record wellness customer transactions, automate tax breakdowns, and generate compliant invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form panel */}
        <div className="lg:col-span-1" id="sales-form-card">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sticky top-6">
            <h2 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
              {isEditing ? 'Modify Sales Record' : 'Record Outward Sale'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Sale Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Order ID *</label>
                  <input
                    type="text"
                    placeholder="ORD-2026-1234"
                    value={formOrderId}
                    onChange={e => setFormOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-200 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Buyer Details</span>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formCustomerName}
                    onChange={e => setFormCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile No</label>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={formCustomerPhone}
                      onChange={e => setFormCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Customer State *</label>
                    <select
                      value={formCustomerState}
                      onChange={e => setFormCustomerState(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {INDIAN_STATES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAACS1234A1Z1"
                    value={formCustomerGSTIN}
                    onChange={e => setFormCustomerGSTIN(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Billing Address</label>
                  <textarea
                    placeholder="Full street address, City, Pincode"
                    value={formBillingAddress}
                    onChange={e => setFormBillingAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/25 p-3 rounded-lg border border-indigo-100 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-800 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" /> Itemized Invoice Automation
                </span>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Select Product *</label>
                  <select
                    value={formProductCode}
                    onChange={e => setFormProductCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.filter(p => p.status === 'Active').map(p => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code}) - {formatINR(p.sellingPrice)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      value={formQuantity}
                      onChange={e => setFormQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Rate (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formRate || ''}
                      onChange={e => setFormRate(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formDiscount || ''}
                      onChange={e => setFormDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Shipping Charges (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formShippingCharge || ''}
                      onChange={e => setFormShippingCharge(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Automation feedback readout */}
                <div className="p-3 bg-white border border-slate-200 rounded-md text-[11px] space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Sales Subtotal (Qty × Rate):</span>
                    <span className="font-mono">{formatINR(liveSalesAmount)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Taxable Value (Subtotal - Disc + Ship):</span>
                    <span className="font-mono">{formatINR(liveTaxableValue)}</span>
                  </div>
                  <div className="flex justify-between text-amber-800 font-semibold">
                    <span>GST ({liveGstPercent}% rate):</span>
                    <span className="font-mono">{formatINR(liveGstAmount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-slate-900 text-xs">
                    <span>Total Output sales value:</span>
                    <span className="font-mono text-indigo-600">{formatINR(liveTotalSales)}</span>
                  </div>
                  
                  {/* CGST / SGST vs IGST preview */}
                  <div className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-1 text-center">
                    {formCustomerState === businessState ? (
                      <span className="text-emerald-700 font-semibold">Intrastate transaction: CGST ({liveGstPercent/2}%) & SGST ({liveGstPercent/2}%) will be logged.</span>
                    ) : (
                      <span className="text-indigo-700 font-semibold">Interstate transaction: IGST ({liveGstPercent}%) will be logged.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Payment Status</label>
                <select
                  value={formPaymentStatus}
                  onChange={e => setFormPaymentStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending / Unpaid</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Record Transaction'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Sales Table Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by customer name, order number, product code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
            >
              <option value="All">All Payment Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending / Unpaid</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          {/* Table list */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Receipt / Client</th>
                    <th className="p-3">Product / Qty</th>
                    <th className="p-3 text-right">Taxable (Disc)</th>
                    <th className="p-3 text-right">GST Collected</th>
                    <th className="p-3 text-right">Invoice Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                        No transactions registered under specified criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(s => {
                      const product = products.find(p => p.code === s.productCode);
                      const salesAmt = s.quantity * s.rate;
                      const taxable = salesAmt - s.discount + s.shippingCharge;
                      
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="font-semibold text-sm text-slate-900">{s.customerName}</div>
                            <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px] text-slate-400">
                              <span className="font-semibold text-indigo-600">Order: {s.orderId}</span>
                              {s.invoiceNo && <span>Invoice: {s.invoiceNo}</span>}
                              <span>Date: {s.date} | Phone: {s.customerPhone}</span>
                              <span>State: {s.customerState} {s.customerGSTIN && `| GSTIN: ${s.customerGSTIN}`}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 block max-w-[150px] truncate" title={product ? product.name : s.productCode}>
                              {product ? product.name : s.productCode}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              Qty: {s.quantity} × {formatINR(s.rate)}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono">
                            <div className="text-slate-800 font-semibold">{formatINR(taxable)}</div>
                            {s.discount > 0 && (
                              <div className="text-[9px] text-rose-600 font-semibold">Disc: -{formatINR(s.discount)}</div>
                            )}
                            {s.shippingCharge > 0 && (
                              <div className="text-[9px] text-emerald-700 font-semibold">Ship: +{formatINR(s.shippingCharge)}</div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-800 font-semibold">
                            <div>{formatINR(s.gstAmount)}</div>
                            <div className="text-[9px] text-slate-400 font-medium">({s.gstRate}%)</div>
                          </td>
                          <td className="p-3 text-right font-bold font-mono text-slate-900">
                            {formatINR(s.totalSales)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              s.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              s.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {s.paymentStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => onViewInvoice(s)}
                                title="Generate / View Invoice"
                                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleEdit(s)}
                                title="Edit Sales Record"
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete sales record for ${s.customerName}?`)) {
                                    onDeleteSale(s.id);
                                  }
                                }}
                                title="Delete Sales Record"
                                className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

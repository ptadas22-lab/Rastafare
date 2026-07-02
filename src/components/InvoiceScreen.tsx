/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, SalesEntry, CompanyProfile } from '../types';
import { formatINR, formatDate } from '../utils/format';
import { 
  Receipt, 
  Check, 
  Printer, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Sparkles, 
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Maximize2,
  Minimize2,
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  Share2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoiceScreenProps {
  sales: SalesEntry[];
  products: Product[];
  companyProfile: CompanyProfile;
  selectedSaleId?: string;
  onUpdateSale: (sale: SalesEntry) => void;
  onSelectSale: (id: string) => void;
}

export default function InvoiceScreen({
  sales,
  products,
  companyProfile,
  selectedSaleId,
  onUpdateSale,
  onSelectSale
}: InvoiceScreenProps) {
  
  // Active sale index / selection
  const activeSale = sales.find(s => s.id === selectedSaleId) || sales[0];
  
  // Interactive UI states
  const [invoiceNotes, setInvoiceNotes] = useState("Thank you for choosing Rastafari Wellness. This is a computer-generated GST tax invoice and does not require a physical signature unless specified.");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Auto-generate invoice number in sequence for active selection if missing
  useEffect(() => {
    if (activeSale && !activeSale.invoiceNo) {
      const saleYear = activeSale.date ? activeSale.date.split('-')[0] : '2026';
      
      // Calculate max sequence for this year across ALL existing sales
      let maxSeq = 0;
      sales.forEach(s => {
        if (s.invoiceNo && s.invoiceNo.startsWith(`INV-${saleYear}-`)) {
          const parts = s.invoiceNo.split('-');
          const seqNum = parseInt(parts[2], 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        }
      });

      const nextSeq = maxSeq + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      const generatedInvoiceNo = `INV-${saleYear}-${seqStr}`;

      // Safely update sales database without causing infinite loop
      onUpdateSale({
        ...activeSale,
        invoiceNo: generatedInvoiceNo
      });
    }
  }, [activeSale?.id, sales.length]); // Triggers when selection changes or new sales added

  // Manual generation trigger as backup
  const handleForceGenerateNo = (sale: SalesEntry) => {
    if (sale.invoiceNo) return;
    const saleYear = sale.date ? sale.date.split('-')[0] : '2026';
    let maxSeq = 0;
    sales.forEach(s => {
      if (s.invoiceNo && s.invoiceNo.startsWith(`INV-${saleYear}-`)) {
        const parts = s.invoiceNo.split('-');
        const seqNum = parseInt(parts[2], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });
    const nextSeq = maxSeq + 1;
    const seqStr = String(nextSeq).padStart(4, '0');
    onUpdateSale({
      ...sale,
      invoiceNo: `INV-${saleYear}-${seqStr}`
    });
  };

  const handleMarkAsPaid = (sale: SalesEntry) => {
    onUpdateSale({
      ...sale,
      paymentStatus: 'Paid'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // High-fidelity PDF download using canvas rendering to A4
  const handleDownloadPDF = async () => {
    if (!activeSale) return;
    setIsGeneratingPdf(true);
    
    // Select the A4 invoice sheet container
    const element = document.getElementById('invoice-sheet');
    if (!element) {
      setIsGeneratingPdf(false);
      return;
    }

    try {
      // Configure canvas with high scale for vector-like text printing
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800, // lock container width during snapshot to prevent responsive layout shifts
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-sheet');
          if (!clonedElement) return;

          // Define the list of visual/layout styling properties to copy
          const styleProperties = [
            'position', 'top', 'left', 'right', 'bottom', 'z-index',
            'display', 'flex', 'flex-direction', 'align-items', 'justify-content', 'flex-wrap', 'flex-grow', 'flex-shrink',
            'grid-template-columns', 'grid-column', 'gap',
            'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
            'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
            'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
            'box-sizing',
            'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
            'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
            'border-width', 'border-style', 'border-color',
            'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
            'color', 'font-family', 'font-size', 'font-weight', 'line-height', 'text-align', 'text-transform', 'letter-spacing', 'white-space', 'word-break',
            'text-decoration', 'text-decoration-line', 'text-decoration-color',
            'opacity', 'visibility', 'box-shadow', 'vertical-align', 'overflow',
            'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
            'aspect-ratio'
          ];

          // Recursively copy computed styles from original elements to the cloned ones
          const inlineStyles = (sourceEl: HTMLElement, targetEl: HTMLElement) => {
            const computed = window.getComputedStyle(sourceEl);
            for (const key of styleProperties) {
              const val = computed.getPropertyValue(key);
              if (val) {
                if (val.includes('oklch')) {
                  // Fallback replacement if computedStyle failed to resolve oklch
                  targetEl.style.setProperty(key, 'rgb(99, 102, 241)');
                } else {
                  targetEl.style.setProperty(key, val);
                }
              }
            }

            // Recurse children
            for (let i = 0; i < sourceEl.children.length; i++) {
              const sourceChild = sourceEl.children[i] as HTMLElement;
              const targetChild = targetEl.children[i] as HTMLElement;
              if (sourceChild && targetChild) {
                inlineStyles(sourceChild, targetChild);
              }
            }
          };

          inlineStyles(element, clonedElement);

          // Remove all stylesheets except external web fonts (Google Fonts)
          // this prevents html2canvas parser from encountering raw 'oklch' in css rules
          const sheets = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
          sheets.forEach(sheet => {
            const href = sheet.getAttribute('href') || '';
            const isGoogleFont = sheet.tagName === 'LINK' && href.includes('fonts.googleapis.com');
            if (!isGoogleFont) {
              sheet.remove();
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210; // mm A4 width
      const pdfHeight = 297; // mm A4 height
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add to page 1
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Append additional pages if invoice overflows A4
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const filename = activeSale.invoiceNo 
        ? `Invoice_${activeSale.invoiceNo}.pdf` 
        : `Invoice_${activeSale.orderId}.pdf`;
        
      pdf.save(filename);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Tax calculations based on Company State vs Customer State
  const businessState = companyProfile.businessState || 'Maharashtra';
  const customerState = activeSale?.customerState || 'Maharashtra';
  const isIntrastate = businessState.toLowerCase().trim() === customerState.toLowerCase().trim();
  
  const salesAmt = activeSale ? activeSale.quantity * activeSale.rate : 0;
  const taxableValue = activeSale ? salesAmt - activeSale.discount : 0;
  const shippingVal = activeSale ? activeSale.shippingCharge : 0;
  
  // In Indian GST system, shipping charge can also be taxed. 
  // However, we follow the stored sales database properties where totalSales and gstAmount are pre-calculated to ensure exact matching:
  const totalGstAmount = activeSale ? activeSale.gstAmount : 0;
  const cgstAmount = isIntrastate ? totalGstAmount / 2 : 0;
  const sgstAmount = isIntrastate ? totalGstAmount / 2 : 0;
  const igstAmount = isIntrastate ? 0 : totalGstAmount;

  const gstRateText = activeSale ? `${activeSale.gstRate}%` : '18%';
  const halfGstRateText = activeSale ? `${activeSale.gstRate / 2}%` : '9%';

  const activeProduct = activeSale ? products.find(p => p.code === activeSale.productCode) : null;

  // Filter Sales list (non-print sidebar search)
  const filteredSales = sales.filter(s => {
    const product = products.find(p => p.code === s.productCode);
    const prodName = product ? product.name : '';
    const term = searchTerm.toLowerCase();
    
    const matchesSearch = s.customerName.toLowerCase().includes(term) || 
                          s.orderId.toLowerCase().includes(term) || 
                          prodName.toLowerCase().includes(term) ||
                          (s.invoiceNo && s.invoiceNo.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'All' || s.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:m-0" id="invoice-screen">
      
      {/* 1. Header (hidden on print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Tax Invoice Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access, compile, and download vector-crisp GST compliance invoices. Uses your business state <strong>{businessState}</strong> to automatically route taxes.
          </p>
        </div>
      </div>

      {/* 2. Primary layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Sales Records (hidden on print or full-screen) */}
        <div className={`lg:col-span-4 space-y-4 print:hidden ${isFullscreen ? 'hidden' : 'block'}`}>
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-sm text-slate-900 flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-indigo-600" />
                Real Sales Entries ({sales.length})
              </h2>
            </div>

            {/* Search and filter controls */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer, order, HSN..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-1.5">
                {['All', 'Paid', 'Pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      statusFilter === status 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sales Scroll List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredSales.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">
                  {sales.length === 0 
                    ? "No real sales logs present. Please log sales on the Outward Sales panel first." 
                    : "No matches found."}
                </div>
              ) : (
                filteredSales.map(s => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSale(s.id)}
                    className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      activeSale?.id === s.id
                        ? 'bg-indigo-50/40 border-indigo-200 ring-2 ring-indigo-100'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {s.orderId}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        s.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        s.paymentStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </div>
                    
                    <div className="text-xs font-semibold text-slate-700 mt-1.5">{s.customerName}</div>
                    
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                      <span>{s.date}</span>
                      <span className="font-bold text-slate-800">{formatINR(s.totalSales)}</span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-[9px]">
                      <span className="text-slate-400">Invoice:</span>
                      {s.invoiceNo ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {s.invoiceNo}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded animate-pulse">
                          Auto-assigning...
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Invoice Preview Card */}
        <div className={`${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4 print:col-span-12 print:w-full print:p-0 print:m-0`}>
          
          {/* Controls Bar (hidden on print) */}
          {activeSale && (
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-wrap justify-between items-center gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-75 disabled:cursor-wait"
                >
                  <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                  {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
                </button>
                
                <button
                  onClick={handlePrint}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  Print A4
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeSale.paymentStatus !== 'Paid' && (
                  <button
                    onClick={() => handleMarkAsPaid(activeSale)}
                    className="px-2.5 py-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Mark Paid
                  </button>
                )}

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg hidden lg:block cursor-pointer"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <div className="px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] text-slate-500 font-semibold font-mono">
                  Supply State: <span className="text-slate-900">{customerState}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actual Invoice Sheet (Designed for perfect paper-A4 dimension when printed or rendered) */}
          {activeSale ? (
            <div className="space-y-4">
              <div 
                className="bg-white border border-slate-300 rounded-2xl shadow-sm p-6 sm:p-12 relative overflow-hidden print:border-none print:shadow-none print:p-0 print:m-0" 
                id="invoice-sheet"
                style={{ minHeight: '297mm', boxSizing: 'border-box' }}
              >
                {/* 1. Brand Header / Letterhead */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-6">
                  <div>
                    {/* Rastafari Wellness Logo Section */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center text-white font-extrabold text-lg tracking-wider shadow-xs">
                        RW
                      </div>
                      <div>
                        <h2 className="text-xl font-display font-black text-slate-900 tracking-tight uppercase">
                          {companyProfile.businessName}
                        </h2>
                        <span className="text-[9px] bg-slate-100 text-slate-800 font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">
                          Wellness & Compliance Standard
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-4 space-y-1 leading-normal">
                      <p className="font-medium text-slate-800">{companyProfile.businessAddress}</p>
                      <p>Phone: {companyProfile.businessPhone} | Email: {companyProfile.businessEmail}</p>
                      <div className="pt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px]">
                        <span className="text-indigo-800 font-bold uppercase bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          GSTIN: {companyProfile.businessGSTIN}
                        </span>
                        <span className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          State: {businessState} (Code: 27)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right md:flex md:flex-col md:items-end">
                    <span className="text-xs font-bold text-indigo-600 tracking-widest uppercase">TAX INVOICE</span>
                    <h1 className="text-2xl font-mono font-black text-slate-900 tracking-tight mt-1">
                      {activeSale.invoiceNo || 'PENDING ASSIGNMENT'}
                    </h1>

                    <div className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-4 leading-normal font-mono md:text-right">
                      <div>
                        <span className="text-slate-400 font-sans block md:inline md:mr-1">Invoice Date:</span>
                        <strong className="text-slate-900">{formatDate(activeSale.date)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block md:inline md:mr-1">Order Ref:</span>
                        <strong className="text-slate-900">{activeSale.orderId}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block md:inline md:mr-1">Place of Supply:</span>
                        <strong className="text-slate-900 uppercase">{customerState}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block md:inline md:mr-1">Tax Regime:</span>
                        <strong className="text-slate-900">GST (CGST/SGST/IGST)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Billing & Shipping Recipient Details */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 border-b border-slate-100">
                  <div className="md:col-span-7 space-y-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Billed To / Consignee Recipient</span>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {activeSale.customerName}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-sm whitespace-pre-line">
                      {activeSale.billingAddress || 'No billing address registered.'}
                    </p>
                    <div className="font-mono text-[10px] text-slate-500">
                      Phone: <span className="text-slate-800 font-bold">{activeSale.customerPhone}</span>
                    </div>
                  </div>

                  <div className="md:col-span-5 md:text-right md:flex md:flex-col md:items-end justify-between">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Tax Registration</span>
                      {activeSale.customerGSTIN ? (
                        <div>
                          <span className="font-mono text-[11px] font-extrabold text-indigo-900 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md inline-block uppercase tracking-wider">
                            GSTIN: {activeSale.customerGSTIN}
                          </span>
                          <span className="text-[9px] text-emerald-700 font-bold block mt-1">✓ Registered Entity (Inward Credit Eligible)</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 font-medium italic">
                          Unregistered Consumer (B2C Supply)
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 font-sans text-[10px] bg-slate-50 border border-slate-100 p-2 rounded-lg text-left md:text-right inline-block max-w-[240px]">
                      <span className="font-bold text-slate-700 text-[10px] block mb-0.5">Supply Type:</span>
                      <span className="text-slate-500">
                        {isIntrastate 
                          ? "Intrastate CGST + SGST (Same state supply)" 
                          : "Interstate IGST (Cross border supply)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Items Table */}
                <div className="py-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-slate-500 font-extrabold uppercase tracking-widest pb-3">
                        <th className="py-2.5"># Description of Goods</th>
                        <th className="py-2.5 text-right">Rate</th>
                        <th className="py-2.5 text-center">Qty</th>
                        {activeSale.discount > 0 && <th className="py-2.5 text-right">Discount</th>}
                        <th className="py-2.5 text-right">Taxable Value</th>
                        <th className="py-2.5 text-center">GST Rate</th>
                        <th className="py-2.5 text-right">GST Tax</th>
                        <th className="py-2.5 text-right">Gross Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {/* Product line item */}
                      <tr className="hover:bg-slate-50/50">
                        <td className="py-3.5 pr-2">
                          <div className="font-extrabold text-slate-900">{activeProduct ? activeProduct.name : activeSale.productCode}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Code: {activeSale.productCode} | HSN: 3004.90.11 (Ayurvedic/Wellness Supplements)
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-mono">{formatINR(activeSale.rate)}</td>
                        <td className="py-3.5 text-center font-mono font-bold">{activeSale.quantity}</td>
                        {activeSale.discount > 0 && (
                          <td className="py-3.5 text-right font-mono text-rose-600">-{formatINR(activeSale.discount)}</td>
                        )}
                        <td className="py-3.5 text-right font-mono font-bold text-slate-900">{formatINR(taxableValue)}</td>
                        <td className="py-3.5 text-center font-mono">{gstRateText}</td>
                        <td className="py-3.5 text-right font-mono">{formatINR(totalGstAmount)}</td>
                        <td className="py-3.5 text-right font-mono font-black text-slate-950">{formatINR(taxableValue + totalGstAmount)}</td>
                      </tr>
                      
                      {/* Shipping Logistics row if present */}
                      {shippingVal > 0 && (
                        <tr className="text-slate-500 hover:bg-slate-50/20">
                          <td className="py-2.5">
                            <div className="font-bold">Shipping & Courier Logistics Charges</div>
                            <div className="text-[9px] text-slate-400 font-mono">SAC: 996511 (Logistics Delivery)</div>
                          </td>
                          <td className="py-2.5 text-right font-mono">{formatINR(shippingVal)}</td>
                          <td className="py-2.5 text-center font-mono">1</td>
                          {activeSale.discount > 0 && <td className="py-2.5"></td>}
                          <td className="py-2.5 text-right font-mono font-bold">{formatINR(shippingVal)}</td>
                          <td className="py-2.5 text-center font-mono">0%</td>
                          <td className="py-2.5 text-right font-mono">₹ 0.00</td>
                          <td className="py-2.5 text-right font-mono font-bold">{formatINR(shippingVal)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. GST Breakup and Grand Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-slate-200">
                  
                  {/* Left Side: Tax line computation split */}
                  <div className="md:col-span-7 bg-slate-50/80 p-4 rounded-xl border border-slate-100 text-[10px] space-y-3 font-medium">
                    <span className="font-extrabold text-slate-500 uppercase tracking-widest block">GST Tax Line Breakdown</span>
                    
                    <div className="divide-y divide-slate-100 font-mono text-slate-600">
                      <div className="flex justify-between py-1.5">
                        <span>Total Taxable Amount:</span>
                        <span>{formatINR(taxableValue)}</span>
                      </div>

                      {isIntrastate ? (
                        <>
                          <div className="flex justify-between py-2">
                            <span>Central Tax (CGST) @ {halfGstRateText}:</span>
                            <span className="text-slate-900 font-bold">{formatINR(cgstAmount)}</span>
                          </div>
                          <div className="flex justify-between py-2">
                            <span>State Tax (SGST) @ {halfGstRateText}:</span>
                            <span className="text-slate-900 font-bold">{formatINR(sgstAmount)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between py-2">
                          <span>Integrated Tax (IGST) @ {gstRateText}:</span>
                          <span className="text-slate-900 font-bold">{formatINR(igstAmount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between py-2 font-bold text-slate-900 border-t border-slate-200 pt-2">
                        <span>Total GST Liability:</span>
                        <span>{formatINR(totalGstAmount)}</span>
                      </div>
                    </div>
                    
                    <div className="text-[9px] text-slate-400 italic pt-1 leading-normal">
                      * {isIntrastate 
                        ? "Supply of goods is Intrastate. GST split equally into central (CGST) and state (SGST) jurisdictions."
                        : "Supply of goods is Interstate. Integrated Goods and Services Tax (IGST) is collected at full rated value."
                      }
                    </div>
                  </div>

                  {/* Right Side: Grand Totals */}
                  <div className="md:col-span-5 flex flex-col justify-end text-xs space-y-2.5 font-medium text-slate-600">
                    <div className="flex justify-between">
                      <span>Total Taxable Goods Value:</span>
                      <span className="font-mono text-slate-900 font-bold">{formatINR(taxableValue)}</span>
                    </div>

                    {shippingVal > 0 && (
                      <div className="flex justify-between">
                        <span>Logistics Delivery Charges:</span>
                        <span className="font-mono text-slate-900">{formatINR(shippingVal)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Total GST Tax Component:</span>
                      <span className="font-mono text-slate-900">{formatINR(totalGstAmount)}</span>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-3 mt-1 flex justify-between text-slate-900 font-black text-sm">
                      <span className="uppercase tracking-wider">Total Invoice Value:</span>
                      <span className="font-mono text-lg text-indigo-900 font-black">
                        {formatINR(activeSale.totalSales)}
                      </span>
                    </div>

                    {/* Stamp Overlay for Payment Status */}
                    <div className="pt-2 flex justify-end">
                      {activeSale.paymentStatus === 'Paid' ? (
                        <div className="border-2 border-emerald-600 text-emerald-600 text-[10px] tracking-widest font-extrabold uppercase px-3 py-1 rounded bg-emerald-50/50">
                          PAID IN FULL
                        </div>
                      ) : (
                        <div className="border-2 border-amber-600 text-amber-600 text-[10px] tracking-widest font-extrabold uppercase px-3 py-1 rounded bg-amber-50/50 animate-pulse">
                          PAYMENT DUE
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Terms, Notes & Legal Signature */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 mt-8 border-t border-slate-200">
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Terms & Dynamic Notes</span>
                    
                    {/* UI Interactive text-area (hidden on print) */}
                    <textarea
                      value={invoiceNotes}
                      onChange={e => setInvoiceNotes(e.target.value)}
                      rows={3}
                      className="w-full text-[10px] p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed print:hidden"
                      placeholder="Write custom terms or notes for the client..."
                    />

                    {/* Standard text shown on Print only */}
                    <p className="text-[9px] text-slate-400 leading-relaxed hidden print:block italic font-sans">
                      {invoiceNotes}
                    </p>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-end space-y-1.5 text-xs text-left md:text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-6">Authorized Signatory Placeholder</span>
                    <div className="w-44 border-b border-slate-400 border-dashed mb-1"></div>
                    <p className="font-extrabold text-slate-800 text-[11px]">
                      {companyProfile.authorizedSignatory || 'Suresh Mehta (Director of Finance)'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                      {companyProfile.businessName}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 p-16 text-center rounded-2xl text-slate-400 max-w-xl mx-auto shadow-xs">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-indigo-500 animate-pulse" />
              <p className="text-sm font-bold text-slate-800">No Sales Records Exist</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                The Invoice Generator is fully automated and only compiles real transactions. Please navigate to the <strong>Purchases & Expenses</strong> or <strong>Outward Sales Logs</strong> to add a sale, and it will immediately generate here.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

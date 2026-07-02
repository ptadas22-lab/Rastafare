/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, SalesEntry, ExpenseRecord } from '../types';
import { formatINR } from '../utils/format';
import { Search, AlertCircle, PlusCircle, Check, Trash2, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductsScreenProps {
  products: Product[];
  sales: SalesEntry[];
  expenses: ExpenseRecord[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (code: string) => void;
}

export default function ProductsScreen({
  products,
  sales,
  expenses,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: ProductsScreenProps) {
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockAlertFilter, setStockAlertFilter] = useState('All'); // All, Low Stock, Healthy

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editingCode, setEditingCode] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSellingPrice, setFormSellingPrice] = useState(0);
  const [formPurchaseCost, setFormPurchaseCost] = useState(0);
  const [formGstRate, setFormGstRate] = useState(12);
  const [formOpeningStock, setFormOpeningStock] = useState(100);
  const [formMinimumStock, setFormMinimumStock] = useState(20);
  const [formSupplierName, setFormSupplierName] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  
  const [formError, setFormError] = useState('');

  // Import states
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

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
      
      const parsedData = data.map((row: any, index: number) => {
        // Map alternate column names
        const getVal = (keys: string[]) => {
          for (const key of keys) {
            if (row[key] !== undefined) return row[key];
          }
          return undefined;
        };

        let pCode = getVal(['Product Code', 'SKU', 'Item Code', 'Product ID']);
        const pName = getVal(['Product Name', 'Item Name', 'Product', 'Product Title']);
        const pCategory = getVal(['Category']) || '';
        const pGst = getVal(['GST Rate', 'Tax', 'Tax %', 'GST %']);
        const pSelling = getVal(['Selling Price', 'MRP', 'Sale Price', 'Selling Rate']);
        const pPurchase = getVal(['Purchase Cost', 'Cost Price', 'Purchase Rate', 'Buying Price']);
        const pOpening = getVal(['Opening Stock', 'Stock', 'Stock Qty', 'Quantity', 'Opening Qty']);
        const pMin = getVal(['Minimum Stock', 'Reorder Level', 'Min Stock', 'Alert Stock']);
        const pSupplier = getVal(['Supplier Name', 'Vendor', 'Supplier']);
        let pStatus = getVal(['Status']);

        let status = 'Ready';
        
        // Validations
        if (!pName) status = 'Missing Product Name';
        else if (pSelling === undefined || isNaN(Number(pSelling))) status = 'Invalid Price';
        else if (pPurchase === undefined || isNaN(Number(pPurchase))) status = 'Invalid Price';
        else if (pOpening === undefined || isNaN(Number(pOpening))) status = 'Invalid Stock';
        
        if (!pCode) {
          pCode = `PRD-${String(products.length + index + 1).padStart(4, '0')}`;
        } else {
          // Check if exists
          if (products.some(p => p.code.toUpperCase() === String(pCode).toUpperCase())) {
            status = 'Already Exists';
          }
        }
        
        if (!pStatus) pStatus = 'Active';

        return {
          code: String(pCode),
          name: pName ? String(pName) : '',
          category: String(pCategory),
          gstRate: pGst !== undefined ? Number(pGst) : 12,
          sellingPrice: Number(pSelling) || 0,
          purchaseCost: Number(pPurchase) || 0,
          openingStock: Number(pOpening) || 0,
          minimumStock: pMin !== undefined ? Number(pMin) : 20,
          supplierName: pSupplier ? String(pSupplier) : '',
          status: pStatus,
          importStatus: status
        };
      });
      
      // Check duplicates within the file itself
      const codes = new Set();
      parsedData.forEach(p => {
        if (p.importStatus === 'Ready') {
          if (codes.has(p.code.toUpperCase())) {
            p.importStatus = 'Duplicate Product Code';
          } else {
            codes.add(p.code.toUpperCase());
          }
        }
      });

      setImportPreviewData(parsedData);
      setIsImportPreviewOpen(true);
      setImportSuccessMsg('');
    };
    reader.readAsBinaryString(file);
    // Reset file input
    e.target.value = '';
  };

  const handleImport = () => {
    const validProducts = importPreviewData.filter(p => p.importStatus === 'Ready');
    validProducts.forEach(p => {
      onAddProduct({
        code: p.code,
        name: p.name,
        category: p.category,
        sellingPrice: p.sellingPrice,
        purchaseCost: p.purchaseCost,
        gstRate: p.gstRate,
        openingStock: p.openingStock,
        minimumStock: p.minimumStock,
        supplierName: p.supplierName,
        status: p.status as 'Active' | 'Inactive'
      });
    });
    setImportSuccessMsg('Products imported successfully');
    setIsImportPreviewOpen(false);
    setTimeout(() => setImportSuccessMsg(''), 3000);
  };

  const downloadTemplate = () => {
    const headers = [
      'Product Code', 'Product Name', 'Category', 'GST Rate', 'Selling Price', 
      'Purchase Cost', 'Opening Stock', 'Minimum Stock', 'Supplier Name', 'Status'
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Product_Import_Template.csv");
  };

  // Categories extraction
  const categories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  // Helper to compute live stock levels for a product
  const getStockDetails = (product: Product) => {
    const soldQty = sales
      .filter(s => s.productCode === product.code)
      .reduce((sum, s) => sum + s.quantity, 0);
    
    const purchasedQty = expenses
      .filter(e => e.type === 'Purchase' && e.product === product.code)
      .reduce((sum, e) => sum + (e.quantity || 0), 0);

    const closingStock = product.openingStock + purchasedQty - soldQty;
    const isLow = closingStock <= product.minimumStock;

    return { soldQty, purchasedQty, closingStock, isLow };
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const { closingStock, isLow } = getStockDetails(p);
    
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    
    let matchesStockAlert = true;
    if (stockAlertFilter === 'Low Stock') {
      matchesStockAlert = isLow;
    } else if (stockAlertFilter === 'Healthy') {
      matchesStockAlert = !isLow;
    }

    return matchesSearch && matchesCategory && matchesStockAlert;
  });

  // Handle Edit Trigger
  const handleEdit = (product: Product) => {
    setIsEditing(true);
    setEditingCode(product.code);
    setFormCode(product.code);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormSellingPrice(product.sellingPrice);
    setFormPurchaseCost(product.purchaseCost);
    setFormGstRate(product.gstRate);
    setFormOpeningStock(product.openingStock);
    setFormMinimumStock(product.minimumStock);
    setFormSupplierName(product.supplierName);
    setFormStatus(product.status);
    setFormError('');
    
    // Smooth scroll to form
    document.getElementById('product-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset form
  const resetForm = () => {
    setIsEditing(false);
    setEditingCode('');
    setFormCode('');
    setFormName('');
    setFormCategory('');
    setFormSellingPrice(0);
    setFormPurchaseCost(0);
    setFormGstRate(12);
    setFormOpeningStock(100);
    setFormMinimumStock(20);
    setFormSupplierName('');
    setFormStatus('Active');
    setFormError('');
  };

  // Submit product
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formCode.trim()) {
      setFormError('Product Code is required.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Product Name is required.');
      return;
    }
    if (!formCategory.trim()) {
      setFormError('Category is required.');
      return;
    }
    if (formSellingPrice <= 0 || formPurchaseCost <= 0) {
      setFormError('Price and Cost must be greater than zero.');
      return;
    }

    // Check code duplication for new records
    if (!isEditing && products.some(p => p.code.toUpperCase() === formCode.toUpperCase())) {
      setFormError(`Product Code '${formCode}' already exists.`);
      return;
    }

    const payload: Product = {
      code: formCode.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory.trim(),
      sellingPrice: Number(formSellingPrice),
      purchaseCost: Number(formPurchaseCost),
      gstRate: Number(formGstRate),
      openingStock: Number(formOpeningStock),
      minimumStock: Number(formMinimumStock),
      supplierName: formSupplierName.trim(),
      status: formStatus
    };

    if (isEditing) {
      onUpdateProduct(payload);
    } else {
      onAddProduct(payload);
    }

    resetForm();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="products-screen">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Products & Inventory Control</h1>
          <p className="text-xs text-slate-500 mt-1">Configure opening balances, supplier sources, and monitor closing stocks dynamically.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1" id="product-form-card">
          
          {/* Import Section */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 mb-6">
            <h2 className="font-display font-semibold text-slate-900 text-base mb-1 flex items-center">
              Import Products from Excel
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload previous stock sheet, product list, or inventory file and import products automatically.
            </p>
            
            {importSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-md border border-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {importSuccessMsg}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <label className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-indigo-200">
                Upload Excel / CSV
                <input type="file" accept=".xlsx, .csv" className="hidden" onChange={handleFileUpload} />
              </label>
              <button
                type="button"
                onClick={() => importPreviewData.length > 0 && setIsImportPreviewOpen(!isImportPreviewOpen)}
                disabled={importPreviewData.length === 0}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Import
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold cursor-pointer"
              >
                Download Template
              </button>
            </div>

            {isImportPreviewOpen && importPreviewData.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
                  Preview Import
                  <span className="text-xs font-normal text-slate-500">{importPreviewData.length} total</span>
                </h3>
                
                <div className="flex flex-wrap gap-4 mb-4 text-xs font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="text-slate-600">Total Rows: <span className="font-bold text-slate-900">{importPreviewData.length}</span></div>
                  <div className="text-emerald-700">Ready to Import: <span className="font-bold">{importPreviewData.filter(p => p.importStatus === 'Ready').length}</span></div>
                  <div className="text-rose-600">Invalid Rows: <span className="font-bold">{importPreviewData.filter(p => p.importStatus !== 'Ready' && p.importStatus !== 'Duplicate Product Code' && p.importStatus !== 'Already Exists').length}</span></div>
                  <div className="text-amber-600">Duplicate Rows: <span className="font-bold">{importPreviewData.filter(p => p.importStatus === 'Duplicate Product Code' || p.importStatus === 'Already Exists').length}</span></div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-64 mb-4">
                  <table className="w-full text-left border-collapse text-[10px] whitespace-nowrap">
                    <thead className="bg-slate-50 sticky top-0 shadow-xs z-10">
                      <tr>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Product Code</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Product Name</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Category</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">GST Rate</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Selling Price</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Purchase Cost</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Opening Stock</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Min Stock</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Supplier Name</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Status</th>
                        <th className="p-2 border-b border-slate-200 font-semibold text-slate-600">Import Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importPreviewData.map((row, idx) => (
                        <tr key={idx} className={row.importStatus === 'Ready' ? 'bg-white' : 'bg-red-50/50'}>
                          <td className="p-2 font-mono text-slate-500">{row.code}</td>
                          <td className="p-2 font-semibold text-slate-800">{row.name}</td>
                          <td className="p-2 text-slate-600">{row.category}</td>
                          <td className="p-2 text-slate-600">{row.gstRate}%</td>
                          <td className="p-2 text-slate-600">{row.sellingPrice}</td>
                          <td className="p-2 text-slate-600">{row.purchaseCost}</td>
                          <td className="p-2 text-slate-600">{row.openingStock}</td>
                          <td className="p-2 text-slate-600">{row.minimumStock}</td>
                          <td className="p-2 text-slate-600">{row.supplierName}</td>
                          <td className="p-2 text-slate-600">{row.status}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${row.importStatus === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {row.importStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleImport}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer flex-1"
                  >
                    Import Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportPreviewOpen(false)}
                    className="px-4 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold cursor-pointer flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sticky top-6">
            <h2 className="font-display font-semibold text-slate-900 text-base mb-4 flex items-center">
              <PlusCircle className="w-5 h-5 mr-2 text-indigo-600" />
              {isEditing ? 'Edit Product Details' : 'Register New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Product Code *</label>
                <input
                  type="text"
                  placeholder="e.g. PRD-WEL-10"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500 font-mono uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Pure Aloe Vera Gel"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category *</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Category"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                  <datalist id="category-suggestions">
                    {categories.map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">GST Rate (%) *</label>
                  <select
                    value={formGstRate}
                    onChange={e => setFormGstRate(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="899"
                    value={formSellingPrice || ''}
                    onChange={e => setFormSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Cost (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="350"
                    value={formPurchaseCost || ''}
                    onChange={e => setFormPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Opening Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formOpeningStock}
                    onChange={e => setFormOpeningStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Minimum Stock Alert *</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinimumStock}
                    onChange={e => setFormMinimumStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Herbal Farms"
                  value={formSupplierName}
                  onChange={e => setFormSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-sm text-slate-900 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="form-status"
                      checked={formStatus === 'Active'}
                      onChange={() => setFormStatus('Active')}
                      className="mr-1.5 accent-indigo-600"
                    />
                    Active
                  </label>
                  <label className="flex items-center text-sm text-slate-900 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="form-status"
                      checked={formStatus === 'Inactive'}
                      onChange={() => setFormStatus('Inactive')}
                      className="mr-1.5 accent-indigo-600"
                    />
                    Inactive
                  </label>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {isEditing ? 'Update Product' : 'Register Product'}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3 py-2 border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by product name or unique code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={stockAlertFilter}
                onChange={e => setStockAlertFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
              >
                <option value="All">All Stocks</option>
                <option value="Low Stock">⚠️ Low Stock Only</option>
                <option value="Healthy">✓ Healthy Stock Only</option>
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Product details</th>
                    <th className="p-3 text-right">Cost / Sale</th>
                    <th className="p-3 text-center">Tax %</th>
                    <th className="p-3 text-right">Inflow Summary</th>
                    <th className="p-3 text-right">Closing Balance</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                        No products found matching the filters. Register a product to start!
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const { soldQty, purchasedQty, closingStock, isLow } = getStockDetails(p);
                      return (
                        <tr key={p.code} className={`hover:bg-slate-50/50 ${isLow ? 'bg-rose-50/20' : ''}`}>
                          <td className="p-3">
                            <div className="font-semibold text-sm text-slate-900">{p.name}</div>
                            <div className="flex gap-2 items-center mt-1 font-mono text-[10px] text-slate-400">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">{p.code}</span>
                              <span>Category: {p.category}</span>
                            </div>
                            {p.supplierName && (
                              <div className="text-[10px] text-slate-400 mt-0.5">Supplier: {p.supplierName}</div>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono">
                            <div className="text-slate-900 font-semibold">{formatINR(p.sellingPrice)}</div>
                            <div className="text-[10px] text-slate-400">Cost: {formatINR(p.purchaseCost)}</div>
                          </td>
                          <td className="p-3 text-center font-mono font-semibold text-slate-500">
                            {p.gstRate}%
                          </td>
                          <td className="p-3 text-right text-[10px] text-slate-500">
                            <div>Open: <span className="font-mono">{p.openingStock}</span></div>
                            <div>Purchased: <span className="font-mono text-emerald-700">+{purchasedQty}</span></div>
                            <div>Sold: <span className="font-mono text-rose-600">-{soldQty}</span></div>
                          </td>
                          <td className="p-3 text-right">
                            <div className={`font-mono text-sm font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {closingStock}
                            </div>
                            {isLow && (
                              <span className="inline-flex items-center gap-0.5 px-1 bg-rose-100 text-rose-800 rounded font-semibold text-[9px] mt-1">
                                <AlertCircle className="w-2.5 h-2.5" /> Low Stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(p)}
                                title="Edit Product"
                                className="p-1.5 hover:bg-slate-100 text-slate-600 rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${p.name}? This could affect calculations.`)) {
                                    onDeleteProduct(p.code);
                                  }
                                }}
                                title="Delete Product"
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

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  code: string; // Product Code (unique)
  name: string;
  category: string;
  sellingPrice: number;
  purchaseCost: number;
  gstRate: number; // e.g. 18 for 18%
  openingStock: number;
  minimumStock: number;
  supplierName: string;
  status: 'Active' | 'Inactive';
}

export interface SalesEntry {
  id: string;
  date: string; // YYYY-MM-DD
  orderId: string; // unique order reference
  customerName: string;
  customerPhone: string;
  customerGSTIN?: string;
  customerState: string; // used for CGST/SGST vs IGST check
  billingAddress: string;
  productCode: string;
  quantity: number;
  rate: number;
  discount: number;
  shippingCharge: number;
  gstRate: number; // percentage (e.g. 12, 18, 5)
  gstAmount: number; // calculated
  totalSales: number; // calculated
  paymentStatus: 'Paid' | 'Pending' | 'Partial' | 'Refunded';
  paymentReminderStatus?: 'Not Sent' | 'Reminder Sent' | 'Follow Up Required';
  invoiceNo?: string; // e.g., INV-2026-0001
}

export interface PaymentRecord {
  id: string;
  date: string;
  orderId: string;
  customerName: string;
  paymentMode: 'UPI' | 'Net Banking' | 'Credit Card' | 'Debit Card' | 'Cash' | 'Razorpay' | 'Other';
  grossAmount: number;
  gatewayCharges: number;
  netReceived: number; // Gross - Gateway
  bankReceivedDate: string;
  saleAmount: number; // from matching SalesEntry
  difference: number; // Gross Amount - Sale Amount
  matchStatus: 'Matched' | 'Unmatched' | 'Missing Order' | 'Partial' | 'Excess';
  transactionId?: string;
  remarks?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  type: 'Purchase' | 'Expense' | 'Refund' | 'Courier' | 'Packaging' | 'Bank Charge' | 'Marketing' | 'Salary' | 'Rent' | 'Other';
  supplierParty: string;
  product?: string;
  quantity?: number;
  rate?: number;
  gstRate: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Pending';
  category: string; // high-level categorization
  remarks?: string;
}

export interface Employee {
  id: string; // Employee ID
  name: string;
  role: string;
  department: string;
  joiningDate: string; // YYYY-MM-DD
  monthlySalary: number;
  bankAccount: string;
  upiId: string;
  status: 'Active' | 'Inactive';
}

export interface PayrollEntry {
  id: string;
  month: string; // YYYY-MM
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  incentives: number;
  overtime: number;
  advancePaid: number;
  deductions: number;
  netSalary: number; // Gross Salary - Advance Paid - Deductions
  paymentStatus: 'Pending' | 'Paid' | 'Partial';
  paymentDate: string; // YYYY-MM-DD or empty
  remarks?: string;
}

export interface CompanyProfile {
  businessName: string;
  businessState: string;
  businessGSTIN: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  authorizedSignatory: string;
}

export interface MonthlyReportPL {
  salesRevenue: number;
  discounts: number;
  netSales: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  gatewayCharges: number;
  courierCharges: number;
  packagingCharges: number;
  marketingCharges: number;
  salaryCharges: number;
  rentCharges: number;
  otherExpenses: number;
  netProfit: number;
}

export interface MonthlyReportBalanceSheet {
  cashBankBalance: number;
  accountsReceivable: number;
  closingStockValue: number;
  otherAssets: number;
  totalAssets: number;
  accountsPayable: number;
  gstPayable: number;
  loans: number;
  totalLiabilities: number;
  openingCapital: number;
  currentMonthProfitLoss: number;
  totalCapital: number;
  balanced: boolean;
}

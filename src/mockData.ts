/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, SalesEntry, PaymentRecord, ExpenseRecord, CompanyProfile } from './types';

export const defaultCompanyProfile: CompanyProfile = {
  businessName: "Rastafari Wellness",
  businessState: "Maharashtra",
  businessGSTIN: "27AAACP1234A1Z5",
  businessAddress: "102, Shanti Complex, Link Road, Bandra West, Mumbai, Maharashtra 400050",
  businessPhone: "+91 98765 43210",
  businessEmail: "finance@rastafariwellness.com",
  authorizedSignatory: "Suresh Mehta (Director of Finance)"
};

export const defaultProducts: Product[] = [];

export const defaultSales: SalesEntry[] = [];

export const defaultPayments: PaymentRecord[] = [];

export const defaultExpenses: ExpenseRecord[] = [];

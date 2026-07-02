/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, Save, Check } from 'lucide-react';

interface CompanyProfileScreenProps {
  companyProfile: CompanyProfile;
  onUpdateProfile: (profile: CompanyProfile) => void;
}

// Common Indian States
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

export default function CompanyProfileScreen({
  companyProfile,
  onUpdateProfile
}: CompanyProfileScreenProps) {
  
  const [name, setName] = useState(companyProfile.businessName);
  const [state, setState] = useState(companyProfile.businessState);
  const [gstin, setGstin] = useState(companyProfile.businessGSTIN);
  const [address, setAddress] = useState(companyProfile.businessAddress);
  const [phone, setPhone] = useState(companyProfile.businessPhone);
  const [email, setEmail] = useState(companyProfile.businessEmail);
  const [signatory, setSignatory] = useState(companyProfile.authorizedSignatory);
  
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      businessName: name.trim(),
      businessState: state,
      businessGSTIN: gstin.trim().toUpperCase(),
      businessAddress: address.trim(),
      businessPhone: phone.trim(),
      businessEmail: email.trim(),
      authorizedSignatory: signatory.trim()
    });
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-6 sm:p-8 rounded-xl shadow-xs space-y-6 animate-fade-in" id="company-profile-screen">
      
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Building2 className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-base font-display font-semibold text-slate-900">Business Identity & Compliance Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define your organization's GST jurisdiction, physical location, and authorized signature placeholders.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" /> Business profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Business Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">GSTIN Number *</label>
            <input
              type="text"
              value={gstin}
              onChange={e => setGstin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono font-bold uppercase"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">State Jurisdiction *</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              {INDIAN_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Authorized Signatory *</label>
            <input
              type="text"
              value={signatory}
              onChange={e => setSignatory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Physical Business Address *</label>
          <textarea
            value={address}
            onChange={e => setAddress(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed text-slate-900"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" /> Save Compliance Settings
        </button>
      </form>

    </div>
  );
}

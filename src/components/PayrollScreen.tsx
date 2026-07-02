/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Banknote, 
  PlusCircle, 
  Check, 
  Trash2, 
  UserPlus, 
  FileSpreadsheet, 
  AlertTriangle,
  FileText,
  Clock,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { Employee, PayrollEntry } from '../types';
import { formatINR } from '../utils/format';

interface PayrollScreenProps {
  employees: Employee[];
  payroll: PayrollEntry[];
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (updated: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onAddPayroll: (entry: PayrollEntry) => void;
  onUpdatePayroll: (updated: PayrollEntry) => void;
  onDeletePayroll: (id: string) => void;
}

export default function PayrollScreen({
  employees,
  payroll,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onAddPayroll,
  onUpdatePayroll,
  onDeletePayroll,
}: PayrollScreenProps) {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');

  // --- Employee Form State ---
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empJoiningDate, setEmpJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [empMonthlySalary, setEmpMonthlySalary] = useState('');
  const [empBankAccount, setEmpBankAccount] = useState('');
  const [empUpiId, setEmpUpiId] = useState('');
  const [empStatus, setEmpStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  // --- Payroll Form State ---
  const [payrollMonth, setPayrollMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('0');
  const [incentives, setIncentives] = useState('0');
  const [overtime, setOvertime] = useState('0');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partial'>('Pending');
  const [paymentDate, setPaymentDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);

  // --- Employee Filters & Search ---
  const [empSearch, setEmpSearch] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // --- Payroll Filters ---
  const [payMonthFilter, setPayMonthFilter] = useState('All');
  const [payStatusFilter, setPayStatusFilter] = useState<'All' | 'Pending' | 'Paid' | 'Partial'>('All');

  // Auto-generate ID helper for new employees
  const generateEmployeeId = () => {
    const count = employees.length + 1;
    return `EMP-${1000 + count}`;
  };

  // Pre-fill salary when employee is selected in payroll generation
  const handleEmployeeChangeForPayroll = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setBasicSalary(String(emp.monthlySalary));
    } else {
      setBasicSalary('');
    }
  };

  // --- Submit Handlers ---
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empMonthlySalary) {
      alert('Please fill out Name and Monthly Salary');
      return;
    }

    const finalId = editingEmployeeId || empId || generateEmployeeId();

    const empObj: Employee = {
      id: finalId,
      name: empName,
      role: empRole,
      department: empDept,
      joiningDate: empJoiningDate,
      monthlySalary: Number(empMonthlySalary),
      bankAccount: empBankAccount,
      upiId: empUpiId,
      status: empStatus
    };

    if (editingEmployeeId) {
      onUpdateEmployee(empObj);
      setEditingEmployeeId(null);
    } else {
      // Check for unique employee ID if user typed it
      if (employees.some(emp => emp.id === finalId)) {
        alert('Employee ID already exists. Please choose another or leave blank to auto-generate.');
        return;
      }
      onAddEmployee(empObj);
    }

    // Reset Form
    setEmpId('');
    setEmpName('');
    setEmpRole('');
    setEmpDept('');
    setEmpJoiningDate(new Date().toISOString().split('T')[0]);
    setEmpMonthlySalary('');
    setEmpBankAccount('');
    setEmpUpiId('');
    setEmpStatus('Active');
  };

  const handlePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !payrollMonth) {
      alert('Please select an Employee and a Month.');
      return;
    }

    const empObj = employees.find(emp => emp.id === selectedEmployeeId);
    if (!empObj) return;

    const basic = Number(basicSalary) || 0;
    const allow = Number(allowances) || 0;
    const inc = Number(incentives) || 0;
    const ot = Number(overtime) || 0;
    const adv = Number(advancePaid) || 0;
    const ded = Number(deductions) || 0;

    const gross = basic + allow + inc + ot;
    const net = gross - adv - ded;

    const payrollObj: PayrollEntry = {
      id: editingPayrollId || `PAY-${Date.now()}`,
      month: payrollMonth,
      employeeId: selectedEmployeeId,
      employeeName: empObj.name,
      basicSalary: basic,
      allowances: allow,
      incentives: inc,
      overtime: ot,
      advancePaid: adv,
      deductions: ded,
      netSalary: net,
      paymentStatus: paymentStatus,
      paymentDate: paymentStatus !== 'Pending' ? (paymentDate || new Date().toISOString().split('T')[0]) : '',
      remarks: remarks
    };

    if (editingPayrollId) {
      onUpdatePayroll(payrollObj);
      setEditingPayrollId(null);
    } else {
      onAddPayroll(payrollObj);
    }

    // Reset Form
    setSelectedEmployeeId('');
    setBasicSalary('');
    setAllowances('0');
    setIncentives('0');
    setOvertime('0');
    setAdvancePaid('0');
    setDeductions('0');
    setPaymentStatus('Pending');
    setPaymentDate('');
    setRemarks('');
  };

  const handleEditEmployee = (emp: Employee) => {
    setEditingEmployeeId(emp.id);
    setEmpId(emp.id);
    setEmpName(emp.name);
    setEmpRole(emp.role);
    setEmpDept(emp.department);
    setEmpJoiningDate(emp.joiningDate);
    setEmpMonthlySalary(String(emp.monthlySalary));
    setEmpBankAccount(emp.bankAccount);
    setEmpUpiId(emp.upiId);
    setEmpStatus(emp.status);
    setActiveTab('employees');
  };

  const handleEditPayroll = (pay: PayrollEntry) => {
    setEditingPayrollId(pay.id);
    setPayrollMonth(pay.month);
    setSelectedEmployeeId(pay.employeeId);
    setBasicSalary(String(pay.basicSalary));
    setAllowances(String(pay.allowances));
    setIncentives(String(pay.incentives));
    setOvertime(String(pay.overtime));
    setAdvancePaid(String(pay.advancePaid));
    setDeductions(String(pay.deductions));
    setPaymentStatus(pay.paymentStatus);
    setPaymentDate(pay.paymentDate);
    setRemarks(pay.remarks || '');
    setActiveTab('payroll');
  };

  // --- Compute Summary Cards Values ---
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  // Payroll figures calculated over the visible or entire payroll records
  const totalGrossSalary = payroll.reduce((sum, p) => sum + (p.basicSalary + p.allowances + p.incentives + p.overtime), 0);
  const totalDeductions = payroll.reduce((sum, p) => sum + p.deductions + p.advancePaid, 0);
  const totalNetSalaryPayable = payroll.reduce((sum, p) => sum + p.netSalary, 0);

  // Salary Paid and Pending calculation:
  // - Paid status: 100% of Net Salary is Paid
  // - Pending status: 100% of Net Salary is Pending
  // - Partial status: 50% is Paid, 50% is Pending
  const salaryPaid = payroll.reduce((sum, p) => {
    if (p.paymentStatus === 'Paid') return sum + p.netSalary;
    if (p.paymentStatus === 'Partial') return sum + (p.netSalary * 0.5);
    return sum;
  }, 0);

  const salaryPending = payroll.reduce((sum, p) => {
    if (p.paymentStatus === 'Pending') return sum + p.netSalary;
    if (p.paymentStatus === 'Partial') return sum + (p.netSalary * 0.5);
    return sum;
  }, 0);

  // --- Filtering lists ---
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(empSearch.toLowerCase()) || 
                          emp.id.toLowerCase().includes(empSearch.toLowerCase()) || 
                          emp.role.toLowerCase().includes(empSearch.toLowerCase()) ||
                          emp.department.toLowerCase().includes(empSearch.toLowerCase());
    const matchesStatus = empStatusFilter === 'All' || emp.status === empStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const uniqueMonths = Array.from(new Set(payroll.map(p => p.month))).sort((a, b) => b.localeCompare(a));

  const filteredPayroll = payroll.filter(pay => {
    const matchesMonth = payMonthFilter === 'All' || pay.month === payMonthFilter;
    const matchesStatus = payStatusFilter === 'All' || pay.paymentStatus === payStatusFilter;
    return matchesMonth && matchesStatus;
  });

  // Calculate gross and net for current state display before submit
  const liveBasic = Number(basicSalary) || 0;
  const liveAllow = Number(allowances) || 0;
  const liveInc = Number(incentives) || 0;
  const liveOt = Number(overtime) || 0;
  const liveAdv = Number(advancePaid) || 0;
  const liveDed = Number(deductions) || 0;
  const liveGross = liveBasic + liveAllow + liveInc + liveOt;
  const liveNet = liveGross - liveAdv - liveDed;

  return (
    <div className="space-y-6 animate-fade-in" id="payroll-screen">
      
      {/* Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-display font-semibold text-slate-900">Payroll & Salary Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Manage employee master directories, generate recurring payroll ledgers, and track salary operating disbursements.</p>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4" id="payroll-summary-grid">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</p>
          <p className="text-lg font-bold text-slate-800 mt-1">{totalEmployees}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Employees registered</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Staff</p>
          <p className="text-lg font-bold text-indigo-600 mt-1">{activeEmployees}</p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">On payroll duty</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Salary</p>
          <p className="text-lg font-mono font-bold text-slate-800 mt-1">{formatINR(totalGrossSalary)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Total wages accrued</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deductions</p>
          <p className="text-lg font-mono font-bold text-rose-700 mt-1">{formatINR(totalDeductions)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Advances & deductions</p>
        </div>

        <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Net Payable</p>
          <p className="text-lg font-mono font-bold text-indigo-900 mt-1">{formatINR(totalNetSalaryPayable)}</p>
          <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Net cash allocation</p>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Salary Paid</p>
          <p className="text-lg font-mono font-bold text-emerald-800 mt-1">{formatINR(salaryPaid)}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Included in expenses</p>
        </div>

        <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Salary Pending</p>
          <p className="text-lg font-mono font-bold text-amber-700 mt-1">{formatINR(salaryPending)}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Payroll payable</p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'employees' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Employee Master Directory
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'payroll' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Monthly Payroll Records
        </button>
      </div>

      {/* Grid Content for Employee Master Tab */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Employee Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sticky top-6">
              <h2 className="font-display font-semibold text-slate-900 text-sm mb-4 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-indigo-600" />
                {editingEmployeeId ? 'Edit Employee Profile' : 'Register New Employee'}
              </h2>

              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee ID</label>
                    <input
                      type="text"
                      placeholder="Auto-Generated"
                      value={empId}
                      onChange={e => setEmpId(e.target.value)}
                      disabled={!!editingEmployeeId}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                    <select
                      value={empStatus}
                      onChange={e => setEmpStatus(e.target.value as 'Active' | 'Inactive')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Employee Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role / Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Operations Exec"
                      value={empRole}
                      onChange={e => setEmpRole(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Warehouse"
                      value={empDept}
                      onChange={e => setEmpDept(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={empJoiningDate}
                      onChange={e => setEmpJoiningDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Monthly Salary (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={empMonthlySalary}
                      onChange={e => setEmpMonthlySalary(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                      required
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mt-2">Disbursement Details</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Bank Account No.</label>
                    <input
                      type="text"
                      placeholder="e.g. 5010023423..."
                      value={empBankAccount}
                      onChange={e => setEmpBankAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">UPI ID / PhonePe</label>
                    <input
                      type="text"
                      placeholder="e.g. rahul@okaxis"
                      value={empUpiId}
                      onChange={e => setEmpUpiId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {editingEmployeeId ? 'Update Employee' : 'Add Employee'}
                  </button>
                  {editingEmployeeId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEmployeeId(null);
                        setEmpId('');
                        setEmpName('');
                        setEmpRole('');
                        setEmpDept('');
                        setEmpMonthlySalary('');
                        setEmpBankAccount('');
                        setEmpUpiId('');
                        setEmpStatus('Active');
                      }}
                      className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Right: Employee List Table */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
              
              {/* Table search & filters */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Search by ID, name, role, department..."
                  value={empSearch}
                  onChange={e => setEmpSearch(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Duty Status:</span>
                  <select
                    value={empStatusFilter}
                    onChange={e => setEmpStatusFilter(e.target.value as any)}
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white font-semibold"
                  >
                    <option value="All">All Staff</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {filteredEmployees.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Users className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700">No employees added yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Add your first employee using the registration form to start managing your corporate payroll directory.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Employee Name</th>
                        <th className="py-2.5 px-3">Role & Dept</th>
                        <th className="py-2.5 px-3">Joined</th>
                        <th className="py-2.5 px-3 text-right">Base Salary</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredEmployees.map(emp => (
                        <tr key={emp.id} className="hover:bg-slate-50/40 text-xs">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{emp.id}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{emp.name}</div>
                            {emp.bankAccount || emp.upiId ? (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">
                                {emp.upiId ? emp.upiId : `A/C: ${emp.bankAccount}`}
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-slate-700">{emp.role || 'Unspecified'}</div>
                            <div className="text-[10px] text-slate-400 font-semibold uppercase">{emp.department || 'Operations'}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500">{emp.joiningDate}</td>
                          <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                            {formatINR(emp.monthlySalary)}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              emp.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                : 'bg-slate-50 text-slate-500 border border-slate-100'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => handleEditEmployee(emp)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Edit profile"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${emp.name}?`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                title="Delete profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Grid Content for Monthly Payroll Records Tab */}
      {activeTab === 'payroll' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Payroll Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 sticky top-6">
              <h2 className="font-display font-semibold text-slate-900 text-sm mb-4 flex items-center">
                <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
                {editingPayrollId ? 'Edit Payroll Receipt' : 'Generate Monthly Payroll'}
              </h2>

              {employees.filter(e => e.status === 'Active').length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-lg space-y-2">
                  <div className="flex items-start gap-2 font-semibold">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                    <span>No Active Employees Available</span>
                  </div>
                  <p>You cannot log monthly payroll records until you have registered at least one active employee in the Master Directory.</p>
                  <button
                    onClick={() => setActiveTab('employees')}
                    className="font-bold underline text-indigo-700 block mt-1"
                  >
                    Go register an employee &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePayrollSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payroll Month *</label>
                      <input
                        type="month"
                        value={payrollMonth}
                        onChange={e => setPayrollMonth(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Disburse Status</label>
                      <select
                        value={paymentStatus}
                        onChange={e => setPaymentStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid (Full)</option>
                        <option value="Partial">Partial (50% Split)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Employee *</label>
                    <select
                      value={selectedEmployeeId}
                      onChange={e => handleEmployeeChangeForPayroll(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                      required
                    >
                      <option value="">-- Choose Active Employee --</option>
                      {employees.filter(e => e.status === 'Active').map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role || 'Staff'}) — Base: ₹{emp.monthlySalary}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Basic Salary (₹)</label>
                      <input
                        type="number"
                        value={basicSalary}
                        onChange={e => setBasicSalary(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 font-mono focus:outline-none"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Overtime Pay (₹)</label>
                      <input
                        type="number"
                        value={overtime}
                        onChange={e => setOvertime(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Allowances (₹)</label>
                      <input
                        type="number"
                        value={allowances}
                        onChange={e => setAllowances(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                        placeholder="0"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Incentives (₹)</label>
                      <input
                        type="number"
                        value={incentives}
                        onChange={e => setIncentives(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Advance Paid (₹)</label>
                      <input
                        type="number"
                        value={advancePaid}
                        onChange={e => setAdvancePaid(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                        placeholder="0"
                        min={0}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Deductions (₹)</label>
                      <input
                        type="number"
                        value={deductions}
                        onChange={e => setDeductions(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                        placeholder="0"
                        min={0}
                      />
                    </div>
                  </div>

                  {paymentStatus !== 'Pending' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-mono focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remarks / Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. June Perf Bonus included"
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none"
                    />
                  </div>

                  {/* Calculations breakdown banner */}
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-[11px] space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-500">
                      <span>Gross Salary:</span>
                      <span className="font-bold text-slate-800">₹{liveGross.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Advances/Deds:</span>
                      <span className="font-bold text-rose-700">- ₹{(liveAdv + liveDed).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-xs">
                      <span className="font-bold text-indigo-800">Net Salary:</span>
                      <span className="font-bold text-indigo-900">₹{liveNet.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {editingPayrollId ? 'Update Receipt' : 'Generate Ledger'}
                    </button>
                    {editingPayrollId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPayrollId(null);
                          setSelectedEmployeeId('');
                          setBasicSalary('');
                          setAllowances('0');
                          setIncentives('0');
                          setOvertime('0');
                          setAdvancePaid('0');
                          setDeductions('0');
                          setPaymentStatus('Pending');
                          setPaymentDate('');
                          setRemarks('');
                        }}
                        className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: Payroll entries table */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5">
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Month:</span>
                  <select
                    value={payMonthFilter}
                    onChange={e => setPayMonthFilter(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white font-semibold"
                  >
                    <option value="All">All Months</option>
                    {uniqueMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Disbursement:</span>
                  <select
                    value={payStatusFilter}
                    onChange={e => setPayStatusFilter(e.target.value as any)}
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs bg-white font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>

              {filteredPayroll.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FileText className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700">No payroll generated yet.</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Choose an active employee on the left to compute and append a payroll entry into the ledger database.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Employee</th>
                        <th className="py-2.5 px-3 text-right">Gross</th>
                        <th className="py-2.5 px-3 text-right">Deductions</th>
                        <th className="py-2.5 px-3 text-right">Net Salary</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayroll.map(pay => {
                        const gross = pay.basicSalary + pay.allowances + pay.incentives + pay.overtime;
                        const ded = pay.deductions + pay.advancePaid;
                        return (
                          <tr key={pay.id} className="hover:bg-slate-50/40 text-xs">
                            <td className="py-3 px-3 font-mono font-bold text-slate-600">{pay.month}</td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800">{pay.employeeName}</div>
                              {pay.remarks && (
                                <div className="text-[10px] text-slate-400 mt-0.5 max-w-[140px] truncate" title={pay.remarks}>
                                  {pay.remarks}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-slate-600">
                              {formatINR(gross)}
                            </td>
                            <td className="py-3 px-3 text-right font-mono text-rose-600">
                              {ded > 0 ? `-${formatINR(ded)}` : '₹0.00'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                              {formatINR(pay.netSalary)}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                pay.paymentStatus === 'Paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : pay.paymentStatus === 'Partial'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {pay.paymentStatus}
                              </span>
                              {pay.paymentDate && (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  {pay.paymentDate}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => handleEditPayroll(pay)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Edit payroll entry"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete this payroll entry?`)) {
                                      onDeletePayroll(pay.id);
                                    }
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete payroll entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

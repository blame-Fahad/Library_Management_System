import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  Clock,
  Settings,
  Download,
  Filter,
  Check,
  RotateCcw,
} from 'lucide-react';

export const OverdueFineView: React.FC = () => {
  const { borrows, fineSettings, updateFineSettings, payFine, waiveFine } = useLibrary();

  const [fineFilter, setFineFilter] = useState<'all' | 'unpaid' | 'paid' | 'waived'>('unpaid');
  const [finePerDayInput, setFinePerDayInput] = useState(fineSettings.finePerDay);
  const [durationInput, setDurationInput] = useState(fineSettings.borrowDurationDays);
  const [maxBooksInput, setMaxBooksInput] = useState(fineSettings.maxBooksPerStudent);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // All records with fine or overdue status
  const fineRecords = borrows.filter(
    (b) => b.fineAmount > 0 || b.status === 'overdue' || b.fineStatus !== 'none'
  );

  const filteredRecords = fineRecords.filter((b) => {
    if (fineFilter === 'unpaid') return b.fineStatus === 'unpaid';
    if (fineFilter === 'paid') return b.fineStatus === 'paid';
    if (fineFilter === 'waived') return b.fineStatus === 'waived';
    return true;
  });

  // Aggregated totals
  const totalUnpaid = fineRecords
    .filter((b) => b.fineStatus === 'unpaid')
    .reduce((acc, b) => acc + b.fineAmount, 0);

  const totalPaid = fineRecords
    .filter((b) => b.fineStatus === 'paid')
    .reduce((acc, b) => acc + b.fineAmount, 0);

  const totalWaived = fineRecords
    .filter((b) => b.fineStatus === 'waived')
    .reduce((acc, b) => acc + b.fineAmount, 0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFineSettings({
      finePerDay: Number(finePerDayInput),
      borrowDurationDays: Number(durationInput),
      maxBooksPerStudent: Number(maxBooksInput),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const exportToCsv = () => {
    const headers = ['Record ID,Student Name,Student ID,Book Title,Issue Date,Due Date,Return Date,Overdue Days,Fine Amount (BDT),Fine Status'];
    const rows = fineRecords.map((r) =>
      `"${r.id}","${r.studentName}","${r.studentId}","${r.bookTitle}","${r.issueDate}","${r.dueDate}","${r.returnDate || 'Not Returned'}","${r.overdueDays}","${r.fineAmount}","${r.fineStatus}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_overdue_fines_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Automated Overdue Recovery</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
            Overdue Tracking & Fine Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fine computation based on scheduled due dates ({fineSettings.finePerDay} {fineSettings.currency}/day). Collect, waive, or audit dues.
          </p>
        </div>

        <button
          onClick={exportToCsv}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Fine Report (CSV)</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Unpaid Fines */}
        <div className="bg-rose-50/70 border border-rose-200/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Total Unpaid Dues</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">
            {totalUnpaid} <span className="text-xs font-bold text-rose-500">{fineSettings.currency}</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1">
            From {fineRecords.filter((b) => b.fineStatus === 'unpaid').length} overdue loans
          </p>
        </div>

        {/* Collected Fines */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Total Fines Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {totalPaid} <span className="text-xs font-bold text-emerald-500">{fineSettings.currency}</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            Deposited into library development fund
          </p>
        </div>

        {/* Waived Fines */}
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Waived Fines</span>
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800">
            {totalWaived} <span className="text-xs font-bold text-slate-500">{fineSettings.currency}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Authorized administrative exemptions
          </p>
        </div>
      </div>

      {/* Main Table with Filter Tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFineFilter('unpaid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                fineFilter === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unpaid Dues ({fineRecords.filter((b) => b.fineStatus === 'unpaid').length})
            </button>
            <button
              onClick={() => setFineFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                fineFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({fineRecords.length})
            </button>
            <button
              onClick={() => setFineFilter('paid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                fineFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid ({fineRecords.filter((b) => b.fineStatus === 'paid').length})
            </button>
            <button
              onClick={() => setFineFilter('waived')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                fineFilter === 'waived'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Waived ({fineRecords.filter((b) => b.fineStatus === 'waived').length})
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Fine Rate: {fineSettings.finePerDay} {fineSettings.currency}/day
          </span>
        </div>

        {/* Overdue Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Student Borrower</th>
                <th className="px-4 py-3">Book Details</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Days Overdue</th>
                <th className="px-4 py-3">Calculated Fine</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No overdue or fine records match this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{rec.studentName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{rec.studentId}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        <div className="font-medium text-slate-800 truncate">{rec.bookTitle}</div>
                        <div className="text-[11px] font-mono text-slate-400">Issue: {rec.issueDate}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-rose-600">
                        {rec.dueDate}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600">
                        {rec.overdueDays} days late
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                        {rec.fineAmount} {fineSettings.currency}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                            rec.fineStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.fineStatus === 'waived'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-rose-100 text-rose-800 animate-pulse'
                          }`}
                        >
                          {rec.fineStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {rec.fineStatus === 'unpaid' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => payFine(rec.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs"
                            >
                              Collect Paid
                            </button>
                            <button
                              onClick={() => waiveFine(rec.id)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-semibold text-xs cursor-pointer"
                            >
                              Waive
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Settings Editor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Circulation & Fine Policy Rules</h3>
          </div>
          {settingsSaved && (
            <span className="text-emerald-600 text-xs font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>Policy updated & recalculated!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Daily Overdue Fine Rate ({fineSettings.currency})
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={finePerDayInput}
              onChange={(e) => setFinePerDayInput(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: 5 BDT per overdue day</p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Standard Loan Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={durationInput}
              onChange={(e) => setDurationInput(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: 14 days academic loan</p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Max Books Allowed Per Student
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxBooksInput}
              onChange={(e) => setMaxBooksInput(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default: 3 concurrent items</p>
          </div>

          <div className="sm:col-span-3 pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Apply & Update System Rules
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

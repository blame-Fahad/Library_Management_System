import React from 'react';
import { useLibrary } from '../context/LibraryContext';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Users,
  CheckCircle2,
  DollarSign,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  onOpenIssueModal: () => void;
  onOpenReturnModal: () => void;
  onOpenAddBookModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenIssueModal,
  onOpenReturnModal,
  onOpenAddBookModal,
}) => {
  const { books, borrows, students, stats, fineSettings, activityLogs } = useLibrary();

  // Find active overdue records
  const overdueRecords = borrows.filter((b) => b.status === 'overdue');

  // Compute category distribution
  const categoryCounts = books.reduce<Record<string, number>>((acc, book) => {
    acc[book.category] = (acc[book.category] || 0) + book.totalCopies;
    return acc;
  }, {});

  const totalCopies = stats.totalVolumes || 1;
  const categoriesSorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Library Management & Automation</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Library Operations Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Track circulation, book availability, automated overdue fines ({fineSettings.finePerDay} {fineSettings.currency}/day), and provide AI-powered student recommendations.
            </p>
          </div>

          {/* Quick Counter Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenIssueModal}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-102"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Issue Book</span>
            </button>
            <button
              onClick={onOpenReturnModal}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-102"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Return Book</span>
            </button>
            <button
              onClick={onOpenAddBookModal}
              className="flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium backdrop-blur-xs transition-all cursor-pointer"
            >
              <span>+ Add Book</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner if any overdue books exist */}
      {overdueRecords.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-700 mt-0.5">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  {overdueRecords.length} Borrowed Books Are Currently Overdue
                </h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Overdue fine is calculated automatically at {fineSettings.finePerDay} {fineSettings.currency}/day.
                  Total accumulated overdue fines: <strong className="text-amber-900">{stats.totalUnpaidFines} {fineSettings.currency}</strong>.
                </p>
                
                {/* Mini overdue preview list */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {overdueRecords.slice(0, 3).map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white/90 border border-amber-300/80 rounded-lg px-2.5 py-1 text-xs flex items-center space-x-2 text-slate-800"
                    >
                      <span className="font-semibold text-slate-900">{rec.studentName}</span>
                      <span className="text-slate-400">•</span>
                      <span className="truncate max-w-[150px] text-slate-600 italic">"{rec.bookTitle}"</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-rose-600 font-bold">{rec.overdueDays}d late ({rec.fineAmount} {fineSettings.currency})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('overdue-fines')}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap ml-4"
            >
              Manage Overdue & Fines →
            </button>
          </div>
        </div>
      )}

      {/* Key Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Volumes & Titles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Catalog</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.totalVolumes}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Across <strong className="text-slate-700">{stats.totalTitles}</strong> distinct titles
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Availability</span>
            <span className="font-semibold text-emerald-600">
              {Math.round((stats.availableVolumes / totalCopies) * 100)}% on shelf
            </span>
          </div>
        </div>

        {/* Currently Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Currently Borrowed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.issuedVolumes}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active loans with students
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Available to issue</span>
            <span className="font-semibold text-slate-800">{stats.availableVolumes} copies</span>
          </div>
        </div>

        {/* Overdue Loans & Fine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Overdue Loans</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-600">{stats.overdueCount}</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unpaid Fines: <strong className="text-rose-600">{stats.totalUnpaidFines} {fineSettings.currency}</strong>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Fine rate</span>
            <span className="font-medium text-slate-700">{fineSettings.finePerDay} {fineSettings.currency}/day</span>
          </div>
        </div>

        {/* Fines Collected & Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Fines Collected</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats.totalFinesCollected} <span className="text-xs font-semibold text-slate-500">{fineSettings.currency}</span></div>
            <p className="text-xs text-slate-500 mt-0.5">
              From resolved late returns
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Registered students</span>
            <span className="font-semibold text-slate-800">{students.length} active</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Category Distribution & Recent Circulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Category Breakdown & Shelf Map */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Collections by Category</h3>
            </div>
            <span className="text-[11px] text-slate-400">{categoriesSorted.length} categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {categoriesSorted.slice(0, 6).map(([cat, count]) => {
              const pct = Math.round((count / totalCopies) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{cat}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{count} copies ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('catalog')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Explore Full Library Catalog →
            </button>
          </div>
        </div>

        {/* Right Column: Live Activity Feed */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Recent Circulation & Activity Logs</h3>
            </div>
            <button
              onClick={() => setActiveTab('issue-return')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Counter Operations →
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto pr-1">
            {activityLogs.slice(0, 7).map((log) => {
              const isIssue = log.action === 'ISSUE';
              const isReturn = log.action === 'RETURN';
              const isFine = log.action === 'FINE_PAID' || log.action === 'FINE_WAIVED';

              return (
                <div key={log.id} className="py-3 flex items-start space-x-3 text-xs">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isIssue
                        ? 'bg-indigo-50 text-indigo-600'
                        : isReturn
                        ? 'bg-emerald-50 text-emerald-600'
                        : isFine
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    {isIssue && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {isReturn && <ArrowDownLeft className="w-3.5 h-3.5" />}
                    {isFine && <DollarSign className="w-3.5 h-3.5" />}
                    {!isIssue && !isReturn && !isFine && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium leading-snug">{log.description}</p>
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-400">
                      <span>{log.timestamp}</span>
                      <span>•</span>
                      <span>By {log.actor}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

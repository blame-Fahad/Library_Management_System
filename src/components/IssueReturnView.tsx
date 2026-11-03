import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, Student, BorrowRecord } from '../types/library';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Scan,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Printer,
  FileText,
  User,
  BookOpen,
  MapPin,
  Clock,
} from 'lucide-react';

interface IssueReturnViewProps {
  preselectedBookId?: string | null;
  onClearPreselectedBook?: () => void;
}

export const IssueReturnView: React.FC<IssueReturnViewProps> = ({
  preselectedBookId,
  onClearPreselectedBook,
}) => {
  const {
    books,
    students,
    borrows,
    fineSettings,
    issueBook,
    returnBook,
    payFine,
  } = useLibrary();

  const [activeTab, setActiveTab] = useState<'issue' | 'return'>('issue');

  // Issue Form State
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [borrowDays, setBorrowDays] = useState<number>(fineSettings.borrowDurationDays || 14);
  const [librarianName, setLibrarianName] = useState<string>('Prof. Shamsul Alam');
  const [issueResult, setIssueResult] = useState<{ success: boolean; message: string; record?: BorrowRecord } | null>(null);

  // Return Form State
  const [returnSearch, setReturnSearch] = useState('');
  const [selectedBorrowForReturn, setSelectedBorrowForReturn] = useState<BorrowRecord | null>(null);
  const [bookCondition, setBookCondition] = useState<'Good' | 'Damaged' | 'Minor Wear'>('Good');
  const [fineSettlement, setFineSettlement] = useState<'pay_now' | 'unpaid' | 'waive'>('pay_now');
  const [returnResult, setReturnResult] = useState<{ success: boolean; message: string; fineAmount: number } | null>(null);

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<{
    type: 'ISSUE' | 'RETURN';
    record: BorrowRecord;
  } | null>(null);

  // Barcode quick simulation scanner
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannedInput, setScannedInput] = useState('');

  // Selected entities
  const selectedBook = books.find((b) => b.id === selectedBookId);
  const selectedStudent = students.find((s) => s.studentId === selectedStudentId);

  // Active loans for selected student
  const studentActiveLoans = selectedStudent
    ? borrows.filter((b) => b.studentId === selectedStudent.studentId && (b.status === 'active' || b.status === 'overdue'))
    : [];

  // Active loans for Return tab
  const activeLoansList = borrows.filter((b) => b.status === 'active' || b.status === 'overdue');
  const filteredReturnList = activeLoansList.filter(
    (b) =>
      b.studentName.toLowerCase().includes(returnSearch.toLowerCase()) ||
      b.studentId.toLowerCase().includes(returnSearch.toLowerCase()) ||
      b.bookTitle.toLowerCase().includes(returnSearch.toLowerCase()) ||
      b.bookIsbn.includes(returnSearch)
  );

  // Handle Issue
  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedStudentId) {
      setIssueResult({ success: false, message: 'Please select both a book and a student.' });
      return;
    }

    const res = issueBook({
      bookId: selectedBookId,
      studentId: selectedStudentId,
      borrowDurationDays: borrowDays,
      librarianName,
    });

    setIssueResult(res);
    if (res.success && res.record) {
      setActiveReceipt({ type: 'ISSUE', record: res.record });
      // Reset form
      setSelectedBookId('');
      if (onClearPreselectedBook) onClearPreselectedBook();
    }
  };

  // Handle Return Confirm
  const handleConfirmReturn = () => {
    if (!selectedBorrowForReturn) return;

    const res = returnBook({
      borrowRecordId: selectedBorrowForReturn.id,
      condition: bookCondition,
      fineSettlement,
    });

    setReturnResult(res);
    if (res.success) {
      setActiveReceipt({
        type: 'RETURN',
        record: {
          ...selectedBorrowForReturn,
          returnDate: new Date().toISOString().split('T')[0],
          returnedCondition: bookCondition,
          fineStatus: selectedBorrowForReturn.fineAmount > 0
            ? fineSettlement === 'pay_now'
              ? 'paid'
              : fineSettlement === 'waive'
              ? 'waived'
              : 'unpaid'
            : 'none',
        },
      });
      setSelectedBorrowForReturn(null);
    }
  };

  // Scanner Simulator
  const handleSimulateScan = (value: string, type: 'book' | 'student') => {
    if (type === 'book') {
      setSelectedBookId(value);
      setActiveTab('issue');
    } else {
      setSelectedStudentId(value);
      setActiveTab('issue');
    }
    setShowScannerModal(false);
  };

  // Due Date calculation preview
  const previewDueDate = new Date();
  previewDueDate.setDate(previewDueDate.getDate() + Number(borrowDays));
  const previewDueDateStr = previewDueDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Top Tabs & Scanner Launcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('issue')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'issue'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Book to Student</span>
          </button>
          <button
            onClick={() => setActiveTab('return')}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'return'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Receive Book Return</span>
            {borrows.filter((b) => b.status === 'overdue').length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                !
              </span>
            )}
          </button>
        </div>

        {/* Barcode Simulator Button */}
        <button
          onClick={() => setShowScannerModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer w-full sm:w-auto justify-center"
        >
          <Scan className="w-4 h-4 text-indigo-600" />
          <span>Simulate Barcode / QR Scan</span>
        </button>
      </div>

      {/* ISSUE TAB CONTENT */}
      {activeTab === 'issue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Issue Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Issue Book Counter</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select an available book title and a registered student ID to issue physical volume.
              </p>
            </div>

            {issueResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  issueResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <span>{issueResult.message}</span>
                <button onClick={() => setIssueResult(null)} className="text-slate-400">✕</button>
              </div>
            )}

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              {/* Select Book */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. Select Book to Issue *
                </label>
                <select
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-xs"
                >
                  <option value="">-- Choose Book Title ({books.filter(b => b.availableCopies > 0).length} in stock) --</option>
                  {books.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={b.availableCopies <= 0}
                    >
                      {b.title} — [{b.category}] ({b.availableCopies}/{b.totalCopies} available) • {b.shelfLocation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Student */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  2. Select Student (Borrower) *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none text-xs"
                >
                  <option value="">-- Choose Registered Student --</option>
                  {students.map((st) => {
                    const activeCount = borrows.filter(
                      (b) => b.studentId === st.studentId && (b.status === 'active' || b.status === 'overdue')
                    ).length;
                    return (
                      <option
                        key={st.id}
                        value={st.studentId}
                        disabled={st.cardStatus !== 'active' || activeCount >= st.maxAllowedBooks}
                      >
                        {st.name} ({st.studentId}) • {st.department} • [{activeCount}/{st.maxAllowedBooks} borrowed] {st.cardStatus !== 'active' ? `(${st.cardStatus})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Loan Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Loan Duration (Days)
                  </label>
                  <select
                    value={borrowDays}
                    onChange={(e) => setBorrowDays(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  >
                    <option value={7}>7 Days (Short Loan)</option>
                    <option value={14}>14 Days (Standard Academic Loan)</option>
                    <option value={21}>21 Days (Extended Research)</option>
                    <option value={30}>30 Days (Semester Special)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Librarian On Duty
                  </label>
                  <input
                    type="text"
                    value={librarianName}
                    onChange={(e) => setLibrarianName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Scheduled Return Deadline:</span>
                  <span className="font-bold text-slate-900 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{previewDueDateStr}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Overdue Fine Policy:</span>
                  <span className="font-medium text-slate-700">
                    {fineSettings.finePerDay} {fineSettings.currency} per day after deadline
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!selectedBookId || !selectedStudentId}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Issue Book & Generate Official Slip</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Preview Card: Student & Book Verification */}
          <div className="space-y-4">
            {/* Book Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Book Verification</h4>
              {selectedBook ? (
                <div className="flex space-x-3">
                  <img
                    src={selectedBook.coverImage}
                    alt={selectedBook.title}
                    className="w-16 h-22 object-cover rounded-lg shadow-xs shrink-0"
                  />
                  <div className="text-xs">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {selectedBook.category}
                    </span>
                    <h5 className="font-bold text-slate-900 mt-1 line-clamp-2">{selectedBook.title}</h5>
                    <p className="text-slate-500 mt-0.5 text-[11px]">{selectedBook.author}</p>
                    <div className="mt-2 text-[11px] text-slate-700 font-mono flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      <span>{selectedBook.shelfLocation}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                      {selectedBook.availableCopies} of {selectedBook.totalCopies} left
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Select a book from the form to verify shelf location and stock.
                </div>
              )}
            </div>

            {/* Student Preview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Student Borrowing Status</h4>
              {selectedStudent ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3">
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h5 className="font-bold text-slate-900">{selectedStudent.name}</h5>
                      <p className="text-slate-500 text-[11px] font-mono">{selectedStudent.studentId}</p>
                      <p className="text-slate-500 text-[10px]">{selectedStudent.department}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Active Borrow Limit:</span>
                    <span className="font-bold text-slate-800">
                      {studentActiveLoans.length} of {selectedStudent.maxAllowedBooks} Books
                    </span>
                  </div>

                  {studentActiveLoans.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-slate-600 block">Currently Holding:</span>
                      {studentActiveLoans.map((l) => (
                        <div
                          key={l.id}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px]"
                        >
                          <p className="font-semibold text-slate-800 truncate">{l.bookTitle}</p>
                          <p className="text-slate-400 text-[10px] flex items-center justify-between mt-0.5">
                            <span>Due: {l.dueDate}</span>
                            {l.status === 'overdue' && (
                              <span className="text-rose-600 font-bold">
                                {l.overdueDays}d overdue ({l.fineAmount} BDT)
                              </span>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Select a student to check active loans and quota limits.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RETURN TAB CONTENT */}
      {activeTab === 'return' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <span>Return Book & Fine Clearance</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect returned books, verify condition, and automatically calculate overdue fines.
              </p>
            </div>

            {/* Filter Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student ID, name, book..."
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
              />
            </div>
          </div>

          {returnResult && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                returnResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <span>{returnResult.message}</span>
              <button onClick={() => setReturnResult(null)} className="text-slate-400">✕</button>
            </div>
          )}

          {/* Active Loans Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Overdue Days</th>
                  <th className="px-4 py-3">Fine (BDT)</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReturnList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-xs">
                      No active borrowed books match your search.
                    </td>
                  </tr>
                ) : (
                  filteredReturnList.map((loan) => {
                    const isOverdue = loan.status === 'overdue' || loan.overdueDays > 0;
                    return (
                      <tr
                        key={loan.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isOverdue ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div>{loan.studentName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{loan.studentId}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                          <div>{loan.bookTitle}</div>
                          <div className="text-[11px] font-mono text-slate-400">{loan.bookIsbn}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{loan.issueDate}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-semibold ${
                              isOverdue ? 'text-rose-600' : 'text-slate-700'
                            }`}
                          >
                            {loan.dueDate}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-100 text-rose-700 flex items-center space-x-1 w-max">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{loan.overdueDays} days late</span>
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">On Track</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono">
                          {loan.fineAmount > 0 ? (
                            <span className="text-rose-600">
                              {loan.fineAmount} {fineSettings.currency}
                            </span>
                          ) : (
                            <span className="text-slate-400">0 BDT</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedBorrowForReturn(loan)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            Receive Return
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
      )}

      {/* Return Confirmation Modal */}
      {selectedBorrowForReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Process Book Return</span>
              </h4>
              <button
                onClick={() => setSelectedBorrowForReturn(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <p className="text-slate-400 text-[11px]">Book Returning:</p>
                <p className="font-bold text-slate-900 text-sm">{selectedBorrowForReturn.bookTitle}</p>
                <p className="text-slate-600">Borrower: {selectedBorrowForReturn.studentName} ({selectedBorrowForReturn.studentId})</p>
                <p className="text-slate-500 text-[11px]">Due Date: {selectedBorrowForReturn.dueDate}</p>
              </div>

              {/* Overdue Calculation Notice */}
              {selectedBorrowForReturn.fineAmount > 0 ? (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Overdue Return Detected</span>
                  </div>
                  <p className="text-xs text-rose-800">
                    Book is <strong>{selectedBorrowForReturn.overdueDays} days</strong> late.
                    Rate: {fineSettings.finePerDay} {fineSettings.currency}/day.
                  </p>
                  <p className="text-sm font-extrabold text-rose-700">
                    Calculated Overdue Fine: {selectedBorrowForReturn.fineAmount} {fineSettings.currency}
                  </p>

                  <div className="pt-2">
                    <label className="font-semibold block mb-1 text-[11px] text-slate-700">Fine Settlement Method:</label>
                    <select
                      value={fineSettlement}
                      onChange={(e) => setFineSettlement(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="pay_now">Collect Fine Now ({selectedBorrowForReturn.fineAmount} BDT - Paid)</option>
                      <option value="unpaid">Record as Unpaid Due on Student Record</option>
                      <option value="waive">Waive Fine (Administrative Exemption)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Returned on time! Zero fine applicable.</span>
                </div>
              )}

              {/* Physical Condition */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Book Physical Condition:</label>
                <select
                  value={bookCondition}
                  onChange={(e) => setBookCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Good">Good (Ready for shelf)</option>
                  <option value="Minor Wear">Minor Wear (Acceptable)</option>
                  <option value="Damaged">Damaged / Missing Pages (Needs repair)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setSelectedBorrowForReturn(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Complete Return & Restore Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Transaction Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 printable-card">
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white mx-auto flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                Smart Central Library
              </h3>
              <p className="text-[10px] text-slate-400">Circulation Department • Digital Slip</p>
            </div>

            <div className="py-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Transaction Type:</span>
                <span className="font-bold text-slate-900">{activeReceipt.type} SLIP</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Slip Reference:</span>
                <span className="font-mono text-slate-800">{activeReceipt.record.id}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Student Name:</span>
                <span className="font-semibold text-slate-800">{activeReceipt.record.studentName}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Student ID:</span>
                <span className="font-mono font-bold text-slate-800">{activeReceipt.record.studentId}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Book Title:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[160px]">
                  {activeReceipt.record.bookTitle}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Issue Date:</span>
                <span className="text-slate-800">{activeReceipt.record.issueDate}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Due Date:</span>
                <span className="font-bold text-indigo-700">{activeReceipt.record.dueDate}</span>
              </div>

              {activeReceipt.type === 'RETURN' && (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Return Date:</span>
                    <span className="text-slate-800">{activeReceipt.record.returnDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Fine Settled:</span>
                    <span className="font-bold text-emerald-700">
                      {activeReceipt.record.fineAmount} {fineSettings.currency} ({activeReceipt.record.fineStatus})
                    </span>
                  </div>
                </>
              )}

              {/* Barcode graphic simulation */}
              <div className="pt-3 border-t border-dashed border-slate-200 text-center">
                <div className="flex justify-center space-x-1 py-1 font-mono tracking-widest text-[9px] text-slate-400">
                  ||||| | |||| ||| |||| | ||||| || |||
                </div>
                <p className="text-[10px] font-mono text-slate-500">{activeReceipt.record.bookIsbn}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Simulator Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Scan className="w-4 h-4 text-indigo-600" />
                <span>Simulate Optical Scanner</span>
              </h4>
              <button onClick={() => setShowScannerModal(false)} className="text-slate-400">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Click a simulated item below to instantly emulate scanning its physical barcode at the circulation desk:
            </p>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Scan Books:</div>
              {books.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSimulateScan(b.id, 'book')}
                  className="w-full p-2 text-left bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="truncate max-w-[200px] font-medium text-slate-800">{b.title}</span>
                  <span className="font-mono text-[10px] text-indigo-600">Scan</span>
                </button>
              ))}

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-2">Quick Scan Students:</div>
              {students.slice(0, 3).map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSimulateScan(st.studentId, 'student')}
                  className="w-full p-2 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-slate-800">{st.name} ({st.studentId})</span>
                  <span className="font-mono text-[10px] text-emerald-600">Scan</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowScannerModal(false)}
              className="w-full py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

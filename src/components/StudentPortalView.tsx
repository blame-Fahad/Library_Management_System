import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { fetchAIRecommendations } from '../services/aiService';
import { AIRecommendation, Book } from '../types/library';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Printer,
} from 'lucide-react';

interface StudentPortalViewProps {
  onOpenBookCatalog: () => void;
  onOpenAIExplorer: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  onOpenBookCatalog,
  onOpenAIExplorer,
}) => {
  const { currentStudent, books, borrows, reservations, fineSettings, createReservation } = useLibrary();

  const [aiRecs, setAiRecs] = useState<AIRecommendation[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Student active loans
  const myLoans = currentStudent
    ? borrows.filter((b) => b.studentId === currentStudent.studentId && (b.status === 'active' || b.status === 'overdue'))
    : [];

  // Student past returned loans
  const myHistory = currentStudent
    ? borrows.filter((b) => b.studentId === currentStudent.studentId && b.status === 'returned')
    : [];

  // Student reservations
  const myReservations = currentStudent
    ? reservations.filter((r) => r.studentId === currentStudent.studentId && r.status === 'pending')
    : [];

  // Unpaid fines
  const totalFine = myLoans.reduce((sum, l) => (l.fineStatus === 'unpaid' ? sum + l.fineAmount : sum), 0);

  // Load personalized AI recommendations
  useEffect(() => {
    if (!currentStudent) return;
    const loadRecs = async () => {
      setLoadingRecs(true);
      try {
        const historyTitles = myLoans.concat(myHistory).map((l) => l.bookTitle);
        const res = await fetchAIRecommendations(
          books,
          historyTitles,
          currentStudent.department,
          'Core university textbooks, career preparation, and foundational academic topics'
        );
        setAiRecs(res.recommendations);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRecs(false);
      }
    };
    loadRecs();
  }, [currentStudent?.id, books.length]);

  if (!currentStudent) {
    return (
      <div className="bg-white p-8 rounded-2xl text-center border border-slate-200">
        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">No Student Account Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Please select a student from the top navigation bar to view your personalized portal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={currentStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
              alt={currentStudent.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Verified Student Member
                </span>
                <span className="font-mono text-xs text-slate-300">{currentStudent.studentId}</span>
              </div>
              <h1 className="text-2xl font-black text-white mt-1">{currentStudent.name}</h1>
              <p className="text-xs text-slate-300 mt-0.5">{currentStudent.department} • Session {currentStudent.sessionYear}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            <button
              onClick={() => setShowIdCard(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Digital Library Pass</span>
            </button>
            <button
              onClick={onOpenBookCatalog}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Library Catalog</span>
            </button>
          </div>
        </div>

        {/* Mini stats bar */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 text-[11px] block">Active Loans</span>
            <span className="font-bold text-white text-sm">{myLoans.length} of {currentStudent.maxAllowedBooks} Books</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Overdue Fine Due</span>
            <span className={`font-bold text-sm ${totalFine > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalFine} {fineSettings.currency}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Total Books Read</span>
            <span className="font-bold text-white text-sm">{myLoans.length + myHistory.length} Titles</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Active Holds</span>
            <span className="font-bold text-white text-sm">{myReservations.length} Pending</span>
          </div>
        </div>
      </div>

      {/* Overdue Warning Callout if Student has late books */}
      {totalFine > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">You have overdue books with an accumulated fine of {totalFine} {fineSettings.currency}!</p>
              <p className="text-rose-700 text-[11px]">Please return the books to the circulation desk to avoid increasing charges ({fineSettings.finePerDay} {fineSettings.currency}/day).</p>
            </div>
          </div>
        </div>
      )}

      {/* Two Columns: My Active Loans & AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Loans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Currently Borrowed Books ({myLoans.length})</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Limit: {currentStudent.maxAllowedBooks}</span>
          </div>

          {myLoans.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p>You have no active book loans at the moment.</p>
              <button
                onClick={onOpenBookCatalog}
                className="text-emerald-700 font-semibold hover:underline"
              >
                Browse catalog and reserve a book →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myLoans.map((loan) => {
                const bookInfo = books.find((b) => b.id === loan.bookId);
                const isOverdue = loan.status === 'overdue';
                return (
                  <div
                    key={loan.id}
                    className={`p-3.5 rounded-xl border flex space-x-3.5 transition-all ${
                      isOverdue
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <img
                      src={bookInfo?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                      alt={loan.bookTitle}
                      className="w-14 h-20 object-cover rounded-lg shadow-xs shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">{loan.bookIsbn}</span>
                        {isOverdue ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            {loan.overdueDays} Days Overdue ({loan.fineAmount} BDT)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active Loan
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mt-1 truncate">{loan.bookTitle}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Issued: {loan.issueDate}</p>

                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Return Deadline:</span>
                        <span className={`font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                          {loan.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: AI Recommendations for Student */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">AI Recommended for Your Curriculum</h3>
            </div>
            <button
              onClick={onOpenAIExplorer}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Open AI Explorer →
            </button>
          </div>

          {loadingRecs ? (
            <div className="py-10 text-center text-xs text-indigo-600 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Analyzing library catalog with Gemini AI for your studies...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiRecs.slice(0, 3).map((rec) => {
                const book = books.find((b) => b.id === rec.bookId || b.title === rec.title);
                return (
                  <div
                    key={rec.bookId || rec.title}
                    className="p-3.5 rounded-xl border border-indigo-100/80 bg-indigo-50/30 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[220px]">
                        {rec.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800 font-mono">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">Author: {rec.author}</p>
                    <p className="text-slate-700 text-xs leading-relaxed italic">
                      "{rec.reason}"
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <span className="text-indigo-600 font-medium truncate max-w-[180px]">
                        Next: {rec.suggestedNextTopic}
                      </span>
                      {book && (
                        <button
                          onClick={() => {
                            const res = createReservation(book.id, currentStudent.studentId);
                            setFeedback(res.message);
                            setTimeout(() => setFeedback(null), 3000);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[11px] cursor-pointer"
                        >
                          Hold / Reserve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Borrowing History */}
      {myHistory.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed Loans & Reading History</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3 py-2">Book Title</th>
                  <th className="px-3 py-2">Issued On</th>
                  <th className="px-3 py-2">Returned On</th>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2 text-right">Fine Settled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myHistory.map((h) => (
                  <tr key={h.id}>
                    <td className="px-3 py-2 font-medium text-slate-800">{h.bookTitle}</td>
                    <td className="px-3 py-2 text-slate-500">{h.issueDate}</td>
                    <td className="px-3 py-2 text-slate-500">{h.returnDate}</td>
                    <td className="px-3 py-2 text-slate-600">{h.returnedCondition || 'Good'}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-700">
                      {h.fineAmount > 0 ? `${h.fineAmount} BDT (${h.fineStatus})` : '0 BDT'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Digital ID Card Modal */}
      {showIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 printable-card">
            <div className="bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-emerald-500/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs tracking-tight uppercase">Central University</h5>
                    <p className="text-[9px] text-emerald-300">Smart Library Membership Card</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Active
                </span>
              </div>

              <div className="flex space-x-4 my-4 items-center">
                <img
                  src={currentStudent.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={currentStudent.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-400 shadow-md shrink-0"
                />
                <div className="text-xs">
                  <h4 className="font-extrabold text-white text-sm">{currentStudent.name}</h4>
                  <p className="font-mono text-emerald-300 font-semibold text-xs mt-0.5">{currentStudent.studentId}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{currentStudent.department}</p>
                  <p className="text-[9px] text-slate-400">Session: {currentStudent.sessionYear}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-center">
                <div className="flex justify-center space-x-1 py-1 font-mono tracking-widest text-xs text-white">
                  ||||| | |||| ||| |||| | ||||| || ||| ||||
                </div>
                <p className="text-[10px] font-mono text-emerald-300">{currentStudent.studentId}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical Card</span>
              </button>
              <button
                onClick={() => setShowIdCard(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

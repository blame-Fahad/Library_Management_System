import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { UserRole } from '../types/library';
import {
  BookOpen,
  Shield,
  User,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAIModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    currentRole,
    setCurrentRole,
    students,
    currentStudent,
    setCurrentStudent,
    stats,
    resetAllData,
  } = useLibrary();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setShowRoleMenu(false);
    if (role === 'student' && !currentStudent && students.length > 0) {
      setCurrentStudent(students[0]);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(currentRole === 'student' ? 'student-portal' : 'dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-emerald-600 flex items-center justify-center shadow-md text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Smart<span className="text-indigo-600">Lib</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  AI v2.4
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Digital Library Management System</p>
            </div>
          </div>

          {/* Overdue Badge & Quick Alerts */}
          <div className="flex items-center space-x-3">
            {stats.overdueCount > 0 && currentRole !== 'student' && (
              <button
                onClick={() => setActiveTab('overdue-fines')}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                title="View overdue books requiring attention"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>
                  <strong>{stats.overdueCount}</strong> Overdue ({stats.totalUnpaidFines} BDT fine)
                </span>
              </button>
            )}

            {/* AI Assistant Quick Launcher */}
            <button
              onClick={() => setActiveTab('ai-explorer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                activeTab === 'ai-explorer'
                  ? 'bg-indigo-600 text-white shadow-indigo-200'
                  : 'bg-gradient-to-r from-indigo-50 to-emerald-50 text-indigo-700 hover:from-indigo-100 hover:to-emerald-100 border border-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              <span>AI Explorer</span>
            </button>

            {/* Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
              >
                {currentRole === 'admin' && (
                  <>
                    <Shield className="w-3.5 h-3.5 text-rose-600" />
                    <span>Admin Mode</span>
                  </>
                )}
                {currentRole === 'librarian' && (
                  <>
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Librarian Mode</span>
                  </>
                )}
                {currentRole === 'student' && (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="truncate max-w-[120px]">{currentStudent ? currentStudent.name.split(' ')[0] : 'Student'}</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active Portal
                  </div>
                  
                  {/* Librarian */}
                  <button
                    onClick={() => handleRoleChange('librarian')}
                    className={`w-full px-3 py-2 flex items-center space-x-2.5 text-left text-xs transition-colors cursor-pointer ${
                      currentRole === 'librarian' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="font-medium">Librarian Counter</p>
                      <p className="text-[10px] text-slate-400">Issue, Return, Fines & Stock</p>
                    </div>
                  </button>

                  {/* Admin */}
                  <button
                    onClick={() => handleRoleChange('admin')}
                    className={`w-full px-3 py-2 flex items-center space-x-2.5 text-left text-xs transition-colors cursor-pointer ${
                      currentRole === 'admin' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-rose-600" />
                    <div>
                      <p className="font-medium">Administrator</p>
                      <p className="text-[10px] text-slate-400">System settings, fine rates, full audit</p>
                    </div>
                  </button>

                  {/* Student Switcher */}
                  <div className="px-3 pt-2 pb-1 border-t border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Student Portal
                  </div>
                  {students.slice(0, 3).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        setCurrentStudent(st);
                        handleRoleChange('student');
                        setActiveTab('student-portal');
                      }}
                      className={`w-full px-3 py-2 flex items-center space-x-2.5 text-left text-xs transition-colors cursor-pointer ${
                        currentRole === 'student' && currentStudent?.id === st.id
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <div className="truncate">
                        <p className="font-medium truncate">{st.name}</p>
                        <p className="text-[10px] text-slate-400">{st.studentId} • {st.department.split(' ')[0]}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* About / Info */}
            <button
              onClick={() => setShowAbout(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="System Documentation & Specifications"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto py-2 no-scrollbar text-xs font-medium">
          {currentRole !== 'student' ? (
            <>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'catalog'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Book Catalog ({stats.totalTitles})
              </button>
              <button
                onClick={() => setActiveTab('issue-return')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'issue-return'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Issue & Return Center
              </button>
              <button
                onClick={() => setActiveTab('overdue-fines')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center space-x-1 ${
                  activeTab === 'overdue-fines'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>Overdue & Fines</span>
                {stats.overdueCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] inline-flex items-center justify-center font-bold">
                    {stats.overdueCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'students'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Students ({stats.activeStudents})
              </button>
              <button
                onClick={() => setActiveTab('ai-explorer')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center space-x-1 ${
                  activeTab === 'ai-explorer'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Recommendations & Search</span>
              </button>
              {currentRole === 'admin' && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Settings & Policy
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('student-portal')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'student-portal'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                My Student Dashboard
              </button>
              <button
                onClick={() => setActiveTab('catalog')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === 'catalog'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Browse Books Catalog
              </button>
              <button
                onClick={() => setActiveTab('ai-explorer')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors flex items-center space-x-1 ${
                  activeTab === 'ai-explorer'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Recommended For Me</span>
              </button>
            </>
          )}
        </nav>
      </div>

      {/* About / Specs Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Smart Library Management System</h3>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>System Objectives:</strong> Digitize and automate library workflows including book cataloging, shelf tracking, issue and return recording, fine calculation, and AI-powered recommendations.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">Core Features Built-in:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                  <li>Separate access for Admin, Librarian, and Students</li>
                  <li>Automated overdue fine tracking (5 BDT/day default)</li>
                  <li>Gemini 3.8 Flash AI recommendations & semantic search</li>
                  <li>Digital Library ID Card & Issue Receipts with barcode simulation</li>
                  <li>Real-time copy availability management & shelf racks</li>
                </ul>
              </div>
              <p className="text-slate-500">
                You can switch between Librarian, Admin, and Student roles anytime using the top-right role selector to test all permissions and workflows.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAbout(false);
                  setShowResetConfirm(true);
                }}
                className="text-rose-600 hover:text-rose-700 text-xs font-medium flex items-center space-x-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
              <button
                onClick={() => setShowAbout(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-2">Reset to Initial Demo State?</h4>
            <p className="text-xs text-slate-600 mb-4">
              This will reset all books, borrow records, overdue fines, and students back to the initial university library demo dataset.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resetAllData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

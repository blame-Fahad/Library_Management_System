/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BookCatalogView } from './components/BookCatalogView';
import { IssueReturnView } from './components/IssueReturnView';
import { OverdueFineView } from './components/OverdueFineView';
import { StudentManagementView } from './components/StudentManagementView';
import { StudentPortalView } from './components/StudentPortalView';
import { AISmartExplorerView } from './components/AISmartExplorerView';

function MainApp() {
  const { currentRole } = useLibrary();

  const [activeTab, setActiveTab] = useState<string>(() =>
    currentRole === 'student' ? 'student-portal' : 'dashboard'
  );

  const [preselectedBookId, setPreselectedBookId] = useState<string | null>(null);

  // Synchronize default tab if role switches
  React.useEffect(() => {
    if (currentRole === 'student' && activeTab === 'dashboard') {
      setActiveTab('student-portal');
    } else if (currentRole !== 'student' && activeTab === 'student-portal') {
      setActiveTab('dashboard');
    }
  }, [currentRole]);

  const handleIssueBookDirect = (bookId: string) => {
    setPreselectedBookId(bookId);
    setActiveTab('issue-return');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            onOpenIssueModal={() => {
              setPreselectedBookId(null);
              setActiveTab('issue-return');
            }}
            onOpenReturnModal={() => setActiveTab('issue-return')}
            onOpenAddBookModal={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'catalog' && (
          <BookCatalogView onIssueBookDirect={handleIssueBookDirect} />
        )}

        {activeTab === 'issue-return' && (
          <IssueReturnView
            preselectedBookId={preselectedBookId}
            onClearPreselectedBook={() => setPreselectedBookId(null)}
          />
        )}

        {activeTab === 'overdue-fines' && <OverdueFineView />}

        {activeTab === 'students' && <StudentManagementView />}

        {activeTab === 'student-portal' && (
          <StudentPortalView
            onOpenBookCatalog={() => setActiveTab('catalog')}
            onOpenAIExplorer={() => setActiveTab('ai-explorer')}
          />
        )}

        {activeTab === 'ai-explorer' && <AISmartExplorerView />}

        {activeTab === 'settings' && <OverdueFineView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} <strong>Smart Library Management System</strong> • Multi-Role Academic Portal & Gemini AI
          </p>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Automated Overdue Recovery</span>
            <span>•</span>
            <span>Shelf Mapping</span>
            <span>•</span>
            <span>Digital Patron Pass</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}

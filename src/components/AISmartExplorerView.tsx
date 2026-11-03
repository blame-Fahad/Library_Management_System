import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { fetchAISmartSearch, fetchAIRecommendations, sendAIChatMessage } from '../services/aiService';
import { Book, AIRecommendation, AISmartSearchResult } from '../types/library';
import {
  Sparkles,
  Search,
  MessageSquare,
  BookOpen,
  MapPin,
  Send,
  HelpCircle,
  Compass,
  ArrowRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

export const AISmartExplorerView: React.FC = () => {
  const { books, borrows, currentStudent, createReservation } = useLibrary();

  const [activeSubTab, setActiveSubTab] = useState<'search' | 'recommend' | 'chat'>('search');

  // 1. Smart Search State
  const [naturalQuery, setNaturalQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    results: AISmartSearchResult[];
    suggestedTags: string[];
    aiPowered: boolean;
  } | null>(null);

  // 2. Recommendation Engine State
  const [selectedGoal, setSelectedGoal] = useState('Software Engineering & Systems');
  const [customInterest, setCustomInterest] = useState('');
  const [recsLoading, setRecsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<{
    recommendations: AIRecommendation[];
    aiPowered: boolean;
  } | null>(null);

  // 3. AI Chat Assistant State
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content:
        "Hello! I'm Lexi, your Smart Library AI Assistant. I can help you find books across our shelves, draft academic citations in APA/MLA/IEEE, explain fine calculations (5 BDT/day), or suggest reading materials for your semester courses. How can I assist you today?",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [holdMsg, setHoldMsg] = useState<string | null>(null);

  // Handle Natural Language Search
  const handleSmartSearch = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const q = customQ || naturalQuery;
    if (!q.trim()) return;

    setSearching(true);
    try {
      const data = await fetchAISmartSearch(q, books);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  // Handle Recommendation Generation
  const handleGenerateRecs = async () => {
    setRecsLoading(true);
    try {
      const interestText = customInterest.trim() || selectedGoal;
      const historyTitles = borrows.slice(0, 5).map((b) => b.bookTitle);
      const data = await fetchAIRecommendations(
        books,
        historyTitles,
        currentStudent?.department || 'Computer Science & Engineering',
        interestText
      );
      setRecommendations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRecsLoading(false);
    }
  };

  // Handle Chat Send
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newHistory);
    setChatLoading(true);

    try {
      const res = await sendAIChatMessage(userMsg, newHistory, books);
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an issue contacting the library catalog. Please try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleReserveBook = (bookId: string) => {
    if (!currentStudent) {
      alert('Please switch to or select a student to place a hold.');
      return;
    }
    const res = createReservation(bookId, currentStudent.studentId);
    setHoldMsg(res.message);
    setTimeout(() => setHoldMsg(null), 3500);
  };

  const sampleSearchQueries = [
    'I want to learn algorithms with visual and intuitive explanations',
    'Chilling classic novel on government surveillance and thought control',
    'Foundation in distributed systems, transactions, and consensus protocols',
    'Introductory modern physics and quantum mechanics for engineers',
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {holdMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{holdMsg}</span>
          <button onClick={() => setHoldMsg(null)}>✕</button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Gemini 3.8 Flash Academic Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            AI Library Explorer & Recommendation Engine
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
            Search library materials conceptually using natural language, receive intelligent book recommendations tailored to your syllabus, or chat with Lexi the AI Librarian.
          </p>

          {/* Sub Navigation Pills */}
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => setActiveSubTab('search')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'search'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Semantic Smart Search</span>
            </button>
            <button
              onClick={() => setActiveSubTab('recommend')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'recommend'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Personalized Recommendations</span>
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'chat'
                  ? 'bg-white text-indigo-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ask Librarian AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. SEMANTIC SMART SEARCH TAB */}
      {activeSubTab === 'search' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Concept & Semantic Search</h3>
            <p className="text-xs text-slate-500">
              Unlike traditional keyword matching, our Gemini AI understands what you mean and maps your query to our catalog's concepts and themes.
            </p>

            <form onSubmit={handleSmartSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask in natural language (e.g., 'Books on distributed systems for backend engineers')..."
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
              <button
                type="submit"
                disabled={searching || !naturalQuery.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5 shrink-0"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Search</span>
                  </>
                )}
              </button>
            </form>

            {/* Suggested Sample Queries */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Try asking:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleSearchQueries.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      setNaturalQuery(q);
                      handleSmartSearch(undefined, q);
                    }}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-xs text-slate-600 transition-colors cursor-pointer text-left"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Results Display */}
          {searchResults && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    AI Semantic Matches ({searchResults.results.length} found)
                  </h4>
                </div>
                {searchResults.suggestedTags?.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span className="text-[11px] text-slate-400">Related Topics:</span>
                    {searchResults.suggestedTags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-medium font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {searchResults.results.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No catalog books closely matched this prompt. Try a broader inquiry.</p>
              ) : (
                <div className="space-y-3">
                  {searchResults.results.map((res) => {
                    const book = books.find((b) => b.id === res.bookId);
                    if (!book) return null;
                    const isAvailable = book.availableCopies > 0;

                    return (
                      <div
                        key={res.bookId}
                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="flex space-x-3.5">
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-14 h-20 object-cover rounded-lg shadow-xs shrink-0"
                          />
                          <div className="text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                {book.category}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">{book.isbn}</span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm mt-1">{book.title}</h5>
                            <p className="text-slate-500 mt-0.5">{book.author}</p>
                            
                            <p className="text-indigo-950 font-medium mt-1.5 text-xs bg-indigo-50/80 p-2 rounded-lg border border-indigo-100">
                              💡 <strong>Relevance:</strong> {res.relevanceExplanation}
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0 space-y-1 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                          <div className="flex items-center space-x-1 text-slate-700 text-xs font-mono">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{book.shelfLocation}</span>
                          </div>
                          <div className="text-[11px] font-semibold text-emerald-700">
                            {book.availableCopies} of {book.totalCopies} left
                          </div>
                          <button
                            onClick={() => handleReserveBook(book.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                          >
                            {isAvailable ? 'Hold Copy' : 'Reserve'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. PERSONALIZED RECOMMENDATIONS TAB */}
      {activeSubTab === 'recommend' && (
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Curriculum & Career Recommendation Engine</h3>
            <p className="text-xs text-slate-500">
              Select an academic concentration or describe your career ambition to receive intelligent course literature suggestions.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Focus Domain / Track:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Software Engineering & Systems',
                    'Artificial Intelligence & Deep Learning',
                    'Theoretical Computer Science & Algorithms',
                    'Applied Physics & Electronics',
                    'Philosophy & Dystopian Literature',
                  ].map((track) => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => setSelectedGoal(track)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        selectedGoal === track
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Or Specific Research / Study Need:</label>
                <input
                  type="text"
                  placeholder="e.g. Preparing for technical coding interviews at top tech companies"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                onClick={handleGenerateRecs}
                disabled={recsLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer flex items-center space-x-2"
              >
                {recsLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Personalized Reading Path</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recommendations Result */}
          {recommendations && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.recommendations.map((rec) => {
                const book = books.find((b) => b.id === rec.bookId || b.title === rec.title);
                return (
                  <div
                    key={rec.bookId || rec.title}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {book?.category || 'Recommended'}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-1">{rec.title}</h4>
                          <p className="text-xs text-slate-500">{rec.author}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-600 text-white shadow-xs font-mono">
                          {rec.matchScore}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                        "{rec.reason}"
                      </p>

                      <div className="mt-2 text-[11px] text-slate-500 flex items-center space-x-1">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Recommended next study: <strong className="text-slate-700">{rec.suggestedNextTopic}</strong></span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {book && (
                        <span className="font-mono text-slate-600 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{book.shelfLocation}</span>
                        </span>
                      )}
                      {book && (
                        <button
                          onClick={() => handleReserveBook(book.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-xs"
                        >
                          Request Copy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. ASK LIBRARIAN AI CHAT TAB */}
      {activeSubTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[560px]">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Lexi — AI Academic Librarian</h4>
                <p className="text-[10px] text-indigo-300">Grounded in library collection & university circulation policy</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online
            </span>
          </div>

          {/* Chat History Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-slate-50/50">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-600 p-3 rounded-2xl border border-slate-200/80 text-xs flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Lexi is formulating an answer...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              placeholder="Ask Lexi anything (e.g. 'Where is the CLRS algorithm book shelved?' or 'How do I cite Clean Code?')..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0 flex items-center space-x-1"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

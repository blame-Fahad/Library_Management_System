import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types/library';
import { fetchAIBookInsights, fetchAICatalogHelper } from '../services/aiService';
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  Sparkles,
  MapPin,
  Bookmark,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
  LayoutGrid,
  List,
  ExternalLink,
} from 'lucide-react';

interface BookCatalogViewProps {
  onIssueBookDirect?: (bookId: string) => void;
}

export const BookCatalogView: React.FC<BookCatalogViewProps> = ({ onIssueBookDirect }) => {
  const { books, borrows, currentRole, currentStudent, addBook, deleteBook, createReservation } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [bookInsights, setBookInsights] = useState<any | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  // Add Book Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    publisher: 'Academic Press',
    publicationYear: new Date().getFullYear(),
    category: 'Computer Science',
    shelfLocation: 'Rack CS-01, Shelf 1',
    deweyDecimal: '005.13',
    totalCopies: 4,
    description: '',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    tags: 'computer-science, algorithms, textbook',
  });
  const [aiCataloging, setAiCataloging] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Categories list
  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesAvailable = !availableOnly || book.availableCopies > 0;

    return matchesSearch && matchesCategory && matchesAvailable;
  });

  const handleOpenDetails = async (book: Book) => {
    setSelectedBookForDetails(book);
    setBookInsights(null);
    setLoadingInsights(true);
    try {
      const insights = await fetchAIBookInsights(book);
      setBookInsights(insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleAiAutoFill = async () => {
    if (!newBook.title) {
      alert('Please enter at least a Book Title to use AI auto-cataloging.');
      return;
    }
    setAiCataloging(true);
    try {
      const helper = await fetchAICatalogHelper(newBook.title, newBook.author);
      setNewBook((prev) => ({
        ...prev,
        category: helper.suggestedCategory || prev.category,
        deweyDecimal: helper.deweyDecimal || prev.deweyDecimal,
        shelfLocation: helper.suggestedShelf || prev.shelfLocation,
        description: helper.description || prev.description,
        tags: helper.tags ? helper.tags.join(', ') : prev.tags,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setAiCataloging(false);
    }
  };

  const handleSaveNewBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;

    addBook({
      title: newBook.title,
      author: newBook.author,
      isbn: `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      publisher: newBook.publisher,
      publicationYear: Number(newBook.publicationYear),
      category: newBook.category,
      shelfLocation: newBook.shelfLocation,
      deweyDecimal: newBook.deweyDecimal,
      totalCopies: Number(newBook.totalCopies),
      availableCopies: Number(newBook.totalCopies),
      description: newBook.description || 'Academic textbook added to library collection.',
      coverImage: newBook.coverImage,
      rating: 4.8,
      tags: newBook.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });

    setShowAddModal(false);
    setFeedbackMsg({ text: `Successfully cataloged "${newBook.title}"`, type: 'success' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleCopyCitation = (text: string, formatName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(formatName);
    setTimeout(() => setCopiedCitation(null), 2500);
  };

  const handleReserve = (book: Book) => {
    if (!currentStudent) {
      alert('Please select or log in as a student to place a hold/reservation.');
      return;
    }
    const res = createReservation(book.id, currentStudent.studentId);
    setFeedbackMsg({ text: res.message, type: res.success ? 'success' : 'error' });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Catalog Search & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, shelf location, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-600 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>In Stock Only</span>
            </label>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {currentRole !== 'student' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pr-1">Filter:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book) => {
            const isAvailable = book.availableCopies > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Book Cover Container */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
                      {book.category}
                    </span>
                  </div>

                  {/* Availability Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                        isAvailable
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {isAvailable ? `${book.availableCopies}/${book.totalCopies} Available` : 'All Issued'}
                    </span>
                  </div>

                  {/* Shelf Location overlay */}
                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[11px]">
                    <span className="flex items-center space-x-1 font-mono text-slate-200 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
                      <MapPin className="w-3 h-3 text-indigo-400" />
                      <span>{book.shelfLocation}</span>
                    </span>
                    <span className="font-mono text-slate-300">DDC: {book.deweyDecimal}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 leading-snug hover:text-indigo-600 transition-colors cursor-pointer" onClick={() => handleOpenDetails(book)}>
                      {book.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{book.author}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">ISBN: {book.isbn}</p>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleOpenDetails(book)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>AI Insights</span>
                    </button>

                    {currentRole !== 'student' ? (
                      <button
                        onClick={() => onIssueBookDirect && onIssueBookDirect(book.id)}
                        disabled={!isAvailable}
                        className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          isAvailable
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Issue
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReserve(book)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                      >
                        {isAvailable ? 'Request' : 'Reserve'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Book Title & Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Location / Shelf</th>
                  <th className="px-4 py-3">ISBN & DDC</th>
                  <th className="px-4 py-3">Availability</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600" onClick={() => handleOpenDetails(book)}>
                          {book.title}
                        </div>
                        <div className="text-slate-500">{book.author} ({book.publicationYear})</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {book.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {book.shelfLocation}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        <div>{book.isbn}</div>
                        <div className="text-slate-400">DDC: {book.deweyDecimal}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-md font-semibold text-[11px] ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {book.availableCopies} of {book.totalCopies} left
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetails(book)}
                            className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg font-medium cursor-pointer"
                          >
                            Details
                          </button>
                          {currentRole !== 'student' ? (
                            <button
                              onClick={() => onIssueBookDirect && onIssueBookDirect(book.id)}
                              disabled={!isAvailable}
                              className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                                isAvailable
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Issue
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReserve(book)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold cursor-pointer"
                            >
                              Reserve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Detail & AI Insights Modal */}
      {selectedBookForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex space-x-4">
                <img
                  src={selectedBookForDetails.coverImage}
                  alt={selectedBookForDetails.title}
                  className="w-20 h-28 object-cover rounded-xl shadow-md shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {selectedBookForDetails.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">DDC: {selectedBookForDetails.deweyDecimal}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg mt-1">{selectedBookForDetails.title}</h3>
                  <p className="text-xs text-slate-600 font-medium">{selectedBookForDetails.author}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Published by {selectedBookForDetails.publisher} ({selectedBookForDetails.publicationYear})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookForDetails(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Location & Availability Quick Stats */}
            <div className="my-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Shelf Location</span>
                <span className="font-bold text-slate-800 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedBookForDetails.shelfLocation}</span>
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Current Copies</span>
                <span className="font-bold text-slate-800 mt-0.5 block">
                  {selectedBookForDetails.availableCopies} available of {selectedBookForDetails.totalCopies} total
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">ISBN Barcode</span>
                <span className="font-mono text-slate-700 text-[11px] mt-0.5 block">{selectedBookForDetails.isbn}</span>
              </div>
            </div>

            {/* AI Insights Section */}
            <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Gemini AI Academic Synopsis & Key Concepts</span>
                </div>
                {bookInsights?.difficultyLevel && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                    Level: {bookInsights.difficultyLevel}
                  </span>
                )}
              </div>

              {loadingInsights ? (
                <div className="py-6 flex flex-col items-center justify-center space-y-2 text-xs text-indigo-600">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span>Consulting Gemini AI to extract book insights...</span>
                </div>
              ) : bookInsights ? (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-700 leading-relaxed font-normal bg-white/80 p-3 rounded-xl border border-indigo-100">
                    {bookInsights.summary}
                  </p>

                  <div>
                    <h5 className="font-bold text-slate-800 text-[11px] mb-1 uppercase tracking-wider">Key Takeaways:</h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      {bookInsights.keyTakeaways?.map((item: string, idx: number) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Academic Citations */}
                  <div className="pt-2 border-t border-indigo-100/80">
                    <h5 className="font-bold text-slate-800 text-[11px] mb-2 uppercase tracking-wider flex items-center justify-between">
                      <span>One-Click Academic Citations</span>
                      {copiedCitation && (
                        <span className="text-emerald-600 text-[10px] lowercase font-normal flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>copied {copiedCitation}!</span>
                        </span>
                      )}
                    </h5>
                    <div className="space-y-1.5">
                      {Object.entries(bookInsights.citations || {}).map(([fmt, text]: [string, any]) => (
                        <div
                          key={fmt}
                          onClick={() => handleCopyCitation(text, fmt.toUpperCase())}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 text-[11px] cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <span className="font-bold uppercase text-indigo-700 text-[10px] w-10 shrink-0">{fmt}:</span>
                            <span className="font-mono text-slate-600 truncate">{text}</span>
                          </div>
                          <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">{selectedBookForDetails.description}</p>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              {currentRole !== 'student' && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete "${selectedBookForDetails.title}"?`)) {
                      const deleted = deleteBook(selectedBookForDetails.id);
                      if (deleted) {
                        setSelectedBookForDetails(null);
                      } else {
                        alert('Cannot delete this book because copies are currently issued to students.');
                      }
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Title</span>
                </button>
              )}

              <div className="flex items-center space-x-2 ml-auto">
                <button
                  onClick={() => setSelectedBookForDetails(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {currentRole !== 'student' ? (
                  <button
                    onClick={() => {
                      const id = selectedBookForDetails.id;
                      setSelectedBookForDetails(null);
                      if (onIssueBookDirect) onIssueBookDirect(id);
                    }}
                    disabled={selectedBookForDetails.availableCopies <= 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Proceed to Issue Book
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleReserve(selectedBookForDetails);
                      setSelectedBookForDetails(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Request Hold / Reserve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Catalog New Book</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* AI Assistant Banner */}
            <div className="my-3 p-3 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-900 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Cataloging Assistant</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Type title & author, then click auto-fill to deduce category, Dewey Decimal & rack.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={aiCataloging || !newBook.title}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {aiCataloging ? 'Analyzing...' : '✨ Auto-Fill'}
              </button>
            </div>

            <form onSubmit={handleSaveNewBook} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    placeholder="e.g. Computer Networks: A Top-Down Approach"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Author(s) *</label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    placeholder="e.g. James F. Kurose, Keith W. Ross"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Dewey Decimal (DDC)</label>
                  <input
                    type="text"
                    value={newBook.deweyDecimal}
                    onChange={(e) => setNewBook({ ...newBook, deweyDecimal: e.target.value })}
                    placeholder="e.g. 004.6"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Shelf / Rack</label>
                  <input
                    type="text"
                    value={newBook.shelfLocation}
                    onChange={(e) => setNewBook({ ...newBook, shelfLocation: e.target.value })}
                    placeholder="e.g. Rack NET-02, Shelf 3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newBook.totalCopies}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Publisher</label>
                  <input
                    type="text"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Year</label>
                  <input
                    type="number"
                    value={newBook.publicationYear}
                    onChange={(e) => setNewBook({ ...newBook, publicationYear: parseInt(e.target.value) || 2024 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Academic overview or course syllabus relevance..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newBook.tags}
                  onChange={(e) => setNewBook({ ...newBook, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Save to Library Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

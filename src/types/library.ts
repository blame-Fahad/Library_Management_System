export type UserRole = 'admin' | 'librarian' | 'student';

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publicationYear: number;
  category: string;
  shelfLocation: string; // e.g. "Rack CS-04, Shelf 2"
  deweyDecimal: string; // e.g. "005.133"
  totalCopies: number;
  availableCopies: number;
  description: string;
  coverImage?: string;
  rating: number;
  tags: string[];
}

export interface Student {
  id: string;
  studentId: string; // e.g. "2021-CSE-042"
  name: string;
  email: string;
  department: string; // e.g. "Computer Science & Engineering"
  sessionYear: string;
  phone: string;
  avatar?: string;
  cardStatus: 'active' | 'suspended' | 'expired';
  maxAllowedBooks: number;
  joinDate: string;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  studentId: string; // Student ID e.g. "2021-CSE-042"
  studentName: string;
  studentEmail: string;
  issueDate: string; // ISO date YYYY-MM-DD
  dueDate: string;   // ISO date YYYY-MM-DD
  returnDate?: string | null; // ISO date YYYY-MM-DD if returned
  status: 'active' | 'returned' | 'overdue';
  overdueDays: number;
  fineAmount: number; // in BDT
  fineStatus: 'none' | 'unpaid' | 'paid' | 'waived';
  issuedBy: string; // Librarian name
  returnedCondition?: 'Good' | 'Damaged' | 'Minor Wear';
}

export interface Reservation {
  id: string;
  bookId: string;
  bookTitle: string;
  studentId: string;
  studentName: string;
  requestDate: string;
  status: 'pending' | 'ready_for_pickup' | 'fulfilled' | 'cancelled';
  queuePosition: number;
}

export interface FineSettings {
  finePerDay: number; // e.g. 5 BDT
  borrowDurationDays: number; // e.g. 14 days
  maxBooksPerStudent: number; // e.g. 3 books
  currency: string; // "BDT"
}

export interface ActivityLog {
  id: string;
  action: 'ISSUE' | 'RETURN' | 'FINE_PAID' | 'FINE_WAIVED' | 'BOOK_ADDED' | 'BOOK_UPDATED' | 'STUDENT_ADDED';
  description: string;
  timestamp: string;
  actor: string;
}

export interface AIRecommendation {
  bookId: string;
  title: string;
  author: string;
  matchScore: number;
  reason: string;
  suggestedNextTopic: string;
}

export interface AISmartSearchResult {
  bookId: string;
  relevanceScore: number;
  relevanceExplanation: string;
}

export interface BookInsights {
  summary: string;
  keyTakeaways: string[];
  targetAudience: string;
  difficultyLevel: string;
  citations: {
    apa: string;
    mla: string;
    ieee: string;
  };
  aiPowered?: boolean;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Book,
  Student,
  BorrowRecord,
  Reservation,
  FineSettings,
  ActivityLog,
  UserRole,
} from '../types/library';
import {
  INITIAL_BOOKS,
  INITIAL_STUDENTS,
  INITIAL_BORROWS,
  INITIAL_RESERVATIONS,
  INITIAL_FINE_SETTINGS,
  INITIAL_ACTIVITY_LOGS,
} from '../data/initialData';

interface IssueBookParams {
  bookId: string;
  studentId: string;
  borrowDurationDays?: number;
  librarianName?: string;
}

interface ReturnBookParams {
  borrowRecordId: string;
  condition?: 'Good' | 'Damaged' | 'Minor Wear';
  fineSettlement?: 'pay_now' | 'unpaid' | 'waive';
}

interface LibraryContextType {
  books: Book[];
  students: Student[];
  borrows: BorrowRecord[];
  reservations: Reservation[];
  fineSettings: FineSettings;
  activityLogs: ActivityLog[];
  currentRole: UserRole;
  currentStudent: Student | null;
  setCurrentRole: (role: UserRole) => void;
  setCurrentStudent: (student: Student | null) => void;
  
  // Book actions
  addBook: (book: Omit<Book, 'id'>) => Book;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => boolean;
  
  // Student actions
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  
  // Borrow & Return actions
  issueBook: (params: IssueBookParams) => { success: boolean; message: string; record?: BorrowRecord };
  returnBook: (params: ReturnBookParams) => { success: boolean; message: string; fineAmount: number };
  payFine: (borrowRecordId: string) => void;
  waiveFine: (borrowRecordId: string) => void;
  
  // Reservation actions
  createReservation: (bookId: string, studentId: string) => { success: boolean; message: string };
  cancelReservation: (reservationId: string) => void;
  
  // Settings
  updateFineSettings: (newSettings: Partial<FineSettings>) => void;
  resetAllData: () => void;
  
  // Computed stats
  stats: {
    totalTitles: number;
    totalVolumes: number;
    availableVolumes: number;
    issuedVolumes: number;
    overdueCount: number;
    totalFinesCollected: number;
    totalUnpaidFines: number;
    activeStudents: number;
  };
}

const STORAGE_KEYS = {
  BOOKS: 'slms_books_v1',
  STUDENTS: 'slms_students_v1',
  BORROWS: 'slms_borrows_v1',
  RESERVATIONS: 'slms_reservations_v1',
  SETTINGS: 'slms_settings_v1',
  LOGS: 'slms_logs_v1',
};

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [borrows, setBorrows] = useState<BorrowRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BORROWS);
      return saved ? JSON.parse(saved) : INITIAL_BORROWS;
    } catch {
      return INITIAL_BORROWS;
    }
  });

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
    } catch {
      return INITIAL_RESERVATIONS;
    }
  });

  const [fineSettings, setFineSettings] = useState<FineSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_FINE_SETTINGS;
    } catch {
      return INITIAL_FINE_SETTINGS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
    } catch {
      return INITIAL_ACTIVITY_LOGS;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('librarian');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(() => {
    return students.find((s) => s.studentId === '2021-CSE-042') || students[0] || null;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(borrows));
  }, [borrows]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
  }, [reservations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(fineSettings));
  }, [fineSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Dynamic automatic calculation of overdue days & fines
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    setBorrows((prevBorrows) => {
      let changed = false;
      const updated = prevBorrows.map((b) => {
        if (b.status === 'returned') return b;

        const due = new Date(b.dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0) {
          const calculatedFine = diffDays * fineSettings.finePerDay;
          if (b.status !== 'overdue' || b.overdueDays !== diffDays || b.fineAmount !== calculatedFine) {
            changed = true;
            return {
              ...b,
              status: 'overdue' as const,
              overdueDays: diffDays,
              fineAmount: calculatedFine,
              fineStatus: (b.fineStatus === 'paid' || b.fineStatus === 'waived' ? b.fineStatus : 'unpaid') as BorrowRecord['fineStatus'],
            };
          }
        } else {
          if (b.status === 'overdue') {
            changed = true;
            return {
              ...b,
              status: 'active' as const,
              overdueDays: 0,
              fineAmount: 0,
              fineStatus: 'none' as const,
            };
          }
        }
        return b;
      });

      return changed ? updated : prevBorrows;
    });
  }, [fineSettings.finePerDay]);

  const addLog = (action: ActivityLog['action'], description: string, actor: string = 'System') => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      action,
      description,
      timestamp: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      actor,
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Book management
  const addBook = (bookData: Omit<Book, 'id'>): Book => {
    const newBook: Book = {
      ...bookData,
      id: `b-${Date.now()}`,
      availableCopies: bookData.availableCopies ?? bookData.totalCopies,
    };
    setBooks((prev) => [newBook, ...prev]);
    addLog('BOOK_ADDED', `Added book "${newBook.title}" (ISBN: ${newBook.isbn})`, 'Admin/Librarian');
    return newBook;
  };

  const updateBook = (id: string, updates: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };
        // Adjust available copies if total changed
        if (updates.totalCopies !== undefined) {
          const issuedCount = b.totalCopies - b.availableCopies;
          updated.availableCopies = Math.max(0, updates.totalCopies - issuedCount);
        }
        return updated;
      })
    );
    addLog('BOOK_UPDATED', `Updated book details for ID ${id}`, 'Admin/Librarian');
  };

  const deleteBook = (id: string): boolean => {
    const book = books.find((b) => b.id === id);
    if (!book) return false;
    const hasActiveBorrow = borrows.some(
      (br) => br.bookId === id && (br.status === 'active' || br.status === 'overdue')
    );
    if (hasActiveBorrow) {
      return false; // Cannot delete book with active loans
    }
    setBooks((prev) => prev.filter((b) => b.id !== id));
    addLog('BOOK_UPDATED', `Deleted book "${book.title}"`, 'Admin/Librarian');
    return true;
  };

  // Student management
  const addStudent = (studentData: Omit<Student, 'id'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: `s-${Date.now()}`,
    };
    setStudents((prev) => [...prev, newStudent]);
    addLog('STUDENT_ADDED', `Registered student ${newStudent.name} (${newStudent.studentId})`, 'Admin/Librarian');
    return newStudent;
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  // Issue Book workflow
  const issueBook = ({
    bookId,
    studentId,
    borrowDurationDays,
    librarianName = 'Librarian On Duty',
  }: IssueBookParams): { success: boolean; message: string; record?: BorrowRecord } => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return { success: false, message: 'Book not found in library catalog.' };

    const student = students.find((s) => s.studentId === studentId);
    if (!student) return { success: false, message: 'Student ID not recognized.' };

    if (student.cardStatus !== 'active') {
      return { success: false, message: `Library card is ${student.cardStatus}. Cannot issue book.` };
    }

    if (book.availableCopies <= 0) {
      return { success: false, message: 'No copies currently available in stock.' };
    }

    // Check student loan limit
    const activeStudentLoans = borrows.filter(
      (br) => br.studentId === studentId && (br.status === 'active' || br.status === 'overdue')
    );

    if (activeStudentLoans.length >= student.maxAllowedBooks) {
      return {
        success: false,
        message: `Student has reached the maximum borrowing limit of ${student.maxAllowedBooks} books.`,
      };
    }

    // Check if student already has this specific book
    const alreadyHasThisBook = activeStudentLoans.some((br) => br.bookId === bookId);
    if (alreadyHasThisBook) {
      return { success: false, message: 'Student already has an active copy of this book.' };
    }

    const duration = borrowDurationDays || fineSettings.borrowDurationDays;
    const now = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + duration);

    const newRecord: BorrowRecord = {
      id: `br-${Date.now()}`,
      bookId: book.id,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      studentId: student.studentId,
      studentName: student.name,
      studentEmail: student.email,
      issueDate: now.toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      returnDate: null,
      status: 'active',
      overdueDays: 0,
      fineAmount: 0,
      fineStatus: 'none',
      issuedBy: librarianName,
    };

    // Decrement available copies
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    setBorrows((prev) => [newRecord, ...prev]);

    // Check and fulfill any pending reservation for this student on this book
    setReservations((prev) =>
      prev.map((r) =>
        r.bookId === bookId && r.studentId === studentId && r.status === 'pending'
          ? { ...r, status: 'fulfilled' }
          : r
      )
    );

    addLog('ISSUE', `Issued "${book.title}" to ${student.name} (${student.studentId}) - Due: ${newRecord.dueDate}`, librarianName);

    return { success: true, message: `Successfully issued "${book.title}" to ${student.name}.`, record: newRecord };
  };

  // Return Book workflow
  const returnBook = ({
    borrowRecordId,
    condition = 'Good',
    fineSettlement = 'unpaid',
  }: ReturnBookParams): { success: boolean; message: string; fineAmount: number } => {
    const record = borrows.find((b) => b.id === borrowRecordId);
    if (!record) return { success: false, message: 'Borrow record not found.', fineAmount: 0 };
    if (record.status === 'returned') return { success: false, message: 'Book is already marked returned.', fineAmount: 0 };

    const todayStr = new Date().toISOString().split('T')[0];
    const fineAmount = record.fineAmount;

    let finalFineStatus: BorrowRecord['fineStatus'] = record.fineStatus;
    if (fineAmount > 0) {
      if (fineSettlement === 'pay_now') finalFineStatus = 'paid';
      else if (fineSettlement === 'waive') finalFineStatus = 'waived';
      else finalFineStatus = 'unpaid';
    } else {
      finalFineStatus = 'none';
    }

    // Update borrow record
    setBorrows((prev) =>
      prev.map((b) =>
        b.id === borrowRecordId
          ? {
              ...b,
              returnDate: todayStr,
              status: 'returned',
              returnedCondition: condition,
              fineStatus: finalFineStatus,
            }
          : b
      )
    );

    // Increase available copies
    setBooks((prev) =>
      prev.map((b) =>
        b.id === record.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b
      )
    );

    const logDesc = fineAmount > 0
      ? `Returned "${record.bookTitle}" from ${record.studentName}. Overdue fine: ${fineAmount} BDT (${finalFineStatus}).`
      : `Returned "${record.bookTitle}" from ${record.studentName} on-time. Condition: ${condition}.`;

    addLog('RETURN', logDesc, 'Librarian On Duty');

    return {
      success: true,
      message: `Book returned successfully. Condition: ${condition}.${fineAmount > 0 ? ` Overdue fine: ${fineAmount} BDT (${finalFineStatus}).` : ''}`,
      fineAmount,
    };
  };

  // Fine management
  const payFine = (borrowRecordId: string) => {
    const record = borrows.find((b) => b.id === borrowRecordId);
    if (!record) return;

    setBorrows((prev) =>
      prev.map((b) => (b.id === borrowRecordId ? { ...b, fineStatus: 'paid' } : b))
    );

    addLog('FINE_PAID', `Collected ${record.fineAmount} BDT fine from ${record.studentName} for "${record.bookTitle}"`, 'Librarian');
  };

  const waiveFine = (borrowRecordId: string) => {
    const record = borrows.find((b) => b.id === borrowRecordId);
    if (!record) return;

    setBorrows((prev) =>
      prev.map((b) => (b.id === borrowRecordId ? { ...b, fineStatus: 'waived' } : b))
    );

    addLog('FINE_WAIVED', `Waived ${record.fineAmount} BDT fine for ${record.studentName} on "${record.bookTitle}"`, 'Admin');
  };

  // Reservations
  const createReservation = (bookId: string, studentId: string): { success: boolean; message: string } => {
    const book = books.find((b) => b.id === bookId);
    const student = students.find((s) => s.studentId === studentId);
    if (!book || !student) return { success: false, message: 'Book or student not found' };

    const existing = reservations.find(
      (r) => r.bookId === bookId && r.studentId === studentId && (r.status === 'pending' || r.status === 'ready_for_pickup')
    );
    if (existing) {
      return { success: false, message: 'You already have an active reservation for this book.' };
    }

    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      studentId,
      studentName: student.name,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      queuePosition: reservations.filter((r) => r.bookId === bookId && r.status === 'pending').length + 1,
    };

    setReservations((prev) => [newRes, ...prev]);
    return { success: true, message: `Reservation placed. You are #${newRes.queuePosition} in the waitlist.` };
  };

  const cancelReservation = (reservationId: string) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, status: 'cancelled' } : r))
    );
  };

  const updateFineSettings = (newSettings: Partial<FineSettings>) => {
    setFineSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetAllData = () => {
    setBooks(INITIAL_BOOKS);
    setStudents(INITIAL_STUDENTS);
    setBorrows(INITIAL_BORROWS);
    setReservations(INITIAL_RESERVATIONS);
    setFineSettings(INITIAL_FINE_SETTINGS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.BOOKS);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.BORROWS);
    localStorage.removeItem(STORAGE_KEYS.RESERVATIONS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  };

  // Computed statistics
  const totalTitles = books.length;
  const totalVolumes = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const availableVolumes = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const issuedVolumes = totalVolumes - availableVolumes;
  const overdueRecords = borrows.filter((b) => b.status === 'overdue');
  const overdueCount = overdueRecords.length;
  const totalFinesCollected = borrows
    .filter((b) => b.fineStatus === 'paid')
    .reduce((acc, b) => acc + b.fineAmount, 0);
  const totalUnpaidFines = borrows
    .filter((b) => b.fineStatus === 'unpaid')
    .reduce((acc, b) => acc + b.fineAmount, 0);
  const activeStudents = students.filter((s) => s.cardStatus === 'active').length;

  return (
    <LibraryContext.Provider
      value={{
        books,
        students,
        borrows,
        reservations,
        fineSettings,
        activityLogs,
        currentRole,
        currentStudent,
        setCurrentRole,
        setCurrentStudent,
        addBook,
        updateBook,
        deleteBook,
        addStudent,
        updateStudent,
        issueBook,
        returnBook,
        payFine,
        waiveFine,
        createReservation,
        cancelReservation,
        updateFineSettings,
        resetAllData,
        stats: {
          totalTitles,
          totalVolumes,
          availableVolumes,
          issuedVolumes,
          overdueCount,
          totalFinesCollected,
          totalUnpaidFines,
          activeStudents,
        },
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextType => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

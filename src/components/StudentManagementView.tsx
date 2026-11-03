import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Student } from '../types/library';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
} from 'lucide-react';

export const StudentManagementView: React.FC = () => {
  const { students, borrows, fineSettings, addStudent, updateStudent } = useLibrary();

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    email: '',
    department: 'Computer Science & Engineering',
    sessionYear: '2023-2027',
    phone: '+880 1700-000000',
    maxAllowedBooks: 3,
  });

  const departments = ['All', ...Array.from(new Set(students.map((s) => s.department)))];

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.studentId.toLowerCase().includes(search.toLowerCase()) ||
      st.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || st.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.studentId) return;

    addStudent({
      name: newStudent.name,
      studentId: newStudent.studentId,
      email: newStudent.email || `${newStudent.studentId.toLowerCase()}@university.edu`,
      department: newStudent.department,
      sessionYear: newStudent.sessionYear,
      phone: newStudent.phone,
      cardStatus: 'active',
      maxAllowedBooks: Number(newStudent.maxAllowedBooks),
      joinDate: new Date().toISOString().split('T')[0],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    });

    setShowAddModal(false);
    setNewStudent({
      name: '',
      studentId: '',
      email: '',
      department: 'Computer Science & Engineering',
      sessionYear: '2023-2027',
      phone: '+880 1700-000000',
      maxAllowedBooks: 3,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Register Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Student & Patron Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student registrations, borrowing quotas, active cards, and digital library passes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, roll/ID, or university email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer transition-colors ${
                selectedDept === dept
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Student Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const studentBorrows = borrows.filter(
            (b) => b.studentId === student.studentId && (b.status === 'active' || b.status === 'overdue')
          );
          const activeOverdue = studentBorrows.filter((b) => b.status === 'overdue');
          const unpaidFines = studentBorrows.reduce((sum, b) => (b.fineStatus === 'unpaid' ? sum + b.fineAmount : sum), 0);

          return (
            <div
              key={student.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={student.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                      <p className="text-[11px] font-mono text-indigo-600 font-semibold">{student.studentId}</p>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[170px]">{student.department}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      student.cardStatus === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {student.cardStatus}
                  </span>
                </div>

                {/* Quota & Loans */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Active Loans</span>
                    <span className="font-bold text-slate-800">
                      {studentBorrows.length} / {student.maxAllowedBooks} Books
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Pending Fines</span>
                    <span className={`font-bold font-mono ${unpaidFines > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {unpaidFines} {fineSettings.currency}
                    </span>
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <p className="flex items-center space-x-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{student.email}</span>
                  </p>
                  <p className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Session: {student.sessionYear}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStudentForCard(student)}
                  className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1"
                >
                  <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Digital ID Card</span>
                </button>

                <button
                  onClick={() => {
                    const newStatus = student.cardStatus === 'active' ? 'suspended' : 'active';
                    updateStudent(student.id, { cardStatus: newStatus });
                  }}
                  className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg cursor-pointer ${
                    student.cardStatus === 'active'
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={student.cardStatus === 'active' ? 'Suspend Library Card' : 'Reactivate Library Card'}
                >
                  {student.cardStatus === 'active' ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Digital Library Card Modal */}
      {selectedStudentForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 printable-card">
            {/* Card Visual Container */}
            <div className="bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden border border-indigo-500/20">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-indigo-500/20 via-transparent to-transparent pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs tracking-tight uppercase">Central University</h5>
                    <p className="text-[9px] text-indigo-300">Smart Library Membership Card</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Active
                </span>
              </div>

              {/* Student Details */}
              <div className="flex space-x-4 my-4 items-center">
                <img
                  src={selectedStudentForCard.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={selectedStudentForCard.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-400 shadow-md shrink-0"
                />
                <div className="text-xs">
                  <h4 className="font-extrabold text-white text-sm">{selectedStudentForCard.name}</h4>
                  <p className="font-mono text-indigo-300 font-semibold text-xs mt-0.5">{selectedStudentForCard.studentId}</p>
                  <p className="text-[10px] text-slate-300 mt-1">{selectedStudentForCard.department}</p>
                  <p className="text-[9px] text-slate-400">Session: {selectedStudentForCard.sessionYear}</p>
                </div>
              </div>

              {/* Simulated Barcode */}
              <div className="pt-3 border-t border-white/10 text-center">
                <div className="flex justify-center space-x-1 py-1 font-mono tracking-widest text-xs text-white">
                  ||||| | |||| ||| |||| | ||||| || ||| ||||
                </div>
                <p className="text-[10px] font-mono text-indigo-300">{selectedStudentForCard.studentId}</p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Physical Card</span>
              </button>
              <button
                onClick={() => setSelectedStudentForCard(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Register New Student Patron</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahfuzur Rahman"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Student ID / Roll *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2023-CSE-099"
                    value={newStudent.studentId}
                    onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Session Year</label>
                  <input
                    type="text"
                    placeholder="2023-2027"
                    value={newStudent.sessionYear}
                    onChange={(e) => setNewStudent({ ...newStudent, sessionYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Department</label>
                <select
                  value={newStudent.department}
                  onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Business Administration">Business Administration</option>
                  <option value="Physics & Mathematics">Physics & Mathematics</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
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
                  Register Student & Issue Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

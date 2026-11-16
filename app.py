"""
app.py - Main Flask Application for Smart Library Management System
Beginner-friendly, clean, and well-commented code.
"""

from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
from datetime import datetime, timedelta
from database import get_db_connection, init_db
from ai_recommender import recommend_books_for_user, recommend_similar_books, smart_ai_search

# Frontend files are maintained in the sibling ../frontend folder.
from pathlib import Path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
app = Flask(
    __name__,
    template_folder=str(PROJECT_ROOT / "frontend" / "templates"),
    static_folder=str(PROJECT_ROOT / "frontend" / "static"),
)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-change-this-key")

# Rate for overdue fine (e.g., 5 BDT/Tk or currency units per day overdue)
FINE_PER_DAY = 5.0

# Ensure database and initial tables exist on startup
init_db()


def calculate_overdue_fine(due_date_str, return_date_str=None):
    """
    Beginner-friendly helper function to calculate overdue fines.
    If today > due_date, fine = (days_late * FINE_PER_DAY).
    """
    try:
        due_date = datetime.strptime(due_date_str, "%Y-%m-%d").date()
        if return_date_str:
            check_date = datetime.strptime(return_date_str, "%Y-%m-%d").date()
        else:
            check_date = datetime.now().date()

        if check_date > due_date:
            days_overdue = (check_date - due_date).days
            return days_overdue, round(days_overdue * FINE_PER_DAY, 2)
        else:
            return 0, 0.0
    except Exception:
        return 0, 0.0


# -------------------------------------------------------------
# Home & Public Routes
# -------------------------------------------------------------

@app.route("/")
def index():
    """Homepage showing library stats, featured books, and quick search."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Basic stats for the homepage
    total_books = cursor.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    total_students = cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student'").fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM borrow_records WHERE status = 'issued'")
    active_loans = cursor.fetchone()[0]

    # Fetch 6 featured books
    cursor.execute("SELECT * FROM books ORDER BY id DESC LIMIT 6")
    featured_books = cursor.fetchall()

    conn.close()

    # If student is logged in, also fetch personalized AI recommendations for homepage
    user_recommendations = []
    if session.get("role") == "student":
        user_recommendations = recommend_books_for_user(session["user_id"], limit=3)

    return render_template(
        "index.html",
        total_books=total_books,
        total_students=total_students,
        active_loans=active_loans,
        featured_books=featured_books,
        recommendations=user_recommendations
    )


@app.route("/books")
def book_list():
    """Book catalog with Smart AI Search and Category filtering."""
    search_query = request.args.get("search", "").strip()
    category_filter = request.args.get("category", "").strip()

    conn = get_db_connection()
    # Get all distinct categories for the filter dropdown
    categories = [row["category"] for row in conn.execute("SELECT DISTINCT category FROM books").fetchall()]

    if search_query:
        # Use our Smart AI search engine!
        books = smart_ai_search(search_query)
        if category_filter:
            books = [b for b in books if b["category"].lower() == category_filter.lower()]
    elif category_filter:
        books = conn.execute("SELECT * FROM books WHERE category = ?", (category_filter,)).fetchall()
        books = [dict(b) for b in books]
    else:
        books = conn.execute("SELECT * FROM books ORDER BY title ASC").fetchall()
        books = [dict(b) for b in books]

    conn.close()
    return render_template("books.html", books=books, categories=categories, selected_category=category_filter, search_query=search_query)


@app.route("/book/<int:book_id>")
def book_details(book_id):
    """View details of a single book + AI-recommended similar books."""
    conn = get_db_connection()
    book = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()

    if not book:
        flash("Book not found!", "danger")
        return redirect(url_for("book_list"))

    # AI Feature: Find similar books
    similar_books = recommend_similar_books(book_id, limit=3)

    return render_template("book_details.html", book=book, similar_books=similar_books)


# -------------------------------------------------------------
# User Authentication (Login, Register, Logout)
# -------------------------------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    """Simple login route for both Admin and Students."""
    if request.method == "POST":
        username = request.form["username"].strip()
        password = request.form["password"].strip()

        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password)).fetchone()
        conn.close()

        if user:
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["full_name"] = user["full_name"]
            session["role"] = user["role"]
            flash(f"Welcome back, {user['full_name']}!", "success")

            if user["role"] == "admin":
                return redirect(url_for("admin_dashboard"))
            else:
                return redirect(url_for("student_dashboard"))
        else:
            flash("Invalid username or password. Please try again.", "danger")

    return render_template("login.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Simple student registration page."""
    if request.method == "POST":
        full_name = request.form["full_name"].strip()
        username = request.form["username"].strip()
        email = request.form["email"].strip()
        password = request.form["password"].strip()

        if not (full_name and username and email and password):
            flash("All fields are required!", "danger")
            return redirect(url_for("register"))

        conn = get_db_connection()
        try:
            conn.execute("""
                INSERT INTO users (username, password, full_name, email, role)
                VALUES (?, ?, ?, ?, 'student')
            """, (username, password, full_name, email))
            conn.commit()
            conn.close()
            flash("Registration successful! You can now log in.", "success")
            return redirect(url_for("login"))
        except Exception:
            conn.close()
            flash("Username already taken! Please choose another one.", "danger")

    return render_template("register.html")


@app.route("/logout")
def logout():
    """Clear session data and redirect to homepage."""
    session.clear()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("index"))


# -------------------------------------------------------------
# Student Actions (Borrow, Return, Dashboard, AI Suggestions)
# -------------------------------------------------------------

@app.route("/borrow/<int:book_id>", methods=["POST"])
def borrow_book(book_id):
    """Student borrows a book."""
    if "user_id" not in session:
        flash("Please log in to borrow books.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check book availability
    book = cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    if not book:
        conn.close()
        flash("Book not found.", "danger")
        return redirect(url_for("book_list"))

    if book["available_copies"] <= 0:
        conn.close()
        flash("Sorry, this book is currently out of stock!", "warning")
        return redirect(url_for("book_details", book_id=book_id))

    # Check if student already has an active issue of this same book
    existing = cursor.execute("""
        SELECT * FROM borrow_records 
        WHERE user_id = ? AND book_id = ? AND status = 'issued'
    """, (user_id, book_id)).fetchone()

    if existing:
        conn.close()
        flash("You already have this book currently borrowed!", "warning")
        return redirect(url_for("student_dashboard"))

    # Issue book: Set issue date = today, due date = today + 14 days
    today = datetime.now()
    issue_date = today.strftime("%Y-%m-%d")
    due_date = (today + timedelta(days=14)).strftime("%Y-%m-%d")

    cursor.execute("""
        INSERT INTO borrow_records (user_id, book_id, issue_date, due_date, status, fine_amount)
        VALUES (?, ?, ?, ?, 'issued', 0.0)
    """, (user_id, book_id, issue_date, due_date))

    # Decrement available copies
    cursor.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()

    flash(f"Successfully borrowed '{book['title']}'! Due date: {due_date}", "success")
    return redirect(url_for("student_dashboard"))


@app.route("/return/<int:record_id>", methods=["POST"])
def return_book(record_id):
    """Return an issued book and calculate any overdue fine."""
    if "user_id" not in session:
        flash("Please log in first.", "warning")
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()

    record = cursor.execute("SELECT * FROM borrow_records WHERE id = ?", (record_id,)).fetchone()
    if not record:
        conn.close()
        flash("Borrow record not found.", "danger")
        return redirect(url_for("index"))

    # If regular student, check that record belongs to them
    if session.get("role") != "admin" and record["user_id"] != session["user_id"]:
        conn.close()
        flash("Unauthorized action.", "danger")
        return redirect(url_for("student_dashboard"))

    if record["status"] == "returned":
        conn.close()
        flash("This book is already returned.", "info")
        return redirect(url_for("student_dashboard"))

    # Calculate return date and fine
    today_str = datetime.now().strftime("%Y-%m-%d")
    days_overdue, fine = calculate_overdue_fine(record["due_date"], today_str)

    # Update record
    cursor.execute("""
        UPDATE borrow_records 
        SET return_date = ?, status = 'returned', fine_amount = ?
        WHERE id = ?
    """, (today_str, fine, record_id))

    # Increase available copies back in stock
    cursor.execute("UPDATE books SET available_copies = available_copies + 1 WHERE id = ?", (record["book_id"],))

    conn.commit()
    conn.close()

    if fine > 0:
        flash(f"Book returned! It was {days_overdue} days overdue. Calculated fine: ${fine:.2f} (Tk {fine:.2f})", "warning")
    else:
        flash("Book returned on time! Thank you.", "success")

    if session.get("role") == "admin":
        return redirect(url_for("admin_issues"))
    return redirect(url_for("student_dashboard"))


@app.route("/my-dashboard")
def student_dashboard():
    """Student portal: shows active loans, return history, overdue status, and AI suggestions."""
    if "user_id" not in session or session.get("role") != "student":
        flash("Please log in as a student to access your dashboard.", "warning")
        return redirect(url_for("login"))

    user_id = session["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor()

    # Active borrowed books
    cursor.execute("""
        SELECT r.id as record_id, r.issue_date, r.due_date, r.status,
               b.id as book_id, b.title, b.author, b.category, b.cover_color
        FROM borrow_records r
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ? AND r.status = 'issued'
        ORDER BY r.due_date ASC
    """, (user_id,))
    active_loans_raw = cursor.fetchall()

    # Process active loans to calculate live overdue days and fines
    active_loans = []
    total_pending_fine = 0.0

    for loan in active_loans_raw:
        item = dict(loan)
        days_late, current_fine = calculate_overdue_fine(loan["due_date"])
        item["days_late"] = days_late
        item["current_fine"] = current_fine
        total_pending_fine += current_fine
        active_loans.append(item)

    # Borrow history (returned books)
    cursor.execute("""
        SELECT r.id as record_id, r.issue_date, r.due_date, r.return_date, r.fine_amount,
               b.id as book_id, b.title, b.author, b.category
        FROM borrow_records r
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ? AND r.status = 'returned'
        ORDER BY r.return_date DESC
    """, (user_id,))
    history = cursor.fetchall()

    conn.close()

    # AI Feature: Personalized recommendations for this student!
    ai_recommendations = recommend_books_for_user(user_id, limit=4)

    return render_template(
        "student_dashboard.html",
        active_loans=active_loans,
        history=history,
        total_pending_fine=total_pending_fine,
        recommendations=ai_recommendations
    )


# -------------------------------------------------------------
# Admin / Librarian Management Routes
# -------------------------------------------------------------

@app.route("/admin/dashboard")
def admin_dashboard():
    """Librarian Admin Dashboard overview."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Summary metrics
    total_books = cursor.execute("SELECT COUNT(*) FROM books").fetchone()[0]
    total_copies = cursor.execute("SELECT COALESCE(SUM(total_copies), 0) FROM books").fetchone()[0]
    total_students = cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student'").fetchone()[0]
    active_loans = cursor.execute("SELECT COUNT(*) FROM borrow_records WHERE status = 'issued'").fetchone()[0]
    total_fines = cursor.execute("SELECT COALESCE(SUM(fine_amount), 0) FROM borrow_records").fetchone()[0]

    # Recent issued records
    cursor.execute("""
        SELECT r.id, r.issue_date, r.due_date, r.status,
               u.full_name as student_name, b.title as book_title
        FROM borrow_records r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
        ORDER BY r.id DESC LIMIT 5
    """)
    recent_activity = cursor.fetchall()

    conn.close()

    return render_template(
        "admin_dashboard.html",
        total_books=total_books,
        total_copies=total_copies,
        total_students=total_students,
        active_loans=active_loans,
        total_fines=total_fines,
        recent_activity=recent_activity
    )


@app.route("/admin/books")
def manage_books():
    """Admin view: list all books with Add/Edit/Delete actions."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    books = conn.execute("SELECT * FROM books ORDER BY id DESC").fetchall()
    conn.close()

    return render_template("manage_books.html", books=books)


@app.route("/admin/add-book", methods=["GET", "POST"])
def add_book():
    """Admin adds a new book to the library."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    if request.method == "POST":
        title = request.form["title"].strip()
        author = request.form["author"].strip()
        category = request.form["category"].strip()
        isbn = request.form["isbn"].strip()
        description = request.form["description"].strip()
        total_copies = int(request.form.get("total_copies", 1))

        if not (title and author and category and isbn):
            flash("Title, Author, Category, and ISBN are required!", "danger")
            return redirect(url_for("add_book"))

        conn = get_db_connection()
        try:
            conn.execute("""
                INSERT INTO books (title, author, category, isbn, description, total_copies, available_copies)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (title, author, category, isbn, description, total_copies, total_copies))
            conn.commit()
            conn.close()
            flash(f"Book '{title}' added successfully!", "success")
            return redirect(url_for("manage_books"))
        except Exception as e:
            conn.close()
            flash(f"Error adding book (ISBN might already exist): {e}", "danger")

    return render_template("add_book.html")


@app.route("/admin/edit-book/<int:book_id>", methods=["GET", "POST"])
def edit_book(book_id):
    """Admin edits an existing book."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    book = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()

    if not book:
        conn.close()
        flash("Book not found.", "danger")
        return redirect(url_for("manage_books"))

    if request.method == "POST":
        title = request.form["title"].strip()
        author = request.form["author"].strip()
        category = request.form["category"].strip()
        isbn = request.form["isbn"].strip()
        description = request.form["description"].strip()
        total_copies = int(request.form.get("total_copies", book["total_copies"]))
        
        # Calculate new available copies based on change in total copies
        borrowed_count = book["total_copies"] - book["available_copies"]
        new_available = max(0, total_copies - borrowed_count)

        conn.execute("""
            UPDATE books
            SET title = ?, author = ?, category = ?, isbn = ?, description = ?, total_copies = ?, available_copies = ?
            WHERE id = ?
        """, (title, author, category, isbn, description, total_copies, new_available, book_id))
        conn.commit()
        conn.close()

        flash(f"Book '{title}' updated successfully!", "success")
        return redirect(url_for("manage_books"))

    conn.close()
    return render_template("edit_book.html", book=book)


@app.route("/admin/delete-book/<int:book_id>", methods=["POST"])
def delete_book(book_id):
    """Admin deletes a book if it has no active borrows."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if there are active loans
    active = cursor.execute("SELECT * FROM borrow_records WHERE book_id = ? AND status = 'issued'", (book_id,)).fetchone()
    if active:
        conn.close()
        flash("Cannot delete this book because copies are currently issued to students!", "warning")
        return redirect(url_for("manage_books"))

    # Delete records and book
    cursor.execute("DELETE FROM borrow_records WHERE book_id = ?", (book_id,))
    cursor.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()

    flash("Book deleted successfully.", "info")
    return redirect(url_for("manage_books"))


@app.route("/admin/issues")
def admin_issues():
    """Admin view: all borrowing records with overdue badges and return actions."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    status_filter = request.args.get("status", "all")
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT r.id, r.issue_date, r.due_date, r.return_date, r.status, r.fine_amount,
               u.full_name as student_name, u.email as student_email,
               b.id as book_id, b.title as book_title
        FROM borrow_records r
        JOIN users u ON r.user_id = u.id
        JOIN books b ON r.book_id = b.id
    """

    if status_filter == "issued":
        query += " WHERE r.status = 'issued'"
    elif status_filter == "returned":
        query += " WHERE r.status = 'returned'"

    query += " ORDER BY r.id DESC"

    cursor.execute(query)
    raw_records = cursor.fetchall()
    conn.close()

    # Calculate dynamic overdue stats for display
    records = []
    for rec in raw_records:
        item = dict(rec)
        if item["status"] == "issued":
            days_late, current_fine = calculate_overdue_fine(item["due_date"])
            item["days_late"] = days_late
            item["current_fine"] = current_fine
        else:
            item["days_late"] = 0
            item["current_fine"] = item["fine_amount"]
        records.append(item)

    return render_template("issued_list.html", records=records, current_filter=status_filter)


@app.route("/admin/issue-book", methods=["GET", "POST"])
def admin_issue_book():
    """Admin manually issues a book to a selected student."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()

    if request.method == "POST":
        student_id = int(request.form["student_id"])
        book_id = int(request.form["book_id"])

        book = cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
        if not book or book["available_copies"] <= 0:
            flash("Selected book is out of stock!", "danger")
            conn.close()
            return redirect(url_for("admin_issue_book"))

        today = datetime.now()
        issue_date = today.strftime("%Y-%m-%d")
        due_date = (today + timedelta(days=14)).strftime("%Y-%m-%d")

        cursor.execute("""
            INSERT INTO borrow_records (user_id, book_id, issue_date, due_date, status, fine_amount)
            VALUES (?, ?, ?, ?, 'issued', 0.0)
        """, (student_id, book_id, issue_date, due_date))

        cursor.execute("UPDATE books SET available_copies = available_copies - 1 WHERE id = ?", (book_id,))
        conn.commit()
        conn.close()

        flash("Book successfully issued to student!", "success")
        return redirect(url_for("admin_issues"))

    # GET: Load students and available books
    students = cursor.execute("SELECT id, full_name, username FROM users WHERE role = 'student' ORDER BY full_name").fetchall()
    books = cursor.execute("SELECT id, title, available_copies FROM books WHERE available_copies > 0 ORDER BY title").fetchall()
    conn.close()

    return render_template("issue_book.html", students=students, books=books)


@app.route("/admin/students")
def manage_students():
    """Admin view: all registered students and their total borrow counts."""
    if session.get("role") != "admin":
        flash("Admin access required.", "danger")
        return redirect(url_for("login"))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, u.email, u.created_at,
               COUNT(r.id) as total_borrowed,
               SUM(CASE WHEN r.status = 'issued' THEN 1 ELSE 0 END) as active_borrowed,
               SUM(r.fine_amount) as total_fines
        FROM users u
        LEFT JOIN borrow_records r ON u.id = r.user_id
        WHERE u.role = 'student'
        GROUP BY u.id
        ORDER BY u.id DESC
    """)
    students = cursor.fetchall()
    conn.close()

    return render_template("manage_students.html", students=students)


if __name__ == "__main__":
    # Runs the web application locally on port 5000
    print("==================================================")
    print(" Smart Library Management System is Starting...   ")
    print(" Web App URL: http://127.0.0.1:5000               ")
    print(" Admin Login: admin / admin123                    ")
    print(" Student Login: student1 / student123             ")
    print("==================================================")
    app.run(debug=True, port=5000)

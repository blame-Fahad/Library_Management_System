"""
database.py - Database setup and helper functions for Smart Library Management System.
This file creates the SQLite database tables and inserts starter data.
Beginner-friendly: uses standard Python sqlite3 module.
"""

import sqlite3
import os
from datetime import datetime, timedelta

DB_NAME = "library.db"

def get_db_connection():
    """Connect to the SQLite database and return rows as dictionaries."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row  # Allows accessing columns by name: row['title']
    return conn

def init_db():
    """Create all necessary tables if they do not exist, and add sample data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table (Stores Admin and Student accounts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student', -- 'student' or 'admin'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Books Table (Stores book catalog and availability)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        isbn TEXT UNIQUE NOT NULL,
        description TEXT,
        total_copies INTEGER NOT NULL DEFAULT 1,
        available_copies INTEGER NOT NULL DEFAULT 1,
        cover_color TEXT DEFAULT '#2c3e50'
    )
    """)

    # 3. Borrow Records Table (Tracks book issues, returns, due dates, and fines)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS borrow_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book_id INTEGER NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        return_date TEXT,
        status TEXT NOT NULL DEFAULT 'issued', -- 'issued' or 'returned'
        fine_amount REAL DEFAULT 0.0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (book_id) REFERENCES books (id)
    )
    """)

    conn.commit()

    # Insert default users if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO users (username, password, full_name, email, role)
        VALUES 
            ('admin', 'admin123', 'Head Librarian', 'admin@library.com', 'admin'),
            ('student1', 'student123', 'Rahim Ahmed', 'rahim@university.edu', 'student'),
            ('student2', 'student123', 'Fatima Khan', 'fatima@university.edu', 'student')
        """)
        conn.commit()
        print("Default users created: admin/admin123, student1/student123, student2/student123")

    # Insert sample books if books table is empty
    cursor.execute("SELECT COUNT(*) FROM books")
    if cursor.fetchone()[0] == 0:
        sample_books = [
            (
                "Introduction to Python Programming",
                "Guido van Rossum",
                "Computer Science",
                "978-0134076423",
                "A beginner friendly guide to learning Python basics, data structures, algorithms, and logic building.",
                5, 4, "#2980b9"
            ),
            (
                "Machine Learning for Beginners",
                "Andrew Ng",
                "Computer Science",
                "978-1491957660",
                "Understand fundamental concepts of artificial intelligence, machine learning algorithms, and neural networks.",
                4, 3, "#8e44ad"
            ),
            (
                "Clean Code: A Handbook of Agile Craftsmanship",
                "Robert C. Martin",
                "Computer Science",
                "978-0132350884",
                "Best practices for writing readable, maintainable, and professional software code.",
                3, 3, "#27ae60"
            ),
            (
                "Data Structures and Algorithms in Python",
                "Michael T. Goodrich",
                "Computer Science",
                "978-1118290279",
                "In-depth guide covering arrays, linked lists, stacks, queues, trees, graphs, and search algorithms.",
                4, 4, "#16a085"
            ),
            (
                "To Kill a Mockingbird",
                "Harper Lee",
                "Literature",
                "978-0061120084",
                "A classic American novel exploring warmth, humor, courage, and serious racial issues in the Deep South.",
                6, 5, "#d35400"
            ),
            (
                "The Great Gatsby",
                "F. Scott Fitzgerald",
                "Literature",
                "978-0743273565",
                "A story of triumph and tragedy set in the Jazz Age exploring dreams, wealth, and human emotions.",
                5, 5, "#c0392b"
            ),
            (
                "1984: A Dystopian Masterpiece",
                "George Orwell",
                "Fiction",
                "978-0451524935",
                "A thought-provoking novel set in a totalitarian world ruled by Big Brother, surveillance, and control.",
                5, 4, "#7f8c8d"
            ),
            (
                "A Brief History of Time",
                "Stephen Hawking",
                "Science",
                "978-0553380163",
                "Explores the origins of the universe, space, time, black holes, and the mysteries of modern physics.",
                4, 4, "#2c3e50"
            ),
            (
                "Sapiens: A Brief History of Humankind",
                "Yuval Noah Harari",
                "History",
                "978-0062316097",
                "How humans conquered the earth, the agricultural revolution, capitalism, and the future of humanity.",
                5, 5, "#e67e22"
            ),
            (
                "Artificial Intelligence: A Modern Approach",
                "Stuart Russell",
                "Computer Science",
                "978-0136042594",
                "The most comprehensive textbook on AI concepts, intelligent agents, search algorithms, and logic.",
                3, 2, "#9b59b6"
            )
        ]

        cursor.executemany("""
        INSERT INTO books (title, author, category, isbn, description, total_copies, available_copies, cover_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, sample_books)
        conn.commit()
        print("Sample books added to library catalog.")

        # Create one initial borrow record for student1 so AI recommendations can be demonstrated immediately!
        today = datetime.now()
        past_issue = (today - timedelta(days=10)).strftime("%Y-%m-%d")
        past_due = (today - timedelta(days=3)).strftime("%Y-%m-%d") # 3 days overdue to demonstrate fine
        
        cursor.execute("""
        INSERT INTO borrow_records (user_id, book_id, issue_date, due_date, status, fine_amount)
        VALUES (2, 1, ?, ?, 'issued', 15.0)
        """, (past_issue, past_due))
        
        # Also mark student2 with a returned record
        cursor.execute("""
        INSERT INTO borrow_records (user_id, book_id, issue_date, due_date, return_date, status, fine_amount)
        VALUES (3, 2, ?, ?, ?, 'returned', 0.0)
        """, (past_issue, past_due, past_due))
        conn.commit()
        print("Sample borrowing history added for testing.")

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")

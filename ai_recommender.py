"""
ai_recommender.py - Simple AI Recommendation & Smart Search Engine
This module provides AI features using beginner-friendly Content-Based Filtering:
1. Recommends books to a student based on their past borrowing history and interests.
2. Recommends similar books when viewing a specific book details page.
3. Provides Smart AI Search that ranks books based on relevance to query keywords.

Beginner Explanation:
- Content-Based Filtering looks at what categories, authors, and keywords a user previously liked.
- It then calculates a 'Match Score' for other books in the library.
- The highest scoring books are recommended to the user!
"""

import re
from database import get_db_connection

def clean_text(text):
    """Simple helper function to convert text to lowercase words."""
    if not text:
        return set()
    # Split text into lowercase words, removing special symbols
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    # Remove common filler words (stop words) that don't help in matching
    stop_words = {'the', 'and', 'for', 'with', 'that', 'this', 'from', 'book', 'guide', 'into', 'about'}
    return set(words) - stop_words

def calculate_similarity_score(keywords1, keywords2):
    """
    Beginner-friendly Jaccard / Overlap similarity score.
    Returns a score between 0.0 and 1.0 based on how many words match.
    Formula: (Matching Words) / (Total Unique Words)
    """
    if not keywords1 or not keywords2:
        return 0.0
    
    intersection = keywords1.intersection(keywords2)
    union = keywords1.union(keywords2)
    
    if not union:
        return 0.0
    
    return len(intersection) / len(union)

def recommend_books_for_user(user_id, limit=4):
    """
    AI Feature 1: Personalized Book Recommendation for a Student.
    Analyzes all books previously borrowed by the student.
    Finds unborrowed books with matching category, author, and description keywords.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Step 1: Get the list of books the user has borrowed
    cursor.execute("""
        SELECT b.id, b.title, b.author, b.category, b.description 
        FROM borrow_records r
        JOIN books b ON r.book_id = b.id
        WHERE r.user_id = ?
    """, (user_id,))
    borrowed_books = cursor.fetchall()

    # Step 2: Get all books currently in the library
    cursor.execute("SELECT * FROM books")
    all_books = cursor.fetchall()
    conn.close()

    # If student has never borrowed any book yet, return top available books as general recommendations
    if not borrowed_books:
        # Return popular / highly available books
        sorted_books = sorted(all_books, key=lambda b: b['available_copies'], reverse=True)
        results = []
        for book in sorted_books[:limit]:
            book_dict = dict(book)
            book_dict['match_score'] = 75  # Default friendly starter score
            book_dict['recommendation_reason'] = "Popular starter book for new library members"
            results.append(book_dict)
        return results

    # Step 3: Build user preference profile (favorite categories, authors, keywords)
    borrowed_ids = set()
    user_categories = []
    user_authors = []
    user_keywords = set()

    for b in borrowed_books:
        borrowed_ids.add(b['id'])
        user_categories.append(b['category'])
        user_authors.append(b['author'])
        # Add keywords from description and title
        combined_text = f"{b['title']} {b['category']} {b['description']}"
        user_keywords.update(clean_text(combined_text))

    # Step 4: Score every unborrowed book in the library
    scored_candidates = []

    for book in all_books:
        # Skip books the student has already borrowed
        if book['id'] in borrowed_ids:
            continue

        score = 0.0
        reason_parts = []

        # Category Match (Weight: 40 points)
        if book['category'] in user_categories:
            score += 40
            reason_parts.append(f"matches your interest in {book['category']}")

        # Author Match (Weight: 30 points)
        if book['author'] in user_authors:
            score += 30
            reason_parts.append(f"written by {book['author']}")

        # Keyword & Content Match (Weight: up to 30 points)
        book_keywords = clean_text(f"{book['title']} {book['description']}")
        content_sim = calculate_similarity_score(user_keywords, book_keywords)
        keyword_score = round(content_sim * 30, 1)
        score += keyword_score

        if keyword_score > 5 and not reason_parts:
            reason_parts.append("shares topics and themes with your reading history")

        # Normalize score into a friendly percentage (capped at 98%)
        final_percentage = min(int(score), 98)

        # Only recommend if score has some relevance (or give at least a baseline score)
        if final_percentage > 15:
            book_dict = dict(book)
            book_dict['match_score'] = final_percentage
            book_dict['recommendation_reason'] = "Recommended because it " + (", and ".join(reason_parts) if reason_parts else "is relevant to your interests")
            scored_candidates.append(book_dict)

    # Sort from highest score to lowest score
    scored_candidates.sort(key=lambda x: x['match_score'], reverse=True)

    # If there are not enough scored candidates, append some available unborrowed books
    if len(scored_candidates) < limit:
        for book in all_books:
            if book['id'] not in borrowed_ids and not any(c['id'] == book['id'] for c in scored_candidates):
                book_dict = dict(book)
                book_dict['match_score'] = 50
                book_dict['recommendation_reason'] = f"Explore new horizons in {book['category']}"
                scored_candidates.append(book_dict)
                if len(scored_candidates) >= limit:
                    break

    return scored_candidates[:limit]


def recommend_similar_books(book_id, limit=3):
    """
    AI Feature 2: Find Similar Books (Used on Book Details page).
    Compares the selected book with all other books by category, author, and description.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get target book
    cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
    target_book = cursor.fetchone()

    if not target_book:
        conn.close()
        return []

    # Get all other books
    cursor.execute("SELECT * FROM books WHERE id != ?", (book_id,))
    other_books = cursor.fetchall()
    conn.close()

    target_keywords = clean_text(f"{target_book['title']} {target_book['category']} {target_book['description']}")
    similar_list = []

    for book in other_books:
        score = 0.0

        # Exact category match gives 50 points
        if book['category'].lower() == target_book['category'].lower():
            score += 50.0

        # Same author gives 30 points
        if book['author'].lower() == target_book['author'].lower():
            score += 30.0

        # Keyword similarity gives up to 20 points
        other_keywords = clean_text(f"{book['title']} {book['description']}")
        sim = calculate_similarity_score(target_keywords, other_keywords)
        score += sim * 20.0

        match_percent = min(int(score), 99)

        if match_percent >= 25:
            book_dict = dict(book)
            book_dict['similarity_score'] = match_percent
            similar_list.append(book_dict)

    similar_list.sort(key=lambda x: x['similarity_score'], reverse=True)
    return similar_list[:limit]


def smart_ai_search(query_text):
    """
    AI Feature 3: Smart Search with Relevance Ranking.
    Instead of simple substring match, splits query terms and scores matches
    across Title (highest weight), Category, Author, and Description.
    """
    if not query_text or not query_text.strip():
        # If no search query, return all books
        conn = get_db_connection()
        books = conn.execute("SELECT * FROM books").fetchall()
        conn.close()
        return [dict(b) for b in books]

    query_words = clean_text(query_text)
    conn = get_db_connection()
    books = conn.execute("SELECT * FROM books").fetchall()
    conn.close()

    ranked_results = []

    for book in books:
        relevance_score = 0
        title_lower = book['title'].lower()
        author_lower = book['author'].lower()
        category_lower = book['category'].lower()
        desc_lower = (book['description'] or '').lower()
        raw_query = query_text.lower().strip()

        # Exact full phrase matches
        if raw_query in title_lower:
            relevance_score += 60
        if raw_query in author_lower:
            relevance_score += 40
        if raw_query in category_lower:
            relevance_score += 30

        # Word-by-word token matching
        for word in query_words:
            if word in title_lower:
                relevance_score += 25
            if word in author_lower:
                relevance_score += 15
            if word in category_lower:
                relevance_score += 15
            if word in desc_lower:
                relevance_score += 8

        if relevance_score > 0:
            book_dict = dict(book)
            book_dict['relevance_score'] = relevance_score
            ranked_results.append(book_dict)

    # Sort results with the most relevant book first
    ranked_results.sort(key=lambda x: x['relevance_score'], reverse=True)
    return ranked_results

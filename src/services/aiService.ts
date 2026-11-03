import { Book, AIRecommendation, AISmartSearchResult, BookInsights } from '../types/library';

export async function fetchAIRecommendations(
  books: Book[],
  history: string[],
  department: string,
  userInterests: string
): Promise<{ recommendations: AIRecommendation[]; aiPowered: boolean }> {
  try {
    const res = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ books, history, department, userInterests }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('API recommendation fallback:', error);
    // Client fallback
    const filtered = books.slice(0, 3).map((b, i) => ({
      bookId: b.id,
      title: b.title,
      author: b.author,
      matchScore: 94 - i * 4,
      reason: `Key textbook in ${b.category} recommended for ${department || 'academic'} curriculum.`,
      suggestedNextTopic: 'Practical applications & laboratory assignments',
    }));
    return { recommendations: filtered, aiPowered: false };
  }
}

export async function fetchAISmartSearch(
  query: string,
  books: Book[]
): Promise<{ results: AISmartSearchResult[]; suggestedTags: string[]; aiPowered: boolean }> {
  try {
    const res = await fetch('/api/ai/smart-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, books }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('API search fallback:', error);
    const q = query.toLowerCase();
    const results = books
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map((b) => ({
        bookId: b.id,
        relevanceScore: 85,
        relevanceExplanation: `Direct keyword match in library index for "${query}".`,
      }));
    return { results, suggestedTags: ['computer-science', 'algorithms', 'engineering'], aiPowered: false };
  }
}

export async function fetchAIBookInsights(book: Book): Promise<BookInsights> {
  try {
    const res = await fetch('/api/ai/book-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        category: book.category,
        isbn: book.isbn,
        publisher: book.publisher,
        year: book.publicationYear,
      }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('API insights fallback:', error);
    return {
      summary: `${book.title} by ${book.author} is an authoritative work in ${book.category}, widely referenced across universities for its depth and structured pedagogical approach.`,
      keyTakeaways: [
        'Rigorous theoretical principles illustrated with real-world problems',
        'Standard curriculum reference with proven problem-solving patterns',
        'Essential resource for academic preparation and research projects',
      ],
      targetAudience: 'Undergraduate and Graduate Students, Faculty Researchers',
      difficultyLevel: 'Intermediate',
      citations: {
        apa: `${book.author} (${book.publicationYear}). ${book.title}. ${book.publisher}.`,
        mla: `${book.author}. ${book.title}. ${book.publisher}, ${book.publicationYear}.`,
        ieee: `[1] ${book.author}, ${book.title}. ${book.publisher}, ${book.publicationYear}.`,
      },
      aiPowered: false,
    };
  }
}

export async function fetchAICatalogHelper(
  title: string,
  author: string
): Promise<{
  suggestedCategory: string;
  deweyDecimal: string;
  suggestedShelf: string;
  description: string;
  tags: string[];
  aiPowered: boolean;
}> {
  try {
    const res = await fetch('/api/ai/catalog-helper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, author }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('API catalog helper fallback:', error);
    return {
      suggestedCategory: 'Computer Science',
      deweyDecimal: '005.13',
      suggestedShelf: 'Rack CS-05, Shelf 2',
      description: `Comprehensive academic reference text exploring modern concepts, practical applications, and core principles.`,
      tags: ['academic', 'reference', 'textbook', 'library-collection'],
      aiPowered: false,
    };
  }
}

export async function sendAIChatMessage(
  message: string,
  chatHistory: { role: string; content: string }[],
  books: Book[]
): Promise<{ reply: string; aiPowered: boolean }> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, chatHistory, books }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn('API chat fallback:', error);
    return {
      reply: `Hello! I'm your Smart Library Assistant. You can ask me to locate books across our racks, explain borrowing limits (max 3 books for 14 days, with 5 BDT/day overdue fine), or generate citations for your research paper. What are you looking to read or study today?`,
      aiPowered: false,
    };
  }
}

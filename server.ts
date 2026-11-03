import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI on the server
let aiClient: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
} catch (error) {
  console.warn('Could not initialize GoogleGenAI with provided key:', error);
}

// Helper to get active AI client
function getAI(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  if (process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      return aiClient;
    } catch {
      return null;
    }
  }
  return null;
}

// 1. AI Book Recommendations Endpoint
app.post('/api/ai/recommendations', async (req, res) => {
  try {
    const { history, userInterests, department, books } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback intelligent heuristics if key not set
      const recommended = (books || []).slice(0, 3).map((b: any, index: number) => ({
        bookId: b.id,
        title: b.title,
        author: b.author,
        matchScore: 95 - index * 5,
        reason: `Highly popular in ${b.category} and aligned with ${department || 'academic'} studies.`,
        suggestedNextTopic: 'Advanced applications and research methodologies'
      }));
      return res.json({ recommendations: recommended, aiPowered: false });
    }

    const bookCatalogSummary = (books || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      tags: b.tags
    }));

    const prompt = `You are an expert academic librarian and recommendation system for a university library.
Available library books catalog:
${JSON.stringify(bookCatalogSummary, null, 2)}

User Profile:
- Department: ${department || 'General Science & Engineering'}
- User Interests / Goals: ${userInterests || 'Computer science, algorithms, modern literature'}
- Previous Borrowing History: ${JSON.stringify(history || [])}

Recommend 3 to 4 books from the provided catalog that best suit the student. Provide an estimated match score (70-99%), a concise rationale explaining why this book fits their academic journey or reading interest, and a suggested topic to explore next.

Return STRICT JSON in the following schema:
[
  {
    "bookId": "string (matching catalog id)",
    "title": "string",
    "author": "string",
    "matchScore": number,
    "reason": "string (2 sentences maximum)",
    "suggestedNextTopic": "string"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '[]';
    const parsed = JSON.parse(text);
    return res.json({ recommendations: parsed, aiPowered: true });
  } catch (error: any) {
    console.error('Error generating AI recommendations:', error);
    // Graceful fallback
    return res.status(500).json({
      error: 'Failed to generate recommendations from AI',
      details: error.message,
    });
  }
});

// 2. AI Smart Semantic Search Endpoint
app.post('/api/ai/smart-search', async (req, res) => {
  try {
    const { query, books } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const ai = getAI();
    if (!ai) {
      // Basic keyword fallback
      const q = query.toLowerCase();
      const matched = (books || [])
        .filter((b: any) => 
          b.title.toLowerCase().includes(q) || 
          b.author.toLowerCase().includes(q) || 
          b.category.toLowerCase().includes(q) ||
          (b.tags && b.tags.some((t: string) => t.toLowerCase().includes(q)))
        )
        .map((b: any) => ({
          bookId: b.id,
          relevanceScore: 88,
          relevanceExplanation: `Matches query keywords in title, author, or category.`
        }));
      return res.json({ results: matched, suggestedTags: ['algorithms', 'engineering', 'programming'], aiPowered: false });
    }

    const catalog = (books || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      description: b.description,
      tags: b.tags
    }));

    const prompt = `You are a smart search engine for an academic library.
Catalog:
${JSON.stringify(catalog, null, 2)}

User Natural Language Query: "${query}"

Analyze the user's intent (which may be conceptual, thematic, or a specific topic like "I need a gentle introduction to neural networks" or "classic dystopia with government surveillance").
Rank the books in the catalog by relevance. Include up to 5 most relevant books.
Also provide 3-4 suggested library tags/topics related to this query.

Return STRICT JSON:
{
  "results": [
    {
      "bookId": "string",
      "relevanceScore": number (1 to 100),
      "relevanceExplanation": "string (1-2 sentences on why it fits the query)"
    }
  ],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, aiPowered: true });
  } catch (error: any) {
    console.error('Error in smart search:', error);
    return res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 3. AI Book Insights & Citation Generator
app.post('/api/ai/book-insights', async (req, res) => {
  try {
    const { title, author, category, isbn, publisher, year } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        summary: `${title} by ${author} is a cornerstone academic work in ${category}, widely referenced across universities for its structured pedagogy.`,
        keyTakeaways: [
          'Foundational theoretical principles and proven industry practices',
          'Rigorous problem sets and modern case studies',
          'Clear mathematical or practical foundations suited for undergraduate & graduate learners'
        ],
        targetAudience: 'Undergraduate and Graduate Students, Researchers',
        difficultyLevel: 'Intermediate',
        citations: {
          apa: `${author} (${year || 2023}). ${title}. ${publisher || 'Academic Press'}.`,
          mla: `${author}. ${title}. ${publisher || 'Academic Press'}, ${year || 2023}.`,
          ieee: `[1] ${author}, ${title}. ${publisher || 'Academic Press'}, ${year || 2023}.`
        },
        aiPowered: false
      });
    }

    const prompt = `Provide an insightful academic breakdown of the book:
Title: "${title}"
Author: "${author}"
Category: "${category}"
Year: "${year || ''}"
Publisher: "${publisher || ''}"

Return STRICT JSON:
{
  "summary": "Concise 3-sentence academic overview of what this book covers and why it is significant.",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "targetAudience": "e.g., 2nd-year CS students, research scholars, general avid readers",
  "difficultyLevel": "Beginner | Intermediate | Advanced",
  "citations": {
    "apa": "Standard APA 7th edition citation string",
    "mla": "Standard MLA 9th edition citation string",
    "ieee": "Standard IEEE citation format"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, aiPowered: true });
  } catch (error: any) {
    console.error('Error in book insights:', error);
    return res.status(500).json({ error: 'Failed to generate insights', details: error.message });
  }
});

// 4. AI Cataloging Assistant (for Librarian when adding new books)
app.post('/api/ai/catalog-helper', async (req, res) => {
  try {
    const { title, author } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        suggestedCategory: 'Computer Science',
        deweyDecimal: '005.13',
        suggestedShelf: 'Rack CS-05, Shelf 2',
        description: `Comprehensive reference text by ${author || 'various authors'} exploring modern concepts, practical implementation, and academic foundations.`,
        tags: ['academic', 'reference', 'textbook'],
        aiPowered: false
      });
    }

    const prompt = `As an expert librarian cataloger, suggest metadata for cataloging a book:
Title: "${title}"
Author: "${author || 'Unknown'}"

Suggest:
1. Standard Academic Category (e.g. Computer Science, Electrical Engineering, Literature, Physics, Mathematics, Business, History, Medicine)
2. Dewey Decimal Classification number (e.g., 005.133 or 530.1)
3. Library Shelf Allocation code (e.g. "Rack CS-02, Shelf 3" or "Rack LIT-01, Shelf 4")
4. A professional 2-3 sentence catalog description
5. 4 to 6 relevant index tags / keywords

Return STRICT JSON:
{
  "suggestedCategory": "string",
  "deweyDecimal": "string",
  "suggestedShelf": "string",
  "description": "string",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json({ ...parsed, aiPowered: true });
  } catch (error: any) {
    console.error('Error in catalog helper:', error);
    return res.status(500).json({ error: 'Catalog helper failed', details: error.message });
  }
});

// 5. Ask Librarian AI Assistant Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, chatHistory, books } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        reply: "Welcome to the Smart Library! I can help you locate books across our racks, explain fine policies (5 BDT/day for overdue items), or suggest study materials. How can I assist your studies today?",
        aiPowered: false
      });
    }

    const catalogMini = (books || []).slice(0, 15).map((b: any) => `${b.title} by ${b.author} [Category: ${b.category}, Shelf: ${b.shelfLocation}, Available: ${b.availableCopies}/${b.totalCopies}]`).join('\n');

    const prompt = `You are 'Lexi', the intelligent AI librarian assistant of the Smart Library.
You are warm, academic, precise, and helpful. You help students find books, understand subject topics, learn how the borrowing rules work (standard borrow duration 14 days, overdue fine 5 BDT/day), and guide them on citations.

Library Sample Catalog:
${catalogMini}

Conversation History:
${(chatHistory || []).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Student: ${message}

Answer politely and informatively. If mentioning books in our library, cite their shelf location and availability. Keep responses concise (under 150 words).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ reply: response.text || "I'm here to help with your library needs.", aiPowered: true });
  } catch (error: any) {
    console.error('Error in AI chat:', error);
    return res.status(500).json({ error: 'AI librarian is unavailable', details: error.message });
  }
});

// Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

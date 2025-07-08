import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const CHROMA_URL = process.env['CHROMA_URL'] || 'http://localhost:8000';
const OLLAMA_EMBED_URL = (process.env['OLLAMA_HOST'] || 'http://localhost:11434') + '/api/embeddings';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text';

// Create a deterministic collection name based on userId
function getCollectionName(userId: string): string {
  // Create a deterministic UUID based on userId
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  // Format as a proper UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export interface EmbeddingChunk {
  id: string;
  text: string;
  metadata: Record<string, any>;
}

interface OllamaEmbeddingResponse {
  embeddings: number[][];
}

interface OllamaSingleEmbeddingResponse {
  embedding: number[];
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const response = await fetch(OLLAMA_EMBED_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_EMBED_MODEL, prompt: text }),
    });
    const data = await response.json() as OllamaSingleEmbeddingResponse;
    if (!data || !Array.isArray(data.embedding)) {
      throw new Error('Invalid embedding response from Ollama');
    }
    embeddings.push(data.embedding);
  }
  return embeddings;
}

async function ensureCollection(collectionName: string) {
  console.log(`Ensuring collection exists: ${collectionName}`);
  try {
    // Try to create the collection (idempotent) - v1 API
    const response = await fetch(`${CHROMA_URL}/api/v1/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: collectionName }),
    });
    console.log(`Collection creation response: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const errorText = await response.text();
      // Accept 500 with UniqueConstraintError as 'already exists'
      if (response.status === 500 && errorText.includes('UniqueConstraintError')) {
        console.warn(`Collection already exists (500 UniqueConstraintError): ${collectionName}`);
        return;
      }
      if (response.status !== 409) { // 409 = already exists
        console.error(`Collection creation failed: ${errorText}`);
        throw new Error(`Failed to create collection: ${response.status} ${response.statusText} - ${errorText}`);
      }
    }
    console.log(`Collection ${collectionName} ensured successfully`);
  } catch (error) {
    console.error('Error ensuring collection:', error);
    throw error;
  }
}

// Helper to get collection id by name
async function getCollectionIdByName(collectionName: string): Promise<string> {
  const response = await fetch(`${CHROMA_URL}/api/v1/collections`);
  if (!response.ok) throw new Error('Failed to list collections');
  const collections = await response.json() as any[];
  const found = collections.find((col: any) => col.name === collectionName);
  if (!found) throw new Error(`Collection ${collectionName} not found after creation`);
  return found.id;
}

export async function storeChatMessage(userId: string, repoId: string, message: string, response: string, action?: string) {
  // Note: This function uses a custom endpoint that may not exist
  // You might need to implement this differently or remove it
  console.warn('storeChatMessage: Custom chat storage not implemented');
  // For now, we'll skip this or implement it differently
}

export async function getChatHistory(userId: string, repoId: string, limit: number = 10) {
  // Note: This function uses a custom endpoint that may not exist
  // You might need to implement this differently or remove it
  console.warn('getChatHistory: Custom chat retrieval not implemented');
  return [];
}

export async function upsertEmbeddings({ userId, repoId, chunks }: { userId: string; repoId: string; chunks: EmbeddingChunk[] }) {
  const collectionName = getCollectionName(userId);
  console.log(`Upserting embeddings for userId: ${userId}, collection: ${collectionName}, chunks: ${chunks.length}`);
  await ensureCollection(collectionName);
  const collectionId = await getCollectionIdByName(collectionName);
  
  const ids = chunks.map((chunk) => chunk.id);
  const texts = chunks.map((chunk) => chunk.text);
  const metadatas = chunks.map((chunk) => ({ ...chunk.metadata, userId, repoId }));
  const embeddings = await getEmbeddings(texts);
  
  // Upsert in batches (Chroma may have payload size limits)
  const batchSize = 50;
  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);
    const batchDocs = texts.slice(i, i + batchSize);
    const batchMetas = metadatas.slice(i, i + batchSize);
    const batchEmbeds = embeddings.slice(i, i + batchSize);
    
    const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionId}/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: batchIds,
        embeddings: batchEmbeds,
        documents: batchDocs,
        metadatas: batchMetas,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ChromaDB upsert failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }
}

export async function queryEmbeddings({ repoId, query, topK = 5 }: { repoId: string; query: string; topK?: number }) {
  const collectionName = getCollectionName(repoId);
  const collectionId = await getCollectionIdByName(collectionName);
  const queryEmbedding = (await getEmbeddings([query]))[0] || [];
  
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('Failed to generate embedding for query');
  }
  
  const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionId}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: topK,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ChromaDB query failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}

export async function deleteEmbeddingsForRepo(repoId: string) {
  const collectionName = getCollectionName(repoId);
  let collectionId: string | null = null;
  try {
    collectionId = await getCollectionIdByName(collectionName);
  } catch {
    // Collection doesn't exist, nothing to delete
    return;
  }
  try {
    const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to delete collection: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting collection:', error);
    // Don't throw here as the collection might not exist
  }
} 
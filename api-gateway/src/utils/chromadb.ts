import fetch from 'node-fetch';

const CHROMA_URL = process.env['CHROMA_URL'] || 'http://localhost:8000';
const OLLAMA_EMBED_URL = (process.env['OLLAMA_HOST'] || 'http://localhost:11434') + '/api/embeddings';
const OLLAMA_EMBED_MODEL = 'nomic-embed-text';

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
  // Try to create the collection (idempotent)
  await fetch(`${CHROMA_URL}/api/v1/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: collectionName }),
  });
}

export async function storeChatMessage(userId: string, repoId: string, message: string, response: string, action?: string) {
  const payload = {
    userId,
    repoId,
    message,
    response,
    action,
    timestamp: new Date().toISOString(),
  };
  await fetch(`${CHROMA_URL}/api/v1/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(userId: string, repoId: string, limit: number = 10) {
  const res = await fetch(`${CHROMA_URL}/api/v1/chats?userId=${encodeURIComponent(userId)}&repoId=${encodeURIComponent(repoId)}&limit=${limit}`);
  if (!res.ok) return [];
  return await res.json();
}

export async function upsertEmbeddings({ userId, repoId, chunks }: { userId: string; repoId: string; chunks: EmbeddingChunk[] }) {
  const collectionName = `repo-${repoId}`;
  await ensureCollection(collectionName);
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
    await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: batchIds,
        embeddings: batchEmbeds,
        documents: batchDocs,
        metadatas: batchMetas,
      }),
    });
  }
}

export async function queryEmbeddings({ repoId, query, topK = 5 }: { repoId: string; query: string; topK?: number }) {
  const collectionName = `repo-${repoId}`;
  const queryEmbedding = (await getEmbeddings([query]))[0] || [];
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    throw new Error('Failed to generate embedding for query');
  }
  const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query_embeddings: [queryEmbedding],
      n_results: topK,
    }),
  });
  if (!response.ok) throw new Error('ChromaDB query failed');
  return await response.json();
}

export async function deleteEmbeddingsForRepo(repoId: string) {
  const collectionName = `repo-${repoId}`;
  await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}`, {
    method: 'DELETE',
  });
} 
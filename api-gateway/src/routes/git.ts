import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { linkRepo, unlinkRepo, getLinkedRepo, getLinkedRepoPathForUser, updateRepoIndexStatus, DEFAULT_ALLOWED_EXTENSIONS } from '../utils/repoUtils';
import { getRepoChunksForEmbedding } from '../utils/repoUtils';
import { upsertEmbeddings, deleteEmbeddingsForRepo, storeChatMessage, getChatHistory, queryEmbeddings } from '../utils/chromadb';
import { Prisma } from '@prisma/client';
const os = require('os');
const fetch = require('node-fetch');

type LinkedRepoWithIndexStatus = {
  id: number;
  userId: string;
  repoType: string;
  localPath: string | null;
  remoteUrl: string | null;
  playwrightRoot: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastIndexStatus?: string | null;
  lastIndexError?: string | null;
  lastIndexTime?: Date | null;
};

const router = express.Router();

// Helper to get userId from request, fallback to a default for dev
function getUserId(req: any): string {
  // In production, req.user should be set by authentication middleware
  return req.user?.id || 'default-user';
}

// Helper function to validate Playwright repo
function validatePlaywrightRepo(repoPath: string): boolean {
  try {
    const playwrightConfig = path.join(repoPath, 'playwright.config.ts');
    const playwrightConfigJs = path.join(repoPath, 'playwright.config.js');
    return fs.existsSync(playwrightConfig) || fs.existsSync(playwrightConfigJs);
  } catch {
    return false;
  }
}

// Add the collection naming function at the top
// Create a deterministic collection name based on userId (same as in chromadb.ts)
function getCollectionName(userId: string): string {
  // Create a deterministic UUID based on userId
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  // Format as a proper UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

// Add this helper at the top, matching chromadb.ts
const CHROMA_URL = process.env['CHROMA_URL'] || 'http://localhost:8000';
async function getCollectionIdByName(collectionName: string): Promise<string | null> {
  const response = await fetch(`${CHROMA_URL}/api/v1/collections`);
  if (!response.ok) return null;
  const collections = await response.json();
  const found = collections.find((col: any) => col.name === collectionName);
  return found ? found.id : null;
}

// Get repository info
router.get('/info', async (req, res) => {
  const userId = getUserId(req);
  const repo = await getLinkedRepo(userId);
  if (!repo) {
    return res.json({ repo: null });
  }
  let status: 'connected' | 'disconnected' = 'disconnected';
  let errorDetail = '';
  try {
    if (repo.repoType === 'local' && repo.localPath) {
      if (fs.existsSync(repo.localPath)) {
        if (validatePlaywrightRepo(repo.localPath)) {
          status = 'connected';
        } else {
          errorDetail = 'Directory does not contain a valid Playwright configuration.';
        }
      } else {
        errorDetail = 'Directory not found.';
      }
    } else if (repo.repoType === 'remote' && (repo.playwrightRoot || repo.localPath)) {
      const remotePath = repo.playwrightRoot || repo.localPath;
      if (remotePath && fs.existsSync(remotePath)) {
        if (validatePlaywrightRepo(remotePath)) {
          status = 'connected';
        } else {
          errorDetail = 'Cloned directory does not contain a valid Playwright configuration.';
        }
      } else {
        errorDetail = 'Cloned directory not found.';
      }
    }
  } catch (err) {
    status = 'disconnected';
    errorDetail = err instanceof Error ? err.message : 'Unknown error';
  }
  return res.json({
    repo: {
      path: repo.repoType === 'local' ? repo.localPath : repo.remoteUrl,
      type: repo.repoType,
      status,
      lastSync: repo.updatedAt || repo.createdAt,
      errorDetail: status === 'disconnected' ? errorDetail : undefined,
      lastIndexStatus: repo.lastIndexStatus,
      lastIndexError: repo.lastIndexError,
      lastIndexTime: repo.lastIndexTime,
    }
  });
});

// Link repository
router.post('/link', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { path: repoPath, type, accessToken, playwrightRoot, extensions } = req.body;
    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }
    let localPath = repoPath;
    if (type === 'local') {
      if (!fs.existsSync(repoPath)) {
        return res.status(400).json({ error: 'Local path does not exist' });
      }
      if (!validatePlaywrightRepo(repoPath)) {
        return res.status(400).json({ error: 'Directory does not contain a valid Playwright configuration' });
      }
    } else if (type === 'remote') {
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required for remote repositories' });
      }
      // Clone remote repository to a user-specific directory
      const reposDir = path.join(os.tmpdir(), 'linked-repos', userId);
      if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, { recursive: true });
      }
      const repoName = path.basename(repoPath, '.git');
      const clonedPath = path.join(reposDir, repoName);
      if (fs.existsSync(clonedPath)) {
        // Clean up old clone
        fs.rmSync(clonedPath, { recursive: true, force: true });
      }
      // Build git URL with token (never expose token in response)
      const gitUrl = repoPath.startsWith('https://')
        ? `https://${accessToken}@${repoPath.replace('https://', '')}`
        : repoPath;
      try {
        execSync(`git clone ${gitUrl} ${clonedPath}`, { stdio: 'pipe' });
      } catch (err) {
        return res.status(400).json({ error: 'Failed to clone remote repository. Check URL and access token.' });
      }
      if (!validatePlaywrightRepo(clonedPath)) {
        // Clean up if not a valid Playwright repo
        fs.rmSync(clonedPath, { recursive: true, force: true });
        return res.status(400).json({ error: 'Cloned directory does not contain a valid Playwright configuration' });
      }
      localPath = clonedPath;
    }
    // Store repo info in DB (never expose accessToken in response)
    await linkRepo(userId, {
      repoType: type,
      localPath: type === 'local' ? repoPath : localPath,
      remoteUrl: type === 'remote' ? repoPath : undefined,
      accessToken: accessToken ? Buffer.from(accessToken).toString('base64') : undefined,
      playwrightRoot,
      lastIndexStatus: 'pending',
      lastIndexError: null,
      lastIndexTime: new Date(),
    });
    // Fetch the updated repo to get updatedAt/createdAt
    let repoResult = await getLinkedRepo(userId);
    if (!repoResult) {
      return res.status(500).json({ error: 'Failed to fetch linked repo after linking.' });
    }
    let repo: LinkedRepoWithIndexStatus = repoResult;
    // RAG: Index repo for semantic search
    try {
      const chunks = await getRepoChunksForEmbedding(localPath, extensions || DEFAULT_ALLOWED_EXTENSIONS);
      await upsertEmbeddings({ userId, repoId: userId, chunks });
      // Update status to success
      await updateRepoIndexStatus(userId, 'success', null);
      const repoSuccess = await getLinkedRepo(userId);
      if (repoSuccess) repo = repoSuccess;
    } catch (err) {
      console.error('RAG indexing failed:', err);
      await updateRepoIndexStatus(userId, 'error', err instanceof Error ? err.message : String(err));
      const repoError = await getLinkedRepo(userId);
      if (repoError) repo = repoError;
    }
    return res.json({
      success: repo?.lastIndexStatus === 'success',
      message: repo?.lastIndexStatus === 'success' ? 'Repository linked and indexed successfully' : 'Repository linked, but indexing failed',
      repo: {
        path: repoPath,
        type,
        status: 'connected',
        lastSync: repo?.updatedAt || repo?.createdAt,
        lastIndexStatus: repo?.lastIndexStatus,
        lastIndexError: repo?.lastIndexError,
        lastIndexTime: repo?.lastIndexTime,
      }
    });
  } catch (error: any) {
    console.error('Error linking repository:', error);
    return res.status(500).json({ error: error.message || 'Failed to link repository' });
  }
});

// Unlink repository
router.post('/unlink', async (req, res) => {
  try {
    const userId = getUserId(req);
    const repo = await getLinkedRepo(userId);
    if (repo && repo.repoType === 'remote' && repo.localPath) {
      // Clean up cloned remote repo
      try {
        fs.rmSync(repo.localPath, { recursive: true, force: true });
      } catch (err) {
        console.warn('Failed to clean up remote repo clone:', err);
      }
    }
    await unlinkRepo(userId);
    // RAG: Remove embeddings for this repo
    try {
      await deleteEmbeddingsForRepo(userId);
    } catch (err) {
      console.error('RAG cleanup failed:', err);
    }
    return res.json({ success: true, message: 'Repository unlinked successfully' });
  } catch (error: any) {
    console.error('Error unlinking repository:', error);
    return res.status(500).json({ error: error.message || 'Failed to unlink repository' });
  }
});

// Get working directory for AI/CLI operations
router.get('/working-directory', async (req, res) => {
  const userId = getUserId(req);
  const repoPath = await getLinkedRepoPathForUser(userId);
  if (!repoPath) {
    return res.status(404).json({ error: 'No repository linked' });
  }
  return res.json({
    workingDirectory: repoPath,
    type: 'local' // Assuming working directory is always local for now
  });
});

// RAG status endpoint
router.get('/rag-status', async (req, res) => {
  try {
    const userId = getUserId(req);
    const repo = await getLinkedRepo(userId);
    if (!repo || !repo.localPath) {
      return res.status(404).json({ indexed: false, message: 'No repo linked' });
    }
    
    const collectionName = getCollectionName(userId);
    const collectionId = await getCollectionIdByName(collectionName);
    if (!collectionId) {
      return res.json({ indexed: false, message: 'No RAG index found' });
    }
    console.log(`[RAG-STATUS] userId: ${userId}, collectionName: ${collectionName}, collectionId: ${collectionId}`);
    // Check if collection exists using v1 API
    try {
      // Get collection count using v1 API and collectionId
      const countResponse = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionId}/count`);
      const countText = await countResponse.text();
      console.log(`[RAG-STATUS] count response: ${countText}`);
      if (!countResponse.ok) {
        return res.json({ indexed: true, chunkCount: 'unknown' });
      }
      const count = Number(countText);
      return res.json({ indexed: true, chunkCount: count });
    } catch (error) {
      return res.json({ indexed: false, message: 'Error checking RAG status' });
    }
  } catch (err) {
    return res.status(500).json({ indexed: false, message: 'Error checking RAG status', error: err instanceof Error ? err.message : err });
  }
});

// Force RAG re-index for the current user's linked repo
router.post('/rag-reindex', async (req, res) => {
  try {
    const userId = getUserId(req);
    const repo = await getLinkedRepo(userId);
    if (!repo || !repo.localPath) {
      return res.status(404).json({ success: false, message: 'No repo linked' });
    }
    const { extensions } = req.body || {};
    // Remove old index
    try { await deleteEmbeddingsForRepo(userId); } catch {}
    // Set status to pending
    await updateRepoIndexStatus(userId, 'pending', null);
    let updatedRepoResult = await getLinkedRepo(userId);
    if (!updatedRepoResult) {
      return res.status(500).json({ success: false, message: 'Failed to fetch linked repo after setting pending status.' });
    }
    let updatedRepo: LinkedRepoWithIndexStatus = updatedRepoResult;
    // Re-index
    try {
      const chunks = await getRepoChunksForEmbedding(repo.localPath, extensions || DEFAULT_ALLOWED_EXTENSIONS);
      await upsertEmbeddings({ userId, repoId: userId, chunks });
      await updateRepoIndexStatus(userId, 'success', null);
      const repoSuccess = await getLinkedRepo(userId);
      if (repoSuccess) updatedRepo = repoSuccess;
      return res.json({
        success: true,
        message: 'Re-indexed successfully',
        chunkCount: chunks.length,
        lastIndexStatus: updatedRepo?.lastIndexStatus,
        lastIndexError: updatedRepo?.lastIndexError,
        lastIndexTime: updatedRepo?.lastIndexTime,
      });
    } catch (err) {
      await updateRepoIndexStatus(userId, 'error', err instanceof Error ? err.message : String(err));
      const repoError = await getLinkedRepo(userId);
      if (repoError) updatedRepo = repoError;
      return res.status(500).json({
        success: false,
        message: 'Error during re-index',
        error: err instanceof Error ? err.message : err,
        lastIndexStatus: updatedRepo?.lastIndexStatus,
        lastIndexError: updatedRepo?.lastIndexError,
        lastIndexTime: updatedRepo?.lastIndexTime,
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error during re-index', error: err instanceof Error ? err.message : err });
  }
});

// Admin: List all indexed repos and their chunk counts
router.get('/rag-admin-list', async (req, res) => {
  try {
    const CHROMA_URL = process.env['CHROMA_URL'] || 'http://localhost:8000';
    
    // Get all collections using v1 API
    const listResponse = await fetch(`${CHROMA_URL}/api/v1/collections`);
    if (!listResponse.ok) {
      return res.status(500).json({ message: 'Failed to list collections', error: 'ChromaDB not accessible' });
    }
    
    const collections = await listResponse.json() as any[];
    const results = [];
    
    for (const col of collections) {
      let count = 0;
      try {
        // Get count for each collection
        const countResponse = await fetch(`${CHROMA_URL}/api/v1/collections/${col.name}/count`);
        if (countResponse.ok) {
          const countData = await countResponse.json() as { count: number };
          count = countData.count || 0;
        }
      } catch (error) {
        console.error(`Failed to get count for collection ${col.name}:`, error);
      }
      results.push({ name: col.name, chunkCount: count });
    }
    
    return res.json({ repos: results });
  } catch (err) {
    return res.status(500).json({ message: 'Error listing indexed repos', error: err instanceof Error ? err.message : err });
  }
});

// Admin: Force cleanup for a given userId (repoId)
router.post('/rag-admin-cleanup', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    await deleteEmbeddingsForRepo(userId);
    return res.json({ success: true, message: `Cleaned up RAG index for userId ${userId}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error during cleanup', error: err instanceof Error ? err.message : err });
  }
});

// RAG Query endpoint
router.post('/rag-query', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { query, topK } = req.body || {};
    if (!query) return res.status(400).json({ error: 'Missing query' });
    // Use the same logic as upsert/query: userId is the collection key
    const results = await queryEmbeddings({ repoId: userId, query, topK: topK || 5 });
    // Format results for easier consumption
    const formatted = [];
    const anyResults = results as any;
    const ids = anyResults.ids?.[0] || [];
    const scores = anyResults.distances?.[0] || [];
    const metadatas = anyResults.metadatas?.[0] || [];
    const docs = anyResults.documents?.[0] || [];
    for (let i = 0; i < ids.length; i++) {
      formatted.push({
        id: ids[i],
        score: scores[i],
        filePath: metadatas[i]?.filePath,
        startLine: metadatas[i]?.startLine,
        endLine: metadatas[i]?.endLine,
        text: docs[i],
        metadata: metadatas[i],
      });
    }
    return res.json({ results: formatted });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

// --- File Content Retrieval ---
router.get('/file', async (req, res) => {
  const userId = getUserId(req);
  const repoRoot = await getLinkedRepoPathForUser(userId);
  if (!repoRoot) return res.status(404).json({ error: 'No linked repo' });
  const relPath = req.query['path'] as string;
  if (!relPath) return res.status(400).json({ error: 'Missing path' });
  const absPath = path.resolve(repoRoot, relPath);
  if (!absPath.startsWith(repoRoot)) return res.status(403).json({ error: 'Path outside repo' });
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return res.status(404).json({ error: 'File not found' });
  const content = fs.readFileSync(absPath, 'utf8');
  return res.json({ path: relPath, content });
});

// --- Directory Listing ---
router.get('/dir', async (req, res) => {
  const userId = getUserId(req);
  const repoRoot = await getLinkedRepoPathForUser(userId);
  if (!repoRoot) return res.status(404).json({ error: 'No linked repo' });
  const relPath = req.query['path'] as string || '.';
  const absPath = path.resolve(repoRoot, relPath);
  if (!absPath.startsWith(repoRoot)) return res.status(403).json({ error: 'Path outside repo' });
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isDirectory()) return res.status(404).json({ error: 'Directory not found' });
  const files = fs.readdirSync(absPath).map(f => {
    const stat = fs.statSync(path.join(absPath, f));
    return { name: f, isDir: stat.isDirectory(), size: stat.size };
  });
  return res.json({ path: relPath, files });
});

// --- Full Codebase Review ---
router.post('/codebase-review', async (req, res) => {
  const userId = getUserId(req);
  const repoRoot = await getLinkedRepoPathForUser(userId);
  if (!repoRoot) return res.status(404).json({ error: 'No linked repo' });
  try {
    // Call service to traverse repo, batch files, and get LLM review (to be implemented)
    const { review, errors } = await req.app.get('services').ai.codebaseReview(repoRoot, req.body || {});
    return res.json({ success: true, review, errors });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router; 
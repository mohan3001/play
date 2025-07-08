import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EmbeddingChunk } from './chromadb';

export async function linkRepo(userId: string, repoData: any) {
  return prisma.linkedRepo.upsert({
    where: { userId },
    update: repoData,
    create: { userId, ...repoData },
  });
}

export async function getLinkedRepo(userId: string) {
  return prisma.linkedRepo.findFirst({
    where: { userId },
    select: {
      id: true,
      userId: true,
      repoType: true,
      localPath: true,
      remoteUrl: true,
      playwrightRoot: true,
      createdAt: true,
      updatedAt: true,
      lastIndexStatus: true,
      lastIndexError: true,
      lastIndexTime: true,
    },
  });
}

export async function unlinkRepo(userId: string) {
  return prisma.linkedRepo.delete({ where: { userId } });
}

export async function getLinkedRepoPathForUser(userId: string): Promise<string | null> {
  const repo = await getLinkedRepo(userId);
  if (!repo) return null;
  if (repo.repoType === 'local') return repo.localPath || null;
  if (repo.repoType === 'remote') return repo.playwrightRoot || repo.localPath || null;
  return null;
}

export async function updateRepoIndexStatus(userId: string, status: string, error: string | null) {
  return prisma.linkedRepo.update({
    where: { userId },
    data: {
      lastIndexStatus: status,
      lastIndexError: error,
      lastIndexTime: new Date(),
    },
  });
}

// RAG: Recursively read and chunk files for embedding
const DEFAULT_ALLOWED_EXTENSIONS = ['.js', '.ts', '.md', '.json', '.feature', '.test', '.spec', '.txt'];
const CHUNK_SIZE = 20; // lines per chunk

export { DEFAULT_ALLOWED_EXTENSIONS };
export async function getRepoChunksForEmbedding(repoPath: string, allowedExtensions: string[] = DEFAULT_ALLOWED_EXTENSIONS): Promise<EmbeddingChunk[]> {
  const chunks: EmbeddingChunk[] = [];
  function walk(dir: string) {
    // Skip node_modules and other common build/output folders
    if (dir.includes('node_modules')) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      // Skip any file or directory inside node_modules
      if (fullPath.includes('node_modules')) continue;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && allowedExtensions.includes(path.extname(file))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
          const chunkLines = lines.slice(i, i + CHUNK_SIZE);
          const chunkText = chunkLines.join('\n');
          chunks.push({
            id: uuidv4(),
            text: chunkText,
            metadata: {
              filePath: path.relative(repoPath, fullPath),
              startLine: i + 1,
              endLine: Math.min(i + CHUNK_SIZE, lines.length),
            },
          });
        }
      }
    }
  }
  walk(repoPath);
  return chunks;
}
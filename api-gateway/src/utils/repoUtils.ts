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
  return prisma.linkedRepo.findFirst({ where: { userId } });
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

// RAG: Recursively read and chunk files for embedding
const ALLOWED_EXTENSIONS = ['.js', '.ts', '.md', '.json', '.feature', '.test', '.spec', '.txt'];
const CHUNK_SIZE = 20; // lines per chunk

export async function getRepoChunksForEmbedding(repoPath: string): Promise<EmbeddingChunk[]> {
  const chunks: EmbeddingChunk[] = [];
  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && ALLOWED_EXTENSIONS.includes(path.extname(file))) {
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
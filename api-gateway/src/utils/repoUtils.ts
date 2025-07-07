import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function linkRepo(userId: string, repoData: any) {
  return prisma.linkedRepo.upsert({
    where: { userId },
    update: repoData,
    create: { userId, ...repoData },
  });
}

export async function getLinkedRepo(userId: string) {
  return prisma.linkedRepo.findUnique({ where: { userId } });
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
import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { linkRepo, unlinkRepo, getLinkedRepo, getLinkedRepoPathForUser } from '../utils/repoUtils';
const os = require('os');

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
      errorDetail: status === 'disconnected' ? errorDetail : undefined
    }
  });
});

// Link repository
router.post('/link', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { path: repoPath, type, accessToken, playwrightRoot } = req.body;
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
      playwrightRoot
    });
    // Fetch the updated repo to get updatedAt/createdAt
    const repo = await getLinkedRepo(userId);
    return res.json({
      success: true,
      message: 'Repository linked successfully',
      repo: {
        path: repoPath,
        type,
        status: 'connected',
        lastSync: repo?.updatedAt || repo?.createdAt
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

export default router; 
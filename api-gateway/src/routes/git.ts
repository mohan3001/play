import express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const router = express.Router();

// Simple in-memory storage (in production, use a database)
let linkedRepo: {
  path: string;
  type: 'local' | 'remote';
  accessToken?: string;
  lastSync: string;
} | null = null;

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

// Simple token encoding (in production, use proper encryption)
function encodeToken(token: string): string {
  return Buffer.from(token).toString('base64');
}

function decodeToken(encodedToken: string): string {
  return Buffer.from(encodedToken, 'base64').toString('utf8');
}

// Get repository info
router.get('/info', (req, res) => {
  if (!linkedRepo) {
    return res.json({ repo: null });
  }

  // Check if repo is still accessible
  let status: 'connected' | 'disconnected' = 'disconnected';
  try {
    if (linkedRepo.type === 'local') {
      status = fs.existsSync(linkedRepo.path) && validatePlaywrightRepo(linkedRepo.path) ? 'connected' : 'disconnected';
    } else {
      // For remote repos, check if the cloned directory exists
      const clonedPath = path.join(process.cwd(), 'linked-repos', path.basename(linkedRepo.path, '.git'));
      status = fs.existsSync(clonedPath) && validatePlaywrightRepo(clonedPath) ? 'connected' : 'disconnected';
    }
  } catch {
    status = 'disconnected';
  }

  res.json({
    repo: {
      path: linkedRepo.path,
      type: linkedRepo.type,
      status,
      lastSync: linkedRepo.lastSync
    }
  });
});

// Link repository
router.post('/link', async (req, res) => {
  try {
    const { path: repoPath, type, accessToken } = req.body;

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path is required' });
    }

    let validatedPath = repoPath;

    if (type === 'local') {
      // Validate local path
      if (!fs.existsSync(repoPath)) {
        return res.status(400).json({ error: 'Local path does not exist' });
      }
      
      if (!validatePlaywrightRepo(repoPath)) {
        return res.status(400).json({ error: 'Directory does not contain a valid Playwright configuration' });
      }
    } else if (type === 'remote') {
      // Clone remote repository
      if (!accessToken) {
        return res.status(400).json({ error: 'Access token is required for remote repositories' });
      }

      const reposDir = path.join(process.cwd(), 'linked-repos');
      if (!fs.existsSync(reposDir)) {
        fs.mkdirSync(reposDir, { recursive: true });
      }

      const repoName = path.basename(repoPath, '.git');
      const clonedPath = path.join(reposDir, repoName);

      // Clone the repository
      const gitUrl = repoPath.startsWith('https://') 
        ? `https://${accessToken}@${repoPath.replace('https://', '')}`
        : repoPath;

      execSync(`git clone ${gitUrl} ${clonedPath}`, { stdio: 'pipe' });
      
      if (!validatePlaywrightRepo(clonedPath)) {
        // Clean up if not a valid Playwright repo
        fs.rmSync(clonedPath, { recursive: true, force: true });
        return res.status(400).json({ error: 'Repository does not contain a valid Playwright configuration' });
      }

      validatedPath = clonedPath;
    }

    // Store repo info
    linkedRepo = {
      path: validatedPath,
      type,
      ...(accessToken && { accessToken: encodeToken(accessToken) }),
      lastSync: new Date().toISOString()
    };

    const repoInfo = linkedRepo;
    res.json({ 
      success: true, 
      message: 'Repository linked successfully',
      repo: {
        path: repoPath,
        type,
        status: 'connected',
        lastSync: repoInfo.lastSync
      }
    });

  } catch (error: any) {
    console.error('Error linking repository:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to link repository' 
    });
  }
});

// Unlink repository
router.post('/unlink', (req, res) => {
  try {
    const currentRepo = linkedRepo;
    if (currentRepo && currentRepo.type === 'remote') {
      // Clean up cloned repository
      const clonedPath = path.join(process.cwd(), 'linked-repos', path.basename(currentRepo.path, '.git'));
      if (fs.existsSync(clonedPath)) {
        fs.rmSync(clonedPath, { recursive: true, force: true });
      }
    }

    linkedRepo = null;
    res.json({ success: true, message: 'Repository unlinked successfully' });

  } catch (error: any) {
    console.error('Error unlinking repository:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to unlink repository' 
    });
  }
});

// Get working directory for AI/CLI operations
router.get('/working-directory', (req, res) => {
  if (!linkedRepo) {
    return res.status(404).json({ error: 'No repository linked' });
  }

  res.json({ 
    workingDirectory: linkedRepo.path,
    type: linkedRepo.type
  });
});

export default router; 
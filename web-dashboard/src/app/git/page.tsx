'use client';

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

interface RepoInfo {
  path: string;
  type: 'local' | 'remote';
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

export default function GitIntegrationPage() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [repoPath, setRepoPath] = useState('');
  const [repoType, setRepoType] = useState<'local' | 'remote'>('local');
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current repo info
    fetchRepoInfo();
  }, []);

  const fetchRepoInfo = async () => {
    try {
      const response = await fetch('/api/git/info');
      if (response.ok) {
        const data = await response.json();
        setRepoInfo(data.repo);
      }
    } catch (error) {
      console.error('Failed to fetch repo info:', error);
    }
  };

  const handleLinkRepo = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/git/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: repoPath,
          type: repoType,
          accessToken: repoType === 'remote' ? accessToken : undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('✅ Repository linked successfully!');
        setRepoPath('');
        setAccessToken('');
        fetchRepoInfo();
      } else {
        setMessage(`❌ ${data.error || 'Failed to link repository'}`);
      }
    } catch (error) {
      setMessage('❌ Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkRepo = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/git/unlink', { method: 'POST' });
      
      if (response.ok) {
        setMessage('✅ Repository unlinked successfully!');
        setRepoInfo(null);
      } else {
        setMessage('❌ Failed to unlink repository');
      }
    } catch (error) {
      setMessage('❌ Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Git Integration</h1>
        <p className="text-gray-600">Link your Playwright automation repository to enable AI-powered test management and execution.</p>
      </div>

      {/* Current Repository Status */}
      {repoInfo && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Connected Repository</span>
              <Badge variant={repoInfo.status === 'connected' ? 'default' : 'secondary'}>
                {repoInfo.status === 'connected' ? 'Active' : 'Disconnected'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Path:</strong> {repoInfo.path}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Type:</strong> {repoInfo.type === 'local' ? 'Local Directory' : 'Remote Repository'}
              </p>
              {repoInfo.lastSync && (
                <p className="text-sm text-gray-600">
                  <strong>Last Sync:</strong> {new Date(repoInfo.lastSync).toLocaleString()}
                </p>
              )}
              <Button 
                onClick={handleUnlinkRepo} 
                variant="outline" 
                disabled={isLoading}
                className="mt-4"
              >
                {isLoading ? 'Unlinking...' : 'Unlink Repository'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Link New Repository */}
      {!repoInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Link Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="local"
                    checked={repoType === 'local'}
                    onChange={(e) => setRepoType(e.target.value as 'local' | 'remote')}
                    className="mr-2"
                  />
                  Local Directory
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="remote"
                    checked={repoType === 'remote'}
                    onChange={(e) => setRepoType(e.target.value as 'local' | 'remote')}
                    className="mr-2"
                  />
                  Remote Repository
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {repoType === 'local' ? 'Local Path' : 'Repository URL'}
              </label>
              <input
                type="text"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder={repoType === 'local' ? '/path/to/playwright/repo' : 'https://github.com/user/repo.git'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {repoType === 'remote' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your GitHub/GitLab access token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for private repositories. Your token is stored securely.
                </p>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            <Button 
              onClick={handleLinkRepo} 
              disabled={!repoPath || isLoading}
              className="w-full"
            >
              {isLoading ? 'Linking...' : 'Link Repository'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p><strong>Local Directory:</strong> Provide the full path to your Playwright automation project on your local machine.</p>
            <p><strong>Remote Repository:</strong> Provide the Git URL (HTTPS or SSH) and a Personal Access Token for authentication.</p>
            <p><strong>Requirements:</strong> The repository must contain a valid Playwright configuration file (playwright.config.ts).</p>
            <p><strong>Security:</strong> Access tokens are encrypted and stored securely. You can unlink the repository at any time.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
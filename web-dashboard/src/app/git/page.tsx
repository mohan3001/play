"use client";

import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import NoRepoLinked from '@/components/layout/NoRepoLinked';
import { useRouter } from 'next/navigation';

interface RepoInfo {
  path: string;
  type: 'local' | 'remote';
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

export default function GitIntegrationPage() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [repoType, setRepoType] = useState<'local' | 'remote'>('local');
  const [localPath, setLocalPath] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [playwrightRoot, setPlaywrightRoot] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [repoLinked, setRepoLinked] = useState(false); // TODO: Replace with real logic
  const [ragStatus, setRagStatus] = useState<{ indexed: boolean; chunkCount?: number; message?: string } | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load current repo info
    fetchRepoInfo();
  }, []);

  useEffect(() => {
    if (repoInfo) {
      fetchRagStatus();
    } else {
      setRagStatus(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoInfo]);

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

  const fetchRagStatus = async () => {
    try {
      const response = await fetch('/api/git/rag-status');
      const data = await response.json();
      setRagStatus(data);
    } catch (err) {
      setRagStatus({ indexed: false, message: 'Error fetching RAG status' });
    }
  };

  const handleLink = async () => {
    setMessage('Linking...');
    setIsLoading(true);
    const body = repoType === 'local'
      ? { path: localPath, type: 'local', playwrightRoot }
      : { path: remoteUrl, type: 'remote', accessToken, playwrightRoot };
    try {
      const res = await fetch('/api/git/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setMessage(data.success ? 'Repository linked!' : data.error || 'Failed to link repo');
      if (data.success) {
        setRepoLinked(true);
        fetchRepoInfo();
        setLocalPath('');
        setRemoteUrl('');
        setAccessToken('');
        setPlaywrightRoot('');
        setTimeout(() => {
          router.push('/chat?repoLinked=1');
        }, 1000);
      }
    } catch (err) {
      setMessage('Failed to link repo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async () => {
    setMessage('Unlinking...');
    setIsLoading(true);
    try {
      const res = await fetch('/api/git/unlink', { method: 'POST' });
      const data = await res.json();
      setMessage(data.success ? 'Repository unlinked!' : data.error || 'Failed to unlink repo');
      if (data.success) {
        setRepoInfo(null);
      }
    } catch (err) {
      setMessage('Failed to unlink repo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setMessage('Re-indexing...');
    try {
      const response = await fetch('/api/git/rag-reindex', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setMessage('Re-indexed successfully!');
        fetchRagStatus();
      } else {
        setMessage(data.message || 'Re-index failed');
      }
    } catch (err) {
      setMessage('Re-index failed');
    } finally {
      setReindexing(false);
    }
  };

  if (repoLinked) {
    return <NoRepoLinked cta={false} />;
  }

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
              {/* RAG Status UI */}
              <div className="mt-2">
                <span className="text-sm font-medium">RAG Index Status: </span>
                {ragStatus === null ? (
                  <span className="text-gray-500">Loading...</span>
                ) : ragStatus.indexed ? (
                  <span className="text-green-700">Indexed ({ragStatus.chunkCount} chunks)</span>
                ) : (
                  <span className="text-red-700">Not Indexed{ragStatus.message ? ` (${ragStatus.message})` : ''}</span>
                )}
                <Button size="sm" variant="outline" className="ml-2" onClick={fetchRagStatus} disabled={reindexing}>
                  Refresh
                </Button>
                <Button size="sm" variant="outline" className="ml-2" onClick={handleReindex} disabled={reindexing}>
                  {reindexing ? 'Re-indexing...' : 'Re-index'}
                </Button>
              </div>
              <Button 
                onClick={handleUnlink} 
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
            <div className="mb-4">
              <label className="mr-4">
                <input type="radio" checked={repoType === 'local'} onChange={() => setRepoType('local')} />
                <span className="ml-2">Local Directory</span>
              </label>
              <label>
                <input type="radio" checked={repoType === 'remote'} onChange={() => setRepoType('remote')} />
                <span className="ml-2">Remote Repository</span>
              </label>
            </div>

            {repoType === 'local' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local Path
                </label>
                <input
                  type="text"
                  value={localPath}
                  onChange={(e) => setLocalPath(e.target.value)}
                  placeholder="Path to Playwright project root"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repository URL
                  </label>
                  <input
                    type="text"
                    value={remoteUrl}
                    onChange={(e) => setRemoteUrl(e.target.value)}
                    placeholder="Repository URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Playwright Project Root Path (optional)
              </label>
              <input
                type="text"
                value={playwrightRoot}
                onChange={(e) => setPlaywrightRoot(e.target.value)}
                placeholder="Path to Playwright project root"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-md ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message}
              </div>
            )}

            <Button 
              onClick={handleLink} 
              disabled={!localPath && !remoteUrl || isLoading}
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
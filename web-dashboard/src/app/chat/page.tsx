"use client";
import { useEffect, useState } from "react";
import NoRepoLinked from "@/components/layout/NoRepoLinked";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Badge } from "@/components/ui/badge";

export default function ChatPage() {
  // TODO: Replace 'any' with a proper RepoInfo type for type safety
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ragStatus, setRagStatus] = useState<{ indexed: boolean; chunkCount?: number; message?: string } | null>(null);

  useEffect(() => {
    fetch("/api/git/info")
      .then(res => res.json())
      .then(data => {
        setRepoInfo(data.repo);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (repoInfo && repoInfo.status === "connected") {
      fetch("/api/git/rag-status")
        .then(res => res.json())
        .then(data => setRagStatus(data));
    } else {
      setRagStatus(null);
    }
  }, [repoInfo]);

  if (loading) return <div>Loading...</div>;

  // If no repo or not connected, show NoRepoLinked
  if (!repoInfo || repoInfo.status !== "connected") {
    // Remove 'error' prop if NoRepoLinked does not support it
    return <NoRepoLinked cta={true} />;
  }

  // If repo is connected, show chat and repo summary
  return (
    <div>
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <strong>Repository linked:</strong> {repoInfo.path} ({repoInfo.type})<br />
        <strong>Status:</strong> {repoInfo.status}<br />
        <strong>Last Sync:</strong> {repoInfo.lastSync && new Date(repoInfo.lastSync).toLocaleString()}<br />
        {/* RAG Index Info */}
        {ragStatus === null ? (
          <span className="text-gray-500">Checking RAG index...</span>
        ) : ragStatus.indexed ? (
          <Badge variant="default" className="ml-2">Semantic Search Enabled ({ragStatus.chunkCount} chunks indexed)</Badge>
        ) : (
          <span className="text-red-700 ml-2">Semantic Search Not Available{ragStatus.message ? ` (${ragStatus.message})` : ''}</span>
        )}
      </div>
      <ChatInterface />
    </div>
  );
} 
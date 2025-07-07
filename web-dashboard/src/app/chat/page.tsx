"use client";
import { useEffect, useState } from "react";
import NoRepoLinked from "@/components/layout/NoRepoLinked";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatPage() {
  // TODO: Replace 'any' with a proper RepoInfo type for type safety
  const [repoInfo, setRepoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/git/info")
      .then(res => res.json())
      .then(data => {
        setRepoInfo(data.repo);
        setLoading(false);
      });
  }, []);

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
        <strong>Last Sync:</strong> {repoInfo.lastSync && new Date(repoInfo.lastSync).toLocaleString()}
      </div>
      <ChatInterface />
    </div>
  );
} 
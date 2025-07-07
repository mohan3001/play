const CHROMA_URL = process.env['CHROMA_URL'] || 'http://localhost:8000';

export async function storeChatMessage(userId: string, repoId: string, message: string, response: string, action?: string) {
  const payload = {
    userId,
    repoId,
    message,
    response,
    action,
    timestamp: new Date().toISOString(),
  };
  await fetch(`${CHROMA_URL}/api/v1/chats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(userId: string, repoId: string, limit: number = 10) {
  const res = await fetch(`${CHROMA_URL}/api/v1/chats?userId=${encodeURIComponent(userId)}&repoId=${encodeURIComponent(repoId)}&limit=${limit}`);
  if (!res.ok) return [];
  return await res.json();
} 
"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Sparkles, FileText, Play, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, AIResponse } from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Copy } from "lucide-react"

// Update Message['type'] to match backend response types
interface Message {
  id: string
  type: 'user' | 'ai' | 'action' | 'error' | 'text' | 'command'
  content: string
  timestamp: Date
  isLoading?: boolean
  ragUsed?: boolean // Added for RAG context indicator
}

interface ChatInterfaceProps {
  className?: string
  onActionResult?: (result: Message) => void
  onError?: (err: string) => void
}

export function ChatInterface({ className, onActionResult, onError }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant for Playwright automation. I can help you with:\n\n• Generating test code\n• Analyzing your framework\n• Running tests\n• Git operations\n• Creating AI workflows\n\nWhat would you like to do today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsLoading(true)

    try {
      const sessionId = 'web-dashboard-session'
      const response = await apiClient.sendChatMessage(currentInput, sessionId)
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        // Map backend types to 'ai' for display
        type: response.type === 'text' || response.type === 'command' ? 'ai' : response.type,
        content: response.message,
        timestamp: new Date(),
        ragUsed: response.ragUsed
      } as Message;
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: errorMsg,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorResponse])
      if (onError) onError(errorMsg);
    }
    setIsLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      handleSendMessage();
      setInputValue('');
    }
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Assistant
          </CardTitle>
          <Badge variant="success">Online</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'ai' && (
                <div className="flex items-start gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xl whitespace-pre-line">
                    {/* RAG badge if used */}
                    {message.ragUsed && (
                      <Badge variant="info" className="mb-2">Semantic Search Used</Badge>
                    )}
                    {message.content}
                  </div>
                </div>
              )}
              {message.type === 'error' && (
                <div className="flex items-start gap-2">
                  <Loader2 className="h-5 w-5 text-red-600 animate-spin" />
                  <div className="bg-red-50 border-l-4 border-red-400 rounded-lg px-4 py-2 max-w-xl text-red-700">
                    {message.content}
                  </div>
                </div>
              )}
              {message.type === 'user' && (
                <div className="flex items-end gap-2">
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xl whitespace-pre-line">
                    {message.content}
                  </div>
                  <User className="h-5 w-5 text-blue-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="bg-blue-50 rounded-lg px-4 py-2 max-w-xl">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-4">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask me anything about your tests, framework, or test automation..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 
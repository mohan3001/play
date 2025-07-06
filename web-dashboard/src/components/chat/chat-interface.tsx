"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Sparkles, FileText, Play, GitBranch } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, AIResponse } from "@/lib/api"

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  isLoading?: boolean
  isSpecialCommand?: boolean
  commandType?: string
}

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className }: ChatInterfaceProps) {
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
      // Call real AI service
      const sessionId = 'web-dashboard-session'
      const response = await apiClient.sendChatMessage(currentInput, sessionId)
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: response.message,
        timestamp: new Date(),
        isSpecialCommand: isSpecialCommand(currentInput)
      }
      
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        isSpecialCommand: false
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const isSpecialCommand = (input: string): boolean => {
    const specialCommands = [
      'count tests', 'analyze framework', 'coverage', 'run login feature',
      'count feature files', 'ai workflow', 'git operations'
    ]
    return specialCommands.some(cmd => input.toLowerCase().includes(cmd))
  }



  const quickActions = [
    { icon: FileText, label: 'Count Tests', command: 'count tests' },
    { icon: Play, label: 'Run Login', command: 'run login feature' },
    { icon: Sparkles, label: 'AI Workflow', command: 'ai workflow' },
    { icon: GitBranch, label: 'Git Operations', command: 'git operations' }
  ]

  const handleQuickAction = (command: string) => {
    setInputValue(command)
  }

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
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-blue-600" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.type === 'user'
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                )}
              >
                {message.isSpecialCommand && (
                  <Badge variant="info" className="mb-2">
                    Special Command
                  </Badge>
                )}
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                <div className={cn(
                  "text-xs mt-2",
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                )}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.type === 'user' && (
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Actions */}
        <div className="border-t p-4">
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.command)}
                className="flex-shrink-0"
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
          
          {/* Input Area */}
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about your tests, framework, or automation..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
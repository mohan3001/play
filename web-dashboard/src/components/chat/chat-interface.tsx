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

// Smart suggestions based on context
const getSuggestions = (messages: Message[], isLoading: boolean) => {
  if (isLoading) return [];
  
  const lastMessage = messages[messages.length - 1];
  const recentCommands = messages.slice(-5).map(m => m.content.toLowerCase());
  
  // Default suggestions
  const defaultSuggestions = [
    'run all tests',
    'list all tests', 
    'count tests',
    'show last test run'
  ];
  
  // Context-based suggestions
  if (lastMessage?.content.toLowerCase().includes('test') || recentCommands.some(cmd => cmd.includes('test'))) {
    return [
      'run all tests',
      'show failed tests',
      'rerun last failed tests',
      'list feature files',
      'show test history'
    ];
  }
  
  if (lastMessage?.content.toLowerCase().includes('run') || recentCommands.some(cmd => cmd.includes('run'))) {
    return [
      'run tests tagged @smoke',
      'run checkout.spec.ts',
      'run feature file login.feature',
      'show last execution results'
    ];
  }
  
  if (lastMessage?.content.toLowerCase().includes('report') || recentCommands.some(cmd => cmd.includes('report'))) {
    return [
      'open cucumber report in browser',
      'open playwright report',
      'show last test run',
      'show failed tests'
    ];
  }
  
  if (lastMessage?.content.toLowerCase().includes('feature') || recentCommands.some(cmd => cmd.includes('feature'))) {
    return [
      'list feature files',
      'run feature file login.feature',
      'explain login feature file',
      'show feature file structure'
    ];
  }
  
  return defaultSuggestions;
};

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
  const suggestions = getSuggestions(messages, isLoading)

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      handleSendMessage();
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
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
        
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2">💡 Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                  className="text-xs h-8 px-3"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about your tests, framework, or test automation..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Send'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
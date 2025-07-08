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
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { duotoneSpace } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Update Message['type'] to match backend response types
interface Message {
  id: string
  type: 'user' | 'ai' | 'action' | 'error' | 'text' | 'command'
  content: string
  timestamp: Date
  isLoading?: boolean
  isSpecialCommand?: boolean
  commandType?: string
  actionResult?: string
  suggestions?: string[]
}

interface ChatInterfaceProps {
  className?: string
  onActionResult?: (result: Message) => void
  onError?: (err: string) => void
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
  const suggestions = getSuggestions(messages, isLoading)
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [pendingExplanation, setPendingExplanation] = useState<string | null>(null);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(null);

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
      let aiType: Message['type'] = 'ai';
      let actionResult = '';
      let suggestions: string[] = [];
      
      if (response.type && response.type.toLowerCase() === 'action') {
        aiType = 'action';
        actionResult = response.message;
        if (onActionResult) onActionResult({ ...userMessage, type: 'action', content: response.message, actionResult });
      } else if (response.type && response.type.toLowerCase() === 'error') {
        aiType = 'error';
        if (onError) onError(response.message);
      }
      
      // Extract suggestions from response
      if (response.suggestions && Array.isArray(response.suggestions)) {
        suggestions = response.suggestions;
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: aiType,
        content: response.message,
        timestamp: new Date(),
        isSpecialCommand: isSpecialCommand(currentInput),
        actionResult,
        suggestions
      }
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorMsg = 'Sorry, I encountered an error processing your request. Please try again.';
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: errorMsg,
        timestamp: new Date(),
        isSpecialCommand: false
      }
      setMessages(prev => [...prev, errorResponse])
      if (onError) onError(errorMsg);
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

  // Confirmation handler
  const handleApprove = async () => {
    if (pendingCommand) {
      setShowConfirm(false);
      setIsLoading(true);
      // Send approval to backend (simulate as a new message)
      const sessionId = 'web-dashboard-session';
      const approvalMsg = `User approved: ${pendingCommand}`;
      const response = await apiClient.sendChatMessage(approvalMsg, sessionId);
      const aiResponse: Message = {
        id: (Date.now() + 2).toString(),
        type: response.type as Message['type'],
        content: response.message,
        timestamp: new Date(),
        isSpecialCommand: false,
        actionResult: '',
        suggestions: response.suggestions || []
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
      setPendingCommand(null);
      setPendingExplanation(null);
      setPendingMessageId(null);
    }
  };
  const handleReject = () => {
    setShowConfirm(false);
    setPendingCommand(null);
    setPendingExplanation(null);
    setPendingMessageId(null);
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Confirmation Dialog for Risky Actions */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Risky Command Confirmation</DialogTitle>
          </DialogHeader>
          <div className="mb-2">
            <div className="font-semibold">Explanation:</div>
            <div className="text-sm whitespace-pre-line">{pendingExplanation}</div>
          </div>
          <div className="mb-2">
            <div className="font-semibold">Proposed Command:</div>
            <div className="bg-gray-100 rounded px-2 py-1 font-mono text-sm">{pendingCommand}</div>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject}>Reject</Button>
            <Button variant="success" onClick={handleApprove}>Approve & Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
          {messages.map((message) => {
            // Detect risky action and show confirmation dialog
            if (
              message.type === 'action' &&
              message.content.includes('⚠️ Risky command proposed:') &&
              !showConfirm &&
              pendingMessageId !== message.id
            ) {
              // Extract command and explanation
              const commandMatch = message.content.match(/⚠️ Risky command proposed: (.*)\. User confirmation required\./);
              const explanationMatch = message.content.match(/([\s\S]*?)\n\n⚠️ Risky command proposed:/);
              setPendingCommand(commandMatch ? commandMatch[1] : '');
              setPendingExplanation(explanationMatch ? explanationMatch[1].trim() : '');
              setPendingMessageId(message.id);
              setShowConfirm(true);
            }
            // Detect code preview
            let codeBlock = null;
            if (message.content.includes('Proposed code:')) {
              const codeMatch = message.content.match(/Proposed code:\n([\s\S]*)/);
              if (codeMatch) {
                codeBlock = (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-1">Proposed code:</div>
                    <SyntaxHighlighter language="typescript" style={duotoneSpace} customStyle={{ borderRadius: 6, fontSize: 13 }}>
                      {codeMatch[1]}
                    </SyntaxHighlighter>
                    <Button variant="ghost" size="sm" className="mt-1" onClick={() => navigator.clipboard.writeText(codeMatch[1])}>
                      <Copy className="h-4 w-4 mr-1 inline" /> Copy
                    </Button>
                  </div>
                );
              }
            }
            return (
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
                      {message.content}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm text-gray-600 mb-2">💡 Suggested next questions:</div>
                          <div className="flex flex-wrap gap-1">
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {message.type === 'action' && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <div className="bg-green-50 border-l-4 border-green-400 rounded-lg px-4 py-2 max-w-xl whitespace-pre-line">
                      <Badge variant="success">Action</Badge>
                      <div>{message.content}</div>
                      {message.actionResult && <div className="mt-2 text-green-700">{message.actionResult}</div>}
                      {codeBlock}
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
            );
          })}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="bg-blue-50 rounded-lg px-4 py-2 max-w-xl">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Quick Actions */}
        <div className="flex gap-2 px-4 pb-2">
          {quickActions.map(action => (
            <Button key={action.label} variant="outline" size="sm" onClick={() => handleQuickAction(action.command)}>
              <action.icon className="h-4 w-4 mr-1" /> {action.label}
            </Button>
          ))}
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
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 px-4 pb-4">
          {suggestions.map(suggestion => (
            <Button key={suggestion} variant="ghost" size="sm" onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
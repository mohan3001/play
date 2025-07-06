import { ChatInterface } from "@/components/chat/chat-interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles, FileText, Play, GitBranch, TrendingUp } from "lucide-react"

export default function ChatPage() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Code Generation",
      description: "Generate test code, page objects, and step definitions using natural language"
    },
    {
      icon: FileText,
      title: "Framework Analysis",
      description: "Get insights about your test structure, coverage, and recommendations"
    },
    {
      icon: Play,
      title: "Test Execution",
      description: "Run tests, monitor execution, and view results in real-time"
    },
    {
      icon: GitBranch,
      title: "Git Integration",
      description: "Manage branches, commits, and workflows directly from chat"
    }
  ]

  const recentCommands = [
    "count tests",
    "analyze framework",
    "run login feature",
    "ai workflow",
    "create new test for cart functionality"
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h1>
          <p className="text-muted-foreground">
            Interact with your AI assistant for test automation and framework management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success">AI Online</Badge>
          <Badge variant="info">Ollama Connected</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Chat Interface */}
        <div className="lg:col-span-2">
          <ChatInterface className="h-[600px]" />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Commands
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentCommands.map((command, index) => (
                  <div
                    key={index}
                    className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {command}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">AI Interactions</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tests Generated</span>
                <span className="font-medium">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Commands Executed</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="font-medium">~2.3s</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
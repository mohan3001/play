import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentTests } from "@/components/dashboard/recent-tests"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Bot, GitBranch, FileText } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your Playwright AI automation dashboard
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Play className="mr-2 h-4 w-4" />
            Run Tests
          </Button>
          <Button variant="outline">
            <Bot className="mr-2 h-4 w-4" />
            AI Chat
          </Button>
        </div>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentTests />
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Play className="h-6 w-6 mb-2" />
                <span className="text-sm">Run All Tests</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Bot className="h-6 w-6 mb-2" />
                <span className="text-sm">AI Workflow</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <GitBranch className="h-6 w-6 mb-2" />
                <span className="text-sm">Git Operations</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <FileText className="h-6 w-6 mb-2" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI Assistant Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ollama Connection</span>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Model</span>
                <span className="text-sm text-gray-600">mistral</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm text-gray-600">~2.3s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today's Interactions</span>
                <span className="text-sm text-gray-600">23</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Playwright</span>
                <span className="text-sm text-green-600">✓ Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cucumber</span>
                <span className="text-sm text-green-600">✓ Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Git Repository</span>
                <span className="text-sm text-green-600">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Test Reports</span>
                <span className="text-sm text-green-600">✓ Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

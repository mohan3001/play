import { TestFileBrowser } from "@/components/tests/test-file-browser"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Play, 
  Folder, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

export default function TestsPage() {
  const testStats = [
    { label: 'Total Files', value: '14', icon: FileText, color: 'text-blue-600' },
    { label: 'Feature Files', value: '3', icon: FileText, color: 'text-green-600' },
    { label: 'Test Specs', value: '4', icon: Play, color: 'text-purple-600' },
    { label: 'Page Objects', value: '8', icon: Folder, color: 'text-orange-600' }
  ]

  const recentActivity = [
    {
      action: 'Test Updated',
      file: 'login.spec.ts',
      time: '2 hours ago',
      status: 'success'
    },
    {
      action: 'New Feature Added',
      file: 'cart.feature',
      time: '4 hours ago',
      status: 'success'
    },
    {
      action: 'Test Failed',
      file: 'checkout.spec.ts',
      time: '6 hours ago',
      status: 'error'
    },
    {
      action: 'Page Object Created',
      file: 'CartPage.ts',
      time: '1 day ago',
      status: 'success'
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Management</h1>
          <p className="text-muted-foreground">
            Organize, manage, and execute your test files and scenarios
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {testStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-full bg-gray-100`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Test File Browser */}
        <div className="lg:col-span-2">
          <TestFileBrowser />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Play className="h-4 w-4 mr-2" />
                Run All Tests
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Generate New Test
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Coverage
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Test History
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`p-1 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.action}</p>
                      <p className="text-xs text-gray-600 truncate">{activity.file}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Test Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Feature Tests</span>
                  <Badge variant="outline">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unit Tests</span>
                  <Badge variant="outline">8</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Integration Tests</span>
                  <Badge variant="outline">4</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">E2E Tests</span>
                  <Badge variant="outline">3</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 
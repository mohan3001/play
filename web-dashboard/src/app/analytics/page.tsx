import { TestAnalytics } from "@/components/analytics/test-analytics"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Filter
} from "lucide-react"

export default function AnalyticsPage() {
  const timeRanges = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'This year', value: '1y' }
  ]

  const summaryStats = [
    {
      label: 'Total Tests',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      description: 'vs last period'
    },
    {
      label: 'Success Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up',
      description: 'vs last period'
    },
    {
      label: 'Avg Duration',
      value: '2.3s',
      change: '-0.5s',
      trend: 'down',
      description: 'vs last period'
    },
    {
      label: 'Coverage',
      value: '87.5%',
      change: '+5.2%',
      trend: 'up',
      description: 'vs last period'
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive test analytics, performance metrics, and trend analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <Badge 
                    variant={stat.trend === 'up' ? 'success' : 'error'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Time Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-sm font-medium">Time Range:</span>
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={range.value === '30d' ? 'default' : 'outline'}
                size="sm"
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          <TestAnalytics />
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Login Flow', success: 98, avgTime: 1.8 },
                { name: 'Add to Cart', success: 97, avgTime: 1.2 },
                { name: 'Search Function', success: 96, avgTime: 1.5 },
                { name: 'User Registration', success: 95, avgTime: 2.1 },
                { name: 'Checkout Process', success: 94, avgTime: 3.2 }
              ].map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{test.name}</p>
                    <p className="text-xs text-gray-600">{test.success}% success rate</p>
                  </div>
                  <Badge variant="success">{test.avgTime}s</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'Payment Gateway', issues: 3, priority: 'high' },
                { name: 'Mobile Responsiveness', issues: 2, priority: 'medium' },
                { name: 'API Integration', issues: 1, priority: 'low' },
                { name: 'Performance Tests', issues: 2, priority: 'medium' },
                { name: 'Security Tests', issues: 1, priority: 'high' }
              ].map((area, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium text-sm">{area.name}</p>
                    <p className="text-xs text-gray-600">{area.issues} issues found</p>
                  </div>
                  <Badge 
                    variant={area.priority === 'high' ? 'error' : area.priority === 'medium' ? 'warning' : 'info'}
                  >
                    {area.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
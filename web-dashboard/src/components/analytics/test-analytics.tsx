"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api"

const testExecutionData = [
  { date: 'Mon', passed: 45, failed: 5, skipped: 2 },
  { date: 'Tue', passed: 52, failed: 3, skipped: 1 },
  { date: 'Wed', passed: 48, failed: 7, skipped: 3 },
  { date: 'Thu', passed: 55, failed: 2, skipped: 0 },
  { date: 'Fri', passed: 50, failed: 4, skipped: 1 },
  { date: 'Sat', passed: 38, failed: 6, skipped: 2 },
  { date: 'Sun', passed: 42, failed: 3, skipped: 1 }
]

const testCoverageData = [
  { name: 'Login', coverage: 95, tests: 12 },
  { name: 'Cart', coverage: 88, tests: 8 },
  { name: 'Checkout', coverage: 92, tests: 15 },
  { name: 'Search', coverage: 85, tests: 6 },
  { name: 'Profile', coverage: 78, tests: 10 }
]

// testStatusData will be calculated from real analytics data

const performanceData = [
  { test: 'Login Flow', avgTime: 2.3, minTime: 1.8, maxTime: 3.1 },
  { test: 'Add to Cart', avgTime: 1.5, minTime: 1.2, maxTime: 2.0 },
  { test: 'Checkout Process', avgTime: 4.2, minTime: 3.5, maxTime: 5.1 },
  { test: 'Search Function', avgTime: 1.8, minTime: 1.4, maxTime: 2.3 },
  { test: 'User Registration', avgTime: 3.1, minTime: 2.8, maxTime: 3.8 }
]

export function TestAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [coverageData, setCoverageData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [analytics, performance, coverage] = await Promise.all([
        apiClient.getAnalyticsData('7d'),
        apiClient.getPerformanceMetrics(),
        apiClient.getCoverageData()
      ])
      
      setAnalyticsData(analytics)
      setPerformanceData(performance)
      setCoverageData(coverage)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setError('Failed to load analytics data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadAnalyticsData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Test Execution Trends */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Execution Trends</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="success">+12%</Badge>
              <span className="text-sm text-gray-600">vs last week</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.testExecutionTrends || testExecutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="passed" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Passed"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Failed"
              />
              <Line 
                type="monotone" 
                dataKey="skipped" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Skipped"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Coverage by Module */}
        <Card>
          <CardHeader>
            <CardTitle>Test Coverage by Module</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.testCoverage || testCoverageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="coverage" fill="#3b82f6" name="Coverage %" />
                <Bar dataKey="tests" fill="#8b5cf6" name="Test Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.summary ? [
                    { name: 'Passed', value: analyticsData.summary.totalTests * (analyticsData.summary.successRate / 100), color: '#10b981' },
                    { name: 'Failed', value: analyticsData.summary.totalTests * ((100 - analyticsData.summary.successRate) / 100), color: '#ef4444' },
                    { name: 'Skipped', value: 0, color: '#f59e0b' }
                  ] : []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(analyticsData?.summary ? [
                    { name: 'Passed', value: analyticsData.summary.totalTests * (analyticsData.summary.successRate / 100), color: '#10b981' },
                    { name: 'Failed', value: analyticsData.summary.totalTests * ((100 - analyticsData.summary.successRate) / 100), color: '#ef4444' },
                    { name: 'Skipped', value: 0, color: '#f59e0b' }
                  ] : []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Test Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData?.map((test: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{test.test}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Avg: {test.avgTime}s</span>
                    <span>Min: {test.minTime}s</span>
                    <span>Max: {test.maxTime}s</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {test.avgTime < 2 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : test.avgTime < 4 ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <Badge variant={test.avgTime < 2 ? "success" : test.avgTime < 4 ? "warning" : "error"}>
                    {test.avgTime < 2 ? "Fast" : test.avgTime < 4 ? "Medium" : "Slow"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData?.summary?.successRate || 0}%</p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData?.summary?.avgDuration || 0}s</p>
                <p className="text-sm text-gray-600">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{analyticsData?.summary?.totalTests || 0}</p>
                <p className="text-sm text-gray-600">Tests Run</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{100 - (analyticsData?.summary?.successRate || 0)}%</p>
                <p className="text-sm text-gray-600">Failure Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
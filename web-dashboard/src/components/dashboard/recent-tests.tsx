"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { formatDate, formatDuration } from "@/lib/utils"

interface TestExecution {
  id: string
  name: string
  status: 'passed' | 'failed' | 'running' | 'skipped'
  duration: number
  timestamp: string
  browser: string
  error?: string
}

const mockTests: TestExecution[] = [
  {
    id: '1',
    name: 'Login Feature - Valid Credentials',
    status: 'passed',
    duration: 2.5,
    timestamp: new Date().toISOString(),
    browser: 'Chrome'
  },
  {
    id: '2',
    name: 'Add to Cart - Product Selection',
    status: 'running',
    duration: 1.2,
    timestamp: new Date(Date.now() - 60000).toISOString(),
    browser: 'Firefox'
  },
  {
    id: '3',
    name: 'Checkout Process - Payment Flow',
    status: 'failed',
    duration: 8.7,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    browser: 'Safari',
    error: 'Payment gateway timeout'
  },
  {
    id: '4',
    name: 'User Registration - Email Validation',
    status: 'passed',
    duration: 3.1,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    browser: 'Chrome'
  },
  {
    id: '5',
    name: 'Search Functionality - Results Display',
    status: 'skipped',
    duration: 0,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    browser: 'Edge'
  }
]

function getStatusIcon(status: TestExecution['status']) {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'running':
      return <Play className="h-4 w-4 text-blue-500 animate-pulse" />
    case 'skipped':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }
}

function getStatusVariant(status: TestExecution['status']) {
  switch (status) {
    case 'passed':
      return 'success' as const
    case 'failed':
      return 'error' as const
    case 'running':
      return 'running' as const
    case 'skipped':
      return 'warning' as const
  }
}

export function RecentTests() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Test Executions</CardTitle>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTests.map((test) => (
            <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                {getStatusIcon(test.status)}
                <div>
                  <p className="font-medium text-sm">{test.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{test.browser}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(test.duration)}</span>
                    <span>•</span>
                    <span>{formatDate(test.timestamp)}</span>
                  </div>
                  {test.error && (
                    <p className="text-xs text-red-600 mt-1">{test.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusVariant(test.status)}>
                  {test.status}
                </Badge>
                {test.status === 'running' && (
                  <Button size="sm" variant="outline">
                    Stop
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 
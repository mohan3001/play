"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Bot,
  GitBranch
} from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  badge?: {
    text: string
    variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "error" | "info" | "running"
  }
}

function StatsCard({ title, value, description, icon, trend, badge }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className="h-4 w-4 text-gray-600">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
        </div>
                  <p className="text-xs text-gray-600 mt-1">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className={`h-3 w-3 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last week
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const stats = [
    {
      title: "Total Tests",
      value: "1,234",
      description: "Across all test suites",
      icon: <FileText className="h-4 w-4" />,
      trend: { value: 12, isPositive: true },
      badge: { text: "Active", variant: "success" as const }
    },
    {
      title: "Passed Tests",
      value: "1,156",
      description: "93.7% success rate",
      icon: <CheckCircle className="h-4 w-4" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Failed Tests",
      value: "78",
      description: "6.3% failure rate",
      icon: <XCircle className="h-4 w-4" />,
      trend: { value: 15, isPositive: false }
    },
    {
      title: "Running Tests",
      value: "12",
      description: "Currently executing",
      icon: <Play className="h-4 w-4" />,
      badge: { text: "Live", variant: "running" as const }
    },
    {
      title: "AI Interactions",
      value: "456",
      description: "This week",
      icon: <Bot className="h-4 w-4" />,
      trend: { value: 23, isPositive: true }
    },
    {
      title: "Git Branches",
      value: "8",
      description: "Active feature branches",
      icon: <GitBranch className="h-4 w-4" />,
      badge: { text: "Updated", variant: "info" as const }
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
} 
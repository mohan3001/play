"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Folder, 
  FileText, 
  Play, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TestFile {
  id: string
  name: string
  type: 'feature' | 'spec' | 'step' | 'page' | 'util'
  path: string
  status: 'active' | 'deprecated' | 'draft'
  lastModified: Date
  size: number
  testCount?: number
  children?: TestFile[]
}

interface TestFileBrowserProps {
  className?: string
}

const mockTestFiles: TestFile[] = [
  {
    id: '1',
    name: 'automation',
    type: 'util',
    path: '/automation',
    status: 'active',
    lastModified: new Date(),
    size: 0,
    children: [
      {
        id: '2',
        name: 'tests',
        type: 'util',
        path: '/automation/tests',
        status: 'active',
        lastModified: new Date(),
        size: 0,
        children: [
          {
            id: '3',
            name: 'features',
            type: 'util',
            path: '/automation/tests/features',
            status: 'active',
            lastModified: new Date(),
            size: 0,
            children: [
              {
                id: '4',
                name: 'login.feature',
                type: 'feature',
                path: '/automation/tests/features/login.feature',
                status: 'active',
                lastModified: new Date(Date.now() - 86400000),
                size: 2048,
                testCount: 3
              }
            ]
          },
          {
            id: '5',
            name: 'steps',
            type: 'util',
            path: '/automation/tests/steps',
            status: 'active',
            lastModified: new Date(),
            size: 0,
            children: [
              {
                id: '6',
                name: 'loginSteps.ts',
                type: 'step',
                path: '/automation/tests/steps/loginSteps.ts',
                status: 'active',
                lastModified: new Date(Date.now() - 172800000),
                size: 4096,
                testCount: 3
              }
            ]
          },
          {
            id: '7',
            name: 'login.spec.ts',
            type: 'spec',
            path: '/automation/tests/login.spec.ts',
            status: 'active',
            lastModified: new Date(Date.now() - 259200000),
            size: 3072,
            testCount: 4
          },
          {
            id: '8',
            name: 'inventory.spec.ts',
            type: 'spec',
            path: '/automation/tests/inventory.spec.ts',
            status: 'active',
            lastModified: new Date(Date.now() - 345600000),
            size: 2560,
            testCount: 3
          },
          {
            id: '9',
            name: 'checkout.spec.ts',
            type: 'spec',
            path: '/automation/tests/checkout.spec.ts',
            status: 'active',
            lastModified: new Date(Date.now() - 432000000),
            size: 5120,
            testCount: 5
          }
        ]
      },
      {
        id: '10',
        name: 'src',
        type: 'util',
        path: '/automation/src',
        status: 'active',
        lastModified: new Date(),
        size: 0,
        children: [
          {
            id: '11',
            name: 'pages',
            type: 'util',
            path: '/automation/src/pages',
            status: 'active',
            lastModified: new Date(),
            size: 0,
            children: [
              {
                id: '12',
                name: 'shop',
                type: 'util',
                path: '/automation/src/pages/shop',
                status: 'active',
                lastModified: new Date(),
                size: 0,
                children: [
                  {
                    id: '13',
                    name: 'CartPage.ts',
                    type: 'page',
                    path: '/automation/src/pages/shop/CartPage.ts',
                    status: 'active',
                    lastModified: new Date(Date.now() - 518400000),
                    size: 2048
                  },
                  {
                    id: '14',
                    name: 'CheckoutPage.ts',
                    type: 'page',
                    path: '/automation/src/pages/shop/CheckoutPage.ts',
                    status: 'active',
                    lastModified: new Date(Date.now() - 604800000),
                    size: 3072
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]

function getFileIcon(type: TestFile['type']) {
  switch (type) {
    case 'feature':
      return <FileText className="h-4 w-4 text-green-600" />
    case 'spec':
      return <Play className="h-4 w-4 text-blue-600" />
    case 'step':
      return <FileText className="h-4 w-4 text-purple-600" />
    case 'page':
      return <FileText className="h-4 w-4 text-orange-600" />
    case 'util':
      return <Folder className="h-4 w-4 text-gray-600" />
  }
}

function getStatusVariant(status: TestFile['status']) {
  switch (status) {
    case 'active':
      return 'success' as const
    case 'deprecated':
      return 'warning' as const
    case 'draft':
      return 'info' as const
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function TestFileItem({ file, level = 0 }: { file: TestFile; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  const hasChildren = file.children && file.children.length > 0

  return (
    <div>
      <div 
        className={cn(
          "flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer",
          level > 0 && "ml-4"
        )}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {getFileIcon(file.type)}
          <span className="text-sm font-medium">{file.name}</span>
          {file.testCount && (
            <Badge variant="outline" className="text-xs">
              {file.testCount} tests
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(file.status)} className="text-xs">
            {file.status}
          </Badge>
          {file.size > 0 && (
            <span className="text-xs text-gray-500">
              {formatFileSize(file.size)}
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Play className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {file.children!.map((child) => (
            <TestFileItem key={child.id} file={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TestFileBrowser({ className }: TestFileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<TestFile['type'] | 'all'>('all')

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Test Files</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search test files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* File Tree */}
        <div className="border rounded-lg">
          {mockTestFiles.map((file) => (
            <TestFileItem key={file.id} file={file} />
          ))}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Files: 14</span>
            <span>Total Tests: 18</span>
            <span>Last Updated: 2 hours ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
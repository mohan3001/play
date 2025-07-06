"use client"

import { useState, useEffect } from "react"
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
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient, TestFile } from "@/lib/api"

interface TestFileBrowserProps {
  className?: string
}

export function TestFileBrowser({ className }: TestFileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'feature' | 'spec' | 'step' | 'all'>('all')
  const [testFiles, setTestFiles] = useState<TestFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTestFiles()
  }, [])

  const loadTestFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const files = await apiClient.getTestFiles()
      setTestFiles(files)
    } catch (error) {
      console.error('Failed to load test files:', error)
      setError('Failed to load test files. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredFiles = testFiles.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.relativePath.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || file.type === filterType
    return matchesSearch && matchesFilter
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'spec':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'step':
        return <FileText className="h-4 w-4 text-purple-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleRunTest = async (file: TestFile) => {
    try {
      console.log(`Running test: ${file.name}`)
      // TODO: Implement test execution
    } catch (error) {
      console.error('Failed to run test:', error)
    }
  }

  const handleEditTest = (file: TestFile) => {
    console.log(`Editing test: ${file.name}`)
    // TODO: Implement test editing
  }

  const handleDeleteTest = (file: TestFile) => {
    console.log(`Deleting test: ${file.name}`)
    // TODO: Implement test deletion
  }

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

        {/* File List */}
        <div className="border rounded-lg">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading test files...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={loadTestFiles}
              >
                Retry
              </Button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchTerm || filterType !== 'all' ? 'No test files match your search criteria' : 'No test files found'}
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div key={file.path} className="flex items-center justify-between p-2 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.type)}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-500">{file.relativePath}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {file.type}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleRunTest(file)}
                      title="Run test"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleEditTest(file)}
                      title="Edit test"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteTest(file)}
                      title="Delete test"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Files: {testFiles.length}</span>
            <span>Filtered: {filteredFiles.length}</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 
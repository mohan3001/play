const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export interface AIResponse {
  message: string
  type: 'text' | 'command' | 'error' | 'action'
  data?: any
  timestamp: string
  suggestions?: string[]
  ragUsed?: boolean // Add this line for RAG context indicator
}

export interface TestExecutionOptions {
  browser?: 'chromium' | 'firefox' | 'webkit'
  headless?: boolean
  workers?: number
  timeout?: number
  retries?: number
}

export interface ExecutionUpdate {
  executionId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  message?: string
  results?: any
  timestamp: string
}

export interface TestFile {
  name: string
  path: string
  relativePath: string
  size: number
  modified: Date
  type: 'feature' | 'spec' | 'step'
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // AI Chat Methods
  async sendChatMessage(message: string, sessionId: string): Promise<AIResponse> {
    const response = await this.request<{ success: boolean; data: AIResponse }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    })
    return response.data
  }

  async executeAICommand(command: string): Promise<AIResponse> {
    const response = await this.request<{ success: boolean; data: AIResponse }>('/api/ai/command', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
    return response.data
  }

  async getAIStatus(): Promise<{ connected: boolean; healthy: boolean; timestamp: string }> {
    const response = await this.request<{ success: boolean; data: any }>('/api/ai/status')
    return response.data
  }

  async getAICommands(): Promise<Array<{ name: string; description: string; category: string }>> {
    const response = await this.request<{ success: boolean; data: any[] }>('/api/ai/commands')
    return response.data
  }

  // Test Execution Methods
  async getTestFiles(): Promise<TestFile[]> {
    const response = await this.request<{ success: boolean; data: TestFile[] }>('/api/tests/files')
    return response.data
  }

  async startTestExecution(testFile: string, options: TestExecutionOptions = {}): Promise<{ executionId: string; status: string; timestamp: string }> {
    const response = await this.request<{ success: boolean; data: any }>('/api/tests/execute', {
      method: 'POST',
      body: JSON.stringify({ testFile, options }),
    })
    return response.data
  }

  async getExecutionStatus(executionId: string): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(`/api/tests/execution/${executionId}`)
    return response.data
  }

  async cancelExecution(executionId: string): Promise<{ executionId: string; status: string; timestamp: string }> {
    const response = await this.request<{ success: boolean; data: any }>(`/api/tests/execution/${executionId}/cancel`, {
      method: 'POST',
    })
    return response.data
  }

  async getAllExecutions(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>('/api/tests/executions')
    return response.data
  }

  async getTestServiceStatus(): Promise<{ ready: boolean; healthy: boolean; timestamp: string }> {
    const response = await this.request<{ success: boolean; data: any }>('/api/tests/status')
    return response.data
  }

  // Analytics Methods
  async getAnalyticsData(timeRange: string = '30d'): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>(`/api/analytics/data?timeRange=${timeRange}`)
    return response.data
  }

  async getTestReports(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>('/api/analytics/reports')
    return response.data
  }

  async getPerformanceMetrics(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>('/api/analytics/performance')
    return response.data
  }

  async getCoverageData(): Promise<any> {
    const response = await this.request<{ success: boolean; data: any }>('/api/analytics/coverage')
    return response.data
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string; services: any }> {
    const response = await this.request<{ status: string; timestamp: string; version: string; services: any }>('/health')
    return response
  }
}

export const apiClient = new ApiClient() 
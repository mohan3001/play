"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home,
  MessageSquare,
  FileText,
  BarChart3,
  GitBranch,
  Bot,
  TestTube,
  FolderOpen,
  BracketsIcon
} from "lucide-react"

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'AI Chat', href: '/chat', icon: MessageSquare },
  { name: 'Test Management', href: '/tests', icon: FileText },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Git Integration', href: '/git', icon: BracketsIcon },
  { name: 'AI Workflows', href: '/workflows', icon: Bot },
  { name: 'Test Files', href: '/files', icon: FolderOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <TestTube className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-white">Playwright AI</span>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
      
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">AI</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">AI Assistant</p>
            <p className="text-xs text-gray-400">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
} 
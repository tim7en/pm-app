"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  FileText, 
  FolderOpen, 
  User, 
  X,
  ArrowRight 
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/hooks/use-translation"

interface SearchResult {
  id: string
  type: 'task' | 'project' | 'user'
  title?: string
  name?: string
  description?: string
  status?: string
  priority?: string
  color?: string
  assignee?: any
  creator?: any
  owner?: any
  avatar?: string
  email?: string
}

interface DashboardSearchProps {
  onResultClick?: (result: SearchResult) => void
}

export function DashboardSearch({ onResultClick }: DashboardSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    tasks: SearchResult[]
    projects: SearchResult[]
    users: SearchResult[]
  }>({ tasks: [], projects: [], users: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`)
          if (response.ok) {
            const data = await response.json()
            setResults(data)
            setShowResults(true)
          }
        } catch (error) {
          console.error('Search error:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults({ tasks: [], projects: [], users: [] })
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      // Default navigation behavior
      if (result.type === 'task') {
        router.push(`/tasks?taskId=${result.id}`)
      } else if (result.type === 'project') {
        router.push(`/projects?projectId=${result.id}`)
      } else if (result.type === 'user') {
        router.push(`/team?userId=${result.id}`)
      }
    }
    setShowResults(false)
    setQuery("")
  }

  const clearSearch = () => {
    setQuery("")
    setResults({ tasks: [], projects: [], users: [] })
    setShowResults(false)
  }

  const totalResults = results.tasks.length + results.projects.length + results.users.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'DONE': return 'bg-green-100 text-green-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("dashboard.searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={clearSearch}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : totalResults === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">Tasks</h4>
                    {results.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleResultClick(task)}
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {task.status && (
                              <Badge variant="secondary" className={`text-xs ${getStatusColor(task.status)}`}>
                                {task.status}
                              </Badge>
                            )}
                            {task.priority && (
                              <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div className="p-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">Projects</h4>
                    {results.projects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleResultClick(project)}
                      >
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: project.color || '#3b82f6' }}
                        />
                        <FolderOpen className="h-4 w-4 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          {project.status && (
                            <Badge variant="secondary" className={`text-xs ${getStatusColor(project.status)} mt-1`}>
                              {project.status}
                            </Badge>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <div className="p-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2 px-2">Team</h4>
                    {results.users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleResultClick(user)}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  MoreHorizontal, 
  Search, 
  Filter, 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  CheckCircle2,
  Circle,
  User,
  UserCheck,
  Flag,
  ArrowUpDown,
  Plus,
  Eye
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { TaskStatus, Priority } from "@prisma/client"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskListProps {
  tasks: Array<{
    id: string
    title: string
    description?: string
    status: TaskStatus
    priority: Priority
    dueDate?: Date
    assigneeId?: string
    creatorId?: string
    assignee?: {
      id: string
      name: string
      avatar?: string
    }
    assignees?: Array<{
      user: {
        id: string
        name: string
        avatar?: string
      }
    }>
    creator: {
      id: string
      name: string
      avatar?: string
    }
    project: {
      id: string
      name: string
      color: string
    }
    commentCount: number
    attachmentCount: number
    subtaskCount: number
    completedSubtaskCount: number
    tags: Array<{
      id: string
      name: string
      color: string
    }>
  }>
  onTaskUpdate?: (taskId: string, updates: any) => void
  onTaskDelete?: (taskId: string) => void
  onTaskEdit?: (task: any) => void
  onTaskView?: (taskId: string) => void
  onCreateTask?: () => void
  onTaskReassign?: (taskId: string, currentAssigneeId?: string) => void
  onTaskEditWithComments?: (task: any) => void
  currentUserId?: string
  taskType?: 'assigned' | 'created'
}

const statusColors = {
  [TaskStatus.TODO]: "bg-gray-100 text-gray-800",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [TaskStatus.REVIEW]: "bg-yellow-100 text-yellow-800",
  [TaskStatus.DONE]: "bg-green-100 text-green-800",
}

const priorityColors = {
  [Priority.LOW]: "text-gray-500",
  [Priority.MEDIUM]: "text-yellow-500",
  [Priority.HIGH]: "text-orange-500",
  [Priority.URGENT]: "text-red-500",
}

export function TaskList({ 
  tasks, 
  onTaskUpdate, 
  onTaskDelete, 
  onTaskEdit, 
  onTaskView,
  onCreateTask,
  onTaskReassign,
  onTaskEditWithComments,
  currentUserId,
  taskType = 'assigned'
}: TaskListProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("createdAt")

  const priorityLabels = {
    [Priority.LOW]: t("tasks.low"),
    [Priority.MEDIUM]: t("tasks.medium"),
    [Priority.HIGH]: t("tasks.high"),
    [Priority.URGENT]: t("tasks.urgent"),
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Always keep completed tasks at bottom, but maintain their relative order
    const aCompleted = a.status === TaskStatus.DONE
    const bCompleted = b.status === TaskStatus.DONE
    
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    
    // For tasks with the same completion status, apply the selected sorting
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title)
      case "dueDate":
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      case "priority":
        const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      case "status":
        const statusOrder = { TODO: 1, IN_PROGRESS: 2, REVIEW: 3, DONE: 4 }
        return statusOrder[a.status] - statusOrder[b.status]
      default:
        return a.id.localeCompare(b.id)  // Use ID for stable sorting
    }
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isOverdue = (task: any) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
  }

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("tasks.searchTasks")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value={TaskStatus.TODO}>{t("tasks.todo")}</SelectItem>
              <SelectItem value={TaskStatus.IN_PROGRESS}>{t("tasks.inProgress")}</SelectItem>
              <SelectItem value={TaskStatus.REVIEW}>{t("tasks.review")}</SelectItem>
              <SelectItem value={TaskStatus.DONE}>{t("tasks.done")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("filters.priority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allPriorities")}</SelectItem>
              <SelectItem value={Priority.LOW}>{t("tasks.low")}</SelectItem>
              <SelectItem value={Priority.MEDIUM}>{t("tasks.medium")}</SelectItem>
              <SelectItem value={Priority.HIGH}>{t("tasks.high")}</SelectItem>
              <SelectItem value={Priority.URGENT}>{t("tasks.urgent")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("filters.sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">{t("tasks.createdAt")}</SelectItem>
              <SelectItem value="title">{t("tasks.title")}</SelectItem>
              <SelectItem value="dueDate">{t("tasks.dueDate")}</SelectItem>
              <SelectItem value="priority">{t("tasks.priority")}</SelectItem>
              <SelectItem value="status">{t("tasks.status")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={onCreateTask}>
          <Plus className="h-4 w-4 mr-2" />
          {t("tasks.newTask")}
        </Button>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t("tasks.tasks")} ({sortedTasks.length})</span>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t("tasks.moreFilters")}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedTasks.map((task) => {
              // Check both legacy single assignee and new multi-assignee system
              const isAssignedToMe = currentUserId && (
                task.assigneeId === currentUserId || 
                task.assignees?.some(assignee => assignee.user.id === currentUserId)
              )
              const isCreatedByMe = currentUserId && task.creatorId === currentUserId
              
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300 cursor-pointer ${
                    taskType === 'assigned' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-purple-500'
                  } ${task.status === TaskStatus.DONE ? 'opacity-75' : 'opacity-100'}`}
                  onClick={() => onTaskEdit?.(task)}
                >
                  {/* Checkbox */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onTaskUpdate?.(task.id, { 
                        status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE 
                      })
                    }}
                  >
                    {task.status === TaskStatus.DONE ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <h3 className={`font-medium text-sm ${task.status === TaskStatus.DONE ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${statusColors[task.status]}`}
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Flag className={`h-3 w-3 ${priorityColors[task.priority]}`} />
                      <span className="text-xs text-muted-foreground">
                        {priorityLabels[task.priority]}
                      </span>
                      
                      {/* Task type indicator - dynamically check assignment */}
                      {currentUserId && (
                        task.assigneeId === currentUserId || 
                        task.assignees?.some(assignee => assignee.user.id === currentUserId)
                      ) && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                          <UserCheck className="h-3 w-3 mr-1" />
                          {t("tasks.assignedToYou")}
                        </Badge>
                      )}
                      {currentUserId && task.creatorId === currentUserId && (
                        task.assigneeId !== currentUserId && 
                        !task.assignees?.some(assignee => assignee.user.id === currentUserId)
                      ) && (
                        <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                          <User className="h-3 w-3 mr-1" />
                          {t("tasks.createdByYou")}
                        </Badge>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {task.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant="outline"
                            className="text-xs"
                            style={{ borderColor: tag.color, color: tag.color }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {task.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: task.project.color }}
                        />
                        <span>{task.project.name}</span>
                      </div>
                      
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-500' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      
                      {task.subtaskCount > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{task.completedSubtaskCount}/{task.subtaskCount}</span>
                        </div>
                      )}
                      
                      {/* Show creator/assignee info */}
                      {taskType === 'created' && (task.assignee || (task.assignees && task.assignees.length > 0)) && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{t("tasks.assignedTo")}</span>
                          {(() => {
                            // Check if we have multi-assignees or single assignee
                            const hasMultiAssignees = task.assignees && task.assignees.length > 0
                            const hasSingleAssignee = task.assignee && !hasMultiAssignees
                            
                            if (hasMultiAssignees) {
                              // Show multiple assignee avatars
                              return (
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center -space-x-1">
                                    {task.assignees!.slice(0, 2).map((assigneeData) => (
                                      <Avatar 
                                        key={assigneeData.user.id}
                                        className="h-4 w-4 border border-white cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onTaskReassign?.(task.id, task.assigneeId)
                                        }}
                                        title="Click to reassign task"
                                      >
                                        <AvatarImage src={assigneeData.user.avatar} alt={assigneeData.user.name} />
                                        <AvatarFallback className="text-xs">
                                          {assigneeData.user.name ? assigneeData.user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                    {task.assignees!.length > 2 && (
                                      <div className="flex items-center justify-center h-4 w-4 bg-gray-200 text-gray-600 text-xs rounded-full border border-white">
                                        +{task.assignees!.length - 2}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs">
                                    {task.assignees!.length === 1 
                                      ? task.assignees![0].user.name 
                                      : `${task.assignees!.length} members`}
                                  </span>
                                </div>
                              )
                            } else if (hasSingleAssignee) {
                              // Show single assignee (legacy support)
                              return (
                                <>
                                  <Avatar 
                                    className="h-4 w-4 cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onTaskReassign?.(task.id, task.assigneeId)
                                    }}
                                    title="Click to reassign task"
                                  >
                                    <AvatarImage src={task.assignee!.avatar} alt={task.assignee!.name} />
                                    <AvatarFallback className="text-xs">
                                      {task.assignee!.name ? task.assignee!.name.split(' ').map(n => n[0]).join('') : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs">{task.assignee!.name}</span>
                                </>
                              )
                            }
                          })()}
                        </div>
                      )}
                      
                      {taskType === 'assigned' && task.creator && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{t("tasks.createdBy")}</span>
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={task.creator.avatar} alt={task.creator.name} />
                            <AvatarFallback className="text-xs">
                              {task.creator.name ? task.creator.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{task.creator.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {task.commentCount > 0 && (
                      <div 
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onTaskEditWithComments?.(task)
                        }}
                        title="View/Add comments"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>{task.commentCount}</span>
                      </div>
                    )}
                    
                    {task.attachmentCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>{task.attachmentCount}</span>
                      </div>
                    )}
                    
                    {taskType === 'assigned' ? (
                      // For assigned tasks, show multi-assignee or single assignee (clickable for reassignment)
                      (() => {
                        const hasMultiAssignees = task.assignees && task.assignees.length > 0
                        const hasSingleAssignee = task.assignee && !hasMultiAssignees
                        
                        if (hasMultiAssignees) {
                          return (
                            <div className="flex items-center -space-x-1">
                              {task.assignees!.slice(0, 2).map((assigneeData) => (
                                <Avatar 
                                  key={assigneeData.user.id}
                                  className="h-6 w-6 border-2 border-white cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskReassign?.(task.id, task.assigneeId)
                                  }}
                                  title="Click to reassign task"
                                >
                                  <AvatarImage src={assigneeData.user.avatar} alt={assigneeData.user.name} />
                                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                    {assigneeData.user.name ? assigneeData.user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {task.assignees!.length > 2 && (
                                <div className="flex items-center justify-center h-6 w-6 bg-blue-100 text-blue-600 text-xs rounded-full border-2 border-white">
                                  +{task.assignees!.length - 2}
                                </div>
                              )}
                            </div>
                          )
                        } else if (hasSingleAssignee) {
                          return (
                            <Avatar 
                              className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskReassign?.(task.id, task.assigneeId)
                              }}
                              title="Click to reassign task"
                            >
                              <AvatarImage src={task.assignee!.avatar} alt={task.assignee!.name} />
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {task.assignee!.name ? task.assignee!.name.split(' ').map(n => n[0]).join('') : 'ME'}
                              </AvatarFallback>
                            </Avatar>
                          )
                        } else {
                          return (
                            <div 
                              className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskReassign?.(task.id, undefined)
                              }}
                              title="Click to assign task"
                            >
                              <User className="h-3 w-3" />
                              <span>{t("tasks.unassigned")}</span>
                            </div>
                          )
                        }
                      })()
                    ) : (
                      // For created tasks, show the assignee or unassigned (clickable for assignment/reassignment)
                      (() => {
                        const hasMultiAssignees = task.assignees && task.assignees.length > 0
                        const hasSingleAssignee = task.assignee && !hasMultiAssignees
                        
                        if (hasMultiAssignees) {
                          return (
                            <div className="flex items-center -space-x-1">
                              {task.assignees!.slice(0, 2).map((assigneeData) => (
                                <Avatar 
                                  key={assigneeData.user.id}
                                  className="h-6 w-6 border-2 border-white cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onTaskReassign?.(task.id, task.assigneeId)
                                  }}
                                  title="Click to reassign task"
                                >
                                  <AvatarImage src={assigneeData.user.avatar} alt={assigneeData.user.name} />
                                  <AvatarFallback className="text-xs">
                                    {assigneeData.user.name ? assigneeData.user.name.split(' ').map(n => n[0]).join('') : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {task.assignees!.length > 2 && (
                                <div className="flex items-center justify-center h-6 w-6 bg-gray-200 text-gray-600 text-xs rounded-full border-2 border-white">
                                  +{task.assignees!.length - 2}
                                </div>
                              )}
                            </div>
                          )
                        } else if (hasSingleAssignee) {
                          return (
                            <Avatar 
                              className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-blue-200 hover:ring-offset-1 transition-all" 
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskReassign?.(task.id, task.assigneeId)
                              }}
                              title="Click to reassign task"
                            >
                              <AvatarImage src={task.assignee!.avatar} alt={task.assignee!.name} />
                              <AvatarFallback className="text-xs">
                                {task.assignee!.name ? task.assignee!.name.split(' ').map(n => n[0]).join('') : 'U'}
                              </AvatarFallback>
                            </Avatar>
                          )
                        } else {
                          return (
                            <div 
                              className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                onTaskReassign?.(task.id, undefined)
                              }}
                              title="Click to assign task"
                            >
                              <User className="h-3 w-3" />
                              <span>{t("tasks.unassigned")}</span>
                            </div>
                          )
                        }
                      })()
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTaskView?.(task.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTaskEdit?.(task)}>
                          {t("tasks.editTask")}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onTaskUpdate?.(task.id, { 
                            status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE 
                          })}
                        >
                          {task.status === TaskStatus.DONE ? t("tasks.markAsIncomplete") : t("tasks.markAsComplete")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTaskDelete?.(task.id)} className="text-red-600">
                          {t("tasks.deleteTask")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
            
            {sortedTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-3">
                  {t("tasks.noTasksFound")}
                </p>
                <Button variant="outline" size="sm" onClick={onCreateTask}>
                  <Plus className="h-3 w-3 mr-2" />
                  {t("tasks.createTask")}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
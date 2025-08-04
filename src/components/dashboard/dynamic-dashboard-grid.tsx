"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings,
  Plus,
  Maximize2,
  Minimize2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useDashboardLayout } from "@/hooks/use-dashboard-layout"
import { type DashboardWidget } from "@/lib/dashboard-layout-storage"
import { DashboardCustomization } from "./dashboard-customization"

interface DraggableWidgetProps {
  widget: DashboardWidget
  isDragging?: boolean
  isEditing?: boolean
  onToggleVisibility?: (widgetId: string) => void
  children: React.ReactNode
}

function DraggableWidget({ 
  widget, 
  isDragging = false, 
  isEditing = false,
  onToggleVisibility,
  children 
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.size.width}`,
    gridRow: `span ${widget.size.height}`,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all duration-200",
        (isDragging || isSortableDragging) && "z-10 rotate-1 scale-105 shadow-xl opacity-90",
        !widget.visible && "opacity-50",
        isEditing && "ring-2 ring-primary/50 ring-offset-2"
      )}
    >
      {/* Widget Controls Overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
          <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggleVisibility?.(widget.id)}
              >
                {widget.visible ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Drag Handle (visible only when editing) */}
      {isEditing && (
        <div className="absolute top-2 right-2 z-20">
          <div
            {...attributes}
            {...listeners}
            className="p-1 bg-background/90 backdrop-blur-sm border rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      )}
      
      {children}
    </div>
  )
}

interface DynamicDashboardGridProps {
  children: (widgets: DashboardWidget[], isEditing: boolean) => {
    stats?: React.ReactNode
    recentTasks?: React.ReactNode
    activeProjects?: React.ReactNode
    activityFeed?: React.ReactNode
    teamMembers?: React.ReactNode
    teamCommunication?: React.ReactNode
  }
}

export function DynamicDashboardGrid({ children }: DynamicDashboardGridProps) {
  const { layout, visibleWidgets, updateLayout, toggleWidget, reorderWidgetList } = useDashboardLayout()
  const [isEditing, setIsEditing] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleLayoutChange = (newLayout: any) => {
    updateLayout(newLayout)
  }

  const handleToggleVisibility = (widgetId: string) => {
    toggleWidget(widgetId)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (active.id !== over?.id) {
      const oldIndex = visibleWidgets.findIndex(widget => widget.id === active.id)
      const newIndex = visibleWidgets.findIndex(widget => widget.id === over?.id)
      
      const newOrder = arrayMove(visibleWidgets, oldIndex, newIndex)
      reorderWidgetList(newOrder.map(w => w.id))
    }
  }

  const renderWidget = children(visibleWidgets, isEditing)
  const activeWidget = visibleWidgets.find(widget => widget.id === activeId)

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <Badge variant="secondary" className="text-xs">
            {visibleWidgets.length} widgets
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="hover-lift"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditing ? 'Done Editing' : 'Edit Layout'}
          </Button>
          
          <DashboardCustomization onLayoutChange={handleLayoutChange} />
        </div>
      </div>

      {/* Editing Mode Notice */}
      {isEditing && (
        <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Edit Mode Active
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Drag widgets to reorder, use controls to show/hide, or adjust settings in the customization panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div 
            className={cn(
              "grid gap-6 auto-rows-min transition-all duration-300",
              layout.compact && "gap-4",
              `grid-cols-1 md:grid-cols-2 lg:grid-cols-${layout.gridCols}`
            )}
            style={{
              gridTemplateColumns: `repeat(${layout.gridCols}, minmax(0, 1fr))`,
            }}
          >
            {visibleWidgets.map((widget) => {
              let content: React.ReactNode = null
              
              switch (widget.type) {
                case 'stats':
                  content = renderWidget.stats
                  break
                case 'recentTasks':
                  content = renderWidget.recentTasks
                  break
                case 'activeProjects':
                  content = renderWidget.activeProjects
                  break
                case 'activityFeed':
                  content = renderWidget.activityFeed
                  break
                case 'teamMembers':
                  content = renderWidget.teamMembers
                  break
                case 'teamCommunication':
                  content = renderWidget.teamCommunication
                  break
              }

              return (
                <DraggableWidget
                  key={widget.id}
                  widget={widget}
                  isEditing={isEditing}
                  onToggleVisibility={handleToggleVisibility}
                >
                  {content}
                </DraggableWidget>
              )
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget && (
            <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4" />
                    {activeWidget.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted/30 rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground">Moving...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ date, setDate, disabled, className }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const hours = date ? date.getHours().toString().padStart(2, '0') : '09'
  const minutes = date ? date.getMinutes().toString().padStart(2, '0') : '00'

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    if (!date) return
    
    const newDate = new Date(date)
    newDate.setHours(parseInt(newHours, 10))
    newDate.setMinutes(parseInt(newMinutes, 10))
    setDate(newDate)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? formatTime(date) : "Pick a time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">Select Time</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="hours" className="text-xs">Hours</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => handleTimeChange(e.target.value, minutes)}
                className="h-8"
              />
            </div>
            <div>
              <Label htmlFor="minutes" className="text-xs">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                min="0"
                max="59"
                step="5"
                value={minutes}
                onChange={(e) => handleTimeChange(hours, e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
              <Button
                key={time}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  const [h, m] = time.split(':')
                  handleTimeChange(h, m)
                  setIsOpen(false)
                }}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function DateTimePicker({ 
  date, 
  setDate, 
  disabled, 
  className, 
  placeholder = "Pick date and time" 
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // If we have an existing date, preserve the time
      if (date) {
        selectedDate.setHours(date.getHours())
        selectedDate.setMinutes(date.getMinutes())
      } else {
        // Default to 9:00 AM
        selectedDate.setHours(9, 0, 0, 0)
      }
    }
    setDate(selectedDate)
  }

  const handleTimeChange = (newDate: Date | undefined) => {
    setDate(newDate)
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
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP 'at' p")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t pt-3">
            <TimePicker
              date={date}
              setDate={handleTimeChange}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minTime?: string
  maxTime?: string
}

export function TimePicker({
  value,
  onChange,
  placeholder = "Select time",
  className,
  disabled = false,
  minTime,
  maxTime,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  // Ensure component is mounted before using any browser APIs
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Parse the time value (expects HH:MM format)
  const parseTime = (timeString: string) => {
    if (!timeString) return { hour: 12, minute: 0, period: 'PM' }
    
    const [hours, minutes] = timeString.split(':').map(Number)
    const period = hours >= 12 ? 'PM' : 'AM'
    const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    
    return { hour, minute: minutes || 0, period }
  }
  
  // Format time for display
  const formatTime = (hour: number, minute: number, period: string) => {
    const paddedHour = hour.toString().padStart(2, '0')
    const paddedMinute = minute.toString().padStart(2, '0')
    return `${paddedHour}:${paddedMinute} ${period}`
  }
  
  // Convert to 24-hour format for form submission
  const to24HourFormat = (hour: number, minute: number, period: string) => {
    let hours24 = hour
    if (period === 'PM' && hour !== 12) hours24 += 12
    if (period === 'AM' && hour === 12) hours24 = 0
    
    return `${hours24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }
  
  const currentTime = parseTime(value || '')
  
  const handleTimeChange = (type: 'hour' | 'minute' | 'period', newValue: string) => {
    const newTime = { ...currentTime }
    
    if (type === 'hour') {
      newTime.hour = parseInt(newValue)
    } else if (type === 'minute') {
      newTime.minute = parseInt(newValue)
    } else if (type === 'period') {
      newTime.period = newValue as 'AM' | 'PM'
    }
    
    const formatted24Hour = to24HourFormat(newTime.hour, newTime.minute, newTime.period)
    onChange?.(formatted24Hour)
  }
  
  const displayValue = value ? formatTime(currentTime.hour, currentTime.minute, currentTime.period) : ''
  
  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)
  
  // Generate minute options (0-59, in 15-minute increments for better UX)
  const minuteOptions = Array.from({ length: 4 }, (_, i) => i * 15)
  
  // Don't render until mounted to prevent SSR issues
  if (!isMounted) {
    return (
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          "text-muted-foreground",
          className
        )}
        disabled={true}
      >
        <Clock className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          aria-label={value ? `Selected time: ${displayValue}` : placeholder}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Hour
              </label>
              <Select
                value={currentTime.hour.toString()}
                onValueChange={(value) => handleTimeChange('hour', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Minute
              </label>
              <Select
                value={currentTime.minute.toString()}
                onValueChange={(value) => handleTimeChange('minute', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((minute) => (
                    <SelectItem key={minute} value={minute.toString()}>
                      {minute.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Period
              </label>
              <Select
                value={currentTime.period}
                onValueChange={(value) => handleTimeChange('period', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 
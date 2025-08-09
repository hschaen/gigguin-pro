"use client"

import * as React from "react"
import { format, isBefore, startOfDay } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  // Ensure component is mounted before using date-fns
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Parse the date value (expects YYYY-MM-DD format)
  const parseDate = (dateString: string): Date | undefined => {
    if (!dateString) return undefined
    // Parse date in local timezone to avoid timezone shifts
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day) // month is 0-indexed
  }
  
  // Format date for display
  const formatDate = (date: Date): string => {
    if (!isMounted) return ''
    return format(date, "MMM dd, yyyy")
  }
  
  // Convert to YYYY-MM-DD format for form submission
  const toFormFormat = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const selectedDate = parseDate(value || '')
  const effectiveMinDate = minDate || (isMounted ? startOfDay(new Date()) : new Date())
  
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = toFormFormat(date)
      onChange?.(formattedDate)
    }
    setOpen(false)
  }
  
  const displayValue = selectedDate ? formatDate(selectedDate) : ''
  
  // Generate calendar data
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    return selectedDate || new Date()
  })
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const firstDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }
  
  const days = getDaysInMonth(currentMonth)
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  const isDateDisabled = (date: Date) => {
    if (!isMounted) return false
    if (isBefore(date, effectiveMinDate)) return true
    if (maxDate && isBefore(maxDate, date)) return true
    return false
  }
  
  const isDateSelected = (date: Date) => {
    return selectedDate && 
           date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear()
  }
  
  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
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
        <CalendarIcon className="mr-2 h-4 w-4" />
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
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-7 w-7 p-0"
            >
              ←
            </Button>
            <div className="text-sm font-medium">
              {isMounted ? format(currentMonth, "MMMM yyyy") : `${currentMonth.getMonth() + 1}/${currentMonth.getFullYear()}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-7 w-7 p-0"
            >
              →
            </Button>
          </div>
          
          {/* Days of week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="h-8 w-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div
                key={index}
                className="h-8 w-8 flex items-center justify-center"
              >
                {day ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 text-xs",
                      isDateDisabled(day) && "text-muted-foreground opacity-50 cursor-not-allowed",
                      isDateSelected(day) && "bg-primary text-primary-foreground hover:bg-primary",
                      isToday(day) && !isDateSelected(day) && "bg-accent text-accent-foreground",
                      !isDateDisabled(day) && "hover:bg-accent"
                    )}
                    disabled={isDateDisabled(day)}
                    onClick={() => !isDateDisabled(day) && handleDateSelect(day)}
                  >
                    {day.getDate()}
                  </Button>
                ) : (
                  <div className="h-8 w-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 
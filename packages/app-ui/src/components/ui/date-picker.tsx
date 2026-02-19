import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function parseDate(input: string): Date | undefined {
  if (!input) return undefined

  // Check if input is in DD/MM/YYYY or DD-MM-YYYY format
  const slashOrHyphenFormat = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  const match = input.match(slashOrHyphenFormat)
  
  if (match) {
    const day = Number.parseInt(match[1]!, 10)
    const month = Number.parseInt(match[2]!, 10) - 1 // Months are 0-indexed
    const year = Number.parseInt(match[3]!, 10)
    // Use UTC to avoid timezone shifting
    const date = new Date(Date.UTC(year, month, day))
    
    // Validate the date is real (e.g., not 31/02/2024)
    if (
      date.getUTCDate() === day &&
      date.getUTCMonth() === month &&
      date.getUTCFullYear() === year
    ) {
      return date
    }
    return undefined
  }

  // Try parsing as text format (e.g., "December 13 2022" or "Dec 13 2022")
  const parsedDate = new Date(input)
  return isValidDate(parsedDate) ? parsedDate : undefined
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }
  return !Number.isNaN(date.getTime())
}

interface DatePickerInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
}

export function DatePickerInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Select date",
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [inputValue, setInputValue] = React.useState(formatDate(date))
  const [isEditing, setIsEditing] = React.useState(false)

  React.useEffect(() => {
    // Don't update while user is actively editing
    if (isEditing) return
    
    if (value) {
      // Handle ISO format (YYYY-MM-DD) from form - parse as UTC to avoid timezone shift
      const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (isoMatch) {
        const year = Number.parseInt(isoMatch[1]!, 10)
        const month = Number.parseInt(isoMatch[2]!, 10) - 1
        const day = Number.parseInt(isoMatch[3]!, 10)
        const parsedDate = new Date(Date.UTC(year, month, day))
        if (isValidDate(parsedDate)) {
          setDate(parsedDate)
          setMonth(parsedDate)
          setInputValue(formatDate(parsedDate))
        }
      }
    } else {
      setDate(undefined)
      setMonth(undefined)
      setInputValue("")
    }
  }, [value, isEditing])

  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        value={inputValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setIsEditing(true)}
        onChange={(e) => {
          const input = e.target.value
          setInputValue(input)
        }}
        onBlur={() => {
          setIsEditing(false)
          const parsedDate = parseDate(inputValue)
          if (parsedDate && isValidDate(parsedDate)) {
            setDate(parsedDate)
            setMonth(parsedDate)
            setInputValue(formatDate(parsedDate))
            // Format as YYYY-MM-DD using UTC to avoid timezone shift
            const year = parsedDate.getUTCFullYear()
            const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
            const day = String(parsedDate.getUTCDate()).padStart(2, '0')
            onChange(`${year}-${month}-${day}`)
          } else if (inputValue === "") {
            setDate(undefined)
            setMonth(undefined)
            onChange("")
          } else {
            // Invalid input: revert to last valid date or clear
            if (date) {
              setInputValue(formatDate(date))
            } else {
              setInputValue("")
              onChange("")
            }
          }
          onBlur?.()
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setOpen(true)
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <InputGroupButton
              variant="ghost"
              size="icon-xs"
              aria-label="Select date"
              disabled={disabled}
            >
              <CalendarIcon />
              <span className="sr-only">Select date</span>
            </InputGroupButton>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={(selectedDate) => {
                setDate(selectedDate)
                setInputValue(formatDate(selectedDate))
                if (selectedDate) {
                  // Format as YYYY-MM-DD using UTC to avoid timezone shift
                  const year = selectedDate.getUTCFullYear()
                  const month = String(selectedDate.getUTCMonth() + 1).padStart(2, '0')
                  const day = String(selectedDate.getUTCDate()).padStart(2, '0')
                  onChange(`${year}-${month}-${day}`)
                }
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}

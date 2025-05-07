"use client"

import type React from "react"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { Expense } from "@/components/kharcha-check"

interface ExpenseFormProps {
  onSubmit: (expense: Expense) => void
  onCancel: () => void
  initialData?: Expense | null
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Groceries",
  "Subscriptions",
  "Personal Care",
  "Gifts & Donations",
  "Other",
]

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

export function ExpenseForm({ onSubmit, onCancel, initialData }: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialData?.amount.toString() || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [date, setDate] = useState<Date>(initialData?.date ? new Date(initialData.date) : new Date())
  const [description, setDescription] = useState(initialData?.description || "")
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false)
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    initialData?.frequency || "monthly",
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (!category) {
      newErrors.category = "Please select a category"
    }

    if (!date) {
      newErrors.date = "Please select a date"
    }

    if (isRecurring && !frequency) {
      newErrors.frequency = "Please select a frequency"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const expense: Expense = {
      id: initialData?.id || uuidv4(),
      amount: Number(amount),
      category,
      date: date.toISOString(),
      description,
      isRecurring,
      frequency: isRecurring ? frequency : undefined,
      accountId: initialData?.accountId || "",
      lastProcessed: initialData?.lastProcessed,
    }

    onSubmit(expense)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-8"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter expense details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label htmlFor="recurring">Recurring Transaction</Label>
          </div>

          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => setFrequency(value)}
              >
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequency && <p className="text-sm text-destructive">{errors.frequency}</p>}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{initialData ? "Update" : "Add"} Expense</Button>
        </CardFooter>
      </form>
    </Card>
  )
}

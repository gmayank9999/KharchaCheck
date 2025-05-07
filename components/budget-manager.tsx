"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { PlusCircle, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import type { Budget, Expense } from "@/components/kharcha-check"

interface BudgetManagerProps {
  budgets: Budget[]
  expenses: Expense[]
  onAddBudget: (budget: Budget) => void
  onUpdateBudget: (budget: Budget) => void
  onDeleteBudget: (id: string) => void
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

export function BudgetManager({ budgets, expenses, onAddBudget, onUpdateBudget, onDeleteBudget }: BudgetManagerProps) {
  const [isAddingBudget, setIsAddingBudget] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Group expenses by category for the current month
  const currentMonthExpenses = expenses.filter((expense) => {
    const now = new Date()
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
  })

  const expensesByCategory = currentMonthExpenses.reduce((acc: Record<string, number>, expense) => {
    const { category, amount } = expense
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += amount
    return acc
  }, {})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!category) {
      newErrors.category = "Please select a category"
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    // Check if budget for this category already exists
    if (!editingBudget && budgets.some((b) => b.category === category && b.period === period)) {
      newErrors.category = `A ${period} budget for ${category} already exists`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const budget: Budget = {
      id: editingBudget?.id || uuidv4(),
      category,
      amount: Number(amount),
      period,
      accountId: editingBudget?.accountId || "",
    }

    if (editingBudget) {
      onUpdateBudget(budget)
    } else {
      onAddBudget(budget)
    }

    resetForm()
  }

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setCategory(budget.category)
    setAmount(budget.amount.toString())
    setPeriod(budget.period)
    setIsAddingBudget(true)
  }

  const resetForm = () => {
    setCategory("")
    setAmount("")
    setPeriod("monthly")
    setErrors({})
    setIsAddingBudget(false)
    setEditingBudget(null)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Budget Management</CardTitle>
              <CardDescription>Set and manage your spending limits</CardDescription>
            </div>
            <Button onClick={() => setIsAddingBudget(true)} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isAddingBudget ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="amount">Budget Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      className="pl-8"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Period</Label>
                  <Select value={period} onValueChange={(value: "monthly" | "yearly") => setPeriod(value)}>
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>{editingBudget ? "Update" : "Add"} Budget</Button>
              </div>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No budgets set. Add your first budget to start tracking your spending limits.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgets.map((budget) => {
                    const spent = expensesByCategory[budget.category] || 0
                    const percentage = Math.min(Math.round((spent / budget.amount) * 100), 100)

                    return (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.category}</TableCell>
                        <TableCell>{budget.period}</TableCell>
                        <TableCell>₹{budget.amount.toFixed(2)}</TableCell>
                        <TableCell>₹{spent.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={percentage}
                              className={`w-24 ${percentage >= 100 ? "bg-destructive/20" : ""}`}
                            />
                            <span className="text-xs">{percentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)} className="h-8 w-8">
                              <Edit2 className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteBudget(budget.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

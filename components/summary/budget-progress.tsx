"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import type { Expense, Budget } from "@/components/kharcha-check"

interface BudgetProgressProps {
  budgets: Budget[]
  expenses: Expense[]
}

export function BudgetProgress({ budgets, expenses }: BudgetProgressProps) {
  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc: Record<string, number>, expense) => {
      const { category, amount } = expense
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category] += amount
      return acc
    }, {})
  }, [expenses])

  // Only show monthly budgets
  const monthlyBudgets = budgets.filter((budget) => budget.period === "monthly")

  return (
    <div className="space-y-6">
      {monthlyBudgets.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          No monthly budgets set. Add budgets to track your spending.
        </div>
      ) : (
        monthlyBudgets.map((budget) => {
          const spent = expensesByCategory[budget.category] || 0
          const percentage = Math.min(Math.round((spent / budget.amount) * 100), 100)

          return (
            <div key={budget.id} className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">{budget.category}</span>
                <span className={percentage >= 100 ? "text-destructive font-medium" : ""}>
                  ₹{spent.toFixed(2)} / ₹{budget.amount.toFixed(2)}
                </span>
              </div>
              <Progress value={percentage} className={percentage >= 100 ? "bg-destructive/20" : ""} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentage}% used</span>
                <span>{percentage >= 100 ? "Over budget" : `${100 - percentage}% remaining`}</span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

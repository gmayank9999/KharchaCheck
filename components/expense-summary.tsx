"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Expense, Budget } from "@/components/kharcha-check"
import { CategoryChart } from "@/components/summary/category-chart"
import { MonthlyChart } from "@/components/summary/monthly-chart"
import { SummaryCards } from "@/components/summary/summary-cards"
import { BudgetProgress } from "@/components/summary/budget-progress"

interface ExpenseSummaryProps {
  expenses: Expense[]
  budgets?: Budget[]
}

export function ExpenseSummary({ expenses, budgets = [] }: ExpenseSummaryProps) {
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses])

  const averageAmount = useMemo(() => {
    return expenses.length > 0 ? totalAmount / expenses.length : 0
  }, [expenses, totalAmount])

  // Get expenses from the last 30 days
  const recentExpenses = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return expenses.filter((expense) => new Date(expense.date) >= thirtyDaysAgo)
  }, [expenses])

  const recentTotal = useMemo(() => {
    return recentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [recentExpenses])

  // Get current month's expenses for budget comparison
  const currentMonthExpenses = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
  }, [expenses])

  return (
    <div className="space-y-8">
      <SummaryCards
        totalAmount={totalAmount}
        averageAmount={averageAmount}
        recentTotal={recentTotal}
        expenseCount={expenses.length}
      />

      {budgets && budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Progress</CardTitle>
            <CardDescription>Track your spending against monthly budgets</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetProgress budgets={budgets} expenses={currentMonthExpenses} />
          </CardContent>
        </Card>
      )}

      {expenses.length > 0 ? (
        <Tabs defaultValue="category" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="category">By Category</TabsTrigger>
            <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
          </TabsList>
          <TabsContent value="category">
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Breakdown of your spending across different categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <CategoryChart expenses={expenses} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expenses</CardTitle>
                <CardDescription>Your spending pattern over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <MonthlyChart expenses={expenses} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              No expense data available. Add some expenses to see your summary.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

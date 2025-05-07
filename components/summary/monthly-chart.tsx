"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import type { Expense } from "@/components/expense-tracker"

interface MonthlyChartProps {
  expenses: Expense[]
}

export function MonthlyChart({ expenses }: MonthlyChartProps) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      return d
    }).reverse()

    const data = months.map((date) => {
      const month = date.toLocaleString('default', { month: 'short' })
      const year = date.getFullYear()
      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return (
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        )
      })
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      return {
        month: `${month} ${year}`,
        total,
      }
    })

    return data
  }, [expenses])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={monthlyData}>
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `₹${value.toLocaleString()}`} />
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]}
          cursor={{ fill: "transparent" }}
        />
        <Bar dataKey="total" fill="currentColor" className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}

"use client"

import { useMemo } from "react"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from "recharts"
import type { Expense } from "@/components/expense-tracker"

interface CategoryChartProps {
  expenses: Expense[]
}

export function CategoryChart({ expenses }: CategoryChartProps) {
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {}
    expenses.forEach((expense) => {
      if (!data[expense.category]) {
        data[expense.category] = 0
      }
      data[expense.category] += expense.amount
    })
    return Object.entries(data)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [expenses])

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={categoryData}>
        <XAxis dataKey="category" />
        <YAxis
          tickFormatter={(value) => `₹${value.toLocaleString()}`}
        />
        <Tooltip
          formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]}
          cursor={{ fill: "transparent" }}
        />
        <Bar dataKey="amount" fill="currentColor" className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
  )
}

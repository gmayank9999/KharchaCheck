"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { Expense } from "@/components/expense-tracker"

interface MonthlyChartProps {
  expenses: Expense[]
}

export function MonthlyChart({ expenses }: MonthlyChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get data for the last 6 months
  const monthlyData = (() => {
    const data: Record<string, number> = {}
    const today = new Date()

    // Initialize last 6 months with 0 values
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthYear = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`
      data[monthYear] = 0
    }

    // Fill in actual expense data
    expenses.forEach((expense) => {
      const date = new Date(expense.date)
      // Only include expenses from the last 6 months
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1)
      if (date >= sixMonthsAgo) {
        const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
        if (data[monthYear] !== undefined) {
          data[monthYear] += expense.amount
        }
      }
    })

    // Convert to array format for chart
    return Object.entries(data).map(([month, amount]) => ({
      month,
      amount,
    }))
  })()

  if (!mounted) {
    return <div className="flex items-center justify-center h-full">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={monthlyData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={(value) => `$${value}`} />
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]} />
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

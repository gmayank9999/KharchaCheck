"use client"

import { useEffect, useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import type { Expense } from "@/components/expense-tracker"

interface CategoryChartProps {
  expenses: Expense[]
}

// Chart colors
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A259FF",
  "#FF6B6B",
  "#54A0FF",
  "#1DD1A1",
  "#FECA57",
  "#FF9FF3",
]

export function CategoryChart({ expenses }: CategoryChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Group expenses by category and calculate totals
  const categoryData = expenses.reduce((acc: Record<string, number>, expense) => {
    const { category, amount } = expense
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += amount
    return acc
  }, {})

  // Convert to array format for chart
  const data = Object.entries(categoryData).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length],
  }))

  // Sort by value (highest first)
  data.sort((a, b) => b.value - a.value)

  if (!mounted) {
    return <div className="flex items-center justify-center h-full">Loading chart...</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

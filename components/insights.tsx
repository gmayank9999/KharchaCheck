"use client"

import { Expense } from "@/components/expense-tracker"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type InsightsProps = {
  expenses: Expense[]
}

export function Insights({ expenses }: InsightsProps) {
  // Calculate monthly spending
  const getMonthlySpending = () => {
    const monthlyData: { [key: string]: number } = {}
    expenses.forEach(expense => {
      const date = new Date(expense.date)
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + expense.amount
    })
    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      amount
    }))
  }

  // Calculate category-wise spending
  const getCategorySpending = () => {
    const categoryData: { [key: string]: number } = {}
    expenses.forEach(expense => {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount
    })
    return Object.entries(categoryData).map(([category, amount]) => ({
      category,
      amount
    }))
  }

  // Calculate month-over-month change
  const getMonthOverMonthChange = () => {
    const monthlyData = getMonthlySpending()
    if (monthlyData.length < 2) return 0
    const currentMonth = monthlyData[monthlyData.length - 1].amount
    const previousMonth = monthlyData[monthlyData.length - 2].amount
    return ((currentMonth - previousMonth) / previousMonth) * 100
  }

  const monthlyData = getMonthlySpending()
  const categoryData = getCategorySpending()
  const monthOverMonthChange = getMonthOverMonthChange()

  const totalAmount = monthlyData.reduce((sum, data) => sum + data.amount, 0)
  const topCategories = categoryData
    .map(category => ({
      name: category.category,
      amount: category.amount,
      percentage: (category.amount / totalAmount) * 100
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
          <CardDescription>
            Your spending is {monthOverMonthChange >= 0 ? 'up' : 'down'}{' '}
            {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%{' '}
            compared to last month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">Total spent this month</p>
        </CardContent>
      </Card>

      {topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Your highest spending categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.map(category => (
                <div key={category.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">₹{category.amount.toFixed(2)}</p>
                  </div>
                  <p className="text-sm">{category.percentage.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Month-over-Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthOverMonthChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(monthlyData.reduce((sum, data) => sum + data.amount, 0) / monthlyData.length || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category-wise Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
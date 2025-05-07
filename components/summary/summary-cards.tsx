"use client"

import { DollarSign, CreditCard, TrendingUp, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SummaryCardsProps {
  totalAmount: number
  averageAmount: number
  recentTotal: number
  expenseCount: number
}

export function SummaryCards({ totalAmount, averageAmount, recentTotal, expenseCount }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Lifetime total across {expenseCount} expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last 30 Days</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{recentTotal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Recent spending trend</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{averageAmount.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Average per transaction</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expenseCount}</div>
          <p className="text-xs text-muted-foreground">All recorded expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}

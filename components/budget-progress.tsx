"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Budget } from "./expense-tracker"

type BudgetProgressProps = {
  budget: Budget
  currentSpent: number
}

export function BudgetProgress({ budget, currentSpent }: BudgetProgressProps) {
  const percentageUsed = (currentSpent / budget.monthlyLimit) * 100
  const remaining = budget.monthlyLimit - currentSpent
  const isNearLimit = percentageUsed >= budget.alertThreshold

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Budget</span>
          <span className="text-sm font-normal">
            ₹{currentSpent.toLocaleString()} / ₹{budget.monthlyLimit.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Spent</span>
            <span className={isNearLimit ? "text-red-500" : ""}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress value={percentageUsed} className={isNearLimit ? "bg-red-100" : ""} />
        </div>

        <div className="flex items-center gap-2">
          {isNearLimit && <AlertCircle className="h-4 w-4 text-red-500" />}
          <p className={`text-sm ${isNearLimit ? "text-red-500" : "text-muted-foreground"}`}>
            ₹{remaining.toLocaleString()} remaining this month
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { Edit2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Expense } from "@/components/kharcha-check"

interface RecurringTransactionsProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

export function RecurringTransactions({ expenses, onEdit, onDelete }: RecurringTransactionsProps) {
  const getNextOccurrence = (expense: Expense) => {
    if (!expense.frequency) return null

    const baseDate = expense.lastProcessed ? new Date(expense.lastProcessed) : new Date(expense.date)

    const nextDate = new Date(baseDate)

    switch (expense.frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    return nextDate
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Transactions</CardTitle>
        <CardDescription>Manage your recurring expenses and income</CardDescription>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No recurring transactions. Add a recurring expense to automate your tracking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Occurrence</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const nextDate = getNextOccurrence(expense)

                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.description || expense.category}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>₹{expense.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.frequency}</Badge>
                      </TableCell>
                      <TableCell>{nextDate ? format(nextDate, "MMM d, yyyy") : "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(expense)} className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(expense.id)}
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
  )
}

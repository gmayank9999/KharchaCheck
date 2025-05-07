"use client"

import { useState } from "react"
import { Edit2, Trash2, Search, ArrowUpDown, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Expense } from "@/components/kharcha-check"

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (id: string) => void
}

type SortField = "date" | "amount" | "category"
type SortDirection = "asc" | "desc"

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedExpenses = [...expenses].sort((a, b) => {
    if (sortField === "date") {
      return sortDirection === "asc"
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    } else if (sortField === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
    } else {
      return sortDirection === "asc" ? a.category.localeCompare(b.category) : b.category.localeCompare(a.category)
    }
  })

  const filteredExpenses = sortedExpenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <CardTitle>Expenses</CardTitle>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No expenses recorded yet.
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">No expenses match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center"
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center"
                      onClick={() => handleSort("category")}
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">
                    <Button
                      variant="ghost"
                      className="p-0 font-medium flex items-center justify-end ml-auto"
                      onClick={() => handleSort("amount")}
                    >
                      Amount
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "MMM d, yyyy")}
                      {expense.isRecurring && (
                        <Badge variant="outline" className="ml-2">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          {expense.frequency}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{expense.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">₹{expense.amount.toFixed(2)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Upload, Settings } from "lucide-react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseSummary } from "@/components/expense-summary"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetSettings } from "./budget-settings"
import { ReceiptScanner } from "./receipt-scanner"
import { Insights } from "./insights"
import { BudgetProgress } from "./budget-progress"

export type Expense = {
  id: string
  amount: number // in rupees
  category: string
  date: string
  description: string
  isRecurring?: boolean
  frequency?: "daily" | "weekly" | "monthly" | "yearly"
  receiptUrl?: string // for storing receipt image URL
  receiptText?: string // for storing extracted text from receipt
}

export type Budget = {
  monthlyLimit: number // in rupees
  email: string
  alertThreshold: number // percentage (e.g., 80 for 80% of limit)
}

export default function KharchaCheck() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [showBudgetSettings, setShowBudgetSettings] = useState(false)
  const [showReceiptScanner, setShowReceiptScanner] = useState(false)
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)

  // Set mounted to true after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load expenses and budget from localStorage
  useEffect(() => {
    if (mounted) {
      const savedExpenses = localStorage.getItem("expenses")
      const savedBudget = localStorage.getItem("budget")
      if (savedExpenses) setExpenses(JSON.parse(savedExpenses))
      if (savedBudget) setBudget(JSON.parse(savedBudget))
    }
  }, [mounted])

  // Save expenses and budget to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("expenses", JSON.stringify(expenses))
      if (budget) localStorage.setItem("budget", JSON.stringify(budget))
    }
  }, [expenses, budget, mounted])

  // Calculate current month's total
  useEffect(() => {
    if (mounted) {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthTotal = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date)
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear
        })
        .reduce((sum, expense) => sum + expense.amount, 0)
      setCurrentMonthTotal(monthTotal)
    }
  }, [expenses, mounted])

  // Check budget limit and send alerts
  useEffect(() => {
    if (mounted && budget && currentMonthTotal > 0) {
      const percentageUsed = (currentMonthTotal / budget.monthlyLimit) * 100
      if (percentageUsed >= budget.alertThreshold) {
        // Here you would implement email sending logic
        sendBudgetAlert(budget.email, percentageUsed)
      }
    }
  }, [currentMonthTotal, budget, mounted])

  const handleAddExpense = (expense: Expense) => {
    setExpenses([...expenses, expense])
    setIsAddingExpense(false)
    setScannedData(null)
  }

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map((expense) => 
      expense.id === updatedExpense.id ? updatedExpense : expense
    ))
    setEditingExpense(null)
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
  }

  const handleReceiptScan = (data: any) => {
    setScannedData(data)
    setShowReceiptScanner(false)
    setIsAddingExpense(true)
  }

  const sendBudgetAlert = async (email: string, percentageUsed: number) => {
    try {
      // Here you would implement actual email sending
      // For now, we'll just log it
      console.log(`Sending alert to ${email}: ${percentageUsed}% of budget used`)
    } catch (error) {
      console.error("Error sending email alert:", error)
    }
  }

  if (!mounted) {
    return null // or a loading spinner
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KharchaCheck</h1>
          <p className="text-muted-foreground mt-1">Smart expense tracking and budgeting made easy</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBudgetSettings(true)} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Budget
          </Button>
          <Button onClick={() => setShowReceiptScanner(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Scan Receipt
          </Button>
          <Button onClick={() => setIsAddingExpense(true)} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {budget && (
        <div className="mb-8">
          <BudgetProgress budget={budget} currentSpent={currentMonthTotal} />
        </div>
      )}

      {(isAddingExpense || editingExpense) && (
        <div className="mb-8">
          <ExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={() => {
              setIsAddingExpense(false)
              setEditingExpense(null)
              setScannedData(null)
            }}
            initialData={editingExpense || scannedData}
          />
        </div>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="list">Transactions</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ExpenseList expenses={expenses} onEdit={setEditingExpense} onDelete={handleDeleteExpense} />
        </TabsContent>
        <TabsContent value="summary">
          <ExpenseSummary expenses={expenses} />
        </TabsContent>
        <TabsContent value="insights">
          <Insights expenses={expenses} />
        </TabsContent>
      </Tabs>

      {showBudgetSettings && (
        <BudgetSettings
          budget={budget}
          onSave={setBudget}
          onClose={() => setShowBudgetSettings(false)}
        />
      )}

      {showReceiptScanner && (
        <ReceiptScanner
          onScanComplete={handleReceiptScan}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}
    </div>
  )
}

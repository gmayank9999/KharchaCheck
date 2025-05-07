"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Upload, Bell, BarChart3, Wallet, RefreshCw } from "lucide-react"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseList } from "@/components/expense-list"
import { ExpenseSummary } from "@/components/expense-summary"
import { BudgetManager } from "@/components/budget-manager"
import { RecurringTransactions } from "@/components/recurring-transactions"
import { ReceiptScanner } from "@/components/receipt-scanner"
import { AccountSelector } from "@/components/account-selector"
import { NotificationCenter } from "@/components/notification-center"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

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
  accountId?: string  // Added missing property
  lastProcessed?: string  // Added missing property
}

export type Budget = {
  id: string
  category: string
  amount: number
  period: "monthly" | "yearly"
  accountId: string
}

export type Account = {
  id: string
  name: string
  type: "personal" | "business" | "savings" | "other"
  color: string
}

export type Notification = {
  id: string
  type: "info" | "warning" | "success" | "error"
  message: string
  date: string
  read: boolean
}

export default function KharchaCheck() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [activeAccount, setActiveAccount] = useState<string>("")
  const [isAddingExpense, setIsAddingExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const { toast } = useToast()

  // Initialize with default data
  useEffect(() => {
    // Load accounts first
    const savedAccounts = localStorage.getItem("kharchacheck_accounts")
    let accountsList: Account[] = []

    if (savedAccounts) {
      accountsList = JSON.parse(savedAccounts)
    } else {
      // Create default accounts
      accountsList = [
        { id: "personal", name: "Personal", type: "personal", color: "#0088FE" },
        { id: "business", name: "Business", type: "business", color: "#00C49F" },
      ]
      localStorage.setItem("kharchacheck_accounts", JSON.stringify(accountsList))
    }

    setAccounts(accountsList)
    setActiveAccount(accountsList.length > 0 ? accountsList[0].id : "")

    // Load expenses
    const savedExpenses = localStorage.getItem("kharchacheck_expenses")
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses))
    }

    // Load budgets
    const savedBudgets = localStorage.getItem("kharchacheck_budgets")
    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets))
    }

    // Load notifications
    const savedNotifications = localStorage.getItem("kharchacheck_notifications")
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications))
    }

    // Process recurring transactions
    processRecurringTransactions()
  }, [])

  // Save data to localStorage whenever they change
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem("kharchacheck_expenses", JSON.stringify(expenses))
    }
  }, [expenses])

  useEffect(() => {
    if (budgets.length > 0) {
      localStorage.setItem("kharchacheck_budgets", JSON.stringify(budgets))
    }
  }, [budgets])

  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem("kharchacheck_accounts", JSON.stringify(accounts))
    }
  }, [accounts])

  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("kharchacheck_notifications", JSON.stringify(notifications))
    }
  }, [notifications])

  // Check budget limits whenever expenses change
  useEffect(() => {
    checkBudgetLimits()
  }, [expenses, budgets, activeAccount])

  const handleAddExpense = (expense: Expense) => {
    const newExpense = { ...expense, accountId: activeAccount }
    setExpenses([...expenses, newExpense])
    setIsAddingExpense(false)
    toast({
      title: "Expense added",
      description: `₹${expense.amount.toFixed(2)} for ${expense.category}`,
    })
  }

  const handleUpdateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense)))
    setEditingExpense(null)
    toast({
      title: "Expense updated",
      description: `₹${updatedExpense.amount.toFixed(2)} for ${updatedExpense.category}`,
    })
  }

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id))
    toast({
      title: "Expense deleted",
      description: "The expense has been removed",
    })
  }

  const handleAddBudget = (budget: Budget) => {
    const newBudget = { ...budget, accountId: activeAccount }
    setBudgets([...budgets, newBudget])
    toast({
      title: "Budget created",
      description: `₹${budget.amount.toFixed(2)} for ${budget.category}`,
    })
  }

  const handleUpdateBudget = (updatedBudget: Budget) => {
    setBudgets(budgets.map((budget) => (budget.id === updatedBudget.id ? updatedBudget : budget)))
    toast({
      title: "Budget updated",
      description: `₹${updatedBudget.amount.toFixed(2)} for ${updatedBudget.category}`,
    })
  }

  const handleDeleteBudget = (id: string) => {
    setBudgets(budgets.filter((budget) => budget.id !== id))
    toast({
      title: "Budget deleted",
      description: "The budget has been removed",
    })
  }

  const handleAddAccount = (account: Account) => {
    setAccounts([...accounts, account])
    if (accounts.length === 0) {
      setActiveAccount(account.id)
    }
    toast({
      title: "Account added",
      description: `${account.name} account has been created`,
    })
  }

  const handleUpdateAccount = (updatedAccount: Account) => {
    setAccounts(accounts.map((account) => (account.id === updatedAccount.id ? updatedAccount : account)))
    toast({
      title: "Account updated",
      description: `${updatedAccount.name} account has been updated`,
    })
  }

  const handleDeleteAccount = (id: string) => {
    // Don't delete if it's the only account
    if (accounts.length <= 1) {
      toast({
        title: "Cannot delete account",
        description: "You must have at least one account",
        variant: "destructive",
      })
      return
    }

    // Delete the account
    const newAccounts = accounts.filter((account) => account.id !== id)
    setAccounts(newAccounts)

    // If the active account was deleted, set a new active account
    if (activeAccount === id) {
      setActiveAccount(newAccounts[0].id)
    }

    // Remove expenses and budgets for this account
    setExpenses(expenses.filter((expense) => expense.accountId !== id))
    setBudgets(budgets.filter((budget) => budget.accountId !== id))

    toast({
      title: "Account deleted",
      description: "The account and all its data have been removed",
    })
  }

  const handleSwitchAccount = (accountId: string) => {
    setActiveAccount(accountId)
  }

  const addNotification = (notification: Omit<Notification, "id" | "date" | "read">) => {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      read: false,
    }
    setNotifications([newNotification, ...notifications])
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const checkBudgetLimits = () => {
    // Get current month's expenses for the active account
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return (
        expense.accountId === activeAccount &&
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      )
    })

    // Group by category
    const expensesByCategory: Record<string, number> = {}
    monthlyExpenses.forEach((expense) => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0
      }
      expensesByCategory[expense.category] += expense.amount
    })

    // Check against budgets
    const accountBudgets = budgets.filter((budget) => budget.accountId === activeAccount && budget.period === "monthly")

    accountBudgets.forEach((budget) => {
      const spent = expensesByCategory[budget.category] || 0
      const percentUsed = (spent / budget.amount) * 100

      // Alert at 80% and 100%
      if (percentUsed >= 100) {
        // Check if we already have this notification
        const existingNotification = notifications.find(
          (n) => n.type === "error" && n.message.includes(`exceeded your ${budget.category} budget`),
        )

        if (!existingNotification) {
          addNotification({
            type: "error",
            message: `You've exceeded your ${budget.category} budget for this month! (₹${spent.toFixed(2)}/₹${budget.amount.toFixed(2)})`,
          })
        }
      } else if (percentUsed >= 80) {
        // Check if we already have this notification
        const existingNotification = notifications.find(
          (n) => n.type === "warning" && n.message.includes(`approaching your ${budget.category} budget`),
        )

        if (!existingNotification) {
          addNotification({
            type: "warning",
            message: `You're approaching your ${budget.category} budget for this month (${percentUsed.toFixed(0)}%)`,
          })
        }
      }
    })
  }

  const processRecurringTransactions = () => {
    const today = new Date()
    const updatedExpenses = [...expenses]
    let hasNewTransactions = false

    // Find recurring expenses that need processing
    expenses.forEach((expense) => {
      if (!expense.isRecurring || !expense.frequency) return

      const lastProcessed = expense.lastProcessed ? new Date(expense.lastProcessed) : new Date(expense.date)
      const nextDate = new Date(lastProcessed)

      // Calculate next date based on frequency
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

      // If next date is in the past or today, create a new transaction
      while (nextDate <= today) {
        // Create new transaction
        const newExpense: Expense = {
          ...expense,
          id: Math.random().toString(36).substring(2, 9),
          date: nextDate.toISOString(),
          isRecurring: false, // The new instance is not recurring
        }

        updatedExpenses.push(newExpense)
        hasNewTransactions = true

        // Update the original recurring expense's lastProcessed date
        const index = updatedExpenses.findIndex((e) => e.id === expense.id)
        if (index !== -1) {
          updatedExpenses[index] = {
            ...updatedExpenses[index],
            lastProcessed: nextDate.toISOString(),
          }
        }

        // Calculate next date for potential multiple occurrences
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
      }
    })

    if (hasNewTransactions) {
      setExpenses(updatedExpenses)
      addNotification({
        type: "info",
        message: "Recurring transactions have been processed",
      })
    }
  }

  const handleReceiptScan = (expenseData: Partial<Expense>) => {
    setEditingExpense({
      id: Math.random().toString(36).substring(2, 9),
      amount: expenseData.amount || 0,
      category: expenseData.category || "",
      date: expenseData.date || new Date().toISOString(),
      description: expenseData.description || "",
      accountId: activeAccount,
    })
    setIsScanning(false)
  }

  // Filter expenses and budgets for the active account
  const filteredExpenses = expenses.filter((expense) => expense.accountId === activeAccount)
  const filteredBudgets = budgets.filter((budget) => budget.accountId === activeAccount)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KharchaCheck</h1>
          <p className="text-muted-foreground mt-1">Smart expense tracking and budgeting made easy</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AccountSelector
            accounts={accounts}
            activeAccount={activeAccount}
            onSwitchAccount={handleSwitchAccount}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={markNotificationAsRead}
            onClearAll={clearNotifications}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <Button onClick={() => setIsAddingExpense(true)} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Expense
        </Button>
        <Button onClick={() => setIsScanning(true)} variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Scan Receipt
        </Button>
      </div>

      {isScanning && (
        <div className="mb-8">
          <ReceiptScanner onScanComplete={handleReceiptScan} onClose={() => setIsScanning(false)} />
        </div>
      )}

      {(isAddingExpense || editingExpense) && (
        <div className="mb-8">
          <ExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={() => {
              setIsAddingExpense(false)
              setEditingExpense(null)
            }}
            initialData={editingExpense}
          />
        </div>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Recurring
          </TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ExpenseList expenses={filteredExpenses} onEdit={setEditingExpense} onDelete={handleDeleteExpense} />
        </TabsContent>
        <TabsContent value="summary">
          <ExpenseSummary expenses={filteredExpenses} budgets={filteredBudgets || []} />
        </TabsContent>
        <TabsContent value="budget">
          <BudgetManager
            budgets={filteredBudgets}
            expenses={filteredExpenses}
            onAddBudget={handleAddBudget}
            onUpdateBudget={handleUpdateBudget}
            onDeleteBudget={handleDeleteBudget}
          />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringTransactions
            expenses={filteredExpenses.filter((e) => e.isRecurring)}
            onEdit={setEditingExpense}
            onDelete={handleDeleteExpense}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

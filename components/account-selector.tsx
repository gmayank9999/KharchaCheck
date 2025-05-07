"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Plus, Check, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Account } from "@/components/kharcha-check"

interface AccountSelectorProps {
  accounts: Account[]
  activeAccount: string
  onSwitchAccount: (accountId: string) => void
  onAddAccount: (account: Account) => void
  onUpdateAccount: (account: Account) => void
  onDeleteAccount: (id: string) => void
}

export function AccountSelector({
  accounts,
  activeAccount,
  onSwitchAccount,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}: AccountSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<"personal" | "business" | "savings" | "other">("personal")
  const [color, setColor] = useState("#0088FE")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeAccountData = accounts.find((account) => account.id === activeAccount)

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account)
      setName(account.name)
      setType(account.type)
      setColor(account.color)
    } else {
      setEditingAccount(null)
      setName("")
      setType("personal")
      setColor("#0088FE")
    }
    setErrors({})
    setIsDialogOpen(true)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Account name is required"
    }

    // Check for duplicate account names
    if (!editingAccount && accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
      newErrors.name = "An account with this name already exists"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const account: Account = {
      id: editingAccount?.id || uuidv4(),
      name,
      type,
      color,
    }

    if (editingAccount) {
      onUpdateAccount(account)
    } else {
      onAddAccount(account)
    }

    setIsDialogOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeAccountData?.color || "#0088FE" }} />
            <span>{activeAccountData?.name || "Select Account"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {accounts.map((account) => (
            <DropdownMenuItem
              key={account.id}
              onClick={() => onSwitchAccount(account.id)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
              <span>{account.name}</span>
              {account.id === activeAccount && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleOpenDialog()} className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </DropdownMenuItem>
          {activeAccount && (
            <>
              <DropdownMenuItem onClick={() => handleOpenDialog(activeAccountData)} className="cursor-pointer">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteAccount(activeAccount)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Personal, Business"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Account Type</Label>
              <Select
                value={type}
                onValueChange={(value: "personal" | "business" | "savings" | "other") => setType(value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Account Color</Label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: color }} />
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingAccount ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

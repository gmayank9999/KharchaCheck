"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Budget } from "./expense-tracker"

type BudgetSettingsProps = {
  budget: Budget | null
  onSave: (budget: Budget) => void
  onClose: () => void
}

export function BudgetSettings({ budget, onSave, onClose }: BudgetSettingsProps) {
  const [monthlyLimit, setMonthlyLimit] = useState(budget?.monthlyLimit || 10000)
  const [email, setEmail] = useState(budget?.email || "")
  const [alertThreshold, setAlertThreshold] = useState(budget?.alertThreshold || 80)

  const handleSave = () => {
    onSave({
      monthlyLimit,
      email,
      alertThreshold,
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Budget Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="limit">Monthly Budget Limit</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="limit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                min={0}
                className="pl-8"
              />
            </div>
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="email">Email for Alerts</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div> */}
          <div className="space-y-2">
            <Label>Alert Threshold ({alertThreshold}%)</Label>
            <Slider
              value={[alertThreshold]}
              onValueChange={([value]) => setAlertThreshold(value)}
              min={50}
              max={100}
              step={5}
            />
            <p className="text-sm text-muted-foreground">
              Alerts when you reach {alertThreshold}% of your budget
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
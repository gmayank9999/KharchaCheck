"use client"

import { useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Budget } from "./expense-tracker"
import { sendEmail } from "@/lib/email-service"
import { useToast } from "@/hooks/use-toast"

type BudgetProgressProps = {
  budget: Budget & {
    lastAlertSent?: string;
    email?: string;
  };
  currentSpent: number;
  onAlertSent?: () => void;
}

export function BudgetProgress({ budget, currentSpent, onAlertSent }: BudgetProgressProps) {
  const { toast } = useToast();

  // Calculate percentage with overflow handling
  const percentageUsed = Math.min((currentSpent / budget.monthlyLimit) * 100, 100);
  const actualPercentage = (currentSpent / budget.monthlyLimit) * 100;
  const remaining = budget.monthlyLimit - currentSpent;
  const isOverBudget = currentSpent > budget.monthlyLimit;
  const isNearThreshold = percentageUsed >= (budget.alertThreshold || 80);
  const showWarning = isOverBudget || isNearThreshold;

  // Handle email alerts
  useEffect(() => {
    const handleBudgetAlert = async () => {
      if (!budget.email || !showWarning || budget.lastAlertSent) return;

      const message = isOverBudget
        ? `Your expenses have exceeded your budget limit for this month. Please review your spending and take necessary actions.`
        : `You have reached ${budget.alertThreshold || 80}% of your monthly budget. Consider reviewing your spending habits.`;

      try {
        const emailResult = await sendEmail({
          to_email: budget.email,
          subject: isOverBudget ? 'Budget Limit Exceeded!' : 'Budget Alert: Threshold Reached',
          message,
          currentSpent,
          budgetLimit: budget.monthlyLimit,
          remaining,
          isOverBudget
        });

        if (emailResult.success) {
          onAlertSent?.();
          toast({
            title: "Alert Sent",
            description: `Budget alert email sent to ${budget.email}`,
          });
        } else {
          throw new Error('Failed to send email');
        }
      } catch (error) {
        console.error('Error sending budget alert:', error);
        toast({
          title: "Error",
          description: "Failed to send budget alert email. Please check your settings.",
          variant: "destructive",
        });
      }
    };

    handleBudgetAlert();
  }, [showWarning, budget, currentSpent, onAlertSent, toast, remaining, isOverBudget]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Monthly Budget</span>
          <span className={`text-sm font-normal ${showWarning ? "text-red-500" : ""}`}>
            ₹{currentSpent.toLocaleString()} / ₹{budget.monthlyLimit.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Spent</span>
            <span className={`font-medium ${showWarning ? "text-red-500" : ""}`}>
              {actualPercentage.toFixed(1)}%
              {isOverBudget && " (Over budget)"}
              {!isOverBudget && isNearThreshold && ` (Crossed ${budget.alertThreshold || 80}% threshold)`}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={percentageUsed} 
              className={`h-2.5 rounded-full transition-all duration-300 ${showWarning ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isOverBudget || isNearThreshold) && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <p className={`text-sm ${showWarning ? "text-red-500" : ""}`}>
            {isOverBudget 
              ? `₹${Math.abs(remaining).toLocaleString()} over budget`
              : `₹${remaining.toLocaleString()} remaining this month`
            }
          </p>
        </div>

        {budget.email && showWarning && !budget.lastAlertSent && (
          <p className="text-sm text-muted-foreground">
            Alert will be sent to {budget.email}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

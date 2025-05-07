import type { Metadata } from "next"
import KharchaCheck from "@/components/expense-tracker"

export const metadata: Metadata = {
  title: "KharchaCheck",
  description: "Smart expense tracking and budgeting made easy",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <KharchaCheck />
    </div>
  )
}

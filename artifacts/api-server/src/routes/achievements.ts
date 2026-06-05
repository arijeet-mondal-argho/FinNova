import { Router, type IRouter } from "express";
import { like, desc } from "drizzle-orm";
import { db, expensesTable, allowanceTable, goalsTable } from "@workspace/db";

const router: IRouter = Router();

interface AchievementDef {
  id: number;
  slug: string;
  title: string;
  description: string;
  icon: string;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 1, slug: "first_allowance", title: "Budget Setter", description: "Set your first monthly allowance", icon: "🎯" },
  { id: 2, slug: "first_expense", title: "Tracker Begins", description: "Log your first expense", icon: "📊" },
  { id: 3, slug: "first_goal", title: "Dream Builder", description: "Create your first savings goal", icon: "🌟" },
  { id: 4, slug: "five_expenses", title: "Habit Forming", description: "Log 5 expenses in one month", icon: "🔥" },
  { id: 5, slug: "twenty_expenses", title: "Data Nerd", description: "Log 20 expenses in one month", icon: "📈" },
  { id: 6, slug: "savings_goal_complete", title: "Goal Crusher", description: "Complete a savings goal", icon: "🏆" },
  { id: 7, slug: "three_months_budget", title: "Consistency King", description: "Set a budget for 3 consecutive months", icon: "👑" },
  { id: 8, slug: "under_budget", title: "Disciplined Spender", description: "Stay under budget in any category for a full month", icon: "💪" },
  { id: 9, slug: "savings_30_percent", title: "Future Millionaire", description: "Save 30% or more of your allowance in one month", icon: "💎" },
  { id: 10, slug: "ceo_mindset", title: "CEO in Training", description: "Read 5 CEO mindset lessons", icon: "🚀" },
];

router.get("/achievements", async (_req, res): Promise<void> => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Gather data for unlock checks
  const allExpenses = await db.select().from(expensesTable);
  const allAllowances = await db.select().from(allowanceTable);
  const allGoals = await db.select().from(goalsTable);

  const currentMonthExpenses = allExpenses.filter(e => e.date.startsWith(currentMonth));

  const unlockedSlugs = new Set<string>();

  // first_allowance
  if (allAllowances.length > 0) unlockedSlugs.add("first_allowance");

  // first_expense
  if (allExpenses.length > 0) unlockedSlugs.add("first_expense");

  // first_goal
  if (allGoals.length > 0) unlockedSlugs.add("first_goal");

  // five_expenses (in current month)
  if (currentMonthExpenses.length >= 5) unlockedSlugs.add("five_expenses");

  // twenty_expenses (in current month)
  if (currentMonthExpenses.length >= 20) unlockedSlugs.add("twenty_expenses");

  // savings_goal_complete
  if (allGoals.some(g => g.completed)) unlockedSlugs.add("savings_goal_complete");

  // three_months_budget
  if (allAllowances.length >= 3) unlockedSlugs.add("three_months_budget");

  // under_budget — any category in current month
  const currentAllowance = allAllowances.find(a => a.month === currentMonth);
  if (currentAllowance) {
    const cats = ["food", "transport", "savings", "study", "personal"] as const;
    const budgetMap: Record<string, number> = {
      food: Number(currentAllowance.foodBudget),
      transport: Number(currentAllowance.transportBudget),
      savings: Number(currentAllowance.savingsBudget),
      study: Number(currentAllowance.studyBudget),
      personal: Number(currentAllowance.personalBudget),
    };
    for (const cat of cats) {
      const spent = currentMonthExpenses
        .filter(e => e.category === cat)
        .reduce((s, e) => s + Number(e.amount), 0);
      if (budgetMap[cat] > 0 && spent < budgetMap[cat]) {
        unlockedSlugs.add("under_budget");
        break;
      }
    }

    // savings_30_percent
    const totalSpent = currentMonthExpenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalAllowance = Number(currentAllowance.totalAmount);
    const actualSavings = totalAllowance - totalSpent;
    if (totalAllowance > 0 && (actualSavings / totalAllowance) >= 0.30) {
      unlockedSlugs.add("savings_30_percent");
    }
  }

  const result = ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: unlockedSlugs.has(def.slug),
    unlockedAt: unlockedSlugs.has(def.slug) ? new Date().toISOString() : null,
  }));

  res.json(result);
});

export default router;

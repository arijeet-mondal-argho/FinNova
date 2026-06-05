import { Router, type IRouter } from "express";
import { and, gte, lt, eq } from "drizzle-orm";
import { db, allowanceTable, expensesTable } from "@workspace/db";

const router: IRouter = Router();

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthToDateRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  return { start, end: nextMonth };
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food",
  transport: "Transport",
  savings: "Savings",
  study: "Study",
  personal: "Personal",
};

// Dashboard summary for current month
router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const month = getCurrentMonth();
  const { start, end } = monthToDateRange(month);

  const [allowance] = await db
    .select()
    .from(allowanceTable)
    .where(eq(allowanceTable.month, month));

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(and(gte(expensesTable.date, start), lt(expensesTable.date, end)));

  const totalAllowance = allowance ? Number(allowance.totalAmount) : 0;
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const savingsBudget = allowance ? Number(allowance.savingsBudget) : 0;

  const totalRemaining = Math.max(0, totalAllowance - totalSpent);
  const savingsRate = totalAllowance > 0 ? ((savingsBudget / totalAllowance) * 100) : 0;
  const budgetUtilization = totalAllowance > 0 ? ((totalSpent / totalAllowance) * 100) : 0;

  res.json({
    month,
    totalAllowance,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRemaining: Math.round(totalRemaining * 100) / 100,
    savingsRate: Math.round(savingsRate * 10) / 10,
    totalSaved: savingsBudget,
    expenseCount: expenses.length,
    budgetUtilization: Math.round(budgetUtilization * 10) / 10,
  });
});

// Category breakdown for current month
router.get("/dashboard/category-breakdown", async (req, res): Promise<void> => {
  const month = getCurrentMonth();
  const { start, end } = monthToDateRange(month);

  const [allowance] = await db
    .select()
    .from(allowanceTable)
    .where(eq(allowanceTable.month, month));

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(and(gte(expensesTable.date, start), lt(expensesTable.date, end)));

  const categories = ["food", "transport", "savings", "study", "personal"];
  const budgets: Record<string, number> = allowance
    ? {
        food: Number(allowance.foodBudget),
        transport: Number(allowance.transportBudget),
        savings: Number(allowance.savingsBudget),
        study: Number(allowance.studyBudget),
        personal: Number(allowance.personalBudget),
      }
    : {};

  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount);
  }

  const breakdown = categories.map(cat => {
    const budget = budgets[cat] || 0;
    const spent = spentByCategory[cat] || 0;
    const remaining = Math.max(0, budget - spent);
    const percentage = budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0;
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      spent: Math.round(spent * 100) / 100,
      budget,
      remaining: Math.round(remaining * 100) / 100,
      percentage,
    };
  });

  res.json(breakdown);
});

// Monthly trend for last 6 months
router.get("/dashboard/monthly-trend", async (req, res): Promise<void> => {
  const now = new Date();
  const months: string[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  // Fetch all data in one shot — filter in JS
  const allowances = await db.select().from(allowanceTable);
  const allExpenses = await db.select().from(expensesTable);

  const trend = months.map(month => {
    const { start, end } = monthToDateRange(month);
    const allowance = allowances.find(a => a.month === month);
    const monthExpenses = allExpenses.filter(e => e.date >= start && e.date < end);
    const totalSpent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalAllowance = allowance ? Number(allowance.totalAmount) : 0;
    const savingsBudget = allowance ? Number(allowance.savingsBudget) : 0;
    const savingsRate = totalAllowance > 0 ? Math.round((savingsBudget / totalAllowance) * 1000) / 10 : 0;

    return {
      month,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalAllowance,
      savingsRate,
    };
  });

  res.json(trend);
});

export default router;

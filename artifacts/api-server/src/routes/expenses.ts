import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { db, expensesTable } from "@workspace/db";
import {
  CreateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
  ListExpensesQueryParams,
  ListExpensesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function monthToDateRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const start = `${month}-01`;
  const nextMonth = mon === 12 ? `${year + 1}-01-01` : `${year}-${String(mon + 1).padStart(2, "0")}-01`;
  return { start, end: nextMonth };
}

// List expenses with optional filters
router.get("/expenses", async (req, res): Promise<void> => {
  const queryParsed = ListExpensesQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }

  const { month, category } = queryParsed.data;
  const conditions = [];

  if (month) {
    const { start, end } = monthToDateRange(month);
    conditions.push(gte(expensesTable.date, start));
    conditions.push(lt(expensesTable.date, end));
  }
  if (category) {
    conditions.push(eq(expensesTable.category, category));
  }

  const expenses = await db
    .select()
    .from(expensesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(expensesTable.date), desc(expensesTable.createdAt));

  res.json(ListExpensesResponse.parse(
    expenses.map(e => ({
      ...e,
      amount: Number(e.amount),
      createdAt: e.createdAt.toISOString(),
    }))
  ));
});

// Create expense
router.post("/expenses", async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [expense] = await db
    .insert(expensesTable)
    .values({
      amount: String(parsed.data.amount),
      category: parsed.data.category,
      description: parsed.data.description,
      date: parsed.data.date,
    })
    .returning();

  res.status(201).json({
    ...expense,
    amount: Number(expense.amount),
    createdAt: expense.createdAt.toISOString(),
  });
});

// Update expense
router.patch("/expenses/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateExpenseParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, string> = {};
  if (parsed.data.amount !== undefined) updates.amount = String(parsed.data.amount);
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.date !== undefined) updates.date = parsed.data.date;

  const [expense] = await db
    .update(expensesTable)
    .set(updates)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.json({
    ...expense,
    amount: Number(expense.amount),
    createdAt: expense.createdAt.toISOString(),
  });
});

// Delete expense
router.delete("/expenses/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteExpenseParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [expense] = await db
    .delete(expensesTable)
    .where(eq(expensesTable.id, params.data.id))
    .returning();

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, allowanceTable } from "@workspace/db";
import {
  SetAllowanceBody,
  GetCurrentAllowanceResponse,
  GetAllowanceHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Get current month allowance
router.get("/allowance/current", async (req, res): Promise<void> => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [allowance] = await db
    .select()
    .from(allowanceTable)
    .where(eq(allowanceTable.month, month));

  if (!allowance) {
    res.status(404).json({ error: "No allowance set for current month" });
    return;
  }

  res.json(GetCurrentAllowanceResponse.parse({
    ...allowance,
    totalAmount: Number(allowance.totalAmount),
    foodBudget: Number(allowance.foodBudget),
    transportBudget: Number(allowance.transportBudget),
    savingsBudget: Number(allowance.savingsBudget),
    studyBudget: Number(allowance.studyBudget),
    personalBudget: Number(allowance.personalBudget),
    createdAt: allowance.createdAt.toISOString(),
  }));
});

// Set monthly allowance (upsert)
router.post("/allowance", async (req, res): Promise<void> => {
  const parsed = SetAllowanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const existing = await db
    .select()
    .from(allowanceTable)
    .where(eq(allowanceTable.month, data.month));

  let allowance;
  if (existing.length > 0) {
    [allowance] = await db
      .update(allowanceTable)
      .set({
        totalAmount: String(data.totalAmount),
        foodBudget: String(data.foodBudget),
        transportBudget: String(data.transportBudget),
        savingsBudget: String(data.savingsBudget),
        studyBudget: String(data.studyBudget),
        personalBudget: String(data.personalBudget),
      })
      .where(eq(allowanceTable.month, data.month))
      .returning();
  } else {
    [allowance] = await db
      .insert(allowanceTable)
      .values({
        month: data.month,
        totalAmount: String(data.totalAmount),
        foodBudget: String(data.foodBudget),
        transportBudget: String(data.transportBudget),
        savingsBudget: String(data.savingsBudget),
        studyBudget: String(data.studyBudget),
        personalBudget: String(data.personalBudget),
      })
      .returning();
  }

  res.status(201).json({
    ...allowance,
    totalAmount: Number(allowance.totalAmount),
    foodBudget: Number(allowance.foodBudget),
    transportBudget: Number(allowance.transportBudget),
    savingsBudget: Number(allowance.savingsBudget),
    studyBudget: Number(allowance.studyBudget),
    personalBudget: Number(allowance.personalBudget),
    createdAt: allowance.createdAt.toISOString(),
  });
});

// Get allowance history
router.get("/allowance", async (req, res): Promise<void> => {
  const history = await db
    .select()
    .from(allowanceTable)
    .orderBy(desc(allowanceTable.month));

  res.json(GetAllowanceHistoryResponse.parse(
    history.map(a => ({
      ...a,
      totalAmount: Number(a.totalAmount),
      foodBudget: Number(a.foodBudget),
      transportBudget: Number(a.transportBudget),
      savingsBudget: Number(a.savingsBudget),
      studyBudget: Number(a.studyBudget),
      personalBudget: Number(a.personalBudget),
      createdAt: a.createdAt.toISOString(),
    }))
  ));
});

export default router;

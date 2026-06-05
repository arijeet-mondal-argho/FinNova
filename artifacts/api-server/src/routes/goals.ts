import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, goalsTable } from "@workspace/db";
import {
  CreateGoalBody,
  UpdateGoalParams,
  UpdateGoalBody,
  DeleteGoalParams,
  ListGoalsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeGoal(g: typeof goalsTable.$inferSelect) {
  return {
    ...g,
    targetAmount: Number(g.targetAmount),
    savedAmount: Number(g.savedAmount),
    deadline: g.deadline ?? null,
    createdAt: g.createdAt.toISOString(),
  };
}

// List goals
router.get("/goals", async (req, res): Promise<void> => {
  const goals = await db
    .select()
    .from(goalsTable)
    .orderBy(desc(goalsTable.createdAt));

  res.json(ListGoalsResponse.parse(goals.map(serializeGoal)));
});

// Create goal
router.post("/goals", async (req, res): Promise<void> => {
  const parsed = CreateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [goal] = await db
    .insert(goalsTable)
    .values({
      title: parsed.data.title,
      targetAmount: String(parsed.data.targetAmount),
      savedAmount: parsed.data.savedAmount !== undefined ? String(parsed.data.savedAmount) : "0",
      deadline: parsed.data.deadline ?? undefined,
    })
    .returning();

  res.status(201).json(serializeGoal(goal));
});

// Update goal
router.patch("/goals/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateGoalParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateGoalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.targetAmount !== undefined) updates.targetAmount = String(parsed.data.targetAmount);
  if (parsed.data.savedAmount !== undefined) updates.savedAmount = String(parsed.data.savedAmount);
  if (parsed.data.deadline !== undefined) updates.deadline = parsed.data.deadline;
  if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed;

  const [goal] = await db
    .update(goalsTable)
    .set(updates)
    .where(eq(goalsTable.id, params.data.id))
    .returning();

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.json(serializeGoal(goal));
});

// Delete goal
router.delete("/goals/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteGoalParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [goal] = await db
    .delete(goalsTable)
    .where(eq(goalsTable.id, params.data.id))
    .returning();

  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const allowanceTable = pgTable("allowance", {
  id: serial("id").primaryKey(),
  month: text("month").notNull().unique(), // YYYY-MM
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  foodBudget: numeric("food_budget", { precision: 10, scale: 2 }).notNull(),
  transportBudget: numeric("transport_budget", { precision: 10, scale: 2 }).notNull(),
  savingsBudget: numeric("savings_budget", { precision: 10, scale: 2 }).notNull(),
  studyBudget: numeric("study_budget", { precision: 10, scale: 2 }).notNull(),
  personalBudget: numeric("personal_budget", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAllowanceSchema = createInsertSchema(allowanceTable).omit({ id: true, createdAt: true });
export type InsertAllowance = z.infer<typeof insertAllowanceSchema>;
export type Allowance = typeof allowanceTable.$inferSelect;

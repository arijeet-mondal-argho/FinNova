import { Router, type IRouter } from "express";
import healthRouter from "./health";
import allowanceRouter from "./allowance";
import expensesRouter from "./expenses";
import goalsRouter from "./goals";
import dashboardRouter from "./dashboard";
import lessonsRouter from "./lessons";
import achievementsRouter from "./achievements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(allowanceRouter);
router.use(expensesRouter);
router.use(goalsRouter);
router.use(dashboardRouter);
router.use(lessonsRouter);
router.use(achievementsRouter);

export default router;

import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import reviewsRouter from "./reviews";
import visitorsRouter from "./visitors";
import contactRouter from "./contact";
import adminRouter from "./admin";
import paymentSettingsRouter from "./payment-settings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(paymentSettingsRouter);
router.use(reviewsRouter);
router.use(visitorsRouter);
router.use(contactRouter);
router.use(adminRouter);

export default router;

import express, { Router } from "express";
import controller from "../controllers/feedback";
const router = express.Router();

router.get("/feedback", controller.getFeedback);
router.get("/feedback/:id", controller.getFeedbackById);

export = router;

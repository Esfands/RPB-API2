import express, { Router } from "express";
import controller from "../controllers/subathon";
const router = express.Router();

router.get("/subathon/chatters", controller.getSubathonMessageStats);
router.get("/subathon/giftedsubs", controller.getSubathonGiftedSubsStats);
router.get("/subathon/bitsdonated", controller.getSubathonDonatedBitsStats);
router.get("/subathon/countdown", controller.getSubathonStartDate);
router.get("/subathon/wheelspin", controller.getWheelSpinStats);
router.get("/subathon/:username", controller.getUserSubathonStats)

export = router;

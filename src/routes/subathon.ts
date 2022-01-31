import express, { Router } from "express";
import controller from "../controllers/subathon";
const router = express.Router();

router.get("/subathon/chatters", controller.getSubathonMessageStats);
router.get("/subathon/giftedsubs", controller.getSubathonGiftedSubsStats);
router.get("/subathon/bitsdonated", controller.getSubathonDonatedBitsStats);

export = router;

import express, { Router } from "express";
import controller from "../controllers/retfuel";
const router = express.Router();

router.get("/leaderboards", controller.getRankings);

export = router;

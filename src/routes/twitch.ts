import express, { Router } from "express";
import controller from "../controllers/twitch";
const router = express.Router();

router.get("/twitch/auth", controller.getTwitchToken);
router.get("/twitch/callback", controller.twitchTokenCallback);
router.get("/twitch/completed", controller.twitchTokenDone);

export = router;

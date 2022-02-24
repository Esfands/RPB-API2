import express, { Router } from "express";
import controller from "../controllers/twitch";
const router = express.Router();

router.get("/twitch/auth", controller.getTwitchToken);
router.get("/twitch/callback", controller.twitchTokenCallback);
router.get("/twitch/completed", controller.twitchTokenDone);
router.get("/twitch/id", controller.getTwitchId);
router.get("/twitch/emotes", controller.getTwitchChannelEmotes);
router.get("/twitch/esfandemotes", controller.getEsfandsChannelEmotes);

export = router;

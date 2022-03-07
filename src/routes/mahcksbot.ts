import express from "express";
import controller from "../controllers/mahcksbot";
const router = express.Router();

router.get("/mb/commands", controller.getMBCommands);
router.get("/mb/channels", controller.getMBChannelSettings);

export = router;

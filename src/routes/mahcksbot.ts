import express from "express";
import controller from "../controllers/mahcksbot";
const router = express.Router();

router.get("/mb/commands", controller.getMBCommands);
router.get("/mb/commands/:name", controller.getMBCommand);
router.get("/mb/channels", controller.getMBChannelSettings);
router.get("/mb/channels/:channel", controller.getMBOneChannelSettings);
router.get("/mb/feedback", controller.getAllMBFeedback);
router.get("/mb/feedback/:id", controller.getOneMBFeedback);

export = router;

import express, { Router } from "express";
import controller from "../controllers/emotes";
const router = express.Router();

router.get("/emotes/:channel", controller.getEmotes);

export = router;

import express, { Router } from 'express';
import controller from '../controllers/commands';
const router = express.Router();

router.get('/commands', controller.getCommands);
router.get("/commands/:name", controller.getCommand);

router.get("/otf", controller.getOTFCommands);
router.get("/otf/:name", controller.getOTFCommand);

export = router;
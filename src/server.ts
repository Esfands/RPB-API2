// Server setup
import * as dotenv from "dotenv";
dotenv.config();
import http from "http";
import express, { application, Express, Request, Router } from "express";
import morgan from "morgan";
import routes from "./routes/commands";
import retfuelRoutes from "./routes/retfuel";
import feedbackRoutes from "./routes/feedback";
import emoteRoutes from "./routes/emotes";
import subathonRoutes from "./routes/subathon";
import * as crypto from "crypto";
import mongoose from "mongoose";

// MariaDB setup
import mariadb from "mariadb";
import { updateOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";
export const pool = mariadb.createPool({
  host: process.env.MARIA_HOST,
  user: process.env.MARIA_USER,
  password: process.env.MARIA_PASSWORD,
  database: process.env.MARIA_DATABASE,
});

const URI: any = process.env.MONGO_URI;
mongoose.connect(URI).then(() => {
  const router: Express = express();

  // Notification request headers
  const TWITCH_MESSAGE_ID = "Twitch-Eventsub-Message-Id".toLowerCase();
  const TWITCH_MESSAGE_TIMESTAMP =
    "Twitch-Eventsub-Message-Timestamp".toLowerCase();
  const TWITCH_MESSAGE_SIGNATURE =
    "Twitch-Eventsub-Message-Signature".toLowerCase();
  const MESSAGE_TYPE = "Twitch-Eventsub-Message-Type".toLowerCase();

  // Notification message types
  const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification";
  const MESSAGE_TYPE_NOTIFICATION = "notification";
  const MESSAGE_TYPE_REVOCATION = "revocation";

  const HMAC_PREFIX = "sha256=";

  /* Logging */
  router.use(morgan("dev"));

  /* Parsing requests */
  router.use(express.urlencoded({ extended: false }));

  /* Rules for API */
  router.use((req, res, next) => {
    // CORS policy
    res.header("Access-Control-Allow-Origin", "*");
    // Set CORS headers
    res.header(
      "Access-Control-Allow-Headers",
      "origin, X-Requested-With,Content-Type,Accept, Authorization"
    );
    // Set CORS method headers
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
      return res.status(200).json({});
    }
    next();
  });

  router.use(
    express.raw({
      type: "application/json",
    })
  );

  /* Routes */
  router.use("/", routes);
  router.use("/", retfuelRoutes);
  router.use("/", feedbackRoutes);
  router.use("/", emoteRoutes);
  router.use("/", subathonRoutes);

  /* Event Sub */
  router.post("/eventsub", (req, res) => {
    let secret = getSecret();
    let message = getHmacMessage(req);
    let hmac = HMAC_PREFIX + getHmac(secret, message);

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
      console.log("Signatures match");

      let notification = JSON.parse(req.body);

      if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
        // TODO: Do something with the data
        console.log(`Event type: ${notification.subscription.type}`);

        if (notification.subscription.type === "stream.online") {
          // Stream just went online
          StreamStat.findOneAndUpdate(
            { type: "esfandtv" },
            { status: "live" }
          ).then((res) => console.log("EsfandTV just went live..."));
        } else if (notification.subscription.type === "stream.offline") {
          StreamStat.findOneAndUpdate(
            { type: "esfandtv" },
            { status: "offline", hosting: "", wentOfflineAt: new Date() }
          ).then((res) => console.log("EsfandTV just went offline..."));
        } else if (notification.subscription.type === "channel.update") {
          StreamStat.findOneAndUpdate(
            { type: "esfandtv" },
            {
              title: notification.event.title,
              category: notification.event.category_name,
              changedGameAt: new Date()
            }
          ).then((res) => console.log("EsfandTV has updated stream..."));
        }

        res.sendStatus(204);
      } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
        res.status(200).send(notification.challenge);
      } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
        console.log("test 3");
        res.sendStatus(204);

        console.log(`${notification.subscription.type} notifications revoked!`);
        console.log(`reason: ${notification.subscription.status}`);
        console.log(
          `condition: ${JSON.stringify(
            notification.subscription.condition,
            null,
            4
          )}`
        );
      } else {
        res.sendStatus(204);
        console.log(`Unknown message type: ${req.headers[MESSAGE_TYPE]}`);
      }
    } else {
      console.log("403"); // Signatures didn't match
      res.sendStatus(403);
    }
  });

  function getSecret() {
    // when you subscribed to the event.
    return process.env.EVENTSUB_SECRET;
  }

  // Build the message used to get the HMAC.
  function getHmacMessage(request: any) {
    return (
      request.headers[TWITCH_MESSAGE_ID] +
      request.headers[TWITCH_MESSAGE_TIMESTAMP] +
      request.body
    );
  }

  // Get the HMAC.
  function getHmac(secret: any, message: any) {
    return crypto.createHmac("sha256", secret).update(message).digest("hex");
  }

  // Verify whether your signature matches Twitch's signature.
  function verifyMessage(hmac: any, verifySignature: any) {
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(verifySignature)
    );
  }

  /* Error Handling */
  router.use((req, res, next) => {
    const error = new Error("Not found!");
    return res.status(404).json({
      message: error.message,
    });
  });

  /* Server */
  const httpServer = http.createServer(router);
  const PORT: any = process.env.PORT ?? 4500;
  httpServer.listen(PORT, () =>
    console.log(`The server is running on port ${PORT}`)
  );
});

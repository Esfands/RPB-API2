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
import twitchRoutes from "./routes/twitch";
import * as crypto from "crypto";
import mongoose from "mongoose";
import * as WebSocket from 'ws';

// MariaDB setup
import mariadb from "mariadb";
import { insertRow, updateOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";
import { Events, EventType, sendWSPayload, Status } from "./socket";
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

  /* Server */
  const httpServer = http.createServer(router);
  let server = httpServer;

/*   const wss = new WebSocket.Server({ server });
  let wsClients = [] as any;
  wss.on('connection', (ws: WebSocket) => {
    wsClients.push(ws);
    console.log("added");
  }); */


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
  router.use("/", twitchRoutes);

  /* Event Sub */
  router.post("/eventsub", async (req, res) => {
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

        } else if (notification.subscription.type === "channel.prediction.begin") {
          let info = notification.event;
          let values = [info["id"], info["broadcaster_user_login"], "open", info["title"], JSON.stringify(info["outcomes"]), new Date(info["started_at"]), new Date(info["locks_at"])];
          await insertRow(`INSERT INTO predictions (ID, Broadcaster, Status, Title, OutComes, StartedAt, LocksAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, values);


          /* sendWSPayload(wsClients, EventType.PREDICTION, Events.PREDICTION_BEGIN, Status.OPEN, info["id"], info["title"], info["outcomes"], { started: info["started_at"], ends: info["locks_at"] }); */

        } else if (notification.subscription.type === "channel.prediction.lock") {
          let info = notification.event;
          let values = ['locked', JSON.stringify(info["outcomes"]), new Date(info["locked_at"]), info["id"]];
          await updateOne(`UPDATE predictions SET Status=?, Outcomes=?, LocksAt=? WHERE ID=?;`, values);

/*           sendWSPayload(wsClients, EventType.PREDICTION, Events.PREDICTION_LOCK, Status.LOCKED, info["id"], info["title"], info["outcomes"], { started: info["started_at"], ends: info["locked_at"] }); */

        } else if (notification.subscription.type === "channel.prediction.end") {
          let info = notification.event;
          let values = ['closed', JSON.stringify(info["outcomes"]), new Date(info["ended_at"]), info["id"]];
          await updateOne(`UPDATE predictions SET Status=?, Outcomes=?, LocksAt=? WHERE ID=?`, values);

/*           sendWSPayload(wsClients, EventType.PREDICTION, Events.PREDICTION_END, Status.CLOSED, info["id"], info["title"], info["outcomes"], { started: info["started_at"], ends: info["locked_at"] }); */

        } else if (notification.subscription.type === "channel.poll.begin") {
          let info = notification.event;
          let values = [info["id"], info["broadcaster_user_login"], "open", info["title"], JSON.stringify(info["choices"]), JSON.stringify(info["bits_voting"]), JSON.stringify(info["channel_points_voting"]), new Date(info["started_at"]), new Date(info["ends_at"])];
          await insertRow(`INSERT INTO polls (ID, Broadcaster, Active, Title, Choices, BitsVoting, ChannelPointsVoting, StartedAt, EndsAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`, values)
          
          let payload: object = { choices: info["choices"], bits: info["bits_voting"], points: info["channel_points_voting"] };
/*           sendWSPayload(wsClients, EventType.POLL, Events.POLL_BEGIN, Status.OPEN, info["id"], info["title"], payload, { started: info["started_at"], ends: info["ends_at"] }); */

        } else if (notification.subscription.type === "channel.poll.end") {
          let info = notification.event;
          await updateOne(`UPDATE polls SET Active=?, Choices=?, EndsAt=? WHERE ID=?;`, ['closed', JSON.stringify(info["choices"]), new Date(info["ended_at"]), info["id"]]);
          console.log(info);

          let payload: object = { choices: info["choices"], bits: info["bits_voting"], points: info["channel_points_voting"] };
          /* sendWSPayload(wsClients, EventType.POLL, Events.POLL_END, Status.CLOSED, info["id"], info["title"], payload, { started: info["started_at"], ends: info["ends_at"] }); */
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


  const PORT: any = process.env.PORT ?? 4500;
  httpServer.listen(PORT, () =>
    console.log(`The server is running on port ${PORT}`)
  );
});

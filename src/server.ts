// Server setup
import * as dotenv from "dotenv";
dotenv.config();
import http from "https";
import express, { application, Express, Request, Router } from "express";
import morgan from "morgan";
import routes from "./routes/commands";
import retfuelRoutes from "./routes/retfuel";
import feedbackRoutes from "./routes/feedback";
import emoteRoutes from "./routes/emotes";
import subathonRoutes from "./routes/subathon";
import twitchRoutes from "./routes/twitch";
import mahcksbotRoutes from "./routes/mahcksbot";
import * as crypto from "crypto";
import mongoose from "mongoose";
import * as WebSocket from "ws";
import websocketServer from "./wsServer";

// MariaDB setup
import mariadb from "mariadb";
import { insertRow, updateOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";
import { getGameLayout, getLayoutOffset, EventType, Events, sendWSPredPollOverlayPayload, sendWSChannelPointRewardPayload } from "./socket";
export const pool = mariadb.createPool({
  host: process.env.MARIA_HOST,
  user: process.env.MARIA_USER,
  password: process.env.MARIA_PASSWORD,
  database: process.env.MARIA_DATABASE,
});

export const mbPool = mariadb.createPool({
  host: process.env.MARIA_HOST,
  user: process.env.MARIA_USER,
  password: process.env.MARIA_PASSWORD,
  database: 'mahcksbot',
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
  const httpsServer = http.createServer(router).listen(5000);
  let wsClients: any[] = [];

  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

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
  router.use('/', mahcksbotRoutes);

  /* Event Sub */
  router.post("/eventsub", async (req, res) => {
    let secret = getSecret();
    let message = getHmacMessage(req);
    let hmac = HMAC_PREFIX + getHmac(secret, message);

    if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
      console.log("Signatures match");

      let notification = JSON.parse(req.body);

      if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
        console.log(`Event type: ${notification.subscription.type}`);

        if (notification.subscription.type === "stream.online") {
          // Stream just went online
          StreamStat.findOneAndUpdate(
            { type: "esfandtv" },
            { status: "live" }
          ).then((res) => console.log("EsfandTV just went live..."));

          await insertRow(pool, `INSERT INTO hoursstreamed (Started) VALUES (?)`, [
            new Date(),
          ]);
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
              changedGameAt: new Date(),
            }
          ).then((res) => console.log("EsfandTV has updated stream..."));
        } else if (notification.subscription.type === "channel.prediction.begin") {
          let info = notification.event;
          let values = [
            info.id,
            info["broadcaster_user_login"],
            "open",
            info.title,
            JSON.stringify(info.outcomes),
            new Date(info.started_at),
            new Date(info.locks_at),
          ];
          await insertRow(pool, `INSERT INTO predictions (ID, Broadcaster, Status, Title, OutComes, StartedAt, LocksAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, values);
          //console.log(info);
          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          console.log(
            EventType.PREDICTION,
            Events.PREDICTION_BEGIN,
            notificationLayout,
            info.outcomes,
          );

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.PREDICTION,
            Events.PREDICTION_BEGIN,
            notificationLayout,
            offset,
            info,
          );
        } else if (notification.subscription.type === "channel.prediction.progress") {
          let info = notification.event;
          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.PREDICTION,
            Events.PREDICTION_PROGRESS,
            notificationLayout,
            offset,
            info,
          );

        } else if (
          notification.subscription.type === "channel.prediction.lock"
        ) {
          let info = notification.event;
          let values = [
            "locked",
            JSON.stringify(info.outcomes),
            new Date(info["locked_at"]),
            info.id,
          ];
          await updateOne(
            pool,
            `UPDATE predictions SET Status=?, Outcomes=?, LocksAt=? WHERE ID=?;`,
            values
          );
          console.log(info);
          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.PREDICTION,
            Events.PREDICTION_LOCK,
            notificationLayout,
            offset,
            info,
          );
        } else if (
          notification.subscription.type === "channel.prediction.end"
        ) {
          let info = notification.event;
          let values = [
            "closed",
            JSON.stringify(info.outcomes),
            new Date(info.ended_at),
            info.id,
          ];
          await updateOne(
            pool,
            `UPDATE predictions SET Status=?, Outcomes=?, LocksAt=? WHERE ID=?`,
            values
          );
          console.log(info);
          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.PREDICTION,
            Events.PREDICTION_END,
            notificationLayout,
            offset,
            info,
          );
        } else if (notification.subscription.type === "channel.poll.begin") {
          let info = notification.event;
          let values = [
            info.id,
            info.broadcaster_user_login,
            "open",
            info.title,
            JSON.stringify(info.choices),
            JSON.stringify(info.bits_voting),
            JSON.stringify(info.channel_points_voting),
            new Date(info.started_at),
            new Date(info.ends_at),
          ];
          await insertRow(
            pool,
            `INSERT INTO polls (ID, Broadcaster, Active, Title, Choices, BitsVoting, ChannelPointsVoting, StartedAt, EndsAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            values
          );

          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.POLL,
            Events.POLL_BEGIN,
            notificationLayout,
            offset,
            info,
          );

        } else if (notification.subscription.type === "channel.poll.progress") {
          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.POLL,
            Events.POLL_PROGRESS,
            notificationLayout,
            offset,
            notification.event,
          );

        } else if (notification.subscription.type === "channel.poll.end") {
          let info = notification.event;
          await updateOne(
            pool,
            `UPDATE polls SET Active=?, Choices=?, EndsAt=? WHERE ID=?;`,
            [
              "closed",
              JSON.stringify(info.choices),
              new Date(info.ended_at),
              info.id,
            ]
          );

          let notificationLayout = await getGameLayout();
          let offset = await getLayoutOffset();

          sendWSPredPollOverlayPayload(
            wsClients,
            EventType.POLL,
            Events.POLL_END,
            notificationLayout,
            offset,
            info,
          );
        } else if (notification.subscription.type === "channel.channel_points_custom_reward_redemption.add") {
          let info = notification.event;

          if (info.status === "unfulfilled") {
            sendWSChannelPointRewardPayload(wsClients, info.reward.title, info.user_input);
          }

        } else if (notification.subscription.type === "channel.channel_points_custom_reward_redemption.update") {
          let info = notification.event;

          console.log('channel.channel_points_custom_reward_redemption.update')
          if (info.status === "unfulfilled") {
            sendWSChannelPointRewardPayload(wsClients, info.reward.title, info.user_input);
          }
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
  let expressServer = router.listen(PORT, () =>
    console.log(`The server is running on port ${PORT}`)
  );

  websocketServer(expressServer, wsClients);

  ['SIGINT', 'SIGTERM', 'SIGQUIT']
    .forEach(signal => process.on(signal, () => {
      if (wsClients.length === 0) return console.log("No clients to safely close.");
      wsClients.forEach((client: WebSocket) => {
        client.close(1012, "Server is restarting");
      });
      process.exit();
    }));
});

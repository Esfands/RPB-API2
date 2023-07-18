import { WebSocketServer } from "ws";
import { findOne, findQuery } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";
import { pool } from "./server";

export enum EventType {
  PREDICTION = "prediction",
  POLL = "poll",
  CHANNEL_POINT = "channel_point_reward_redemption"
}

export enum Events {
  PREDICTION_BEGIN = "channel.prediction.begin",
  PREDICTION_PROGRESS = "channel.prediction.progress",
  PREDICTION_LOCK = "channel.prediction.lock",
  PREDICTION_END = "channel.prediction.end",
  POLL_BEGIN = "channel.poll.begin",
  POLL_PROGRESS = "channel.poll.progress",
  POLL_END = "channel.poll.end",
  CHANNEL_POINT_UPDATE = "channel.channel_points_custom_reward_redemption.update",
  CHANNEL_POINT_ADD = "channel.channel_points_custom_reward_redemption.add"
}

export enum Status {
  OPEN = "open",
  LOCKED = "locked",
  CLOSED = "closed",
}

interface PayloadObject {
  eventType: EventType;
  event: Events;
  status: Status;
  format: Layout;
  offset: "top" | "middle" | number;
  id: string;
  title: string;
  payload: object;
  dates: object;
}

export enum Layout {
  REGULAR = "regular",
  COMPACT = "compact",
}

export interface WSMessage {
  mc: MessageCode; // Message Code
  d: PayloadObject | string; // Payload Data
}

export enum MessageCode {
  "DISPATCH" = 0,
  "CLOSE" = 1,
  "EOF" = 2
}

export function sendWSPredPollOverlayPayload(
  Clients: object[],
  eventType: EventType,
  event: Events,
  status: Status,
  format: Layout,
  offset: "top" | "middle" | number,
  id: string,
  title: string,
  payload: object,
  dates: object
) {
  let PayloadToSend: PayloadObject = {
    eventType: eventType,
    event: event,
    status: status,
    format: format,
    offset: offset,
    id: id,
    title: title,
    payload: payload,
    dates: dates,
  };

  let message: WSMessage = {
    d: PayloadToSend,
    mc: MessageCode.DISPATCH,
  }

  if (Clients.length === 0) return console.log("No clients to send payload to.");
  Clients.forEach((client: any) => {
    client.send(JSON.stringify(message));
  });
}

export async function sendWSChannelPointRewardPayload(Clients: object[], rewardTitle: string, prompt: string) {
  let testEmotes = ["2TONNING", "-30k", "AlienDance", "Aware"];
  prompt = testEmotes[Math.floor(Math.random() * testEmotes.length)];

  if (rewardTitle.toLowerCase() === "test reward from cli") {

    // Prio: sub, BTTV, FFZ, 7tv
    let conn;
    try {
      conn = await pool.getConnection();
      let rows = await conn.query("SELECT URL, Service FROM emotes WHERE Name=?;", [prompt]);

      let url: string | null = null;
      rows.forEach((data: any) => {
        if (url === null) if (data.hasOwnProperty("Service") && data.Service === "twitch") return url = data.URL;
        if (url === null) if (data.hasOwnProperty("Service") && data.Service === "bttv") return url = data.URL;
        if (url === null) if (data.hasOwnProperty("Service") && data.Service === "ffz") return url = data.URL;
        if (url === null) if (data.hasOwnProperty("Service") && data.Service === "7tv") return url = data.URL;
      });

      if (Clients.length === 0) return console.log("No clients to send payload to.");
      Clients.forEach((client: any) => {
        client.send(JSON.stringify({url: url}));
      });

    } catch (err) {
      if (Clients.length === 0) return console.log("No clients to send payload to.");
      Clients.forEach((client: any) => {
        client.send(JSON.stringify({ url: null }));
      });
    } finally {
      if (conn) return conn.end();
    }
  }
}

// Get current game category
export async function getGameLayout() {
  let gQuery = await StreamStat.findOne({ type: "esfandtv" });
  let query = await findOne(pool, `alertsettings`, `Game='${gQuery!.category}'`);
  return query ? query.Format : Layout.REGULAR;
}

// Get the offset for the given category
export async function getLayoutOffset() {
  let query = await findQuery(pool, "SELECT * FROM settings WHERE Title='esfandevents_offset' LIMIT 1;", []);
  let data = JSON.parse(query[0].Data);
  return data.offset;
}
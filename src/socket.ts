import { WebSocketServer } from "ws";
import { findOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";

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
  id: string;
  title: string;
  payload: object;
  dates: object;
}

export enum Layout {
  REGULAR = "regular",
  COMPACT = "compact",
}

export function sendWSPredPollOverlayPayload(
  Clients: object[],
  eventType: EventType,
  event: Events,
  status: Status,
  format: Layout,
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
    id: id,
    title: title,
    payload: payload,
    dates: dates,
  };

  if (Clients.length === 0) return console.log("No clients to send payload to.");
  Clients.forEach((client: any) => {
    client.send(JSON.stringify(PayloadToSend));
  });
}

export function sendWSChannelPointRewardPayload(Clients: object[], rewardTitle: string, prompt: string) {
  if (rewardTitle.toLowerCase() === "test reward from cli") {

    let payloadToSend = {
      title: rewardTitle,
    }

    if (Clients.length === 0) return console.log("No clients to send payload to.");
    Clients.forEach((client: any) => {
      client.send(JSON.stringify(payloadToSend));
    });
  }
}

// Get current game category
export async function getGameLayout() {
  let gQuery = await StreamStat.findOne({ type: "esfandtv" });
  let query = await findOne(`alertsettings`, `Game='${gQuery!.category}'`);
  return query ? query.Format : Layout.REGULAR;
}
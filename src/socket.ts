import { WebSocketServer } from "ws";
import { findOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";

export enum EventType {
  PREDICTION = "prediction",
  POLL = "poll",
}

export enum Events {
  PREDICTION_BEGIN = "channel.prediction.begin",
  PREDICTION_PROGRESS = "channel.prediction.progress",
  PREDICTION_LOCK = "channel.prediction.lock",
  PREDICTION_END = "channel.prediction.end",
  POLL_BEGIN = "channel.poll.begin",
  POLL_PROGRESS = "channel.poll.progress",
  POLL_END = "channel.poll.end",
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

export function sendWSPayload(
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

  // TODO: If clients is empty, return and don't send the payload.
  if (Clients.length === 0) return console.log("No clients to send payload to.");
  Clients.forEach((client: any) => {
    client.send(JSON.stringify(PayloadToSend));
  });
}

// Get current game category
export async function getGameLayout() {
  let gQuery = await StreamStat.findOne({ type: "esfandtv" });
  let query = await findOne(`alertsettings`, `Game='${gQuery!.category}'`);
  return Layout.REGULAR;
}

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
  // query ? query.Format : Layout.REGULAR
  return Layout.REGULAR;
}

export async function mergePayloads(cachedPayloads: any[]) {
  cachedPayloads.forEach((payload: any) => {
    for (let [key, value] of Object.entries(payload)) {
      console.log()
    }
  });  
  //return deepmerge.all(cachedPayloads, options);

}

let count = 0;
let predictionDict = new Map();
let pollDict = new Map();
export async function addToMap(type:string , payload: any) {
  let map = (type === "poll") ? pollDict : predictionDict;

  count++;
  map.set(count, payload);
  console.log("New " + type + " that's " + count);
  return map;
}

export function lastItemInMap(type: string) {
  let map = (type === "poll") ? pollDict : predictionDict;
  return Array.from(map.values()).pop();
}

export function emptyMap(type: string) {
  let map = (type === "poll") ? pollDict : predictionDict;
  map.clear();
  count = 0;
  console.log("Cleared map for " + type);
}
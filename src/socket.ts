import { findOne } from "./maria";
import { StreamStat } from "./schemas/ChannelStats";

export enum EventType {
  PREDICTION = "prediction",
  POLL = "poll"
}

export enum Events {
  PREDICTION_BEGIN = "channel.prediction.begin",
  PREDICTION_PROGRESS = "channel.prediction.progress",
  PREDICTION_LOCK = "channel.prediction.lock",
  PREDICTION_END = "channel.prediction.end",
  POLL_BEGIN = "channel.poll.begin",
  POLL_PROGRESS = "channel.poll.progress",
  POLL_END = "channel.poll.end"
}

export enum Status {
  OPEN = "open",
  LOCKED = "locked",
  CLOSED = "closed"
}

interface PayloadObject {
  EventType: EventType;
  Event: Events;
  Status: Status;
  Format: Layout;
  ID: string;
  Title: string;
  Payload: object;
  Dates: object;
}

export enum Layout {
  REGULAR = "regular",
  COMPACT = "compact"
}

export function sendWSPayload(Clients: object[], EventType: EventType, Event: Events, Status: Status, Format: Layout, ID: string, Title: string, Payload: object, Dates: object) {
  
  let PayloadToSend: PayloadObject = {
    EventType: EventType,
    Event: Event,
    Status: Status,
    Format: Format,
    ID: ID,
    Title: Title,
    Payload: Payload,
    Dates: Dates
  }

  let clients = [...Clients.keys()];
  clients.forEach((client: any) => {
    client.send(JSON.stringify(PayloadToSend));
  });
}

// Get current game category
export async function getGameLayout() {
  let gQuery = await StreamStat.findOne({ type: "esfandtv" });
  let query = await findOne(`alertsettings`, `Game='${gQuery!["category"]}'`);
  return (query) ? query["Format"] : Layout.REGULAR;
}
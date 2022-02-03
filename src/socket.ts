/* 

  EventType: String 
          "prediction" || "poll"
  
  Event: String
         "channel.prediction.begin" 
         "channel.prediction.lock"
         "channel.prediction.end"
         "channel.poll.begin"
         "channel.poll.end"
  
  Status: String
          Open(prediction/poll)
          Locked(prediction)
          Closed(prediction/poll)
  
  ID: Prediction/Poll
  
  Title:   String
           Prediction/Poll
  
  Payload: Object
           Predictions(Outcomes)
           Choices
  
  Dates: Object
         Predictions(StartedAt, LockedAt)
         Polls (StartedAt, LockedAt) 
*/

export enum EventType {
  PREDICTION = "prediction",
  POLL = "poll"
}

export enum Events {
  PREDICTION_BEGIN = "channel.prediction.begin",
  PREDICTION_LOCK = "channel.prediction.lock",
  PREDICTION_END = "channel.prediction.end",
  POLL_BEGIN = "channel.poll.begin",
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
  ID: string;
  Title: string;
  Payload: object;
  Dates: object;
}

export function sendWSPayload(Clients: any[], EventType: EventType, Event: Events, Status: Status, ID: string, Title: string, Payload: object, Dates: object) {
  
  let PayloadToSend: PayloadObject = {
    EventType: EventType,
    Event: Event,
    Status: Status,
    ID: ID,
    Title: Title,
    Payload: Payload,
    Dates: Dates
  }

  Clients.forEach((user: WebSocket) => {
    user.send(JSON.stringify(PayloadToSend))
  });
}

import { model, Schema, Model, Document } from "mongoose";

export interface IStreamStats extends Document {
  type: string;
  status: string;
  title: string;
  category: string;
  hosting: string;
  changedGamesAt: Date | string;
  wentOfflineAt: Date | string;
}

let StreamStatsSchema = new Schema({
  type: String,
  status: String,
  title: String,
  category: String,
  hosting: String,
  changedGamesAt: String,
  wentOfflineAt: String,
});

export const StreamStat: Model<IStreamStats> = model(
  `streamstats`,
  StreamStatsSchema
);

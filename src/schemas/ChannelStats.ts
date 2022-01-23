import { model, Schema, Model, Document } from 'mongoose';

export interface IStreamStats extends Document {
  type: string;
  status: string;
  title: string;
  category: string;
  hosting: string;
}

let StreamStatsSchema = new Schema({
  type: String,
  status: String,
  title: String,
  category: String,
  hosting: String
})

export const StreamStat: Model<IStreamStats | null> = model(`streamstats`, StreamStatsSchema);

import { Request, Response, NextFunction } from "express";
import { findQuery } from "../maria";

export interface IEmote {
  Channel: string;
  Name: string;
  ID: string;
  Tier: string;
  EmoteType: string;
  URL: string;
}

const getEmotes = async (req: Request, res: Response, next: NextFunction) => {
  let channel: string = req.params.channel;
  console.log(channel);
  let result = await findQuery("SELECT * FROM subemotes WHERE Channel=?;", [
    channel,
  ]);
  let emoteData: any[] = [];
  result.forEach((emote: IEmote) => {
    emoteData.push({
      Channel: emote["Channel"],
      Name: emote["Name"],
      ID: emote["ID"],
      Tier: emote["Tier"],
      EmoteType: emote["EmoteType"],
      URL: emote["URL"],
    });
  });
  return res.status(200).json({
    data: emoteData,
  });
};

export default { getEmotes };

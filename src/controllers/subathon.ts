import { Request, Response, NextFunction } from "express";
import { checkForKey, findQuery } from "../maria";

export interface SubathonChatter extends Document {
  ID: number;
  Username: string;
  MessageCount: number;
  GiftedSubs: number;
  BitsDonated: number;
}

/* /subathon/chatters */
const getSubathonMessageStats = async (req: Request, res: Response, next: NextFunction) => {
  let offset = req.query.offset;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    `SELECT * FROM subathonstats ORDER BY MessageCount DESC LIMIT ${limit} OFFSET ${offset};`,
    []
  );
  let chatterData: any[] = [];
  result.forEach((user: SubathonChatter) => {
    chatterData.push({
      ID: user["ID"],
      Username: user["Username"],
      MessageCount: user["MessageCount"],
    });
  });

  return res.status(200).json({
    data: chatterData,
  });
};

/* /subathon/giftedsubs */
const getSubathonGiftedSubsStats = async (req: Request, res: Response, next: NextFunction) => {
  let offset = req.query.offset;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    `SELECT * FROM subathonstats ORDER BY GiftedSubs DESC LIMIT ${limit} OFFSET ${offset};`,
    []
  );
  let chatterData: any[] = [];
  result.forEach((user: SubathonChatter) => {
    chatterData.push({
      ID: user["ID"],
      Username: user["Username"],
      GiftedSubs: user["GiftedSubs"],
    });
  });

  return res.status(200).json({
    data: chatterData,
  });
};

/* /subathon/bitsdonated */
const getSubathonDonatedBitsStats = async (req: Request, res: Response, next: NextFunction) => {
  let offset = req.query.offset;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    `SELECT * FROM subathonstats ORDER BY BitsDonated DESC LIMIT ${limit} OFFSET ${offset};`,
    []
  );
  let chatterData: any[] = [];
  result.forEach((user: SubathonChatter) => {
    chatterData.push({
      ID: user["ID"],
      Username: user["Username"],
      BitsDonated: user["BitsDonated"],
    });
  });

  return res.status(200).json({
    data: chatterData,
  });
};


export default { getSubathonMessageStats, getSubathonGiftedSubsStats, getSubathonDonatedBitsStats };

import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { checkForKey, findQuery } from "../maria";
import { pool } from "../server";

export interface SubathonChatter extends Document {
  ID: number;
  Username: string;
  MessageCount: number;
  GiftedSubs: number;
  BitsDonated: number;
}

/* /subathon/chatters */
const getSubathonMessageStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let offset = req.query.offset ? req.query.offset : 1;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    pool,
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
const getSubathonGiftedSubsStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let offset = req.query.offset;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    pool,
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
const getSubathonDonatedBitsStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let offset = req.query.offset;
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let result = await findQuery(
    pool,
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

const getSubathonStartDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let year = new Date().getFullYear();
  let difference = +new Date(`02/17/${year}`) - +new Date();

  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }

  return res.status(200).json({
    data: timeLeft,
  });
};

const getWheelSpinStats = async (req: Request, res: Response, next: NextFunction) => {
  let query = await findQuery(pool, `SELECT * FROM wheelspin`, []);

  return res.status(200).json({
    data: {
      amount_needed: query[0].AmountNeeded,
      gifted: query[0].Gifted,
      wheelspins: query[0].WheelSpins,
      completed: query[0].Completed,
      is_power_hour: query[0].IsPowerHour,
      is_collective: query[0].IsCollective
    }
  });
}

const getUserSubathonStats = async (req: Request, res: Response, next: NextFunction) => {
  let username: string = req.params.username;
  let query = await findQuery(pool, 'SELECT * FROM subathonstats WHERE Username=?', [username]);

  if (!query[0]) return res.status(200).json({
    id: null,
    avatar: null,
    username: null,
    messageCount: null,
    messageRank: null,
    giftedSubs: null,
    subRank: null,
    bitsDonated: null,
    bitsRank: null,
  })

  let data = query[0];

  const [messageRank, subRank, bitsRank] = await Promise.all([
    findQuery(pool, `SELECT t.ID, (SELECT COUNT(*) FROM subathonstats AS X WHERE t.MessageCount <= X.MessageCount) AS POSITION, t.Username, t.MessageCount FROM subathonstats AS t WHERE t.Username = ?;`, [username]),
    findQuery(pool, `SELECT t.ID, (SELECT COUNT(*) FROM subathonstats AS X WHERE t.GiftedSubs <= X.GiftedSubs) AS POSITION, t.Username, t.GiftedSubs FROM subathonstats AS t WHERE t.Username = ?;`, [username]),
    findQuery(pool, `SELECT t.ID, (SELECT COUNT(*) FROM subathonstats AS X WHERE t.BitsDonated <= X.BitsDonated) AS POSITION, t.Username, t.BitsDonated FROM subathonstats AS t WHERE t.Username = ?;`, [username])
  ]);

  let pfp = '';
  if (data.Avatar === null) {
    let cid = process.env.YBD_ID as string;
    let token = process.env.YBD_TOKEN as string;

    let pfpQ = await axios({
      method: "GET",
      url: `https://api.twitch.tv/helix/users?login=${username}`,
      headers: {
        Authorization: "Bearer " + token,
        "Client-Id": cid,
      },
    });

    await findQuery(pool, 'UPDATE subathonstats SET Avatar=? WHERE Username=?;', [pfpQ.data.data[0].profile_image_url, username]);
    pfp = pfpQ.data.data[0].profile_image_url;
  } else pfp = data.Avatar;

  return res.status(200).json({
    id: data.ID,
    avatar: pfp,
    username: data.Username,
    messageCount: data.MessageCount,
    messageRank: messageRank[0].POSITION,
    giftedSubs: data.GiftedSubs,
    subRank: subRank[0].POSITION,
    bitsDonated: data.BitsDonated,
    bitsRank: bitsRank[0].POSITION,
  });
}

export default {
  getSubathonMessageStats,
  getSubathonGiftedSubsStats,
  getSubathonDonatedBitsStats,
  getSubathonStartDate,
  getWheelSpinStats,
  getUserSubathonStats
};

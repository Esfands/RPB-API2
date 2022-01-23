import { Request, Response, NextFunction } from 'express';
import { checkForKey, findQuery } from '../maria';

export interface IChatter extends Document {
  TID: number;
  Username: string;
  DisplayName: string;
  RetFuel: number;
}

const getRankings = async (req: Request, res: Response, next: NextFunction) => {
  let result = await findQuery('SELECT * FROM chatters ORDER BY RetFuel DESC LIMIT 25;');
  let total = await findQuery('SELECT COUNT(*) FROM chatters');
  let chatterData: any[] = [];
  result.forEach((user: IChatter) => {
    chatterData.push({
      TID: user["TID"],
      Username: user["Username"],
      DisplayName: user["DisplayName"],
      RetFuel: user["RetFuel"]
    })
  });

  return res.status(200).json({
      total: Object.values(total[0])[0],
      data: chatterData
  });
}

export default { getRankings }
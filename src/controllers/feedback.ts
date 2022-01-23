import { Request, Response, NextFunction } from 'express';
import { checkForKey, findQuery } from '../maria';

enum FeedbackType {
  feedback,
  bug
}

enum FeedbackStatus {
  pending,
  complete,
  'in progress',
  bug
}

export interface IFeedback {
  ID: number;
  Username: string;
  DisplayName: string;
  Message: string;
  Type: FeedbackType;
  Status: FeedbackStatus;
}

const getFeedback = async (req: Request, res: Response, next: NextFunction) => {
  let result = await findQuery('SELECT * FROM suggestions;');
  let feedbackData: any[] = [];
  result.forEach((user: IFeedback) => {
    feedbackData.push({
      ID: user["ID"],
      Username: user["Username"],
      DisplayName: user["DisplayName"],
      Message: user["Message"],
      Type: user["Type"],
      Status: user["Status"]
    })
  });
  return res.status(200).json({
    data: feedbackData
  });
}

const getFeedbackById = async (req: Request, res: Response, next: NextFunction) => {
  let id: string = req.params.id;
  console.log(id);
  let query = await findQuery(`SELECT * FROM suggestions WHERE ID='${id}' LIMIT 1;`);

  return res.status(200).json({
    data: {
      ID: query[0]["ID"],
      Username: query[0]["Username"],
      DisplayName: query[0]["DisplayName"],
      Message: query[0]["Message"],
      Type: query[0]["Type"],
      Status: query[0]["Status"]
    }
  });
}

export default { getFeedback, getFeedbackById }
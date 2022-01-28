import { Request, Response, NextFunction } from "express";
import { findQuery } from "../maria";

/* Normal Commands */

export interface ICommand {
  Name: string;
  Aliases: any;
  Permissions: any;
  GlobalCooldown: number;
  Cooldown: number;
  Description: string;
  DynamicDescription: any;
  Testing: boolean;
  OfflineOnly: boolean;
  Count: number;
}

const getCommands = async (req: Request, res: Response, next: NextFunction) => {
  let result = await findQuery("SELECT * FROM commands;", []);
  let commandData: any[] = [];
  result.forEach((cmd: ICommand) => {
    commandData.push({
      Name: cmd["Name"],
      Aliases: cmd["Aliases"],
      Permissions: cmd["Permissions"],
      Description: cmd["Description"],
      DynamicDescription: cmd["DynamicDescription"],
      GlobalCooldown: cmd["GlobalCooldown"],
      Cooldown: cmd["Cooldown"],
      Testing: cmd["Testing"],
      OfflineOnly: cmd["OfflineOnly"],
      Count: cmd["Count"],
    });
  });
  return res.status(200).json({
    data: commandData,
  });
};

const getCommand = async (req: Request, res: Response, next: NextFunction) => {
  let name: string = req.params.name;
  let query = await findQuery(
    `SELECT * FROM commands WHERE Name=? LIMIT 1;`
  , [name]);

  return res.status(200).json({
    data: {
      Name: query[0]["Name"],
      Aliases: JSON.parse(query[0]["Aliases"]),
      Permissions: JSON.parse(query[0]["Permissions"]),
      Description: query[0]["Description"],
      DynamicDescription: JSON.parse(query[0]["DynamicDescription"]),
      GlobalCooldown: query[0]["GlobalCooldown"],
      Cooldown: query[0]["Cooldown"],
      Testing: query[0]["Testing"],
      OfflineOnly: query[0]["OfflineOnly"],
      Count: query[0]["Count"],
    },
  });
};

/* OTF Commands */
export interface IOTFCommand {
  Name: string;
  Response: string;
  Creator: string;
  Count: number;
}

const getOTFCommands = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let result = await findQuery("SELECT * FROM otf;", []);
  let commandData: any[] = [];
  result.forEach((cmd: IOTFCommand) => {
    commandData.push({
      Name: cmd["Name"],
      Response: cmd["Response"],
      Creator: cmd["Creator"],
      Count: cmd["Count"],
    });
  });
  return res.status(200).json({
    data: commandData,
  });
};

const getOTFCommand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let name: string = req.params.name;
  let query = await findQuery(
    `SELECT * FROM otf WHERE Name=? LIMIT 1;`
  , [name]);

  return res.status(200).json({
    data: {
      Name: query[0]["Name"],
      Response: query[0]["Response"],
      Creator: query[0]["Creator"],
      Count: query[0]["Count"],
    },
  });
};

export default { getCommands, getCommand, getOTFCommands, getOTFCommand };

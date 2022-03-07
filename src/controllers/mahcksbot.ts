import { Request, Response, NextFunction } from "express";
import { findQuery } from "../maria";
import { mbPool } from "../server";

export interface MBCommandInt {
  name: string;
  aliases: string[];
  permissions: ("developer" | "admin" | "moderator" | "trusted" | "broadcaster" | 'vip' | 'moderator')[];
  globalCooldown: number;
  cooldown: number;
  description: string;
  dynamicDescription: string[];
  testing: boolean;
  offlineOnly: boolean;
  onlineOnly: boolean;
  optout: boolean;
  count: string;
}

const getMBCommands = async (req: Request, res: Response, next: NextFunction) => {
  let query = await findQuery(mbPool, 'SELECT * FROM commands;', []);

  let commands = query;
  console.log(commands);

  let cmdData: any[] = [];
  query.forEach((cmd: MBCommandInt) => {
    cmdData.push({
      name: cmd["name"],
      aliases: cmd["aliases"],
      permissions: cmd["permissions"],
      globalCooldown: cmd["globalCooldown"],
      cooldown: cmd['cooldown'],
      description: cmd["description"],
      dynamicDescription: cmd['dynamicDescription'],
      testing: Boolean(cmd['testing']),
      offlineOnly: Boolean(cmd["offlineOnly"]),
      onlineOnly: Boolean(cmd["onlineOnly"]),
      optout: Boolean(cmd["optout"]),
      count: parseInt(cmd['count'])
    })
  })

  return res.status(200).json({
    data: cmdData
  })
}

export interface ChannelSettings {
  id: number; // ID of the broadcaster.
  username: string; // Username of the broadcaster.
  prefix: string; // Sets their own prefix.
  role: string;
  logged: boolean; // Does the broadcaster want their channel logged for WST?
  disabledCommands: string | string[]; // List of commands that are disabled for that streamer.
}

const getMBChannelSettings = async (req: Request, res: Response, next: NextFunction) => {
  let query = await findQuery(mbPool, 'SELECT * FROM channels;', []);

  let channelData: any[] = [];
  query.forEach((ch: ChannelSettings) => {
    channelData.push({
      id: ch.id,
      username: ch.username,
      prefix: ch.prefix,
      role: ch.role,
      logged: ch.logged,
      disabledCommands: ch.disabledCommands
    })
  });

  return res.status(200).json({
    data: channelData
  })
}

export default { getMBCommands, getMBChannelSettings }
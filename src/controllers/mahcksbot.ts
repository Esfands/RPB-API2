import { Request, Response, NextFunction } from "express";
import { resourceLimits } from "worker_threads";
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

const getMBOneChannelSettings = async (req: Request, res: Response, next: NextFunction) => {
  let channel: string = req.params.channel;
  let query = await findQuery(mbPool, 'SELECT * FROM channels WHERE username=?;', [channel]);

  if (query[0]) {
    return res.status(200).json({
      id: query[0].id,
      username: query[0].username,
      prefix: query[0].prefix,
      role: query[0].role,
      logged: query[0].logged,
      disabledCommands: query[0].disabledCommands
    });
  } else {
    return res.status(404).json({
      data: {
        code: 404,
        error: `The channel '${channel}' was not found.`
      }
    });
  }
}

const getMBCommand = async (req: Request, res: Response, next: NextFunction) => {
  let name: string = req.params.name;
  let query = await findQuery(mbPool, 'SELECT * FROM commands WHERE name=?;', [name]);

  if (query[0]) {
    return res.status(200).json({
      data: {
        name: query[0]['name'],
        aliases: query[0]['aliases'],
        permissions: query[0]['permissions'],
        description: query[0]['description'],
        dynamicDescription: query[0]['dynamicDescription'],
        globalCooldown: query[0]['globalCooldown'],
        cooldown: query[0]['cooldown'],
        testing: query[0]['testing'],
        offlineOnly: query[0]['offlineOnly'],
        onlineOnly: query[0]['onlineOnly'],
        optout: query[0]['optout'],
        count: query[0]['count']
      }
    });
  } else {
    return res.status(404).json({
      data: {
        code: 404,
        error: `The command '${name}' was not found.`
      }
    });
  }
}

const getAllMBFeedback = async (req: Request, res: Response, next: NextFunction) => {
  let query = await findQuery(mbPool, 'SELECT * FROM suggestions;', []);
  let feedbackData: any[] = [];
  query.forEach((feed: any) => {
    feedbackData.push({
      id: feed.id,
      uid: feed.uid,
      username: feed.username,
      message: feed.message,
      status: feed.status
    });
  });

  return res.status(200).json({
    data: feedbackData
  });
}

const getOneMBFeedback = async (req: Request, res: Response, next: NextFunction) => {
  let id: string = req.params.id;
  let query = await findQuery(mbPool, 'SELECT * FROM suggestions WHERE id=?;', [id]);

  if (query[0]) {
    return res.status(200).json({
      data: {
        id: query[0].id,
        uid: query[0].uid,
        username: query[0].username,
        message: query[0].message,
        status: query[0].status
      }
    })
  } else {
    return res.status(404).json({
      data: {
        code: 404,
        error: `Couldn't find a suggestion the ID ${id}`
      }
    })
  }
}

export default { getMBCommands, getMBChannelSettings, getMBCommand, getMBOneChannelSettings, getAllMBFeedback, getOneMBFeedback }
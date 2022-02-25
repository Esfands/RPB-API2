import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { findOne, findQuery, insertRow, updateOne } from "../maria";

const getTwitchToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const scopes = [
    "channel:read:predictions",
    "channel:read:polls",
    "channel:read:subscriptions",
    "channel:manage:redemptions"
  ];
  return res
    .status(301)
    .redirect(
      `https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID
      }&redirect_uri=${process.env.REDIRECT_URL
      }&response_type=code&scope=${scopes.join("%20")}`
    );
};

const twitchTokenCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let code = req.url;
  code = code.replace("/twitch/callback?code=", "");
  code = code.substring(0, code.indexOf("&"));

  let url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://api.retpaladinbot.com/twitch/completed`;
  let post = await axios({
    method: "POST",
    url: url,
  });

  let uid = process.env.CLIENT_ID as string;
  let getUser = await axios({
    method: "GET",
    url: "https://api.twitch.tv/helix/users",
    headers: {
      Authorization: "Bearer " + post.data["access_token"],
      "Client-Id": uid,
    },
  });

  // Username, AccessToken, RefreshToken, Scopes
  let username = getUser.data["data"][0]["login"];
  let searchUser = await findOne("tokens", `Username='${username}'`);
  if (searchUser) {
    await updateOne(
      `UPDATE tokens SET AccessToken='${post.data["access_token"]
      }', RefreshToken='${post.data["refresh_token"]
      }', Scopes='${JSON.stringify(
        post.data["scope"]
      )}' WHERE Username='${username}';`,
      []
    );
  } else {
    await insertRow(
      `INSERT INTO tokens (Username, AccessToken, RefreshToken, Scopes) VALUES (?, ?, ?, ?)`,
      [
        username,
        post.data["access_token"],
        post.data["refresh_token"],
        JSON.stringify(post.data["scope"]),
      ]
    );
  }

  return res.status(200).json({
    data: "You can close this now, thank you :)",
  });
};

const twitchTokenDone = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return res.status(200).json({
    data: "You can close this now, thank you :)",
  });
};

const getTwitchId = async (req: Request, res: Response, next: NextFunction) => {
  let query = req.query.user as string;

  let cid = process.env.YBD_ID as string;
  let token = process.env.YBD_TOKEN as string;
  let endPoint = Number(query) ? `id=${query}` : `login=${query}`;

  let nameSearch = await axios({
    method: "GET",
    url: `https://api.twitch.tv/helix/users?${endPoint}`,
    headers: {
      Authorization: "Bearer " + token,
      "Client-Id": cid,
    },
  });

  let userData = nameSearch.data["data"][0];

  if (!userData) {
    return res.status(404).json({
      data: `${query} not found`,
    });
  }

  let result = {
    username: userData["login"],
    id: userData["id"],
  };

  return res.status(200).json({
    data: result,
  });
};

async function getTwitchEmotes(id: number) {
  let cid = process.env.YBD_ID as string;
  let token = process.env.YBD_TOKEN as string;

  let emoteData = await axios({
    method: "GET",
    url: `https://api.twitch.tv/helix/chat/emotes?broadcaster_id=${id}`,
    headers: {
      Authorization: "Bearer " + token,
      "Client-Id": cid,
    },
  });

  return emoteData.data;
}

const getTwitchChannelEmotes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let query = req.query.id as string;

  let cid = process.env.YBD_ID as string;
  let token = process.env.YBD_TOKEN as string;

  if (Number(query)) {
    let emoteData = await getTwitchEmotes(parseInt(query));
    return res.status(200).json({
      data: emoteData.data,
    });
  } else {
    let endPoint = Number(query) ? `id=${query}` : `login=${query}`;
    let nameSearch = await axios({
      method: "GET",
      url: `https://api.twitch.tv/helix/users?${endPoint}`,
      headers: {
        Authorization: "Bearer " + token,
        "Client-Id": cid,
      },
    });

    if (!nameSearch.data["data"][0]) {
      return res.status(404).json({
        data: `${query} not found`,
      });
    } else {
      let emoteData = await getTwitchEmotes(
        parseInt(nameSearch.data["data"][0]["id"])
      );
      return res.status(200).json({
        data: emoteData.data,
      });
    }
  }
};

const getEsfandsChannelEmotes = async (req: Request, res: Response, next: NextFunction) => {
  let limit: string | number;
  if (req.query.limit) {
    limit = parseInt(req.query.limit as string);
  } else limit = 100;

  let totalRows = await findQuery(`SELECT COUNT(*) FROM emotes;`, []);
  let totalR = totalRows[0]["COUNT(*)"];
  let totalPages = Math.ceil(totalR / limit);
  let offset: string | number = parseInt(req.query.offset as string);
  if (!offset) offset = 1;

  if (offset > totalPages) {
    offset = totalPages;
  }

  let emotes = await findQuery(`SELECT * FROM emotes ORDER BY Name ASC LIMIT ? OFFSET ?;`, [limit, offset]);
  let emoteData: any[] = [];

  emotes.forEach((emote: any) => {
    emoteData.push({
      name: emote.Name,
      id: emote.ID,
      service: emote.Service,
      scope: emote.Scope,
      url: emote.URL,
      zeroWidth: (emote.ZeroWidth === "false") ? false : true
    });
  });

  return res.status(200).json({
    data: emoteData,
    pagination: {
      total: totalPages,
      current: offset
    },
  });
};

export default {
  getTwitchToken,
  twitchTokenCallback,
  twitchTokenDone,
  getTwitchId,
  getTwitchChannelEmotes,
  getEsfandsChannelEmotes,
};

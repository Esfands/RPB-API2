import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { findOne, insertRow, updateOne } from "../maria";


const getTwitchToken = async (req: Request, res: Response, next: NextFunction) => {
  const scopes = ["channel:read:predictions", "channel:read:polls", "channel:read:subscriptions"]
  return res.status(301).redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URL}&response_type=code&scope=${scopes.join("%20")}`);
};

const twitchTokenCallback = async (req: Request, res: Response, next: NextFunction) => {
  let code = req.url;
  code = code.replace('/twitch/callback?code=', '');
  code = code.substring(0, code.indexOf("&"));

  let url = `https://id.twitch.tv/oauth2/token?client_id=${process.env.CLIENT_ID}&client_secret=${process.env.CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=https://api.retpaladinbot.com/twitch/completed`;
  let post = await axios({
    method: "POST",
    url: url
  });

  let uid = process.env.CLIENT_ID as string;
   let getUser = await axios({
    method: "GET",
    url: "https://api.twitch.tv/helix/users",
    headers: {
      "Authorization": "Bearer " + post.data["access_token"],
      "Client-Id": uid
    }
  });

  // Username, AccessToken, RefreshToken, Scopes
  let username = getUser.data["data"][0]["login"];
  let searchUser = await findOne('tokens', `Username='${username}'`);
  if (searchUser) {
    await updateOne(`UPDATE tokens SET AccessToken='${post.data["access_token"]}', RefreshToken='${post.data["refresh_token"]}', Scopes='${JSON.stringify(post.data["scope"])}' WHERE Username='${username}';`);
  } else {
    await insertRow(`INSERT INTO tokens (Username, AccessToken, RefreshToken, Scopes) VALUES (?, ?, ?, ?)`, [username, post.data["access_token"], post.data["refresh_token"], JSON.stringify(post.data["scope"])]);
  }

  return res.status(200).json({
    data: "You can close this now, thank you :)",
  });
}

const twitchTokenDone = async (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({
    data: "You can close this now, thank you :)"
  });
}

export default { getTwitchToken, twitchTokenCallback, twitchTokenDone };

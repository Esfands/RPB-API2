import { Request, Response } from "express";
import { pool } from "./server";

export async function findQuery(query: string) {
  let conn;
  let data;
  try {
    conn = await pool.getConnection();
    let toFetch = await conn.query(query);
    data = toFetch;
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.end();
    return data;
  }
}

export function checkForKey(req: Request, res: Response) {
  const apiKey = req.get("API-Key");
  const keys = process.env.API_KEY?.split(" ");
  if (!apiKey || !keys?.includes(apiKey)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  } else {
    return true;
  }
}

export async function updateOne(query: string) {
  let conn;
  let data;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(query);
    if (rows) {
      data = rows;
    } else data = false;
  } catch (err) {
    throw err;
  } finally {
    if (conn) {
      conn.end();
      return data;
    }
  }
}

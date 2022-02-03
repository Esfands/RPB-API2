import { Request, Response } from "express";
import { pool } from "./server";

export async function findQuery(query: string, values: any[]) {
  let conn;
  let data;
  try {
    conn = await pool.getConnection();
    let toFetch = await conn.query(query, values);
    data = toFetch;
  } catch (err) {
    console.log(err);
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

export async function updateOne(query: string, values: any[]) {
  let conn;
  let data;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(query, values);
    if (rows) {
      data = rows;
    } else data = false;
  } catch (err) {
    console.log(err);
    throw err;
  } finally {
    if (conn) {
      conn.end();
      return data;
    }
  }
}

export async function findOne(table: string, toSearch: string) {
  let conn;
  let data;
  try {
    conn = await pool.getConnection();
    let rows = await conn.query(`SELECT * FROM ${table} WHERE ${toSearch} LIMIT 1;`);
    if (rows.length) {
      data = rows[0];
    } else data = false;
  } catch (err) {
    throw err;
  } finally {
    if (conn) conn.end()
    return data;
  }
}

export function insertRow(query: string, values: any[]) {
  pool.getConnection()
    .then(conn => {
      conn.query(query, values)
        .then((rows) => {
          if (rows.length) {
            console.log(rows, values);
            return true;
          } else {
            return false;
          }
        })
        .then((res) => {
          conn.end();
        })
        .catch(err => {
          //handle error
          console.log(err)
          conn.end();
        })
    }).catch(err => {
      //not connected
      console.log("not connected");
    });
}
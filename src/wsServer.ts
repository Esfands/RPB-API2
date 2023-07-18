import { WebSocketServer } from "ws";
import { MessageCode, WSMessage } from "./socket";

export default (expressServer: any, wsClients: any) => {
  const websocketServer = new WebSocketServer({ noServer: true });

  expressServer.on("upgrade", (request: any, socket: any, head: any) => {
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.emit("connection", ws, request);
    });
  });

  websocketServer.on("connection", (connection) => {
    console.log("WebSocket connection opened");
    wsClients.push(connection);

    connection.on("close", () => {
      console.log("WebSocket connection closed");

      const connectionIdx = wsClients.indexOf(connection);
      wsClients.splice(connectionIdx, 1);
    });
  });

  websocketServer.on("close", () => {
    const message: WSMessage = {
      mc: MessageCode.CLOSE,
      d: "WebSocket connection closed"
    }
    wsClients.forEach((client: WebSocket) => {
      client.send(JSON.stringify(JSON.stringify(message)))
    })
  })

  return expressServer;
};

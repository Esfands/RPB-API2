import { WebSocketServer } from "ws";

export default (httpsServer: any, connections: any) => {
  const websocketServer = new WebSocketServer({ noServer: true });

  httpsServer.on('upgrade', (request: any, socket: any, head: any) => {
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      websocketServer.emit('connection', ws, request);
    });
  });

  websocketServer.on('connection', (connection) => {
    console.log('WebSocket connection opened');

    connections.push(connection);

    connection.on('close', () => {
      console.log('WebSocket connection closed');

      const connectionIdx = connections.indexOf(connection);
      connections.splice(connectionIdx, 1);
    });
  });

  return httpsServer;
};
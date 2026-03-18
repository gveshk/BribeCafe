import type { FastifyInstance } from 'fastify';
import { WebSocketServer, type WebSocket } from 'ws';
import { eventBroker } from './eventBroker';
import { tableService } from './tableService';
import type { AuthPayload } from '../types';
import type { LifecycleEvent, WsClientMessage, WsServerMessage } from '../types/events';

interface ClientContext {
  socket: WebSocket;
  auth: AuthPayload;
  subscriptions: Set<string>;
}

function send(socket: WebSocket, message: WsServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

async function getHandshakeToken(req: any): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const requestUrl = new URL(req.url ?? '', 'http://localhost');
  const token = requestUrl.searchParams.get('token');
  return token;
}

export function registerWebsocketGateway(fastify: FastifyInstance): void {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<ClientContext>();

  fastify.server.on('upgrade', async (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) {
      return;
    }

    try {
      const token = await getHandshakeToken(req);
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      const auth = await fastify.jwt.verify<AuthPayload>(token);

      wss.handleUpgrade(req, socket, head, (ws) => {
        const context: ClientContext = {
          socket: ws,
          auth,
          subscriptions: new Set(),
        };

        clients.add(context);
        send(ws, {
          type: 'connected',
          payload: { agentId: auth.agentId, seq: eventBroker.getCurrentSeq() },
        });

        ws.on('message', async (raw) => {
          try {
            const message = JSON.parse(raw.toString()) as WsClientMessage;

            if (message.type === 'ping') {
              send(ws, { type: 'pong' });
              return;
            }

            if (!message.tableId) {
              send(ws, { type: 'error', payload: { message: 'tableId required' } });
              return;
            }

            const authorized = await tableService.isParticipant(message.tableId, auth.agentId);
            if (!authorized) {
              send(ws, { type: 'error', payload: { message: 'Not authorized for table subscription' } });
              return;
            }

            if (message.type === 'subscribe') {
              context.subscriptions.add(message.tableId);
              send(ws, {
                type: 'subscribed',
                payload: { tableId: message.tableId, seq: eventBroker.getCurrentSeq() },
              });
              return;
            }

            if (message.type === 'unsubscribe') {
              context.subscriptions.delete(message.tableId);
              send(ws, { type: 'unsubscribed', payload: { tableId: message.tableId } });
            }
          } catch {
            send(ws, { type: 'error', payload: { message: 'Invalid websocket message' } });
          }
        });

        ws.on('close', () => {
          clients.delete(context);
        });
      });
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  const unsubscribe = eventBroker.subscribe((event: LifecycleEvent) => {
    for (const client of clients) {
      if (!client.subscriptions.has(event.tableId)) {
        continue;
      }
      send(client.socket, { type: 'event', payload: event });
    }
  });

  fastify.addHook('onClose', async () => {
    unsubscribe();
    wss.close();
  });
}

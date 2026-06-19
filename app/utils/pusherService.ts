const PUSHER_KEY = '613438a26b0285b87b2c';
const PUSHER_CLUSTER = 'ap2';
const WS_URL = `wss://ws-${PUSHER_CLUSTER}.pusher.com/app/${PUSHER_KEY}?protocol=7&client=react-native&version=8.0.0&flash=false`;

type EventCallback = (data: unknown) => void;

class PusherWsClient {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, EventCallback[]>();
  private channels = new Set<string>();
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private dead = false;

  connect() {
    if (this.dead) return;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('[Pusher] WebSocket connected');
      this.channels.forEach(ch => {
        console.log('[Pusher] Subscribing to channel:', ch);
        this.sendRaw({ event: 'pusher:subscribe', data: { auth: '', channel: ch } });
      });
      this.pingTimer = setInterval(() => this.sendRaw({ event: 'pusher:ping', data: {} }), 25000);
    };

    this.ws.onmessage = (e) => {
      try {
        const msg: { event: string; channel?: string; data?: unknown } = JSON.parse(e.data as string);
        console.log('[Pusher] Message:', msg.event, msg.channel ?? '');
        if (msg.event === 'pusher:ping') {
          this.sendRaw({ event: 'pusher:pong', data: {} });
          return;
        }
        const key = `${msg.channel ?? ''}::${msg.event}`;
        const cbs = this.listeners.get(key);
        if (cbs?.length) {
          const payload = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          cbs.forEach(cb => cb(payload));
        }
      } catch {}
    };

    this.ws.onclose = (e) => {
      console.log('[Pusher] WebSocket closed, code:', e.code);
      this.clearPing();
      if (!this.dead) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = (e) => {
      console.log('[Pusher] WebSocket error:', e);
      this.ws?.close();
    };
  }

  bind(channel: string, event: string, cb: EventCallback) {
    const key = `${channel}::${event}`;
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key)!.push(cb);

    if (!this.channels.has(channel)) {
      this.channels.add(channel);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendRaw({ event: 'pusher:subscribe', data: { auth: '', channel } });
      }
    }
  }

  disconnect() {
    this.dead = true;
    this.clearPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
    this.channels.clear();
  }

  private sendRaw(obj: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  private clearPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

let instance: PusherWsClient | null = null;

export function initPusher(): PusherWsClient {
  if (!instance) {
    instance = new PusherWsClient();
    instance.connect();
  }
  return instance;
}

export function disconnectPusher() {
  instance?.disconnect();
  instance = null;
}

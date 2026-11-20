// 掼蛋联机中转：只负责转发消息，牌局在房主的设备上运行
import { DurableObject } from "cloudflare:workers";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/room\/([A-Z0-9]{4,10})$/);
    if (m) {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("需要 WebSocket", { status: 426 });
      return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(request);
    }
    return new Response("guandan relay ok", { headers: { "content-type": "text/plain; charset=utf-8", "access-control-allow-origin": "*" } });
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    // 心跳由平台直接回复，不唤醒对象
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request) {
    const url = new URL(request.url);
    const cid = (url.searchParams.get("cid") || "").slice(0, 32);
    const key = url.searchParams.get("key") || "";
    const wantHost = url.searchParams.get("host") === "1";
    if (!cid) return new Response("missing cid", { status: 400 });
    let role = "guest";
    if (wantHost) {
      let hostKey = await this.ctx.storage.get("hostKey");
      if (!hostKey && key) { await this.ctx.storage.put("hostKey", key); hostKey = key; }
      if (!key || key !== hostKey) {
        const pair = new WebSocketPair();
        pair[1].accept(); pair[1].close(4003, "not host");
        return new Response(null, { status: 101, webSocket: pair[0] });
      }
      role = "host";
    }
    // 同一个人重连：关掉旧连接
    for (const old of this.ctx.getWebSockets("c:" + cid)) { try { old.close(4000, "replaced"); } catch (e) {} }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, ["c:" + cid, role]);
    server.serializeAttachment({ cid, role });
    if (role === "guest") this.toHost({ sys: "join", cid });
    else for (const g of this.ctx.getWebSockets("guest")) {   // 房主（重）连上时，告诉他现在有哪些人在线
      const ga = g.deserializeAttachment() || {};
      try { server.send(JSON.stringify({ sys: "join", cid: ga.cid })); } catch (e) {}
    }
    await this.ctx.storage.put("touched", Date.now());
    await this.ctx.storage.setAlarm(Date.now() + 3 * 24 * 3600 * 1000);   // 3 天没人用就清理
    return new Response(null, { status: 101, webSocket: client });
  }

  toHost(obj) {
    const s = JSON.stringify(obj);
    for (const ws of this.ctx.getWebSockets("host")) { try { ws.send(s); } catch (e) {} }
  }

  webSocketMessage(ws, msg) {
    if (typeof msg !== "string" || msg.length > 200000) return;
    const a = ws.deserializeAttachment() || {};
    let d; try { d = JSON.parse(msg); } catch (e) { return; }
    if (a.role === "host") {
      const targets = d.to && d.to !== "*" ? this.ctx.getWebSockets("c:" + d.to) : this.ctx.getWebSockets("guest");
      const s = JSON.stringify({ m: d.m });
      for (const t of targets) {
        const ta = t.deserializeAttachment() || {};
        if (ta.role === "guest") { try { t.send(s); } catch (e) {} }
      }
    } else {
      this.toHost({ from: a.cid, m: d.m });
    }
  }

  webSocketClose(ws, code) { this.gone(ws); try { ws.close(1000, "bye"); } catch (e) {} }
  webSocketError(ws) { this.gone(ws); }

  gone(ws) {
    const a = ws.deserializeAttachment() || {};
    // 被同一人的新连接替换时不算离开
    const still = this.ctx.getWebSockets("c:" + a.cid).some(x => x !== ws && x.readyState === 1);
    if (still) return;
    if (a.role === "guest") this.toHost({ sys: "leave", cid: a.cid });
    else {
      const s = JSON.stringify({ m: { t: "hostgone" } });
      for (const t of this.ctx.getWebSockets("guest")) { try { t.send(s); } catch (e) {} }
    }
  }

  async alarm() {
    if (this.ctx.getWebSockets().length) { await this.ctx.storage.setAlarm(Date.now() + 24 * 3600 * 1000); return; }
    await this.ctx.storage.deleteAll();
  }
}

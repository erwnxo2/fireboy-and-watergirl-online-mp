// Ateş ve Su - Online Mod: Aracı sunucu (v0.8)
// Sadece Node.js ile çalışır, ek kurulum gerekmez.
// Çalıştırma:  node server.js   (ya da start-server.bat'a çift tıkla)
//
// v0.8:
//  - Host ve guest'in mod sürümü (ver) aynı olmalı, değilse katılım reddedilir.
//  - Oda kodu: sadece harf/rakam, en fazla 32 karakter. Yanlış katılma denemesi 5'i geçerse bağlantı kesilir.
//  - Heartbeat: sunucu her 2 sn "hb" yollar, 10 sn boyunca hiçbir şey göndermeyen istemci atılır.
//  - Saniyede en fazla 400 mesaj kabul edilir, fazlası atılır. Çok uzun satırlar atılır.
//  - Karşı taraf yavaşsa (gönderim kuyruğu şişmişse) "snap" mesajları atlanır, çünkü bir sonraki zaten daha günceldir.
//  - "go" mesajlarındaki bölüm adı kontrol edilir (yol atlatma / tuhaf karakter yok).
//  - Aynı bağlantı ikinci kez oda açıp/katılamaz.

const net = require("net");
const PORT = parseInt(process.env.PORT || "7777", 10);

const MAX_LINE = 300000; // tek satır (bayt/karakter) sınırı
const MAX_BUF = 1000000; // satır tamamlanmadan biriken veri sınırı
const MAX_MSG_PER_SEC = 400;
const IDLE_TIMEOUT_MS = 10000;
const HB_INTERVAL_MS = 2000;
const SNAP_BACKLOG_LIMIT = 128 * 1024; // 30Hz'e geçişle birlikte daha hızlı tepki için 128KB
const KILL_BACKLOG_LIMIT = 4 * 1024 * 1024; // bu kadar birikmişse karşı taraf ölü say
const MAX_BAD_JOINS = 5;

const RELAY = new Set(["in", "snap", "go", "over", "ping", "pong", "rs", "ev", "chat"]);
const GO_STATES = new Set(["level", "levelMenu", "menu"]);
const ROOM_RE = /^[A-Za-z0-9]{1,32}$/;
const NAME_RE = /^[\w\-\/. ]+$/;

// oda kodu -> { host: socket, guest: socket | null, ver: string }
const rooms = new Map();
const sockets = new Set();

function send(sock, obj) {
  if (sock && !sock.destroyed) sock.write(JSON.stringify(obj) + "\n");
}

function other(sock) {
  const room = rooms.get(sock.room);
  if (!room) return null;
  return sock.role === "host" ? room.guest : room.host;
}

function leave(sock) {
  if (!sock.room) return;
  const room = rooms.get(sock.room);
  if (!room) return;
  if (sock.role === "host") {
    if (room.guest) {
      send(room.guest, { t: "gone" });
      room.guest.room = null;
    }
    rooms.delete(sock.room);
    console.log("Oda kapandı:", sock.room);
  } else if (room.guest === sock) {
    room.guest = null;
    send(room.host, { t: "gone" });
    console.log("Misafir ayrıldı:", sock.room);
  }
  sock.room = null;
}

function goIsValid(msg) {
  if (!GO_STATES.has(msg.s)) return false;
  if (msg.p !== undefined && msg.p !== null) {
    if (typeof msg.p !== "object") return false;
    if (msg.p.filename !== undefined) {
      const f = msg.p.filename;
      if (typeof f !== "string" || f.length > 200) return false;
      if (!NAME_RE.test(f) || f.indexOf("..") >= 0) return false;
    }
  }
  return true;
}

function badJoin(sock, text) {
  send(sock, { t: "err", msg: text });
  sock.badJoins++;
  if (sock.badJoins >= MAX_BAD_JOINS) {
    console.log("Çok fazla hatalı deneme, bağlantı kesildi:", sock.remoteAddress);
    sock.destroy();
  }
}

function handle(sock, msg, rawLine) {
  if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return;

  // Heartbeat: sadece "canlıyım" demek, kimseye aktarılmaz
  if (msg.t === "hb") return;

  if (msg.t === "host" || msg.t === "join") {
    if (sock.room) return send(sock, { t: "err", msg: "Zaten bir odadasın" });
    const code = String(msg.room === undefined ? "" : msg.room);
    const ver = String(msg.ver === undefined ? "?" : msg.ver).slice(0, 24);
    if (!ROOM_RE.test(code)) {
      return badJoin(sock, "Oda kodu sadece harf/rakam olabilir (en fazla 32 karakter)");
    }

    if (msg.t === "host") {
      if (rooms.has(code)) return send(sock, { t: "err", msg: "Bu oda kodu kullanımda" });
      rooms.set(code, { host: sock, guest: null, ver: ver });
      sock.room = code;
      sock.role = "host";
      send(sock, { t: "ok", role: "host" });
      console.log("Oda açıldı:", code, "(sürüm " + ver + ")");
      return;
    }

    const room = rooms.get(code);
    if (!room) return badJoin(sock, "Böyle bir oda yok");
    if (room.ver !== ver) {
      return send(sock, {
        t: "err",
        msg: "Mod sürümleri uyuşmuyor (host: " + room.ver + ", sen: " + ver + "). İkiniz de aynı online.js'i kullanın.",
      });
    }
    if (room.guest) return send(sock, { t: "err", msg: "Oda dolu" });
    room.guest = sock;
    sock.room = code;
    sock.role = "guest";
    send(sock, { t: "ok", role: "guest" });
    send(room.host, { t: "peer" });
    send(sock, { t: "peer" });
    console.log("Odaya katıldı:", code);
    return;
  }

  // Oyun mesajları: sadece karşı tarafa aktar
  if (!RELAY.has(msg.t)) return;
  if (msg.t === "go" && !goIsValid(msg)) {
    console.log("Geçersiz 'go' mesajı atıldı:", sock.remoteAddress);
    return;
  }
  if (msg.t === "chat" && (typeof msg.msg !== "string" || msg.msg.length > 200)) return;
  const peer = other(sock);
  if (!peer || peer.destroyed) return;
  if (peer.writableLength > KILL_BACKLOG_LIMIT) {
    console.log("Karşı taraf çok geride kaldı, bağlantı kesiliyor:", peer.room);
    peer.destroy();
    return;
  }
  if (msg.t === "snap" && peer.writableLength > SNAP_BACKLOG_LIMIT) return; // eskiyen snap'i atla
  peer.write(rawLine + "\n");
}

const server = net.createServer((sock) => {
  sock.setNoDelay(true);
  sock.setKeepAlive(true, 5000);
  sock.setEncoding("utf8");
  sock.room = null;
  sock.role = null;
  sock.badJoins = 0;
  sock.lastSeen = Date.now();
  sock.winStart = Date.now();
  sock.winCount = 0;
  sock.rateWarned = false;
  sockets.add(sock);
  let buf = "";

  sock.on("data", (chunk) => {
    sock.lastSeen = Date.now();
    buf += chunk;
    if (buf.length > MAX_BUF) {
      sock.destroy();
      return;
    }
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (!line || line.length > MAX_LINE) continue;

      const now = Date.now();
      if (now - sock.winStart >= 1000) {
        sock.winStart = now;
        sock.winCount = 0;
        sock.rateWarned = false;
      }
      if (++sock.winCount > MAX_MSG_PER_SEC) {
        if (!sock.rateWarned) {
          sock.rateWarned = true;
          console.log("Mesaj sınırı aşıldı, fazlası atılıyor:", sock.remoteAddress);
        }
        continue;
      }

      let msg;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        continue;
      }
      handle(sock, msg, line);
    }
  });

  sock.on("close", () => {
    sockets.delete(sock);
    leave(sock);
  });
  sock.on("error", () => {});
});

// Heartbeat gönder + sessiz kalanları at
setInterval(() => {
  const now = Date.now();
  for (const s of sockets) {
    if (now - s.lastSeen > IDLE_TIMEOUT_MS) {
      console.log("Zaman aşımı, bağlantı kesildi:", s.remoteAddress, s.room || "-");
      s.destroy();
    } else {
      send(s, { t: "hb" });
    }
  }
}, HB_INTERVAL_MS);

server.listen(PORT, () => {
  console.log("Sunucu çalışıyor (v0.8). Port: " + PORT);
  console.log("Bu pencereyi oyun oynarken açık bırak.");
});

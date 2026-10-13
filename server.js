// Ateş ve Su - Online Mod: Aracı sunucu (v0.9)
// Sadece Node.js ile çalışır, ek kurulum gerekmez.
// Çalıştırma:  node server.js   (ya da start-server.bat'a çift tıkla)
//
// v0.9:
//  - ODA KODU SİSTEMİ KALDIRILDI. Tek oda vardır: bir host + bir guest.
//  - Host ve guest'in mod sürümü (ver) aynı olmalı, değilse katılım reddedilir.
//  - Host yoksa "join" reddedilir ("Host yok, önce arkadaşın Başlat demeli").
//  - Host düşerse guest'e "gone" yollanır; guest kendi tarafında menüye döner.
//  - Heartbeat: sunucu her 2 sn "hb" yollar, 10 sn boyunca hiçbir şey göndermeyen istemci atılır.
//  - Saniyede en fazla 400 mesaj kabul edilir, fazlası atılır. Çok uzun satırlar atılır.
//  - Karşı taraf yavaşsa (gönderim kuyruğu şişmişse) "snap" mesajları atlanır.
//  - "go" mesajlarındaki bölüm adı kontrol edilir (yol atlatma / tuhaf karakter yok).
//  - Aynı bağlantı ikinci kez host/join olamaz.

const net = require("net");
const PORT = parseInt(process.env.PORT || "7777", 10);

const MAX_LINE = 300000; // tek satır (bayt/karakter) sınırı
const MAX_BUF = 1000000; // satır tamamlanmadan biriken veri sınırı
const MAX_MSG_PER_SEC = 400;
const IDLE_TIMEOUT_MS = 10000;
const HB_INTERVAL_MS = 2000;
const SNAP_BACKLOG_LIMIT = 128 * 1024;
const KILL_BACKLOG_LIMIT = 4 * 1024 * 1024;
const MAX_BAD_JOINS = 5;

const RELAY = new Set(["in", "snap", "go", "over", "ping", "pong", "rs", "ev", "chat"]);
const GO_STATES = new Set(["level", "levelMenu", "menu"]);
const NAME_RE = /^[\w\-\/. ]+$/;

// Tek oda: { host: socket|null, guest: socket|null, ver: string }
const room = { host: null, guest: null, ver: "?" };

const sockets = new Set();

function send(sock, obj) {
  if (sock && !sock.destroyed) sock.write(JSON.stringify(obj) + "\n");
}

function other(sock) {
  if (sock === room.host) return room.guest;
  if (sock === room.guest) return room.host;
  return null;
}

function leave(sock) {
  if (sock === room.host) {
    if (room.guest && !room.guest.destroyed) {
      send(room.guest, { t: "gone" });
      room.guest.role = null;
    }
    room.host = null;
    room.guest = null;
    room.ver = "?";
    console.log("Host ayrıldı, oda kapandı.");
  } else if (sock === room.guest) {
    room.guest = null;
    if (room.host && !room.host.destroyed) send(room.host, { t: "gone" });
    console.log("Misafir ayrıldı.");
  }
  sock.role = null;
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
    if (sock.role) return send(sock, { t: "err", msg: "Zaten bağlısın" });
    const ver = String(msg.ver === undefined ? "?" : msg.ver).slice(0, 24);

    if (msg.t === "host") {
      if (room.host && !room.host.destroyed) {
        return send(sock, { t: "err", msg: "Oda dolu (başka bir host zaten bağlı)" });
      }
      room.host = sock;
      room.ver = ver;
      sock.role = "host";
      send(sock, { t: "ok", role: "host" });
      console.log("Host bağlandı. (sürüm " + ver + ")");
      // Host yeniden bağlandıysa ve halihazırda guest varsa iki tarafa da haber ver
      if (room.guest && !room.guest.destroyed) {
        send(room.host, { t: "peer" });
        send(room.guest, { t: "peer" });
      }
      return;
    }

    // join
    if (!room.host || room.host.destroyed) {
      return badJoin(sock, "Host yok. Önce arkadaşın 'Başlat' demeli.");
    }
    if (room.guest && !room.guest.destroyed) {
      return send(sock, { t: "err", msg: "Oda dolu" });
    }
    if (room.ver !== ver) {
      return send(sock, {
        t: "err",
        msg: "Mod sürümleri uyuşmuyor (host: " + room.ver + ", sen: " + ver + "). İkiniz de aynı online.js'i kullanın.",
      });
    }
    room.guest = sock;
    sock.role = "guest";
    send(sock, { t: "ok", role: "guest" });
    send(room.host, { t: "peer" });
    send(sock, { t: "peer" });
    console.log("Misafir odaya katıldı.");
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
    console.log("Karşı taraf çok geride kaldı, bağlantı kesiliyor.");
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
      console.log("Zaman aşımı, bağlantı kesildi:", s.remoteAddress, s.role || "-");
      s.destroy();
    } else {
      send(s, { t: "hb" });
    }
  }
}, HB_INTERVAL_MS);

server.listen(PORT, () => {
  console.log("Sunucu çalışıyor (v0.9 - tek oda). Port: " + PORT);
  console.log("Bu pencereyi oyun oynarken açık bırak.");
});

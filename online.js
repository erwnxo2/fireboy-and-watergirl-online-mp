/* Ateş ve Su - Online Mod (prototip v0.9.5 - TR/EN dil desteği eklendi)
 *
 * Mantık (ana bilgisayar yöntemi):
 *  - HOST (oda açan) = Ateş, ok tuşlarıyla oynar. Fiziği o hesaplar.
 *  - GUEST (katılan) = Su, W A D ile oynar. Tuşlarını host'a gönderir.
 *  - Host, saniyede 30 kez nesnelerin konumunu guest'e yollar.
 *  - Guest kendi karakterini anında oynatır, host'tan gelen konumlarla yavaşça düzeltilir.
 *
 * Not (lobi kodu kaldırıldı): Artık oda kodu yok. Ateş "Başlat" der, Su aynı ağdaki adresi yazıp "Bağlan" der.
 *       Sunucu tek oda kullanır. Sohbet arayüzü sadeleştirildi (düz oyun içi sohbet).
 *
 * F9/Tab = menü.  F8 (guest) = zorla eşitle.  F7 = kayda işaret koy.  F6 = oyun yapısını kayda dök.
 *
 * TR/EN dil desteği: Menüden seçilir, localStorage'a yazılır. Ağ protokolü ve fizik mantığı değişmedi.
 */
(function () {
  "use strict";

  var VERSION = "v0.9.5";
  var DEFAULT_SERVER = "127.0.0.1:7777";
  var SNAP_MS = 33; // 30Hz
  var FAST_MS = 12;
  var BODY_STATIC = 0;
  var SYNC_STATES = { level: 1, levelMenu: 1, menu: 1 };
  var STATE_MODULES = { level: "States/Level/Level", levelMenu: "States/LevelMenu/LevelMenu" };
  var EXTRAP_ON = true;
  var LOG_MAX_BYTES = 8000000;
  var HB_TIMEOUT_MS = 8000;
  var BACKLOG_LIMIT = 40000;
  var SAFE_NAME = /^[\w\-\/. ]+$/;

  /* ---------------- Dil / Language (TR + EN) ---------------- */
  var LANG = "tr";
  try {
    var _sl = window.localStorage.getItem("fbwg-online:lang");
    if (_sl === "tr" || _sl === "en") LANG = _sl;
  } catch (e) {}

  var I18N = {
    tr: {
      menuTitle: "Ateş ve Su",
      menuSub: "Online mod · {0}",
      closeTitle: "Kapat (F9)",
      stateNoConn: "Bağlı değil",
      stateConnecting: "Bağlanıyor…",
      stateHostReady: "Hazır · arkadaş bekleniyor",
      stateGuestReady: "Bağlandı · arkadaş bekleniyor",
      stateHostBoth: "Ateş · iki oyuncu hazır",
      stateGuestBoth: "Su · iki oyuncu hazır",
      secConn: "Bağlantı",
      lblAddr: "Sunucu adresi (aynı ağdaki bilgisayarın IP:port'u)",
      btnStart: "Başlat",
      btnStartSub: "Ateş olarak",
      btnJoin: "Bağlan",
      btnJoinSub: "Su olarak",
      secSet: "Ayarlar",
      setAlt: "İki tuş takımı",
      setAltDesc: "Ok tuşları ve W A D birlikte çalışır",
      setComp: "Gecikme telafisi",
      setCompDesc: "Su oyuncusu için, zıplama senkronunu düzeltir",
      setAuto: "Otomatik yeniden bağlan",
      setAutoDesc: "Bağlantı kopunca kendiliğinden tekrar dener",
      setCap: "Upload sınırı",
      setCapDesc: "Discord/internet kasıyorsa düşür",
      capUnlimited: "Sınırsız",
      capUnit: " KB/s",
      setLang: "Dil / Language",
      setLangDesc: "Türkçe / English",
      btnDisconnect: "Bağlantıyı kes",
      footText:
        "<kbd>F9</kbd> / <kbd>Tab</kbd> menü &nbsp;·&nbsp; <kbd>F8</kbd> zorla eşitle (Su) &nbsp;·&nbsp; <kbd>F7</kbd> kayıt işareti",
      statusLoaded: "Online mod {0} yüklendi - F9: menü",
      warnMismatch: " | !! BÖLÜM UYUŞMUYOR",
      warnNoData: " | !! host'tan veri gelmiyor",
      warnCongested: " | !! ağ tıkalı",
      warnError: " | !! HATA: {0}",
      pingLabel: "ping {0}ms",
      txLabel: "↑ {0} KB/s",
      txAtCap: " (sınırda)",
      drift: " | kayma {0}m",
      mConnClosed: "bağlantı kapalı",
      mConnManual: "bağlantı kesildi",
      mReconnecting: "{0} — 3sn sonra yeniden bağlanılıyor...",
      mNetErr: "HATA: ağ modülü yüklenemedi",
      mConnecting: "bağlanılıyor {0}:{1} ...",
      mConnErr: "bağlantı hatası: {0}",
      mConnLost: "bağlantı koptu",
      mTimeout: "sunucudan yanıt yok (zaman aşımı)",
      mTooMuch: "sunucudan aşırı büyük veri geldi",
      mHostReady: "hazır, arkadaşın bekleniyor (sen: Ateş)",
      mGuestJoined: "bağlandın (sen: Su)",
      mBothReady: "iki oyuncu hazır! ({0}) Bölümü ikinizden biri seçsin.",
      mPeerLeftMenu: "oyuncu ayrıldı, menüye dönüldü",
      mPeerLeft: "oyuncu ayrıldı",
      mErrPrefix: "HATA: {0}",
      mGoMissing: "bölüm bilgisi eksik, geçiş yapılamadı",
      mGoInvalid: "geçersiz bölüm adı, geçiş reddedildi",
      mGoNoClass: "bölüm sınıfı bulunamadı",
      mGoIncoming: "arkadaşın {0} ekranına geçti, sen de geçiyorsun",
      mGoError: "geçiş hatası (konsola bak)",
      mFriendDied: "arkadaşın öldü",
      mAttached: "seviyeye bağlandı ({0} nesne) - {1}",
      mAttachedHost: "Ateş: ok tuşları + W A D",
      mAttachedGuest: "Su: W A D + ok tuşları",
      mSigMismatch: "bölüm uyuşmuyor! (sen: {0} / host: {1}) Bölümü yeniden başlatın.",
      mSyncFix: "senkron düzeltmesi {0}",
      mF6NoLevel: "F6: önce bir bölüme gir",
      mF6Dump: "yapı dökümü kayda yazıldı (F6) → {0}",
      mF7Mark: "işaret kaydedildi (F7) → {0}",
      mForcing: "zorla eşitleniyor",
      mRecStarted: "kayıt başlatıldı: {0}",
      mNoFile: "dosya oluşturulamadı",
      chatPlaceholder: "Mesaj yaz...",
      chatFireName: "Ateş",
      chatWaterName: "Su"
    },
    en: {
      menuTitle: "Fire and Water",
      menuSub: "Online mod · {0}",
      closeTitle: "Close (F9)",
      stateNoConn: "Not connected",
      stateConnecting: "Connecting…",
      stateHostReady: "Ready · waiting for friend",
      stateGuestReady: "Connected · waiting for friend",
      stateHostBoth: "Fire · both players ready",
      stateGuestBoth: "Water · both players ready",
      secConn: "Connection",
      lblAddr: "Server address (IP:port of the computer on the same network)",
      btnStart: "Start",
      btnStartSub: "as Fire",
      btnJoin: "Connect",
      btnJoinSub: "as Water",
      secSet: "Settings",
      setAlt: "Both key sets",
      setAltDesc: "Arrow keys and W A D work together",
      setComp: "Latency compensation",
      setCompDesc: "Fixes jump sync for the Water player",
      setAuto: "Auto-reconnect",
      setAutoDesc: "Tries to reconnect automatically when disconnected",
      setCap: "Upload cap",
      setCapDesc: "Lower it if Discord/internet is lagging",
      capUnlimited: "Unlimited",
      capUnit: " KB/s",
      setLang: "Language / Dil",
      setLangDesc: "English / Türkçe",
      btnDisconnect: "Disconnect",
      footText:
        "<kbd>F9</kbd> / <kbd>Tab</kbd> menu &nbsp;·&nbsp; <kbd>F8</kbd> force sync (Water) &nbsp;·&nbsp; <kbd>F7</kbd> log marker",
      statusLoaded: "Online mod {0} loaded - F9: menu",
      warnMismatch: " | !! LEVEL MISMATCH",
      warnNoData: " | !! no data from host",
      warnCongested: " | !! network congested",
      warnError: " | !! ERROR: {0}",
      pingLabel: "ping {0}ms",
      txLabel: "↑ {0} KB/s",
      txAtCap: " (at cap)",
      drift: " | drift {0}m",
      mConnClosed: "connection closed",
      mConnManual: "disconnected manually",
      mReconnecting: "{0} — reconnecting in 3s...",
      mNetErr: "ERROR: could not load network module",
      mConnecting: "connecting to {0}:{1} ...",
      mConnErr: "connection error: {0}",
      mConnLost: "connection lost",
      mTimeout: "no response from server (timeout)",
      mTooMuch: "too much data from server",
      mHostReady: "ready, waiting for friend (you: Fire)",
      mGuestJoined: "connected (you: Water)",
      mBothReady: "both players ready! ({0}) Let one of you pick a level.",
      mPeerLeftMenu: "player left, returning to menu",
      mPeerLeft: "player left",
      mErrPrefix: "ERROR: {0}",
      mGoMissing: "level info missing, cannot switch",
      mGoInvalid: "invalid level name, switch rejected",
      mGoNoClass: "level class not found",
      mGoIncoming: "your friend switched to {0}, switching too",
      mGoError: "switch error (see console)",
      mFriendDied: "your friend died",
      mAttached: "attached to level ({0} bodies) - {1}",
      mAttachedHost: "Fire: arrow keys + W A D",
      mAttachedGuest: "Water: W A D + arrow keys",
      mSigMismatch: "level mismatch! (you: {0} / host: {1}) Restart the level.",
      mSyncFix: "sync fix {0}",
      mF6NoLevel: "F6: enter a level first",
      mF6Dump: "level structure dumped to log (F6) → {0}",
      mF7Mark: "marker saved (F7) → {0}",
      mForcing: "forcing sync",
      mRecStarted: "log started: {0}",
      mNoFile: "could not create file",
      chatPlaceholder: "Type a message...",
      chatFireName: "Fire",
      chatWaterName: "Water"
    }
  };

  function t(key) {
    var args = Array.prototype.slice.call(arguments, 1);
    var s = (I18N[LANG] && I18N[LANG][key]) || I18N.tr[key] || key;
    for (var i = 0; i < args.length; i++) s = s.replace("{" + i + "}", args[i]);
    return s;
  }

  // Elle "bağlantıyı kes" çağrısı için: otomatik yeniden bağlanma yapılmasın
  var MANUAL_REASON = "__manual__";

  var sock = null;
  var buf = "";
  var connected = false;
  var peerHere = false;
  var role = null;

  var level = null;
  var attached = false;
  var bodies = [];
  var sig = 0;
  var sigWarned = false;
  var snapCount = 0;
  var lastFixSay = 0;
  var forceSnapUntil = 0;
  var myOffset = 0;
  var lastMsg = "";
  var lastApplyError = "";
  var lastErrAt = 0;
  var statusAlert = false;
  var extraPre = "";
  var pingText = "";
  var pingColor = "#4f4";
  var extraPost = "";
  var altKeysOn = true;

  var lastSent = "";
  var lastSentAt = 0;
  var remoteReal = { l: 0, r: 0, u: 0 };
  var remoteHold = { l: 0, r: 0, u: 0 };
  var HOLD_MS = 70;
  var hostPulse = { l: 0, r: 0, u: 0 };
  var rtt = 0;
  var compOn = true;
  var delayMs = 0;
  var rawLocal = null;
  var inHist = [];
  var ownVertCount = 0;
  var fsMod = null;
  var logPath = "";
  var logBuf = [];
  var snapApplied = 0;
  var lastSnapAt = 0;
  var lastBeat = 0;
  var applyErrors = 0;
  var alertSig = false;
  var detailLogs = 0;
  var lastDetail = 0;
  var prevDVC = null;
  var lastRecv = 0;
  var hostSeq = 0;
  var lastSeq = -1;
  var fullAll = false;
  var lastGo = null;
  var lastPrune = 0;
  var deadCount = 0;
  var newBodyWarned = false;
  var droppedSnaps = 0;
  var snapErrors = 0;
  var logBytes = 0;
  var logWriting = false;
  var aliveSet = new Set();
  var tmpVel = null;
  var lastKayma = 0;
  var lastStatusSig = "";
  var snapSlow = false;
  var slowTick = 0;
  var snapCost = 0;
  var capKBs = 100;
  var bucket = 0;
  var bucketT = 0;
  var capped = 0;
  var txBytes = 0;
  var lastTxBytes = 0;
  var lastTxT = 0;
  var txRate = 0;

  var autoReconnect = false;
  var reconnectAddr = "";
  var reconnectRole = "";
  var reconnectTimer = null;

  var dropWin = 0;
  var dropWinStart = 0;
  var showDropWarn = false;

  var snapInterval = null;
  var fastInterval = null;

  // Chat
  var chatMessages = [];
  var chatEl = null;
  var chatInputEl = null;
  var chatOpen = false;
  var chatHideTimer = null;
  var MAX_CHAT_MSGS = 20;
  var CHAT_FADE_MS = 8000;

  var statusEl = null;
  var panelEl = null;

  function renderStatus() {
    if (!statusEl) return;
    var sg = lastMsg + "|" + extraPre + "|" + pingText + "|" + pingColor + "|" + extraPost + "|" + statusAlert;
    if (sg === lastStatusSig) return;
    lastStatusSig = sg;
    while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
    statusEl.appendChild(document.createTextNode("Online " + VERSION + ": " + lastMsg + extraPre));
    if (pingText) {
      var sp = document.createElement("span");
      sp.style.color = pingColor;
      sp.textContent = " | " + pingText;
      statusEl.appendChild(sp);
    }
    if (extraPost) statusEl.appendChild(document.createTextNode(extraPost));
    statusEl.style.background = statusAlert ? "rgba(200,0,0,.9)" : "rgba(0,0,0,.55)";
    statusEl.style.fontSize = statusAlert ? "16px" : "12px";
    updatePanelState();
  }

  function say(msg) {
    lastMsg = String(msg);
    log("durum: " + lastMsg);
    renderStatus();
    console.info("[ONLINE] " + lastMsg);
  }

  function refreshExtra() {
    var now = Date.now();
    var alert = false;
    var warn = "";
    if (role === "guest" && attached && peerHere) {
      if (alertSig) {
        alert = true;
        warn = t("warnMismatch");
      } else if (lastSnapAt && now - lastSnapAt > 800) {
        alert = true;
        warn = t("warnNoData");
      }
    }
    if (showDropWarn) {
      warn += t("warnCongested");
      alert = true;
    }
    if (attached && now - lastErrAt < 3000) {
      alert = true;
      warn += t("warnError", String(lastApplyError).slice(0, 80));
    }
    pingText = "";
    if (role === "guest" && rtt) {
      pingColor = rtt < 50 ? "#4f4" : rtt < 100 ? "#ff4" : "#f44";
      pingText = t("pingLabel", Math.round(rtt));
    }
    if (role === "host" && attached && peerHere) {
      var dtT = now - lastTxT;
      if (dtT >= 400) {
        txRate = ((txBytes - lastTxBytes) * 1000) / dtT;
        lastTxBytes = txBytes;
        lastTxT = now;
      }
      var atCap = now - capped < 1500;
      pingColor = atCap ? "#ff4" : "#4f4";
      pingText = t("txLabel", Math.round(txRate / 1024)) + (atCap ? t("txAtCap") : "");
    }
    extraPre = role === "guest" && attached ? t("drift", myOffset.toFixed(2)) : "";
    extraPost = warn;
    statusAlert = alert;
    renderStatus();
  }

  /* ---------------- Kayıt dosyası (tanı) ---------------- */

  function initLog() {
    try {
      fsMod = window.nodeRequire("fs");
      var path = window.nodeRequire("path");
      var os = window.nodeRequire("os");
      var dirs = [path.join(os.homedir(), "Desktop"), os.homedir(), os.tmpdir()];
      for (var i = 0; i < dirs.length; i++) {
        try {
          var f = path.join(dirs[i], "fbwg-online-log.txt");
          fsMod.writeFileSync(f, "Ates ve Su online mod " + VERSION + " kayit dosyasi - " + new Date().toString() + "\n");
          logPath = f;
          break;
        } catch (e) {}
      }
    } catch (e) {}
    if (logPath) console.info("[ONLINE] kayıt dosyası: " + logPath);
  }

  function log(msg) {
    logBuf.push(new Date().toISOString().slice(11, 23) + " [" + (role || "-") + "] " + msg);
    if (logBuf.length > 4000) logBuf.splice(0, 2000);
  }

  function flushLog() {
    if (!logPath || !logBuf.length || logWriting) return;
    if (logBytes > LOG_MAX_BYTES) {
      logBuf = [];
      return;
    }
    var lines = logBuf;
    logBuf = [];
    var text = lines.join("\n") + "\n";
    logBytes += text.length;
    if (logBytes > LOG_MAX_BYTES) text += "KAYIT SINIRI DOLDU - daha fazla yazilmiyor\n";
    var restore = function () {
      logBytes -= text.length;
      logBuf = lines.concat(logBuf);
      if (logBuf.length > 4000) logBuf.splice(0, logBuf.length - 2000);
    };
    logWriting = true;
    try {
      fsMod.appendFile(logPath, text, function (err) {
        logWriting = false;
        if (err) restore();
      });
    } catch (e) {
      logWriting = false;
      restore();
    }
  }

  function posOf(ch) {
    try {
      var p = ch.body.data.GetPosition();
      return "(" + p.x.toFixed(2) + "," + p.y.toFixed(2) + ")";
    } catch (e) {
      return "(?)";
    }
  }

  function nidOf(ch) {
    try {
      return ch.body.data.__nid;
    } catch (e) {
      return "?";
    }
  }

  function describeNow() {
    if (!level) return "seviye yok";
    return (
      "ateş=" + posOf(level.pers1) + " su=" + posOf(level.pers2) +
      " attached=" + attached + " sig=" + sig + " snaps=" + snapApplied + " rtt=" + Math.round(rtt)
    );
  }

  function nowMs() {
    return window.performance && performance.now ? performance.now() : Date.now();
  }

  function r2(v) {
    return Math.round(v * 100) / 100;
  }

  function r3(v) {
    return Math.round(v * 1000) / 1000;
  }

  function getGame() {
    return window.Phaser && window.Phaser.GAMES && window.Phaser.GAMES[0];
  }

  /* ---------------- Ağ ---------------- */

  function send(obj) {
    if (sock && !sock.destroyed) {
      var line = JSON.stringify(obj) + "\n";
      sock.write(line);
      txBytes += line.length;
      return line.length;
    }
    return 0;
  }

  function setNoBlurPause(on) {
    try {
      var g = getGame();
      if (!g || !g.stage) return;
      if (on) {
        if (prevDVC === null) prevDVC = g.stage.disableVisibilityChange;
        g.stage.disableVisibilityChange = true;
      } else if (prevDVC !== null) {
        g.stage.disableVisibilityChange = prevDVC;
        prevDVC = null;
      }
    } catch (e) {}
  }

  function disconnect(reason, manual) {
    setNoBlurPause(false);
    stopGameIntervals();
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    if (sock) {
      try {
        sock.destroy();
      } catch (e) {}
    }
    sock = null;
    connected = false;
    peerHere = false;
    attached = false;
    role = null;
    buf = "";
    clearChat();
    var msg = (reason === MANUAL_REASON) ? t("mConnManual") : (reason || t("mConnClosed"));
    if (autoReconnect && reconnectAddr && reconnectRole && !manual && reason !== MANUAL_REASON) {
      say(t("mReconnecting", msg));
      reconnectTimer = setTimeout(function () {
        if (!connected) connect(reconnectAddr, reconnectRole);
      }, 3000);
    } else {
      say(msg);
    }
  }

  function connect(addr, wantedRole) {
    reconnectAddr = addr;
    reconnectRole = wantedRole;
    if (sock) disconnect();
    var net;
    try {
      net = window.nodeRequire("net");
    } catch (e) {
      say(t("mNetErr"));
      return;
    }
    var parts = String(addr).trim().split(":");
    var host = parts[0] || "127.0.0.1";
    var port = parseInt(parts[1] || "7777", 10);

    lastRecv = Date.now();
    lastSeq = -1;
    hostSeq = 0;
    say(t("mConnecting", host, port));
    sock = net.connect(port, host, function () {
      sock.setNoDelay(true);
      send({ t: wantedRole === "host" ? "host" : "join", ver: VERSION });
    });

    sock.setEncoding("utf8");
    sock.on("data", function (chunk) {
      lastRecv = Date.now();
      buf += chunk;
      if (buf.length > 2000000) {
        disconnect(t("mTooMuch"));
        return;
      }
      var msgs = [];
      var i;
      while ((i = buf.indexOf("\n")) >= 0) {
        var line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line) continue;
        try {
          msgs.push(JSON.parse(line));
        } catch (e) {}
      }
      if (role === "guest") msgs = coalesceSnaps(msgs);
      for (var k = 0; k < msgs.length; k++) {
        try {
          onMessage(msgs[k]);
        } catch (e) {
          console.error("[ONLINE] mesaj hatası", e);
          log("MESAJ HATASI: " + (e && e.stack ? e.stack : e));
        }
      }
    });

    sock.on("error", function (e) {
      disconnect(t("mConnErr", (e && e.code ? e.code : e)));
    });
    sock.on("close", function () {
      if (sock) disconnect(t("mConnLost"));
    });
  }

  function onMessage(m) {
    switch (m.t) {
      case "ok":
        role = m.role;
        connected = true;
        lastSeq = -1;
        hostSeq = 0;
        setNoBlurPause(true);
        startGameIntervals();
        say(role === "host" ? t("mHostReady") : t("mGuestJoined"));
        break;
      case "peer":
        peerHere = true;
        say(t("mBothReady", role === "host" ? t("chatFireName") : t("chatWaterName")));
        lastSeq = -1;
        if (role === "host") {
          fullAll = true;
          if (lastGo) send({ t: "go", s: lastGo.s, w: lastGo.w, c: lastGo.c, p: lastGo.p });
        }
        break;
      case "gone":
        peerHere = false;
        releaseRemote();
        if (role === "guest") {
          applyGo({ s: "menu", w: 1, c: 0 });
          disconnect(MANUAL_REASON, true);
          say(t("mPeerLeftMenu"));
        } else {
          say(t("mPeerLeft"));
        }
        break;
      case "err":
        disconnect(t("mErrPrefix", m.msg));
        break;
      case "in":
        if (role === "host") onRemoteInput(m);
        break;
      case "ping":
        if (role === "host") send({ t: "pong", ts: m.ts });
        break;
      case "pong":
        if (role === "guest") {
          var rr = Date.now() - m.ts;
          if (rr >= 0 && rr < 2000) {
            rtt = rtt ? rtt * 0.8 + rr * 0.2 : rr;
            delayMs = compOn ? Math.min(80, rtt / 2 + 6) : 0;
          }
        }
        break;
      case "hb":
        break;
      case "rs":
        if (role === "host") fullAll = true;
        break;
      case "snap":
        if (role === "guest") applySnapshot(m);
        break;
      case "go":
        applyGo(m);
        break;
      case "over":
        applyOver(m);
        break;
      case "ev":
        if (role === "host") onRemoteEvent(m);
        break;
      case "chat":
        if (typeof m.msg === "string" && m.msg.length <= 200) {
          addChatMessage(role === "host" ? "guest" : "host", m.msg);
        }
        break;
    }
  }

  /* ---------------- Yardımcılar ---------------- */

  function mergeSnaps(a, b) {
    var map = {};
    var order = [];
    [a.b, b.b].forEach(function (arr) {
      for (var i = 0; i < arr.length; i++) {
        var e = arr[i];
        if (!(e[0] in map)) order.push(e[0]);
        map[e[0]] = e;
      }
    });
    var res = [];
    for (var j = 0; j < order.length; j++) res.push(map[order[j]]);
    return { t: "snap", n: b.n, sig: b.sig, f: b.f, i: b.i, b: res };
  }

  function coalesceSnaps(msgs) {
    var out = [];
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i];
      var prev = out.length ? out[out.length - 1] : null;
      if (
        m && m.t === "snap" && prev && prev.t === "snap" &&
        prev.sig === m.sig && prev.f === m.f && Array.isArray(prev.b) && Array.isArray(m.b)
      ) {
        out[out.length - 1] = mergeSnaps(prev, m);
      } else {
        out.push(m);
      }
    }
    return out;
  }

  function heartbeat() {
    if (!sock) return;
    if (connected) send({ t: "hb" });
    if (Date.now() - lastRecv > HB_TIMEOUT_MS) disconnect(t("mTimeout"));
  }

  function startGameIntervals() {
    if (!snapInterval) snapInterval = setInterval(hostSendSnapshot, SNAP_MS);
    if (!fastInterval) fastInterval = setInterval(fastTick, FAST_MS);
  }

  function stopGameIntervals() {
    if (snapInterval) { clearInterval(snapInterval); snapInterval = null; }
    if (fastInterval) { clearInterval(fastInterval); fastInterval = null; }
  }

  function onRemoteEvent(m) {
    if (m.ev === "jump") {
      var now = Date.now();
      remoteReal.u = 1;
      remoteHold.u = now + 120;
      applyRemoteInputOnHost();
      log("EV jump alındı");
    }
  }

  // F6: oyunun Level nesnesinin yapısını kayda yaz
  function dumpLevelStructure() {
    var g = getGame();
    if (!g || !g.level) {
      say(t("mF6NoLevel"));
      return;
    }
    var lv = g.level;
    try {
      log("=== F6 YAPI DÖKÜMÜ === sınıf=" + (lv.constructor && lv.constructor.name) + " state=" + (g.state && g.state.current));
      var keys = Object.keys(lv);
      for (var i = 0; i < keys.length && i < 250; i++) {
        var k = keys[i];
        var d;
        try {
          var v = lv[k];
          d = typeof v;
          if (v && typeof v === "object") {
            d += " " + (v.constructor && v.constructor.name);
            if (Array.isArray(v)) {
              d += " len=" + v.length;
              if (v.length && v[0] && typeof v[0] === "object") d += " elem0=" + (v[0].constructor && v[0].constructor.name);
            } else if (v.children && v.children.length !== undefined) {
              d += " children=" + v.children.length;
            }
          }
        } catch (e) {
          d = "okunamadı";
        }
        log("  ." + k + ": " + d);
      }
      var proto = Object.getPrototypeOf(lv);
      var depth = 0;
      while (proto && proto !== Object.prototype && depth < 3) {
        log("  prototip[" + depth + "] " + (proto.constructor && proto.constructor.name) + ": " + Object.getOwnPropertyNames(proto).join(", "));
        proto = Object.getPrototypeOf(proto);
        depth++;
      }
      [["pers1", lv.pers1], ["pers2", lv.pers2]].forEach(function (x) {
        if (x[1]) log("  " + x[0] + " anahtarları: " + Object.keys(x[1]).join(", "));
      });
      log("  g.currentTemple: " + (g.currentTemple ? Object.keys(g.currentTemple).join(", ") : "yok"));
      try {
        dumpDeep(lv, g);
      } catch (e) {
        log("F6 derin döküm HATA: " + (e && e.stack ? e.stack : e));
      }
      log("=== F6 DÖKÜM SONU ===");
      flushLog();
      say(t("mF6Dump", logPath || t("mNoFile")));
    } catch (e) {
      log("F6 HATA: " + e);
    }
  }

  var DUMP_RE = /collect|diamond|gem|coin|button|press|lever|switch|pull|toggle|activat|trigger|door|open|close|contact|touch|hit|begin|end|reset|state|exit|finish|score/i;

  function fnSrc(f, n) {
    try {
      return String(f).replace(/\s+/g, " ").slice(0, n);
    } catch (e) {
      return "?";
    }
  }

  function isPhaserClass(proto) {
    try {
      var nm = proto.constructor && proto.constructor.name;
      return !!(nm && window.Phaser && window.Phaser[nm] === proto.constructor);
    } catch (e) {
      return false;
    }
  }

  function dumpMethods(obj, label, maxFns, maxLen) {
    var proto = obj;
    var depth = 0;
    var shown = 0;
    var seen = {};
    while (proto && proto !== Object.prototype && depth < 4) {
      if (depth > 0 && isPhaserClass(proto)) break;
      var names = Object.getOwnPropertyNames(proto);
      for (var i = 0; i < names.length; i++) {
        var nm = names[i];
        if (nm === "constructor" || seen[nm]) continue;
        var d = Object.getOwnPropertyDescriptor(proto, nm);
        if (!d || typeof d.value !== "function") continue;
        seen[nm] = 1;
        if (DUMP_RE.test(nm) && shown < maxFns) {
          shown++;
          log("    " + label + "." + nm + "(): " + fnSrc(d.value, maxLen));
        }
      }
      proto = Object.getPrototypeOf(proto);
      depth++;
    }
  }

  function brief(y) {
    var t2 = typeof y;
    if (y && t2 === "object") return t2 + ":" + (y.constructor && y.constructor.name);
    if (t2 === "number" || t2 === "boolean" || t2 === "string") return t2 + "=" + String(y).slice(0, 24);
    return t2;
  }

  function dumpList(name, list) {
    var e0 = list[0];
    if (!e0 || typeof e0 !== "object") return;
    var cn = (e0.constructor && e0.constructor.name) || "?";
    log("  [liste] " + name + " uzunluk=" + list.length + " eleman=" + cn);
    var ks = [];
    var keys = Object.keys(e0);
    for (var i = 0; i < keys.length && i < 160; i++) {
      try {
        ks.push(keys[i] + "(" + brief(e0[keys[i]]) + ")");
      } catch (e) {}
    }
    log("    anahtarlar: " + ks.join(", "));
    dumpMethods(e0, cn, 14, 700);
    for (var j = 0; j < list.length && j < 3; j++) {
      try {
        var el = list[j];
        var bp = el.body && el.body.data && el.body.data.GetPosition ? el.body.data.GetPosition() : null;
        log("    #" + j + " x=" + el.x + " y=" + el.y + (bp ? " gövde=(" + bp.x.toFixed(2) + "," + bp.y.toFixed(2) + ")" : "") + " nid=" + (el.body && el.body.data ? el.body.data.__nid : "-"));
      } catch (e) {}
    }
  }

  function dumpDeep(lv, g) {
    var keys = Object.keys(lv);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k === "pers1" || k === "pers2") continue;
      var v;
      try {
        v = lv[k];
      } catch (e) {
        continue;
      }
      if (!v || typeof v !== "object") continue;
      try {
        if (Array.isArray(v) && v.length) dumpList("level." + k, v);
        else if (Array.isArray(v.children) && v.children.length) dumpList("level." + k + ".children", v.children);
        else if (v.constructor === Object) {
          var sub = Object.keys(v);
          for (var j = 0; j < sub.length && j < 40; j++) {
            var sv = v[sub[j]];
            if (Array.isArray(sv) && sv.length) dumpList("level." + k + "." + sub[j], sv);
          }
        }
      } catch (e) {
        log("  liste hatası " + k + ": " + e);
      }
    }
    log("  --- Level sınıfı fonksiyonları ---");
    dumpMethods(lv, "Level", 45, 900);
    try {
      var w = g.physics.box2d.world;
      var cm = w.m_contactManager || w.contactManager;
      var cl = cm && (cm.m_contactListener || cm.contactListener);
      if (cl) {
        log("  temas dinleyicisi anahtarları: " + Object.keys(cl).join(", "));
        dumpMethods(cl, "ContactListener", 10, 1500);
      } else {
        log("  temas dinleyicisi bulunamadı");
      }
    } catch (e) {
      log("  temas dinleyicisi hatası: " + e);
    }
    try {
      if (lv.pers1 && lv.pers1.body) log("  pers1.body anahtarları: " + Object.keys(lv.pers1.body).slice(0, 80).join(", "));
      dumpMethods(lv.pers1, "Pers1", 10, 600);
    } catch (e) {}
    try {
      if (lv.levelData) {
        log("  levelData anahtarları: " + Object.keys(lv.levelData).join(", "));
        log("  levelData (ilk 3000 karakter): " + JSON.stringify(lv.levelData).slice(0, 3000));
      }
    } catch (e) {}
  }

  /* ---------------- Bölüm / menü geçişlerini eşitle ---------------- */

  function cloneParams(p) {
    if (p === undefined || p === null) return null;
    try {
      return JSON.parse(JSON.stringify(p));
    } catch (e) {
      return null;
    }
  }

  function getStateClass(g, name) {
    var mod = STATE_MODULES[name];
    try {
      if (mod && window.requirejs && window.requirejs.defined(mod)) {
        return window.requirejs(mod);
      }
    } catch (e) {}
    var st = g.state.states[name];
    return st ? st.constructor : null;
  }

  function hookGame(g) {
    if (!g.state || typeof g.state.fade !== "function" || g.state.__onlOrigFade) return;
    var orig = g.state.fade;
    g.state.__onlOrigFade = orig;
    g.state.fade = function (name, clearWorld, clearCache, params) {
      try {
        if (SYNC_STATES[name] && !this.fading) {
          lastGo = { s: name, w: clearWorld ? 1 : 0, c: clearCache ? 1 : 0, p: cloneParams(params) };
          if (connected && peerHere) send({ t: "go", s: lastGo.s, w: lastGo.w, c: lastGo.c, p: lastGo.p });
        }
      } catch (e) {
        console.error("[ONLINE] go gönderme hatası", e);
      }
      return orig.apply(this, arguments);
    };
    console.info("[ONLINE] geçiş kancası takıldı");
  }

  function applyGo(m) {
    var g = getGame();
    if (!g || !g.state || !g.state.__onlOrigFade) return;
    var name = m.s;
    if (!SYNC_STATES[name]) return;
    if (g.state.fading) return;
    try {
      if (g.state.current === "level" && g.level) {
        try {
          if (g.level.sounds && g.level.sounds.levelMusic) g.level.sounds.levelMusic.stop();
        } catch (e) {}
        try {
          g.level.killAll();
        } catch (e) {}
      }

      var params = m.p;
      if (name === "level") {
        if (!params || !params.filename) {
          say(t("mGoMissing"));
          return;
        }
        if (!SAFE_NAME.test(String(params.filename)) || String(params.filename).indexOf("..") >= 0) {
          say(t("mGoInvalid"));
          log("GO REDDEDİLDİ filename=" + params.filename);
          return;
        }
        var cls = getStateClass(g, "level");
        if (!cls) {
          say(t("mGoNoClass"));
          return;
        }
        g.state.add("level", cls);
      } else if (name === "levelMenu") {
        if (!g.state.states.levelMenu) {
          var cls2 = getStateClass(g, "levelMenu");
          if (cls2) g.state.add("levelMenu", cls2);
        }
        if (!params) params = g.currentTemple;
      } else {
        params = undefined;
      }

      lastGo = { s: name, w: m.w ? 1 : 0, c: m.c ? 1 : 0, p: cloneParams(params) };
      say(t("mGoIncoming", name));
      log("GO uygulandı: " + name + " " + (params && params.filename ? params.filename : ""));
      g.state.__onlOrigFade.call(g.state, name, !!m.w, !!m.c, params);
    } catch (e) {
      console.error("[ONLINE] geçiş uygulama hatası", e);
      say(t("mGoError"));
    }
  }

  /* ---------------- Ölüm eşitleme ---------------- */

  function hookLevel(lv) {
    if (lv.__onlHooked || typeof lv.gameOver !== "function") return;
    lv.__onlHooked = true;
    var og = lv.gameOver;
    lv.gameOver = function () {
      try {
        if (connected && peerHere && !lv.__onlRemoteOver && lv.pers1 && lv.pers2) {
          send({
            t: "over",
            d: [
              lv.pers1.isDead || lv.pers1.dying ? 1 : 0,
              lv.pers2.isDead || lv.pers2.dying ? 1 : 0,
            ],
          });
        }
      } catch (e) {
        console.error("[ONLINE] over gönderme hatası", e);
      }
      return og.apply(this, arguments);
    };
  }

  function applyOver(m) {
    var lv = level;
    if (!lv || lv.ended || !lv.pers1 || !lv.pers2) return;
    lv.__onlRemoteOver = true;
    var d = m.d || [];
    lv.pers1.__onlAllowKill = true;
    lv.pers2.__onlAllowKill = true;
    try {
      if (d[0] && !lv.pers1.dying) lv.pers1.kill();
      if (d[1] && !lv.pers2.dying) lv.pers2.kill();
    } finally {
      lv.pers1.__onlAllowKill = false;
      lv.pers2.__onlAllowKill = false;
    }
    say(t("mFriendDied"));
    log("OVER uygulandı d=" + JSON.stringify(d));
  }

  /* ---------------- Seviyeye bağlanma ---------------- */

  function setRemoteKeys(cursors, l, r, u) {
    cursors.left.isDown = !!l;
    cursors.right.isDown = !!r;
    cursors.up.isDown = !!u;
  }

  function releaseRemote() {
    remoteReal = { l: 0, r: 0, u: 0 };
    remoteHold = { l: 0, r: 0, u: 0 };
    if (attached && level) {
      var ch = role === "host" ? level.pers2 : level.pers1;
      if (ch && ch.cursors) setRemoteKeys(ch.cursors, 0, 0, 0);
    }
  }

  function onRemoteInput(m) {
    var now = Date.now();
    ["l", "r", "u"].forEach(function (k) {
      remoteReal[k] = m[k] ? 1 : 0;
      if (m[k]) remoteHold[k] = now + HOLD_MS;
    });
    applyRemoteInputOnHost();
  }

  function applyRemoteInputOnHost() {
    if (!attached || !level || !level.pers2) return;
    var now = Date.now();
    setRemoteKeys(
      level.pers2.cursors,
      remoteReal.l || now < remoteHold.l,
      remoteReal.r || now < remoteHold.r,
      remoteReal.u || now < remoteHold.u
    );
  }

  function combineKeys(primary, extra) {
    return {
      get isDown() {
        return !!primary.isDown || (altKeysOn && !!extra.isDown);
      },
      set isDown(v) {},
    };
  }

  function delayedKey(name, rawObj) {
    return {
      get isDown() {
        if (!compOn || delayMs < 2 || inHist.length === 0) return !!rawObj.isDown;
        var target = Date.now() - delayMs;
        for (var i = inHist.length - 1; i >= 0; i--) {
          if (inHist[i].t <= target) return !!inHist[i][name];
        }
        return !!inHist[0][name];
      },
      set isDown(v) {},
    };
  }

  function installAltKeys(g, lv) {
    var local = role === "host" ? lv.pers1 : lv.pers2;
    var c = local && local.cursors;
    if (!c || c.__onlAlt) return;
    c.__onlAlt = true;
    try {
      var kb = g.input.keyboard;
      var alt = role === "host" ? ["KeyA", "KeyD", "KeyW"] : ["ArrowLeft", "ArrowRight", "ArrowUp"];
      c.left = combineKeys(c.left, kb.addKey(alt[0]));
      c.right = combineKeys(c.right, kb.addKey(alt[1]));
      c.up = combineKeys(c.up, kb.addKey(alt[2]));
    } catch (e) {
      console.error("[ONLINE] ek tuşlar eklenemedi", e);
    }
    if (role === "guest") {
      rawLocal = { left: c.left, right: c.right, up: c.up };
      inHist = [];
      c.left = delayedKey("l", rawLocal.left);
      c.right = delayedKey("r", rawLocal.right);
      c.up = delayedKey("u", rawLocal.up);
    }
  }

  function attach(g, lv) {
    var world = g.physics.box2d.world;
    bodies = [];
    var b = world.GetBodyList();
    var n = 0;
    while (b) {
      b.__nid = n;
      var p = b.GetPosition();
      b.__onlLast = [p.x, p.y, b.GetAngle()];
      bodies[n] = b;
      n++;
      b = b.GetNext();
    }
    sig = n;
    sigWarned = false;
    newBodyWarned = false;
    deadCount = 0;
    lastPrune = 0;
    alertSig = false;
    lastSnapAt = 0;
    snapCount = 0;

    var remoteChar = role === "host" ? lv.pers2 : lv.pers1;
    remoteChar.cursors.left = { isDown: false };
    remoteChar.cursors.right = { isDown: false };
    remoteChar.cursors.up = { isDown: false };

    if (role === "guest") {
      [lv.pers1, lv.pers2].forEach(function (ch) {
        if (ch && !ch.__onlKillHooked && typeof ch.kill === "function") {
          ch.__onlKillHooked = true;
          var okill = ch.kill;
          ch.kill = function () {
            if (this.__onlAllowKill) return okill.apply(this, arguments);
          };
        }
      });
    }

    installAltKeys(g, lv);

    attached = true;
    detailLogs = 0;
    lastDetail = 0;
    if (role === "guest") send({ t: "rs" });
    try {
      var bb = lv.pers2.body.data;
      log(
        "YÖNTEMLER SetTransformXYRadians=" + typeof bb.SetTransformXYRadians + " SetTransformXY=" + typeof bb.SetTransformXY +
          " box2d=" + typeof window.box2d +
          " türSu=" + bb.GetType() + " türAteş=" + lv.pers1.body.data.GetType()
      );
    } catch (e) {
      log("YÖNTEMLER okunamadı: " + e);
    }
    try {
      var tb = lv.pers1.body.data;
      var tp = tb.GetPosition();
      setTransform(tb, tp.x, tp.y, tb.GetAngle());
      log("SELFTEST konum ayarlama: TAMAM");
    } catch (e) {
      lastApplyError = "selftest: " + (e && e.message ? e.message : e);
      lastErrAt = Date.now();
      log("SELFTEST konum ayarlama: HATA " + (e && e.stack ? e.stack : e));
    }
    log("ATTACH seviye=" + levelName() + " nesne=" + n + " ateşNid=" + nidOf(lv.pers1) + " suNid=" + nidOf(lv.pers2));
    if (role === "host") applyRemoteInputOnHost();
    say(t("mAttached", n, role === "host" ? t("mAttachedHost") : t("mAttachedGuest")));
  }

  function checkLevel() {
    var g = getGame();
    if (!g) return;
    hookGame(g);
    if (connected) setNoBlurPause(true);
    if (!g.level) return;
    if (g.level !== level) {
      level = g.level;
      attached = false;
    }
    hookLevel(level);
    if (
      connected &&
      peerHere &&
      !attached &&
      level.pers1 &&
      level.pers2 &&
      g.physics &&
      g.physics.box2d &&
      g.physics.box2d.world &&
      g.physics.box2d.paused === false
    ) {
      attach(g, level);
    }
  }

  /* ---------------- Host: konum gönder ---------------- */

  function levelName() {
    return level && level.levelData && level.levelData.filename ? level.levelData.filename : "";
  }

  function pruneDead() {
    var now = Date.now();
    if (now - lastPrune < 100) return;
    lastPrune = now;
    var g = getGame();
    var world = g && g.physics && g.physics.box2d && g.physics.box2d.world;
    if (!world || !bodies.length) return;
    var alive = aliveSet;
    alive.clear();
    var wb = world.GetBodyList();
    while (wb) {
      alive.add(wb);
      wb = wb.GetNext();
    }
    var removed = 0;
    var nonNull = 0;
    for (var i = 0; i < bodies.length; i++) {
      if (bodies[i] && !alive.has(bodies[i])) {
        bodies[i] = null;
        removed++;
      }
      if (bodies[i]) nonNull++;
    }
    if (removed) {
      deadCount += removed;
      log("PRUNE: " + removed + " gövde dünyadan silinmiş, eşlemeden düşürüldü (toplam " + deadCount + ")");
    }
    if (alive.size > nonNull && !newBodyWarned) {
      newBodyWarned = true;
      log("UYARI: dünyada eşlenmemiş yeni gövde var (sonradan oluşturulmuş) alive=" + alive.size + " eşli=" + nonNull);
    }
  }

  function hostSendSnapshot() {
    if (role !== "host" || !attached || !peerHere || !level) return;
    if (sock && typeof sock.writableLength === "number" && sock.writableLength > BACKLOG_LIMIT) {
      droppedSnaps++;
      var now2 = Date.now();
      if (now2 - dropWinStart >= 1000) {
        showDropWarn = dropWin > 5;
        dropWin = 0;
        dropWinStart = now2;
      }
      dropWin++;
      if (droppedSnaps % 100 === 1) log("ağ tıkalı: snapshot atlandı (toplam " + droppedSnaps + ")");
      return;
    }
    showDropWarn = false;
    if (snapSlow && (++slowTick & 1)) return;
    if (capKBs > 0) {
      var tb = nowMs();
      bucket = Math.min(capKBs * 256, bucket + (tb - bucketT) * capKBs * 1.024);
      bucketT = tb;
      if (bucket < 0) {
        capped = Date.now();
        return;
      }
    }
    var t0 = nowMs();
    pruneDead();
    var sent = 0;
    try {
      sent = hostSendSnapshotInner() || 0;
    } catch (e) {
      snapErrors++;
      if (snapErrors <= 8) log("hostSendSnapshot HATA: " + (e && e.stack ? e.stack : e));
    }
    if (capKBs > 0) bucket -= sent;
    var cost = nowMs() - t0;
    snapCost = snapCost ? snapCost * 0.9 + cost * 0.1 : cost;
    if (!snapSlow && snapCost > 3.5) {
      snapSlow = true;
      log("YAVAŞ MOD AÇILDI: snapshot maliyeti " + snapCost.toFixed(1) + "ms, 15Hz'e düşüldü");
    } else if (snapSlow && snapCost < 1.5) {
      snapSlow = false;
      log("YAVAŞ MOD KAPANDI: snapshot maliyeti " + snapCost.toFixed(1) + "ms");
    }
  }

  function hostSendSnapshotInner() {
    snapCount++;
    var all = fullAll;
    fullAll = false;
    var full = all || snapCount % 40 === 0;
    var out = [];
    var p1b = level.pers1 && level.pers1.body && level.pers1.body.data;
    var p2b = level.pers2 && level.pers2.body && level.pers2.body.data;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      if (!b) continue;
      var p = b.GetPosition();
      var ang = b.GetAngle();
      if (b.GetType() === BODY_STATIC) {
        var last = b.__onlLast;
        var moved =
          !last ||
          Math.abs(last[0] - p.x) > 0.0005 ||
          Math.abs(last[1] - p.y) > 0.0005 ||
          Math.abs(last[2] - ang) > 0.0005;
        if (moved) {
          b.__onlLast = [p.x, p.y, ang];
          out.push([i, r3(p.x), r3(p.y), r3(ang), 0, 0, 0]);
        } else if (full && (all || b.__onlEverMoved)) {
          out.push([i, r3(p.x), r3(p.y), r3(ang), 0, 0, 0]);
        }
        if (moved) b.__onlEverMoved = true;
        continue;
      }
      if (b.IsAwake && !b.IsAwake() && b !== p1b && b !== p2b) {
        if (b.__onlSleepSent && !full) continue;
        b.__onlSleepSent = true;
      } else {
        b.__onlSleepSent = false;
      }
      var v = b.GetLinearVelocity();
      out.push([i, r3(p.x), r3(p.y), r3(ang), r2(v.x), r2(v.y), r2(b.GetAngularVelocity())]);
    }
    var nowH = Date.now();
    if (nowH - lastBeat > 1000) {
      lastBeat = nowH;
      log("H ateş=" + posOf(level.pers1) + " su=" + posOf(level.pers2) + " gönderilen=" + out.length);
    }
    var c = level.pers1.cursors;
    var sentBytes = send({
      t: "snap",
      n: ++hostSeq,
      sig: sig,
      f: levelName(),
      i: [
        c.left.isDown || hostPulse.l ? 1 : 0,
        c.right.isDown || hostPulse.r ? 1 : 0,
        c.up.isDown || hostPulse.u ? 1 : 0,
      ],
      b: out,
    });
    hostPulse = { l: 0, r: 0, u: 0 };
    return sentBytes;
  }

  /* ---------------- Guest: konum uygula ---------------- */

  function setTransform(b, x, y, a) {
    if (b.SetTransformXYRadians) b.SetTransformXYRadians(x, y, a);
    else if (b.SetTransformXY) b.SetTransformXY(x, y, a);
    else throw new Error("konum ayarlama fonksiyonu bulunamadı");
  }

  function applySnapshot(m) {
    if (!attached || !level) return;
    if (typeof m.n === "number") {
      if (m.n <= lastSeq) return;
      lastSeq = m.n;
    }
    pruneDead();
    var myName = levelName();
    if (m.sig !== sig || (m.f && myName && m.f !== myName)) {
      if (!sigWarned) {
        say(t("mSigMismatch", String(myName).slice(0, 60), String(m.f).slice(0, 60)));
        log("SIG UYUŞMAZLIĞI sen=" + sig + "/" + myName + " host=" + m.sig + "/" + m.f);
        sigWarned = true;
      }
      alertSig = true;
      return;
    }
    sigWarned = false;
    alertSig = false;

    setRemoteKeys(level.pers1.cursors, m.i[0], m.i[1], m.i[2]);
    var mine = level.pers2 && level.pers2.body && level.pers2.body.data;
    var B2Vec2 = window.box2d.b2Vec2;
    if (!tmpVel) { try { tmpVel = new B2Vec2(0, 0); } catch (e) { tmpVel = null; } }
    var mc = rawLocal || (level.pers2 && level.pers2.cursors);
    var idle = !(mc && (mc.left.isDown || mc.right.isDown || mc.up.isDown));
    var forced = Date.now() < forceSnapUntil;
    var lead = EXTRAP_ON ? Math.min(0.15, rtt / 2000 + 0.01) : 0;
    var fixes = 0;
    var worst = "";
    var fbBody = level.pers1 && level.pers1.body && level.pers1.body.data;
    var ownLog = null;
    var fbLog = null;

    for (var k = 0; k < m.b.length; k++) {
      var e = m.b[k];
      try {
      var b = bodies[e[0]];
      if (!b) continue;
      var isStatic = b.GetType() === BODY_STATIC;
      var p = b.GetPosition();
      var px0 = p.x;
      var py0 = p.y;
      var tx = e[1];
      var ty = e[2];
      if (!isStatic && lead) {
        tx += e[4] * lead;
        ty += e[5] * lead;
      }
      var dx = tx - p.x;
      var dy = ty - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var da = e[3] - b.GetAngle();
      da = Math.atan2(Math.sin(da), Math.cos(da));

      var isMine = b === mine;
      if (isMine) myOffset = dist;
      var snap;
      if (isMine) {
        if (Math.abs(dy) > 0.35) ownVertCount++;
        else ownVertCount = 0;
        snap = forced || dist > 0.5 || ownVertCount >= 2 || Math.abs(dy) > 1.2;
        if (snap) ownVertCount = 0;
      } else {
        snap = forced || dist > 0.7;
      }
      var f = isStatic || snap ? 1 : isMine ? (idle ? 0.45 : 0.25) : 0.5;

      if (!snap && dist < 0.005 && da < 0.005 && da > -0.005) {
        if (isMine) ownLog = [px0, py0, e[1], e[2]];
        if (b === fbBody) fbLog = [px0, py0, e[1], e[2]];
        continue;
      }

      setTransform(b, p.x + dx * f, p.y + dy * f, b.GetAngle() + da * f);

      if (!isStatic && (!isMine || snap)) {
        if (tmpVel && tmpVel.Set) {
          tmpVel.Set(e[4], e[5]);
          b.SetLinearVelocity(tmpVel);
        } else {
          b.SetLinearVelocity(new B2Vec2(e[4], e[5]));
        }
        b.SetAngularVelocity(e[6]);
      }
      if (!isStatic && b.SetAwake) b.SetAwake(true);

      if (snap && !isStatic && !forced) {
        fixes++;
        worst = "#" + e[0] + (isMine ? " (sen)" : "") + " " + dist.toFixed(1) + "m";
      }
      if (isMine) ownLog = [px0, py0, e[1], e[2]];
      if (b === fbBody) fbLog = [px0, py0, e[1], e[2]];
      } catch (err) {
        applyErrors++;
        lastApplyError = err && err.message ? err.message : String(err);
        lastErrAt = Date.now();
        if (applyErrors <= 8) log("applySnapshot HATA nesne#" + e[0] + ": " + (err && err.stack ? err.stack : err));
      }
    }

    snapApplied++;
    lastSnapAt = Date.now();
    if (detailLogs < 3 || lastSnapAt - lastDetail > 10000) {
      detailLogs++;
      lastDetail = lastSnapAt;
      var idxs = [];
      for (var q = 0; q < m.b.length; q++) idxs.push(m.b[q][0]);
      log(
        "SNAP DETAY giren=" + m.b.length + " [" + idxs.join(",") + "]" +
          " suGövde=" + (mine ? "var,nid=" + mine.__nid : "YOK") +
          " ateşGövde=" + (fbBody ? "var,nid=" + fbBody.__nid : "YOK") +
          " suEşleşti=" + (ownLog ? "evet" : "HAYIR") + " ateşEşleşti=" + (fbLog ? "evet" : "HAYIR") +
          " hataSayısı=" + applyErrors + " paused=" + (getGame() && getGame().paused)
      );
    }
    var bigErr = false;
    if (ownLog) bigErr = Math.hypot(ownLog[0] - ownLog[2], ownLog[1] - ownLog[3]) > 0.5;
    if (fbLog && Math.hypot(fbLog[0] - fbLog[2], fbLog[1] - fbLog[3]) > 0.5) bigErr = true;
    if ((bigErr && lastSnapAt - lastKayma > 500) || lastSnapAt - lastBeat > 1000) {
      if (bigErr) lastKayma = lastSnapAt;
      lastBeat = lastSnapAt;
      var fmt = function (a) {
        return a ? "yerel(" + a[0].toFixed(2) + "," + a[1].toFixed(2) + ") host(" + a[2].toFixed(2) + "," + a[3].toFixed(2) + ")" : "-";
      };
      log((bigErr ? "KAYMA " : "G ") + "su:" + fmt(ownLog) + " ateş:" + fmt(fbLog) + " snaps=" + snapApplied + " düzeltme=" + fixes);
    }

    if (fixes > 0) {
      var now = Date.now();
      if (now - lastFixSay > 2000) {
        lastFixSay = now;
        say(t("mSyncFix", worst));
      }
    }
  }

  /* ---------------- Guest: tuşları gönder ---------------- */

  function guestSendInput() {
    if (role !== "guest" || !attached || !peerHere || !level || !rawLocal) return;
    var c = rawLocal;
    var l = c.left.isDown ? 1 : 0;
    var r = c.right.isDown ? 1 : 0;
    var u = c.up.isDown ? 1 : 0;
    var s = l + "," + r + "," + u;
    var now = Date.now();
    if (s !== lastSent || now - lastSentAt > 250) {
      lastSent = s;
      lastSentAt = now;
      send({ t: "in", l: l, r: r, u: u });
    }
  }

  /* ---------------- Emoji (:sob → 😭) ---------------- */

  var EMOJI_RAW = "+1=👍|-1=👎|100=💯|abacus=🧮|accordion=🪗|adhesive_bandage=🩹|admission_tickets=🎟|adult=🧑|aerial_tramway=🚡|airplane=✈️|airplane_arriving=🛬|airplane_departure=🛫|alarm_clock=⏰|alembic=⚗️|alien=👽|alien_monster=👾|ambulance=🚑|american_football=🏈|amphora=🏺|anatomical_heart=🫀|anchor=⚓|angel=😇|anger=💢|anger_symbol=💢|angry=😠|angry_face=😠|anguished=😧|anguished_face=😧|ant=🐜|antenna_with_bars=📶|anticlockwise_downwards_and_upwards_open_circle_arrows=🔄|aquarius=♒|aries=♈|arrow_down=⬇️|arrow_left=⬅️|arrow_pointing_rightwards_then_curving_downwards=⤵️|arrow_pointing_rightwards_then_curving_upwards=⤴️|arrow_right=➡️|arrow_up=⬆️|articulated_lorry=🚛|artist_palette=🎨|astonished=😲|astonished_face=😲|athletic_shoe=👟|atom=⚛️|atom_symbol=⚛️|aubergine=🍆|auto_rickshaw=🛺|automated_teller_machine=🏧|automobile=🚗|avocado=🥑|axe=🪓|baby=👶|baby_angel=👼|baby_bottle=🍼|baby_chick=🐤|baby_symbol=🚼|back_of_envelope=🖂|back_with_leftwards_arrow_above=🔙|bacon=🥓|bactrian_camel=🐫|badger=🦡|badminton_racquet_and_shuttlecock=🏸|bagel=🥯|baggage_claim=🛄|baguette_bread=🥖|ball_of_yarn=🧶|ballet_shoes=🩰|balloon=🎈|ballot_bold_script_x=🗶|ballot_box_with_ballot=🗳|ballot_box_with_bold_check=🗹|ballot_box_with_bold_script_x=🗷|ballot_box_with_check=☑️|ballot_box_with_script_x=🗵|ballot_script_x=🗴|banana=🍌|banjo=🪕|bank=🏦|banknote_with_dollar=💵|banknote_with_dollar_sign=💵|banknote_with_euro=💶|banknote_with_euro_sign=💶|banknote_with_pound=💷|banknote_with_pound_sign=💷|banknote_with_yen=💴|banknote_with_yen_sign=💴|bar_chart=📊|bar_of_soap=🧼|barber_pole=💈|baseball=⚾|basket=🧺|basketball_and_hoop=🏀|bat=🦇|bath=🛀|bathtub=🛁|battery=🔋|beach_with_umbrella=🏖|beamed_ascending_musical_notes=🎜|beamed_descending_musical_notes=🎝|beans=🫘|bear=🐻|bear_face=🐻|bearded_person=🧔|beating_heart=💓|beaver=🦫|bed=🛏|bee=🐝|beer=🍺|beer_mug=🍺|beetle=🪲|bell=🔔|bell_pepper=🫑|bell_with_cancellation_stroke=🔕|bellhop_bell=🛎|bento_box=🍱|beverage_box=🧃|bicycle=🚲|bicyclist=🚴|bikini=👙|billed_cap=🧢|billiards=🎱|biohazard=☣️|biohazard_sign=☣️|bird=🐦|birthday_cake=🎂|bison=🦬|biting_lip=🫦|black_chess_pawn=♟️|black_circle=⚫|black_circle_for_record=⏺️|black_club_suit=♣️|black_diamond_suit=♦️|black_down_pointing_backhand_index=🖣|black_down_pointing_double_triangle=⏬|black_droplet=🌢|black_folder=🖿|black_hard_shell_floppy_disk=🖪|black_heart=🖤|black_heart_suit=♥️|black_large_square=⬛|black_left_pointing_backhand_index=🖜|black_left_pointing_double_triangle=⏪|black_left_pointing_double_triangle_with_vertical_bar=⏮️|black_left_pointing_triangle=◀️|black_medium_small_square=◾|black_medium_square=◼️|black_nib=✒️|black_pennant=🏲|black_pushpin=🖈|black_question_mark_ornament=❓|black_right_pointing_backhand_index=🖝|black_right_pointing_double_triangle=⏩|black_right_pointing_double_triangle_with_vertical_bar=⏭️|black_right_pointing_triangle=▶️|black_right_pointing_triangle_with_double_vertical_bar=⏯️|black_rightwards_arrow=➡️|black_rosette=🏶|black_scissors=✂️|black_skull_and_crossbones=🕱|black_small_square=▪️|black_spade_suit=♠️|black_square_button=🔲|black_square_for_stop=⏹️|black_sun_with_rays=☀️|black_telephone=☎️|black_touchtone_telephone=🕿|black_universal_recycling=♻️|black_universal_recycling_symbol=♻️|black_up_pointing_backhand_index=🖢|black_up_pointing_double_triangle=⏫|blossom=🌼|blowfish=🐡|blue_book=📘|blue_circle=🔵|blue_heart=💙|blueberries=🫐|blush=😊|boar=🐗|bomb=💣|bone=🦴|book=🕮|bookmark=🔖|bookmark_tabs=📑|books=📚|boom=💥|boomerang=🪃|bottle_with_popping_cork=🍾|bouquet=💐|bouquet_of_flowers=🎕|bow=🏹|bow_and_arrow=🏹|bowl_of_hygieia=🕏|bowl_with_spoon=🥣|bowling=🎳|boxing_glove=🥊|boy=👦|boys=🛉|boys_symbol=🛉|brain=🧠|bread=🍞|breast_feeding=🤱|brick=🧱|bride_with_veil=👰|bridge_at_night=🌉|briefcase=💼|briefs=🩲|broccoli=🥦|broken_heart=💔|broom=🧹|brown_heart=🤎|bruh=😐|bubble_tea=🧋|bubbles=🫧|bucket=🪣|bug=🐛|building_construction=🏗|bulb=💡|bullhorn=🕫|bullhorn_with_sound_waves=🕬|burger=🍔|burrito=🌯|bus=🚌|bus_stop=🚏|bust_in_silhouette=👤|busts_in_silhouette=👥|butter=🧈|butterfly=🦋|cactus=🌵|cake=🍰|calendar=📅|call_me=🤙|call_me_hand=🤙|camera=📷|camera_with_flash=📸|camping=🏕|cancellation_x=🗙|cancer=♋|candle=🕯️|candy=🍬|canned_food=🥫|canoe=🛶|capricorn=♑|card_file_box=🗃|card_index=📇|card_index_dividers=🗂|carousel_horse=🎠|carp_streamer=🎏|carpentry_saw=🪚|carrot=🥕|cat=🐱|cat_face=🐱|cat_face_with_tears_of_joy=😹|cat_face_with_wry_smile=😼|celtic_cross=🕈|chains=⛓️|chair=🪑|chart_with_downwards_trend=📉|chart_with_upwards_trend=📈|chart_with_upwards_trend_and_yen=💹|chart_with_upwards_trend_and_yen_sign=💹|check=✅|check_mark=✔️|cheering_megaphone=📣|cheese_wedge=🧀|chequered_flag=🏁|cherries=🍒|cherry_blossom=🌸|chess_pawn=♟️|chestnut=🌰|chicken=🐔|child=🧒|children_crossing=🚸|chipmunk=🐿|chocolate_bar=🍫|chopsticks=🥢|christmas_tree=🎄|church=⛪|cinema=🎦|circle_for_record=⏺️|circled_cross_formee=🤂|circled_cross_formee_with_four_dots=🤀|circled_cross_formee_with_two_dots=🤁|circled_cross_pommee=🕀|circled_ideograph_accept=🉑|circled_ideograph_advantage=🉐|circled_ideograph_congratulation=㊗️|circled_ideograph_secret=㊙️|circled_information_source=🛈|circled_latin_capital_letter_m=Ⓜ️|circus_tent=🎪|cityscape=🏙|cityscape_at_dusk=🌆|cjk_unified_ideograph_5272=🈹|cjk_unified_ideograph_5408=🈴|cjk_unified_ideograph_55b6=🈺|cjk_unified_ideograph_6307=🈯|cjk_unified_ideograph_6708=🈷|cjk_unified_ideograph_6709=🈶|cjk_unified_ideograph_6e80=🈵|cjk_unified_ideograph_7121=🈚|cjk_unified_ideograph_7533=🈸|cjk_unified_ideograph_7981=🈲|cjk_unified_ideograph_7a7a=🈳|clamshell_mobile_phone=🖁|clap=👏|clapper_board=🎬|clapping_hands=👏|clapping_hands_sign=👏|classical_building=🏛|clinking_beer_mugs=🍻|clinking_glasses=🥂|clipboard=📋|clock=🕐|clock_face_eight_oclock=🕗|clock_face_eight_thirty=🕣|clock_face_eleven_oclock=🕚|clock_face_eleven_thirty=🕦|clock_face_five_oclock=🕔|clock_face_five_thirty=🕠|clock_face_four_oclock=🕓|clock_face_four_thirty=🕟|clock_face_nine_oclock=🕘|clock_face_nine_thirty=🕤|clock_face_one_oclock=🕐|clock_face_one_thirty=🕜|clock_face_seven_oclock=🕖|clock_face_seven_thirty=🕢|clock_face_six_oclock=🕕|clock_face_six_thirty=🕡|clock_face_ten_oclock=🕙|clock_face_ten_thirty=🕥|clock_face_three_oclock=🕒|clock_face_three_thirty=🕞|clock_face_twelve_oclock=🕛|clock_face_twelve_thirty=🕧|clock_face_two_oclock=🕑|clock_face_two_thirty=🕝|clockwise_downwards_and_upwards_open_circle_arrows=🔃|clockwise_right_and_left_semicircle_arrows=🗘|clockwise_rightwards_and_leftwards_open_circle_arrows=🔁|clockwise_rightwards_and_leftwards_open_circle_arrows_with_circled_one_overlay=🔂|closed_book=📕|closed_lock_with_key=🔐|closed_mailbox_with_lowered_flag=📪|closed_mailbox_with_raised_flag=📫|closed_umbrella=🌂|cloud=☁️|cloud_with_lightning=🌩|cloud_with_rain=🌧|cloud_with_snow=🌨|cloud_with_tornado=🌪|clown=🤡|clown_face=🤡|club_suit=♣️|coat=🧥|cockroach=🪳|cocktail_glass=🍸|coconut=🥥|coffee=☕|coffin=⚰️|coin=🪙|cold=🥶|cold_sweat=😰|collision=💥|collision_symbol=💥|comet=☄️|compass=🧭|compression=🗜|confetti=🎊|confetti_ball=🎊|confounded=😖|confounded_face=😖|confused=😕|confused_face=😕|construction=🚧|construction_sign=🚧|construction_worker=👷|control_knobs=🎛|controller=🎮|convenience_store=🏪|cooked_rice=🍚|cookie=🍪|cooking=🍳|cool=😎|cool_button=🆒|copyright=©️|copyright_sign=©️|coral=🪸|couch_and_lamp=🛋|couple_with_heart=💑|cow=🐮|cow_face=🐮|cowboy_hat=🤠|crab=🦀|credit_card=💳|crescent_moon=🌙|cricket=🦗|cricket_bat_and_ball=🏏|cringe=😬|crocodile=🐊|croissant=🥐|cross=❌|cross_mark=❌|cross_pommee=🕂|cross_pommee_with_half_circle_below=🕁|crossed_fingers=🤞|crossed_flags=🎌|crossed_swords=⚔️|crown=👑|crutch=🩼|cry=😢|crying=😢|crying_cat=😿|crying_cat_face=😿|crying_face=😢|crystal_ball=🔮|cucumber=🥒|cup_with_straw=🥤|cupcake=🧁|curling_stone=🥌|curly_loop=➰|currency_exchange=💱|curry_and_rice=🍛|custard=🍮|customs=🛃|cut_of_meat=🥩|cyclone=🌀|dagger_knife=🗡|dancer=💃|dango=🍡|dark_sunglasses=🕶|dash=💨|dash_symbol=💨|dead=💀|deaf_person=🧏|deciduous_tree=🌳|decrease_font_size=🗛|decrease_font_size_symbol=🗛|deer=🦌|delivery_truck=🚚|department_store=🏬|derelict_house_building=🏚|desert=🏜|desert_island=🏝|desktop_computer=🖥|desktop_window=🗔|devil=😈|diagonal_mouth=🫤|diamond_shape_with_a_dot_inside=💠|diamond_suit=♦️|dice=🎲|diesel_locomotive=🛲|direct_hit=🎯|disappointed=😞|disappointed_but_relieved=😥|disappointed_but_relieved_face=😥|disappointed_face=😞|disguised=🥸|disguised_face=🥸|diving_mask=🤿|division_sign=➗|diya_lamp=🪔|dizzy=💫|dizzy_face=😵|dizzy_symbol=💫|dna_double_helix=🧬|do_not_litter=🚯|do_not_litter_symbol=🚯|document=🗎|document_with_picture=🖻|document_with_text=🖹|document_with_text_and_picture=🖺|dodo=🦤|dog=🐶|dog_face=🐶|dollar=💵|dollar_sign=💲|dolphin=🐬|donkey=🫏|door=🚪|dotted_line=🫥|dotted_line_face=🫥|double_curly_loop=➿|double_exclamation_mark=‼️|double_vertical_bar=⏸️|doughnut=🍩|dove_of_peace=🕊|down_pointing_backhand_index=👇|down_pointing_double_triangle=⏬|down_pointing_left_hand_index=🖗|down_pointing_red_triangle=🔻|down_pointing_small_red_triangle=🔽|downward_facing_hook=🤈|downward_facing_hook_with_dot=🤊|downward_facing_notched_hook=🤉|downward_facing_notched_hook_with_dot=🤋|downwards_black_arrow=⬇️|dragon=🐉|dragon_face=🐲|dress=👗|dromedary_camel=🐪|drooling=🤤|drooling_face=🤤|drop_of_blood=🩸|droplet=💧|drum_with_drumsticks=🥁|duck=🦆|dumpling=🥟|dvd=📀|e_mail=📧|e_mail_symbol=📧|eagle=🦅|ear=👂|ear_of_maize=🌽|ear_of_rice=🌾|ear_with_hearing_aid=🦻|earth=🌍|earth_globe_americas=🌎|earth_globe_asia_australia=🌏|earth_globe_europe_africa=🌍|egg=🥚|eight_pointed_black_star=✴️|eight_spoked_asterisk=✳️|eject=⏏️|eject_symbol=⏏️|electric_light_bulb=💡|electric_plug=🔌|electric_torch=🔦|elephant=🐘|elevator=🛗|elf=🧝|emoji_component_bald=🦲|emoji_component_curly_hair=🦱|emoji_component_red_hair=🦰|emoji_component_white_hair=🦳|empty_document=🗋|empty_nest=🪹|empty_note=🗅|empty_note_pad=🗇|empty_note_page=🗆|empty_page=🗌|empty_pages=🗍|end_with_leftwards_arrow_above=🔚|envelope=✉️|envelope_with_downwards_arrow_above=📩|envelope_with_lightning=🖄|european_castle=🏰|european_post_office=🏤|evergreen_tree=🌲|exclamation=❗|exclamation_mark_ornament=❕|exclamation_mark_symbol=❗|exclamation_question_mark=⁉️|exploding_head=🤯|expressionless=😑|expressionless_face=😑|extraterrestrial_alien=👽|eye=👁️|eyeglasses=👓|eyeroll=🙄|eyes=👀|eyes_emoji=👀|face_holding_back_tears=🥹|face_massage=💆|face_palm=🤦|face_savouring_delicious_food=😋|face_screaming_in_fear=😱|face_throwing_a_kiss=😘|face_with_cold_sweat=😓|face_with_cowboy_hat=🤠|face_with_diagonal_mouth=🫤|face_with_finger_covering_closed_lips=🤫|face_with_head_bandage=🤕|face_with_look_of_triumph=😤|face_with_medical_mask=😷|face_with_monocle=🧐|face_with_no_good_gesture=🙅|face_with_ok_gesture=🙆|face_with_one_eyebrow_raised=🤨|face_with_open_eyes_and_hand_over_mouth=🫢|face_with_open_mouth=😮|face_with_open_mouth_and_cold_sweat=😰|face_with_open_mouth_vomiting=🤮|face_with_party_horn_and_party_hat=🥳|face_with_peeking_eye=🫣|face_with_pleading_eyes=🥺|face_with_rolling_eyes=🙄|face_with_stuck_out_tongue=😛|face_with_stuck_out_tongue_and_tightly_closed_eyes=😝|face_with_stuck_out_tongue_and_winking_eye=😜|face_with_tears_of_joy=😂|face_with_thermometer=🤒|face_with_uneven_eyes_and_wavy_mouth=🥴|face_without_mouth=😶|facepalm=🤦|factory=🏭|fairy=🧚|falafel=🧆|fallen_leaf=🍂|family=👪|father_christmas=🎅|fax_icon=🖷|fax_machine=📠|fearful=😨|fearful_face=😨|feather=🪶|female=♀️|female_sign=♀️|fencer=🤺|ferris_wheel=🎡|ferry=⛴️|field_hockey_stick_and_ball=🏑|file_cabinet=🗄|file_folder=📁|film_frames=🎞|film_projector=📽|finger_covering_closed_lips=🤫|fire=🔥|fire_engine=🚒|fire_extinguisher=🧯|fireball=☄️|firecracker=🧨|firework_sparkler=🎇|fireworks=🎆|first_place_medal=🥇|first_quarter_moon=🌓|first_quarter_moon_symbol=🌓|first_quarter_moon_with=🌛|first_quarter_moon_with_face=🌛|fish=🐟|fish_cake_with_swirl_design=🍥|fishing_pole_and_fish=🎣|fist=✊|fisted_hand=👊|fisted_hand_sign=👊|flag_ae=🇦🇪|flag_ar=🇦🇷|flag_at=🇦🇹|flag_au=🇦🇺|flag_az=🇦🇿|flag_be=🇧🇪|flag_bg=🇧🇬|flag_br=🇧🇷|flag_ca=🇨🇦|flag_ch=🇨🇭|flag_cn=🇨🇳|flag_cz=🇨🇿|flag_de=🇩🇪|flag_dk=🇩🇰|flag_dz=🇩🇿|flag_eg=🇪🇬|flag_es=🇪🇸|flag_fi=🇫🇮|flag_fr=🇫🇷|flag_gb=🇬🇧|flag_gr=🇬🇷|flag_hu=🇭🇺|flag_id=🇮🇩|flag_ie=🇮🇪|flag_il=🇮🇱|flag_in=🇮🇳|flag_in_hole=⛳|flag_iq=🇮🇶|flag_ir=🇮🇷|flag_it=🇮🇹|flag_jp=🇯🇵|flag_ke=🇰🇪|flag_kr=🇰🇷|flag_ma=🇲🇦|flag_mx=🇲🇽|flag_ng=🇳🇬|flag_nl=🇳🇱|flag_no=🇳🇴|flag_ph=🇵🇭|flag_pk=🇵🇰|flag_pl=🇵🇱|flag_pt=🇵🇹|flag_ro=🇷🇴|flag_ru=🇷🇺|flag_sa=🇸🇦|flag_se=🇸🇪|flag_th=🇹🇭|flag_tn=🇹🇳|flag_tr=🇹🇷|flag_ua=🇺🇦|flag_us=🇺🇸|flag_vn=🇻🇳|flag_za=🇿🇦|flamingo=🦩|flat_shoe=🥿|flatbread=🫓|fleur_de_lis=⚜️|flexed_biceps=💪|floppy_disk=💾|flower=💮|flower_playing_cards=🎴|flushed=😳|flushed_face=😳|flute=🪈|fly=🪰|flying_disc=🥏|flying_envelope=🖅|flying_saucer=🛸|fog=🌫|foggy=🌁|folder=🗀|folding_hand_fan=🪭|fondue=🫕|foot=🦶|footprints=👣|fork_and_knife=🍴|fork_and_knife_with_plate=🍽|fortune_cookie=🥠|fountain=⛲|four_leaf_clover=🍀|fox=🦊|fox_face=🦊|frame_with_an_x=🖾|frame_with_picture=🖼|frame_with_tiles=🖽|free=🆓|freezing=🥶|freezing_face=🥶|french_fries=🍟|fried_shrimp=🍤|fries=🍟|frog=🐸|frog_face=🐸|front_facing_baby_chick=🐥|frowning=☹️|frowning_face=☹️|frowning_face_with_open_mouth=😦|fuel_pump=⛽|full_moon=🌕|full_moon_symbol=🌕|full_moon_with=🌝|full_moon_with_face=🌝|funeral_urn=⚱️|game_die=🎲|gamepad=🎮|garlic=🧄|gear=⚙️|gem=💎|gem_stone=💎|gemini=♊|genie=🧞|gg=🎮|ghost=👻|gift=🎁|ginger_root=🫚|giraffe=🦒|giraffe_face=🦒|girl=👧|girls=🛊|girls_symbol=🛊|glass_of_milk=🥛|globe=🌍|globe_with_meridians=🌐|gloves=🧤|glowing_star=🌟|goal_net=🥅|goat=🐐|goggles=🥽|golfer=🏌|goose=🪿|gorilla=🦍|graduation_cap=🎓|grapes=🍇|green_apple=🍏|green_book=📗|green_circle=🟢|green_heart=💚|green_salad=🥗|grey_heart=🩶|grimacing=😬|grimacing_face=😬|grin=😁|grinning=😀|grinning_cat_face_with_smiling_eyes=😸|grinning_face=😀|grinning_face_with_one_large_and_one_small_eye=🤪|grinning_face_with_smiling_eyes=😁|grinning_face_with_star_eyes=🤩|growing_heart=💗|guardsman=💂|guide_dog=🦮|guitar=🎸|hair_pick=🪮|haircut=💇|halo=😇|hamburger=🍔|hammer=🔨|hammer_and_pick=⚒️|hammer_and_wrench=🛠|hamsa=🪬|hamster=🐹|hamster_face=🐹|hand_over_mouth=🤭|hand_with_index_and_middle_fingers_crossed=🤞|hand_with_index_finger_and_thumb_crossed=🫰|handbag=👜|handball=🤾|handshake=🤝|happy_person_raising_one_hand=🙋|hard_disk=🖴|hard_shell_floppy_disk=🖪|hatching_chick=🐣|head_bandage=🤕|headphone=🎧|headphones=🎧|headstone=🪦|hear_no_evil=🙉|hear_no_evil_monkey=🙉|heart=❤️|heart_decoration=💟|heart_exclamation_mark_ornament=❣️|heart_eyes=😍|heart_hands=🫶|heart_shaped_eyes=😍|heart_suit=♥️|heart_with_arrow=💘|heart_with_ribbon=💝|heart_with_tip_on_the_left=🎔|heartpulse=💗|heavy_black_heart=❤️|heavy_check_mark=✔️|heavy_division=➗|heavy_division_sign=➗|heavy_dollar=💲|heavy_dollar_sign=💲|heavy_exclamation_mark=❗|heavy_exclamation_mark_symbol=❗|heavy_heart_exclamation_mark_ornament=❣️|heavy_large_circle=⭕|heavy_latin_cross=🕇|heavy_minus=➖|heavy_minus_sign=➖|heavy_multiplication_x=✖️|heavy_plus=➕|heavy_plus_sign=➕|hedgehog=🦔|helicopter=🚁|helmet_with_white_cross=⛑️|herb=🌿|hibiscus=🌺|high_brightness=🔆|high_brightness_symbol=🔆|high_heeled_shoe=👠|high_speed_train=🚄|high_speed_train_with_bullet_nose=🚅|high_voltage=⚡|high_voltage_sign=⚡|hiking_boot=🥾|hindu_temple=🛕|hippopotamus=🦛|hmm=🤔|hocho=🔪|holding_back_tears=🥹|hole=🕳|honey_pot=🍯|honeybee=🐝|hook=🪝|horizontal_traffic_light=🚥|horns=😈|horse=🐴|horse_face=🐴|horse_racing=🏇|hospital=🏥|hot=🥵|hot_beverage=☕|hot_dog=🌭|hot_pepper=🌶|hot_springs=♨️|hotel=🏨|hourglass=⏳|hourglass_with_flowing_sand=⏳|house_building=🏠|house_buildings=🏘|house_with_garden=🏡|hugging=🤗|hugging_face=🤗|hundred=💯|hundred_points=💯|hundred_points_symbol=💯|hushed=😯|hushed_face=😯|hut=🛖|hyacinth=🪻|i_love_you_hand=🤟|i_love_you_hand_sign=🤟|ice=🧊|ice_cream=🍨|ice_cube=🧊|ice_hockey_stick_and_puck=🏒|ice_skate=⛸️|identification_card=🪪|imp=👿|inbox_tray=📥|incoming_envelope=📨|increase_font_size=🗚|increase_font_size_symbol=🗚|index_pointing_at_the_viewer=🫵|information_desk_person=💁|information_source=ℹ️|innocent=😇|input_symbol_for_latin_capital_letters=🔠|input_symbol_for_latin_letters=🔤|input_symbol_for_latin_small_letters=🔡|input_symbol_for_numbers=🔢|input_symbol_for_symbols=🔣|izakaya_lantern=🏮|jack_o_lantern=🎃|japanese_castle=🏯|japanese_dolls=🎎|japanese_goblin=👺|japanese_ogre=👹|japanese_post_office=🏣|japanese_symbol_for_beginner=🔰|jar=🫙|jeans=👖|jellyfish=🪼|jigsaw_puzzle_piece=🧩|joy=😂|joystick=🕹️|juggling=🤹|kaaba=🕋|kangaroo=🦘|katakana_koko=🈁|katakana_sa=🈂|key=🔑|keyboard=⌨️|keyboard_and_mouse=🖦|keycap_ten=🔟|khanda=🪯|kimono=👘|kiss=😘|kiss_mark=💋|kissing=😗|kissing_cat_face_with_closed_eyes=😽|kissing_face=😗|kissing_face_with_closed_eyes=😚|kissing_face_with_smiling_eyes=😙|kissing_heart=😘|kite=🪁|kiwifruit=🥝|kneeling_person=🧎|knot=🪢|koala=🐨|lab_coat=🥼|label=🏷|lacrosse_stick_and_ball=🥍|ladder=🪜|lady_beetle=🐞|large_blue_circle=🔵|large_blue_diamond=🔷|large_circle=⭕|large_orange_diamond=🔶|large_red_circle=🔴|large_square=⬛|last_quarter_moon=🌗|last_quarter_moon_symbol=🌗|last_quarter_moon_with=🌜|last_quarter_moon_with_face=🌜|latin_cross=✝️|laughing=😆|leaf_fluttering_in_wind=🍃|leafy_green=🥬|ledger=📒|left_anger_bubble=🗮|left_facing_fist=🤛|left_half_circle=🤇|left_half_circle_with_dot=🤆|left_half_circle_with_four_dots=🤃|left_half_circle_with_three_dots=🤄|left_half_circle_with_two_dots=🤅|left_hand_telephone_receiver=🕻|left_luggage=🛅|left_pointing_backhand_index=👈|left_pointing_double_triangle=⏪|left_pointing_double_triangle_with_vertical_bar=⏮️|left_pointing_magnifying_glass=🔍|left_pointing_triangle=◀️|left_right_arrow=↔️|left_speech_bubble=🗨|left_thought_bubble=🗬|left_writing_hand=🖎|leftwards_arrow_with_hook=↩️|leftwards_black_arrow=⬅️|leftwards_hand=🫲|leftwards_pushing_hand=🫷|leg=🦵|lemon=🍋|leo=♌|leopard=🐆|level_slider=🎚|libra=♎|light_blue_heart=🩵|light_check_mark=🗸|light_rail=🚈|lightning_mood=🗲|lightning_mood_bubble=🗱|link=🔗|link_symbol=🔗|linked_paperclips=🖇|lion=🦁|lion_face=🦁|lips=👄|lipstick=💄|lizard=🦎|llama=🦙|lmao=🤣|lobster=🦞|lock=🔒|lock_with_ink_pen=🔏|lol=😂|lollipop=🍭|long_drum=🪘|look_of_triumph=😤|lotion_bottle=🧴|lotus=🪷|loudly_crying=😭|loudly_crying_face=😭|love=😍|love_hotel=🏩|love_letter=💌|low_battery=🪫|low_brightness=🔅|low_brightness_symbol=🔅|lower_left_ballpoint_pen=🖊|lower_left_crayon=🖍|lower_left_fountain_pen=🖋|lower_left_paintbrush=🖌|lower_left_pencil=🖉|lower_right_shadowed_white_circle=🔾|luggage=🧳|lungs=🫁|lying=🤥|lying_face=🤥|mage=🧙|magic_wand=🪄|magnet=🧲|mahjong_tile_red_dragon=🀄|male=♂️|male_sign=♂️|male_with_stroke_and_male_and_female=⚧️|male_with_stroke_and_male_and_female_sign=⚧️|mammoth=🦣|man=👨|man_and_woman_holding_hands=👫|man_dancing=🕺|man_in_business_suit_levitating=🕴|man_in_tuxedo=🤵|man_with_gua_pi_mao=👲|man_with_turban=👳|mango=🥭|mans_shoe=👞|mantelpiece_clock=🕰|manual_wheelchair=🦽|maple_leaf=🍁|maracas=🪇|martial_arts_uniform=🥋|mask=😷|massage=💆|mate_drink=🧉|maximize=🗖|meat_on_bone=🍖|mechanical_arm=🦾|mechanical_leg=🦿|medal=🏅|medical_mask=😷|medium_black_circle=⚫|medium_small_square=◽|medium_square=◻️|medium_star=⭐|medium_white_circle=⚪|melon=🍈|melting=🫠|melting_face=🫠|memo=📝|menorah_with_nine_branches=🕎|mens=🚹|mens_symbol=🚹|merperson=🧜|metal=🤘|metro=🚇|mic=🎤|microbe=🦠|microphone=🎤|microscope=🔬|military_helmet=🪖|military_medal=🎖|milky_way=🌌|minibus=🚐|minidisc=💽|minimize=🗕|minus=➖|minus_sign=➖|mirror=🪞|mirror_ball=🪩|mobile_phone=📱|mobile_phone_off=📴|mobile_phone_with_rightwards_arrow_at_left=📲|modern_pentathlon=🤻|money=💰|money_bag=💰|money_mouth=🤑|money_mouth_face=🤑|money_with_wings=💸|moneybag=💰|monkey=🐵|monkey_face=🐵|monocle=🧐|monorail=🚝|mood_bubble=🗰|moon=🌙|moon_cake=🥮|moon_viewing_ceremony=🎑|moose=🫎|mosque=🕌|mosquito=🦟|mother_christmas=🤶|motor_boat=🛥|motor_scooter=🛵|motorized_wheelchair=🦼|motorway=🛣|mount_fuji=🗻|mountain=⛰️|mountain_bicyclist=🚵|mountain_cableway=🚠|mountain_railway=🚞|mouse=🐭|mouse_face=🐭|mouse_trap=🪤|mouth=👄|movie_camera=🎥|moyai=🗿|multiple_musical_notes=🎶|multiplication_x=✖️|muscle=💪|mushroom=🍄|music=🎵|musical_keyboard=🎹|musical_keyboard_with_jacks=🎘|musical_note=🎵|musical_score=🎼|nail_care=💅|nail_polish=💅|name_badge=📛|national_park=🏞|nauseated=🤢|nauseated_face=🤢|nazar_amulet=🧿|necktie=👔|negative_squared_cross_mark=❎|negative_squared_latin_capital_letter_a=🅰|negative_squared_latin_capital_letter_b=🅱|negative_squared_latin_capital_letter_o=🅾|negative_squared_latin_capital_letter_p=🅿|nerd=🤓|nerd_face=🤓|nest_with_eggs=🪺|nesting_dolls=🪆|neutral=😐|neutral_face=😐|new=🆕|new_moon=🌑|new_moon_symbol=🌑|new_moon_with=🌚|new_moon_with_face=🌚|newspaper=📰|nib=✒️|nice=👌|night_with_stars=🌃|ninja=🥷|no=🚫|no_bicycles=🚳|no_entry=⛔|no_entry_sign=🚫|no_good_gesture=🙅|no_mobile_phones=📵|no_mouth=😶|no_one_under_eighteen=🔞|no_one_under_eighteen_symbol=🔞|no_pedestrians=🚷|no_piracy=🕲|no_smoking=🚭|no_smoking_symbol=🚭|non_potable_water=🚱|non_potable_water_symbol=🚱|north_east_arrow=↗️|north_west_arrow=↖️|northeast_pointing_airplane=🛪|nose=👃|notched_left_semicircle_with_three_dots=🕃|notched_right_semicircle_with_three_dots=🕄|note=🗈|note_pad=🗊|note_page=🗉|notebook=📓|notebook_with_decorative_cover=📔|notes=🎶|nut_and_bolt=🔩|ocean=🌊|octagonal=🛑|octagonal_sign=🛑|octopus=🐙|oden=🍢|office_building=🏢|oil_drum=🛢|ok=🆗|ok_gesture=🙆|ok_hand=👌|ok_hand_sign=👌|old_key=🗝|old_personal_computer=🖳|older_adult=🧓|older_man=👴|older_woman=👵|olive=🫒|om_symbol=🕉|omg=😱|on_with_exclamation_mark_with_left_right_arrow_above=🔛|oncoming_automobile=🚘|oncoming_bus=🚍|oncoming_fire_engine=🛱|oncoming_police_car=🚔|oncoming_taxi=🚖|one_button_mouse=🖯|one_eyebrow_raised=🤨|one_piece_swimsuit=🩱|onion=🧅|open_book=📖|open_eyes_and_hand_over_mouth=🫢|open_file_folder=📂|open_folder=🗁|open_hands=👐|open_hands_sign=👐|open_lock=🔓|open_mailbox_with_lowered_flag=📭|open_mailbox_with_raised_flag=📬|open_mouth=😮|open_mouth_and_cold_sweat=😅|open_mouth_and_smiling_eyes=😄|open_mouth_and_tightly_closed_eyes=😆|open_mouth_vomiting=🤮|ophiuchus=⛎|optical_disc=💿|optical_disc_icon=🖸|orange_book=📙|orange_circle=🟠|orange_heart=🧡|orangutan=🦧|orthodox_cross=☦️|otter=🦦|outbox_tray=📤|overheated=🥵|overheated_face=🥵|overlap=🗗|owl=🦉|ox=🐂|oyster=🦪|package=📦|page=🗏|page_facing_up=📄|page_with_circled_text=🗟|page_with_curl=📃|pager=📟|pages=🗐|pagoda=🛔|palm=🤦|palm_down_hand=🫳|palm_tree=🌴|palm_up_hand=🫴|palms_up_together=🤲|pancakes=🥞|panda=🐼|panda_face=🐼|paperclip=📎|parachute=🪂|parrot=🦜|part_alternation_mark=〽️|party=🥳|party_horn_and_party_hat=🥳|party_popper=🎉|partying=🥳|passenger_ship=🛳|passport_control=🛂|paw_prints=🐾|pea_pod=🫛|peace=☮️|peace_symbol=☮️|peach=🍑|peacock=🦚|peanuts=🥜|pear=🍐|pedestrian=🚶|peeking_eye=🫣|pen_over_stamped_envelope=🖆|pencil=✏️|penguin=🐧|pennant=🏱|pensive=😔|pensive_face=😔|people_hugging=🫂|performing_arts=🎭|permanent_paper=♾️|permanent_paper_sign=♾️|persevere=😣|persevering=😣|persevering_face=😣|person_bowing_deeply=🙇|person_climbing=🧗|person_doing_cartwheel=🤸|person_frowning=🙍|person_in_lotus_position=🧘|person_in_steamy_room=🧖|person_raising_both_hands_in_celebration=🙌|person_with_ball=⛹️|person_with_blond_hair=👱|person_with_crown=🫅|person_with_folded_hands=🙏|person_with_headscarf=🧕|person_with_pouting=🙎|person_with_pouting_face=🙎|personal_computer=💻|petri_dish=🧫|pick=⛏️|pickup_truck=🛻|pie=🥧|pig=🐷|pig_face=🐷|pig_nose=🐽|pile_of_poo=💩|pill=💊|pinata=🪅|pinched=🤌|pinched_fingers=🤌|pinching_hand=🤏|pine_decoration=🎍|pineapple=🍍|pink_heart=🩷|pisces=♓|pistol=🔫|pizza=🍕|placard=🪧|place_of_worship=🛐|playground_slide=🛝|playing_card_black_joker=🃏|pleading=🥺|pleading_eyes=🥺|plug=🔌|plunger=🪠|plus=➕|plus_sign=➕|pocket_calculator=🖩|pog=😮|poggers=😮|point_down=👇|point_left=👈|point_right=👉|point_up=☝️|police_car=🚓|police_cars_revolving_light=🚨|police_officer=👮|poodle=🐩|poop=💩|popcorn=🍿|portable_stereo=📾|postal_horn=📯|postbox=📮|pot_of_food=🍲|potable_water=🚰|potable_water_symbol=🚰|potato=🥔|potted_plant=🪴|pouch=👝|poultry_leg=🍗|pouring_liquid=🫗|pouting=😡|pouting_cat=😾|pouting_cat_face=😾|pouting_face=😡|pray=🙏|prayer_beads=📿|pregnant_man=🫃|pregnant_person=🫄|pregnant_woman=🤰|pretzel=🥨|prince=🤴|princess=👸|printer=🖨|printer_icon=🖶|probing_cane=🦯|prohibited=🛇|prohibited_sign=🛇|public_address_loudspeaker=📢|punch=👊|purple_circle=🟣|purple_heart=💜|purse=👛|pushpin=📌|put_litter_in_its_place=🚮|put_litter_in_its_place_symbol=🚮|puzzle=🧩|question=❓|question_mark_ornament=❓|rabbit=🐇|rabbit_face=🐰|raccoon=🦝|racing_car=🏎|racing_motorcycle=🏍|radio=📻|radio_button=🔘|radioactive=☢️|radioactive_sign=☢️|rage=😡|railway_car=🚃|railway_track=🛤|rainbow=🌈|raised_back_of_hand=🤚|raised_eyebrow=🤨|raised_fist=✊|raised_hand=✋|raised_hand_with_fingers_splayed=🖐|raised_hand_with_part_between_middle_and_ring_fingers=🖖|raised_hands=🙌|ram=🐏|rat=🐀|razor=🪒|receipt=🧾|recreational_vehicle=🚙|red_apple=🍎|red_circle=🔴|red_gift_envelope=🧧|registered=®️|registered_sign=®️|relieved=😌|relieved_face=😌|reminder_ribbon=🎗|restroom=🚻|reversed_hand_with_middle_finger_extended=🖕|reversed_raised_hand_with_fingers_splayed=🖑|reversed_thumbs_down=🖓|reversed_thumbs_down_sign=🖓|reversed_thumbs_up=🖒|reversed_thumbs_up_sign=🖒|reversed_victory_hand=🖔|revolving_hearts=💞|rhinoceros=🦏|ribbon=🎀|rice_ball=🍙|rice_cracker=🍘|rifle=🥆|right_anger_bubble=🗯|right_facing_fist=🤜|right_hand_telephone_receiver=🕽|right_pointing_backhand_index=👉|right_pointing_double_triangle=⏩|right_pointing_double_triangle_with_vertical_bar=⏭️|right_pointing_magnifying_glass=🔎|right_pointing_triangle=▶️|right_pointing_triangle_with_double_vertical_bar=⏯️|right_speaker=🕨|right_speaker_with_one_sound_wave=🕩|right_speaker_with_three_sound_waves=🕪|right_speech_bubble=🗩|right_thought_bubble=🗭|rightwards_arrow=➡️|rightwards_arrow_with_hook=↪️|rightwards_hand=🫱|rightwards_pushing_hand=🫸|ring=💍|ring_buoy=🛟|ringed_planet=🪐|ringing_bell=🕭|roasted_sweet_potato=🍠|robot=🤖|robot_face=🤖|rock=🪨|rocket=🚀|rofl=🤣|roll_of_paper=🧻|rolled_up_newspaper=🗞|roller_coaster=🎢|roller_skate=🛼|rolling_eyes=🙄|rolling_on_the_floor_laughing=🤣|rooster=🐓|rose=🌹|rosette=🏵|round_pushpin=📍|rowboat=🚣|rugby_football=🏉|runner=🏃|running_shirt_with_sash=🎽|safety_pin=🧷|safety_vest=🦺|sagittarius=♐|sailboat=⛵|sake_bottle_and_cup=🍶|salt_shaker=🧂|salty=🧂|salute=🫡|saluting=🫡|saluting_face=🫡|sandwich=🥪|sari=🥻|satellite=🛰|satellite_antenna=📡|sauropod=🦕|savouring_delicious_food=😋|saxophone=🎷|scales=⚖️|scarf=🧣|school=🏫|school_satchel=🎒|scissors=✂️|scooter=🛴|scorpion=🦂|scorpius=♏|scream=😱|screaming_in_fear=😱|screen=🖵|screwdriver=🪛|scroll=📜|seal=🦭|seat=💺|second_place_medal=🥈|see_no_evil=🙈|see_no_evil_monkey=🙈|seedling=🌱|selfie=🤳|serious_face_with_symbols_covering_mouth=🤬|sewing_needle=🪡|shaking=🫨|shaking_face=🫨|shallow_pan_of_food=🥘|shamrock=☘️|shark=🦈|shaved_ice=🍧|sheep=🐑|shield=🛡️|shinto_shrine=⛩️|ship=🚢|shocked_face_with_exploding_head=🤯|shooting_star=🌠|shopping_bags=🛍|shopping_trolley=🛒|shortcake=🍰|shorts=🩳|shower=🚿|shrimp=🦐|shrug=🤷|shush=🤫|sick=🤢|sideways_black_down_pointing_index=🖡|sideways_black_left_pointing_index=🖚|sideways_black_right_pointing_index=🖛|sideways_black_up_pointing_index=🖠|sideways_white_down_pointing_index=🖟|sideways_white_left_pointing_index=🖘|sideways_white_right_pointing_index=🖙|sideways_white_up_pointing_index=🖞|sign_of_the_horns=🤘|silhouette_of_japan=🗾|six_pointed_star_with_middle_dot=🔯|skateboard=🛹|ski_and_ski_boot=🎿|skier=⛷️|skull=💀|skull_and_crossbones=☠️|skull_crossbones=☠️|skull_emoji=💀|skunk=🦨|sled=🛷|sleeping=😴|sleeping_accommodation=🛌|sleeping_face=😴|sleeping_symbol=💤|sleepy=😪|sleepy_face=😪|sleuth_or_spy=🕵|slice_of_pizza=🍕|slight_frown=🙁|slightly_frowning=🙁|slightly_frowning_face=🙁|slightly_smiling=🙂|slightly_smiling_face=🙂|slot_machine=🎰|sloth=🦥|small_airplane=🛩|small_blue_diamond=🔹|small_orange_diamond=🔸|small_square=▪️|smile=😄|smiley=😃|smiling_cat_face_with_heart_shaped_eyes=😻|smiling_cat_face_with_open_mouth=😺|smiling_eyes=😊|smiling_eyes_and_hand_covering_mouth=🤭|smiling_eyes_and_three_hearts=🥰|smiling_face=☺️|smiling_face_with_halo=😇|smiling_face_with_heart_shaped_eyes=😍|smiling_face_with_horns=😈|smiling_face_with_open_mouth=😃|smiling_face_with_open_mouth_and_cold_sweat=😅|smiling_face_with_open_mouth_and_smiling_eyes=😄|smiling_face_with_open_mouth_and_tightly_closed_eyes=😆|smiling_face_with_smiling_eyes=😊|smiling_face_with_smiling_eyes_and_hand_covering_mouth=🤭|smiling_face_with_smiling_eyes_and_three_hearts=🥰|smiling_face_with_sunglasses=😎|smiling_face_with_tear=🥲|smiling_imp=😈|smirk=😏|smirking=😏|smirking_face=😏|smoking=🚬|smoking_symbol=🚬|snail=🐌|snake=🐍|sneeze=🤧|sneezing=🤧|sneezing_face=🤧|snow_capped_mountain=🏔|snowboarder=🏂|snowflake=❄️|snowman=⛄|snowman_without_snow=⛄|sob=😭|soccer_ball=⚽|socks=🧦|soft_ice_cream=🍦|soft_shell_floppy_disk=🖬|softball=🥎|soon_with_rightwards_arrow_above=🔜|sos=🆘|south_east_arrow=↘️|south_west_arrow=↙️|spade_suit=♠️|spaghetti=🍝|sparkle=❇️|sparkles=✨|sparkling_heart=💖|speak_no_evil=🙊|speak_no_evil_monkey=🙊|speaker=🔈|speaker_with_cancellation_stroke=🔇|speaker_with_one_sound_wave=🔉|speaker_with_three_sound_waves=🔊|speaking_head_in_silhouette=🗣|speech_balloon=💬|speedboat=🚤|spider=🕷|spider_web=🕸|spiral_calendar_pad=🗓|spiral_note_pad=🗒|spiral_shell=🐚|splashing_sweat=💦|splashing_sweat_symbol=💦|sponge=🧽|spool_of_thread=🧵|spoon=🥄|sports_medal=🏅|spouting_whale=🐳|square_button=🔲|square_for_stop=⏹️|squared_cjk_unified_ideograph_5272=🈹|squared_cjk_unified_ideograph_5408=🈴|squared_cjk_unified_ideograph_55b6=🈺|squared_cjk_unified_ideograph_6307=🈯|squared_cjk_unified_ideograph_6708=🈷|squared_cjk_unified_ideograph_6709=🈶|squared_cjk_unified_ideograph_6e80=🈵|squared_cjk_unified_ideograph_7121=🈚|squared_cjk_unified_ideograph_7533=🈸|squared_cjk_unified_ideograph_7981=🈲|squared_cjk_unified_ideograph_7a7a=🈳|squared_cl=🆑|squared_cool=🆒|squared_free=🆓|squared_id=🆔|squared_katakana_koko=🈁|squared_katakana_sa=🈂|squared_new=🆕|squared_ng=🆖|squared_ok=🆗|squared_sos=🆘|squared_up_with_exclamation_mark=🆙|squared_vs=🆚|squid=🦑|stadium=🏟|staff_of_aesculapius=⚕️|stamped_envelope=🖃|standing_person=🧍|star=⭐|star_and_crescent=☪️|star_of_david=✡️|star_struck=🤩|station=🚉|statue_of_liberty=🗽|steam_locomotive=🚂|steaming_bowl=🍜|stethoscope=🩺|stock_chart=🗠|stop=🛑|stopwatch=⏱️|straight_ruler=📏|strawberry=🍓|stuck_out_tongue=😛|stuck_out_tongue_and_tightly_closed_eyes=😝|stuck_out_tongue_and_winking_eye=😜|stuck_out_tongue_winking_eye=😜|studio_microphone=🎙|stuffed_flatbread=🥙|stupa=🛓|sun=☀️|sun_behind_cloud=⛅|sun_behind_cloud_with_rain=🌦|sun_with=🌞|sun_with_face=🌞|sun_with_rays=☀️|sun_with_small_cloud=🌤|sunflower=🌻|sunglasses=😎|sunrise=🌅|sunrise_over_mountains=🌄|sunset_over_buildings=🌇|superhero=🦸|supervillain=🦹|surfer=🏄|sus=🤨|sushi=🍣|suspension_railway=🚟|swan=🦢|sweat=😓|sweat_drops=💦|sweat_smile=😅|sweating=😅|swimmer=🏊|sword=🗡️|swords=⚔️|symbol_for_marks_chapter=🕅|synagogue=🕍|syringe=💉|t_rex=🦖|t_shirt=👕|table_tennis_paddle_and_ball=🏓|taco=🌮|tada=🎉|takeout_box=🥡|tamale=🫔|tanabata_tree=🎋|tangerine=🍊|tape_cartridge=🖭|target=🎯|taurus=♉|taxi=🚕|teacup_without_handle=🍵|teapot=🫖|tear=🥲|tear_off_calendar=📆|tears_of_joy=😂|teddy_bear=🧸|telephone=☎️|telephone_on_top_of_modem=🖀|telephone_receiver=📞|telephone_receiver_with_page=🕼|telescope=🔭|television=📺|tennis_racquet_and_ball=🎾|tent=⛺|test_tube=🧪|thermometer=🌡|thinking=🤔|thinking_face=🤔|third_place_medal=🥉|thong_sandal=🩴|thought_balloon=💭|three_button_mouse=🖱|three_networked_computers=🖧|three_rays_above=🗤|three_rays_below=🗥|three_rays_left=🗦|three_rays_right=🗧|three_speech_bubbles=🗫|throwing_a_kiss=😘|thumbs_down=👎|thumbs_down_sign=👎|thumbs_up=👍|thumbs_up_sign=👍|thumbsdown=👎|thumbsup=👍|thunder_cloud_and_rain=⛈️|ticket=🎫|tiger=🐯|tiger_face=🐯|timer_clock=⏲️|tired=😫|tired_face=😫|toilet=🚽|tokyo_tower=🗼|tomato=🍅|tongue=👅|toolbox=🧰|tooth=🦷|toothbrush=🪥|top_hat=🎩|top_with_upwards_arrow_above=🔝|tornado=🌪️|touchtone_telephone=🕾|tr=🇹🇷|trackball=🖲|tractor=🚜|trade_mark=™️|trade_mark_sign=™️|train=🚆|tram=🚊|tram_car=🚋|triangle_with_rounded_corners=🛆|triangular_flag_on_post=🚩|triangular_ruler=📐|trident_emblem=🔱|triumph=😤|troll=🧌|trolleybus=🚎|trophy=🏆|tropical_drink=🍹|tropical_fish=🐠|trumpet=🎺|tulip=🌷|tumbler_glass=🥃|turkey=🦃|turkiye=🇹🇷|turned_ok_hand=🖏|turned_ok_hand_sign=🖏|turtle=🐢|twisted_rightwards_arrows=🔀|two_button_mouse=🖰|two_hearts=💕|two_men_holding_hands=👬|two_speech_bubbles=🗪|two_women_holding_hands=👭|ufo=🛸|umbrella=☂️|umbrella_on_ground=⛱️|umbrella_with_rain_drops=☔|unamused=😒|unamused_face=😒|uneven_eyes_and_wavy_mouth=🥴|unicorn=🦄|unicorn_face=🦄|universal_recycling_symbol=♻️|up=🆙|up_down_arrow=↕️|up_pointing_airplane=🛧|up_pointing_backhand_index=👆|up_pointing_double_triangle=⏫|up_pointing_index=☝️|up_pointing_military_airplane=🛦|up_pointing_red_triangle=🔺|up_pointing_small_airplane=🛨|up_pointing_small_red_triangle=🔼|up_with_exclamation_mark=🆙|upper_right_shadowed_white_circle=🔿|upside_down=🙃|upside_down_face=🙃|upwards_black_arrow=⬆️|v=✌️|vampire=🧛|vertical_traffic_light=🚦|vibration_mode=📳|victory_hand=✌️|video_camera=📹|video_game=🎮|videocassette=📼|violin=🎻|virgo=♍|volcano=🌋|volleyball=🏐|vomit=🤮|waffle=🧇|waning_crescent_moon=🌘|waning_crescent_moon_symbol=🌘|waning_gibbous_moon=🌖|waning_gibbous_moon_symbol=🌖|warning=⚠️|warning_sign=⚠️|wastebasket=🗑|watch=⌚|water=💧|water_buffalo=🐃|water_closet=🚾|water_polo=🤽|water_wave=🌊|watermelon=🍉|wave=👋|wave_water=🌊|waving_black_flag=🏴|waving_hand=👋|waving_hand_sign=👋|waving_white_flag=🏳|wavy_dash=〰️|waxing_crescent_moon=🌒|waxing_crescent_moon_symbol=🌒|waxing_gibbous_moon=🌔|waxing_gibbous_moon_symbol=🌔|weary=😩|weary_cat=🙀|weary_cat_face=🙀|weary_face=😩|wedding=💒|weight_lifter=🏋|whale=🐳|wheel=🛞|wheel_of_dharma=☸️|wheelchair=♿|wheelchair_symbol=♿|white_check_mark=✅|white_circle=⚪|white_down_pointing_backhand_index=👇|white_down_pointing_left_hand_index=🖗|white_exclamation_mark_ornament=❕|white_flower=💮|white_frowning=☹️|white_frowning_face=☹️|white_hard_shell_floppy_disk=🖫|white_heart=🤍|white_heavy_check_mark=✅|white_large_square=⬜|white_latin_cross=🕆|white_left_pointing_backhand_index=👈|white_medium_small_square=◽|white_medium_square=◻️|white_medium_star=⭐|white_pennant=🏱|white_question_mark_ornament=❔|white_right_pointing_backhand_index=👉|white_small_square=▫️|white_smiling=☺️|white_smiling_face=☺️|white_square_button=🔳|white_sun=🌣|white_sun_behind_cloud=🌥|white_sun_behind_cloud_with_rain=🌦|white_sun_with_small_cloud=🌤|white_touchtone_telephone=🕾|white_up_pointing_backhand_index=👆|white_up_pointing_index=☝️|wilted_flower=🥀|wind_blowing=🌬|wind_blowing_face=🌬|wind_chime=🎐|window=🪟|wine_glass=🍷|wing=🪽|wink=😉|winking=😉|winking_face=😉|wired_keyboard=🖮|wireless=🛜|with_cold_sweat=😓|with_cowboy_hat=🤠|with_diagonal_mouth=🫤|with_finger_covering_closed_lips=🤫|with_head_bandage=🤕|with_look_of_triumph=😤|with_medical_mask=😷|with_monocle=🧐|with_no_good_gesture=🙅|with_ok_gesture=🙆|with_one_eyebrow_raised=🤨|with_open_eyes_and_hand_over_mouth=🫢|with_open_mouth=😮|with_open_mouth_and_cold_sweat=😰|with_open_mouth_vomiting=🤮|with_party_horn_and_party_hat=🥳|with_peeking_eye=🫣|with_pleading_eyes=🥺|with_rolling_eyes=🙄|with_stuck_out_tongue=😛|with_stuck_out_tongue_and_tightly_closed_eyes=😝|with_stuck_out_tongue_and_winking_eye=😜|with_tears_of_joy=😂|with_thermometer=🤒|with_uneven_eyes_and_wavy_mouth=🥴|without_mouth=😶|wolf=🐺|wolf_face=🐺|woman=👩|woman_with_bunny_ears=👯|womans_boots=👢|womans_clothes=👚|womans_hat=👒|womans_sandal=👡|womens=🚺|womens_symbol=🚺|wood=🪵|world_map=🗺|worm=🪱|worried=😟|worried_face=😟|wow=😮|wrapped_present=🎁|wrench=🔧|wrestlers=🤼|writing_hand=✍️|x=❌|x_ray=🩻|yawning=🥱|yawning_face=🥱|yellow_circle=🟡|yellow_heart=💛|yes=✅|yin_yang=☯️|yo_yo=🪀|yum=😋|zany=🤪|zap=⚡|zebra=🦓|zebra_face=🦓|zipper_mouth=🤐|zipper_mouth_face=🤐|zombie=🧟";
  var EMOJI = null;
  var EMOJI_NAMES = [];

  function emojiInit() {
    if (EMOJI) return;
    EMOJI = Object.create(null);
    var parts = EMOJI_RAW.split("|");
    for (var i = 0; i < parts.length; i++) {
      var k = parts[i].indexOf("=");
      if (k < 1) continue;
      var name = parts[i].slice(0, k);
      EMOJI[name] = parts[i].slice(k + 1);
      EMOJI_NAMES.push(name);
    }
  }

  function convertEmoji(text) {
    emojiInit();
    text = text.replace(/:([A-Za-z0-9_+\-]{1,40}):/g, function (all, n) {
      return EMOJI[n.toLowerCase()] || all;
    });
    text = text.replace(/(^|\s):([A-Za-z0-9_+\-]{1,40})(?=\s|$)/g, function (all, pre, n) {
      var e = EMOJI[n.toLowerCase()];
      return e ? pre + e : all;
    });
    return text;
  }

  function safeSlice(s, n) {
    if (s.length <= n) return s;
    var c = s.charCodeAt(n - 1);
    if (c >= 0xd800 && c <= 0xdbff) n--;
    return s.slice(0, n);
  }

  /* ---------------- Emoji öneri kutusu ---------------- */

  var sugEl = null;
  var sugItems = [];
  var sugIndex = 0;

  function sugQuery() {
    if (!chatInputEl) return null;
    var before = chatInputEl.value.slice(0, chatInputEl.selectionStart);
    var m = /(?:^|\s):([A-Za-z0-9_+\-]{2,40})$/.exec(before);
    return m ? m[1].toLowerCase() : null;
  }

  function hideSuggest() {
    sugItems = [];
    if (sugEl) sugEl.style.display = "none";
  }

  function renderSuggest() {
    if (!sugEl) return;
    while (sugEl.firstChild) sugEl.removeChild(sugEl.firstChild);
    sugItems.forEach(function (name, i) {
      var row = document.createElement("div");
      row.className = "fbc-sug-row" + (i === sugIndex ? " on" : "");
      var e = document.createElement("span");
      e.className = "fbc-sug-e";
      e.textContent = EMOJI[name];
      var n = document.createElement("span");
      n.textContent = ":" + name;
      row.appendChild(e);
      row.appendChild(n);
      row.addEventListener("mousedown", function (ev) {
        ev.preventDefault();
        pickSuggest(i);
      });
      sugEl.appendChild(row);
    });
    sugEl.style.display = sugItems.length ? "block" : "none";
  }

  function updateSuggest() {
    var q = sugQuery();
    if (!q) return hideSuggest();
    emojiInit();
    var starts = [];
    var inc = [];
    for (var i = 0; i < EMOJI_NAMES.length; i++) {
      var nm = EMOJI_NAMES[i];
      var p = nm.indexOf(q);
      if (p === 0) starts.push(nm);
      else if (p > 0) inc.push(nm);
    }
    var byLen = function (a, b) { return a.length - b.length || (a < b ? -1 : 1); };
    starts.sort(byLen);
    inc.sort(byLen);
    sugItems = starts.concat(inc).slice(0, 6);
    sugIndex = 0;
    if (!sugItems.length) return hideSuggest();
    renderSuggest();
  }

  function pickSuggest(i) {
    var name = sugItems[i];
    if (!name || !chatInputEl) return;
    var v = chatInputEl.value;
    var pos = chatInputEl.selectionStart;
    var before = v.slice(0, pos).replace(/:([A-Za-z0-9_+\-]{2,40})$/, function () {
      return EMOJI[name] + " ";
    });
    chatInputEl.value = before + v.slice(pos);
    chatInputEl.setSelectionRange(before.length, before.length);
    hideSuggest();
    chatInputEl.focus();
  }

  /* ---------------- Chat ---------------- */

  var chatListEl = null;
  var chatBarEl = null;

  function injectChatStyle() {
    if (document.getElementById("fbc-style")) return;
    var st = document.createElement("style");
    st.id = "fbc-style";
    st.textContent = [
      ".fbc-wrap{position:fixed;left:10px;bottom:36px;z-index:99997;width:380px;max-width:60vw;",
      "  flex-direction:column;pointer-events:none;color:#fff;",
      "  font:15px/1.35 'Segoe UI','Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',Arial,sans-serif;",
      "  text-shadow:1px 1px 2px #000;}",
      ".fbc-list{display:flex;flex-direction:column;max-height:240px;overflow:hidden;}",
      ".fbc-open .fbc-list{overflow-y:auto;pointer-events:auto;}",
      ".fbc-msg{flex:none;padding:2px 6px;background:rgba(0,0,0,.45);word-break:break-word;}",
      ".fbc-msg.fbc-hide{display:none;}",
      ".fbc-name{font-weight:bold;}",
      ".fbc-fire .fbc-name{color:#ff9a5c;}",
      ".fbc-water .fbc-name{color:#6cc9ff;}",
      ".fbc-bar{display:none;position:relative;margin-top:4px;pointer-events:auto;}",
      ".fbc-open .fbc-bar{display:block;}",
      ".fbc-inp{width:100%;box-sizing:border-box;padding:5px 8px;outline:none;font:inherit;color:#fff;",
      "  background:rgba(0,0,0,.7);border:1px solid rgba(255,255,255,.35);}",
      ".fbc-sug{display:none;position:absolute;left:0;right:0;bottom:100%;background:rgba(0,0,0,.85);",
      "  border:1px solid rgba(255,255,255,.25);}",
      ".fbc-sug-row{display:flex;align-items:center;gap:8px;padding:2px 8px;cursor:pointer;}",
      ".fbc-sug-row.on{background:rgba(255,255,255,.2);}",
      ".fbc-sug-e{width:24px;text-align:center;}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function buildMsgEl(m) {
    var el = document.createElement("div");
    el.className = "fbc-msg " + (m.from === "host" ? "fbc-fire" : "fbc-water");
    var nm = document.createElement("span");
    nm.className = "fbc-name";
    nm.textContent = (m.from === "host" ? t("chatFireName") : t("chatWaterName")) + ": ";
    var tx = document.createElement("span");
    tx.textContent = m.text;
    el.appendChild(nm);
    el.appendChild(tx);
    return el;
  }

  function renderChat() {
    if (!chatEl) return;
    var now = Date.now();
    var any = false;
    for (var i = 0; i < chatMessages.length; i++) {
      var m = chatMessages[i];
      var age = now - m.at;
      var hide = !chatOpen && age > CHAT_FADE_MS;
      m.el.classList.toggle("fbc-hide", hide);
      if (!hide) any = true;
    }
    if (!chatOpen && !any) chatEl.style.display = "none";
  }

  function scrollChatDown() {
    if (chatListEl) chatListEl.scrollTop = chatListEl.scrollHeight;
  }

  function showChatPanel() {
    if (!chatEl) return;
    chatEl.style.display = "flex";
  }

  function addChatMessage(from, text) {
    if (!chatListEl) return;
    text = String(text).replace(/[\r\n\t]+/g, " ");
    var m = { from: from, text: text, at: Date.now(), el: null };
    m.el = buildMsgEl(m);
    chatMessages.push(m);
    chatListEl.appendChild(m.el);
    while (chatMessages.length > MAX_CHAT_MSGS) {
      var old = chatMessages.shift();
      if (old.el && old.el.parentNode) old.el.parentNode.removeChild(old.el);
    }
    showChatPanel();
    renderChat();
    scrollChatDown();
  }

  function clearChat() {
    chatMessages = [];
    chatOpen = false;
    hideSuggest();
    if (chatListEl) while (chatListEl.firstChild) chatListEl.removeChild(chatListEl.firstChild);
    if (chatEl) {
      chatEl.classList.remove("fbc-open");
      chatEl.style.display = "none";
    }
  }

  function openChat() {
    if (!chatEl) return;
    chatOpen = true;
    try {
      var gk = getGame();
      if (gk && gk.input && gk.input.keyboard && gk.input.keyboard.reset) gk.input.keyboard.reset(false);
    } catch (e) {}
    chatEl.classList.add("fbc-open");
    chatEl.style.display = "flex";
    renderChat();
    scrollChatDown();
    chatInputEl.focus();
  }

  function closeChat() {
    if (!chatEl) return;
    chatOpen = false;
    chatInputEl.value = "";
    hideSuggest();
    chatEl.classList.remove("fbc-open");
    if (chatInputEl.blur) chatInputEl.blur();
    renderChat();
  }

  function sendChat() {
    var text = chatInputEl ? safeSlice(convertEmoji(chatInputEl.value.trim()), 200).trim() : "";
    if (!text || !connected || !peerHere) { closeChat(); return; }
    send({ t: "chat", msg: text });
    addChatMessage(role, text);
    chatInputEl.value = "";
    closeChat();
  }

  function buildChatUI() {
    injectChatStyle();
    emojiInit();
    chatEl = document.createElement("div");
    chatEl.className = "fbc-wrap";
    chatEl.style.display = "none";

    chatListEl = document.createElement("div");
    chatListEl.className = "fbc-list";

    chatBarEl = document.createElement("div");
    chatBarEl.className = "fbc-bar";
    sugEl = document.createElement("div");
    sugEl.className = "fbc-sug";
    chatInputEl = document.createElement("input");
    chatInputEl.type = "text";
    chatInputEl.className = "fbc-inp";
    chatInputEl.maxLength = 200;
    chatInputEl.autocomplete = "off";
    chatInputEl.spellcheck = false;
    chatInputEl.placeholder = t("chatPlaceholder");
    chatBarEl.appendChild(sugEl);
    chatBarEl.appendChild(chatInputEl);

    chatEl.appendChild(chatListEl);
    chatEl.appendChild(chatBarEl);
    document.body.appendChild(chatEl);

    chatInputEl.addEventListener("input", function () {
      var v = chatInputEl.value;
      var pos = chatInputEl.selectionStart;
      var before = v.slice(0, pos);
      var after = v.slice(pos);
      var nb = before.replace(/:([A-Za-z0-9_+\-]{1,40}):$/, function (all, n) {
        return EMOJI[n.toLowerCase()] || all;
      });
      if (nb === before) {
        nb = before.replace(/(^|\s):([A-Za-z0-9_+\-]{1,40})(\s)$/, function (all, pre, n, sp) {
          var e = EMOJI[n.toLowerCase()];
          return e ? pre + e + sp : all;
        });
      }
      if (nb !== before) {
        chatInputEl.value = nb + after;
        chatInputEl.setSelectionRange(nb.length, nb.length);
      }
      updateSuggest();
    });

    ["keydown", "keyup", "keypress"].forEach(function (ev) {
      chatInputEl.addEventListener(ev, function (e) {
        e.stopPropagation();
        if (ev !== "keydown") return;
        if (e.key === "Tab") e.preventDefault();
        if (sugItems.length) {
          if (e.key === "ArrowDown") { sugIndex = (sugIndex + 1) % sugItems.length; renderSuggest(); e.preventDefault(); return; }
          if (e.key === "ArrowUp") { sugIndex = (sugIndex + sugItems.length - 1) % sugItems.length; renderSuggest(); e.preventDefault(); return; }
          if (e.key === "Tab" || e.key === "Enter") { pickSuggest(sugIndex); e.preventDefault(); return; }
          if (e.key === "Escape") { hideSuggest(); e.preventDefault(); return; }
        }
        if (e.key === "Enter") { sendChat(); e.preventDefault(); }
        if (e.key === "Escape") { closeChat(); e.preventDefault(); }
      });
    });

    setInterval(function () {
      if (chatEl && chatEl.style.display !== "none" && !chatOpen) renderChat();
    }, 300);
  }

  /* ---------------- Menü ---------------- */

  function loadSaved(key, def) {
    try {
      return window.localStorage.getItem("fbwg-online:" + key) || def;
    } catch (e) {
      return def;
    }
  }

  function save(key, val) {
    try {
      window.localStorage.setItem("fbwg-online:" + key, val);
    } catch (e) {}
  }

  var ICONS = {
    fire: [
      "M12 2C12 2 8 6 8 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.6-1-2.6-1-2.6s.4 2.4-1.6 3.2c0 0 .2-3-1.4-5-1.4 1.6-2 3.4-2 4.4z",
      "#ff9a3c"
    ],
    water: [
      "M12 2C12 2 5 10 5 14.5c0 3.9 3.1 7 7 7s7-3.1 7-7C19 10 12 2 12 2z",
      "#3ec6ff"
    ]
  };

  function iconSvg(kind, size, color) {
    var c = color || ICONS[kind][1];
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" style="display:block;flex:none">' +
      '<path d="' + ICONS[kind][0] + '" fill="' + c + '" stroke="' + c + '" stroke-width="1" stroke-linejoin="round"/></svg>';
  }

  function injectMenuStyle() {
    if (document.getElementById("onl-style")) return;
    var st = document.createElement("style");
    st.id = "onl-style";
    st.textContent = [
      ".onl-wrap{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;display:none;background:rgba(4,6,14,.62);",
      "  font:14px 'Segoe UI','Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',system-ui,sans-serif;color:#e9edff;}",
      ".onl-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:390px;max-width:94vw;",
      "  max-height:92vh;overflow-y:auto;box-sizing:border-box;padding:16px 18px 12px;border-radius:22px;",
      "  background:linear-gradient(165deg,#1a1f36 0%,#0f1222 100%);border:1px solid rgba(255,255,255,.1);",
      "  box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.4);animation:onlPop .18s ease-out;}",
      ".onl-card::-webkit-scrollbar{width:6px}",
      ".onl-card::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:3px}",
      ".onl-head{display:flex;align-items:center;gap:12px;margin-bottom:12px;}",
      ".onl-logo{flex:none;display:flex;align-items:center;justify-content:center;gap:1px;width:46px;height:46px;",
      "  border-radius:14px;background:linear-gradient(135deg,rgba(255,130,70,.22),rgba(60,170,255,.22));",
      "  border:1px solid rgba(255,255,255,.14);}",
      ".onl-title{flex:1;min-width:0;}",
      ".onl-t1{font-size:19px;font-weight:800;letter-spacing:.2px;line-height:1.15;",
      "  background:linear-gradient(90deg,#ffa36b,#7fd6ff);-webkit-background-clip:text;background-clip:text;color:transparent;}",
      ".onl-t2{font-size:11.5px;color:rgba(233,237,255,.5);margin-top:2px;}",
      ".onl-x{flex:none;width:30px;height:30px;border-radius:50%;border:none;cursor:pointer;color:rgba(255,255,255,.7);",
      "  background:rgba(255,255,255,.08);font-size:13px;line-height:30px;padding:0;transition:background .15s;}",
      ".onl-x:hover{background:rgba(255,255,255,.18);color:#fff;}",
      ".onl-chip{display:flex;align-items:center;gap:7px;padding:5px 11px;border-radius:999px;margin-bottom:6px;",
      "  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:12.5px;font-weight:600;}",
      ".onl-chip b{width:8px;height:8px;border-radius:50%;background:#7a8099;flex:none;}",
      ".onl-chip.wait b{background:#ffc94d;box-shadow:0 0 8px rgba(255,201,77,.7);}",
      ".onl-chip.on b{background:#4be38a;box-shadow:0 0 8px rgba(75,227,138,.75);}",
      ".onl-sec{font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:rgba(233,237,255,.42);",
      "  margin:14px 2px 6px;}",
      ".onl-sec:first-of-type{margin-top:0;}",
      ".onl-lbl{display:block;font-size:12px;color:rgba(233,237,255,.62);margin:7px 2px 4px;}",
      ".onl-in{width:100%;box-sizing:border-box;height:38px;padding:0 13px;border-radius:12px;outline:none;color:#fff;",
      "  font:inherit;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);",
      "  transition:border-color .15s,box-shadow .15s,background .15s;}",
      ".onl-in:focus{border-color:#6aaeff;background:rgba(255,255,255,.09);box-shadow:0 0 0 3px rgba(80,150,255,.22);}",
      ".onl-in::placeholder{color:rgba(255,255,255,.3);}",
      ".onl-btns{display:flex;gap:10px;margin-top:11px;}",
      ".onl-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;height:46px;border:none;border-radius:14px;",
      "  cursor:pointer;color:#fff;font:inherit;font-weight:700;text-align:left;padding:0 10px;",
      "  transition:transform .1s,filter .15s,box-shadow .15s;}",
      ".onl-btn small{display:block;font-size:11px;font-weight:600;opacity:.82;margin-top:1px;}",
      ".onl-btn:hover{filter:brightness(1.1);}",
      ".onl-btn:active{transform:scale(.97);}",
      ".onl-fire{background:linear-gradient(135deg,#ff9a3c,#f2443a);box-shadow:0 6px 16px rgba(240,80,50,.35);}",
      ".onl-water{background:linear-gradient(135deg,#3ec6ff,#2f6df0);box-shadow:0 6px 16px rgba(50,130,255,.35);}",
      ".onl-ghost{width:100%;flex:none;margin-top:12px;height:38px;background:transparent;color:#ff9d9d;box-shadow:none;",
      "  border:1.5px solid rgba(255,110,110,.4);justify-content:center;}",
      ".onl-ghost:hover{background:rgba(255,90,90,.12);}",
      ".onl-row{display:flex;align-items:center;gap:14px;padding:7px 12px;margin-bottom:5px;border-radius:12px;cursor:pointer;",
      "  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);transition:background .15s;}",
      ".onl-row:hover{background:rgba(255,255,255,.075);}",
      ".onl-rtxt{flex:1;min-width:0;}",
      ".onl-rt{font-weight:600;font-size:13.5px;}",
      ".onl-rd{font-size:11.5px;color:rgba(233,237,255,.5);margin-top:1px;line-height:1.3;}",
      ".onl-sw{position:relative;flex:none;width:42px;height:24px;}",
      ".onl-sw input{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;}",
      ".onl-sw i{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:999px;background:rgba(255,255,255,.16);",
      "  transition:background .2s;pointer-events:none;}",
      ".onl-sw i:after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;",
      "  box-shadow:0 1px 4px rgba(0,0,0,.4);transition:transform .2s;}",
      ".onl-sw input:checked+i{background:linear-gradient(90deg,#ff8a50,#3aa8ff);}",
      ".onl-sw input:checked+i:after{transform:translateX(18px);}",
      ".onl-sliderbox{padding:8px 13px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);}",
      ".onl-slhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}",
      ".onl-val{font-weight:700;font-size:13px;color:#9fd8ff;}",
      ".onl-range{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:3px;outline:none;margin:2px 0 0;",
      "  background:linear-gradient(90deg,#ff8a50 0,#3aa8ff var(--p,30%),rgba(255,255,255,.16) var(--p,30%));cursor:pointer;}",
      ".onl-range::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#fff;",
      "  border:none;box-shadow:0 1px 6px rgba(0,0,0,.5);}",
      ".onl-foot{margin-top:10px;text-align:center;font-size:11px;color:rgba(233,237,255,.38);line-height:1.5;}",
      ".onl-foot kbd{font:inherit;font-weight:700;color:rgba(233,237,255,.62);padding:1px 6px;border-radius:5px;",
      "  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);}",
      ".onl-select{-webkit-appearance:none;appearance:none;background-color:rgba(255,255,255,.06);",
      "  background-image:linear-gradient(45deg,transparent 50%,rgba(255,255,255,.7) 50%),linear-gradient(135deg,rgba(255,255,255,.7) 50%,transparent 50%);",
      "  background-position:calc(100% - 16px) 50%,calc(100% - 11px) 50%;background-size:5px 5px,5px 5px;background-repeat:no-repeat;}",
      ".onl-select option{background:#1a1f36;color:#fff;}",
      "@keyframes onlPop{from{opacity:0;transform:translate(-50%,-48%) scale(.96);}to{opacity:1;transform:translate(-50%,-50%);}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  function updatePanelState() {
    if (!panelEl) return;
    var el = panelEl.querySelector("#onl-state");
    if (!el || !el.parentNode) return;
    var cls = "onl-chip";
    var txt;
    if (!connected) {
      txt = sock ? t("stateConnecting") : t("stateNoConn");
      if (sock) cls += " wait";
    } else if (!peerHere) {
      txt = role === "host" ? t("stateHostReady") : t("stateGuestReady");
      cls += " wait";
    } else {
      txt = role === "host" ? t("stateHostBoth") : t("stateGuestBoth");
      cls += " on";
    }
    el.textContent = txt;
    el.parentNode.className = cls;
  }

  function buildUI() {
    statusEl = document.createElement("div");
    statusEl.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:99998;font:12px sans-serif;color:#fff;" +
      "background:rgba(0,0,0,.55);padding:3px 8px;border-radius:4px;pointer-events:none";
    statusEl.textContent = t("statusLoaded", VERSION);
    document.body.appendChild(statusEl);

    injectMenuStyle();
    panelEl = document.createElement("div");
    panelEl.className = "onl-wrap";
    panelEl.style.display = "none";
    document.body.appendChild(panelEl);

    panelEl.addEventListener("mousedown", function (e) {
      if (e.target === panelEl) panelEl.style.display = "none";
    });

    buildChatUI();

    // Global klavye kısayolları (sadece bir kere kurulur)
    window.addEventListener(
      "keydown",
      function (e) {
        if (e.key === "Escape" && panelEl.style.display !== "none") {
          panelEl.style.display = "none";
          e.preventDefault();
        }
        if (e.key === "F9" || (e.key === "Tab" && !chatOpen)) {
          panelEl.style.display = panelEl.style.display === "none" ? "block" : "none";
          updatePanelState();
          e.preventDefault();
        }
        if (e.key === "Enter" && connected && peerHere && !chatOpen && panelEl.style.display === "none") {
          openChat();
          e.preventDefault();
        }
        if (e.key === "F7") {
          if (!logPath) {
            initLog();
            say(t("mRecStarted", logPath || t("mNoFile")));
          }
          log("=== F7 ISARETI: bug simdi gorüldü === " + describeNow());
          flushLog();
          say(t("mF7Mark", logPath));
          e.preventDefault();
        }
        if (e.key === "F8" && role === "guest" && attached) {
          forceSnapUntil = Date.now() + 400;
          send({ t: "rs" });
          say(t("mForcing"));
          e.preventDefault();
        }
        if (e.key === "F6") {
          if (!logPath) initLog();
          dumpLevelStructure();
          e.preventDefault();
        }
        if (role === "guest" && attached && peerHere && !chatOpen && !e.repeat) {
          var typing = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
          if (!typing && (e.code === "KeyW" || e.code === "ArrowUp")) {
            send({ t: "ev", ev: "jump" });
          }
        }
      },
      true
    );

    populateMenu();
    updatePanelState();
  }

  // Menü içeriğini dile göre kur. Dil değişince tekrar çağrılır.
  function populateMenu() {
    while (panelEl.firstChild) panelEl.removeChild(panelEl.firstChild);

    panelEl.innerHTML =
      "<div class='onl-card'>" +
        "<div class='onl-head'>" +
          "<div class='onl-logo'>" + iconSvg("fire", 20) + iconSvg("water", 20) + "</div>" +
          "<div class='onl-title'><div class='onl-t1'>" + t("menuTitle") + "</div>" +
          "<div class='onl-t2'>" + t("menuSub", VERSION) + "</div></div>" +
          "<button class='onl-x' id='onl-close' title='" + t("closeTitle") + "'>✕</button>" +
        "</div>" +
        "<div class='onl-chip'><b></b><span id='onl-state'></span></div>" +

        "<div class='onl-sec'>" + t("secConn") + "</div>" +
        "<label class='onl-lbl' for='onl-addr'>" + t("lblAddr") + "</label>" +
        "<input id='onl-addr' class='onl-in' placeholder='127.0.0.1:7777' spellcheck='false' autocomplete='off'>" +
        "<div class='onl-btns'>" +
          "<button class='onl-btn onl-fire' id='onl-host'>" + iconSvg("fire", 22, "#fff") +
            "<span>" + t("btnStart") + "<small>" + t("btnStartSub") + "</small></span></button>" +
          "<button class='onl-btn onl-water' id='onl-join'>" + iconSvg("water", 22, "#fff") +
            "<span>" + t("btnJoin") + "<small>" + t("btnJoinSub") + "</small></span></button>" +
        "</div>" +

        "<div class='onl-sec'>" + t("secSet") + "</div>" +
        "<label class='onl-row'><div class='onl-rtxt'><div class='onl-rt'>" + t("setAlt") + "</div>" +
          "<div class='onl-rd'>" + t("setAltDesc") + "</div></div>" +
          "<span class='onl-sw'><input type='checkbox' id='onl-alt'><i></i></span></label>" +
        "<label class='onl-row'><div class='onl-rtxt'><div class='onl-rt'>" + t("setComp") + "</div>" +
          "<div class='onl-rd'>" + t("setCompDesc") + "</div></div>" +
          "<span class='onl-sw'><input type='checkbox' id='onl-comp'><i></i></span></label>" +
        "<label class='onl-row'><div class='onl-rtxt'><div class='onl-rt'>" + t("setAuto") + "</div>" +
          "<div class='onl-rd'>" + t("setAutoDesc") + "</div></div>" +
          "<span class='onl-sw'><input type='checkbox' id='onl-auto'><i></i></span></label>" +
        "<div class='onl-sliderbox'><div class='onl-slhead'><div><div class='onl-rt'>" + t("setCap") + "</div>" +
          "<div class='onl-rd'>" + t("setCapDesc") + "</div></div><div class='onl-val' id='onl-capv'></div></div>" +
          "<input type='range' id='onl-cap' class='onl-range' min='20' max='320' step='10'></div>" +

        // ---- Dil seçici ----
        "<div class='onl-row' style='cursor:default;'><div class='onl-rtxt'><div class='onl-rt'>" + t("setLang") + "</div>" +
          "<div class='onl-rd'>" + t("setLangDesc") + "</div></div>" +
          "<select id='onl-lang' class='onl-in onl-select' style='width:120px;height:36px;flex:none;padding:0 26px 0 10px;cursor:pointer;'>" +
            "<option value='tr'>Türkçe</option>" +
            "<option value='en'>English</option>" +
          "</select></div>" +

        "<button class='onl-btn onl-ghost' id='onl-off'>" + t("btnDisconnect") + "</button>" +
        "<div class='onl-foot'>" + t("footText") + "</div>" +
      "</div>";

    panelEl.querySelector("#onl-close").onclick = function () {
      panelEl.style.display = "none";
    };

    var addr = panelEl.querySelector("#onl-addr");
    addr.value = loadSaved("addr", DEFAULT_SERVER);

    var altBox = panelEl.querySelector("#onl-alt");
    altBox.checked = altKeysOn;
    altBox.onchange = function () {
      altKeysOn = altBox.checked;
      save("alt", altKeysOn ? "1" : "0");
      altBox.blur();
    };

    var compBox = panelEl.querySelector("#onl-comp");
    compBox.checked = compOn;
    compBox.onchange = function () {
      compOn = compBox.checked;
      save("comp", compOn ? "1" : "0");
      delayMs = compOn && rtt ? Math.min(80, rtt / 2 + 6) : 0;
      compBox.blur();
    };

    var autoBox = panelEl.querySelector("#onl-auto");
    autoBox.checked = autoReconnect;
    autoBox.onchange = function () {
      autoReconnect = autoBox.checked;
      save("auto", autoReconnect ? "1" : "0");
      autoBox.blur();
    };

    var capBox = panelEl.querySelector("#onl-cap");
    var capVal = panelEl.querySelector("#onl-capv");
    function showCap() {
      var v = parseInt(capBox.value, 10) || 100;
      capVal.textContent = v >= 320 ? t("capUnlimited") : v + t("capUnit");
      capBox.style.setProperty("--p", ((v - 20) / 300) * 100 + "%");
    }
    capBox.value = String(capKBs === 0 ? 320 : Math.max(20, Math.min(capKBs || 100, 310)));
    showCap();
    capBox.oninput = showCap;
    capBox.onchange = function () {
      var v = parseInt(capBox.value, 10) || 100;
      capKBs = v >= 320 ? 0 : v;
      save("cap", String(capKBs));
      capBox.blur();
    };

    // ---- Dil seçici ----
    var langBox = panelEl.querySelector("#onl-lang");
    langBox.value = LANG;
    langBox.onchange = function () {
      LANG = langBox.value === "en" ? "en" : "tr";
      save("lang", LANG);
      populateMenu();          // menüyü yeni dilde yeniden kur
      updatePanelState();
      if (chatInputEl) chatInputEl.placeholder = t("chatPlaceholder");
    };

    [addr, capBox].forEach(function (el) {
      ["keydown", "keyup", "keypress"].forEach(function (ev) {
        el.addEventListener(ev, function (e) {
          e.stopPropagation();
        });
      });
    });

    function go(r) {
      save("addr", addr.value);
      connect(addr.value, r);
      panelEl.style.display = "none";
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    }
    panelEl.querySelector("#onl-host").onclick = function () {
      go("host");
    };
    panelEl.querySelector("#onl-join").onclick = function () {
      go("join");
    };
    panelEl.querySelector("#onl-off").onclick = function () {
      disconnect(MANUAL_REASON, true);
      panelEl.style.display = "none";
    };
  }

  /* ---------------- Hızlı döngü (12 ms) ve ping ---------------- */

  function fastTick() {
    if (!attached || !level) return;
    var now = Date.now();
    if (role === "host") {
      applyRemoteInputOnHost();
      var c = level.pers1 && level.pers1.cursors;
      if (c) {
        if (c.left.isDown) hostPulse.l = 1;
        if (c.right.isDown) hostPulse.r = 1;
        if (c.up.isDown) hostPulse.u = 1;
      }
    } else if (role === "guest" && rawLocal) {
      inHist.push({
        t: now,
        l: rawLocal.left.isDown ? 1 : 0,
        r: rawLocal.right.isDown ? 1 : 0,
        u: rawLocal.up.isDown ? 1 : 0,
      });
      while (inHist.length > 2 && now - inHist[0].t > 300) inHist.shift();
      guestSendInput();
    }
  }

  function sendPing() {
    if (role === "guest" && peerHere) send({ t: "ping", ts: Date.now() });
  }

  /* ---------------- Başlat ---------------- */

  function start() {
    buildUI();
    setInterval(flushLog, 2000);
    setInterval(checkLevel, 100);
    setInterval(sendPing, 1000);
    setInterval(heartbeat, 2000);
    setInterval(refreshExtra, 500);
    console.info("[ONLINE] mod " + VERSION + " yüklendi");
  }

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start);
})();

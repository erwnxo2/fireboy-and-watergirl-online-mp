/* Ateş ve Su - Online Mod (prototip v0.9.11 - ONLINE SUNUCU (internet lobileri), v0.9.10 lobi tarayıcı TCP yoklaması, v0.9.9 LAN LOBİ TARAYICI, v0.9.8 senkron kontrolü, v0.9.7 oyun olayları senkronu, v0.9.6 donma düzeltmesi, TR/EN)
 *
 * v0.9.11: ONLINE SUNUCU. Oyun artık internetten de oynanabilir: merkezi sunucuya (fbwg-server.js, ayrı dosya, VPS'te çalışır)
 *   bağlanılır. Host "Başlat" deyince (Lobi türü: Online) sunucuda bir oda açılır; menüdeki lobi listesi yerel ağ lobilerinin yanında
 *   sunucudaki odaları da gösterir (🌐). Oda isteğe bağlı şifreli olabilir (🔒). Oyun verisi sunucu üzerinden aktarılır: host'ta port
 *   açmaya / IP öğrenmeye gerek yok. Yerel ağ modu (UDP + TCP tarama, elle IP) aynen çalışmaya devam eder.
 *   Sunucu adresi: menü → Ayarlar → "Online sunucu adresi" ya da aşağıdaki ONLINE_SERVER_DEFAULT satırı.
 *   Protokol eklemeleri: host {name, pw}, join {room, pw}, ok {room}, list/lobbies, err {fatal} (düzeltilemez hatada otomatik
 *   yeniden bağlanma yapılmaz: yanlış şifre, dolu/kapanmış lobi, sürüm uyuşmazlığı). Bağlantı kurma zaman aşımı 10 sn.
 *   İki taraf da yeni dosyayı kullanmalı (sürüm kontrolü).
 *
 * v0.9.10: LOBİ TARAYICI DÜZELTMESİ (TCP YOKLAMASI).
 *   (1) UDP yayını, gelen UDP'yi engelleyen güvenlik duvarı/ağ yüzünden öbür bilgisayara ulaşmayabiliyordu (elle IP ile TCP
 *       bağlantısı çalışırken liste boş kalıyordu). Tarayıcı artık ikinci bir yol da kullanıyor: yerel ağdaki adreslerin oyun
 *       portuna kısa bir TCP bağlantısı deneyip {"t":"info"} yollar; açık lobisi olan oyunun gömülü sunucusu özetini (ad, sürüm,
 *       oyuncu sayısı) cevaplar. Giden TCP genelde serbest olduğundan UDP çalışmasa da lobi görünür. İki yol aynı listeye yazar.
 *   (2) Lobi listesinin altına küçük bir tanı satırı eklendi (UDP dinleme durumu/paket sayısı, TCP'de taranan adres sayısı).
 *   Not: TCP yoklaması sadece oyunun gömülü sunucusunu açan host'ları bulur (ayrı çalışan server.js "info"ya cevap vermez).
 *   İki taraf da yeni dosyayı kullanmalı (sürüm kontrolü).
 *
 * v0.9.9: LAN LOBİ TARAYICI. IP yazmadan, aynı yerel ağdaki açık lobileri listeden görüp katılabilirsin.
 *   Host "Başlat" deyince lobisini UDP yayınıyla (port 7778, saniyede 1 kez) ağa duyurur: lobi adı, sürüm, oyuncu sayısı (1/2).
 *   Menü (F9) açıkken ve bağlı değilken oyun aynı portu dinler ve lobileri listeler; 4,5 sn duyuru gelmeyen lobi listeden düşer.
 *   Sürümü uyuşmayan ya da dolu (2/2) lobiye "Katıl" kapalıdır. Oyun verisi hâlâ TCP (7777) üzerinden gider, ağ protokolü değişmedi;
 *   elle IP:port yazarak bağlanma da çalışmaya devam eder. İki taraf da yeni dosyayı kullanmalı (sürüm kontrolü).
 *   Windows güvenlik duvarı ilk açılışta soruyorsa "Özel ağlar"a izin ver; yoksa liste boş kalır (UDP 7778 gelen).
 *   Ağ UDP yayınını engelliyorsa (bazı okul/kafe/konuk Wi-Fi ağları, istemci yalıtımı) liste boş kalır; elle IP ile bağlan.
 *
 * v0.9.8: SENKRON KONTROLÜ (kendini onaran). Host saniyede bir küçük bir özet yollar (ev:"chk"): aygıt durumları, çıkış kapıları,
 *   hangi elmasların alınmış olduğu. Aynı kanaldan, olayların hemen arkasından gittiği için guest o ana kadarki olayları
 *   işlemiş olur; guest kendi durumunu özetle karşılaştırır. Fark iki kontrol üst üste (~2 sn) sürerse guest host'tan tam durumu
 *   ister (rs) ve ekranda "senkron farkı bulundu" yazar; düzelince "senkron düzeldi" yazar. 5 denemede düzelmezse uyarır ve
 *   30 sn'de bir dener. Farklar kayda "SENKRON KONTROL" satırıyla yazılır (F7 ile kayıt dosyası). Toleranslar: aygıt durumu 0.1.
 *   Bu sürüm gerçek oyunla denenmedi; sahte oyun nesneleriyle mantık testi yapıldı. İki taraf da yeni dosyayı kullanmalı.
 *
 * v0.9.7: PLATFORM / DÜĞME / ŞALTER / ELMAS / ÇIKIŞ KAPISI SENKRONU (oyunun kendi kodu okunarak yazıldı).
 *   Oyunda platformlar, kapılar vb. "durum" (state) ile çalışır; durumu düğme/şalter belirler (MechManager.deviceChanged).
 *   Düğme ve şalterin durumu her bilgisayarda kendi fiziğinden hesaplanıyordu, bu yüzden iki tarafta ayrışıyor ve platform
 *   motorları farklı yöne itiyordu. Artık HOST tek otorite:
 *   (1) Host, level.objects içindeki her aygıtın state değerini değişince guest'e yollar (ev:"dv"); guest aynı değeri
 *       kendi aygıtına yazıp aynı motor/ışık/ses güncellemesini yapar. Guest'te aygıtların kendi signal.dispatch'i susturulur
 *       ve şalter/düğme/kaydırıcı checkState'i devre dışı bırakılır (karar sadece host'tan gelir).
 *   (2) Elmaslar: host toplanma olayını (hangi elmas, kim aldı) yollar (ev:"dia"); guest kendi temasını yok sayar ve olayı
 *       oyunun kendi grabbed() fonksiyonuyla uygular (sayaç, ses, gizlenme aynen).
 *   (3) Çıkış kapıları: host isOpen durumunu yollar (ev:"dr"); guest'te isOpen yerel temasla değişmez.
 *   (4) Platform gövdeleri guest'te her snapshot'ta host konumuna tam oturtulur (yumuşatma yok).
 *   (5) Guest bağlanınca / F8 ile / yeniden katılınca host tüm durumu tek seferde yeniden yollar.
 *   Bu sürüm gerçek oyunla denenmedi; sahte oyun nesneleriyle mantık testi yapıldı. Sorun olursa F7 → log.
 *
 * v0.9.6: GUEST'TE "ÇOK RESTART SONRASI OYUN BAŞLAMADAN DONUYOR" HATASI.
 *   Phaser'ın kare döngüsü (requestAnimationFrame) kare içinde bir hata fırlarsa kendini bir daha planlamaz: oyun kalıcı
 *   donar ama bizim DOM menümüz (Tab) çalışmaya devam eder. Bu hata şuradan doğuyordu: guest, host'tan "go" alınca eski
 *   bölümü öldürüp (killAll) geçiş yapıyordu; geçiş sürerken eski/ölü bölüm hâlâ güncelleniyor ve ölü Box2D gövdelerine
 *   snapshot uygulanıyordu. Hızlı restartlarda üst üste gelen "go" mesajları da (geçiş sürerken) sessizce atılıyordu.
 *   Düzeltmeler: (1) game.update hata yakalayıcıyla sarıldı: hata kaydedilir, döngü ölmez;
 *   (2) bekçi: döngü 1.5 sn ilerlemezse otomatik yeniden başlatılır + kayıt dosyası kendiliğinden açılır;
 *   (3) geçiş başlar başlamaz bölümle bağ koparılır (ölü gövdelere yazma/gönderme yok), geçiş bitmeden yeniden bağlanılmaz;
 *   (4) geçiş sürerken gelen "go" artık atılmaz, sıraya alınır (en yenisi uygulanır);
 *   (5) 12 sn'de başlamayan geçiş bir kez otomatik yeniden denenir; (6) restartlarda sızan ek tuş nesneleri önlendi;
 *   (7) aynı Level nesnesi yeniden kullanılsa bile yeni karakterler görülünce yeniden bağlanılır.
 *   Donma olursa F7'ye basın: fbwg-online-log.txt içinde "OYUN DÖNGÜSÜ HATASI" satırı asıl nedeni gösterir.
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
 * Gömülü sunucu: "Başlat" oyunun içinde sunucuyu açar, server.js'i ayrıca çalıştırmak gerekmez (port doluysa açık olan sunucuya bağlanır).
 *       Ağ protokolü ve sürüm aynı: misafir tarafında değişiklik yok, server.js hâlâ kullanılabilir.
 *
 * F9/Tab = menü.  F8 (guest) = zorla eşitle.  F7 = kayda işaret koy.  F6 = oyun yapısını kayda dök.
 *
 * TR/EN dil desteği: Menüden seçilir, localStorage'a yazılır. Ağ protokolü ve fizik mantığı değişmedi.
 */
(function () {
  "use strict";

  var VERSION = "v0.9.11";
  var DEFAULT_SERVER = "127.0.0.1:7777";
  // Merkezi sunucunun adresi (IP:port). Boş bırakırsan menüden (Ayarlar → Online sunucu adresi) girersin.
  var ONLINE_SERVER_DEFAULT = "";
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
      lblAddr: "Elle bağlan: sunucu adresi (IP:port)",
      btnStart: "Başlat",
      btnStartSub: "Ateş olarak",
      btnJoin: "Bağlan",
      btnJoinSub: "Su olarak",
      hostHint: "Başlat'a basarsan lobin aynı ağdaki arkadaşının lobi listesinde görünür. Elle bağlanacaksa adres: {0}",
      hostHintNone: "Ağ adresin bulunamadı; Windows'ta ipconfig ile IPv4 adresine bak.",
      mSrvStarted: "sunucu bu bilgisayarda açıldı (port {0}). Arkadaşın şuraya bağlansın: {1}",
      mSrvUsing: "port {0} zaten kullanımda, çalışan sunucuya bağlanılıyor",
      mSrvError: "sunucu açılamadı: {0}",
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
      mGoStuck: "bölüm yüklenemedi, menüden yeniden başlatın",
      mFriendDied: "arkadaşın öldü",
      mAttached: "seviyeye bağlandı ({0} nesne) - {1}",
      mAttachedHost: "Ateş: ok tuşları + W A D",
      mAttachedGuest: "Su: W A D + ok tuşları",
      mSigMismatch: "bölüm uyuşmuyor! (sen: {0} / host: {1}) Bölümü yeniden başlatın.",
      mSyncFix: "senkron düzeltmesi {0}",
      mChkFix: "senkron farkı bulundu ({0} fark), yeniden eşitleniyor",
      mChkOk: "senkron düzeldi",
      mChkStuck: "senkron düzelmiyor; F7'ye basıp fbwg-online-log.txt dosyasını gönder",
      mF6NoLevel: "F6: önce bir bölüme gir",
      mF6Dump: "yapı dökümü kayda yazıldı (F6) → {0}",
      mF7Mark: "işaret kaydedildi (F7) → {0}",
      mForcing: "zorla eşitleniyor",
      mRecStarted: "kayıt başlatıldı: {0}",
      mNoFile: "dosya oluşturulamadı",
      chatPlaceholder: "Mesaj yaz...",
      chatFireName: "Ateş",
      chatWaterName: "Su",
      secLobby: "Lobiler",
      lobbyEmpty: "Açık lobi bulunamadı. Biri Başlat'a basınca burada görünür.",
      lobbyJoin: "Katıl",
      lobbyFull: "Dolu",
      lobbyVer: "Sürüm uyuşmuyor",
      lobbyScanErr: "UDP taraması başlatılamadı: {0} (TCP taraması çalışıyor)",
      lblLobbyName: "Lobi adı (listede görünür)",
      btnLobbies: "🌐 Lobiler",
      btnOnline: "🌐 Online",
      lobbyDiag: "Tarama · UDP: {0} · TCP: {1}",
      diagUdpOk: "dinliyor, {0} paket",
      diagTcpHosts: "{0} adres",
      lblMode: "Lobi türü (Başlat için)",
      modeOnline: "Online (internet, sunucu üzerinden)",
      modeLan: "Yerel ağ",
      lblPw: "Lobi şifresi (isteğe bağlı; açarken ve katılırken)",
      setSrv: "Online sunucu adresi",
      setSrvDesc: "Merkezi sunucunun IP:port'u (örn. 203.0.113.5:7780)",
      srvDiag: "Online sunucu: {0}",
      srvNone: "adres girilmedi (Ayarlar)",
      srvConnecting: "bağlanıyor…",
      srvErr: "bağlanılamadı ({0})",
      srvOk: "bağlı · {0} ms · {1} lobi · {2} çevrimiçi",
      lobbyOnline: "Online",
      lobbyLocked: "Şifreli",
      lobbyNeedPw: "Bu lobi şifreli: şifreyi 'Lobi şifresi' kutusuna yaz, sonra Katıl'a bas.",
      mSrvNoAddr: "Online sunucu adresi girilmedi (menü → Ayarlar → Online sunucu adresi).",
      mOnlineHostReady: "online lobi açıldı: {0}; arkadaşın listeden katılabilir (sen: Ateş)",
      hostHintOnline: "Başlat'a basarsan lobin online listede görünür; arkadaşın IP yazmadan katılır."
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
      lblAddr: "Connect manually: server address (IP:port)",
      btnStart: "Start",
      btnStartSub: "as Fire",
      btnJoin: "Connect",
      btnJoinSub: "as Water",
      hostHint: "Start shows your lobby in your friend's lobby list on the same network. To connect manually, use: {0}",
      hostHintNone: "No network address found; check your IPv4 address with ipconfig.",
      mSrvStarted: "server started on this computer (port {0}). Your friend connects to: {1}",
      mSrvUsing: "port {0} is already in use, connecting to the running server",
      mSrvError: "could not start the server: {0}",
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
      mGoStuck: "level failed to load, restart it from the menu",
      mFriendDied: "your friend died",
      mAttached: "attached to level ({0} bodies) - {1}",
      mAttachedHost: "Fire: arrow keys + W A D",
      mAttachedGuest: "Water: W A D + arrow keys",
      mSigMismatch: "level mismatch! (you: {0} / host: {1}) Restart the level.",
      mSyncFix: "sync fix {0}",
      mChkFix: "sync difference found ({0}), resyncing",
      mChkOk: "sync restored",
      mChkStuck: "sync is not recovering; press F7 and send fbwg-online-log.txt",
      mF6NoLevel: "F6: enter a level first",
      mF6Dump: "level structure dumped to log (F6) → {0}",
      mF7Mark: "marker saved (F7) → {0}",
      mForcing: "forcing sync",
      mRecStarted: "log started: {0}",
      mNoFile: "could not create file",
      chatPlaceholder: "Type a message...",
      chatFireName: "Fire",
      chatWaterName: "Water",
      secLobby: "Lobbies",
      lobbyEmpty: "No open lobbies found. They show up here when someone presses Start.",
      lobbyJoin: "Join",
      lobbyFull: "Full",
      lobbyVer: "Version mismatch",
      lobbyScanErr: "Could not start UDP scan: {0} (TCP scan still running)",
      lblLobbyName: "Lobby name (shown in the list)",
      btnLobbies: "🌐 Lobbies",
      btnOnline: "🌐 Online",
      lobbyDiag: "Scan · UDP: {0} · TCP: {1}",
      diagUdpOk: "listening, {0} packets",
      diagTcpHosts: "{0} addresses",
      lblMode: "Lobby type (for Start)",
      modeOnline: "Online (internet, via server)",
      modeLan: "Local network",
      lblPw: "Lobby password (optional; when hosting and joining)",
      setSrv: "Online server address",
      setSrvDesc: "IP:port of the central server (e.g. 203.0.113.5:7780)",
      srvDiag: "Online server: {0}",
      srvNone: "no address set (Settings)",
      srvConnecting: "connecting…",
      srvErr: "cannot connect ({0})",
      srvOk: "connected · {0} ms · {1} lobbies · {2} online",
      lobbyOnline: "Online",
      lobbyLocked: "Password",
      lobbyNeedPw: "This lobby has a password: type it in the 'Lobby password' box, then press Join.",
      mSrvNoAddr: "No online server address set (menu → Settings → Online server address).",
      mOnlineHostReady: "online lobby opened: {0}; your friend can join from the list (you: Fire)",
      hostHintOnline: "Start puts your lobby in the online list; your friend joins without typing an IP."
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
  var peerRtt = 0;
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
  var deadP1 = null; // kapanan bölümün karakterleri: bunlara yeniden bağlanma
  var deadP2 = null;
  var attWorld = null;
  var attP1 = null;
  var attP2 = null;
  var pendingGo = null; // geçiş sürerken gelen "go": en yenisi beklemeye alınır
  var lastGoAt = 0;
  var MIN_GO_GAP_MS = 600;
  var goWatch = null;
  var attachRetryAt = 0;
  var loopErrors = 0;
  var lastLoopErr = "";
  var lastLoopErrAt = 0;
  var wdLastNow = -1;
  var wdLastChange = Date.now();
  var wdHeals = 0;
  var lastBodyCount = -1;
  var altKeyCache = {};
  var SYNC_EV_MS = 25;
  var devLast = []; // host: aygıt başına son gönderilen state
  var doorLast = [-2, -2];
  var lastEvScan = 0;
  var fullEv = false;
  var evSent = 0;
  var evApplied = 0;
  var evLogs = 0;
  var lastGuestHook = 0;
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
  var reconnectExtra = null; // online bağlantı bilgisi {online, name|room, pw}
  var onlineMode = false; // şu anki bağlantı merkezi sunucuya mı
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
    if (now - lastLoopErrAt < 3000) {
      alert = true;
      warn += t("warnError", String(lastLoopErr).slice(0, 80));
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

  /* ---------------- Gömülü sunucu (server.js yerine) ---------------- */
  // BEGIN-EMB
  // "Başlat" deyince sunucu bu oyunun içinde açılır; ayrıca server.js çalıştırmak gerekmez. Mantık server.js ile aynı:
  // tek lobi, sürüm kontrolü, heartbeat, mesaj sınırı, yavaş karşı tarafa snapshot atlama.
  var EMB_MAX_LINE = 300000;
  var EMB_MAX_BUF = 1000000;
  var EMB_MAX_MSG_PER_SEC = 400;
  var EMB_IDLE_MS = 10000;
  var EMB_HB_MS = 2000;
  var EMB_SNAP_BACKLOG = 128 * 1024;
  var EMB_KILL_BACKLOG = 4 * 1024 * 1024;
  var EMB_MAX_BAD_JOINS = 5;
  var EMB_RELAY = { in: 1, snap: 1, go: 1, over: 1, ping: 1, pong: 1, rs: 1, ev: 1, chat: 1 };
  var EMB_FAST = { in: 1, snap: 1, over: 1, ping: 1, pong: 1, rs: 1, ev: 1 }; // doğrulama gerekmeyenler: JSON.parse yapmadan aktar
  var EMB_GO_STATES = { level: 1, levelMenu: 1, menu: 1 };
  var embSrv = null;
  var embSocks = null;
  var embRoom = null; // { host, guest, ver }
  var embTimer = null;
  var embPort = 0;
  var embKeep = false; // connect() içinden yapılan iç disconnect sunucuyu kapatmasın
  var connectAttemptId = 0;

  function embSend(sk, obj) {
    if (sk && !sk.destroyed) sk.write(JSON.stringify(obj) + "\n");
  }

  function embBacklog(sk) {
    return sk.writableLength !== undefined ? sk.writableLength : sk.bufferSize || 0;
  }

  function embOther(sk) {
    if (!embRoom || !sk.__role) return null;
    return sk.__role === "host" ? embRoom.guest : embRoom.host;
  }

  function embLeave(sk) {
    var room = embRoom;
    if (!room || !sk.__role) return;
    if (sk.__role === "host" && room.host === sk) {
      if (room.guest) {
        embSend(room.guest, { t: "gone" });
        room.guest.__role = null;
      }
      embRoom = null;
      log("gömülü sunucu: lobi kapandı");
    } else if (room.guest === sk) {
      room.guest = null;
      embSend(room.host, { t: "gone" });
      log("gömülü sunucu: misafir ayrıldı");
    }
    sk.__role = null;
  }

  function embGoValid(msg) {
    if (!EMB_GO_STATES[msg.s]) return false;
    if (msg.p !== undefined && msg.p !== null) {
      if (typeof msg.p !== "object") return false;
      if (msg.p.filename !== undefined) {
        var f = msg.p.filename;
        if (typeof f !== "string" || f.length > 200) return false;
        if (!SAFE_NAME.test(f) || f.indexOf("..") >= 0) return false;
      }
    }
    return true;
  }

  function embBadJoin(sk, text) {
    embSend(sk, { t: "err", msg: text });
    sk.__bad++;
    if (sk.__bad >= EMB_MAX_BAD_JOINS) sk.destroy();
  }

  function embRelayRaw(sk, type, line) {
    var peer = embOther(sk);
    if (!peer || peer.destroyed) return;
    var bl = embBacklog(peer);
    if (bl > EMB_KILL_BACKLOG) {
      log("gömülü sunucu: karşı taraf çok geride, bağlantı kesiliyor");
      peer.destroy();
      return;
    }
    if (type === "snap" && bl > EMB_SNAP_BACKLOG) return; // eskiyen snapshot'ı atla
    peer.write(line + "\n");
  }

  function embHandle(sk, msg, line) {
    if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return;
    if (msg.t === "hb") return;
    if (msg.t === "info") {
      // LAN lobi tarayıcısının TCP yoklaması: açık lobi varsa özetini yolla, bağlantıyı kapat (lobi yoksa sessizce kapat)
      if (embRoom) {
        embSend(sk, { t: "info", m: DISC_MAGIC, v: embRoom.ver, p: embPort, n: currentLobbyName(), c: embRoom.guest ? 2 : 1 });
      }
      try {
        sk.end();
      } catch (e) {}
      return;
    }
    if (msg.t === "host" || msg.t === "join") {
      if (sk.__role) return embSend(sk, { t: "err", msg: "Zaten bir lobidesin" });
      var ver = String(msg.ver === undefined ? "?" : msg.ver).slice(0, 24);
      if (msg.t === "host") {
        if (embRoom) return embSend(sk, { t: "err", msg: "Bu lobi zaten kullanımda" });
        embRoom = { host: sk, guest: null, ver: ver };
        sk.__role = "host";
        embSend(sk, { t: "ok", role: "host" });
        log("gömülü sunucu: lobi açıldı (sürüm " + ver + ")");
        return;
      }
      if (!embRoom) return embBadJoin(sk, "Henüz açık bir lobi yok (oda yok)");
      if (embRoom.ver !== ver) {
        return embSend(sk, {
          t: "err",
          msg: "Mod sürümleri uyuşmuyor (host: " + embRoom.ver + ", sen: " + ver + "). İkiniz de aynı online.js'i kullanın."
        });
      }
      if (embRoom.guest) return embSend(sk, { t: "err", msg: "Lobi dolu" });
      embRoom.guest = sk;
      sk.__role = "guest";
      embSend(sk, { t: "ok", role: "guest" });
      embSend(embRoom.host, { t: "peer" });
      embSend(sk, { t: "peer" });
      log("gömülü sunucu: misafir katıldı");
      return;
    }
    if (!EMB_RELAY[msg.t]) return;
    if (msg.t === "go" && !embGoValid(msg)) return;
    if (msg.t === "chat" && (typeof msg.msg !== "string" || msg.msg.length > 200)) return;
    embRelayRaw(sk, msg.t, line);
  }

  function embOnConnection(sk) {
    if (!embSocks) {
      sk.destroy();
      return;
    }
    sk.setNoDelay(true);
    sk.setKeepAlive(true, 5000);
    sk.setEncoding("utf8");
    sk.__role = null;
    sk.__bad = 0;
    sk.__seen = Date.now();
    sk.__winStart = Date.now();
    sk.__winCount = 0;
    embSocks.add(sk);
    var b = "";
    sk.on("data", function (chunk) {
      sk.__seen = Date.now();
      b += chunk;
      if (b.length > EMB_MAX_BUF) {
        sk.destroy();
        return;
      }
      var i;
      while ((i = b.indexOf("\n")) >= 0) {
        var line = b.slice(0, i);
        b = b.slice(i + 1);
        if (!line || line.length > EMB_MAX_LINE) continue;
        var now = Date.now();
        if (now - sk.__winStart >= 1000) {
          sk.__winStart = now;
          sk.__winCount = 0;
        }
        if (++sk.__winCount > EMB_MAX_MSG_PER_SEC) continue;
        // Hızlı yol: {"t":"snap",...} gibi satırlarda tür baştan okunur, JSON.parse yapılmaz (host'un işlemcisini yormasın)
        if (line.charCodeAt(0) === 123 && line.indexOf('{"t":"') === 0) {
          var q = line.indexOf('"', 6);
          var ty = q > 6 ? line.slice(6, q) : "";
          if (EMB_FAST[ty]) {
            embRelayRaw(sk, ty, line);
            continue;
          }
        }
        var msg;
        try {
          msg = JSON.parse(line);
        } catch (e) {
          continue;
        }
        embHandle(sk, msg, line);
      }
    });
    sk.on("close", function () {
      if (embSocks) embSocks.delete(sk);
      embLeave(sk);
    });
    sk.on("error", function () {});
  }

  function embBeat() {
    if (!embSocks) return;
    var now = Date.now();
    embSocks.forEach(function (sk) {
      if (now - sk.__seen > EMB_IDLE_MS) sk.destroy();
      else embSend(sk, { t: "hb" });
    });
  }

  // cb("started") | cb("inuse") | cb("error", err)
  function startEmbeddedServer(port, cb) {
    if (embSrv && embPort !== port) stopEmbedded();
    if (embSrv) {
      cb("started");
      return;
    }
    var net;
    try {
      net = window.nodeRequire("net");
    } catch (e) {
      cb("error", e);
      return;
    }
    var done = false;
    var srv = net.createServer(embOnConnection);
    srv.on("error", function (e) {
      if (!done) {
        done = true;
        cb(e && e.code === "EADDRINUSE" ? "inuse" : "error", e);
      } else {
        log("GÖMÜLÜ SUNUCU HATASI: " + (e && e.message ? e.message : e));
      }
    });
    try {
      srv.listen(port, "0.0.0.0", function () {
        if (done) return;
        done = true;
        embSrv = srv;
        embPort = port;
        embSocks = new Set();
        embRoom = null;
        embTimer = setInterval(embBeat, EMB_HB_MS);
        log("gömülü sunucu açıldı, port " + port);
        cb("started");
      });
    } catch (e) {
      if (!done) {
        done = true;
        cb("error", e);
      }
    }
  }

  function stopEmbedded() {
    if (embTimer) {
      clearInterval(embTimer);
      embTimer = null;
    }
    var srv = embSrv;
    var socks = embSocks;
    embSrv = null;
    embSocks = null;
    embRoom = null;
    embPort = 0;
    if (socks) {
      socks.forEach(function (sk) {
        try {
          sk.destroy();
        } catch (e) {}
      });
    }
    if (srv) {
      try {
        srv.close();
      } catch (e) {}
      log("gömülü sunucu kapatıldı");
    }
  }

  // Bu bilgisayarın yerel ağ (IPv4) adresleri; arkadaşına söyleyeceğin adres
  function lanAddresses() {
    var out = [];
    try {
      var nets = window.nodeRequire("os").networkInterfaces();
      Object.keys(nets).forEach(function (k) {
        (nets[k] || []).forEach(function (a) {
          if ((a.family === "IPv4" || a.family === 4) && !a.internal) out.push(a.address);
        });
      });
    } catch (e) {}
    return out;
  }
  // END-EMB

  /* ---------------- LAN lobi tarayıcı (v0.9.9) ---------------- */
  // Host "Başlat" deyince lobisini UDP yayınıyla (broadcast) yerel ağa duyurur. Menü açıkken oyun aynı UDP portunu dinler
  // ve bulunan lobileri listeler. Oyun verisi yine TCP (7777) üzerinden gider; bu sadece "IP yazmadan bulma" katmanı.
  var DISC_PORT = 7778;
  var DISC_MS = 1000;
  var DISC_TTL_MS = 4500;
  var DISC_MAX_LOBBIES = 50;
  var DISC_MAGIC = "fbwg-lobby";
  var hostPort = 7777; // host'un TCP portu (duyuruda yayınlanır)
  var discSend = null; // host: yayın soketi
  var discSendReady = false;
  var discAdvTimer = null;
  var discSock = null; // tarayıcı: dinleme soketi
  var discRetryAt = 0;
  var lobbies = {}; // "ip:port" -> { key, ip, port, name, ver, players, seen }
  var lobbyErr = "";
  var lastLobbySig = "";
  var lobbyListEl = null;
  var lobbySecEl = null;
  var lobbyDiagEl = null;
  var udpPkts = 0; // tanı: dinleme soketine gelen UDP paket sayısı
  var lobbyBrowserEl = null;
  var lobbyBrowserListEl = null;

  function cleanLobbyName(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/[\u0000-\u001f\u007f<>]/g, "")
      .trim()
      .slice(0, 24);
  }

  function defaultLobbyName() {
    try {
      var os = window.nodeRequire("os");
      var n = "";
      try { n = cleanLobbyName(os.userInfo().username); } catch (e) {}
      if (!n) n = cleanLobbyName(os.hostname());
      if (n) return n;
    } catch (e) {}
    return t("chatFireName");
  }

  function currentLobbyName() {
    var el = panelEl && panelEl.querySelector("#onl-lname");
    return cleanLobbyName(el ? el.value : loadSaved("lname", "")) || defaultLobbyName();
  }

  // Her ağ kartının kendi alt ağına yayın adresi; 255.255.255.255 her zaman eklenir
  function broadcastTargets() {
    var out = [];
    try {
      var nets = window.nodeRequire("os").networkInterfaces();
      Object.keys(nets).forEach(function (k) {
        (nets[k] || []).forEach(function (a) {
          if ((a.family === "IPv4" || a.family === 4) && !a.internal && a.netmask) {
            var ip = a.address.split(".").map(Number);
            var mk = a.netmask.split(".").map(Number);
            if (ip.length !== 4 || mk.length !== 4) return;
            var b = ip.map(function (o, i) { return (o | (~mk[i] & 255)) & 255; }).join(".");
            if (out.indexOf(b) < 0) out.push(b);
          }
        });
      });
    } catch (e) {}
    // 255.255.255.255 her zaman dene (subnet broadcast bazı ağlarda çalışmayabilir)
    if (out.indexOf("255.255.255.255") < 0) out.push("255.255.255.255");
    return out;
  }

  /* --- Host: lobiyi duyur --- */

  function advertiseOnce() {
    if (!discSend || !discSendReady) return;
    if (role !== "host" || !connected) return;
    var data;
    try {
      var Buf = window.nodeRequire("buffer").Buffer;
      data = Buf.from(
        JSON.stringify({ m: DISC_MAGIC, v: VERSION, p: hostPort, n: currentLobbyName(), c: peerHere ? 2 : 1 })
      );
    } catch (e) {
      return;
    }
    broadcastTargets().forEach(function (addr) {
      try {
        discSend.send(data, 0, data.length, DISC_PORT, addr, function () {});
      } catch (e) {}
    });
  }

  function stopAdvertise() {
    if (discAdvTimer) {
      clearInterval(discAdvTimer);
      discAdvTimer = null;
    }
    discSendReady = false;
    var s = discSend;
    discSend = null;
    if (s) {
      try { s.close(); } catch (e) {}
    }
  }

  function startAdvertise() {
    stopAdvertise();
    var dgram;
    try {
      dgram = window.nodeRequire("dgram");
    } catch (e) {
      log("LOBİ duyurusu: dgram yüklenemedi");
      return;
    }
    try {
      var s = dgram.createSocket({ type: "udp4", reuseAddr: true });
      discSend = s;
      s.on("error", function (e) {
        log("LOBİ duyuru hatası: " + (e && e.message ? e.message : e));
      });
      s.bind(0, function () {
        if (discSend !== s) return;
        try { s.setBroadcast(true); } catch (e) {}
        discSendReady = true;
        advertiseOnce();
      });
      discAdvTimer = setInterval(advertiseOnce, DISC_MS);
      log("LOBİ duyurusu başladı: ad=" + currentLobbyName() + " port=" + hostPort);
    } catch (e) {
      log("LOBİ duyurusu başlatılamadı: " + (e && e.message ? e.message : e));
    }
  }

  /* --- Tarayıcı: lobileri dinle ve listele --- */

  // UDP duyurusu ve TCP yoklaması aynı listeye yazar (anahtar ip:port); ttl: bu girdinin ömrü
  function registerLobby(ip, port, m, via, ttl) {
    var key = ip + ":" + port;
    var isNew = !lobbies[key];
    if (isNew && Object.keys(lobbies).length >= DISC_MAX_LOBBIES) return;
    lobbies[key] = {
      key: key,
      ip: ip,
      port: port,
      name: cleanLobbyName(m.n),
      ver: cleanLobbyName(m.v) || "?",
      players: m.c === 2 ? 2 : 1,
      seen: Date.now(),
      ttl: ttl
    };
    if (isNew) log("LOBİ bulundu (" + via + "): " + key + " ad=" + lobbies[key].name + " sürüm=" + lobbies[key].ver);
  }

  function onLobbyPacket(buf, rinfo) {
    udpPkts++;
    var m;
    try {
      m = JSON.parse(buf.toString("utf8"));
    } catch (e) {
      return;
    }
    if (!m || typeof m !== "object" || m.m !== DISC_MAGIC) return;
    var port = parseInt(m.p, 10);
    if (isNaN(port) || port < 1 || port > 65535) return;
    // rinfo bazı Node/NW.js sürümlerinde string olabilir, bazılarında {address, port} objesi
    var ip = (rinfo && typeof rinfo === "object") ? rinfo.address : (typeof rinfo === "string" ? rinfo : null);
    if (typeof ip !== "string" || !ip) return;
    registerLobby(ip, port, m, "udp", DISC_TTL_MS);
  }

  function stopLobbyScan() {
    var s = discSock;
    discSock = null;
    lobbies = {};
    lastLobbySig = "";
    if (s) {
      try { s.close(); } catch (e) {}
    }
  }

  function lobbyScanFailed(s, e) {
    lobbyErr = e && e.code ? e.code : String((e && e.message) || e);
    log("LOBİ tarama hatası: " + (e && e.message ? e.message : e));
    if (discSock === s) discSock = null;
    try { s.close(); } catch (x) {}
    discRetryAt = Date.now() + 5000;
    lastLobbySig = "";
  }

  function startLobbyScan() {
    if (discSock || Date.now() < discRetryAt) return;
    var dgram;
    try {
      dgram = window.nodeRequire("dgram");
    } catch (e) {
      lobbyErr = "dgram";
      return;
    }
    var s;
    try {
      s = dgram.createSocket({ type: "udp4", reuseAddr: true });
    } catch (e) {
      lobbyErr = e && e.code ? e.code : String((e && e.message) || e);
      discRetryAt = Date.now() + 5000;
      return;
    }
    discSock = s;
    lobbyErr = "";
    udpPkts = 0;
    s.on("message", onLobbyPacket);
    s.on("error", function (e) { lobbyScanFailed(s, e); });
    try {
      s.bind(DISC_PORT, "0.0.0.0", function () {
        if (discSock !== s) return;
        try { s.setBroadcast(true); } catch (e) {}
      });
    } catch (e) {
      lobbyScanFailed(s, e);
    }
  }

  /* --- Tarayıcı: TCP yoklaması (v0.9.10) --- */
  // UDP yayını, gelen UDP'yi engelleyen güvenlik duvarına takılabiliyor (Windows ilk açılışta sormamış ya da "Hayır" denmiş olabilir).
  // Giden TCP ise genelde serbest: menü açıkken oyun, yerel ağdaki her adresin oyun portuna kısa bir bağlantı deneyip
  // {"t":"info"} yollar. Açık lobisi olan bilgisayarın gömülü sunucusu özetini cevaplar (embHandle "info").
  var SCAN_TCP_GAP_MS = 1500; // iki tarama arası bekleme
  var SCAN_TCP_TIMEOUT_MS = 800; // bir adres için en fazla bekleme
  var SCAN_TCP_PARALLEL = 64;
  var SCAN_TCP_MAX_HOSTS = 1024;
  var SCAN_TCP_TTL_MS = 12000; // tarama ~3-4 sn'de bir döner; girdi ondan uzun yaşasın
  var tcpScanBusy = false;
  var tcpScanLast = 0;
  var tcpTargetCount = 0;

  function ipToInt(str) {
    var p = String(str).split(".").map(Number);
    if (p.length !== 4) return NaN;
    return p[0] * 16777216 + p[1] * 65536 + p[2] * 256 + p[3];
  }

  function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
  }

  // Her ağ kartının alt ağındaki adresler (kendi adreslerimiz hariç). /24'ten büyük ağlarda sadece kendi /24 dilimimiz.
  function scanTargets() {
    var out = [];
    var seen = {};
    var own = {};
    var list = [];
    try {
      var nets = window.nodeRequire("os").networkInterfaces();
      Object.keys(nets).forEach(function (k) {
        (nets[k] || []).forEach(function (a) {
          if ((a.family === "IPv4" || a.family === 4) && !a.internal && a.address) {
            own[a.address] = 1;
            if (a.address.indexOf("169.254.") !== 0) list.push(a);
          }
        });
      });
    } catch (e) {}
    list.forEach(function (a) {
      var ip = ipToInt(a.address);
      var mask = a.netmask ? ipToInt(a.netmask) : 4294967040;
      if (isNaN(ip) || isNaN(mask)) return;
      if (mask < 4294967040) mask = 4294967040;
      var netw = (ip & mask) >>> 0;
      var bc = (netw | (~mask >>> 0)) >>> 0;
      for (var h = netw + 1; h < bc && out.length < SCAN_TCP_MAX_HOSTS; h++) {
        var s = intToIp(h);
        if (own[s] || seen[s]) continue;
        seen[s] = 1;
        out.push(s);
      }
    });
    return out;
  }

  // Adres kutusundaki port (yoksa 7777)
  function scanPort() {
    var el = panelEl && panelEl.querySelector("#onl-addr");
    var p = parseInt(String(el ? el.value : loadSaved("addr", DEFAULT_SERVER)).split(":")[1] || "7777", 10);
    return isNaN(p) || p < 1 || p > 65535 ? 7777 : p;
  }

  function tcpScanOnce() {
    if (tcpScanBusy) return;
    var net;
    try {
      net = window.nodeRequire("net");
    } catch (e) {
      return;
    }
    var targets = scanTargets();
    tcpTargetCount = targets.length;
    if (!targets.length) {
      tcpScanLast = Date.now();
      return;
    }
    var port = scanPort();
    var idx = 0;
    var active = 0;
    var finished = false;
    tcpScanBusy = true;

    function finish() {
      if (finished) return;
      finished = true;
      tcpScanBusy = false;
      tcpScanLast = Date.now();
    }

    function pump() {
      if (finished) return;
      while (active < SCAN_TCP_PARALLEL && idx < targets.length) probe(targets[idx++]);
      if (!active && idx >= targets.length) finish();
    }

    function probe(ip) {
      active++;
      var done = false;
      var sk = null;
      var b = "";
      var tm = null;
      function end() {
        if (done) return;
        done = true;
        if (tm) clearTimeout(tm);
        try {
          if (sk) sk.destroy();
        } catch (e) {}
        active--;
        pump();
      }
      tm = setTimeout(end, SCAN_TCP_TIMEOUT_MS);
      try {
        sk = net.connect({ host: ip, port: port }, function () {
          try {
            sk.write('{"t":"info"}\n');
          } catch (e) {
            end();
          }
        });
        sk.setEncoding("utf8");
        sk.on("data", function (chunk) {
          b += chunk;
          if (b.length > 4000) {
            end();
            return;
          }
          var i;
          while ((i = b.indexOf("\n")) >= 0) {
            var line = b.slice(0, i);
            b = b.slice(i + 1);
            var m = null;
            try {
              m = JSON.parse(line);
            } catch (e) {}
            if (m && m.t === "info" && m.m === DISC_MAGIC) {
              var p = parseInt(m.p, 10);
              registerLobby(ip, isNaN(p) || p < 1 || p > 65535 ? port : p, m, "tcp", SCAN_TCP_TTL_MS);
              end();
              return;
            }
          }
        });
        sk.on("error", end);
        sk.on("close", end);
      } catch (e) {
        end();
      }
    }

    pump();
  }

  function tcpScanTick() {
    if (tcpScanBusy || Date.now() - tcpScanLast < SCAN_TCP_GAP_MS) return;
    tcpScanOnce();
  }

  /* --- Online sunucu: lobi listesi (v0.9.11) --- */
  // Menü açıkken merkezi sunucuya kısa ömürlü bir bağlantı açılır ve 3 sn'de bir {"t":"list"} sorulur. Gelen odalar yerel lobilerle
  // aynı listeye "srv:<oda kimliği>" anahtarıyla yazılır. Menü kapanınca ya da bir lobiye girince bu bağlantı kapanır.
  var ONL_POLL_MS = 3000;
  var ONL_TTL_MS = 9000;
  var ONL_CONNECT_MS = 6000;
  var ONL_SILENT_MS = 10000;
  var onlSock = null;
  var onlBuf = "";
  var onlUp = false;
  var onlTimer = null;
  var onlRetryAt = 0;
  var onlErr = "";
  var onlRtt = 0;
  var onlSentAt = 0;
  var onlLastPoll = 0;
  var onlLastRecv = 0;
  var onlRoomCount = 0;
  var onlOnlineCount = 0;
  var onlGotList = false;
  var srvDiagEl = null;

  function currentSrvAddr() {
    var el = panelEl && panelEl.querySelector("#onl-srv");
    return String(el ? el.value : loadSaved("srv", ONLINE_SERVER_DEFAULT)).trim();
  }

  function srvParsed() {
    var s = currentSrvAddr();
    if (!s) return null;
    var p = s.split(":");
    var host = p[0].trim();
    var port = parseInt(p[1] || "7780", 10);
    if (!host || isNaN(port) || port < 1 || port > 65535) return null;
    return { host: host, port: port };
  }

  function onlDropRows() {
    Object.keys(lobbies).forEach(function (k) {
      if (lobbies[k].srv) delete lobbies[k];
    });
    lastLobbySig = "";
  }

  function onlStop() {
    if (onlTimer) {
      clearTimeout(onlTimer);
      onlTimer = null;
    }
    var s = onlSock;
    onlSock = null;
    onlUp = false;
    onlBuf = "";
    onlGotList = false;
    if (s) {
      try { s.destroy(); } catch (e) {}
    }
    onlDropRows();
  }

  function onlFail(s, why) {
    if (onlSock !== s) {
      try { s.destroy(); } catch (e) {}
      return;
    }
    log("ONLINE sunucu listesi hatası: " + why);
    onlStop();
    onlErr = String(why);
    onlRetryAt = Date.now() + 5000;
  }

  function onlHandle(m) {
    if (!m || m.t !== "lobbies" || !Array.isArray(m.rooms)) return;
    var now = Date.now();
    if (onlSentAt) {
      var rr = now - onlSentAt;
      if (rr >= 0 && rr < 5000) onlRtt = onlRtt ? onlRtt * 0.6 + rr * 0.4 : rr;
    }
    onlGotList = true;
    onlErr = "";
    onlRoomCount = parseInt(m.nrooms, 10) || m.rooms.length;
    onlOnlineCount = parseInt(m.online, 10) || 0;
    var seen = {};
    m.rooms.slice(0, DISC_MAX_LOBBIES).forEach(function (r) {
      if (!r || typeof r.id !== "string" || !/^[a-z0-9]{3,12}$/.test(r.id)) return;
      var key = "srv:" + r.id;
      seen[key] = 1;
      lobbies[key] = {
        key: key,
        srv: true,
        room: r.id,
        ip: "",
        port: 0,
        name: cleanLobbyName(r.n),
        ver: cleanLobbyName(r.v) || "?",
        players: r.c === 2 ? 2 : 1,
        locked: !!r.pw,
        seen: now,
        ttl: ONL_TTL_MS
      };
    });
    Object.keys(lobbies).forEach(function (k) {
      if (lobbies[k].srv && !seen[k]) delete lobbies[k];
    });
  }

  function onlStart() {
    if (onlSock || Date.now() < onlRetryAt) return;
    var a = srvParsed();
    if (!a) return;
    var net;
    try {
      net = window.nodeRequire("net");
    } catch (e) {
      onlErr = "net";
      onlRetryAt = Date.now() + 5000;
      return;
    }
    var s;
    try {
      s = net.connect({ host: a.host, port: a.port }, function () {
        if (onlSock !== s) return;
        onlUp = true;
        if (onlTimer) {
          clearTimeout(onlTimer);
          onlTimer = null;
        }
        try { s.setNoDelay(true); } catch (e) {}
        onlLastRecv = Date.now();
        onlLastPoll = 0; // hemen sor
        onlPoll();
      });
    } catch (e) {
      onlErr = (e && e.code) || (e && e.message) || "error";
      onlRetryAt = Date.now() + 5000;
      return;
    }
    onlSock = s;
    onlUp = false;
    onlBuf = "";
    onlGotList = false;
    onlLastRecv = Date.now();
    s.setEncoding("utf8");
    onlTimer = setTimeout(function () {
      if (onlSock === s && !onlUp) onlFail(s, "ETIMEDOUT");
    }, ONL_CONNECT_MS);
    s.on("data", function (chunk) {
      if (onlSock !== s) return;
      onlLastRecv = Date.now();
      onlBuf += chunk;
      if (onlBuf.length > 200000) {
        onlFail(s, "too big");
        return;
      }
      var i;
      while ((i = onlBuf.indexOf("\n")) >= 0) {
        var line = onlBuf.slice(0, i);
        onlBuf = onlBuf.slice(i + 1);
        if (!line) continue;
        try {
          onlHandle(JSON.parse(line));
        } catch (e) {}
      }
    });
    s.on("error", function (e) { onlFail(s, (e && e.code) || (e && e.message) || "error"); });
    s.on("close", function () { onlFail(s, "closed"); });
  }

  function onlPoll() {
    if (!onlSock || !onlUp) return;
    var now = Date.now();
    if (now - onlLastRecv > ONL_SILENT_MS) {
      onlFail(onlSock, "timeout");
      return;
    }
    if (now - onlLastPoll < ONL_POLL_MS) return;
    onlLastPoll = now;
    onlSentAt = now;
    try {
      onlSock.write('{"t":"list"}\n');
    } catch (e) {}
  }

  function updateSrvDiag() {
    if (!srvDiagEl) return;
    var txt;
    if (!srvParsed()) txt = t("srvDiag", t("srvNone"));
    else if (onlGotList && onlSock) txt = t("srvDiag", t("srvOk", Math.round(onlRtt), onlRoomCount, onlOnlineCount));
    else if (onlErr) txt = t("srvDiag", t("srvErr", onlErr));
    else txt = t("srvDiag", t("srvConnecting"));
    if (srvDiagEl.textContent !== txt) srvDiagEl.textContent = txt;
  }

  function joinLobby(l) {
    if (l.srv) {
      var pwEl = panelEl && panelEl.querySelector("#onl-pw");
      var pw = pwEl ? pwEl.value : "";
      if (l.locked && !pw) {
        say(t("lobbyNeedPw"));
        if (pwEl) pwEl.focus();
        return;
      }
      var sa = currentSrvAddr();
      if (!sa) return;
      connect(sa, "join", { online: true, room: l.room, pw: pw });
      if (panelEl) panelEl.style.display = "none";
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      return;
    }
    var addr = l.ip + ":" + l.port;
    save("addr", addr);
    var el = panelEl && panelEl.querySelector("#onl-addr");
    if (el) el.value = addr;
    connect(addr, "join");
    if (panelEl) panelEl.style.display = "none";
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }

  function buildLobbyRow(l) {
    var bad = l.ver !== VERSION ? t("lobbyVer") : l.players >= 2 ? t("lobbyFull") : "";
    var row = document.createElement("div");
    row.className = "onl-lobby";

    var info = document.createElement("div");
    info.className = "onl-lb-i";
    var nm = document.createElement("span");
    nm.className = "onl-lb-n";
    nm.textContent = (l.srv ? "🌐 " : "") + (l.locked ? "🔒 " : "") + (l.name || l.ip || l.room);
    var sub = document.createElement("span");
    sub.className = "onl-lb-s";
    var where = l.srv ? t("lobbyOnline") + (l.locked ? " · " + t("lobbyLocked") : "") : l.ip + ":" + l.port;
    sub.textContent = where + " · " + l.ver + (bad ? " · " + bad : "");
    info.appendChild(nm);
    info.appendChild(sub);

    var cnt = document.createElement("span");
    cnt.className = "onl-lb-c";
    cnt.textContent = l.players + "/2";

    var btn = document.createElement("button");
    btn.className = "onl-btn onl-lb-btn";
    btn.textContent = t("lobbyJoin");
    btn.disabled = !!bad;
    btn.onclick = function () { joinLobby(l); };

    row.appendChild(info);
    row.appendChild(cnt);
    row.appendChild(btn);
    return row;
  }

  function renderLobbyList() {
    if (!lobbyListEl) return;
    if (lobbyDiagEl) {
      var dtxt = t("lobbyDiag", discSock ? t("diagUdpOk", udpPkts) : lobbyErr || "–", t("diagTcpHosts", tcpTargetCount));
      if (lobbyDiagEl.textContent !== dtxt) lobbyDiagEl.textContent = dtxt;
    }
    var now = Date.now();
    var rows = [];
    Object.keys(lobbies).forEach(function (k) {
      if (now - lobbies[k].seen > (lobbies[k].ttl || DISC_TTL_MS)) delete lobbies[k];
      else rows.push(lobbies[k]);
    });
    rows.sort(function (a, b) {
      if (!!a.srv !== !!b.srv) return a.srv ? -1 : 1; // online lobiler üstte
      return a.name < b.name ? -1 : a.name > b.name ? 1 : a.key < b.key ? -1 : 1;
    });
    // Değişmediyse yeniden çizme (tıklama sırasında düğme kaybolmasın)
    var sig = LANG + "|" + lobbyErr + "|" + rows.map(function (l) {
      return l.key + "/" + l.name + "/" + l.ver + "/" + l.players + "/" + (l.locked ? 1 : 0);
    }).join(";");
    if (sig === lastLobbySig) return;
    lastLobbySig = sig;
    while (lobbyListEl.firstChild) lobbyListEl.removeChild(lobbyListEl.firstChild);
    if (!rows.length) {
      var em = document.createElement("div");
      em.className = "onl-rd";
      em.textContent = lobbyErr ? t("lobbyScanErr", lobbyErr) : t("lobbyEmpty");
      lobbyListEl.appendChild(em);
      return;
    }
    rows.forEach(function (l) { lobbyListEl.appendChild(buildLobbyRow(l)); });
  }

  // 500 ms'de bir: menü açık ve bağlı değilsek yerel ağı + sunucuyu dinle, listeyi yenile; değilsek hepsini bırak
  function lobbyTick() {
    if (!panelEl) return;
    var busy = connected || !!sock;
    var visible = panelEl.style.display !== "none";
    if (lobbySecEl) lobbySecEl.style.display = busy ? "none" : "";
    if (visible && !busy) {
      startLobbyScan();
      tcpScanTick();
      if (srvParsed()) {
        onlStart();
        onlPoll();
      } else if (onlSock) {
        onlStop();
      }
      renderLobbyList();
      updateSrvDiag();
    } else {
      if (discSock) stopLobbyScan();
      if (onlSock) onlStop();
      if (Object.keys(lobbies).length) {
        lobbies = {};
        lastLobbySig = "";
      }
    }
  }

  function disconnect(reason, manual) {
    connectAttemptId++; // bekleyen (sunucu açılmasını bekleyen) bağlantı denemesi iptal
    stopAdvertise();
    if (!embKeep) stopEmbedded();
    embKeep = false;
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
    pendingGo = null;
    goWatch = null;
    clearChat();
    var msg = (reason === MANUAL_REASON) ? t("mConnManual") : (reason || t("mConnClosed"));
    if (autoReconnect && reconnectAddr && reconnectRole && !manual && reason !== MANUAL_REASON) {
      say(t("mReconnecting", msg));
      reconnectTimer = setTimeout(function () {
        if (!connected) connect(reconnectAddr, reconnectRole, reconnectExtra);
      }, 3000);
    } else {
      say(msg);
    }
  }

  function connect(addr, wantedRole, extra) {
    reconnectAddr = addr;
    reconnectRole = wantedRole;
    reconnectExtra = extra || null;
    var viaServer = !!(extra && extra.online);
    embKeep = wantedRole === "host" && !viaServer; // host yeniden bağlanırken sunucuyu kapatma; misafire geçerken kapat
    if (sock) disconnect();
    embKeep = false;
    var net;
    try {
      net = window.nodeRequire("net");
    } catch (e) {
      say(t("mNetErr"));
      return;
    }
    var parts = String(addr).trim().split(":");
    var host = parts[0] || "127.0.0.1";
    var defPort = viaServer ? 7780 : 7777;
    var port = parseInt(parts[1] || String(defPort), 10);
    if (isNaN(port) || port < 1 || port > 65535) port = defPort;

    if (viaServer) {
      // Merkezi sunucu: host da misafir de sunucuya bağlanır (oda açma/katılma ilk mesajla yapılır)
      onlineMode = true;
      openSocket(net, host, port, wantedRole, extra);
      return;
    }
    onlineMode = false;

    if (wantedRole === "host") {
      hostPort = port;
      // Host: sunucu bu bilgisayarda açılır (adres kutusundaki sadece port kullanılır), kendimize bağlanırız
      var attempt = ++connectAttemptId;
      startEmbeddedServer(port, function (st, err) {
        if (attempt !== connectAttemptId) return; // bu arada iptal edildi ya da yeniden bağlanıldı
        if (st === "error") {
          say(t("mSrvError", err && err.code ? err.code : err && err.message ? err.message : err));
          return;
        }
        if (st === "inuse") {
          say(t("mSrvUsing", port)); // port zaten dolu (örn. server.js açık): çalışan sunucuya bağlan
        } else {
          var ips = lanAddresses();
          say(t("mSrvStarted", port, ips.length ? ips[0] + ":" + port : "?"));
        }
        openSocket(net, "127.0.0.1", port, wantedRole);
      });
      return;
    }
    openSocket(net, host, port, wantedRole);
  }

  function openSocket(net, host, port, wantedRole, extra) {
    lastRecv = Date.now();
    lastSeq = -1;
    hostSeq = 0;
    say(t("mConnecting", host, port));
    var connTimer = null;
    sock = net.connect(port, host, function () {
      if (connTimer) { clearTimeout(connTimer); connTimer = null; }
      sock.__open = true;
      sock.setNoDelay(true);
      var first = { t: wantedRole === "host" ? "host" : "join", ver: VERSION };
      if (extra) {
        if (wantedRole === "host") first.name = extra.name;
        else first.room = extra.room;
        if (extra.pw) first.pw = extra.pw;
      }
      send(first);
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

    var me = sock;
    // Ulaşılamayan adreste işletim sistemi dakikalarca beklemesin
    connTimer = setTimeout(function () {
      connTimer = null;
      if (sock === me && !me.__open) disconnect(t("mConnErr", "ETIMEDOUT"));
    }, 10000);
    sock.on("error", function (e) {
      if (sock !== me) return; // eski (kapatılmış) bağlantının geç gelen olayı yeni bağlantıyı bozmasın
      disconnect(t("mConnErr", (e && e.code ? e.code : e)));
    });
    sock.on("close", function () {
      if (sock === me) disconnect(t("mConnLost"));
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
        if (role === "host" && !onlineMode) startAdvertise(); // UDP duyurusu sadece yerel ağ lobisinde
        say(
          role === "host"
            ? onlineMode ? t("mOnlineHostReady", cleanLobbyName(m.name) || "?") : t("mHostReady")
            : t("mGuestJoined")
        );
        break;
      case "peer":
        peerHere = true;
        say(t("mBothReady", role === "host" ? t("chatFireName") : t("chatWaterName")));
        lastSeq = -1;
        if (role === "host") {
          fullAll = true;
          fullEv = true;
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
        disconnect(t("mErrPrefix", m.msg), m.fatal ? true : undefined); // fatal: yeniden denemenin anlamı yok
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
        if (role === "host") {
          fullAll = true;
          fullEv = true;
        }
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
        else if (role === "guest") onHostEvent(m);
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

  /* ---------------- Donma koruması (v0.9.6) ---------------- */

  function describeTransition() {
    try {
      var g = getGame();
      return (
        "state=" + (g && g.state && g.state.current) + " fading=" + (g && g.state && g.state.fading) +
        " level=" + (g && g.level ? "var" : "yok") + " attached=" + attached + " pendingGo=" + (pendingGo ? pendingGo.s : "-")
      );
    } catch (e) {
      return "?";
    }
  }

  // Phaser kare içinde hata fırlatılırsa requestAnimationFrame döngüsünü bir daha kurmaz. game.update'i sararak
  // hatayı kaydediyor ve döngüyü hayatta tutuyoruz.
  function guardLoop(g) {
    if (g.__onlLoopGuard || typeof g.update !== "function") return;
    g.__onlLoopGuard = true;
    var ou = g.update;
    g.update = function () {
      try {
        return ou.apply(this, arguments);
      } catch (e) {
        loopErrors++;
        lastLoopErr = e && e.message ? e.message : String(e);
        lastLoopErrAt = Date.now();
        if (loopErrors === 1 && !logPath) initLog(); // ilk hatada kayıt dosyasını kendiliğinden aç (nadir olay)
        if (loopErrors <= 25 || loopErrors % 300 === 0) {
          log("OYUN DÖNGÜSÜ HATASI #" + loopErrors + " (döngü canlı tutuldu): " + (e && e.stack ? e.stack : e) + " | " + describeTransition());
          if (loopErrors <= 3) flushLog();
        }
      }
    };
    log("döngü koruması takıldı");
  }

  // Bekçi: oyun saati 1.5 sn ilerlemiyorsa (döngü ölmüş) döngüyü yeniden başlat
  function watchdog() {
    var g = getGame();
    var now = Date.now();
    if (!g || !g.time || document.hidden) {
      wdLastChange = now;
      return;
    }
    var tn = g.time.now;
    if (tn !== wdLastNow) {
      wdLastNow = tn;
      wdLastChange = now;
      return;
    }
    if (now - wdLastChange < 1500) return;
    wdLastChange = now; // en fazla 1.5 sn'de bir dene
    wdHeals++;
    if (!logPath) initLog();
    log("DONMA TESPİT: oyun döngüsü 1.5 sn'dir ilerlemiyor, yeniden başlatılıyor (#" + wdHeals + ") " + describeTransition());
    try {
      if (g.raf && typeof g.raf.stop === "function" && typeof g.raf.start === "function") {
        g.raf.stop();
        g.raf.start();
      }
    } catch (e) {
      log("döngü yeniden başlatılamadı: " + e);
    }
    flushLog();
  }

  // Bölümle bağı kes: geçiş başlarken eski/ölü bölümün gövdelerine ne yaz ne gönder
  function detachLevel(why) {
    try {
      if (level && level.pers1) {
        deadP1 = level.pers1;
        deadP2 = level.pers2;
      }
    } catch (e) {}
    if (attached) log("DETACH (" + why + ") " + describeTransition());
    attached = false;
    bodies = [];
    alertSig = false;
    lastSnapAt = 0;
  }

  function runPendingGo() {
    if (!pendingGo) return;
    var g = getGame();
    if (!g || !g.state || g.state.fading) return;
    if (Date.now() - lastGoAt < MIN_GO_GAP_MS) return;
    var m = pendingGo;
    pendingGo = null;
    log("BEKLEYEN GO uygulanıyor: " + m.s);
    applyGo(m);
  }

  // Başlamayan geçişi bir kez otomatik yeniden dene
  function watchGo() {
    if (!goWatch) return;
    var g = getGame();
    if (!g || !g.state) return;
    var now = Date.now();
    var done = goWatch.name === "level" ? attached && attP1 !== goWatch.p1 : g.state.current === goWatch.name && !g.state.fading;
    if (done) {
      goWatch = null;
      return;
    }
    if (now - goWatch.at < 12000) return;
    if (!logPath) initLog();
    if (goWatch.retried) {
      log("GEÇİŞ TAKILDI (yeniden denendi, olmadı): " + describeTransition());
      flushLog();
      say(t("mGoStuck"));
      goWatch = null;
      return;
    }
    log("GEÇİŞ TAKILDI: 12 sn'dir " + goWatch.name + " başlamadı; yeniden deneniyor. " + describeTransition());
    flushLog();
    try {
      if (typeof g.state.fading === "boolean") g.state.fading = false;
    } catch (e) {}
    var m = goWatch.m;
    m._onlRetry = true;
    goWatch = null;
    pendingGo = m;
    lastGoAt = 0;
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
          if (attached) detachLevel("fade " + name); // eski bölüm ölürken ona snapshot gönderme/uygulama
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
    log("GO alındı: " + name + " " + describeTransition());
    if (g.state.fading || Date.now() - lastGoAt < MIN_GO_GAP_MS) {
      // Geçiş sürerken gelen "go" artık atılmıyor: sıraya alınır, en yenisi geçiş bitince uygulanır
      pendingGo = m;
      log("GO sıraya alındı (geçiş sürüyor): " + name);
      return;
    }
    lastGoAt = Date.now();
    try {
      detachLevel("go " + name);
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
      goWatch = { name: name, at: Date.now(), m: m, retried: !!m._onlRetry, p1: attP1 };
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

  // Her restartta yeni Key nesnesi eklemek sızıntı yapıyordu: tuş başına bir kez ekle
  function altKey(kb, code) {
    var c = altKeyCache[code];
    if (c && c.kb === kb) return c.key;
    var k = kb.addKey(code);
    altKeyCache[code] = { kb: kb, key: k };
    return k;
  }

  function installAltKeys(g, lv) {
    var local = role === "host" ? lv.pers1 : lv.pers2;
    var c = local && local.cursors;
    if (!c || c.__onlAlt) return;
    c.__onlAlt = true;
    try {
      var kb = g.input.keyboard;
      var alt = role === "host" ? ["KeyA", "KeyD", "KeyW"] : ["ArrowLeft", "ArrowRight", "ArrowUp"];
      c.left = combineKeys(c.left, altKey(kb, alt[0]));
      c.right = combineKeys(c.right, altKey(kb, alt[1]));
      c.up = combineKeys(c.up, altKey(kb, alt[2]));
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
    attWorld = world;
    attP1 = lv.pers1;
    attP2 = lv.pers2;
    devLast = [];
    doorLast = [-2, -2];
    fullEv = true; // host: yeni bölümde tüm durumu bir kez yolla
    chkBad = 0;
    chkResyncs = 0;
    chkHadFix = false;
    chkStuckSaid = false;
    lastChkAt = 0;
    if (role === "guest") guestHookAll(lv); // guest: yerel karar mekanizmalarını hemen sustur
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
    guardLoop(g);
    runPendingGo();
    watchGo();
    if (connected) setNoBlurPause(true);
    if (!g.level) return;
    if (g.level !== level) {
      level = g.level;
      attached = false;
    }
    hookLevel(level);
    if (role === "host") hostHookDiamonds(level); // eşleşmeden önce toplanan elmasların kim tarafından alındığını da kaydet
    var fading = !!(g.state && g.state.fading);
    var world = g.physics && g.physics.box2d && g.physics.box2d.world;
    // Aynı Level nesnesi/dünya yeniden kullanılsa bile yeni karakterler = yeni bölüm: yeniden bağlan
    if (attached && (world !== attWorld || level.pers1 !== attP1 || level.pers2 !== attP2)) {
      log("YENİDEN BAĞLANMA gerekli: dünya/karakter değişti " + describeTransition());
      attached = false;
      bodies = [];
    }
    if (
      connected &&
      peerHere &&
      !attached &&
      !fading && // geçiş sürerken (eski bölüm ölüyor) bağlanma
      level.pers1 &&
      level.pers2 &&
      !(level.pers1 === deadP1 && level.pers2 === deadP2) && // detach edilen ölü bölüme geri bağlanma
      world &&
      g.physics.box2d.paused === false &&
      Date.now() >= attachRetryAt
    ) {
      try {
        attach(g, level);
      } catch (e) {
        attachRetryAt = Date.now() + 500;
        log("ATTACH HATA: " + (e && e.stack ? e.stack : e));
      }
    }
  }

  /* ---------------- Host: konum gönder ---------------- */

  function levelName() {
    return level && level.levelData && level.levelData.filename ? level.levelData.filename : "";
  }

  function pruneDead() {
    var now = Date.now();
    var g = getGame();
    var world = g && g.physics && g.physics.box2d && g.physics.box2d.world;
    if (!world || !bodies.length) return;
    // Gövde sayısı değiştiyse (silinme/yeni) 100ms beklemeden hemen temizle: ölü gövdeye yazmayalım
    var cnt = typeof world.GetBodyCount === "function" ? world.GetBodyCount() : -1;
    if (cnt === lastBodyCount && now - lastPrune < 100) return;
    lastBodyCount = cnt;
    lastPrune = now;
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
    var gq = getGame();
    // Oyun başka bir bölüme geçtiyse / geçiş sürüyorsa eski gövdelere dokunma
    if (!gq || gq.level !== level || (gq.state && gq.state.fading)) return;
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
      var f = isStatic || snap || b.__onlPlat ? 1 : isMine ? (idle ? 0.45 : 0.25) : 0.5;

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

  /* ---------------- Oyun olayları senkronu (v0.9.7) ---------------- */
  // Oyun mimarisi (init.js'ten): Level.objects = aygıtlar (Lever, Pusher, MovingPlatform ...), her aygıtın .state değeri
  // vardır. Düğme/şalter/kaydırıcı (signal'i olanlar) state'i değişince MechManager.deviceChanged aynı gruptaki diğer
  // aygıtlara state'i yayar ve _updateState() çağırır (platform motoru yön değiştirir). Level.diamonds = elmaslar
  // (data.alive, grabbed()). Level.door1/door2 = çıkış kapıları (isOpen temasla değişir).

  function charCode(lv, ch) {
    if (!lv || !ch) return "";
    if (ch === lv.pers1) return "1";
    if (ch === lv.pers2) return "2";
    var fi = lv.friends ? lv.friends.indexOf(ch) : -1;
    return fi >= 0 ? "f" + fi : "";
  }

  function charFromCode(lv, code) {
    if (code === "1") return lv.pers1;
    if (code === "2") return lv.pers2;
    if (code && code.charAt(0) === "f" && lv.friends) return lv.friends[+code.slice(1)] || null;
    return null;
  }

  function evLog(msg) {
    if (evLogs < 40) {
      evLogs++;
      log("EV " + msg);
    }
  }

  /* ---- HOST ---- */

  function hostHookDiamonds(lv) {
    var ds = lv.diamonds;
    if (!ds) return;
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i];
      if (!d || d.__onlHook || typeof d.grabbed !== "function") continue;
      d.__onlHook = true;
      (function (og) {
        d.grabbed = function (ch) {
          var was = !!(this.data && this.data.alive);
          var r = og.apply(this, arguments);
          if (was) {
            this.__onlBy = charCode(lv, ch);
            if (connected && peerHere) {
              var idx = lv.diamonds.indexOf(this);
              if (idx >= 0) {
                send({ t: "ev", ev: "dia", i: idx, c: this.__onlBy });
                evSent++;
                evLog("elmas toplandı #" + idx + " by=" + this.__onlBy);
              }
            }
          }
          return r;
        };
      })(d.grabbed);
    }
  }

  function hostSyncEvents() {
    if (role !== "host" || !attached || !peerHere || !level) return;
    var now = Date.now();
    if (!fullEv && now - lastEvScan < SYNC_EV_MS) return;
    var g = getGame();
    if (!g || g.level !== level || (g.state && g.state.fading)) return;
    lastEvScan = now;
    var lv = level;
    hostHookDiamonds(lv);
    var full = fullEv;
    fullEv = false;

    var out = [];
    var objs = lv.objects || [];
    for (var i = 0; i < objs.length; i++) {
      var d = objs[i];
      var st = d && d.state;
      if (typeof st !== "number" || st !== st) continue;
      var last = devLast[i];
      if (full || last === undefined || Math.abs(st - last) > 0.001) {
        out.push([i, Math.round(st * 1000) / 1000]);
        devLast[i] = st;
      }
    }
    if (out.length) {
      send({ t: "ev", ev: "dv", f: full ? 1 : 0, d: out });
      evSent++;
      if (!full) evLog("aygıt durumu " + JSON.stringify(out).slice(0, 120));
    }

    var o1 = lv.door1 ? (lv.door1.isOpen ? 1 : 0) : -1;
    var o2 = lv.door2 ? (lv.door2.isOpen ? 1 : 0) : -1;
    if (full || o1 !== doorLast[0] || o2 !== doorLast[1]) {
      doorLast = [o1, o2];
      send({ t: "ev", ev: "dr", o: [o1, o2] });
      evSent++;
      evLog("kapı " + o1 + "," + o2);
    }

    if (full && lv.diamonds && lv.diamonds.length) {
      var codes = [];
      for (var k = 0; k < lv.diamonds.length; k++) {
        var dia = lv.diamonds[k];
        // Toplayan bilinmiyorsa (kanca takılmadan alınmışsa) renkli elmasta rengine göre tahmin et
        codes.push(dia && dia.data && dia.data.alive === false ? dia.__onlBy || (dia.data.char === "wg" ? "2" : "1") : "0");
      }
      send({ t: "ev", ev: "dias", a: codes });
      evSent++;
    }
    if (!full && now - lastChkAt >= CHK_MS) {
      lastChkAt = now;
      var dg = evDigest(lv, true);
      send({ t: "ev", ev: "chk", g: sig, s: dg.s, o: dg.o, a: dg.a });
      evSent++;
    }
    if (full) evLog("TAM DURUM yollandı: aygıt=" + out.length + " elmas=" + (lv.diamonds ? lv.diamonds.length : 0));
  }

  /* ---- GUEST ---- */

  function guestHookDiamonds(lv) {
    var ds = lv.diamonds;
    if (!ds) return;
    for (var i = 0; i < ds.length; i++) {
      var d = ds[i];
      if (!d || d.__onlHook || typeof d.grabbed !== "function") continue;
      d.__onlHook = true;
      (function (og) {
        // Yerel temas elması toplayamaz; sadece host olayı (__onlAllow) geçer
        d.grabbed = function () {
          if (!this.__onlAllow) return;
          return og.apply(this, arguments);
        };
      })(d.grabbed);
    }
  }

  function guestHookDoors(lv) {
    [lv.door1, lv.door2].forEach(function (door) {
      if (!door || door.__onlHook) return;
      door.__onlHook = true;
      var store = !!door.isOpen;
      try {
        // Yerel temas isOpen'ı değiştiremez; değeri sadece host'tan gelir
        Object.defineProperty(door, "isOpen", {
          configurable: true,
          enumerable: true,
          get: function () {
            return store;
          },
          set: function () {},
        });
        door.__onlSetOpen = function (v) {
          store = !!v;
        };
      } catch (e) {
        log("kapı kancası HATA: " + e);
      }
    });
  }

  function guestHookDevices(lv) {
    var objs = lv.objects || [];
    for (var i = 0; i < objs.length; i++) {
      var d = objs[i];
      if (!d || d.__onlHook) continue;
      d.__onlHook = true;
      var type = d.options && d.options.type;
      try {
        // Düğme/şalter/kaydırıcı kararını sadece host verir: yerel signal ve yerel durum denetimi susturulur
        if (d.signal && typeof d.signal.dispatch === "function") d.signal.dispatch = function () {};
        if (type === "lever" || type === "pusher" || type === "slider") d.checkState = function () {};
        // Platform gövdeleri her snapshot'ta host konumuna tam oturtulur
        if (type === "platform" && d.body && d.body.data) d.body.data.__onlPlat = true;
      } catch (e) {
        log("aygıt kancası HATA #" + i + ": " + e);
      }
    }
  }

  function guestHookAll(lv) {
    if (!lv) return;
    try {
      guestHookDevices(lv);
      guestHookDiamonds(lv);
      guestHookDoors(lv);
    } catch (e) {
      log("guestHookAll HATA: " + (e && e.stack ? e.stack : e));
    }
  }

  function applyDevState(lv, i, st, quiet) {
    var d = lv.objects && lv.objects[i];
    if (!d || typeof d.state !== "number") return;
    if (Math.abs(d.state - st) <= 0.001) return;
    d.state = st;
    var type = d.options && d.options.type;
    if (type === "lever" && d.joint && typeof d.joint.SetMotorSpeed === "function") {
      var onis = d.options.properties && d.options.properties.onis;
      d.joint.SetMotorSpeed(st ? -4 * onis : 4 * onis); // Lever.checkState'in yaptığı motor yönü değişimi
    }
    if (typeof d._updateState === "function") d._updateState(); // ışık + platform motoru (MechManager.deviceChanged'in yaptığı)
    if (!quiet && (type === "lever" || type === "pusher")) {
      try {
        var snd = lv.sounds && lv.sounds[type];
        if (snd && snd.play) snd.play();
      } catch (e) {}
    }
    evApplied++;
  }

  function applyDiamond(lv, i, code) {
    var d = lv.diamonds && lv.diamonds[i];
    if (!d || !d.data || !d.data.alive) return;
    var ch = charFromCode(lv, code) || lv.pers1;
    d.__onlAllow = true;
    try {
      d.grabbed(ch);
    } finally {
      d.__onlAllow = false;
    }
    evApplied++;
  }

  // BEGIN-CHK
  /* ---------------- Senkron kontrolü (v0.9.8) ---------------- */
  var CHK_MS = 1000; // host: özet gönderme aralığı
  var CHK_TOL = 2; // aygıt durumu farkı toleransı (1 birim = 0.05)
  var lastChkAt = 0;
  var chkBad = 0; // üst üste kaç kontrolde fark çıktı
  var chkResyncs = 0;
  var lastChkResync = 0;
  var chkHadFix = false;
  var chkStuckSaid = false;

  // Özet: aygıt durumları (çift sayı: [indeks, durum*20]), kapılar, elmaslar ("1" duruyor, "0" alınmış).
  // Host kendi "son gönderilen" değerlerinden, guest kendi gerçek durumundan üretir.
  function evDigest(lv, host) {
    var s = [];
    var objs = lv.objects || [];
    for (var i = 0; i < objs.length; i++) {
      var st = host ? devLast[i] : objs[i] && objs[i].state;
      if (typeof st !== "number" || st !== st) continue;
      s.push(i, Math.round(st * 20));
    }
    var o = host
      ? [doorLast[0], doorLast[1]]
      : [lv.door1 ? (lv.door1.isOpen ? 1 : 0) : -1, lv.door2 ? (lv.door2.isOpen ? 1 : 0) : -1];
    var a = "";
    var ds = lv.diamonds || [];
    for (var k = 0; k < ds.length; k++) a += ds[k] && ds[k].data && ds[k].data.alive === false ? "0" : "1";
    return { s: s, o: o, a: a };
  }

  function checkEvDigest(m) {
    var lv = level;
    if (role !== "guest" || !attached || !lv || m.g !== sig) return; // bölüm uyuşmuyorsa ayrı uyarı zaten var
    var g = getGame();
    if (!g || g.level !== lv || (g.state && g.state.fading)) return;
    var mine = evDigest(lv, false);
    var diffs = [];
    var hs = Array.isArray(m.s) ? m.s : [];
    var mm = {};
    var j;
    for (j = 0; j < mine.s.length; j += 2) mm[mine.s[j]] = mine.s[j + 1];
    for (j = 0; j + 1 < hs.length; j += 2) {
      var gv = mm[hs[j]];
      if (gv === undefined || Math.abs(gv - hs[j + 1]) > CHK_TOL) diffs.push("aygıt" + hs[j] + ":" + hs[j + 1] + "/" + gv);
    }
    for (var dr = 0; dr < 2; dr++) {
      var hv = m.o && m.o[dr];
      if (hv >= 0 && mine.o[dr] >= 0 && hv !== mine.o[dr]) diffs.push("kapı" + dr + ":" + hv + "/" + mine.o[dr]);
    }
    var ha = String(m.a || "");
    if (ha.length !== mine.a.length) {
      diffs.push("elmasSayı:" + ha.length + "/" + mine.a.length);
    } else {
      for (var e = 0; e < ha.length; e++) if (ha.charAt(e) !== mine.a.charAt(e)) diffs.push("elmas" + e + ":" + ha.charAt(e) + "/" + mine.a.charAt(e));
    }
    var now = Date.now();
    if (!diffs.length) {
      chkBad = 0;
      if (chkHadFix) {
        chkHadFix = false;
        chkResyncs = 0;
        chkStuckSaid = false;
        say(t("mChkOk"));
        log("SENKRON KONTROL: düzeldi");
      }
      return;
    }
    chkBad++;
    var gap = chkResyncs >= 5 ? 30000 : 4000;
    if (chkBad >= 2 && now - lastChkResync >= gap) {
      chkBad = 0;
      lastChkResync = now;
      chkResyncs++;
      chkHadFix = true;
      send({ t: "rs" });
      if (chkResyncs === 5 && !chkStuckSaid) {
        chkStuckSaid = true;
        say(t("mChkStuck"));
      } else {
        say(t("mChkFix", diffs.length));
      }
      log("SENKRON KONTROL: " + diffs.length + " fark, yeniden eşitleme istendi (#" + chkResyncs + "): " + diffs.slice(0, 8).join(" "));
    }
  }
  // END-CHK

  function onHostEvent(m) {
    if (!attached || !level) return;
    var g = getGame();
    if (!g || g.level !== level || (g.state && g.state.fading)) return;
    var lv = level;
    guestHookAll(lv);
    try {
      if (m.ev === "dv" && Array.isArray(m.d)) {
        for (var i = 0; i < m.d.length; i++) applyDevState(lv, m.d[i][0], m.d[i][1], !!m.f);
        if (!m.f) evLog("aygıt durumu alındı " + JSON.stringify(m.d).slice(0, 120));
      } else if (m.ev === "dia") {
        applyDiamond(lv, m.i, String(m.c || ""));
        evLog("elmas alındı #" + m.i);
      } else if (m.ev === "dias" && Array.isArray(m.a)) {
        for (var k = 0; k < m.a.length; k++) if (m.a[k] !== "0") applyDiamond(lv, k, String(m.a[k]));
      } else if (m.ev === "chk") {
        checkEvDigest(m);
      } else if (m.ev === "dr" && Array.isArray(m.o)) {
        if (lv.door1 && lv.door1.__onlSetOpen && m.o[0] >= 0) lv.door1.__onlSetOpen(m.o[0]);
        if (lv.door2 && lv.door2.__onlSetOpen && m.o[1] >= 0) lv.door2.__onlSetOpen(m.o[1]);
      }
    } catch (e) {
      log("onHostEvent HATA (" + m.ev + "): " + (e && e.stack ? e.stack : e));
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
      ".onl-wrap{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99999;display:none;background:rgba(0,0,0,.5);",
      "  font:13px 'Segoe UI',Arial,sans-serif;color:#e4e4e4;}",
      ".onl-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:380px;max-width:94vw;",
      "  max-height:92vh;overflow-y:auto;box-sizing:border-box;padding:0 14px 12px;background:#27292c;",
      "  border:1px solid #5a5d62;border-radius:4px;box-shadow:0 2px 14px rgba(0,0,0,.6);}",
      ".onl-title{display:flex;align-items:baseline;gap:8px;margin:0 -14px 10px;padding:8px 8px 8px 14px;",
      "  background:#1f2124;border-bottom:1px solid #45484d;}",
      ".onl-title b{font-size:14px;font-weight:600;}",
      ".onl-ver{flex:1;color:#8c8f94;font-size:12px;}",
      ".onl-x{border:none;background:none;color:#aaa;font-size:15px;line-height:1;padding:2px 6px;cursor:pointer;}",
      ".onl-x:hover{color:#fff;background:#b33;}",
      ".onl-chip{margin:0 0 4px;color:#b5b8bd;}",
      ".onl-chip.wait{color:#e0b84c;}",
      ".onl-chip.on{color:#6fcf7f;}",
      ".onl-sec{margin:14px 0 8px;padding-bottom:3px;border-bottom:1px solid #45484d;font-weight:600;color:#d0d2d6;}",
      ".onl-lbl{display:block;margin:0 0 4px;color:#b5b8bd;}",
      ".onl-in{width:100%;box-sizing:border-box;padding:5px 7px;color:#eee;font:inherit;background:#1a1b1d;",
      "  border:1px solid #606368;border-radius:3px;outline:none;}",
      ".onl-in:focus{border-color:#8fa8c8;}",
      ".onl-btns{display:flex;gap:8px;margin-top:8px;}",
      ".onl-btn{flex:1;padding:6px 10px;color:#eee;font:inherit;background:#3b3e42;border:1px solid #666a70;",
      "  border-radius:3px;cursor:pointer;text-align:center;}",
      ".onl-btn:hover{background:#474a4f;}",
      ".onl-btn:active{background:#33363a;}",
      ".onl-btn small{display:block;font-size:11px;color:#a0a3a8;}",
      ".onl-row{display:flex;align-items:flex-start;gap:8px;margin:0 0 7px;cursor:pointer;}",
      ".onl-row input[type=checkbox]{flex:none;margin:2px 0 0;cursor:pointer;}",
      ".onl-rt{display:block;}",
      ".onl-rd{display:block;color:#8c8f94;font-size:12px;}",
      ".onl-block{margin:0 0 8px;}",
      ".onl-slhead{display:flex;justify-content:space-between;}",
      ".onl-val{color:#b5b8bd;}",
      ".onl-range{width:100%;margin:4px 0 0;cursor:pointer;}",
      ".onl-langrow{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 8px;}",
      ".onl-select{width:auto;cursor:pointer;}",
      ".onl-select option{background:#1a1b1d;color:#eee;}",
      ".onl-off{width:100%;margin-top:6px;}",
      ".onl-foot{margin-top:10px;color:#7d8085;font-size:11.5px;line-height:1.5;}",
      ".onl-foot kbd{font:inherit;color:#a9acb1;}",
      ".onl-lobbies{max-height:170px;overflow-y:auto;}",
      ".onl-lobby{display:flex;align-items:center;gap:8px;margin:0 0 5px;padding:6px 8px;background:#1f2124;border:1px solid #45484d;border-radius:3px;}",
      ".onl-lb-i{flex:1;min-width:0;}",
      ".onl-lb-n{display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".onl-lb-s{display:block;color:#8c8f94;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".onl-lb-c{flex:none;color:#b5b8bd;}",
      ".onl-lb-btn{flex:none;padding:4px 12px;}",
      ".onl-btn:disabled{opacity:.4;cursor:default;}",
      ".onl-btn:disabled:hover{background:#3b3e42;}"
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
    var statusWrap = document.createElement("div");
    statusWrap.style.cssText =
      "position:fixed;left:8px;bottom:8px;z-index:99998;display:flex;align-items:center;gap:6px;";
    document.body.appendChild(statusWrap);

    statusEl = document.createElement("div");
    statusEl.style.cssText =
      "font:12px sans-serif;color:#fff;" +
      "background:rgba(0,0,0,.55);padding:3px 8px;border-radius:4px;pointer-events:none";
    statusEl.textContent = t("statusLoaded", VERSION);
    statusWrap.appendChild(statusEl);

    var lobbyBtn = document.createElement("button");
    lobbyBtn.id = "onl-lobby-btn";
    lobbyBtn.textContent = "🔍 " + t("secLobby");
    lobbyBtn.style.cssText =
      "font:11px sans-serif;color:#eee;background:rgba(30,60,100,.85);border:1px solid rgba(100,160,255,.45);" +
      "border-radius:4px;padding:3px 9px;cursor:pointer;white-space:nowrap;";
    lobbyBtn.title = t("secLobby") + " (F9)";
    lobbyBtn.tabIndex = -1;
    lobbyBtn.onmousedown = function (e) { e.preventDefault(); };
    lobbyBtn.onmouseover = function () { lobbyBtn.style.background = "rgba(50,90,150,.95)"; };
    lobbyBtn.onmouseout = function () { lobbyBtn.style.background = "rgba(30,60,100,.85)"; };
    lobbyBtn.onclick = function () {
      if (panelEl) {
        panelEl.style.display = panelEl.style.display === "none" ? "block" : "none";
        updatePanelState();
        lobbyTick();
      }
    };
    statusWrap.appendChild(lobbyBtn);

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
          lobbyTick();
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
        "<div class='onl-title'><b>" + t("menuTitle") + "</b><span class='onl-ver'>" + t("menuSub", VERSION) + "</span>" +
          "<button class='onl-x' id='onl-close' title='" + t("closeTitle") + "'>✕</button></div>" +
        "<div class='onl-chip'><span id='onl-state'></span></div>" +

        "<div id='onl-lobsec'>" +
          "<div class='onl-sec'>" + t("secLobby") + "</div>" +
          "<div id='onl-lobbies' class='onl-lobbies'></div>" +
          "<div id='onl-lobdiag' class='onl-rd' style='margin-top:4px'></div>" +
          "<div id='onl-srvdiag' class='onl-rd'></div>" +
        "</div>" +

        "<div class='onl-sec'>" + t("secConn") + "</div>" +
        "<label class='onl-lbl' for='onl-lname'>" + t("lblLobbyName") + "</label>" +
        "<input id='onl-lname' class='onl-in' maxlength='24' spellcheck='false' autocomplete='off' style='margin-bottom:8px'>" +
        "<label class='onl-lbl' for='onl-mode'>" + t("lblMode") + "</label>" +
        "<select id='onl-mode' class='onl-in onl-select' style='margin-bottom:8px;width:100%'>" +
          "<option value='online'>" + t("modeOnline") + "</option>" +
          "<option value='lan'>" + t("modeLan") + "</option>" +
        "</select>" +
        "<label class='onl-lbl' for='onl-pw'>" + t("lblPw") + "</label>" +
        "<input id='onl-pw' class='onl-in' type='password' maxlength='32' spellcheck='false' autocomplete='off' style='margin-bottom:8px'>" +
        "<label class='onl-lbl' for='onl-addr'>" + t("lblAddr") + "</label>" +
        "<input id='onl-addr' class='onl-in' placeholder='127.0.0.1:7777' spellcheck='false' autocomplete='off'>" +
        "<div class='onl-btns'>" +
          "<button class='onl-btn' id='onl-host'>" + t("btnStart") + "<small>" + t("btnStartSub") + "</small></button>" +
          "<button class='onl-btn' id='onl-join'>" + t("btnJoin") + "<small>" + t("btnJoinSub") + "</small></button>" +
        "</div>" +
        "<span class='onl-rd' id='onl-hostip' style='margin-top:6px'></span>" +

        "<div class='onl-sec'>" + t("secSet") + "</div>" +
        "<label class='onl-row'><input type='checkbox' id='onl-alt'><span><span class='onl-rt'>" + t("setAlt") + "</span>" +
          "<span class='onl-rd'>" + t("setAltDesc") + "</span></span></label>" +
        "<label class='onl-row'><input type='checkbox' id='onl-comp'><span><span class='onl-rt'>" + t("setComp") + "</span>" +
          "<span class='onl-rd'>" + t("setCompDesc") + "</span></span></label>" +
        "<label class='onl-row'><input type='checkbox' id='onl-auto'><span><span class='onl-rt'>" + t("setAuto") + "</span>" +
          "<span class='onl-rd'>" + t("setAutoDesc") + "</span></span></label>" +
        "<div class='onl-block'><span class='onl-rt'>" + t("setSrv") + "</span>" +
          "<span class='onl-rd'>" + t("setSrvDesc") + "</span>" +
          "<input id='onl-srv' class='onl-in' placeholder='203.0.113.5:7780' spellcheck='false' autocomplete='off'></div>" +
        "<div class='onl-block'><div class='onl-slhead'><span class='onl-rt'>" + t("setCap") + "</span>" +
          "<span class='onl-val' id='onl-capv'></span></div>" +
          "<span class='onl-rd'>" + t("setCapDesc") + "</span>" +
          "<input type='range' id='onl-cap' class='onl-range' min='20' max='320' step='10'></div>" +

        "<div class='onl-langrow'><span>" + t("setLang") + "</span>" +
          "<select id='onl-lang' class='onl-in onl-select'>" +
            "<option value='tr'>Türkçe</option>" +
            "<option value='en'>English</option>" +
          "</select></div>" +

        "<button class='onl-btn onl-off' id='onl-off'>" + t("btnDisconnect") + "</button>" +
        "<div class='onl-foot'>" + t("footText") + "</div>" +
      "</div>";

    panelEl.querySelector("#onl-close").onclick = function () {
      panelEl.style.display = "none";
    };

    var addr = panelEl.querySelector("#onl-addr");
    addr.value = loadSaved("addr", DEFAULT_SERVER);

    // Online sunucu ayarları (v0.9.11)
    var modeBox = panelEl.querySelector("#onl-mode");
    var pwBox = panelEl.querySelector("#onl-pw"); // şifre kaydedilmez, sadece bu oturumda
    var srvBox = panelEl.querySelector("#onl-srv");
    srvBox.value = loadSaved("srv", ONLINE_SERVER_DEFAULT);
    modeBox.value = loadSaved("mode", srvBox.value.trim() ? "online" : "lan") === "lan" ? "lan" : "online";
    srvDiagEl = panelEl.querySelector("#onl-srvdiag");
    srvBox.oninput = function () {
      save("srv", srvBox.value.trim());
      onlStop(); // adres değişti: yeni adrese yeniden bağlan
      onlRetryAt = 0;
      onlErr = "";
    };

    // Lobi listesi ve lobi adı (v0.9.9)
    lobbyListEl = panelEl.querySelector("#onl-lobbies");
    lobbySecEl = panelEl.querySelector("#onl-lobsec");
    lobbyDiagEl = panelEl.querySelector("#onl-lobdiag");
    lastLobbySig = "";
    var lname = panelEl.querySelector("#onl-lname");
    lname.value = loadSaved("lname", defaultLobbyName());
    lname.oninput = function () {
      save("lname", cleanLobbyName(lname.value));
    };
    lobbyTick();

    // Başlat'a basarsan arkadaşının bağlanacağı adres (bu bilgisayarın yerel IP'si + port)
    function showHostIp() {
      if (modeBox.value === "online") {
        panelEl.querySelector("#onl-hostip").textContent = t("hostHintOnline");
        return;
      }
      var p = parseInt(String(addr.value).split(":")[1] || "7777", 10);
      if (isNaN(p) || p < 1 || p > 65535) p = 7777;
      var ips = lanAddresses();
      panelEl.querySelector("#onl-hostip").textContent = ips.length
        ? t("hostHint", ips.slice(0, 3).map(function (a) { return a + ":" + p; }).join(" / "))
        : t("hostHintNone");
    }
    showHostIp();
    addr.addEventListener("input", showHostIp);
    modeBox.onchange = function () {
      save("mode", modeBox.value);
      showHostIp();
      modeBox.blur();
    };

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
      var lb = document.getElementById("onl-lobby-btn");
      if (lb) { lb.textContent = "🔍 " + t("secLobby"); lb.title = t("secLobby") + " (F9)"; }
    };

    [addr, capBox, lname, srvBox, pwBox].forEach(function (el) {
      ["keydown", "keyup", "keypress"].forEach(function (ev) {
        el.addEventListener(ev, function (e) {
          e.stopPropagation();
        });
      });
    });

    function go(r) {
      if (r === "host" && modeBox.value === "online") {
        var sa = srvBox.value.trim();
        if (!sa) {
          say(t("mSrvNoAddr")); // menü açık kalsın, kullanıcı adresi girsin
          return;
        }
        connect(sa, "host", { online: true, name: currentLobbyName(), pw: pwBox.value });
      } else {
        save("addr", addr.value);
        connect(addr.value, r);
      }
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
    if (role === "host") hostSyncEvents();
    else if (role === "guest" && now - lastGuestHook > 500) {
      lastGuestHook = now;
      guestHookAll(level); // yeniden oluşturulan elmas vb. için
    }
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
    setInterval(watchdog, 500);
    setInterval(sendPing, 1000);
    setInterval(heartbeat, 2000);
    setInterval(refreshExtra, 500);
    setInterval(lobbyTick, 500);
    console.info("[ONLINE] mod " + VERSION + " yüklendi");
  }

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start);
})();

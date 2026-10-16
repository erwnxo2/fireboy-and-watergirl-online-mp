Fireboy and Watergirl Online Mod

An online two-player mod for the Steam version of Fireboy and Watergirl. One player hosts a lobby, the other joins from the lobby list, and you play the same level over the internet.

This is an unofficial fan mod. It contains no game files, so you need your own copy of the game.

Features
Online lobbies through a relay server. No port forwarding or IP sharing needed.
Lobby list with name, version, player count and ping. Lobbies can have a password.
LAN lobbies are found automatically, or connect by IP.
Direct player-to-player connection (WebRTC) when possible, with automatic fallback to the server.
Level changes, deaths, restarts, buttons, levers, platforms, doors and diamonds stay in sync.
Chat, nicknames, host kick/ban, Turkish and English UI.
How it works

The host runs the physics. The guest sends its key presses and receives world snapshots about 30 times per second. The guest's own input is delayed by about half the round-trip time so it matches what the host simulates, so lower ping means less delay. If the two states drift apart, the guest asks the host for a full resync.

Players connect directly when they can. If that fails or drops, everything goes through the server.

Installation
Download main.js, index.html and online.js from the latest release.
Close the game and open its folder: in Steam, right-click the game, then Manage, then Browse local files.
Open the resources folder, then the app folder. Copy main.js there and replace the existing file.
Open the www folder inside app. Copy online.js and index.html there and replace the existing files.
Start the game. The mod's version shows in the status line at the bottom of the screen and at the top of the mod menu (Tab or F9).

This replaces two of the game's own files. Keep a copy of the originals if you want to go back, or use Steam's "Verify integrity of game files" to restore them.

Both players must use the same version. A lobby refuses players on a different version. To update, repeat the steps with the new files.

Playing

Host: press Tab or F9, set the lobby type to Online, name the lobby (add a password if you like) and press Start. You play Fireboy.

Guest: open the mod menu, open the lobby window, pick the lobby and press Join. You play Watergirl.

Key	Action
Tab / F9	Mod menu
Enter	Chat
F7	Mark the log file (use when reporting a bug)
Your IP address

With a direct connection the other player can see your IP address, and you can see theirs. To avoid that, turn off "Direct connection (P2P)" in the mod menu. The game then uses the server only, with higher ping.

"P2P" next to the ping means the direct connection is active. If it's missing you are on the server, which also works. Direct connections can fail on some networks, mobile data in particular.

Known issues
A short red warning can appear after restarting a level. It goes away on its own.
Two players only.
Bug reports

Press F7 when the problem happens, then open an issue with what you did, the mod version, and the fbwg-online-log.txt file.

License

MIT. See LICENSE.

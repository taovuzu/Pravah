import dgram from 'dgram';
import { Buffer } from 'buffer';

export const getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent["announce-list"] ? torrent["announce-list"][0] : torrent["announce"];

  // 1. Send connection request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', (msg, rinfo) => {
    if (respType(msg) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(msg, rinfo);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId);
    } else if (respType(msg) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(msg, rinfo);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });
}

function udpSend(socket, message, rawUrl, callback = () => { }) {
  const url = URL(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {
  // ...
}

function buildConnReq() {
  // ...
}

function parseConnResp(resp) {
  // ...
}

function buildAnnounceReq(connId) {
  // ...
}

function parseAnnounceResp(resp) {
  // ...
}
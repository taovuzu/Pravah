import dgram from 'dgram';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Reference :- https://www.bittorrent.org/beps/bep_0015.html

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
  const buf = Buffer.allocUnsafe(16);
  // protocol id 
  buf.writeBigUInt64BE(0x41727101980, 0);  // magic constant
  // action
  buf.writeInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action : resp.readUInt32BE(0),
    transactionId : resp.readUInt32BE(4),
    connectionId : resp.readBigUInt64BE(8)
  }
}

function buildAnnounceReq(connId) {
  // ...
}

function parseAnnounceResp(resp) {
  // ...
}
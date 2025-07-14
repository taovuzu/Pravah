import * as util from './util.js';
import * as torrentParser from './torrentParser.js';

import dgram from 'dgram';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// Reference :- https://www.bittorrent.org/beps/bep_0015.html

export const getPeers = (torrent, callback) => {
  const socket = dgram.createSocket('udp4');
  const url = torrent["announce-list"] ? torrent["announce-list"][2] : torrent["announce"];

  // 1. Send connection request
  udpSend(socket, buildConnReq(), url);

  socket.on('message', (msg, rinfo) => {
    if (respType(msg) === 'connect') {
      // 2. receive and parse connect response
      const connResp = parseConnResp(msg, rinfo);
      // 3. send announce request
      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(msg) === 'announce') {
      // 4. parse announce response
      const announceResp = parseAnnounceResp(msg, rinfo);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });

  socket.on('error', (err) => {
    console.log("Socket Error", err);
  });
}

function udpSend(socket, message, rawUrl, callback = () => { }) {
  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, url.port ? parseInt(url.port) : 1337, url.hostname, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action == 0) return 'connect';
  if (action == 1) return 'announce';
}

// connect request:

// Offset  Size            Name            Value
// 0       64-bit integer  protocol_id     0x41727101980 // magic constant
// 8       32-bit integer  action          0 // connect
// 12      32-bit integer  transaction_id
// 16

function buildConnReq() {
  const buf = Buffer.allocUnsafe(16);
  // protocol id 
  buf.writeBigUInt64BE(4497486125440n, 0);  // magic constant
  // action
  buf.writeInt32BE(0, 8);
  // transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

// connect response:

// Offset  Size            Name            Value
// 0       32-bit integer  action          0 // connect
// 4       32-bit integer  transaction_id
// 8       64-bit integer  connection_id
// 16

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.readBigUInt64BE(8)
  }
}

// Announce Request

// Offset  Size    Name    Value
// 0       64-bit integer  connection_id
// 8       32-bit integer  action          1 // announce
// 12      32-bit integer  transaction_id
// 16      20-byte string  info_hash
// 36      20-byte string  peer_id
// 56      64-bit integer  downloaded
// 64      64-bit integer  left
// 72      64-bit integer  uploaded
// 80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
// 84      32-bit integer  IP address      0 // default
// 88      32-bit integer  key
// 92      32-bit integer  num_want        -1 // default
// 96      16-bit integer  port
// 98

function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  // connection id 
  buf.writeBigUInt64BE(connId, 0);
  // action
  buf.writeUInt32BE(1, 8);
  //transaction id
  crypto.randomBytes(4).copy(buf, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buf, 16);
  // peer_id
  util.genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  torrentParser.infoHash(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // IP address
  buf.writeUInt32BE(0, 84);
  // key
  crypto.randomBytes(4).copy(buf, 88);
  // num_want
  buf.writeInt32BE(50, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

// IPv4 announce response:

// Offset      Size            Name            Value
// 0           32-bit integer  action          1 // announce
// 4           32-bit integer  transaction_id
// 8           32-bit integer  interval
// 12          32-bit integer  leechers
// 16          32-bit integer  seeders
// 20 + 6 * n  32-bit integer  IP address
// 24 + 6 * n  16-bit integer  TCP port
// 20 + 6 * N

function parseAnnounceResp(resp) {
  let group = (iterable, groupSize) => {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.subarray(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.subarray(20), 6).map(address => {
      return {
        ip: Array.from(address.subarray(0, 4)).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}
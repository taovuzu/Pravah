import * as fs from 'fs/promises';
import bencode from 'bencode';
import dgram from 'dgram';
import { Buffer } from 'buffer';

// 1
const buffer = await fs.readFile("./public/testing.torrent");
const torrent = bencode.decode(buffer, 'utf8');
// 2
const url = new URL(torrent["announce-list"] ? torrent["announce-list"][0] : torrent["announce"]);
// 3
const socket = dgram.createSocket('udp4');
// 4
const myMsg = Buffer.from('hello?', 'utf8');
// 5
socket.send(myMsg, 0, myMsg.length, url.port, url.host, () => { });
// 6
socket.on('message', msg => {
  console.log('message is', msg);
});
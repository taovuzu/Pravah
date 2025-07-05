import * as fs from 'fs/promises';
import bencode from 'bencode';
import dgram from 'dgram';
import { Buffer } from 'buffer';
import * as tracker from './tracker.js';


const buffer = await fs.readFile("./public/testing.torrent");
const torrent = bencode.decode(buffer, 'utf8');

tracker.getPeers(torrent, peers => {
  console.log('list of peers is :', peers);
});
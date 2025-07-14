import * as fs from 'fs/promises';
import bencode from 'bencode';
import dgram from 'dgram';
import { Buffer } from 'buffer';
import * as tracker from './tracker.js';
import * as torrentParser from './torrentParser.js'

const torrent = await torrentParser.open("./public/testing.torrent");

tracker.getPeers(torrent, peers => {
  console.log('list of peers is :', peers);
});

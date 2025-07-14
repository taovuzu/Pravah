import * as fs from 'fs/promises';
import bencode from 'bencode';
import crypto from 'crypto';

export const open = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return bencode.decode(buffer, 'utf8');
}

export const size = (torrent) => {
  const size = torrent.info.files ? torrent.info.files.map(file => BigInt(file.length)).reduce((a, b) => a + b) : BigInt(torrent.info.length);
  const buf = Buffer.allocUnsafe(8);
  return buf.writeBigUInt64BE(size);
}

export const infoHash = (torrent) => {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
}
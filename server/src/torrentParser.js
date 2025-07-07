import * as fs from 'fs/promises';
import bencode from 'bencode';

export const open = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  return bencode.decode(buffer, 'utf8');
}

export const size = () => {

}

export const infoHash = () => {
  
}
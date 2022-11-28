/* Get a mime-type based on extension */
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';
// @ts-ignore: clearly the d.ts file is not adequaat
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fl = path.join(__dirname, './mime.json');
const b = fs.readFileSync(fl);

const DATA = JSON.parse(b.toString());
const extensions = Object.keys(DATA);

/**
 * @param {string} file - filename
 * @returns {string} mimetype
 */
const getMime = (file) => {
  if (typeof (file) !== 'string') {
    // Default mime-type
    return 'application/octet-stream';
  }
  const ext = path.extname(file).toLowerCase().replace('.', '');
  if (ext !== '') {
    const idx = extensions.indexOf(ext);
    if (idx !== -1) {
      return DATA[ext];
    }
  }
  // default json when there is no extension
  // the fast-restapi is entirely based on json by default
  return 'application/json; charset=utf-8';
}
export default getMime;
// vim: set ts=2 sw=2 et :

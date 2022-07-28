#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mime = {};
/*
 * Create a list of mimetypes based on extension
 */
fetch('https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json', {method: 'GET'}).then((response) => {
  // Do something with response
  if(response.ok) {
    return response.json();
  } else {
    throw new Error('Unable to fetch: https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json') ;
  }
}).then((result) => {
  const props = Object.keys(result);
  const len = props.length;
  let i = 0;
  for(;i < len; i++) {
    const m = result[props[i]]
    if (typeof(m['extensions']) !== 'undefined') {
      const ext = m.extensions;
      const len2 = ext.length;
      let i2 = 0;
      for (;i2 < len2; i2++) {
        let type = props[i];
        if (typeof(m['charset']) === 'string') {
          type = type + '; charset=' + m.charset.toLowerCase();
        }
        mime[ext[i2].toLowerCase()] = type;
      }
    }
  }
  return mime;
}).then((mime) => {
  const data = JSON.stringify(mime, null, '  ');
  const fp = path.join(__dirname, '../lib/', 'mime.json');
  console.log('writing: ' + fp);
  fs.writeFileSync(fp, data);
}).catch((err) => {
  console.log("Unable to fetch -", err);
});

// vim: set ts=2 sw=2 et :

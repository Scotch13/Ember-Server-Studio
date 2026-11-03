const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const { pipeline } = require('node:stream/promises');
const { Transform } = require('node:stream');
const { crc32 } = require('node:zlib');
const yauzl = require('yauzl');
const yazl = require('yazl');

async function createZIP(source, destination, profile, options = {}) {
  const zip = new yazl.ZipFile();
  zip.on('error', error => zip.outputStream.destroy(error));
  const completion = pipeline(zip.outputStream, fs.createWriteStream(destination));
  // Cattura subito eventuali errori di I/O, anche durante la scansione dei file.
  completion.catch(() => {});
  try {
    async function walk(folder, prefix = '') {
      for (const entry of await fsp.readdir(folder, { withFileTypes: true })) {
        const absolute = path.join(folder, entry.name), relative = prefix + entry.name;
        if(options.exclude?.(relative,entry))continue;
        if (entry.isSymbolicLink()) continue; // Non seguire collegamenti fuori dal server.
        if (entry.isDirectory()) { zip.addEmptyDirectory(relative + '/'); await walk(absolute, relative + '/'); }
        else if (entry.isFile() && relative !== 'ember-profile.json') zip.addFile(absolute, relative);
      }
    }
    await walk(source);
    zip.addBuffer(Buffer.from(JSON.stringify(profile, null, 2)), 'ember-profile.json');
    zip.end(); await completion;
  } catch (e) { zip.outputStream.destroy(e); await completion.catch(() => {}); throw e; }
}

async function extract(file, { dir }) {
  const root = path.resolve(dir);
  await fsp.mkdir(root, { recursive: true });
  if ((await fsp.lstat(root)).isSymbolicLink()) throw new Error('Cartella di estrazione non sicura.');
  const archive = await new Promise((resolve, reject) => yauzl.open(file, { lazyEntries: true, validateEntrySizes: true }, (e, zip) => e ? reject(e) : resolve(zip)));
  async function safeDirectory(relative) {
    let current = root;
    for (const component of relative.split('/').filter(Boolean)) {
      current = path.join(current, component);
      try {
        const stat = await fsp.lstat(current);
        if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Collegamento o percorso non sicuro nello ZIP.');
      } catch(e) { if(e.code === 'ENOENT') await fsp.mkdir(current); else throw e; }
    }
  }
  return new Promise((resolve, reject) => {
    let failed = false;
    const fail = e => { if(failed) return; failed = true; archive.close(); reject(e); };
    archive.on('error', fail);
    archive.on('end', () => { if(!failed) resolve(); });
    archive.on('entry', async entry => {
      try {
        const name = entry.fileName;
        const unixType = (entry.externalFileAttributes >>> 16) & 0xf000;
        if (name.includes('\\') || name.includes('\0') || name.includes(':') || path.posix.isAbsolute(name) || name.split('/').some(s => s === '..' || s === '.') || (unixType && ![0x4000, 0x8000].includes(unixType))) throw new Error('Lo ZIP contiene un percorso o collegamento non sicuro.');
        const target = path.resolve(root, name);
        if (!target.startsWith(root + path.sep)) throw new Error('Percorso ZIP esterno alla cartella prevista.');
        if (name.endsWith('/')) await safeDirectory(name);
        else {
          await safeDirectory(path.posix.dirname(name) === '.' ? '' : path.posix.dirname(name));
          try { if ((await fsp.lstat(target)).isSymbolicLink()) throw new Error('File di destinazione non sicuro.'); } catch(e) { if(e.code !== 'ENOENT') throw e; }
          const stream = await new Promise((res, rej) => archive.openReadStream(entry, (e, stream) => e ? rej(e) : res(stream)));
          let checksum = 0;
          const verify = new Transform({ transform(chunk, encoding, callback) { checksum = crc32(chunk, checksum); callback(null, chunk); } });
          await pipeline(stream, verify, fs.createWriteStream(target, { flags: 'w' }));
          if (checksum !== entry.crc32) throw new Error('Integrità ZIP non valida: il backup o il download è danneggiato.');
        }
        if(!failed) archive.readEntry();
      } catch(e) { fail(e); }
    });
    archive.readEntry();
  });
}
module.exports = { createZIP, extract };

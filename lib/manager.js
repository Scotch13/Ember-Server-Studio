const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { extract, createZIP } = require('./archive');

const TYPES = ['vanilla', 'paper', 'purpur', 'fabric', 'forge', 'neoforge', 'quilt'];
const HEADERS = { 'User-Agent': 'EmberServerStudio/1.0 (Minecraft desktop server manager)' };
async function json(url) {
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`Servizio remoto: HTTP ${r.status}. Riprova più tardi.`);
  return r.json();
}
async function text(url) {
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`Servizio remoto: HTTP ${r.status}`);
  return r.text();
}
function sortVersions(a, b) { return b.localeCompare(a, undefined, { numeric: true }); }
function neoMinecraft(build) {
  const parts = build.split('.').map(Number);
  if (parts.length === 4 && parts[0] >= 26) return `${parts[0]}.${parts[1]}${parts[2] ? '.' + parts[2] : ''}`;
  return `1.${parts[0]}${parts[1] ? '.' + parts[1] : ''}`;
}
function javaRequired(version) {
  const [major, minor, patch = 0] = version.split('.').map(Number);
  if (major >= 26) return 25;
  if (major > 1 || minor > 20 || (minor === 20 && patch >= 5)) return 21;
  if (minor >= 18) return 17;
  if (minor === 17) return 16;
  return 8;
}
function parseProperties(contents) {
  const result = {};
  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim() || /^\s*[#!]/.test(line)) continue;
    const index = line.indexOf('=');
    if (index >= 0) result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return result;
}
async function atomicJSON(file, data) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file + '.tmp', JSON.stringify(data, null, 2));
  await fsp.rename(file + '.tmp', file);
}
async function download(url, target, log, checksum) {
  if (!url.startsWith('https://')) throw new Error('Download non sicuro bloccato.');
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(900000) });
  if (!r.ok) throw new Error(`Download fallito (HTTP ${r.status}).`);
  const total = Number(r.headers.get('content-length'));
  let bytes = 0, last = 0;
  const hash = crypto.createHash(checksum?.algorithm || 'sha256');
  const meter = new Transform({ transform(chunk, _, cb) {
    hash.update(chunk); bytes += chunk.length;
    if (Date.now() - last > 1600) {
      log(`Download: ${(bytes / 1048576).toFixed(1)} MB${total ? ` / ${(total / 1048576).toFixed(1)} MB` : ''}`);
      last = Date.now();
    }
    cb(null, chunk);
  }});
  try {
    await pipeline(Readable.fromWeb(r.body), meter, fs.createWriteStream(target + '.part'));
    const digest = hash.digest('hex');
    if (checksum && digest.toLowerCase() !== checksum.value.toLowerCase()) throw new Error('Verifica integrità del download fallita.');
    await fsp.rename(target + '.part', target);
  } catch (e) { await fsp.rm(target + '.part', { force: true }); throw e; }
}

class Manager extends EventEmitter {
  constructor(root) {
    super(); this.root = root; this.db = path.join(root, 'servers.json');
    this.servers = []; this.runtime = new Map(); this.logs = new Map(); this.busy = new Set();
    this.catalogCache = new Map(); this.jobs = new Map(); this.closing = false;
  }
  async init() {
    await fsp.mkdir(this.root, { recursive: true });
    try { this.servers = JSON.parse(await fsp.readFile(this.db, 'utf8')); }
    catch (e) { if (e.code !== 'ENOENT') throw new Error('Archivio server non leggibile. Nessun dato è stato sovrascritto.'); }
    return this;
  }
  async save() {
    this.saveQueue = (this.saveQueue || Promise.resolve()).catch(() => {}).then(() => atomicJSON(this.db, this.servers));
    await this.saveQueue; this.emit('update');
  }
  get(id) { const s = this.servers.find(s => s.id === id); if (!s) throw new Error('Server non trovato.'); return s; }
  dir(id) { this.get(id); return path.join(this.root, 'servers', id); }
  log(id, line) {
    const lines = this.logs.get(id) || [];
    const entry = { time: new Date().toLocaleTimeString('it-IT'), text: String(line).replace(/\u001b\[[0-9;]*m/g, '') };
    lines.push(entry); if (lines.length > 1600) lines.shift(); this.logs.set(id, lines);
    this.emit('log', { id, ...entry });
  }
  snapshot() {
    return { servers: this.servers.map(s => ({ ...s, status: this.runtime.get(s.id)?.status || (this.busy.has(s.id) ? 'installing' : 'offline'), startedAt: this.runtime.get(s.id)?.startedAt, memoryMB: this.runtime.get(s.id)?.memoryMB || 0, players: [...(this.runtime.get(s.id)?.players || [])], job: this.jobs.get(s.id) || '' })),
      system: { totalMemoryGB: Math.floor(os.totalmem() / 1073741824), freeMemoryGB: +(os.freemem() / 1073741824).toFixed(1), cpus: os.cpus().length }, root: this.root,
      addresses: Object.values(os.networkInterfaces()).flat().filter(x => x.family === 'IPv4' && !x.internal).map(x => x.address) };
  }
  async catalog(type) {
    if (!TYPES.includes(type)) throw new Error('Tipo non supportato.');
    if (this.catalogCache.has(type)) return this.catalogCache.get(type);
    let versions;
    if (type === 'vanilla') versions = (await json('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json')).versions.filter(v => v.type === 'release').map(v => v.id);
    if (type === 'paper') versions = Object.values((await json('https://fill.papermc.io/v3/projects/paper')).versions).flat().sort(sortVersions);
    if (type === 'purpur') versions = (await json('https://api.purpurmc.org/v2/purpur')).versions.reverse();
    if (type === 'fabric') versions = (await json('https://meta.fabricmc.net/v2/versions/game')).filter(v => v.stable).map(v => v.version);
    if (type === 'quilt') versions = (await json('https://meta.quiltmc.org/v3/versions/game')).filter(v => v.stable).map(v => v.version);
    if (type === 'forge') {
      const data = await json('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
      versions = [...new Set(Object.keys(data.promos).map(k => k.replace(/-(latest|recommended)$/, '')))].sort(sortVersions);
    }
    if (type === 'neoforge') {
      const xml = await text('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
      const builds = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(m => m[1]).filter(v => /^\d+\.\d+\.\d+(\.\d+)?$/.test(v));
      versions = [...new Set(builds.map(neoMinecraft))].sort(sortVersions);
    }
    versions = versions.filter(v => /^\d+\.\d+(\.\d+)?$/.test(v) && (Number(v.split('.')[0]) > 1 || Number(v.split('.')[1]) >= (['forge','vanilla'].includes(type) ? 7 : 14)));
    if (!versions.length) throw new Error('Nessuna versione compatibile disponibile dal servizio ufficiale.');
    this.catalogCache.set(type, versions); return versions;
  }
  validate(input) {
    if (!TYPES.includes(input.type)) throw new Error('Software server non valido.');
    if (!/^\d+\.\d+(\.\d+)?$/.test(input.version)) throw new Error('Versione Minecraft non valida.');
    const name = String(input.name || '').trim();
    if (!name || name.length > 48 || /[\r\n\x00]/.test(name)) throw new Error('Inserisci un nome da 1 a 48 caratteri.');
    const ram = Number(input.ram), port = Number(input.port), maxPlayers = Number(input.maxPlayers);
    if (!Number.isInteger(ram) || ram < 1 || ram > Math.floor(os.totalmem() / 1073741824)) throw new Error('Quantità di RAM non valida.');
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Porta valida: da 1024 a 65535.');
    if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 500) throw new Error('Numero di giocatori: da 1 a 500.');
    if (!['survival','creative','adventure','spectator'].includes(input.gamemode)) throw new Error('Modalità non valida.');
    if (!['peaceful','easy','normal','hard'].includes(input.difficulty)) throw new Error('Difficoltà non valida.');
    return { name, type: input.type, version: input.version, ram, port, maxPlayers, gamemode: input.gamemode, difficulty: input.difficulty,
      motd: String(input.motd || 'Un nuovo mondo, insieme.').replace(/[\r\n\x00]/g, '').slice(0, 160), seed: String(input.seed || '').replace(/[\r\n\x00]/g, '').slice(0, 100),
      onlineMode: input.onlineMode !== false, whitelist: !!input.whitelist, pvp: input.pvp !== false };
  }
  async create(input) {
    if (!input.eula) throw new Error('È necessario leggere e accettare la EULA di Minecraft.');
    const data = this.validate(input);
    if (this.servers.some(s => s.port === data.port)) throw new Error('La porta è già assegnata a un altro server. Scegline una diversa.');
    const s = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString(), installed: false, eulaAcceptedAt: new Date().toISOString() };
    await fsp.mkdir(path.join(this.root, 'servers', s.id), { recursive: true });
    this.servers.push(s); await this.save();
    await this.writeProperties(s); await fsp.writeFile(path.join(this.dir(s.id), 'eula.txt'), '# EULA accettata esplicitamente dall’utente\neula=true\n');
    this.install(s.id).catch(e => { this.log(s.id, `ERRORE: ${e.message}`); });
    return s.id;
  }
  async writeProperties(s) {
    const file = path.join(this.dir(s.id), 'server.properties');
    let props = {}; try { props = parseProperties(await fsp.readFile(file, 'utf8')); } catch(e) { if (e.code !== 'ENOENT') throw e; }
    Object.assign(props, { 'server-port': s.port, 'server-ip': '', 'max-players': s.maxPlayers, gamemode: s.gamemode, difficulty: s.difficulty,
      motd: s.motd.replace(/[^\x20-\x7e]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')), 'online-mode': s.onlineMode, 'white-list': s.whitelist, 'enforce-whitelist': s.whitelist,
      pvp: s.pvp, 'level-seed': s.seed, 'enable-rcon': false, 'enable-query': false });
    await fsp.writeFile(file, '# Managed by Ember Server Studio\n' + Object.entries(props).map(([k,v]) => `${k}=${v}`).join('\n') + '\n');
  }
  async update(id, input) {
    const s = this.get(id); if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server prima di cambiare le impostazioni.');
    const data = this.validate({ ...s, ...input, type: s.type, version: s.version });
    if (this.servers.some(x => x.id !== id && x.port === data.port)) throw new Error('Porta già utilizzata da un altro server.');
    Object.assign(s, data); await this.writeProperties(s); await this.save();
  }
  async java(major, id) {
    const runtimeDir = path.join(this.root, 'runtimes', `java-${major}`);
    const findJava = async (root, requireReady = true) => {
      if (requireReady) {
        try {
          const folder = (await fsp.readFile(path.join(root, '.ember-ready'), 'utf8')).trim();
          if (!/^[a-zA-Z0-9_.+-]+$/.test(folder) || folder === '..' || folder === '.') return null;
          const candidate = path.join(root, folder, 'bin', 'java.exe');
          return fs.existsSync(candidate) ? candidate : null;
        } catch { return null; }
      }
      try { for (const ent of await fsp.readdir(root, { withFileTypes: true })) {
        if (ent.isDirectory()) { const candidate = path.join(root, ent.name, 'bin', 'java.exe'); if (fs.existsSync(candidate)) return candidate; }
      }} catch {}
      return null;
    };
    let java = await findJava(runtimeDir); if (java) return java;
    // Condividi l'installazione del runtime fra server creati contemporaneamente.
    if (this.javaJobs?.has(major)) return this.javaJobs.get(major);
    this.javaJobs ||= new Map();
    const job = (async () => {
      this.log(id, `Preparazione Java ${major} (Eclipse Temurin). Il primo download può richiedere qualche minuto…`);
      const assets = await json(`https://api.adoptium.net/v3/assets/latest/${major}/hotspot?architecture=x64&image_type=jre&os=windows&vendor=eclipse`);
      if (!assets[0]) throw new Error(`Java ${major} non disponibile dal servizio Adoptium.`);
      const pkg = assets[0].binary.package, zip = path.join(this.root, 'runtimes', `java-${major}.zip`);
      await download(pkg.link, zip, line => this.log(id, line), { algorithm: 'sha256', value: pkg.checksum });
      const staging = path.join(this.root, 'runtimes', `.estrazione-${major}-${crypto.randomUUID()}`);
      try {
        await extract(zip, { dir: staging });
        java = await findJava(staging, false);
        if (!java) throw new Error('Runtime Java estratto ma non trovato.');
        const folder = `temurin-${major}-${crypto.randomUUID().slice(0,8)}`;
        await fsp.mkdir(runtimeDir, { recursive: true });
        await fsp.rename(path.dirname(path.dirname(java)), path.join(runtimeDir, folder));
        // Pubblica il runtime soltanto dopo l'estrazione completa. Non sovrascrive
        // DLL in uso o file di installazioni precedenti/interrotte.
        await fsp.writeFile(path.join(runtimeDir, '.ember-ready'), folder);
        await fsp.rm(zip, { force: true });
        return path.join(runtimeDir, folder, 'bin', 'java.exe');
      } finally { await fsp.rm(staging, { recursive: true, force: true }); }
    })();
    this.javaJobs.set(major, job); try { return await job; } finally { this.javaJobs.delete(major); }
  }
  runInstaller(id, executable, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { cwd: this.dir(id), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      this.jobs.set(id, 'Installazione librerie'); this.installers ||= new Map(); this.installers.set(id, child);
      let output = '';
      const consume = chunk => { output += chunk.toString(); if (output.length > 30000) output = output.slice(-30000); chunk.toString().split(/\r?\n/).filter(Boolean).forEach(line => this.log(id, line)); };
      child.stdout.on('data', consume); child.stderr.on('data', consume);
      const timer = setTimeout(() => { child.kill(); reject(new Error('Installazione scaduta dopo 20 minuti. Riprova.')); }, 1200000);
      child.once('error', e => { clearTimeout(timer); this.installers.delete(id); reject(e); });
      child.once('exit', code => { clearTimeout(timer); this.installers.delete(id); code === 0 ? resolve() : reject(new Error(`Installer terminato con codice ${code}. Controlla la console.`)); });
    });
  }
  async install(id) {
    const s = this.get(id); if (this.busy.has(id) || this.runtime.has(id)) throw new Error('Operazione già in corso.');
    this.busy.add(id); this.jobs.set(id, 'Preparazione'); this.emit('update');
    const log = line => this.log(id, line), dir = this.dir(id);
    try {
      log(`Installazione ${s.type.toUpperCase()} • Minecraft ${s.version}`);
      const manifest = await json('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
      const entry = manifest.versions.find(v => v.id === s.version); if (!entry) throw new Error('Versione non trovata nel catalogo Minecraft.');
      const meta = await json(entry.url);
      s.javaMajor = meta.javaVersion?.majorVersion || javaRequired(s.version);
      // Forge 1.16 e precedenti richiedono Java 8, indipendentemente dal Java di sistema.
      const java = await this.java(s.javaMajor, id); this.jobs.set(id, 'Download server');
      if (s.type === 'vanilla') {
        if (!meta.downloads.server) throw new Error('Questa versione non dispone di un server ufficiale.');
        await download(meta.downloads.server.url, path.join(dir, 'server.jar'), log, { algorithm: 'sha1', value: meta.downloads.server.sha1 }); s.launch = ['-jar', 'server.jar', 'nogui'];
      } else if (s.type === 'paper') {
        const builds = await json(`https://fill.papermc.io/v3/projects/paper/versions/${s.version}/builds`);
        const build = builds.filter(b => b.channel === 'STABLE').sort((a,b) => b.id-a.id)[0] || builds[0];
        if (!build) throw new Error('Nessuna build Paper disponibile.'); const artifact = build.downloads['server:default'];
        await download(artifact.url, path.join(dir, 'server.jar'), log, { algorithm: 'sha256', value: artifact.checksums.sha256 });
        s.build = String(build.id); s.launch = ['-jar', 'server.jar', 'nogui'];
      } else if (s.type === 'purpur') {
        const info = await json(`https://api.purpurmc.org/v2/purpur/${s.version}/latest`);
        await download(`https://api.purpurmc.org/v2/purpur/${s.version}/${info.build}/download`, path.join(dir, 'server.jar'), log, info.md5 ? { algorithm: 'md5', value: info.md5 } : undefined);
        s.build = info.build; s.launch = ['-jar', 'server.jar', 'nogui'];
      } else if (s.type === 'fabric') {
        const loaders = await json(`https://meta.fabricmc.net/v2/versions/loader/${s.version}`);
        const loader = loaders.find(x => x.loader.stable)?.loader.version || loaders[0]?.loader.version;
        const installers = await json('https://meta.fabricmc.net/v2/versions/installer');
        const installer = installers.find(i => i.stable) || installers[0];
        if (!loader || !installer) throw new Error('Loader Fabric non disponibile.');
        await download(`https://meta.fabricmc.net/v2/versions/loader/${s.version}/${loader}/${installer.version}/server/jar`, path.join(dir, 'server.jar'), log);
        s.build = loader; s.launch = ['-jar', 'server.jar', 'nogui'];
      } else if (s.type === 'quilt') {
        const installers = await json('https://meta.quiltmc.org/v3/versions/installer'); const installer = installers.filter(i => /^[\d.]+$/.test(i.version)).sort((a,b) => sortVersions(a.version,b.version))[0];
        const loaders = await json(`https://meta.quiltmc.org/v3/versions/loader/${s.version}`);
        const loader = loaders.map(i => i.loader.version).filter(v => /^[\d.]+$/.test(v)).sort(sortVersions)[0];
        if (!installer || !loader) throw new Error('Installer Quilt non disponibile.');
        const url = installer.url || `https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/${installer.version}/quilt-installer-${installer.version}.jar`;
        await download(url, path.join(dir, 'installer.jar'), log, installer.hashes?.sha256 ? { algorithm: 'sha256', value: installer.hashes.sha256 } : undefined);
        await this.runInstaller(id, java, ['-jar', 'installer.jar', 'install', 'server', s.version, loader, '--install-dir=.', '--download-server']);
        if (!fs.existsSync(path.join(dir, 'quilt-server-launch.jar'))) throw new Error('Launcher Quilt non trovato dopo l’installazione.');
        s.build = loader; s.launch = ['-jar', 'quilt-server-launch.jar', 'nogui'];
      } else {
        let build, artifact, base;
        if (s.type === 'forge') {
          const promos = (await json('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json')).promos;
          build = promos[`${s.version}-recommended`] || promos[`${s.version}-latest`];
          if (!build) throw new Error('Nessuna build Forge disponibile.');
          artifact = `${s.version}-${build}`; base = `https://maven.minecraftforge.net/net/minecraftforge/forge/${artifact}/forge-${artifact}`;
        } else {
          const xml = await text('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
          build = [...xml.matchAll(/<version>([^<]+)<\/version>/g)].map(m => m[1]).filter(v => /^\d+\.\d+\.\d+(\.\d+)?$/.test(v) && neoMinecraft(v) === s.version).sort(sortVersions)[0];
          if (!build) throw new Error('Nessuna build stabile NeoForge disponibile.');
          artifact = build; base = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${build}/neoforge-${build}`;
        }
        await download(`${base}-installer.jar`, path.join(dir, 'installer.jar'), log);
        await this.runInstaller(id, java, ['-jar', 'installer.jar', '--installServer']);
        const lib = s.type === 'forge' ? path.join('libraries','net','minecraftforge','forge',artifact) : path.join('libraries','net','neoforged','neoforge',artifact);
        if (fs.existsSync(path.join(dir, lib, 'win_args.txt'))) s.launch = ['@' + path.join(lib, 'win_args.txt'), 'nogui'];
        else {
          const candidates = (await fsp.readdir(dir)).filter(n => /^(forge|minecraftforge).*\.jar$/.test(n) && !n.includes('installer'));
          if (!candidates.length) throw new Error('Installazione completata ma launcher non trovato.');
          s.launch = ['-jar', candidates.find(n => n.includes('universal')) || candidates[0], 'nogui'];
        }
        s.build = build;
      }
      await fsp.mkdir(path.join(dir, ['paper','purpur'].includes(s.type) ? 'plugins' : 'mods'), { recursive: true });
      s.installed = true; s.lastError = null; await this.save(); log('✓ Installazione completata. Il server è pronto per l’avvio.');
    } catch (e) { s.lastError = e.message; await this.save(); throw e; }
    finally { this.busy.delete(id); this.jobs.delete(id); this.emit('update'); }
  }
  async start(id) {
    if (this.closing) throw new Error('Chiusura in corso.');
    const s = this.get(id); if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Server già attivo o operazione in corso.');
    if (!s.installed || !s.launch) throw new Error('Completa prima l’installazione.');
    const active = [...this.runtime.keys()].map(k => this.get(k));
    if (active.some(x => x.port === s.port)) throw new Error('La porta è già in uso da un altro server.');
    this.busy.add(id); this.emit('update');
    try {
      const net = require('node:net');
      await new Promise((resolve, reject) => { const tester = net.createServer(); tester.once('error', () => reject(new Error(`La porta ${s.port} è già occupata da un altro programma.`))); tester.listen(s.port, '0.0.0.0', () => tester.close(resolve)); });
      const java = await this.java(s.javaMajor || javaRequired(s.version), id);
      const child = spawn(java, ['-Xms512M', `-Xmx${s.ram}G`, '-Dfile.encoding=UTF-8', ...s.launch], { cwd: this.dir(id), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
      const runtime = { child, status: 'starting', startedAt: Date.now(), players: new Set() }; this.runtime.set(id, runtime);
      this.log(id, `Avvio di ${s.name} • Java ${s.javaMajor} • RAM massima ${s.ram} GB`);
      const consume = stream => {
        let buffer = ''; stream.setEncoding('utf8');
        stream.on('data', chunk => { buffer += chunk; const lines = buffer.split(/\r?\n/); buffer = lines.pop(); for (const line of lines) {
          this.log(id, line);
          if (/Done \([\d.,]+s\)!/.test(line)) { runtime.status = 'online'; this.emit('update'); }
          const join = line.match(/\b(\w+) joined the game/), leave = line.match(/\b(\w+) left the game/);
          if (join) { runtime.players.add(join[1]); this.emit('update'); } if (leave) { runtime.players.delete(leave[1]); this.emit('update'); }
        }}); stream.on('end', () => { if (buffer) this.log(id, buffer); });
      };
      consume(child.stdout); consume(child.stderr); child.stdin.on('error', () => {});
      child.once('error', e => { this.log(id, `ERRORE: ${e.message}`); s.lastError = e.message; });
      child.once('close', code => {
        clearTimeout(runtime.killTimer); this.runtime.delete(id);
        if (code !== 0 && runtime.status !== 'stopping') s.lastError = `Il server si è chiuso (codice ${code}). Consulta la console.`;
        this.log(id, `Server arrestato (codice ${code ?? 'processo interrotto'}).`); this.save().catch(() => {}); this.emit('update');
      });
      s.lastError = null; s.lastPlayed = new Date().toISOString(); await this.save();
    } finally { this.busy.delete(id); this.emit('update'); }
  }
  command(id, command) {
    const rt = this.runtime.get(id); if (!rt || rt.status === 'stopping') throw new Error('Il server non è in esecuzione.');
    command = String(command).replace(/^\//, '').trim();
    if (!command || command.length > 2000 || /[\r\n\x00]/.test(command)) throw new Error('Comando non valido.');
    rt.child.stdin.write(command + '\n'); this.log(id, '> ' + command);
  }
  stop(id, force = false) {
    const rt = this.runtime.get(id); if (!rt) return;
    if (force) { this.log(id, 'Arresto forzato: eventuali progressi non salvati possono andare persi.'); rt.child.kill(); }
    else { if (rt.status === 'stopping') return; this.command(id, 'stop'); rt.status = 'stopping'; this.log(id, 'Arresto richiesto. Attendo il salvataggio del mondo…'); }
    this.emit('update');
  }
  async backup(id) {
    const s = this.get(id); if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server prima del backup, per proteggere il mondo.');
    this.busy.add(id); this.jobs.set(id, 'Backup ZIP'); this.emit('update');
    const folder = path.join(this.root, 'backups', id); await fsp.mkdir(folder, { recursive: true });
    const target = path.join(folder, `${s.name.replace(/[^a-zA-Z0-9_-]/g, '_')}-${new Date().toISOString().replace(/[:.]/g,'-')}.zip`);
    try {
      await createZIP(this.dir(id), target, s);
      this.log(id, `Backup creato: ${path.basename(target)}`); return target;
    } catch(e) { await fsp.rm(target, { force: true }); throw e; }
    finally { this.busy.delete(id); this.jobs.delete(id); this.emit('update'); }
  }
  async backups(id) {
    this.get(id); const dir = path.join(this.root, 'backups', id);
    try { const names = await fsp.readdir(dir); return Promise.all(names.filter(n => n.endsWith('.zip')).sort().reverse().map(async name => { const stat = await fsp.stat(path.join(dir,name)); return { name, size: stat.size, date: stat.mtime.toISOString() }; })); } catch(e) { if (e.code === 'ENOENT') return []; throw e; }
  }
  async restore(id, name) {
    const s = this.get(id);
    if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server prima del ripristino.');
    if (typeof name !== 'string' || path.basename(name) !== name || !name.endsWith('.zip')) throw new Error('Nome backup non valido.');
    const zip = path.join(this.root, 'backups', id, name);
    await fsp.access(zip);
    // Prima di sostituire file viene sempre creato un backup aggiuntivo.
    await this.backup(id);
    this.busy.add(id); this.jobs.set(id, 'Ripristino backup'); this.emit('update');
    const staging = path.join(this.root, 'ripristini', crypto.randomUUID());
    try {
      await fsp.mkdir(staging, { recursive: true }); await extract(zip, { dir: staging });
      const profile = JSON.parse(await fsp.readFile(path.join(staging, 'ember-profile.json'), 'utf8'));
      if (profile.id !== id || profile.type !== s.type || profile.version !== s.version) throw new Error('Il backup non appartiene a questo server o a questa versione.');
      const data = this.validate({ ...profile, name: s.name, port: s.port });
      const archive = path.join(this.root, 'archivio', 'prima-del-ripristino', `${id}-${Date.now()}`);
      await fsp.mkdir(path.dirname(archive), { recursive: true });
      await fsp.rename(this.dir(id), archive);
      try { await fsp.rename(staging, this.dir(id)); } catch(e) { await fsp.rename(archive, this.dir(id)); throw e; }
      // Conserva identità e porta attuali; ripristina il mondo e le altre impostazioni.
      const launch = Array.isArray(profile.launch) && profile.launch.length < 20 && profile.launch.every(v => typeof v === 'string' && v.length < 3000 && !/[\r\n\x00]/.test(v)) ? profile.launch : undefined;
      Object.assign(s, data, { launch, installed: !!profile.installed && !!launch, build: profile.build, javaMajor: Number.isInteger(profile.javaMajor) ? profile.javaMajor : javaRequired(s.version), lastError: null });
      await this.writeProperties(s); await this.save();
      this.log(id, `✓ Backup ripristinato: ${name}. Copia precedente conservata in archivio.`);
    } finally {
      await fsp.rm(staging, { recursive: true, force: true });
      this.busy.delete(id); this.jobs.delete(id); this.emit('update');
    }
  }
  async deleteBackup(id,name,recycle) {
    this.get(id);
    if(this.busy.has(id))throw new Error('Attendi il completamento dell’operazione in corso.');
    if(typeof name!=='string'||name.length>255||/[\\/:<>"|?*\x00-\x1f]/.test(name)||path.basename(name)!==name||!name.endsWith('.zip'))throw new Error('Nome backup non valido.');
    if(typeof recycle!=='function')throw new Error('Cestino di sistema non disponibile.');
    this.busy.add(id);
    try {
      const folder=path.join(this.root,'backups',id),info=await fsp.lstat(folder);
      if(info.isSymbolicLink()||!info.isDirectory())throw new Error('Cartella backup non sicura.');
      const target=path.join(folder,name),stat=await fsp.lstat(target);
      if(stat.isSymbolicLink()||!stat.isFile())throw new Error('Nome backup non valido.');
      await recycle(target);this.log(id,`Backup nel Cestino: ${name}`);return true;
    }finally{this.busy.delete(id);this.emit('update');}
  }
  async imports(id, files) {
    const s = this.get(id); if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server prima di importare file.');
    if (s.type === 'vanilla') throw new Error('Vanilla non supporta mod o plugin. Usa Fabric/Forge/NeoForge/Quilt per le mod, Paper/Purpur per i plugin.');
    if(!Array.isArray(files)||!files.length||files.length>2000)throw new Error('Seleziona da 1 a 2000 file.');
    this.busy.add(id);this.jobs.set(id,'Importazione file');this.emit('update');
    const created=[];
    try {
      const names=new Set(),plan=[];
      for(const file of files){
        if(typeof file!=='string'||!path.isAbsolute(file)||path.extname(file).toLowerCase()!=='.jar')throw new Error('Sono consentiti soltanto file .jar.');
        const info=await fsp.lstat(file);if(info.isSymbolicLink()||!info.isFile())throw new Error('Sono consentiti solo file mod/plugin regolari, non collegamenti.');
        const name=path.basename(file);if(names.has(name.toLowerCase()))throw new Error('La selezione contiene più file con lo stesso nome.');
        names.add(name.toLowerCase());plan.push({source:file,name});
      }
      const folder=this.fileFolder(id);await fsp.mkdir(folder,{recursive:true});
      const info=await fsp.lstat(folder);if(info.isSymbolicLink()||!info.isDirectory())throw new Error('La cartella mod/plugin non è una cartella locale sicura.');
      // Valida tutto il gruppo prima di copiare; nessuna sovrascrittura.
      for(const item of plan){
        item.target=path.join(folder,item.name);
        try{await fsp.lstat(item.target);throw new Error(`Esiste già un file chiamato “${item.name}”. Nessun file è stato sovrascritto.`);}catch(e){if(e.code!=='ENOENT')throw e;}
      }
      for(const item of plan){await fsp.copyFile(item.source,item.target,fs.constants.COPYFILE_EXCL);created.push(item.target);}
      this.log(id, `${files.length} file importati. Verifica che siano compatibili con ${s.type} ${s.version}.`);return files.length;
    }catch(e){for(const file of created)await fsp.rm(file,{force:true}).catch(()=>{});throw e;}
    finally{this.busy.delete(id);this.jobs.delete(id);this.emit('update');}
  }
  async files(id) {
    const s = this.get(id), dir = path.join(this.dir(id), ['paper','purpur'].includes(s.type) ? 'plugins' : 'mods');
    try { return (await fsp.readdir(dir)).filter(n => n.endsWith('.jar')); } catch { return []; }
  }
  fileFolder(id) {
    const s=this.get(id);
    return path.join(this.dir(id),['paper','purpur'].includes(s.type)?'plugins':'mods');
  }
  async fileEntries(id) {
    const folder=this.fileFolder(id);
    try {
      const stat=await fsp.lstat(folder);
      if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('La cartella mod/plugin non è una cartella locale sicura.');
      const entries=await fsp.readdir(folder,{withFileTypes:true});
      const files=entries.filter(entry=>entry.isFile()&&/\.jar(?:\.disabled)?$/i.test(entry.name));
      return Promise.all(files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})).map(async entry=>({
        name:entry.name,displayName:entry.name.replace(/\.disabled$/i,''),enabled:!entry.name.toLowerCase().endsWith('.disabled'),size:(await fsp.lstat(path.join(folder,entry.name))).size
      })));
    }catch(e){if(e.code==='ENOENT')return [];throw e;}
  }
  checkFileAction(id,names,action) {
    const server=this.get(id);
    if(this.runtime.has(id)||this.busy.has(id))throw new Error('Arresta il server e attendi la fine delle operazioni prima di modificare mod o plugin.');
    if(server.type==='vanilla')throw new Error('Vanilla non supporta mod o plugin. Usa Fabric/Forge/NeoForge/Quilt per le mod, Paper/Purpur per i plugin.');
    if(!['enable','disable','delete'].includes(action))throw new Error('Azione sui file non valida.');
    if(!Array.isArray(names)||!names.length||names.length>2000)throw new Error('Seleziona da 1 a 2000 file.');
    const unique=new Map();
    for(const name of names){
      if(typeof name!=='string'||name.length>255||name.trim()!==name||/[\\/:<>"|?*\x00-\x1f]/.test(name)||path.basename(name)!==name||!/^.+\.jar(?:\.disabled)?$/i.test(name))throw new Error('Nome del file mod/plugin non valido.');
      unique.set(name.toLowerCase(),name);
    }
    return {server,names:[...unique.values()]};
  }
  async manageFiles(id,names,action,recycle) {
    names=this.checkFileAction(id,names,action).names;
    if(action==='delete'&&typeof recycle!=='function')throw new Error('Cestino di sistema non disponibile.');
    this.busy.add(id);this.jobs.set(id,'Gestione mod/plugin');this.emit('update');
    try {
      const folder=this.fileFolder(id),stat=await fsp.lstat(folder);
      if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('La cartella mod/plugin non è una cartella locale sicura.');
      const plan=[];
      // Controlla l'intera selezione prima di modificare il primo file.
      for(const name of names){
        const source=path.join(folder,name),info=await fsp.lstat(source);
        if(info.isSymbolicLink()||!info.isFile())throw new Error('Sono consentiti solo file mod/plugin regolari, non collegamenti.');
        const enabled=!name.toLowerCase().endsWith('.disabled');
        const targetName=action==='disable'&&enabled?name+'.disabled':action==='enable'&&!enabled?name.slice(0,-9):name;
        if(targetName!==name){
          try {await fsp.lstat(path.join(folder,targetName));throw new Error(`Esiste già un file chiamato “${targetName}”. Nessun file è stato sovrascritto.`);}catch(e){if(e.code!=='ENOENT')throw e;}
        }
        plan.push({name,source,targetName});
      }
      const result={action,changed:[],skipped:[],failed:[]};
      for(const item of plan){
        if(action!=='delete'&&item.targetName===item.name){result.skipped.push(item.name);continue;}
        try {
          if(action==='delete')await recycle(item.source);
          else {
            const target=path.join(folder,item.targetName);
            // link/copy EXCL evita la sovrascrittura silenziosa di rename
            // su Windows, anche se un file compare dopo il controllo iniziale.
            try {await fsp.link(item.source,target);}catch(e){
              if(!['EXDEV','EPERM','ENOSYS','EOPNOTSUPP','ENOTSUP'].includes(e.code))throw e;
              await fsp.copyFile(item.source,target,fs.constants.COPYFILE_EXCL);
            }
            try {await fsp.unlink(item.source);}catch(e){await fsp.unlink(target).catch(()=>{});throw e;}
          }
          result.changed.push({from:item.name,to:action==='delete'?null:item.targetName});
        }catch(e){result.failed.push({name:item.name,error:e.message});}
      }
      this.log(id,`Gestione mod/plugin: ${action}, ${result.changed.length} file modificati, ${result.failed.length} errori.`);
      return result;
    }finally{this.busy.delete(id);this.jobs.delete(id);this.emit('update');}
  }
  async deleteServer(id, recycle) {
    const s = this.get(id);
    if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server e attendi la fine delle operazioni prima di eliminarlo.');
    if (typeof recycle !== 'function') throw new Error('Cestino di sistema non disponibile.');
    this.busy.add(id); this.jobs.set(id, 'Eliminazione'); this.emit('update');
    try {
      // Nessun fallback permanente: se il Cestino rifiuta l'operazione,
      // il server resta nella dashboard e i file non vengono cancellati.
      await recycle(this.dir(id));
      this.servers = this.servers.filter(server => server !== s);
      await this.save(); this.logs.delete(id);
    } finally { this.busy.delete(id); this.jobs.delete(id); this.emit('update'); }
  }
  async remove(id) {
    if (this.runtime.has(id) || this.busy.has(id)) throw new Error('Arresta il server e attendi la fine delle operazioni.');
    this.get(id);
    // Archivia invece di cancellare i mondi: ripristinabili dalla cartella archivio.
    const source = this.dir(id); const archive = path.join(this.root, 'archivio', id);
    await fsp.mkdir(path.dirname(archive), { recursive: true });
    await fsp.writeFile(path.join(source, 'ember-profile.json'), JSON.stringify(this.get(id), null, 2));
    await fsp.rename(source, archive); this.servers = this.servers.filter(s => s.id !== id); await this.save();
  }
}
module.exports = { Manager, javaRequired, neoMinecraft, parseProperties, sortVersions, download, json };

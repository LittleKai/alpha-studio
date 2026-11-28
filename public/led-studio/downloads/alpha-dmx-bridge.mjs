#!/usr/bin/env node
/**
 * Alpha LED Studio Local DMX512 Hardware Bridge (E1 — Art-Net UDP 6454 & sACN E1.31 UDP 5568)
 * Zero-dependency Node.js WebSocket/HTTP -> UDP relay for live stage lighting consoles & nodes.
 *
 * Usage:
 *   node scripts/dmx-udp-bridge.mjs --protocol artnet --host 255.255.255.255 --port 6454 --ws-port 9454
 */
import http from 'node:http';
import dgram from 'node:dgram';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BRIDGE_VERSION = '23.1.0';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX_HTTP_BODY_BYTES = 32768;
const MAX_WS_FRAME_BYTES = 65536;

const LOCAL_BRIDGE_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const REMOTE_HTTPS_BRIDGE_HOSTS = new Set([
  'giaiphapsangtao.com',
  'www.giaiphapsangtao.com',
  'alphastudio.vn',
  'www.alphastudio.vn'
]);

export function isAllowedBridgeOrigin(originHeader) {
  if (!originHeader) return true;
  const raw = String(originHeader).trim();
  if (!raw || raw === 'null' || raw.startsWith('file://')) return true;
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    const proto = u.protocol.toLowerCase();
    if (LOCAL_BRIDGE_HOSTS.has(h)) {
      return proto === 'http:' || proto === 'https:';
    }
    return proto === 'https:' && REMOTE_HTTPS_BRIDGE_HOSTS.has(h);
  } catch {
    return false;
  }
}

export function isAllowedDmxTargetHost(host, defaultTargetHost = '127.0.0.1') {
  const h = String(host || '').trim().toLowerCase();
  if (!h) return false;
  const def = String(defaultTargetHost || '127.0.0.1').trim().toLowerCase();
  if (h === def || h === 'localhost' || h === '255.255.255.255') return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  const octets = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  if (octets.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return false;
  const [a, b] = octets;
  return (
    a === 127 ||
    a === 2 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 239 && b === 255)
  );
}

export function nextUniverseSeq(seqMap, key) {
  const prev = seqMap.get(key) || 0;
  const next = prev >= 255 ? 1 : prev + 1;
  seqMap.set(key, next);
  return next;
}

function timingSafeTokenMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided), 'utf8');
  const b = Buffer.from(String(expected), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function originRequiresSessionToken(originHeader) {
  if (!originHeader) return false;
  const raw = String(originHeader).trim();
  if (raw === 'null' || raw.startsWith('file://')) return true;
  try {
    const u = new URL(raw);
    return !LOCAL_BRIDGE_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return true;
  }
}

function extractRequestToken(req) {
  const hdrToken = req.headers?.['x-alpha-bridge-token'];
  if (typeof hdrToken === 'string' && hdrToken.trim()) return hdrToken.trim();
  const wsProto = req.headers?.['sec-websocket-protocol'];
  if (typeof wsProto === 'string') {
    for (const part of wsProto.split(',')) {
      const p = part.trim();
      if (p.startsWith('alpha-token.')) return p.slice('alpha-token.'.length);
    }
  }
  try {
    const u = new URL(req.url || '/', 'http://127.0.0.1');
    const qTok = u.searchParams.get('token');
    if (qTok) return qTok.trim();
  } catch {
    // ignore malformed URL
  }
  return '';
}

/**
 * Build a standard 530-byte Art-Net ArtDmx (OpCode 0x5000, Protocol v14) UDP packet.
 */
export function buildArtNetPacket(universe = 0, dmxChannels = [], sequence = 1) {
  const dmx = new Uint8Array(512);
  const len = Math.min(512, dmxChannels?.length || 0);
  for (let i = 0; i < len; i++) {
    dmx[i] = Math.max(0, Math.min(255, Number(dmxChannels[i]) | 0));
  }

  const pkt = Buffer.alloc(18 + 512);
  pkt.write('Art-Net\0', 0, 8, 'ascii');
  pkt.writeUInt16LE(0x5000, 8);
  pkt.writeUInt16BE(14, 10);
  pkt[12] = ((Number(sequence) || 1) & 0xff) || 1;
  pkt[13] = 0;
  const uni = Math.max(0, Math.min(32767, Number(universe) | 0));
  pkt.writeUInt16LE(uni, 14);
  pkt.writeUInt16BE(512, 16);
  Buffer.from(dmx.buffer, dmx.byteOffset, 512).copy(pkt, 18);
  return pkt;
}

/**
 * Build a 14-byte Art-Net 4 ArtSync (OpCode 0x5200) UDP packet.
 */
export function buildArtSyncPacket() {
  const pkt = Buffer.alloc(14);
  pkt.write('Art-Net\0', 0, 8, 'ascii');
  pkt.writeUInt16LE(0x5200, 8);
  pkt.writeUInt16BE(14, 10);
  pkt[12] = 0; // Aux1
  pkt[13] = 0; // Aux2
  return pkt;
}

/**
 * Build a 14-byte Art-Net 4 ArtPoll (OpCode 0x2000) discovery UDP packet.
 */
export function buildArtPollPacket(flags = 0x00, diagPriority = 0x00) {
  const pkt = Buffer.alloc(14);
  pkt.write('Art-Net\0', 0, 8, 'ascii');
  pkt.writeUInt16LE(0x2000, 8);
  pkt.writeUInt16BE(14, 10);
  pkt[12] = Number(flags) & 0xff;
  pkt[13] = Number(diagPriority) & 0xff;
  return pkt;
}

/**
 * Parse an Art-Net ArtPollReply (OpCode 0x2100, >= 207 bytes) discovery packet.
 */
export function parseArtPollReply(buf) {
  if (!buf || buf.length < 207) return null;
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.toString('ascii', 0, 8) !== 'Art-Net\0') return null;
  if (b.readUInt16LE(8) !== 0x2100) return null;
  const ip = `${b[10]}.${b[11]}.${b[12]}.${b[13]}`;
  const port = b.readUInt16LE(14);
  const netSwitch = b[18] & 0x7f;
  const subSwitch = b[19] & 0x0f;
  const shortName = b.toString('utf8', 26, 44).replace(/\0+$/, '');
  const longName = b.toString('utf8', 44, 108).replace(/\0+$/, '');
  const numPorts = Math.min(4, b.readUInt16BE(172));
  const universes = [];
  for (let i = 0; i < numPorts; i++) {
    universes.push((netSwitch << 8) | (subSwitch << 4) | (b[190 + i] & 0x0f));
  }
  return { ip, port, netSwitch, subSwitch, shortName, longName, numPorts, universes };
}

/**
 * Build a standard 239-byte Art-Net 4 ArtPollReply (OpCode 0x2100 LE) discovery response.
 * Clean-room implementation referencing Art-Net 4 specification & margau/dmxnet (MIT).
 */
export function buildArtPollReplyPacket(opts = {}) {
  const pkt = Buffer.alloc(239);
  pkt.write('Art-Net\0', 0, 8, 'ascii');
  pkt.writeUInt16LE(0x2100, 8);
  const ipStr = String(opts.ip || '127.0.0.1');
  const octets = ipStr.split('.').map((n) => Math.max(0, Math.min(255, Number(n) | 0)));
  for (let i = 0; i < 4; i++) pkt[10 + i] = octets[i] ?? (i === 0 ? 127 : i === 3 ? 1 : 0);
  const port = Math.max(1, Math.min(65535, Number(opts.port) || 6454));
  pkt.writeUInt16LE(port, 14);
  pkt.writeUInt16BE(Number(opts.versInfo) || 0x0100, 16);
  const netSwitch = Math.max(0, Math.min(127, Number(opts.netSwitch) | 0));
  const subSwitch = Math.max(0, Math.min(15, Number(opts.subSwitch) | 0));
  pkt[18] = netSwitch;
  pkt[19] = subSwitch;
  pkt.writeUInt16BE(Number(opts.oem) || 0x00ff, 20);
  pkt[22] = 0; // Ubea version
  pkt[23] = 0xd0; // Status1: normal indicators, Port-Address set by front panel / net
  pkt.writeUInt16LE(0x414c, 24); // ESTA code ('AL')
  pkt.write(String(opts.shortName || 'AlphaLEDStudio').slice(0, 17), 26, 18, 'utf8');
  pkt.write(String(opts.longName || 'Alpha LED Studio 3D Visualizer (Art-Net 4)').slice(0, 63), 44, 64, 'utf8');
  pkt.write(String(opts.nodeReport || '#0001 [0000] Alpha LED Studio DMX IN Ready').slice(0, 63), 108, 64, 'utf8');
  const rawUnis = Array.isArray(opts.universes) && opts.universes.length ? opts.universes.slice(0, 4) : [0];
  const numPorts = Math.max(1, Math.min(4, rawUnis.length));
  pkt.writeUInt16BE(numPorts, 172);
  for (let i = 0; i < numPorts; i++) {
    pkt[174 + i] = 0x80; // PortTypes: Output from Art-Net (DMX512)
    pkt[178 + i] = 0x00; // GoodInput
    pkt[182 + i] = 0x80; // GoodOutput: data being transmitted
    pkt[190 + i] = Number(rawUnis[i]) & 0x0f; // SwOut low nibble
  }
  const mac = Array.isArray(opts.mac) && opts.mac.length === 6 ? opts.mac : [0x02, 0x41, 0x4c, 0x50, 0x48, 0x01];
  for (let i = 0; i < 6; i++) pkt[201 + i] = mac[i] & 0xff;
  for (let i = 0; i < 4; i++) pkt[207 + i] = pkt[10 + i]; // BindIp
  pkt[211] = Number(opts.bindIndex) || 1;
  pkt[212] = 0x0e; // Status2: supports Art-Net 3/4 15-bit Port-Address & sACN capable flag
  return pkt;
}

/**
 * Parse an incoming Art-Net 4 UDP packet (ArtDmx 0x5000 or ArtPoll 0x2000).
 * Strictly enforces BE Length (even 2..512) and 15-bit Port-Address.
 */
export function parseArtNetPacket(buf) {
  if (!buf || buf.length < 14) return null;
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.toString('ascii', 0, 8) !== 'Art-Net\0') return null;
  const opCode = b.readUInt16LE(8);
  const protVer = b.readUInt16BE(10);
  if (opCode === 0x2000) {
    if (protVer < 14) return null;
    return { type: 'poll', protocol: 'artnet', protVer, flags: b[12], diagPriority: b[13] };
  }
  if (opCode === 0x5000) {
    if (b.length < 18 || protVer < 14) return null;
    const sequence = b[12];
    const physical = b[13];
    const universe = b[14] | ((b[15] & 0x7f) << 8);
    const length = b.readUInt16BE(16);
    if (length < 2 || length > 512 || (length & 1) !== 0) return null;
    if (18 + length > b.length) return null;
    const channels = new Uint8Array(512);
    b.copy(channels, 0, 18, 18 + length);
    return {
      type: 'dmx',
      protocol: 'artnet',
      protVer,
      sequence,
      physical,
      universe,
      universe1Based: universe + 1,
      length,
      channels
    };
  }
  return null;
}

/**
 * Parse an incoming ANSI E1.31 (sACN) Data Packet (StartCode 0x00).
 */
export function parseSacnE131Packet(buf) {
  if (!buf || buf.length < 126) return null;
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  if (b.readUInt16BE(0) !== 0x0010 || b.readUInt16BE(2) !== 0x0000) return null;
  if (b.toString('ascii', 4, 16) !== 'ASC-E1.17\0\0\0') return null;
  if (b.readUInt32BE(18) !== 0x00000004) return null;
  if (b.readUInt32BE(40) !== 0x00000002) return null;
  if (b[117] !== 0x02 || b[118] !== 0xa1) return null;

  const cid = b.subarray(22, 38).toString('hex');
  const sourceName = b.toString('utf8', 44, 108).replace(/\0.*$/, '');
  const priority = b[108];
  if (priority > 200) return null;
  const sequence = b[111];
  const options = b[112];
  const previewData = (options & 0x80) !== 0;
  const streamTerminated = (options & 0x40) !== 0;
  const universe = b.readUInt16BE(113);
  if (universe < 1 || universe > 63999) return null;

  const propCount = b.readUInt16BE(123);
  if (propCount < 1 || propCount > 513) return null;
  const startCode = b[125];
  if (startCode !== 0x00) return null;
  const slotCount = Math.min(512, propCount - 1);
  if (126 + slotCount > b.length) return null;

  const channels = new Uint8Array(512);
  b.copy(channels, 0, 126, 126 + slotCount);
  return {
    type: 'dmx',
    protocol: 'sacn',
    cid,
    sourceName: sourceName || 'sACN Source',
    priority,
    sequence,
    options,
    previewData,
    streamTerminated,
    universe,
    length: slotCount,
    channels
  };
}

export function sacnMulticastAddress(universe) {
  const u = Math.max(1, Math.min(63999, Number(universe) | 0));
  return `239.255.${(u >> 8) & 0xff}.${u & 0xff}`;
}

/**
 * Clean-room ANSI E1.31 Universe Merger (HTP / LTP + Priority + Stream_Terminated + Single-Timer Timeout).
 * Reference: InanisOmnia/sACN (Apache-2.0, fixes toString(36) NaN key, per-packet setTimeout & seq 255->0 wrap).
 */
export function createSacnUniverseMerger({
  mode = 'HTP',
  timeoutMs = 2500,
  acceptPreview = false,
  sweepMs = 500,
  maxUniverses = 64,
  maxSourcesPerUniverse = 16,
  onUniverseChange = null
} = {}) {
  const mergeMode = String(mode || 'HTP').toUpperCase() === 'LTP' ? 'LTP' : 'HTP';
  const universes = new Map(); // Map<number, { sources: Map<string, SourceState>, merged: Uint8Array }>

  function computeMerged(uniEntry) {
    const out = uniEntry.merged;
    out.fill(0);
    if (uniEntry.sources.size === 0) {
      return { channels: out, priority: 0, sourceName: '', activeSourceCount: 0 };
    }
    let maxPrio = -1;
    let latestSrc = null;
    for (const s of uniEntry.sources.values()) {
      if (s.priority > maxPrio) {
        maxPrio = s.priority;
        latestSrc = s;
      } else if (s.priority === maxPrio && (!latestSrc || s.lastSeenMs >= latestSrc.lastSeenMs)) {
        latestSrc = s;
      }
    }
    if (mergeMode === 'LTP' && latestSrc) {
      out.set(latestSrc.channels);
      return {
        channels: out,
        priority: maxPrio,
        sourceName: latestSrc.sourceName,
        activeSourceCount: uniEntry.sources.size
      };
    }
    const winners = [];
    for (const s of uniEntry.sources.values()) {
      if (s.priority === maxPrio) winners.push(s);
    }
    if (winners.length === 1) {
      out.set(winners[0].channels);
    } else {
      for (const s of winners) {
        const ch = s.channels;
        for (let i = 0; i < 512; i++) {
          if (ch[i] > out[i]) out[i] = ch[i];
        }
      }
    }
    return {
      channels: out,
      priority: maxPrio,
      sourceName: winners.map((w) => w.sourceName).filter(Boolean).join(' + '),
      activeSourceCount: uniEntry.sources.size
    };
  }

  function sweep(nowMs = Date.now()) {
    const expired = [];
    for (const [uni, entry] of universes.entries()) {
      let changed = false;
      for (const [cid, src] of entry.sources.entries()) {
        if (nowMs - src.lastSeenMs > timeoutMs) {
          entry.sources.delete(cid);
          changed = true;
        }
      }
      if (changed) {
        const info = computeMerged(entry);
        expired.push({ universe: uni, ...info });
        onUniverseChange?.({ universe: uni, protocol: 'sacn', ...info, expired: true });
        if (entry.sources.size === 0) universes.delete(uni);
      }
    }
    return expired;
  }

  const sweepTimer = sweepMs > 0 ? setInterval(() => sweep(Date.now()), sweepMs) : null;
  sweepTimer?.unref?.();

  function ingest(pkt, nowMs = Date.now()) {
    if (!pkt || pkt.protocol !== 'sacn') return { accepted: false, reason: 'not_sacn' };
    if (pkt.previewData && !acceptPreview) return { accepted: false, reason: 'preview_ignored' };

    const uni = Math.trunc(Number(pkt.universe));
    if (!Number.isInteger(uni) || uni < 1 || uni > 63999) return { accepted: false, reason: 'invalid_universe' };

    let entry = universes.get(uni);
    if (!entry) {
      if (pkt.streamTerminated) return { accepted: true, terminated: true, universe: uni, activeSourceCount: 0 };
      if (universes.size >= maxUniverses) return { accepted: false, reason: 'max_universes' };
      entry = { sources: new Map(), merged: new Uint8Array(512) };
      universes.set(uni, entry);
    }

    if (pkt.streamTerminated) {
      const existed = entry.sources.delete(pkt.cid);
      if (!existed) return { accepted: true, terminated: true, universe: uni, activeSourceCount: entry.sources.size };
      const info = computeMerged(entry);
      if (entry.sources.size === 0) universes.delete(uni);
      onUniverseChange?.({ universe: uni, protocol: 'sacn', ...info, terminated: true });
      return { accepted: true, terminated: true, universe: uni, ...info };
    }

    const existing = entry.sources.get(pkt.cid);
    if (existing) {
      // ANSI E1.31 §6.7.2 mod-256 sequence continuity check (handles 255 -> 0 cleanly)
      const diff = (pkt.sequence - existing.lastSeq) & 0xff;
      if (diff === 0 || diff > 236) {
        return { accepted: false, reason: 'out_of_order' };
      }
      existing.lastSeq = pkt.sequence;
      existing.priority = pkt.priority;
      existing.sourceName = pkt.sourceName || existing.sourceName;
      existing.lastSeenMs = nowMs;
      existing.channels.set(pkt.channels);
    } else {
      if (entry.sources.size >= maxSourcesPerUniverse) return { accepted: false, reason: 'max_sources' };
      const copy = new Uint8Array(512);
      copy.set(pkt.channels);
      entry.sources.set(pkt.cid, {
        cid: pkt.cid,
        sourceName: pkt.sourceName || 'sACN Source',
        priority: pkt.priority,
        lastSeq: pkt.sequence,
        lastSeenMs: nowMs,
        channels: copy
      });
    }

    const info = computeMerged(entry);
    onUniverseChange?.({ universe: uni, protocol: 'sacn', ...info });
    return { accepted: true, universe: uni, ...info };
  }

  return {
    ingest,
    sweep,
    getMerged(universe) {
      const entry = universes.get(Math.trunc(Number(universe)));
      if (!entry) return null;
      return new Uint8Array(entry.merged);
    },
    getActiveSources() {
      const list = [];
      for (const [uni, entry] of universes.entries()) {
        for (const s of entry.sources.values()) {
          list.push({ universe: uni, cid: s.cid, sourceName: s.sourceName, priority: s.priority, lastSeenMs: s.lastSeenMs });
        }
      }
      return list;
    },
    dispose() {
      if (sweepTimer) clearInterval(sweepTimer);
      universes.clear();
    }
  };
}

/**
 * Build a standard 638-byte ANSI E1.31 (sACN) Data Packet for DMX512-A.
 */
export function buildSacnE131Packet(universe = 1, dmxChannels = [], sequence = 1, sourceNameOrOpts = 'Alpha LED Studio DMX Bridge', maybeOpts = {}) {
  let sourceName = 'Alpha LED Studio DMX Bridge';
  let opts = maybeOpts || {};
  if (sourceNameOrOpts && typeof sourceNameOrOpts === 'object') {
    opts = sourceNameOrOpts;
    if (typeof opts.sourceName === 'string' && opts.sourceName) sourceName = opts.sourceName;
  } else if (typeof sourceNameOrOpts === 'string' && sourceNameOrOpts) {
    sourceName = sourceNameOrOpts;
  }

  const dmx = new Uint8Array(512);
  const len = Math.min(512, dmxChannels?.length || 0);
  for (let i = 0; i < len; i++) {
    dmx[i] = Math.max(0, Math.min(255, Number(dmxChannels[i]) | 0));
  }

  const pkt = Buffer.alloc(638);
  // --- Root Layer (bytes 0..37) ---
  pkt.writeUInt16BE(0x0010, 0);
  pkt.writeUInt16BE(0x0000, 2);
  pkt.write('ASC-E1.17\0\0\0', 4, 12, 'ascii');
  pkt.writeUInt16BE(0x7000 | (638 - 16), 16);
  pkt.writeUInt32BE(0x00000004, 18);
  const cid = crypto.createHash('md5').update(String(sourceName)).digest();
  cid.copy(pkt, 22, 0, 16);

  // --- Framing Layer (bytes 38..114) ---
  pkt.writeUInt16BE(0x7000 | (638 - 38), 38);
  pkt.writeUInt32BE(0x00000002, 40);
  pkt.write(String(sourceName).slice(0, 63), 44, 64, 'utf8');
  pkt[108] = opts.priority === undefined || opts.priority === null
    ? 100
    : (Number.isFinite(Number(opts.priority)) ? Math.max(0, Math.min(200, Math.round(Number(opts.priority)))) : 100);
  pkt.writeUInt16BE(0, 109);
  const seqNum = Number(sequence);
  pkt[111] = Number.isFinite(seqNum) ? (Math.trunc(seqNum) & 0xff) : 1;
  // ANSI E1.31 §6.2.6 Stream_Terminated bit (0x40)
  pkt[112] = opts.terminated ? 0x40 : 0x00;
  pkt.writeUInt16BE(Math.max(1, Math.min(63999, Number(universe) || 1)), 113);

  // --- DMP Layer (bytes 115..637) ---
  pkt.writeUInt16BE(0x7000 | (638 - 115), 115);
  pkt[117] = 0x02;
  pkt[118] = 0xa1;
  pkt.writeUInt16BE(0x0000, 119);
  pkt.writeUInt16BE(0x0001, 121);
  pkt.writeUInt16BE(513, 123);
  pkt[125] = 0x00;
  Buffer.from(dmx.buffer, dmx.byteOffset, 512).copy(pkt, 126);
  return pkt;
}

export async function terminateSacnUniverse(udpSocket, universe, host, port, seqMap = new Map(), onSent = null) {
  const uni = Math.max(1, Math.min(63999, Number(universe) || 1));
  const seqKey = `sacn:${uni}`;
  const zero = new Uint8Array(512);
  let totalBytes = 0;
  for (let i = 0; i < 3; i++) {
    const seqNum = nextUniverseSeq(seqMap, seqKey);
    const pkt = buildSacnE131Packet(uni, zero, seqNum, { terminated: true });
    await new Promise((resolve, reject) => {
      udpSocket.send(pkt, 0, pkt.length, port, host, (err) => {
        if (err) return reject(err);
        totalBytes += pkt.length;
        onSent?.({ protocol: 'sacn_terminate', universe: uni, length: pkt.length, dstHost: host, dstPort: port });
        resolve();
      });
    });
  }
  return totalBytes;
}

export function decodeWsFrames(buffer, maxFramePayload = MAX_WS_FRAME_BYTES) {
  const frames = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const b0 = buffer[offset];
    const b1 = buffer[offset + 1];
    const opcode = b0 & 0x0f;
    const masked = (b1 & 0x80) !== 0;
    let payloadLen = b1 & 0x7f;
    let headerLen = 2;

    if (payloadLen === 126) {
      if (offset + 4 > buffer.length) break;
      payloadLen = buffer.readUInt16BE(offset + 2);
      headerLen = 4;
    } else if (payloadLen === 127) {
      if (offset + 10 > buffer.length) break;
      const bigLen = buffer.readBigUInt64BE(offset + 2);
      if (bigLen > BigInt(maxFramePayload)) {
        return { frames, remainder: Buffer.alloc(0), error: 'Frame payload exceeds limit' };
      }
      payloadLen = Number(bigLen);
      headerLen = 10;
    }

    if (payloadLen > maxFramePayload) {
      return { frames, remainder: Buffer.alloc(0), error: 'Frame payload exceeds limit' };
    }

    const maskLen = masked ? 4 : 0;
    if (offset + headerLen + maskLen + payloadLen > buffer.length) break;

    const data = Buffer.alloc(payloadLen);
    if (masked) {
      const mask = buffer.subarray(offset + headerLen, offset + headerLen + 4);
      const src = buffer.subarray(offset + headerLen + 4, offset + headerLen + 4 + payloadLen);
      for (let i = 0; i < payloadLen; i++) data[i] = src[i] ^ mask[i & 3];
    } else {
      buffer.copy(data, 0, offset + headerLen, offset + headerLen + payloadLen);
    }

    offset += headerLen + maskLen + payloadLen;
    if (opcode === 0x01 || opcode === 0x02 || opcode === 0x08 || opcode === 0x09) {
      frames.push({ opcode, data });
    }
  }
  return { frames, remainder: buffer.subarray(offset), error: null };
}

export function encodeWsTextFrame(payloadStr) {
  const payload = Buffer.from(String(payloadStr ?? ''), 'utf8');
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function resolvePreferredIpv4(iface) {
  if (iface && /^\d{1,3}(\.\d{1,3}){3}$/.test(String(iface).trim())) return String(iface).trim();
  const nets = os.networkInterfaces?.() || {};
  for (const entries of Object.values(nets)) {
    for (const e of entries || []) {
      if (e && e.family === 'IPv4' && !e.internal) return e.address;
    }
  }
  return '127.0.0.1';
}

export function createDmxBridgeServer({
  protocol = 'artnet',
  targetHost = '127.0.0.1',
  targetPort = protocol === 'sacn' ? 5568 : 6454,
  wsPort = 9454,
  sessionToken = crypto.randomBytes(16).toString('hex'),
  requireToken = false,
  onPacketSent = null,
  rxArtNet = false,
  rxSacn = false,
  rxArtNetPort = 6454,
  rxSacnPort = 5568,
  rxUniverses = [1, 2, 3, 4],
  rxIface = '',
  rxMergeMode = 'HTP',
  rxAcceptPreview = false,
  rxThrottleMs = 22,
  onDmxIn = null
} = {}) {
  const udp = dgram.createSocket('udp4');
  let udpBound = false;
  const seqByUniverse = new Map();
  const activeSacnTargets = new Map();
  const wsSockets = new Set();
  const wsRxSubs = new Map();
  let packetsSent = 0;

  let rxArtNetSock = null;
  let rxSacnSock = null;
  let rxPacketsReceived = 0;
  let rxFlushTimer = null;
  const rxDirtyFrames = new Map();
  const normRxUniverses = Array.from(new Set(
    (Array.isArray(rxUniverses) ? rxUniverses : [1, 2, 3, 4])
      .map((u) => Math.trunc(Number(u)))
      .filter((u) => Number.isInteger(u) && u >= 1 && u <= 63999)
  ));
  if (!normRxUniverses.length) normRxUniverses.push(1, 2, 3, 4);

  const MAX_RX_UNIVERSES = 64;
  let artnetRxPromise = null;
  let sacnRxPromise = null;
  let artPollWinStart = 0;
  let artPollWinCount = 0;

  function hasMatchingWsSub(protocolName, universe1Based) {
    for (const [, sub] of wsRxSubs.entries()) {
      if (!sub?.enabled) continue;
      if (sub.protocols && !sub.protocols.has(protocolName)) continue;
      if (sub.universes && sub.universes.size > 0 && !sub.universes.has(universe1Based)) continue;
      return true;
    }
    return false;
  }

  function flushDirtyRxFrames() {
    rxFlushTimer = null;
    if (rxDirtyFrames.size === 0) return;
    for (const [key, item] of rxDirtyFrames.entries()) {
      rxDirtyFrames.delete(key);
      if (hasMatchingWsSub(item.protocol, item.universe)) {
        const b64 = Buffer.from(item.channels.buffer, item.channels.byteOffset, 512).toString('base64');
        const payload = JSON.stringify({
          type: 'dmx_in',
          protocol: item.protocol,
          universe: item.universe,
          sourceName: item.sourceName || '',
          priority: item.priority ?? 100,
          ts: item.ts,
          channels: b64
        });
        const frameBuf = encodeWsTextFrame(payload);
        for (const [ws, sub] of wsRxSubs.entries()) {
          if (!sub?.enabled) continue;
          if (sub.protocols && !sub.protocols.has(item.protocol)) continue;
          if (sub.universes && sub.universes.size > 0 && !sub.universes.has(item.universe)) continue;
          try {
            if (!ws.destroyed && ws.writable) ws.write(frameBuf);
          } catch {
            // ignore closed socket
          }
        }
      }
      onDmxIn?.({ protocol: item.protocol, universe: item.universe, sourceName: item.sourceName, priority: item.priority, channels: item.channels });
    }
  }

  function queueRxFrame(protocolName, universe1Based, channels, meta = {}) {
    if (!onDmxIn && !hasMatchingWsSub(protocolName, universe1Based)) return;
    const key = `${protocolName}:${universe1Based}`;
    let slot = rxDirtyFrames.get(key);
    if (!slot) {
      if (rxDirtyFrames.size >= MAX_RX_UNIVERSES) return;
      slot = { protocol: protocolName, universe: universe1Based, channels: new Uint8Array(512), sourceName: '', priority: 100, ts: Date.now() };
      rxDirtyFrames.set(key, slot);
    }
    slot.channels.set(channels);
    slot.sourceName = meta.sourceName || '';
    slot.priority = meta.priority ?? 100;
    slot.ts = Date.now();
    if (!rxFlushTimer) {
      rxFlushTimer = setTimeout(flushDirtyRxFrames, Math.max(5, Number(rxThrottleMs) || 22));
      rxFlushTimer.unref?.();
    }
  }

  const sacnMerger = createSacnUniverseMerger({
    mode: rxMergeMode,
    acceptPreview: Boolean(rxAcceptPreview),
    onUniverseChange(ev) {
      queueRxFrame('sacn', ev.universe, ev.channels, { sourceName: ev.sourceName, priority: ev.priority });
    }
  });

  function resolveRxBindPort(portOverride, fallbackPort) {
    if (portOverride === undefined || portOverride === null || portOverride === '') return Number(fallbackPort);
    const p = Number(portOverride);
    if (!Number.isInteger(p) || p < 0 || p > 65535) {
      throw new Error(`Invalid RX UDP port: ${portOverride}`);
    }
    return p;
  }

  async function ensureArtNetRx(portOverride) {
    if (rxArtNetSock) return rxArtNetSock.address();
    if (artnetRxPromise) return artnetRxPromise;
    artnetRxPromise = (async () => {
      const bindPort = resolveRxBindPort(portOverride, rxArtNetPort);
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      sock.on('error', () => {});
      sock.on('message', (msg, rinfo) => {
        const parsed = parseArtNetPacket(msg);
        if (!parsed) return;
        if (parsed.type === 'poll') {
          if (!rinfo?.address || !isAllowedDmxTargetHost(rinfo.address, targetHost)) return;
          const nowMs = Date.now();
          if (nowMs - artPollWinStart >= 1000) {
            artPollWinStart = nowMs;
            artPollWinCount = 0;
          }
          if (artPollWinCount >= 10) return;
          artPollWinCount++;
          const localIp = resolvePreferredIpv4(rxIface);
          const reply = buildArtPollReplyPacket({
            ip: localIp,
            port: sock.address()?.port || 6454,
            universes: normRxUniverses.map((u) => Math.max(0, u - 1))
          });
          try {
            sock.send(reply, 0, reply.length, rinfo.port, rinfo.address, () => {});
          } catch {
            // ignore reply send failure
          }
          return;
        }
        if (parsed.type === 'dmx') {
          rxPacketsReceived++;
          queueRxFrame('artnet', parsed.universe1Based, parsed.channels, {
            sourceName: `Art-Net ${rinfo.address}`,
            priority: 100
          });
        }
      });
      await new Promise((resolve, reject) => {
        const onErr = (err) => {
          try { sock.close(); } catch {}
          reject(err);
        };
        sock.once('error', onErr);
        try {
          sock.bind(Number.isFinite(bindPort) ? bindPort : 6454, rxIface || '0.0.0.0', () => {
            sock.off('error', onErr);
            try { sock.setBroadcast(true); } catch {}
            resolve();
          });
        } catch (err) {
          sock.off('error', onErr);
          try { sock.close(); } catch {}
          reject(err);
        }
      });
      rxArtNetSock = sock;
      return sock.address();
    })();
    try {
      return await artnetRxPromise;
    } finally {
      artnetRxPromise = null;
    }
  }

  async function ensureSacnRx(portOverride, extraUniverses = null) {
    if (rxSacnSock) return rxSacnSock.address();
    if (sacnRxPromise) return sacnRxPromise;
    sacnRxPromise = (async () => {
      const bindPort = resolveRxBindPort(portOverride, rxSacnPort);
      const sock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      sock.on('error', () => {});
      sock.on('message', (msg) => {
        const parsed = parseSacnE131Packet(msg);
        if (!parsed) return;
        rxPacketsReceived++;
        sacnMerger.ingest(parsed, Date.now());
      });
      await new Promise((resolve, reject) => {
        const onErr = (err) => {
          try { sock.close(); } catch {}
          reject(err);
        };
        sock.once('error', onErr);
        try {
          sock.bind(Number.isFinite(bindPort) ? bindPort : 5568, rxIface || '0.0.0.0', () => {
            sock.off('error', onErr);
            const unis = Array.isArray(extraUniverses) && extraUniverses.length ? extraUniverses : normRxUniverses;
            for (const u of unis) {
              try {
                sock.addMembership(sacnMulticastAddress(u), rxIface || undefined);
              } catch {
                // Unicast UDP on loopback/offline host continues working without multicast NIC
              }
            }
            resolve();
          });
        } catch (err) {
          sock.off('error', onErr);
          try { sock.close(); } catch {}
          reject(err);
        }
      });
      rxSacnSock = sock;
      return sock.address();
    })();
    try {
      return await sacnRxPromise;
    } finally {
      sacnRxPromise = null;
    }
  }

  function ensureBroadcast(hostStr) {
    if (hostStr === '255.255.255.255' || hostStr.endsWith('.255')) {
      try {
        udp.setBroadcast(true);
      } catch {
        // socket will enable broadcast once bound
      }
    }
  }

  function validateHostAndPort(host, port, useSacn) {
    const dstHost = String(host || targetHost || '127.0.0.1').trim();
    if (!isAllowedDmxTargetHost(dstHost, targetHost)) {
      throw new Error(`Disallowed DMX target host: ${dstHost}`);
    }
    const rawPort = port !== undefined && port !== null && port !== '' ? Number(port) : (useSacn ? 5568 : 6454);
    if (!Number.isInteger(rawPort) || rawPort < 1 || rawPort > 65535) {
      throw new Error(`Invalid DMX target port: ${port}`);
    }
    return { dstHost, dstPort: rawPort };
  }

  function sendUdpPacket(pkt, dstPort, dstHost, meta) {
    ensureBroadcast(dstHost);
    return new Promise((resolve, reject) => {
      udp.send(pkt, 0, pkt.length, dstPort, dstHost, (err) => {
        if (err) return reject(err);
        packetsSent++;
        onPacketSent?.({ ...meta, length: pkt.length, dstHost, dstPort, packetsSent });
        resolve(pkt.length);
      });
    });
  }

  async function forwardDmxFrame({ universe = 0, channels = [], proto = protocol, host = targetHost, port = targetPort, artSync = false, action = '' }) {
    const useSacn = String(proto || protocol).toLowerCase() === 'sacn';
    const { dstHost, dstPort } = validateHostAndPort(host, port, useSacn);

    if (action === 'terminate' && useSacn) {
      const uni = Math.max(1, Math.min(63999, Number(universe) || 1));
      activeSacnTargets.delete(`${dstHost}:${dstPort}:${uni}`);
      return terminateSacnUniverse(udp, uni, dstHost, dstPort, seqByUniverse, (meta) => {
        packetsSent++;
        onPacketSent?.({ ...meta, packetsSent });
      });
    }

    const normUni = useSacn ? Math.max(1, Math.min(63999, Number(universe) || 1)) : (Number(universe) || 0);
    const seqNum = nextUniverseSeq(seqByUniverse, `${useSacn ? 'sacn' : 'artnet'}:${normUni}`);
    const pkt = useSacn
      ? buildSacnE131Packet(normUni, channels, seqNum)
      : buildArtNetPacket(normUni, channels, seqNum);
    if (useSacn) {
      activeSacnTargets.set(`${dstHost}:${dstPort}:${normUni}`, { universe: normUni, host: dstHost, port: dstPort });
    }
    const bytes = await sendUdpPacket(pkt, dstPort, dstHost, {
      protocol: useSacn ? 'sacn' : 'artnet',
      universe: normUni,
      sequence: seqNum
    });
    if (artSync && !useSacn) {
      const syncPkt = buildArtSyncPacket();
      await sendUdpPacket(syncPkt, dstPort, dstHost, { protocol: 'artnet_sync', universe: normUni });
    }
    return bytes;
  }

  async function terminateAllActiveSacn() {
    if (!activeSacnTargets.size) return 0;
    const targets = [...activeSacnTargets.values()];
    activeSacnTargets.clear();
    let sent = 0;
    for (const t of targets) {
      try {
        await terminateSacnUniverse(udp, t.universe, t.host, t.port, seqByUniverse, (meta) => {
          packetsSent++;
          onPacketSent?.({ ...meta, packetsSent });
        });
        sent += 3;
      } catch {
        // ignore best-effort socket termination failure during shutdown
      }
    }
    return sent;
  }

  function extractWsTokenProtocol(req) {
    const wsProto = req.headers?.['sec-websocket-protocol'];
    if (typeof wsProto !== 'string') return null;
    for (const part of wsProto.split(',')) {
      const p = part.trim();
      if (p.startsWith('alpha-token.')) return p;
    }
    return null;
  }

  function authorizeRequest(req, { skipToken = false } = {}) {
    const origin = req.headers.origin;
    if (origin && !isAllowedBridgeOrigin(origin)) {
      return { ok: false, status: 403, error: 'Forbidden origin', originAllowed: false };
    }
    if (!skipToken && (requireToken || originRequiresSessionToken(origin))) {
      const provided = extractRequestToken(req);
      if (!timingSafeTokenMatch(provided, sessionToken)) {
        return { ok: false, status: 403, error: 'origin_token_required', origin, originAllowed: true };
      }
    }
    return { ok: true, origin, originAllowed: true };
  }

  async function readJsonBody(req) {
    const ct = String(req.headers['content-type'] || '').toLowerCase();
    if (!ct.includes('application/json')) {
      const err = new Error('Content-Type must be application/json');
      err.status = 415;
      throw err;
    }
    const chunks = [];
    let totalBytes = 0;
    for await (const c of req) {
      totalBytes += c.length;
      if (totalBytes > MAX_HTTP_BODY_BYTES) {
        const err = new Error('Payload too large');
        err.status = 413;
        throw err;
      }
      chunks.push(c);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }

  const server = http.createServer(async (req, res) => {
    const isPreflight = req.method === 'OPTIONS';
    const auth = authorizeRequest(req, { skipToken: isPreflight });
    if (auth.originAllowed) {
      res.setHeader('Access-Control-Allow-Origin', auth.origin || 'http://127.0.0.1');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Alpha-Bridge-Token');
      if (String(req.headers['access-control-request-private-network'] || '').toLowerCase() === 'true') {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
      }
    }
    if (!auth.ok) {
      res.writeHead(auth.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: auth.error }));
      return;
    }
    if (isPreflight) {
      res.writeHead(204);
      res.end();
      return;
    }
    const reqPath = (req.url || '/').split('?')[0];
    if (req.method === 'GET' && reqPath === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        bridge: 'Alpha-LED-Studio-DMX-UDP',
        version: BRIDGE_VERSION,
        protocol,
        targetHost,
        targetPort,
        packetsSent,
        tokenRequiredForNullOrigin: true,
        tokenRequiredForRemoteOrigin: true,
        rx: {
          artnetActive: Boolean(rxArtNetSock),
          sacnActive: Boolean(rxSacnSock),
          artnetPort: rxArtNetSock ? rxArtNetSock.address()?.port : rxArtNetPort,
          sacnPort: rxSacnSock ? rxSacnSock.address()?.port : rxSacnPort,
          universes: normRxUniverses,
          mergeMode: rxMergeMode,
          packetsReceived: rxPacketsReceived,
          activeSources: sacnMerger.getActiveSources().length
        }
      }));
      return;
    }
    if (req.method === 'POST' && reqPath === '/dmx/sync') {
      try {
        const body = await readJsonBody(req);
        const { dstHost, dstPort } = validateHostAndPort(body.host, body.port, false);
        const syncPkt = buildArtSyncPacket();
        const bytes = await sendUdpPacket(syncPkt, dstPort, dstHost, { protocol: 'artnet_sync', universe: 0 });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, bytes, packetsSent }));
      } catch (err) {
        res.writeHead(err.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }
    if (req.method === 'POST' && reqPath === '/dmx/stop') {
      try {
        const body = await readJsonBody(req);
        const uni = Math.max(1, Math.min(63999, Number(body.universe) || 1));
        const { dstHost, dstPort } = validateHostAndPort(body.host, body.port, true);
        activeSacnTargets.delete(`${dstHost}:${dstPort}:${uni}`);
        const bytes = await terminateSacnUniverse(udp, uni, dstHost, dstPort, seqByUniverse, (meta) => {
          packetsSent++;
          onPacketSent?.({ ...meta, packetsSent });
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, terminated: true, bytes, packetsSent }));
      } catch (err) {
        res.writeHead(err.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }
    if (req.method === 'POST' && reqPath === '/dmx') {
      try {
        const body = await readJsonBody(req);
        const bytes = await forwardDmxFrame(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, bytes, packetsSent }));
      } catch (err) {
        res.writeHead(err.status || 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.on('upgrade', (req, socket) => {
    const auth = authorizeRequest(req);
    if (!auth.ok) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }
    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }
    const accept = crypto.createHash('sha1').update(key + WS_GUID).digest('base64');
    const wsTokProto = extractWsTokenProtocol(req);
    const negotiatedProto = (wsTokProto && timingSafeTokenMatch(wsTokProto.slice('alpha-token.'.length), sessionToken))
      ? `Sec-WebSocket-Protocol: alpha-token.${sessionToken}\r\n`
      : '';
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: websocket\r\n' +
      'Connection: Upgrade\r\n' +
      `Sec-WebSocket-Accept: ${accept}\r\n` +
      negotiatedProto +
      '\r\n'
    );
    wsSockets.add(socket);
    socket.on('close', () => {
      wsSockets.delete(socket);
      wsRxSubs.delete(socket);
    });
    socket.on('end', () => { try { socket.end(); } catch {} });
    socket.on('error', () => {
      wsRxSubs.delete(socket);
      try { socket.destroy(); } catch {}
    });
    let rxBuf = Buffer.alloc(0);
    socket.on('data', (buf) => {
      if (rxBuf.length + buf.length > MAX_WS_FRAME_BYTES) {
        socket.destroy();
        return;
      }
      rxBuf = rxBuf.length ? Buffer.concat([rxBuf, buf]) : buf;
      const { frames, remainder, error } = decodeWsFrames(rxBuf, MAX_WS_FRAME_BYTES);
      if (error) {
        socket.destroy();
        return;
      }
      rxBuf = Buffer.from(remainder);
      for (const frame of frames) {
        if (frame.opcode === 0x08) {
          socket.end();
          return;
        }
        if (frame.opcode === 0x09) {
          const pongPayload = frame.data.subarray(0, 125);
          const pong = Buffer.alloc(2 + pongPayload.length);
          pong[0] = 0x8a;
          pong[1] = pongPayload.length;
          pongPayload.copy(pong, 2);
          socket.write(pong);
          continue;
        }
        try {
          if (frame.opcode === 0x02 && frame.data.length >= 512) {
            forwardDmxFrame({ universe: 0, channels: frame.data }).catch(() => {});
          } else {
            const msg = JSON.parse(frame.data.toString('utf8'));
            if (msg?.type === 'subscribe_rx') {
              const protos = new Set(Array.isArray(msg.protocols) && msg.protocols.length ? msg.protocols.map((p) => String(p).toLowerCase()) : ['artnet', 'sacn']);
              const unis = new Set(Array.isArray(msg.universes) ? msg.universes.map((u) => Math.trunc(Number(u))).filter((u) => Number.isInteger(u) && u >= 1 && u <= 63999) : normRxUniverses);
              wsRxSubs.set(socket, { enabled: true, protocols: protos, universes: unis });
              Promise.all([
                protos.has('artnet') ? ensureArtNetRx(msg.artnetPort).catch((e) => ({ error: e.message })) : Promise.resolve(null),
                protos.has('sacn') ? ensureSacnRx(msg.sacnPort, [...unis]).catch((e) => ({ error: e.message })) : Promise.resolve(null)
              ]).then((results) => {
                const errs = results.filter((r) => r && r.error).map((r) => r.error);
                if (!socket.destroyed && socket.writable) {
                  socket.write(encodeWsTextFrame(JSON.stringify({
                    type: 'rx_status',
                    ok: errs.length === 0,
                    ...(errs.length ? { error: errs.join('; ') } : {}),
                    artnetActive: Boolean(rxArtNetSock),
                    sacnActive: Boolean(rxSacnSock),
                    artnetPort: rxArtNetSock?.address?.()?.port || null,
                    sacnPort: rxSacnSock?.address?.()?.port || null
                  })));
                }
              });
            } else if (msg?.type === 'unsubscribe_rx') {
              wsRxSubs.delete(socket);
            } else {
              forwardDmxFrame(msg).catch(() => {});
            }
          }
        } catch {
          // ignore malformed frame
        }
      }
    });
  });

  return {
    server,
    udp,
    sessionToken,
    forwardDmxFrame,
    terminateAllActiveSacn,
    ensureArtNetRx,
    ensureSacnRx,
    getRxAddress() {
      return {
        artnet: rxArtNetSock ? rxArtNetSock.address() : null,
        sacn: rxSacnSock ? rxSacnSock.address() : null
      };
    },
    async listen(port = wsPort) {
      if (!udpBound) {
        await new Promise((resolve) => {
          try {
            udp.bind(0, () => {
              udpBound = true;
              try {
                udp.setBroadcast(true);
              } catch {
                // ignore if platform disallows broadcast on loopback
              }
              resolve();
            });
          } catch {
            resolve();
          }
        });
      }
      if (rxArtNet) await ensureArtNetRx().catch(() => {});
      if (rxSacn) await ensureSacnRx().catch(() => {});
      await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
      return server.address();
    },
    async close() {
      if (rxFlushTimer) {
        clearTimeout(rxFlushTimer);
        rxFlushTimer = null;
      }
      rxDirtyFrames.clear();
      wsRxSubs.clear();
      sacnMerger.dispose();
      await terminateAllActiveSacn();
      if (rxArtNetSock) {
        await new Promise((resolve) => rxArtNetSock.close(() => resolve()));
        rxArtNetSock = null;
      }
      if (rxSacnSock) {
        await new Promise((resolve) => rxSacnSock.close(() => resolve()));
        rxSacnSock = null;
      }
      for (const ws of wsSockets) {
        try { ws.destroy(); } catch {}
      }
      wsSockets.clear();
      server.closeAllConnections?.();
      await new Promise((resolve) => server.close(resolve));
      await new Promise((resolve) => udp.close(() => resolve()));
    }
  };
}

function isBridgeMainEntry() {
  if (!process.argv[1]) return false;
  const selfPath = fileURLToPath(import.meta.url);
  const norm = (p) => {
    const resolved = path.resolve(p);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  };
  if (norm(selfPath) === norm(process.argv[1])) return true;
  try {
    return norm(fs.realpathSync(selfPath)) === norm(fs.realpathSync(process.argv[1]));
  } catch {
    return false;
  }
}

if (isBridgeMainEntry()) {
  const args = process.argv.slice(2);
  const getArg = (flag, fb) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fb;
  };
  const hasFlag = (flag) => args.includes(flag);
  const protocol = getArg('--protocol', 'artnet');
  const targetHost = getArg('--host', '127.0.0.1');
  const targetPort = Number(getArg('--port', protocol === 'sacn' ? '5568' : '6454'));
  const wsPort = Number(getArg('--ws-port', '9454'));
  const rxAll = hasFlag('--rx-all');
  const rxArtNet = rxAll || hasFlag('--rx-artnet');
  const rxSacn = rxAll || hasFlag('--rx-sacn');
  const rxUniverses = getArg('--rx-universes', '1,2,3,4')
    .split(',')
    .map((x) => parseInt(x.trim(), 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 63999);
  const rxIface = getArg('--rx-iface', '');
  const rxMergeMode = getArg('--rx-merge', 'HTP');

  const bridge = createDmxBridgeServer({
    protocol,
    targetHost,
    targetPort,
    wsPort,
    rxArtNet,
    rxSacn,
    rxUniverses: rxUniverses.length ? rxUniverses : [1, 2, 3, 4],
    rxIface,
    rxMergeMode
  });
  bridge.listen(wsPort).then((addr) => {
    console.log(`[Alpha LED Studio DMX Bridge v${BRIDGE_VERSION}] Listening on http/ws://127.0.0.1:${addr.port} -> TX ${protocol.toUpperCase()} UDP ${targetHost}:${targetPort}`);
    if (rxArtNet || rxSacn) {
      const rxAddr = bridge.getRxAddress();
      console.log(`[Alpha LED Studio DMX Bridge] DMX IN active -> Art-Net:${rxArtNet ? rxAddr.artnet?.port : 'off'} · sACN:${rxSacn ? rxAddr.sacn?.port : 'off'} · Merge:${rxMergeMode} · Universes:${rxUniverses.join(',') || '1,2,3,4'}`);
    }
    console.log(`[Alpha LED Studio DMX Bridge] Pairing Token (required for https://giaiphapsangtao.com & file://): ${bridge.sessionToken}`);
  });
}

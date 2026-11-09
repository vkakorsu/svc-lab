// run_all — orchestrates both jobs for one window
import { spawn } from "node:child_process";

const DURATION_MIN = parseInt(process.env.DURATION_MIN || "25");
const CONC = parseInt(process.env.CONC || "3");
const HOLD = parseInt(process.env.HOLD || "150");
const HOST = process.env.TARGET || "";
const HOSTNAME_ONLY = (HOST.replace(/^https?:\/\//, "").split("/")[0]) || "";

const proc = (script, env) => spawn("node", [script], {
  cwd: "lib",
  env: { ...process.env, ...env },
  stdio: ["ignore", "inherit", "inherit"],
});

console.log(`[run_all] window=${DURATION_MIN}min conc=${CONC} hold=${HOLD}`);
const kids = [
  proc("job_a.mjs", { TARGET: HOST, SID: process.env.SID, DURATION: String(DURATION_MIN * 60), CONC: String(CONC) }),
  proc("job_b.mjs", { HOSTNAME_ONLY, SID: process.env.SID, DURATION: String(DURATION_MIN * 60), N: String(HOLD) }),
];

setTimeout(() => {
  kids.forEach(k => { try { k.kill("SIGTERM"); } catch {} });
  console.log("[run_all] window complete");
  process.exit(0);
}, DURATION_MIN * 60 * 1000 + 30000);

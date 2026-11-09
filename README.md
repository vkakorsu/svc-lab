# tasks

Misc node lab jobs. Scheduled runners execute two small workload simulations
(`lib/job_a.mjs`, `lib/job_b.mjs`) against a configurable endpoint.

Configuration lives in repo Variables: `TARGET`, `SID`.

- `job_a` — multipart request generator
- `job_b` — long-lived TLS connection holder
- `run_all` — runs both for a fixed window

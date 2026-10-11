// Stops any Get Fed servers listening on ports 7777 / 3777 (Windows-safe).
import { execSync } from "node:child_process";

const PORTS = [7777, 3777];
let stopped = 0;

for (const port of PORTS) {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: "utf8" });
    const pids = [...new Set(out.split("\n").map((l) => l.trim().split(/\s+/).pop()).filter(Boolean))];
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`stopped process ${pid} on port ${port}`);
        stopped += 1;
      } catch {}
    }
  } catch {}
}
console.log(stopped ? `done — ${stopped} process(es) stopped` : "nothing running on 7777/3777");

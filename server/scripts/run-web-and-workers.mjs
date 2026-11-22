import { spawn } from "node:child_process";

const processes = new Map();
let stopping = false;

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of processes.values()) child.kill(signal);
  const forceStop = setTimeout(() => {
    for (const child of processes.values()) child.kill("SIGKILL");
  }, 8_000);
  forceStop.unref();
}

for (const [name, entry] of [
  ["api", "dist/index.js"],
  ["github-worker", "dist/workers/github-events.worker.js"],
  ["recovery-worker", "dist/workers/recovery.worker.js"],
  ["integration-worker", "dist/workers/integration-sync.worker.js"],
]) {
  const child = spawn(process.execPath, [entry], { stdio: "inherit", env: process.env });
  processes.set(name, child);
  child.once("error", (error) => {
    console.error(`${name} failed to start: ${error.name}`);
    process.exitCode = 1;
    shutdown("SIGTERM");
  });
  child.once("exit", (code, signal) => {
    processes.delete(name);
    if (!stopping) {
      console.error(`${name} exited unexpectedly (${signal ?? code ?? "unknown"}); stopping the demo service.`);
      process.exitCode = typeof code === "number" && code !== 0 ? code : 1;
      shutdown("SIGTERM");
    }
    if (stopping && processes.size === 0) process.exit(process.exitCode ?? 0);
  });
}

process.on("SIGINT", () => shutdown("SIGTERM"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

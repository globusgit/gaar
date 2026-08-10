import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const deploymentId = readFileSync(path.join(projectRoot, ".deployment-id"), "utf8").trim();
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

if (!deploymentId) {
  throw new Error("Missing deployment ID. Run npm run build before npm start.");
}

const child = spawn(process.execPath, [nextBin, "start"], {
  cwd: projectRoot,
  env: { ...process.env, NEXT_DEPLOYMENT_ID: deploymentId },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

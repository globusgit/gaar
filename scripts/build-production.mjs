import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const deploymentId = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`;
const deploymentFile = path.join(projectRoot, ".deployment-id");
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

writeFileSync(deploymentFile, `${deploymentId}\n`, { mode: 0o600 });

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: projectRoot,
  env: { ...process.env, NEXT_DEPLOYMENT_ID: deploymentId },
  stdio: "inherit",
});

process.exit(result.status ?? 1);

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");

function parseEnv(content) {
  const result = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue.trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function loadProjectEnv() {
  if (!fs.existsSync(envPath)) return;

  const parsed = parseEnv(fs.readFileSync(envPath, "utf8"));

  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
}

loadProjectEnv();

const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = process.argv.slice(2);

if (nextArgs.length === 0) {
  nextArgs.push("dev", "--webpack");
}

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

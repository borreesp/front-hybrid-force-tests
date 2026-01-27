import { readFileSync } from "fs";
import { resolve, delimiter, dirname } from "path";
import { spawn } from "child_process";

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/with-env.mjs <env-file> <command> [args...]");
  process.exit(1);
}

const [envFile, ...command] = args;
const envPath = resolve(process.cwd(), envFile);
const content = readFileSync(envPath, "utf8");

for (const rawLine of content.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) {
    continue;
  }
  const cleaned = line.startsWith("export ") ? line.slice(7).trim() : line;
  const idx = cleaned.indexOf("=");
  if (idx === -1) {
    continue;
  }
  const key = cleaned.slice(0, idx).trim();
  let value = cleaned.slice(idx + 1).trim();
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

const env = { ...process.env };
const cwdBin = resolve(process.cwd(), "node_modules", ".bin");
const initCwd = env.INIT_CWD ? resolve(env.INIT_CWD) : null;
const rootBin = initCwd ? resolve(initCwd, "node_modules", ".bin") : null;
const nodeBin = dirname(process.execPath);
const extraBins = [cwdBin, rootBin, nodeBin].filter(Boolean).join(delimiter);
env.PATH = env.PATH ? `${extraBins}${delimiter}${env.PATH}` : extraBins;

let cmd = command[0];
let cmdArgs = command.slice(1);

// When running via pnpm scripts on Windows, pnpm may not be in PATH.
if (cmd === "pnpm" && process.env.npm_execpath) {
  cmdArgs = [process.env.npm_execpath, ...cmdArgs];
  cmd = process.execPath;
}

const child = spawn(cmd, cmdArgs, {
  stdio: "inherit",
  env
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

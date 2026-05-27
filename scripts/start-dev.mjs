import { spawn } from "node:child_process";

const commands = [
  ["api", "node", ["platform/api-server.mjs"]],
  ["server", "npm", ["--prefix", "server", "start"]],
  ["client", "node", ["scripts/static-server.mjs", "client", "3000"]]
];

for (const [name, command, args] of commands) {
  const child = spawn(command, args, { shell: true, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", chunk => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on("data", chunk => process.stderr.write(`[${name}] ${chunk}`));
  child.on("exit", code => {
    console.log(`[${name}] exited with code ${code}`);
  });
}

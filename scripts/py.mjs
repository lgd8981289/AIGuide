#!/usr/bin/env node
// 用带 Pillow 的 python3 跑指定脚本（水印、图片优化都用它）
//
// 为什么要有这一层：本机可能有多个 python3，系统自带的那个不一定装了 Pillow。
// 这里依次探测，找到能 import PIL 的解释器；都找不到时只警告、不让发布流程失败。
//
// 用法：node scripts/py.mjs scripts/optimize-images.py [--force]
// 自定义解释器：AIGUIDE_PYTHON=/path/to/python3 node scripts/py.mjs <脚本>

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const [target, ...rest] = process.argv.slice(2);
if (!target) {
  console.error("用法：node scripts/py.mjs <要执行的 .py 脚本> [参数…]");
  process.exit(1);
}
const script = path.resolve(__dirname, "..", target);
const home = process.env.HOME || "";

const candidates = [
  process.env.AIGUIDE_PYTHON,
  // WorkBuddy 托管的隔离环境（如已装 Pillow 会优先命中）
  home && path.join(home, ".workbuddy/binaries/python/envs/default/bin/python"),
  // macOS 常见 Python（LTS 框架版、Homebrew）
  "/Library/Frameworks/Python.framework/Versions/3.11/bin/python3",
  "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3",
  "/opt/homebrew/bin/python3",
  "/usr/local/bin/python3",
  "/usr/bin/python3",
  "python3",
].filter(Boolean);

const hasPillow = (python) =>
  spawnSync(python, ["-c", "import PIL"], { stdio: "ignore" }).status === 0;

const python = candidates.find(hasPillow);

if (!python) {
  console.warn(
    "⚠️  没找到带 Pillow 的 python3，已跳过这一步。\n" +
      "   安装后重跑即可：pip3 install Pillow（或指定 AIGUIDE_PYTHON=/path/to/python3）"
  );
  process.exit(0);
}

const result = spawnSync(python, [script, ...rest], { stdio: "inherit" });
process.exit(result.status ?? 1);

#!/usr/bin/env node
// 图片水印的调度器：挑一个装了 Pillow 的 python3，跑 scripts/watermark-images.py
//
// 为什么要有这一层：本机可能有多个 python3（系统自带的不一定装了 Pillow）。
// 这里依次探测，找到能 import PIL 的解释器；都找不到时只警告、不让发布流程失败。
//
// 自定义解释器：AIGUIDE_PYTHON=/path/to/python3 npm run sync:img

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(__dirname, "watermark-images.py");
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

const hasPillow = (python) => {
  const probe = spawnSync(python, ["-c", "import PIL"], { stdio: "ignore" });
  return probe.status === 0;
};

const python = candidates.find(hasPillow);

if (!python) {
  console.warn(
    "⚠️  没找到带 Pillow 的 python3，已跳过图片水印。\n" +
      "   安装后重跑即可：pip3 install Pillow（或指定 AIGUIDE_PYTHON=/path/to/python3）"
  );
  process.exit(0);
}

console.log(`  使用解释器：${python}`);
const result = spawnSync(python, [script], { stdio: "inherit" });
process.exit(result.status ?? 1);

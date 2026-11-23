import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ARTICLES_DIR = fileURLToPath(
  new URL("../content/articles/", import.meta.url)
);
const DEFAULT_ANCHORS_PATH = fileURLToPath(
  new URL("../data/internal-link-anchors.json", import.meta.url)
);

const MAX_LINKS_PER_ARTICLE = 4;
const SKIP_ANCESTORS = new Set([
  "a",
  "blockquote",
  "button",
  "code",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "kbd",
  "pre",
  "samp",
  "script",
  "style",
  "summary",
]);

function loadArticlesMap(articlesDir) {
  const map = new Map();
  if (!fs.existsSync(articlesDir)) return map;
  for (const category of fs.readdirSync(articlesDir)) {
    const catDir = path.join(articlesDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const file of fs.readdirSync(catDir)) {
      if (!file.endsWith(".md")) continue;
      const raw = fs.readFileSync(path.join(catDir, file), "utf8");
      const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
      const qnum = fm.match(/^qnum:\s*"?([QT]\d+)"?\s*$/m)?.[1];
      const titleMatch = fm.match(/^title:\s*(.+)$/m)?.[1];
      const mod = fm.match(/^module:\s*"?([a-z]+)"?\s*$/m)?.[1] ?? "interview";
      if (!qnum || !titleMatch) continue;
      let title = titleMatch.trim();
      try {
        title = JSON.parse(title);
      } catch {
        title = title.replace(/^["']|["']$/g, "");
      }
      const slug = file.slice(0, -3);
      map.set(qnum, {
        qnum,
        category,
        module: mod,
        title,
        url: `/${category}/${slug}/`,
      });
    }
  }
  return map;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchers(anchors, articlesByQnum) {
  return anchors
    .map((entry) => {
      const target = articlesByQnum.get(entry.qnum);
      if (!target) return null;
      const term = entry.term;
      const escaped = escapeRegExp(term);
      const startWord = /^[A-Za-z0-9_@.]/.test(term) ? "(?<![A-Za-z0-9_])" : "";
      const endWord = /[A-Za-z0-9_+]$/.test(term) ? "(?![A-Za-z0-9_])" : "";
      const flags = entry.caseSensitive ? "" : "i";
      return {
        ...entry,
        target,
        regex: new RegExp(`${startWord}${escaped}${endWord}`, flags),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.term.length - a.term.length);
}

function resolveCurrentArticle(file, articlesByQnum) {
  const fm = file?.data?.astro?.frontmatter;
  if (fm?.previewRatio !== undefined) return { skip: true };
  const filePath = String(file?.path ?? file?.history?.[0] ?? "").replace(/\\/g, "/");
  if (filePath.includes("/src/content/course/")) return { skip: true };

  if (fm?.qnum && articlesByQnum.has(fm.qnum)) {
    return { skip: false, article: articlesByQnum.get(fm.qnum) };
  }
  if (fm?.qnum) {
    return {
      skip: false,
      article: {
        qnum: fm.qnum,
        category: fm.category ?? "",
        module: fm.module ?? "",
        url: fm.category ? `/${fm.category}/${fm.qnum.toLowerCase()}/` : "",
      },
    };
  }
  const relMatch = filePath.match(/\/src\/content\/articles\/([a-z0-9-]+)\/([^/]+)\.md$/);
  if (relMatch) {
    const [, category, slug] = relMatch;
    const url = `/${category}/${slug}/`;
    for (const item of articlesByQnum.values()) {
      if (item.url === url) return { skip: false, article: item };
    }
    return { skip: false, article: { qnum: "", category, module: "", url } };
  }
  return { skip: false, article: null };
}

function splitFirstMatch(text, matchers, currentArticle, usedTargets) {
  let best = null;
  for (const matcher of matchers) {
    if (currentArticle) {
      if (matcher.target.qnum === currentArticle.qnum || matcher.target.url === currentArticle.url) {
        continue;
      }
      if (matcher.categories && currentArticle.category && !matcher.categories.includes(currentArticle.category)) {
        continue;
      }
    }
    if (usedTargets.has(matcher.target.url)) continue;

    const match = matcher.regex.exec(text);
    if (!match) continue;
    if (
      !best ||
      match.index < best.index ||
      (match.index === best.index && match[0].length > best.length)
    ) {
      best = {
        index: match.index,
        length: match[0].length,
        matchedText: match[0],
        target: matcher.target,
      };
    }
  }
  return best;
}

/**
 * 构建期正文语境互链插件：在普通 <p> / <li> 正文中为首次出现的清晰概念补齐站内锚文本链接。
 */
export default function rehypeInternalLinks(options = {}) {
  const articlesByQnum =
    options.articlesByQnum ?? loadArticlesMap(options.articlesDir ?? DEFAULT_ARTICLES_DIR);
  const rawAnchors =
    options.anchors ??
    JSON.parse(fs.readFileSync(options.anchorsPath ?? DEFAULT_ANCHORS_PATH, "utf8"));
  const matchers = buildMatchers(rawAnchors, articlesByQnum);
  const maxLinks = options.maxLinks ?? MAX_LINKS_PER_ARTICLE;

  return (tree, file) => {
    const resolved = resolveCurrentArticle(file, articlesByQnum);
    if (resolved.skip) return;
    const currentArticle = resolved.article;

    const usedTargets = new Set();
    let totalLinks = 0;

    function visit(node, inBlock, blockState) {
      if (!node || !Array.isArray(node.children) || totalLinks >= maxLinks) return;

      const nextChildren = [];
      for (const child of node.children) {
        if (totalLinks >= maxLinks) {
          nextChildren.push(child);
          continue;
        }
        if (child.type === "element") {
          if (SKIP_ANCESTORS.has(child.tagName)) {
            nextChildren.push(child);
            continue;
          }
          const entersBlock = child.tagName === "p" || child.tagName === "li";
          const nextState = entersBlock ? { linked: false } : blockState;
          visit(child, inBlock || entersBlock, nextState);
          nextChildren.push(child);
          continue;
        }

        if (child.type === "text" && inBlock && blockState && !blockState.linked && child.value) {
          const hit = splitFirstMatch(child.value, matchers, currentArticle, usedTargets);
          if (hit) {
            const before = child.value.slice(0, hit.index);
            const after = child.value.slice(hit.index + hit.length);
            if (before) nextChildren.push({ type: "text", value: before });
            nextChildren.push({
              type: "element",
              tagName: "a",
              properties: {
                href: hit.target.url,
                className: ["prose-ilink"],
                title: hit.target.title,
              },
              children: [{ type: "text", value: hit.matchedText }],
            });
            if (after) nextChildren.push({ type: "text", value: after });
            usedTargets.add(hit.target.url);
            totalLinks += 1;
            blockState.linked = true;
            continue;
          }
        }
        nextChildren.push(child);
      }
      node.children = nextChildren;
    }

    visit(tree, false, null);
  };
}

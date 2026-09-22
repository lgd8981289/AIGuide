/**
 * rehype-code-tabs
 *
 * 把 Markdown 里连续排列的「#### 语言名 + 代码块」合并成可切换语言的代码块。
 * 写作层保持普通 Markdown 不变，站点渲染时自动生效：
 *
 *   #### TypeScript（LangGraph.js）
 *   ```ts ... ```
 *   #### Python（LangGraph）
 *   ```python ... ```
 *
 * → <div class="code-tabs"> 标签栏（用标题文字当标签名）+ 面板
 *
 * 只有一个「标题 + 代码块」时不合并，保持原样。
 */

const HEADING_DEPTH = 4;
const MIN_TABS = 2;
const HEADING_TAG = `h${HEADING_DEPTH}`;

function textContent(node) {
  if (!node) return "";
  if (node.type === "text") return node.value;
  if (Array.isArray(node.children)) {
    return node.children.map(textContent).join("");
  }
  return "";
}

const isElement = (node, tag) =>
  Boolean(node) && node.type === "element" && node.tagName === tag;

const isBlank = (node) => Boolean(node) && node.type === "text" && !node.value.trim();

function buildTabs(pairs) {
  const buttons = [];
  const panels = [];

  pairs.forEach((pair, i) => {
    const active = i === 0;
    const label = pair.label;

    buttons.push({
      type: "element",
      tagName: "button",
      properties: {
        type: "button",
        role: "tab",
        className: active ? ["code-tab", "is-active"] : ["code-tab"],
        "aria-selected": active ? "true" : "false",
        "data-code-lang": label,
      },
      children: [{ type: "text", value: label }],
    });

    panels.push({
      type: "element",
      tagName: "div",
      properties: {
        role: "tabpanel",
        className: active ? ["code-panel", "is-active"] : ["code-panel"],
        "data-code-lang": label,
        hidden: !active,
      },
      children: [pair.pre],
    });
  });

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["code-tabs"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["code-tabs-bar"], role: "tablist" },
        children: buttons,
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["code-tabs-body"] },
        children: panels,
      },
    ],
  };
}

function transform(parent) {
  const children = parent.children;
  if (!Array.isArray(children)) return;

  const out = [];

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    if (isElement(node, HEADING_TAG)) {
      const pairs = [];
      let j = i;

      // 连续收集「语言标题 + 紧随其后的代码块」，允许配对之间有空白文本节点
      while (true) {
        if (!(j < children.length && isElement(children[j], HEADING_TAG))) break;

        let k = j + 1;
        while (k < children.length && isBlank(children[k])) k++;
        if (!isElement(children[k], "pre")) break;

        pairs.push({
          label: textContent(children[j]).trim(),
          pre: children[k],
        });
        j = k + 1;
        while (j < children.length && isBlank(children[j])) j++;
      }

      if (pairs.length >= MIN_TABS) {
        out.push(buildTabs(pairs));
        i = j - 1; // 跳过已被消费的节点
        continue;
      }
    }

    // 未命中则继续向下递归（列表、引用块里也可能出现）
    transform(node);
    out.push(node);
  }

  parent.children = out;
}

export default function rehypeCodeTabs() {
  return (tree) => {
    transform(tree);
  };
}

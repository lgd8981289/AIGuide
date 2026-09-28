// 为受限正文生成稳定的边界：结构化数据和浏览器解锁使用同一个元素。
// 面试速答保留在外，教程从第一个二级标题起进入受限区。
export default function rehypeReadmoreBoundary() {
  return (tree) => {
    const headingText = (node) => node.type === "text"
      ? node.value
      : (node.children ?? []).map(headingText).join("");
    const isHeading = (node) => node.type === "element" && node.tagName === "h2";
    let boundary = tree.children.findIndex((node) => isHeading(node) && headingText(node).includes("知识点详解"));
    if (boundary < 0) boundary = tree.children.findIndex(isHeading);
    if (boundary < 0) return;
    const content = tree.children.splice(boundary);
    tree.children.push({
      type: "element",
      tagName: "div",
      properties: { className: ["gated-content"] },
      children: content,
    });
  };
}

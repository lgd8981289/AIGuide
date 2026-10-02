export {};
import { navigationContextKey, resolveNavigationReturn } from "../lib/navigation-context.mjs";
// 列表菜单与阅读目录共用控制；桌面偏好与移动抽屉分别管理。
const sidebar = document.querySelector<HTMLElement>("[data-site-sidebar]");
const toggle = document.getElementById("sidebar-open");
if (sidebar && toggle) {
  const root = document.documentElement;
  const mobile = window.matchMedia("(max-width: 960px)");
  const scope = sidebar.dataset.sidebarScope ?? "home";
  const back = sidebar.querySelector<HTMLAnchorElement>("[data-navigation-return]");
  if (back) {
    try {
      const category = back.dataset.returnCategory!;
      const topic = back.dataset.returnTopic!;
      const saved = JSON.parse(sessionStorage.getItem(navigationContextKey(scope, category, topic)) ?? "null");
      const href = resolveNavigationReturn(saved, { category, topic, paths: JSON.parse(back.dataset.returnPaths!), origin: window.location.origin });
      if (href) back.href = href;
    } catch {}
  }
  const branchKey = `aiguide.sidebar.branches.v1:${scope}:${sidebar.dataset.sidebarKind}`;
  const branches = Array.from(sidebar.querySelectorAll<HTMLDetailsElement>("details[data-sidebar-node]"));
  const close = sidebar.querySelector<HTMLButtonElement>("[data-sidebar-close]");
  const content = document.querySelector<HTMLElement>(sidebar.dataset.sidebarKind === "browse" ? ".browse-content" : ".shell > main");
  const background = [content, document.querySelector("footer"), ...document.querySelectorAll(".topbar .brand, .topbar .modules, .topbar .tools")]
    .filter((element): element is HTMLElement => element instanceof HTMLElement);
  const originalInert = new Map(background.map((element) => [element, element.inert]));
  let desktopCollapsed = root.dataset.sidebarCollapsed === "true";
  let drawerOpen = false;
  let scroll = 0;
  let positionedCurrent = false;
  const positionCurrent = () => {
    const current = sidebar.querySelector<HTMLElement>('[aria-current="page"], .browse-category[aria-current="true"], .browse-topic[aria-current="true"]');
    if (!current || sidebar.inert) return;
    const box = current.getBoundingClientRect(); const bounds = sidebar.getBoundingClientRect();
    if (box.bottom > bounds.bottom || box.top < bounds.top) sidebar.scrollTop += box.top - bounds.top - 64;
    scroll = sidebar.scrollTop;
    positionedCurrent = true;
  };

  const saveBranches = () => {
    try { sessionStorage.setItem(branchKey, JSON.stringify(branches.filter((node) => node.open).map((node) => node.dataset.sidebarNode))); } catch {}
  };
  const revealCurrent = () => {
    for (const node of branches) {
      if (node.dataset.sidebarCurrent === "true" || node.querySelector('[aria-current="page"], [data-sidebar-current="true"]')) node.open = true;
    }
  };
  try {
    const saved = JSON.parse(sessionStorage.getItem(branchKey) ?? "null");
    if (Array.isArray(saved)) branches.forEach((node) => { node.open = saved.includes(node.dataset.sidebarNode); });
  } catch {}
  revealCurrent();
  branches.forEach((node) => node.addEventListener("toggle", (event) => { if (event.target === node) saveBranches(); }));
  sidebar.addEventListener("sidebar:reveal-current", () => { revealCurrent(); saveBranches(); });

  const render = () => {
    const immersive = root.classList.contains("immersive");
    const open = !immersive && (mobile.matches ? drawerOpen : !desktopCollapsed);
    root.dataset.sidebarCollapsed = String(desktopCollapsed);
    root.dataset.sidebarOpen = String(mobile.matches && open);
    root.classList.toggle("sidebar-drawer-open", mobile.matches && open);
    sidebar.inert = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "收起目录" : "展开目录");
    const label = toggle.querySelector("[data-sidebar-label]");
    if (label) label.textContent = open ? "目录" : "展开目录";
    const closeLabel = close?.querySelector(".sidebar-close-label");
    if (closeLabel) closeLabel.textContent = mobile.matches ? "关闭" : "收起";
    background.forEach((element) => { element.inert = (mobile.matches && open) || originalInert.get(element)!; });
    if (mobile.matches && open) { sidebar.setAttribute("role", "dialog"); sidebar.setAttribute("aria-modal", "true"); }
    else { sidebar.removeAttribute("role"); sidebar.removeAttribute("aria-modal"); }
    if (open) requestAnimationFrame(() => { sidebar.scrollTop = scroll; if (!positionedCurrent) positionCurrent(); });
  };
  const setOpen = (open: boolean, restoreFocus = false) => {
    if (sidebar.getClientRects().length) scroll = sidebar.scrollTop;
    if (mobile.matches) drawerOpen = open;
    else {
      desktopCollapsed = !open;
      try { localStorage.setItem("aiguide.sidebar.v1", desktopCollapsed ? "collapsed" : "expanded"); } catch {}
    }
    render();
    if (open && mobile.matches) close?.focus({ preventScroll: true });
    else if (restoreFocus) toggle.focus({ preventScroll: true });
  };
  toggle.addEventListener("click", () => setOpen(mobile.matches ? !drawerOpen : desktopCollapsed, true));
  document.querySelectorAll("[data-sidebar-close]").forEach((button) => button.addEventListener("click", () => setOpen(false, true)));
  sidebar.addEventListener("click", (event) => {
    if (mobile.matches && event.target instanceof Element && event.target.closest("a[href]")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !mobile.matches || !drawerOpen || document.querySelector('dialog[open], .search-overlay.open, .lightbox.open')) return;
    event.preventDefault(); setOpen(false, true);
  });
  sidebar.addEventListener("keydown", (event) => {
    if (event.key !== "Tab" || !mobile.matches || !drawerOpen) return;
    const controls = Array.from(sidebar.querySelectorAll<HTMLElement>("button, summary, a[href]"))
      .filter((element) => element.getClientRects().length > 0 && !element.closest("[inert]"));
    const first = controls[0]; const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  mobile.addEventListener("change", () => { drawerOpen = false; render(); });
  document.addEventListener("immersive:change", () => { drawerOpen = false; render(); });
  root.classList.add("sidebar-enhanced");
  render();

  // 短标题保持一行，键盘聚焦与鼠标悬停均可查看完整问题。
  sidebar.querySelectorAll("[data-navigation-title]").forEach((link) => link.removeAttribute("title"));
  const tooltip = document.createElement("div");
  tooltip.className = "sidebar-title-tooltip";
  tooltip.id = "sidebar-title-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);
  let tooltipTarget: HTMLAnchorElement | null = null;
  const hideTitle = () => {
    tooltipTarget?.removeAttribute("aria-describedby");
    tooltipTarget = null;
    tooltip.hidden = true;
  };
  const showTitle = (link: HTMLAnchorElement) => {
    if (sidebar.inert) return;
    hideTitle();
    tooltipTarget = link;
    tooltip.textContent = link.dataset.navigationTitle!;
    tooltip.hidden = false;
    link.setAttribute("aria-describedby", tooltip.id);
    const box = link.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    const left = box.right + 12 + bounds.width <= window.innerWidth - 12 ? box.right + 12 : Math.max(12, Math.min(box.left, window.innerWidth - bounds.width - 12));
    const top = Math.max(12, Math.min(box.bottom + 4, window.innerHeight - bounds.height - 12));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };
  const titleLink = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLAnchorElement>("a[data-navigation-title]") : null;
  sidebar.addEventListener("focusin", (event) => { const link = titleLink(event.target); if (link) showTitle(link); });
  sidebar.addEventListener("focusout", hideTitle);
  sidebar.addEventListener("pointerover", (event) => {
    const link = titleLink(event.target);
    if (event.pointerType !== "touch" && link && !(event.relatedTarget instanceof Node && link.contains(event.relatedTarget))) showTitle(link);
  });
  sidebar.addEventListener("pointerout", (event) => {
    if (tooltipTarget && !(event.relatedTarget instanceof Node && tooltipTarget.contains(event.relatedTarget))) hideTitle();
  });
  sidebar.addEventListener("scroll", hideTitle, { passive: true });
  toggle.addEventListener("click", hideTitle);
  document.querySelectorAll("[data-sidebar-close]").forEach((button) => button.addEventListener("click", hideTitle));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") hideTitle(); });
  window.addEventListener("scroll", hideTitle, { passive: true });
  window.addEventListener("resize", hideTitle);
}

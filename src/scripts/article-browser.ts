// 静态列表的渐进增强：分类、排序、分页及可分享的 URL 状态。
const browser = document.querySelector<HTMLElement>("[data-article-browser]");

if (browser) {
  const pageSize = 10;
  const list = browser.querySelector<HTMLUListElement>("[data-browser-posts]")!;
  const rows = Array.from(list.querySelectorAll<HTMLLIElement>("[data-article-category]"));
  const categoryLinks = Array.from(browser.querySelectorAll<HTMLAnchorElement>(".browse-category"));
  const categories = new Map(categoryLinks.map((link) => [link.dataset.filterCategory!, link]));
  const heading = browser.querySelector<HTMLHeadingElement>("#browse-title")!;
  const intro = browser.querySelector<HTMLElement>("[data-browser-intro]")!;
  const count = browser.querySelector<HTMLElement>("[data-result-count]")!;
  const sort = browser.querySelector<HTMLSelectElement>("[data-browser-sort]")!;
  const empty = browser.querySelector<HTMLElement>("[data-browser-empty]")!;
  const pagination = browser.querySelector<HTMLElement>("[data-browser-pagination]")!;
  const pageStatus = browser.querySelector<HTMLElement>("[data-page-status]")!;
  const previous = browser.querySelector<HTMLButtonElement>("[data-page-prev]")!;
  const next = browser.querySelector<HTMLButtonElement>("[data-page-next]")!;
  const filters = browser.querySelector<HTMLDetailsElement>(".browse-filters")!;
  const selectedCategory = browser.querySelector<HTMLElement>("[data-selected-category]")!;
  const desktop = window.matchMedia("(min-width: 961px)");
  const defaultCategory = browser.dataset.defaultCategory ?? "";
  const defaultPath = browser.dataset.defaultPath!;
  const scopePath = browser.dataset.scopePath!;

  function readState() {
    const params = new URLSearchParams(window.location.search);
    const fallback = window.location.pathname === defaultPath ? defaultCategory : "";
    const requestedCategory = params.get("category") ?? fallback;
    const requestedPage = Number(params.get("page") ?? 1);
    return {
      category: categories.has(requestedCategory) ? requestedCategory : fallback,
      sort: params.get("sort") === "series" ? "series" : "latest",
      page: Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    };
  }
  let state = readState();

  function writeURL(mode: "push" | "replace") {
    const target = new URL(window.location.href);
    // 旧分类地址仍然有效；切换到其他分类后，使用栏目的筛选地址。
    const keepCategoryPath = defaultCategory && state.category === defaultCategory && target.pathname === defaultPath;
    target.pathname = keepCategoryPath ? defaultPath : scopePath;
    if (state.category && !keepCategoryPath) target.searchParams.set("category", state.category);
    else target.searchParams.delete("category");
    if (state.sort !== "latest") target.searchParams.set("sort", state.sort);
    else target.searchParams.delete("sort");
    if (state.page > 1) target.searchParams.set("page", String(state.page));
    else target.searchParams.delete("page");
    target.hash = "";
    if (target.href !== window.location.href) {
      if (mode === "push") window.history.pushState(null, "", target);
      else window.history.replaceState(window.history.state, "", target);
    }
  }

  function render() {
    const selected = categories.get(state.category)!;
    heading.textContent = state.category ? selected.dataset.categoryTitle! : browser!.dataset.title!;
    intro.textContent = state.category ? selected.dataset.categoryIntro! : browser!.dataset.intro!;
    selectedCategory.textContent = state.category ? selected.dataset.categoryLabel! : "全部文章";
    categoryLinks.forEach((link) => {
      if (link.dataset.filterCategory === state.category) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    sort.value = state.sort;
    const ordered = [...rows].sort((a, b) => state.sort === "series"
      ? Number(a.dataset.seriesOrder) - Number(b.dataset.seriesOrder)
      : Number(a.dataset.latestOrder) - Number(b.dataset.latestOrder));
    const matching = ordered.filter((row) => !state.category || row.dataset.articleCategory === state.category);
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    state.page = Math.min(state.page, pages);
    const visible = new Set(matching.slice((state.page - 1) * pageSize, state.page * pageSize));
    const fragment = document.createDocumentFragment();
    ordered.forEach((row) => { row.hidden = !visible.has(row); fragment.append(row); });
    list.append(fragment);
    count.textContent = `共 ${matching.length} 篇文章${pages > 1 ? ` · 第 ${state.page} / ${pages} 页` : ""}`;
    empty.hidden = matching.length > 0;
    pagination.hidden = pages <= 1;
    pageStatus.textContent = `第 ${state.page} / ${pages} 页`;
    previous.disabled = state.page === 1;
    next.disabled = state.page === pages;
  }

  function showStart() {
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: "start" });
  }
  browser.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-filter-category]") : null;
    // 保留新标签页、复制链接与无 JavaScript 时的原生导航。
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const category = link.dataset.filterCategory!;
    if (!categories.has(category)) return;
    event.preventDefault();
    state.category = category;
    state.page = 1;
    render(); writeURL("push");
    if (!desktop.matches) filters.open = false;
    showStart();
  });
  sort.addEventListener("change", () => {
    state.sort = sort.value; state.page = 1;
    render(); writeURL("push");
  });
  previous.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    render(); writeURL("push"); showStart();
  });
  next.addEventListener("click", () => {
    state.page += 1;
    render(); writeURL("push"); showStart();
  });
  window.addEventListener("popstate", () => { state = readState(); render(); });
  const setFilterLayout = () => { filters.open = desktop.matches; };
  setFilterLayout();
  desktop.addEventListener("change", setFilterLayout);
  browser.querySelectorAll<HTMLElement>("[data-browser-enhanced]").forEach((element) => { element.hidden = false; });
  render();
  // 清理无效页码 / 分类，避免刷新后的地址和显示内容不一致。
  const params = new URLSearchParams(window.location.search);
  if (params.has("category") || params.has("page")) writeURL("replace");
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) { state = readState(); render(); }
  });
}

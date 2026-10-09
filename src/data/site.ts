// 站点全局配置：改名、换 slogan、加模块、开引流，都只改这一个文件
import { BASE, url } from '../utils'
import { COURSE } from './course'
import { BRAND } from '../lib/brand.mjs'

export const SITE = {
	name: BRAND.name,
	alternateNames: BRAND.aliases,
	// 首页明确站点身份；各内页由 BaseLayout 统一追加一次品牌后缀。
	homeTitle: 'Sunday面试指南｜AI、前端、后端与校招面试题',
	homeHeading: 'Sunday面试指南：AI 与全栈面试题',
	homeIntro:
		'程序员Sunday 整理的面试备考指南，覆盖 AI、前端、后端与校招，从原理讲到项目取舍和面试追问。',
	description:
		'Sunday面试指南由程序员Sunday维护，提供大模型、Agent、RAG、前端、后端、数据库与校招面试题解析，配合学习路线和 AI 编程教程，帮助你理解原理、准备项目与面试追问。',
	author: BRAND.author,
	logo: '/avatar.jpg',
	url: BRAND.url,
	github: BRAND.github,
	mainSite: 'https://lgdsunday.club/',
	mainSiteName: '简历汪'
}

// ---------------------------------------------------------------------------
// 模块（顶部导航的一级入口）
// ---------------------------------------------------------------------------

export type ModuleKey = 'interview' | 'programmer' | 'tutorial' | 'course'

export interface ModuleMeta {
	key: ModuleKey
	/** 顶部导航显示名 */
	name: string
	/** 模块落地页 */
	href: string
	/** 页面标题 */
	title: string
	/** 页面 meta description（较长，给搜索引擎） */
	description: string
	/** 页面顶部的一句话说明（列表页只留一句，别做成介绍页） */
	shortIntro: string
	/** 计数单位（道题 / 篇文章） */
	countUnit: string
	/** 上下篇文案 */
	prevLabel: string
	nextLabel: string
}

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
	course: {
		key: 'course',
		name: COURSE.navTitle,
		href: COURSE.href,
		title: COURSE.title,
		description: COURSE.seoDescription,
		shortIntro: '从大模型基础到多 Agent 项目实战。',
		countUnit: '节课程',
		prevLabel: '上一节',
		nextLabel: '下一节'
	},
	interview: {
		key: 'interview',
		name: 'AI 面试题',
		href: '/ai/',
		// 2026-10-07 重写：这页本来就 SSR 出全部 93 篇 AI 面试题（标题 + 摘要都在静态 HTML 里），
		// 是全站天然的「汇总入口」。而多引擎下拉词显示，「大模型面试题」后面跟 大全 / 题库 /
		// 八股文 / 合集 / 汇总 这类**形态词**的搜索需求非常明确（参见 docs/seo-keyword-gap-2026-10-07.md），
		// 但站内 379 篇全是单点问答，形态词覆盖为 0。故 title 改为命中形态词的版本。
		// 注意：h1 与顶部导航用的是 name（保持短标签），这里只影响 <title> / og:title。
		title: '大模型面试题大全：Agent、RAG 高频题与答案',
		description:
			'大模型面试题大全：覆盖大模型基础、Agent、RAG、LangChain、AI 应用工程与系统设计六大系列，每题给出能落地、经得起追问的答案。',
		shortIntro:
			'六个系列，按分类刷题：每道题都从真实工程场景出发，给出能落地、经得起追问的回答。',
		countUnit: '道题',
		prevLabel: '上一题',
		nextLabel: '下一题'
	},
	// 更名为「全栈面试题」；内部 key 和路径保留，导航顺序不变。
	programmer: {
		key: 'programmer',
		name: '全栈面试题',
		href: '/programmer/',
		title: '全栈面试题及答案：前端、后端、数据库与系统设计',
		description:
			'围绕前端、后端、MySQL、Redis、计算机网络、操作系统与并发等全栈开发知识，讲清面试题的原理、适用条件和常见追问。',
		shortIntro:
			'前端、后端、数据库与缓存、计算机基础、系统设计，按五个分类准备全栈面试。',
		countUnit: '道题',
		prevLabel: '上一题',
		nextLabel: '下一题'
	},
	tutorial: {
		key: 'tutorial',
		name: 'AI 编程教程',
		href: '/tutorial/',
		title: 'AI 编程教程：工具配置、MCP 扩展与工程实践',
		description:
			'0 基础也能上手的 AI 编程与 AI 工具教程：工具安装配置、Agent 能力扩展、工程方法与实践、模型实测，每篇讲清一个完整主题。',
		shortIntro:
			'四类教程，0 基础也能跟着做：从工具安装配置到实际使用与效果判断，每篇讲清一个完整主题。',
		countUnit: '篇文章',
		prevLabel: '上一篇',
		nextLabel: '下一篇'
	}
}

/** 顶部模块导航（顺序即展示顺序；新方向上线时补一行 + 建一个落地页） */
export const MODULES: {
	key: ModuleKey | 'home'
	name: string
	href: string
}[] = [
	{ key: 'home', name: '首页', href: '/' },
	{
		key: 'interview',
		name: MODULE_META.interview.name,
		href: MODULE_META.interview.href
	},
	{
		key: 'programmer',
		name: MODULE_META.programmer.name,
		href: MODULE_META.programmer.href
	},
	{
		key: 'tutorial',
		name: MODULE_META.tutorial.name,
		href: MODULE_META.tutorial.href
	},
	{
		key: 'course',
		name: MODULE_META.course.name,
		href: MODULE_META.course.href
	}
	// { key: 'frontend' as ModuleKey, name: '前端面试题', href: '/frontend/' },
	// { key: 'java' as ModuleKey, name: 'Java 面试题', href: '/java/' }
]

// ---------------------------------------------------------------------------
// 分类（slug 必须与 scripts/sources.json 里的分类映射保持一致）
// ---------------------------------------------------------------------------

export interface Category {
	slug: string
	name: string
	nav: string // 导航栏短名
	/**
	 * 分类页的 <title>（SEO 用）。缺省时回退到 name。
	 * 与模块页同理：h1 / 侧边栏 / 面包屑仍用 name 这个短标签，只有 <title> 取这里，
	 * 因为「及答案 / 大全 / 合集」这类形态词才是真实搜索需求（见 docs/seo-keyword-gap-2026-10-07.md），
	 * 而 name 是导航标签，不含这些词。
	 * 约束：必须全站唯一（scripts/check-seo.py 会校验），且控制在 ~30 个全角字内。
	 */
	seoTitle?: string
	intro: string
	module: ModuleKey
}

export const CATEGORIES: Category[] = [
	// —— AI 面试题 ——
	{
		slug: 'llm',
		name: '大模型基础面试题',
		nav: '大模型基础',
		seoTitle: '大模型基础面试题及答案：高频考点解析',
		module: 'interview',
		intro:
			'大模型面试题合集：Transformer、Attention、训练与对齐、微调与推理优化。面试官往底层追问时的终点站，也是所有上层应用题的地基。'
	},
	{
		slug: 'rag',
		name: 'RAG面试题',
		nav: 'RAG',
		seoTitle: 'RAG 面试题及答案：检索增强高频考点解析',
		module: 'interview',
		intro:
			'RAG 面试题合集：从文档切割、Embedding、向量检索到多路召回、Query 改写与幻觉治理，检索增强全链路的高频考点。'
	},
	{
		slug: 'agent',
		name: 'Agent面试题',
		nav: 'Agent',
		seoTitle: 'Agent 面试题及答案：高频考点与解析',
		module: 'interview',
		intro:
			'AI Agent 面试题合集：控制权边界、运行循环、任务拆分、记忆机制与 Multi-Agent 协作，讲清执行路径的决策权。'
	},
	{
		slug: 'engineering',
		name: 'AI应用工程面试题',
		nav: 'AI应用工程',
		seoTitle: 'AI 应用工程面试题及答案：高频考点',
		module: 'interview',
		intro:
			'真实上线才会遇到的问题：效果评测、延迟与成本、稳定性、安全边界。区分「做过 demo」和「上过生产」的分水岭。'
	},
	{
		slug: 'system-design',
		name: 'AI项目与系统设计面试题',
		nav: '系统设计',
		seoTitle: 'AI 项目与系统设计面试题及答案',
		module: 'interview',
		intro:
			'从单点答题到整套系统设计：需求拆解、架构选型、技术权衡与迭代演进，检验工程完整度的地方。'
	},
	{
		slug: 'langchain',
		name: 'LangChain生态面试题',
		nav: 'LangChain',
		seoTitle: 'LangChain 面试题及答案：高频考点',
		module: 'interview',
		intro:
			'LangChain、LangGraph 等框架的内部机制、适用边界与选型逻辑。用框架，但不被框架用。'
	},

	// —— 全栈面试题：按主要考点归入唯一分类 ——
	{
		slug: 'frontend',
		name: '前端面试题',
		nav: '前端',
		seoTitle: '前端面试题及答案：高频考点与解析',
		module: 'programmer',
		intro:
			'JavaScript、TypeScript、浏览器、React、Vue、页面性能与前端工程化，关注客户端如何工作。'
	},
	{
		slug: 'backend',
		name: '后端面试题',
		nav: '后端',
		seoTitle: '后端面试题及答案：高频考点与解析',
		module: 'programmer',
		intro:
			'接口、鉴权、服务端框架、消息队列、异步任务与服务治理，关注服务端功能如何实现。'
	},
	{
		slug: 'database',
		name: '数据库与缓存面试题',
		nav: '数据库与缓存',
		seoTitle: '数据库与缓存面试题及答案',
		module: 'programmer',
		intro:
			'MySQL、Redis、索引、事务、锁、缓存一致性与持久化，关注数据如何存取和保持正确。'
	},
	{
		slug: 'cs-basics',
		name: '计算机基础面试题',
		nav: '计算机基础',
		seoTitle: '计算机基础面试题及答案',
		module: 'programmer',
		intro:
			'网络协议、操作系统、进程线程、内存、数据结构与算法，关注不依赖具体框架的基础机制。'
	},
	{
		slug: 'fullstack-system-design',
		name: '系统设计面试题',
		nav: '系统设计',
		seoTitle: '系统设计面试题及答案：高频考点',
		module: 'programmer',
		intro:
			'短链接、秒杀、文件上传等完整系统的需求、模块协作、容量、容错与取舍，不重复单个组件的原理题。'
	},

	// —— AI 编程教程（源：Desktop/一起来玩 AI 呀～/文章）——
	{
		slug: 'tools',
		name: 'AI编程工具与平台',
		nav: '工具与平台',
		seoTitle: 'AI 编程工具教程：安装、配置与使用',
		module: 'tutorial',
		intro: '完整工具、客户端和平台的安装、配置与使用。'
	},
	{
		slug: 'agent-ext',
		name: 'Agent能力扩展',
		nav: '能力扩展',
		seoTitle: 'MCP 与 Agent 能力扩展教程',
		module: 'tutorial',
		intro:
			'MCP、Skill、Hook、连接器、记忆、Subagent 等用于扩展 Agent 能力的主题。'
	},
	{
		slug: 'practice',
		name: 'AI编程方法与工程实践',
		nav: '方法与实践',
		seoTitle: 'AI 编程方法与工程实践教程',
		module: 'tutorial',
		intro: '任务拆解、上下文、测试、审查、重构与多 Agent 协作等工程方法。'
	},
	{
		slug: 'reviews',
		name: '模型与热点实测',
		nav: '模型实测',
		seoTitle: '大模型实测与选型：新模型能力评测',
		module: 'tutorial',
		intro: '新模型、新能力及热门技术事件的实际体验与价值判断。'
	}
]

/** 取某个模块下的分类 */
export function categoriesOf(module: ModuleKey): Category[] {
	return CATEGORIES.filter((c) => c.module === module)
}

/**
 * 根据路径判断属于哪个模块（顶部导航高亮、侧边栏分组都用它）
 * 接受站内路径；如以后设置了 base，也会先剥离部署前缀。
 */
export function moduleOfPath(pathname: string): ModuleKey | 'home' {
	const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
	if (rel === '/' || rel === '') return 'home'

	const seg = rel.split('/').filter(Boolean)[0] ?? ''
	const category = CATEGORIES.find((c) => c.slug === seg)
	if (category) return category.module

	const hit = MODULES.find(
		(m) => m.key !== 'home' && url(m.href).startsWith(`${BASE}/${seg}/`)
	)
	return hit && hit.key !== 'home' ? hit.key : 'home'
}

// ---------------------------------------------------------------------------
// 搜索引擎站点验证（留空则不输出对应的 meta）
// 百度：ziyuan.baidu.com → 用户中心 → 站点管理 → 添加站点 → HTML 标签验证，
//       页面会给出 <meta name="baidu-site-verification" content="codeva-xxxx" />，把 codeva-xxxx 填到下面。
//       注意 token 按域名发放，note 站必须单独验证、单独拿 token。
// Google：search.google.com/search-console → 添加资源 → HTML 标记，填 content 值。
// ---------------------------------------------------------------------------
export const SITE_VERIFICATION = {
	baidu: '',
	google: ''
}

// ---------------------------------------------------------------------------
// 其他开关
// ---------------------------------------------------------------------------

// 文章复制防护（软防护：拦截正文的复制 / 右键 / 拖图，触发时弹提示条）
// 默认关闭——读者可自由复制引用；需要防搬运时改成 true 即可（代码复制按钮不受影响）
export const COPY_GUARD = {
	enabled: false
}

// 页脚「关注公众号」引导开关（控制页脚的「程序员Sunday」按钮与二维码弹窗）
// 2026-10-07：暂时关闭——现阶段优先把搜索流量做起来，不引导关注。
// 改回 true 即恢复页脚按钮与二维码弹窗；页脚署名不受影响（关闭时显示为纯文本）。
export const FOLLOW = {
	enabled: false
}

// TechGrow 公众号引流配置（https://docs.techgrow.cn）
// 开启步骤：
//   1. 到 https://open.techgrow.cn 注册博客，拿到 blogId
//   2. 微信公众号后台配置「关键词自动回复」，回复内容为验证码链接（格式见 TechGrow 官方文档第二步）
//   3. 补齐下方 name / keyword / qrcode，把 enabled 改为 true，重新构建部署
// 未开启时，本站不加载任何引流脚本，文章全文直接可见
//
// 2026-10-07：暂时全量开放。原因是站点上线 4 个月、零外链、搜索几乎无收录，
// 当前瓶颈是「内容可达性」而非「涨粉」。先让搜索引擎和读者无障碍拿到全文做流量，
// 门禁留作以后有基础时的可选项——改 enabled 为 true 即可完整恢复（分层抽样逻辑仍在）。
export const TECHGROW = {
	enabled: true, // 暂时关闭公众号解锁；true 时按下方 random 分层抽样恢复门禁
	blogId: '77647-4526721610548-557',
	name: '程序员Sunday', // 微信公众号名称
	keyword: '验证码', // 读者在公众号里回复的关键词
	qrcode: 'https://ww-zhi-dao.oss-cn-beijing.aliyuncs.com/gongzhonghao.jpg', // 公众号二维码图片地址
	type: 'website',
	expires: '30', // 验证码解锁后有效天数
	random: '1.0', // 恢复门禁时的解锁文章比例：0=全站开放，0.3=30% 文章门禁（enabled=false 时该项无效）
	allowMobile: false // 当前移动端也启用解锁；false 时移动端直接显示全文
}

/** 稳定哈希：同一输入在每次构建中得到相同结果（用于确定性抽样） */
export function stableHash(s: string): number {
	let h = 0
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
	return h
}

/**
 * 在「同一分类」的文章里确定性地挑出需要公众号解锁的那一批。
 *
 * 两点设计：
 * 1. 必须构建时确定 —— TechGrow 自带的 random 是**浏览器端随机**的，而结构化数据的
 *    isAccessibleForFree 必须构建时写死。直接用它会出现「实际只锁 30%，却对搜索引擎
 *    声明 100% 非免费」的错误信号。
 * 2. 按分类分层抽样 —— 全站一起抽时小分类方差极大（实测出现过某分类 100% 被锁、
 *    另一分类仅 11%）。分层后每个分类的开放比例都稳定在 TECHGROW.random 附近，
 *    不会出现「某个栏目对搜索引擎整体消失」。
 *
 * @param siblingIds 同一分类下全部文章的 id
 * @returns 命中门禁的文章 id 集合
 */
export function selectGatedArticles(siblingIds: string[]): Set<string> {
	const ratio = Number(TECHGROW.random)
	if (!TECHGROW.enabled || !(ratio > 0) || siblingIds.length === 0)
		return new Set()
	if (ratio >= 1) return new Set(siblingIds)
	const count = Math.round(siblingIds.length * ratio)
	return new Set(
		[...siblingIds]
			.sort((a, b) => stableHash(a) - stableHash(b))
			.slice(0, count)
	)
}

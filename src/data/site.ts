// 站点全局配置：改名、换 slogan、加模块、开引流，都只改这一个文件
import { BASE, url } from '../utils'

export const SITE = {
	name: 'Sunday 的面试指南',
	tagline: 'AI 面试题与 AI 编程教程',
	description:
		'覆盖 Agent、RAG、LangChain、大模型基础的 AI 工程面试题库，以及 0 基础也能上手的 AI 编程教程。每篇都还原真实使用与工程决策，读完能直接上手、也能经得起追问。',
	author: '程序员 Sunday',
	// 站点 logo（public 目录下的相对路径，留空则不显示）
	logo: '/avatar.jpg',
	url: 'https://lgdsunday.club',
	// 右上角 GitHub 图标（留空则不显示）
	github: 'https://github.com/lgd8981289/AIGuide',
	// 主站入口（简历汪），站内互链形成求职闭环
	mainSite: 'https://lgdsunday.club/',
	mainSiteName: '简历汪'
}

// ---------------------------------------------------------------------------
// 模块（顶部导航的一级入口）
// ---------------------------------------------------------------------------

export type ModuleKey = 'interview' | 'tutorial'

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
	interview: {
		key: 'interview',
		name: 'AI 面试题',
		href: '/ai/',
		title: 'AI 面试题',
		description:
			'按六个系列系统刷题。每道题都从一个真实工程场景出发，先还原面试官的追问链路，再给出能落地、经得起追问的回答。',
		shortIntro:
			'六个系列，按分类刷题：每道题都从真实工程场景出发，给出能落地、经得起追问的回答。',
		countUnit: '道题',
		prevLabel: '上一题',
		nextLabel: '下一题'
	},
	tutorial: {
		key: 'tutorial',
		name: 'AI 编程教程',
		href: '/tutorial/',
		title: 'AI 编程教程',
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
export const MODULES: { key: ModuleKey | 'home'; name: string; href: string }[] = [
	{ key: 'home', name: '首页', href: '/' },
	{ key: 'interview', name: MODULE_META.interview.name, href: MODULE_META.interview.href },
	{ key: 'tutorial', name: MODULE_META.tutorial.name, href: MODULE_META.tutorial.href }
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
	intro: string
	module: ModuleKey
}

export const CATEGORIES: Category[] = [
	// —— AI 面试题 ——
	{
		slug: 'llm',
		name: '大模型基础面试题',
		nav: '大模型基础',
		module: 'interview',
		intro:
			'Transformer、Attention、训练与对齐、微调与推理优化。面试官往底层追问时的终点站，也是所有上层应用题的地基。'
	},
	{
		slug: 'rag',
		name: 'RAG面试题',
		nav: 'RAG',
		module: 'interview',
		intro:
			'从文档切割、Embedding、向量检索到多路召回、Query 改写与幻觉治理，检索增强全链路的高频考点。'
	},
	{
		slug: 'agent',
		name: 'Agent面试题',
		nav: 'Agent',
		module: 'interview',
		intro:
			'Agent 与 Workflow 的控制权边界、运行循环、任务拆分、记忆机制与 Multi-Agent 协作，把执行路径的决策权讲清楚。'
	},
	{
		slug: 'engineering',
		name: 'AI应用工程面试题',
		nav: 'AI应用工程',
		module: 'interview',
		intro:
			'真实上线才会遇到的问题：效果评测、延迟与成本、稳定性、安全边界。区分「做过 demo」和「上过生产」的分水岭。'
	},
	{
		slug: 'system-design',
		name: 'AI项目与系统设计面试题',
		nav: '系统设计',
		module: 'interview',
		intro:
			'从单点答题到整套系统设计：需求拆解、架构选型、技术权衡与迭代演进，检验工程完整度的地方。'
	},
	{
		slug: 'langchain',
		name: 'LangChain生态面试题',
		nav: 'LangChain',
		module: 'interview',
		intro:
			'LangChain、LangGraph 等框架的内部机制、适用边界与选型逻辑。用框架，但不被框架用。'
	},

	// —— AI 编程教程（源：Desktop/一起来玩 AI 呀～/文章）——
	{
		slug: 'tools',
		name: 'AI编程工具与平台',
		nav: '工具与平台',
		module: 'tutorial',
		intro: '完整工具、客户端和平台的安装、配置与使用。'
	},
	{
		slug: 'agent-ext',
		name: 'Agent能力扩展',
		nav: '能力扩展',
		module: 'tutorial',
		intro: 'MCP、Skill、Hook、连接器、记忆、Subagent 等用于扩展 Agent 能力的主题。'
	},
	{
		slug: 'practice',
		name: 'AI编程方法与工程实践',
		nav: '方法与实践',
		module: 'tutorial',
		intro: '任务拆解、上下文、测试、审查、重构与多 Agent 协作等工程方法。'
	},
	{
		slug: 'reviews',
		name: '模型与热点实测',
		nav: '模型实测',
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
 * 传站内路径（"/agent/q001-x/"）或带 base 的完整路径（"/note/agent/q001-x/"）都可以。
 */
export function moduleOfPath(pathname: string): ModuleKey | 'home' {
	const rel = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname
	if (rel === '/' || rel === '') return 'home'

	const seg = rel.split('/').filter(Boolean)[0] ?? ''
	const category = CATEGORIES.find((c) => c.slug === seg)
	if (category) return category.module

	const hit = MODULES.find((m) => m.key !== 'home' && url(m.href).startsWith(`${BASE}/${seg}/`))
	return hit && hit.key !== 'home' ? hit.key : 'home'
}

// ---------------------------------------------------------------------------
// 其他开关
// ---------------------------------------------------------------------------

// 文章复制防护（软防护：拦截正文的复制 / 右键 / 拖图，触发时弹提示条）
// 默认关闭——读者可自由复制引用；需要防搬运时改成 true 即可（代码复制按钮不受影响）
export const COPY_GUARD = {
	enabled: false
}

// TechGrow 公众号引流配置（https://docs.techgrow.cn）
// 开启步骤：
//   1. 到 https://open.techgrow.cn 注册博客，拿到 blogId
//   2. 微信公众号后台配置「关键词自动回复」，回复内容为验证码链接（格式见 TechGrow 官方文档第二步）
//   3. 补齐下方 name / keyword / qrcode，把 enabled 改为 true，重新构建部署
// 未开启时，本站不加载任何引流脚本，文章全文直接可见
export const TECHGROW = {
	enabled: true,
	blogId: '77647-4526721610548-557',
	name: '程序员Sunday', // 微信公众号名称
	keyword: '验证码', // 读者在公众号里回复的关键词
	qrcode: 'https://ww-zhi-dao.oss-cn-beijing.aliyuncs.com/gongzhonghao.jpg', // 公众号二维码图片地址
	type: 'website',
	expires: '30', // 验证码解锁后有效天数
	random: '1.0', // 引流功能生效的文章比例
	allowMobile: true // 移动端默认关闭引流，保护移动搜索体验
}

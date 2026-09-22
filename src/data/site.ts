// 站点全局配置：改名、换 slogan、开引流，都只改这一个文件

export const SITE = {
	name: 'Sunday 的面试指南',
	tagline: 'AI 工程面试题，一题一系统',
	description:
		'覆盖 Agent、RAG、LangChain、大模型基础的 AI 工程面试题库。每道题都还原成真实工程决策，再压缩成面试现场能说清楚的回答。',
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

// 顶部模块导航：站点级方向入口
// 当前只有「AI 面试题」一个模块，新方向上线后在下方补一行并解除注释即可
// （例如未来新增：前端面试题 / Java 面试题 / 各大公司真实面经）
export const MODULES = [
	{ name: '首页', href: '/', active: false },
	{ name: 'AI 面试题', href: '/ai/', active: true }
	// { name: "前端面试题", href: "/frontend/", active: false },
	// { name: "Java 面试题", href: "/java/", active: false },
	// { name: "真实面经", href: "/mianjing/", active: false },
]

// 六大分类：slug 必须与 scripts/sync-content.mjs 里的 CATEGORIES 映射保持一致
export interface Category {
	slug: string
	name: string
	nav: string // 导航栏短名
	intro: string
}

export const CATEGORIES: Category[] = [
	{
		slug: 'llm',
		name: '大模型基础面试题',
		nav: '大模型基础',
		intro:
			'Transformer、Attention、训练与对齐、微调与推理优化。面试官往底层追问时的终点站，也是所有上层应用题的地基。'
	},
	{
		slug: 'rag',
		name: 'RAG面试题',
		nav: 'RAG',
		intro:
			'从文档切割、Embedding、向量检索到多路召回、Query 改写与幻觉治理，检索增强全链路的高频考点。'
	},
	{
		slug: 'agent',
		name: 'Agent面试题',
		nav: 'Agent',
		intro:
			'Agent 与 Workflow 的控制权边界、运行循环、任务拆分、记忆机制与 Multi-Agent 协作，把执行路径的决策权讲清楚。'
	},
	{
		slug: 'engineering',
		name: 'AI应用工程面试题',
		nav: 'AI应用工程',
		intro:
			'真实上线才会遇到的问题：效果评测、延迟与成本、稳定性、安全边界。区分「做过 demo」和「上过生产」的分水岭。'
	},
	{
		slug: 'system-design',
		name: 'AI项目与系统设计面试题',
		nav: '系统设计',
		intro:
			'从单点答题到整套系统设计：需求拆解、架构选型、技术权衡与迭代演进，检验工程完整度的地方。'
	},
	{
		slug: 'langchain',
		name: 'LangChain生态面试题',
		nav: 'LangChain',
		intro:
			'LangChain、LangGraph 等框架的内部机制、适用边界与选型逻辑。用框架，但不被框架用。'
	}
]

// TechGrow 公众号引流配置（https://docs.techgrow.cn）
// 开启步骤：
//   1. 到 https://open.techgrow.cn 注册博客，拿到 blogId
//   2. 微信公众号后台配置「关键词自动回复」，回复内容为验证码链接（格式见 TechGrow 官方文档第二步）
//   3. 补齐下方 name / keyword / qrcode，把 enabled 改为 true，重新构建部署
// 未开启时，本站不加载任何引流脚本，文章全文直接可见
export const TECHGROW = {
	enabled: false,
	blogId: '',
	name: '程序员Sunday', // 微信公众号名称
	keyword: '验证码', // 读者在公众号里回复的关键词
	qrcode: 'https://ww-zhi-dao.oss-cn-beijing.aliyuncs.com/gongzhonghao.jpg', // 公众号二维码图片地址
	type: 'website',
	expires: '30', // 验证码解锁后有效天数
	random: '1.0', // 引流功能生效的文章比例
	allowMobile: true // 移动端默认关闭引流，保护移动搜索体验
}

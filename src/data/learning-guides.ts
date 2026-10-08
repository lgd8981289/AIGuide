import { getOrderedArticles, type ArticleWithOrder } from './articles'
import type { ModuleKey } from './site'
import { RECRUITMENT_GUIDES } from './recruitment-guides'

interface ReadingItem {
  qnum: string
  reason: string
}

interface ReadingStage {
  id: string
  title: string
  goal: string
  checkpoint: string
  articles: ReadingItem[]
}

export interface LearningGuide {
  slug: string
  label: string
  title: string
  description: string
  cardDescription: string
  action: string
  audience: string
  approach: string
  note?: string
  reviewedAt?: string
  module: ModuleKey
  browseHref: string
  browseLabel: string
  stages: ReadingStage[]
}

// 使用源稿的全局编号选文章，实际标题和地址从文章集合读取。
// 这里只维护阅读顺序与导读，不复制正文，也不改变文章分类。
export const LEARNING_GUIDES: LearningGuide[] = [
  {
    slug: 'ai-interview',
    label: '准备 AI 面试',
    title: 'AI 应用开发面试准备路线',
    description: '用已有面试题准备 AI 应用开发面试：从大模型基础、RAG、Agent 到框架与项目设计，按阅读顺序理解原理、工程取舍和常见追问。',
    cardDescription: '从基础到项目设计，按顺序准备核心考点。',
    action: '查看备考路线',
    audience: '准备 AI 应用开发面试，或希望从前后端开发转向 AI 应用的同学。',
    approach: '先建立基础，再补 RAG 和 Agent。已经熟悉的阶段可以跳过；最后选一个自己能讲清楚的项目，把这些判断串起来。',
    module: 'interview',
    browseHref: '/ai/',
    browseLabel: '查看全部 AI 面试题',
    stages: [
      {
        id: 'foundations', title: '先建立大模型基础',
        goal: '理解上下文、向量和模型能力的边界，后面的方案选择才有依据。',
        checkpoint: '不用背术语，能否解释：为什么上下文足够长，模型仍可能漏掉信息或给出错误答案？',
        articles: [
          { qnum: 'Q020', reason: '先搞清上下文长度和费用到底按什么计算。' },
          { qnum: 'Q010', reason: '理解幻觉的来源，以及降低随机性为什么不够。' },
          { qnum: 'Q011', reason: '认识长上下文的边界，为文档处理选方案。' },
          { qnum: 'Q021', reason: '理解向量表示，为后面的检索与相似度判断打基础。' },
        ],
      },
      {
        id: 'rag', title: '把 RAG 的整条链路讲清楚',
        goal: '从文档切分到召回、重排和评测，知道每一步解决什么问题。',
        checkpoint: '如果知识库里有答案，系统却没有答对，你会先检查哪一步？为什么？',
        articles: [
          { qnum: 'Q017', reason: '从切片开始，理解检索精度与证据完整度的取舍。' },
          { qnum: 'Q023', reason: '看关键词和向量检索怎样配合。' },
          { qnum: 'Q024', reason: '分清召回与重排各自负责的事情。' },
          { qnum: 'Q026', reason: '用评测判断改动是否真的有效。' },
        ],
      },
      {
        id: 'agent', title: '理解 Agent 怎样完成一次任务',
        goal: '讲清决策、执行与状态的关系，再讨论工具和协议。',
        checkpoint: '拿一个查资料的任务，能否画出模型、工具和应用之间的调用顺序？',
        articles: [
          { qnum: 'Q001', reason: '先确定什么时候需要 Agent，什么时候用固定流程。' },
          { qnum: 'Q002', reason: '沿着一次运行看模型决策与应用执行如何配合。' },
          { qnum: 'Q004', reason: '理解模型提出工具调用以后，应用还要做什么。' },
          { qnum: 'Q028', reason: '分清工具超时后的未知结果、重试条件与幂等。' },
          { qnum: 'Q007', reason: '把当前输入、任务状态和长期记忆区分开。' },
          { qnum: 'Q008', reason: '厘清 MCP 与工具调用的关系。' },
        ],
      },
      {
        id: 'frameworks', title: '结合需求选择框架',
        goal: '从需要控制的执行过程出发，理解 LangChain 与 LangGraph 的职责。',
        checkpoint: '任务需要人工确认和中断恢复时，你会如何组织状态与执行过程？',
        articles: [
          { qnum: 'Q063', reason: '把框架选型放回项目需求和维护成本里判断。' },
          { qnum: 'Q015', reason: '用 State、Node、Edge 描述一个有状态的执行流程。' },
          { qnum: 'Q003', reason: '继续看暂停、人工审批与恢复怎样衔接。' },
        ],
      },
      {
        id: 'projects', title: '把知识串成一个项目回答',
        goal: '围绕业务需求解释架构，再补稳定性、权限和验收。',
        checkpoint: '选择一个熟悉的业务，能否在几分钟内说清需求、方案、取舍，以及如何验证效果？',
        articles: [
          { qnum: 'Q013', reason: '用企业知识库把文档、检索、权限和评测串起来。' },
          { qnum: 'Q014', reason: '看真实业务如何组合检索、工具调用和人工处理。' },
          { qnum: 'Q019', reason: '补上模型输出进入业务系统前的校验。' },
          { qnum: 'Q033', reason: '讨论流量增加后，排队、重试与降级怎样安排。' },
          { qnum: 'Q036', reason: '复查从 Demo 到上线，还缺哪些工程能力。' },
        ],
      },
    ],
  },
  {
    slug: 'rag',
    label: '集中复习 RAG',
    title: 'RAG 面试复习路线：切片、检索、生成与评测',
    description: '按 RAG 链路复习面试题：先明确知识库方案，再学习文档切片、混合检索、Rerank、回答排查和效果评测，每个阶段都有阅读建议与自查问题。',
    cardDescription: '沿着切片、检索和评测，串起高频问题。',
    action: '进入 RAG 专题',
    audience: '准备 RAG 相关面试，或已经做过知识库 Demo、想补齐工程判断的同学。',
    approach: '沿着“文档进入知识库 → 找到证据 → 生成回答 → 验证效果”的顺序读。遇到具体故障时，也可以直接跳到对应阶段。',
    module: 'interview',
    browseHref: '/rag/',
    browseLabel: '查看全部 RAG 面试题',
    stages: [
      {
        id: 'boundaries', title: '先明确方案与边界',
        goal: '知道什么时候需要知识检索，以及向量相似度能够说明什么。',
        checkpoint: '企业知识更新频繁时，你会选择 RAG 还是微调？你的判断依据是什么？',
        articles: [
          { qnum: 'Q040', reason: '从业务目标区分检索知识与调整模型行为。' },
          { qnum: 'Q021', reason: '避免把语义相似当成事实正确。' },
          { qnum: 'Q013', reason: '先看完整系统，再进入下面的局部机制。' },
        ],
      },
      {
        id: 'documents', title: '让文档变成可用的证据',
        goal: '理解解析、切片、上下文完整性，以及知识更新的处理。',
        checkpoint: '答案依赖表格或条款例外时，怎样避免检索只找到一半证据？',
        articles: [
          { qnum: 'Q017', reason: '理解切片大小对定位精度与完整上下文的影响。' },
          { qnum: 'Q048', reason: '用父子检索把定位单元与回答材料分开。' },
          { qnum: 'Q049', reason: '检查表格结构怎样影响后续问答。' },
          { qnum: 'Q025', reason: '把文档更新与索引、缓存的变化一起考虑。' },
        ],
      },
      {
        id: 'retrieval', title: '把相关材料找回来、排好序',
        goal: '分清关键词检索、向量检索和重排，建立检索排查顺序。',
        checkpoint: '同一个问题检索不到答案，和检索到了但排序靠后，应该怎样分别排查？',
        articles: [
          { qnum: 'Q005', reason: '先建立漏召回的排查顺序。' },
          { qnum: 'Q023', reason: '看混合检索怎样覆盖不同问法。' },
          { qnum: 'Q024', reason: '理解重排的作用，以及它补不了哪些问题。' },
          { qnum: 'Q042', reason: '补上多轮追问里的指代与查询改写。' },
        ],
      },
      {
        id: 'evaluation', title: '判断回答是否正确、改动是否有效',
        goal: '把检索表现、证据使用和最终答案分开验证。',
        checkpoint: '一次优化后答案看起来更流畅，怎样证明效果真的提升，并且旧问题没有复发？',
        articles: [
          { qnum: 'Q009', reason: '检查检索正确以后，生成阶段仍可能出现的问题。' },
          { qnum: 'Q026', reason: '分别评测检索、生成和整体系统。' },
          { qnum: 'Q062', reason: '为评测准备有依据、可复查的问题与答案。' },
        ],
      },
    ],
  },
  {
    slug: 'ai-coding',
    label: '上手 AI 编程',
    title: 'AI 编程实操路线：工具配置与工程实践',
    description: '用现有教程上手 AI 编程：从 Claude Code 与 DeepSeek、WorkBuddy 中选择合适的工具完成配置，再学习旧项目重构的任务拆分、测试与验收。',
    cardDescription: '从工具配置开始，跟着教程完成一次实践。',
    action: '查看实操教程',
    audience: '刚开始使用 AI 编程工具，或工具已经装好、想把它用到真实项目里的同学。',
    approach: '先选一款符合自己环境的工具完成配置，再进入项目实践。每次只完成一个能检查结果的小任务，逐步完成修改与验收。',
    module: 'tutorial',
    browseHref: '/tutorial/',
    browseLabel: '查看全部 AI 编程教程',
    stages: [
      {
        id: 'setup', title: '先配置好一款工具',
        goal: '根据自己已有的账号与环境选择一个入口，完成安装和配置。',
        checkpoint: '工具是否能完成一次简单任务？你能否区分工具配置问题和模型服务问题？',
        articles: [
          { qnum: 'T001', reason: '适合想了解 Claude Code APP 与 DeepSeek 连接方式的读者。' },
          { qnum: 'T004', reason: '想从 WorkBuddy 开始，可以先读这一篇；两款工具按需要选择。' },
        ],
      },
      {
        id: 'practice', title: '把工具用到真实项目里',
        goal: '拆分重构任务，通过测试与验收检查修改是否满足需求。',
        checkpoint: '测试通过以后，你还会检查哪些结果，才能确认这次修改可以使用？',
        articles: [
          { qnum: 'T006', reason: '用旧项目重构理解任务拆分、测试与验收。' },
        ],
      },
    ],
  },
  ...RECRUITMENT_GUIDES,
]

export const guideHref = (guide: Pick<LearningGuide, 'slug'>) => `/guides/${guide.slug}/`

export interface ResolvedGuide extends Omit<LearningGuide, 'stages'> {
  articleCount: number
  updated: string
  stages: (Omit<ReadingStage, 'articles'> & {
    articles: (ReadingItem & { article: ArticleWithOrder })[]
  })[]
}

export async function getLearningGuides(): Promise<ResolvedGuide[]> {
  const articles = await getOrderedArticles()
  const byNumber = new Map(articles.map((article) => [article.entry.data.qnum, article]))
  return LEARNING_GUIDES.map((guide) => {
    const used = new Set<string>()
    const stages = guide.stages.map((stage) => ({
      ...stage,
      articles: stage.articles.map((item) => {
        const article = byNumber.get(item.qnum)
        if (!article) throw new Error(`学习路线 ${guide.slug} 引用了不存在的文章 ${item.qnum}`)
        if (used.has(item.qnum)) throw new Error(`学习路线 ${guide.slug} 重复引用了 ${item.qnum}`)
        used.add(item.qnum)
        return { ...item, article }
      }),
    }))
    const dates = stages.flatMap((stage) => stage.articles.map((item) => item.article.entry.data.date.toISOString().slice(0, 10)))
    return { ...guide, stages, articleCount: used.size, updated: [guide.reviewedAt ?? '2026-10-04', ...dates].sort().at(-1)! }
  })
}

/** RAG 优先进入专题，其他 AI 面试题与教程进入对应路线。 */
export function guideForArticle(category: string, module: ModuleKey): LearningGuide | undefined {
  const slug = category === 'rag' ? 'rag' : module === 'interview' ? 'ai-interview' : module === 'tutorial' ? 'ai-coding' : module === 'programmer' ? 'campus-interview' : undefined
  return LEARNING_GUIDES.find((guide) => guide.slug === slug)
}

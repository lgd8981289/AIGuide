// Q565–Q632：来源为候选人的公开面试记录，按公司段落与实际岗位拆分。
// 只概括原题；原帖回答中的 API、版本和候选人补充不扩大为面试官追问。
const question = (qnum, topic, question) => ({ qnum, topic, question, relation: 'mentioned' });
export const PYTHON_REVIEWED_AT = '2026-10-14';

export const PYTHON_REVIEWED_TOPICS = {
  'baidu-ai-ecosystem-intern': [question('Q566', 'Python 列表与元组', 'Python 中元组和列表有什么区别？')],
  'kuaishou-ai-application': [question('Q566', 'Python 列表与元组', 'Python 中列表和元组有什么区别？')],
  'jiawei-python-frameworks': [question('Q573', '列表推导式', '列表推导式、生成式与普通列表定义有什么差异？')],
  'sangfor-python-memory': [question('Q601', '正则匹配范围', 're.search 和 re.match 有什么区别？')],
};

export const PYTHON_INTERVIEW_SOURCES = [
  { id: 'byte-python-metaclass-social', company: 'bytedance', role: 'Python后端', roleKey: 'backend', stage: '社招',
    title: '2019届老腊肉，0.9年python工程师字节跳动后端面经', url: 'https://www.nowcoder.com/discuss/353156424916213760',
    dateLabel: '原帖编辑于 2020-05-11；标题中的 2019 届是毕业届次', topics: [
      question('Q591', 'Python 元类', 'Python 的 metaclass 是什么？'),
      question('Q621', 'WSGI 与框架交互', 'Flask 与 WSGI 如何交互？'),
    ] },
  { id: 'netease-game-python-social', company: 'netease', role: '游戏服务端（天下、在线事业部）', roleKey: 'backend', stage: '社招',
    title: '网易游戏社招多篇面经 + 一些其他游戏公司面经 + 感悟 · 网易服务端部分', url: 'https://www.nowcoder.com/discuss/353156544126722048',
    dateLabel: '原帖编辑于 2020-06-25；仅取网易服务端段落', topics: [
      question('Q591', 'Python 元类', 'Python 的 metaclass 是什么？'),
      question('Q618', 'Python 性能分析', 'Python 的 cProfile 如何使用，平时怎样分析运行效率？'),
    ] },
  { id: 'huawei-od-python-closure', company: 'huawei', role: '开发（OD；原帖未明确细分岗位）', roleKey: 'development', stage: 'OD招聘',
    title: '华为od面经（史诗级拉胯选手）', url: 'https://www.nowcoder.com/discuss/647514679367020544',
    dateLabel: '正文记录 7 月 12 日技术二面；原帖编辑于 2024-08-01', topics: [
      question('Q581', 'Python 闭包', '什么是闭包？'),
    ] },
  { id: 'megvii-python-join-intern', company: 'megvii', role: '算法', roleKey: 'algorithm', stage: '实习（原帖标签）',
    title: 'Face++算法岗一面挂经', url: 'https://www.nowcoder.com/discuss/353154343308304384',
    dateLabel: '原帖编辑于 2018-04-19', topics: [
      question('Q574', '字符串拼接', 'Python 怎样使用 join 拼接字符串？'),
    ] },
  { id: 'sf-python-exceptions-campus', company: 'sf', role: 'Python开发（丰图科技）', roleKey: 'development', stage: '校招（原帖标签）',
    title: '顺丰(丰图科技)python开发一面面经', url: 'https://www.nowcoder.com/discuss/353157211826364416',
    dateLabel: '原帖编辑于 2020-10-25', topics: [
      question('Q566', 'Python 列表与元组', '元组和列表有什么区别？'),
      question('Q578', 'Python 异常处理', 'Python 的 try、except、else、finally、raise 怎样处理异常？'),
      question('Q580', 'Python 执行方式', 'Python 是解释型语言还是编译型语言？'),
    ] },
  { id: 'hikvision-testing-python', company: 'hikvision', role: '软件测试', roleKey: 'testing', stage: '校招',
    title: '#海康威视## HY13G4 #测试面经#', url: 'https://www.nowcoder.com/discuss/353159469196582912',
    dateLabel: '原帖编辑于 2022-08-19', topics: [
      question('Q572', 'Python 字符串切片', 'Python 字符串切片怎样使用？'),
      question('Q576', 'Python 真值', '除了 0 和 None，还有哪些 Python 值在布尔判断中是 False？'),
      question('Q578', '异常处理与返回值', 'Python 的 try、except、finally 中出现 return 时，最终返回哪一个值？'),
    ] },
  { id: 'jd-testing-python-sort', company: 'jd', role: '测试开发', roleKey: 'test-development', stage: '校招提前批',
    title: '京东提前批测开二面面经', url: 'https://www.nowcoder.com/discuss/353158125387718656',
    dateLabel: '正文记录 7 月 20 日一面后约二面；原帖发布于 2021-07-22', topics: [
      question('Q571', 'Python 排序接口', 'Python 对列表排序有哪些方法，sort 和 sorted 怎样使用？'),
      question('Q603', 'JSON 数据转换', 'JSON 怎样与 Python 的 list 相互转换？'),
    ] },
  { id: 'shopee-operations-python-files', company: 'shopee', role: '运维（原帖标签）', roleKey: 'operations', stage: '校招',
    title: 'shopee 2面面经（凉透了）', url: 'https://www.nowcoder.com/discuss/353156140886335488',
    dateLabel: '原帖编辑于 2020-03-24', topics: [
      question('Q605', 'Python 文件读取', 'Python 的 read、readline、readlines 有什么区别？'),
    ] },
  { id: 'baidu-algorithm-python-files', company: 'baidu', role: '算法', roleKey: 'algorithm', stage: '日常实习',
    title: '21届腾讯百度等算法日常实习面经 · 百度部分', url: 'https://www.nowcoder.com/discuss/353155306979008512',
    dateLabel: '原帖发布于 2019-08-28；21 届是作者届次，面试日期未明确', topics: [
      question('Q570', '列表去重', 'Python 怎样对列表去重？'),
      question('Q605', 'Python 文件读取', 'readline 和 readlines 有什么区别？'),
    ] },
  { id: 'tencent-algorithm-python-profile', company: 'tencent', role: '应用研究／算法', roleKey: 'algorithm', stage: '日常实习',
    title: '21届腾讯百度等算法日常实习面经 · 腾讯应用研究部分', url: 'https://www.nowcoder.com/discuss/353155306979008512',
    dateLabel: '原帖发布于 2019-08-28；21 届是作者届次，面试日期未明确', topics: [
      question('Q618', 'Python 性能分析', 'Python 做性能分析可以使用什么库？'),
    ] },
  { id: 'byte-testing-python-dict', company: 'bytedance', role: '测试开发（国际化）', roleKey: 'test-development', stage: '原帖未明确批次',
    title: '字节国际化 测开一面', url: 'https://www.nowcoder.com/feed/main/detail/1315c15c44644b228ec9d0c27490cae3',
    dateLabel: '原帖发布于 2023-09-08', topics: [
      question('Q568', 'Python 字典底层', 'Python 字典的底层怎样实现，哈希冲突怎样寻址？'),
    ] },
  { id: 'byte-testing-python-containers', company: 'bytedance', role: '测试开发', roleKey: 'test-development', stage: '原帖未明确批次',
    title: '字节测开面经', url: 'https://www.nowcoder.com/discuss/797428207740854272',
    dateLabel: '原帖发布于 2025-09-16', topics: [
      question('Q566', 'Python 列表与元组', 'Python 的列表和元组有什么不同？'),
      question('Q568', 'Python 字典特性', 'Python 字典有什么特点？'),
    ] },
  { id: 'tencent-testing-python-tuples', company: 'tencent', role: '系统测试', roleKey: 'testing', stage: '实习提前批',
    title: '腾讯 系统测试实习提前批面经', url: 'https://www.nowcoder.com/discuss/353156164483489792',
    dateLabel: '正文记录 3 月多轮面试；原帖编辑于 2020-04-17', topics: [
      question('Q566', 'Python 列表与元组', 'Python 的列表和元组有什么区别？'),
    ] },
  { id: 'baidu-testing-python-venv', company: 'baidu', role: '测试开发（百度地图）', roleKey: 'test-development', stage: '26届秋招提前批',
    title: '26届秋招 - 百度提前批 - 测开面经', url: 'https://www.nowcoder.com/discuss/781263726157586432',
    dateLabel: '正文记录 7 月 16 日二面；原帖编辑于 2025-09-07', topics: [
      question('Q609', 'Python 虚拟环境', 'Python 为什么要使用虚拟环境？'),
    ] },
  { id: 'weipai-testing-pytest', company: 'weipai', role: '测试工程师', roleKey: 'testing', stage: '25届校招',
    title: '25微派校招测试工程师一面面经', url: 'https://www.nowcoder.com/discuss/724964939189776384',
    dateLabel: '原帖发布于 2025-02-28', topics: [
      question('Q614', 'Python 测试框架', 'pytest 和 unittest 各有什么优点和区别？'),
      question('Q615', 'pytest fixture', 'pytest 的 fixture 功能是什么？'),
    ] },
  { id: 'pony-testing-pytest-fixture', company: 'pony', role: '自动驾驶测试', roleKey: 'testing', stage: '秋招（原帖标签）',
    title: '小马智行自动驾驶测试面经 2026/8/28', url: 'https://www.nowcoder.com/discuss/924026132939165696',
    dateLabel: '标题记录面试日期 2026-08-28；页面显示 09-04 编辑，未明确编辑年份', topics: [
      question('Q615', 'pytest fixture', 'pytest 的 fixture 解决什么问题，怎样用于组织测试用例？'),
    ] },
  { id: 'tencent-cloud-testing-fixture', company: 'tencent', role: '测试（云架构）', roleKey: 'testing', stage: '原帖未明确批次',
    title: '腾讯云架构测试一面', url: 'https://www.nowcoder.com/feed/main/detail/b49fb9e1b29f4b6989ef0bcc3a73555a',
    dateLabel: '页面显示 02-06 发布，未明确年份', topics: [
      question('Q615', 'pytest fixture', 'fixture 的作用是什么？'),
    ] },
  { id: 'huawei-od-python-underscores', company: 'huawei', role: '开发（OD；原帖未明确细分岗位）', roleKey: 'development', stage: 'OD社招（原帖标签）',
    title: '华为OD-Python-面经分享', url: 'https://www.nowcoder.com/feed/main/detail/bb9d186bfab04a25b9b0ff0f83c8d0d9',
    dateLabel: '原帖发布于 2025-10-20', topics: [
      question('Q592', 'Python 下划线命名', 'Python 变量名前加一个下划线和两个下划线有什么区别？'),
    ] },
  { id: 'dahua-python-attributes', company: 'dahua', role: 'Python开发（原帖标签）', roleKey: 'development', stage: '校招',
    title: '求问浙江大华的情况(附面经)', url: 'https://www.nowcoder.com/discuss/353155617470750720',
    dateLabel: '原帖编辑于 2019-09-28', topics: [
      question('Q566', 'Python 列表与元组', 'Python 的集合、列表和元组有什么区别？'),
      question('Q570', '列表去重', 'Python 怎样对列表去重？'),
      question('Q581', 'Python 全局变量', '怎样在函数内部修改全局变量？'),
      question('Q585', '类属性与实例属性', '类的成员变量和对象的成员变量有什么区别？'),
      question('Q592', 'Python 下划线命名', '变量名以一个下划线开头有什么作用，双端下划线形式有哪些用途？'),
    ] },
  { id: 'byte-infrastructure-python-slicing', company: 'bytedance', role: '开发（基础架构；原帖未明确细分岗位）', roleKey: 'development', stage: '暑期实习',
    title: '字节跳动 基础架构部 暑假实习面经', url: 'https://www.nowcoder.com/discuss/353154849422385152',
    dateLabel: '原帖编辑于 2019-03-04', topics: [
      question('Q572', 'Python 切片', 'Python 切片有哪些细节？'),
      question('Q581', 'Python 闭包', '闭包是什么，如何在装饰器中取得被装饰函数的返回值？'),
      question('Q591', 'Python 元类', '是否了解 Python 的元类型？'),
    ] },
  { id: 'xiaomi-testing-python-slicing', company: 'xiaomi', role: '测试开发', roleKey: 'test-development', stage: '原帖未明确批次',
    title: '小米测开一面面经', url: 'https://www.nowcoder.com/feed/main/detail/54e48fdda120446a80ad9c07bad268c4',
    dateLabel: '原帖发布于 2024-03-20', topics: [
      question('Q566', 'Python 列表与元组', 'Python 列表和元组有什么区别，元组能否增加元素？'),
      question('Q572', 'Python 倒序切片', 'Python 怎样用切片实现数组翻转？'),
    ] },
  { id: 'huawei-testing-python-global', company: 'huawei', role: '软件测试（消费者 BG）', roleKey: 'testing', stage: '原帖未明确批次',
    title: '面试复盘 | 华为消费者BG软测一二三面经（已oc）', url: 'https://www.nowcoder.com/discuss/353158531341819904',
    dateLabel: '正文记录 9 月 11 日两轮技术面；原帖编辑于 2021-11-06', topics: [
      question('Q566', 'Python 列表与元组', 'Python 元组和列表有什么区别？'),
      question('Q581', 'Python 全局变量', 'Python 中的全局变量能否在函数内部修改？'),
    ] },
  { id: 'arcsoft-testing-pyc', company: 'arcsoft', role: '测试开发', roleKey: 'test-development', stage: '2019秋招提前批（原帖标题）',
    title: '虹软提前批测试开发全流程详细面经', url: 'https://www.nowcoder.com/discuss/353155615868526592',
    dateLabel: '正文记录 9 月 16 日电话面试；原帖编辑于 2019-10-08', topics: [
      question('Q580', 'Python 字节码缓存', '.pyc 文件是什么？'),
    ] },
  { id: 'xiaoduo-testing-parametrize', company: 'xiaoduo', role: '软件测试', roleKey: 'testing', stage: '原帖未明确批次',
    title: '晓多科技 软件测试面经', url: 'https://www.nowcoder.com/feed/main/detail/44e19cb552984730b472f8adf3c84dad',
    dateLabel: '原帖发布于 2024-08-01', topics: [
      question('Q566', 'Python 列表与元组', 'Python 列表和元组有什么区别？'),
      question('Q616', 'pytest 参数化', 'pytest 怎样实现参数化测试？'),
    ] },
  { id: 'tencent-testing-django-mtv', company: 'tencent', role: '测试开发', roleKey: 'test-development', stage: '2022实习（原帖标题；腾讯为日常实习）',
    title: '2022年暑期实习互联网大厂测开 offer 经验贴 · 腾讯部分', url: 'https://www.nowcoder.com/discuss/364846466995679232',
    dateLabel: '正文记录 3 月腾讯日常实习；原帖编辑于 2022-06-10', topics: [
      question('Q627', 'Django MTV', 'Django 的 MTV 模式是什么？'),
    ] },
  { id: 'ant-testing-python-regex', company: 'ant', role: '测试开发（原帖称蚂蚁金服）', roleKey: 'test-development', stage: '2022暑期实习（原帖标题）',
    title: '2022年暑期实习互联网大厂测开 offer 经验贴 · 蚂蚁金服部分', url: 'https://www.nowcoder.com/discuss/364846466995679232',
    dateLabel: '原帖编辑于 2022-06-10；蚂蚁部分的面试日期未明确', topics: [
      question('Q601', '正则匹配范围', 'Python re 模块中的 match 和 search 有什么区别？'),
    ] },
  { id: 'kuaishou-testing-python-sort', company: 'kuaishou', role: '测试开发', roleKey: 'test-development', stage: '2022暑期实习（原帖标题）',
    title: '2022年暑期实习互联网大厂测开 offer 经验贴 · 快手部分', url: 'https://www.nowcoder.com/discuss/364846466995679232',
    dateLabel: '原帖编辑于 2022-06-10；快手部分的面试日期未明确', topics: [
      question('Q571', 'Python 排序 key', '给定字典，怎样根据 value 对键值对排序？'),
    ] },
  { id: 'meituan-testing-python-sort', company: 'meituan', role: '测试开发', roleKey: 'test-development', stage: '2022暑期实习（原帖标题）',
    title: '2022年暑期实习互联网大厂测开 offer 经验贴 · 美团部分', url: 'https://www.nowcoder.com/discuss/364846466995679232',
    dateLabel: '原帖编辑于 2022-06-10；美团部分的面试日期未明确', topics: [
      question('Q571', 'Python 排序 key', '怎样用匿名函数实现 Python 列表排序？'),
    ] },
].map(source => ({ ...source, reviewedAt: PYTHON_REVIEWED_AT }));

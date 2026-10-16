# Python 的 wheel 和 sdist 有什么区别？为什么有些 pip 安装需要编译器？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q611-python-wheel-sdist/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：wheel 和 sdist 有什么区别？

🙋‍♂️ 我：wheel 是可安装的构建分发，sdist 是源码分发。

🧑‍💻 面试官：同一个包在我电脑直接安装，在服务器却要编译器，为什么？

🙋‍♂️ 我：服务器可能没有兼容的 wheel，转为源码构建。

🧑‍💻 面试官：那看到 .whl 就能装吗？文件名里的 Python、ABI 和平台标签分别限制什么？

> 先看安装的是已构建制品，还是要在目标环境继续构建。找不到兼容制品，编译器问题就会从构建阶段冒出来。

## 面试速答（60 秒版）

wheel 是已经构建好的分发格式，安装通常不需要再执行源码构建；sdist 提供源文件，安装时可能需要构建后再安装。

纯 Python 包可以有较通用的 wheel，带原生扩展的 wheel 则通常受 Python、ABI、平台和架构标签限制。名字里有 whl，不代表任意环境都兼容。

如果目标环境找不到兼容 wheel，pip 可能从 sdist 构建。此时除了 Python 构建依赖，还可能需要 C/C++ 编译器、系统头文件和动态库。隔离构建环境不会自动提供所有系统工具。

排查时我会确认解释器版本、CPU 架构、平台标签和安装日志里的构建阶段。部署尽量使用经过验证的制品，不把本机安装成功当成所有服务器都能直接装。

![直接安装制品，还是先构建？](https://note.lgdsunday.club/img/Q611/01-overview.webp)

## 知识点详解：分发制品为什么影响安装过程

### 源码分发，还需要把项目构建成安装制品

假设一个库只有 Python 文件，和另一个包含 C 扩展的库。它们都可以发布源码分发，但后一个在构建时还要把扩展编译成目标平台能加载的文件。

现代 Python 包构建通常按项目的 build-system 配置调用构建后端，准备构建依赖，再生成 wheel。sdist 安装不是简单把源码原封不动搬到 site-packages。

wheel 已经完成相应构建工作，所以目标安装更直接。不过 wheel 安装时仍需要处理文件、元数据、入口等，不等于单纯随便解压到任何目录都正确。

### 三个兼容标签，不能只看包版本

wheel 文件名的兼容部分通常包含 Python 标签、ABI 标签和平台标签。比如 py3-none-any 表示通用 Python 3、无特定 ABI、任意平台的组合，而带 cp 与平台架构标签的制品会更有针对性。

这只是读标签的基础，不是所有 cp 标签都绑定单一小版本，稳定 ABI 等情况需要按规范判断。Linux 的 manylinux 规则还涉及目标环境兼容要求，不能把“同样是 Linux”当作充分条件。

CPU 架构不匹配也常见。开发机的 arm64 制品和服务器 x86\_64 需要分别检查，容器并不会自动改变文件的目标架构。

![制品标签，要和目标环境匹配](https://note.lgdsunday.club/img/Q611/02-tags-v4.webp)

### 构建隔离，隔离的是哪层依赖？

下面是排查已有安装环境的命令，不提供未知包的自动安装脚本。

```bash
# 查看当前解释器所用 pip 与兼容标签
python -m pip --version
python -m pip debug --verbose

# 检查安装环境里的依赖一致性
python -m pip check
```

安装日志如果出现 Building wheel，就要往构建链看。构建隔离可以准备 Python 构建依赖，但不会凭空安装系统编译器、头文件或操作系统库。

也不建议一失败就禁用构建隔离。这样可能把开发机隐含依赖混入过程，让当前机器能过、CI 仍不行。先识别缺的是哪一层，再使用可重复的构建环境。

![隔离构建环境，不含全部系统工具](https://note.lgdsunday.club/img/Q611/03-layers-v2.webp)

### 把构建环境与运行环境分别验证

可以在受控构建环境生成 wheel，再让部署环境安装经过验证的制品。这样能减少部署时临时编译，但不能跳过原生依赖的运行兼容验证。

纯 Python wheel 也可能声明其他运行依赖；“any” 不表示库在所有系统上的所有功能都没有外部条件。Node 包的原生 addon 也有类似的制品兼容问题，但它的 ABI 和安装协议不同，本题不假造 TS 对应 wheel API。

验证时查看实际选中的文件、构建日志和导入结果，记录 Python、平台、架构与系统库。源码构建成功和扩展实际能加载，仍是两个检查点。

依据：[Python Packaging 分发格式](https://packaging.python.org/en/latest/discussions/package-formats/)、[wheel 规范](https://packaging.python.org/en/latest/specifications/binary-distribution-format/)、[平台兼容标签](https://packaging.python.org/en/latest/specifications/platform-compatibility-tags/)、[pip 构建接口](https://pip.pypa.io/en/stable/reference/build-system/)。

## 面试官继续追问

### wheel 就绝对不需要系统库了吗？

不保证。扩展运行时可能仍依赖系统动态库，具体打包和平台规范要检查。

### 没有 wheel 就代表包过时了吗？

不一定。可能只发布源码，或目标版本与架构尚无对应制品；要看维护状态和支持范围。

### 禁用隔离构建能解决所有编译失败吗？

不能。系统编译工具、代码兼容和头文件问题仍在，还可能引入本机隐含依赖。

## 面试速记卡

> - sdist 提供源码，安装时可能需要构建。
> - wheel 是已构建分发，仍需匹配兼容标签。
> - Python、ABI、平台与架构共同影响制品选择。
> - 构建隔离不自动提供所有系统工具。
> - 构建成功后还要在目标运行环境验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

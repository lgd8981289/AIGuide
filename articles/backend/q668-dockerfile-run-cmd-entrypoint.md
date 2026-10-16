# Dockerfile 的 RUN、CMD 和 ENTRYPOINT 有什么区别？容器启动参数如何组合？

[香侬科技开发面试真题](../companies/shannon-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q668-dockerfile-run-cmd-entrypoint/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** RUN、CMD、ENTRYPOINT 有什么区别？

🙋‍♂️ **我：** RUN 构建时执行，另外两个启动时执行。

🧑‍💻 **面试官：** Dockerfile 里同时写 CMD 和 ENTRYPOINT，是先执行一个，再执行另一个吗？

🙋‍♂️ **我：** 不是，exec 形式下可以组合成一个启动命令。

🧑‍💻 **面试官：** 那 docker run 后面加参数，覆盖的是谁？容器停止时，信号又发给哪个进程？

> 先分清构建和启动，再把启动命令拼出来。只背三个定义，不足以解释覆盖和信号问题。

## 面试速答（60 秒版）

RUN 在构建镜像时执行，用于安装依赖、编译或准备文件；它不会因为容器每次启动就重新执行。

CMD 提供默认启动命令或默认参数。ENTRYPOINT 则常用来固定主要可执行程序。采用 exec 数组形式时，ENTRYPOINT 与 CMD 可以组合成“程序＋默认参数”，不是启动时依次执行两个脚本。

docker run 在镜像名后提供的命令参数，会替换 CMD 的默认部分；需要改 ENTRYPOINT 时，使用 --entrypoint 等明确方式。具体组合还要看 shell 形式和 exec 形式，不能混着推导。

我会优先用 exec 形式直接启动主进程。如果入口脚本还要做准备，再用 exec 把控制权交给应用，并验证停止信号能正确到达，而不只是检查容器能启动。

![构建镜像，和启动容器分开看](https://note.lgdsunday.club/img/Q668/01-dockerfile-run-cmd-entrypoint.webp)

## 知识点详解：从镜像配置算出最后执行的命令

### RUN 的结果留在镜像里，进程不会一直活到运行阶段

假设构建时执行编译命令，生成一个应用文件。后面启动容器，用的是这个构建产物，不是让当时的编译进程重新继续运行。

同样，在 RUN 里启动一个常驻服务，并不等于给最终容器配置好了主进程。构建环境里的进程生命周期，和容器运行时的启动配置要分开理解。[Dockerfile 官方参考](https://docs.docker.com/reference/dockerfile/)分别定义了这些指令。

### exec 形式下，ENTRYPOINT 与 CMD 可以拼起来

下面只是演示启动参数，使用实际存在的镜像前还需完成镜像来源和版本管理。Dockerfile 本身不需要翻译成 TS/Python。

```dockerfile
FROM busybox:1.37
ENTRYPOINT ["echo"]
CMD ["hello"]
```

不加其他命令参数时，效果是执行 `echo hello`。

若把这个镜像命名为 demo，执行 `docker run --rm demo world`，镜像名后面的 world 替换 CMD 部分，效果就是 `echo world`。它不会变成先 echo，再执行一个叫 hello 的程序。

为了避免读者误用，这里用无副作用的 echo 解释组合；没有把它称作生产镜像模板。

![docker run 参数替换哪一段？](https://note.lgdsunday.club/img/Q668/02-dockerfile-run-cmd-entrypoint.webp)

### 没有 ENTRYPOINT 时，CMD 也能提供完整命令

如果只写 `CMD ["echo", "hello"]`，它就是默认运行命令。docker run 另外提供一个命令，会替换这份默认值。

因此，“CMD 只能写参数”是不对的。它的实际角色要看是否与 ENTRYPOINT 搭配。

一个 Dockerfile 出现多个 CMD，也不是依次执行多条默认命令，最终生效的是最后一条相应配置。需要多个准备动作时，应使用明确的构建步骤或入口脚本，而不是堆 CMD。

### shell 形式为什么会影响参数和停止信号？

`CMD echo hello` 这样的写法通常通过 shell 执行，和 exec 数组形式的进程结构不同。shell 是否展开变量、如何转发信号，都会影响结果。

容器停止时，运行时会先向主进程发送约定的停止信号，超时后再作进一步处理。如果应用躲在一个没有正确转发信号的 shell 后面，就可能收不到预期退出通知。

入口脚本在准备完成后，通常应通过 exec 启动主应用，让它接管相应进程位置。若应用还会创建子进程，也要考虑回收和进程管理，不能把“用了 exec”当作所有多进程问题的答案。[Docker 停止容器说明](https://docs.docker.com/reference/cli/docker/container/stop/)补充了信号与等待行为。

![停止信号，要能到达主应用](https://note.lgdsunday.club/img/Q668/03-dockerfile-run-cmd-entrypoint.webp)

## 面试官继续追问

### exec 数组形式会自动展开环境变量吗？

不会因为出现 `$NAME` 就自动经过 shell 展开。需要由应用读取环境变量，或者明确选择 shell 路径并理解它的影响。不要混淆 Dockerfile 的构建变量处理、容器环境和 shell 展开。

### 怎么验证启动配置？

检查镜像的 Entrypoint、Cmd，再分别测试默认参数、覆盖参数和覆盖入口。最后启动一个能处理退出信号的测试程序，执行停止操作，观察是否正常清理退出。本文只给组合推导，没有声称已经在本机运行 Docker。

## 面试速记卡

> - RUN：构建阶段执行，留下文件系统结果。
> - CMD：提供默认命令或参数，可被运行参数替换。
> - ENTRYPOINT：常固定主程序，exec 形式可与 CMD 组合。
> - 覆盖：镜像名后参数通常替换 CMD，改入口用明确入口选项。
> - 验证：不仅要能启动，还要确认参数、进程结构和停止信号。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **香侬科技 · 开发（基础架构） · 实习**：Dockerfile 的 CMD 与 ENTRYPOINT 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353155118407294976)；原帖编辑于 2019-07-11；正文明确区分基础架构与后台岗位。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

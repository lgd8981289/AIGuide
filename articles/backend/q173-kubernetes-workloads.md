# Kubernetes 的 Pod、Deployment、Service 有什么区别？请求怎样找到容器？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q173-kubernetes-workloads/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：Pod、Deployment、Service 分别做什么？

🙋‍♂️ 我：Pod 运行容器，Deployment 管理 Pod，Service 转发请求。

🧑‍💻 面试官：一个 Pod 删除又重建，IP 变了，调用方为什么不必改地址？

🙋‍♂️ 我：Service 提供稳定入口。

🧑‍💻 面试官：那 Deployment 会不会亲自转发这一次请求？Service 又会不会替你重新创建 Pod？

> 这是两条链：「控制链维持副本」，「流量链找到可用后端」。别把控制器画成请求必经的网关。

## 面试速答（60 秒版）

Pod 是 Kubernetes 中部署和调度的一组紧密关联容器的基本单元，同一 Pod 中的容器共享网络等资源。

Deployment 声明期望的副本和模板，通常通过 ReplicaSet 等控制器维持 Pod、处理更新。它管理运行状态，不是每次请求都会经过的代理服务器。

Service 为一组后端提供相对稳定的服务发现与访问入口。常见带 selector 的 Service 按标签关联 Pod，EndpointSlice 记录后端端点，实际数据转发由集群网络实现完成。

所以请求找不到容器时，我会沿域名与 Service、selector、端点、就绪状态、端口和应用监听逐项排查；Pod 不足则沿 Deployment、ReplicaSet、调度和启动去查。

![Deployment 控制副本，Service 流量路径连接可用 Pod，二者职责分离](https://note.lgdsunday.club/img/Q173/00-60s-overview.webp)

## 知识点详解：把维持副本和转发流量画成两条线

### Pod 不是某一个容器的另一个名字

假设一个应用容器旁边还有紧密配合的辅助容器，它们可以放在同一个 Pod 中共享网络，并按 Pod 单元安排到节点。一个 Pod 可以只有一个容器，也可以有多个，不代表应该把全部服务塞进去。

Pod 的生命周期是临时的，失败后的替代 Pod 是新对象，不保证原来的 IP 不变。持久数据需要独立的存储设计，不能依赖 Pod 一直活着。

所以「容器重启」「Pod 被替换」「节点故障」也不是同一事件，排查时要看具体状态。

### Deployment 关心期望和实际之间的差距

假设我们声明应用应该有三个副本。控制器持续观察实际状态，通过 ReplicaSet 等维持对应 Pod；副本缺少时尝试补足，模板改变时按更新策略逐步替换。

声明三个并不保证此刻三个都能服务。资源不足、调度失败、镜像拉取失败、启动错误，都可能让实际状态达不到期望。

Deployment 不是流量转发器。不能画成用户请求先经过 Deployment，再进入 Pod。它负责控制工作负载，流量有另一条链。

### Service 怎么找到当前的后端

常见 ClusterIP Service 提供集群内部入口，带 selector 时通过标签对应一组 Pod；控制面维护 EndpointSlice 中的端点信息，网络数据面据此处理连接。

Pod 发生替换时，端点集合更新，客户端可以继续使用服务入口。这里不是每次请求都由 API Server 亲自查询并转发，也不保证所有集群都用同一种代理实现。

Service 的 port 与 targetPort 要对应应用实际监听端口。selector 选错、应用只监听不合适的地址或就绪失败，都可能出现「Pod 存在，但服务访问不了」。特殊的无 selector、ExternalName、Headless 等 Service 要按各自语义看。

### 排查时分别沿两条链走

控制链检查 Deployment 期望副本、ReplicaSet、Pod 调度与事件，再检查容器启动、崩溃和资源限制。

流量链检查 DNS、Service 类型与端口、selector、EndpointSlice、就绪状态，再到应用监听与网络策略。Running 只说明 Pod 的运行阶段，不代表业务已经就绪。

外部流量还需按架构经过 LoadBalancer、Ingress 或 Gateway 等入口，ClusterIP 并不天然对公网开放。验收时主动替换一个 Pod，验证端点变化与可用性，同时测试未就绪实例是否被正常排除。

本题机制参考：[Kubernetes Pods](https://kubernetes.io/docs/concepts/workloads/pods/)、[Kubernetes Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)、[Kubernetes Service](https://kubernetes.io/docs/concepts/services-networking/service/)。

## 面试官继续追问

### Service 会自动扩容 Pod 吗？

不会。副本由工作负载控制器及相应扩缩容机制管理，Service 提供发现与流量入口。

### Pod Running 为什么还访问失败？

可能应用未就绪、端口或监听错误、selector 不匹配、DNS或网络策略问题。不要只看一个状态。

### 每个请求都经过 kube-proxy 进程吗？

不能这样说。具体数据面可使用规则或其他网络实现，不能把逻辑服务入口等同于某个进程的逐请求转发。

## 面试速记卡

> - Pod：容器运行与调度单元。
> - Deployment：声明并维持副本与更新，不转发请求。
> - Service：发现与入口，常按标签关联后端。
> - EndpointSlice：后端端点集合。
> - 控制链查副本；流量链查入口、就绪和端口。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

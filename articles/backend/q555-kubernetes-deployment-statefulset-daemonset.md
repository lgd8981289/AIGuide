# Kubernetes 的 Deployment、StatefulSet 和 DaemonSet 有什么区别？

[莉莉丝运维面试真题](../companies/lilith-operations.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q555-kubernetes-deployment-statefulset-daemonset/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：这三种控制器怎么选？

🙋‍♂️ 我：无状态用Deployment，有状态用StatefulSet，节点服务用DaemonSet。

🧑‍💻 面试官：我的API连接数据库，它算有状态吗？

🙋‍♂️ 我：用了数据库，可能就该StatefulSet。

🧑‍💻 面试官：如果数据库放StatefulSet，它是不是自动有主从复制？DaemonSet是不是保证任何节点都能马上跑起来？

> 看的是Pod之间能否互换、身份是否要保留，以及副本是否按节点分布；用了数据库还不足以决定控制器。

## 面试速答（60 秒版）

`Deployment` 管理一组可替换的Pod副本，并提供声明式更新，常用于无状态API等应用。API连接数据库，不代表API的Pod自己必须保留固定身份。

`StatefulSet` 用于需要稳定网络身份、编号和持久存储关联的Pod。重建时能延续这些关系，但数据库复制、选主和一致性仍需要数据库或配套系统实现。

`DaemonSet` 则让符合条件的节点运行对应Pod，适合日志采集、节点监控等组件。它不是指定总副本数的普通扩容方式，也不能绕过资源和调度条件。

所以选型时，我会分别问三个问题：副本是否可互换、身份与数据是否要对应、是不是每个目标节点都需要一份。

![副本、身份、节点，是三件事](https://note.lgdsunday.club/img/Q555/01-overview.webp)

## 知识点详解：把副本、身份和节点覆盖分开看

### Deployment 关心的是一组可以接替的副本

假设课程API有三份Pod，状态存到数据库和共享服务里。任何一份都能处理同类请求，少一份时补上另一份，不需要记住旧Pod的名字。

这类情况下，Deployment比较合适。它描述期望状态，借助ReplicaSet等机制维护副本，并组织版本更新。

但“无状态”不代表应用不读写数据。关键是能不能替换当前Pod，而不丢失只有它自己掌握的必要业务状态。会话只存在Pod内存里时，就需要先处理这种依赖。

### StatefulSet 保留的是身份与存储关系

假设三个数据库实例需要不同编号，客户端或成员之间需要区分谁是谁。StatefulSet为Pod提供稳定身份，并可通过卷声明模板为各Pod建立相应存储关联。

Pod重建后，这些身份和存储关系能够延续，但不是把旧容器内存原样搬过去，也不是承诺Pod一直在同一节点。

默认的有序创建、更新等行为有相应策略可配置。面试里可以解释默认行为，不要把它说成所有策略下绝不会变化的硬规则。

![重建Pod，延续身份和卷](https://note.lgdsunday.club/img/Q555/02-stable-identity.webp)

### 有三个数据库Pod，不等于数据库集群已经正确

StatefulSet能创建三个有编号的实例，却不知道它们的业务数据应该怎样复制。哪个是主节点、写入如何确认、故障后谁接任，需要数据库协议或Operator等配套方案处理。

同样，存储是否可用还取决于存储类、访问模式、底层系统和故障情况。Pod的身份稳定，不等于磁盘内容自动多副本可靠。

所以把数据库改成StatefulSet，只是解决部署管理的一部分问题，不能替代数据库集群设计。

![有编号，不等于复制已完成](https://note.lgdsunday.club/img/Q555/03-database-boundary.webp)

### DaemonSet 按目标节点安排副本

假设日志采集器要读各节点上的日志，只有把采集Pod放到相应节点，才方便取得那里的信息。DaemonSet正好围绕这种需求组织。

它面向符合选择条件的节点，而非一定覆盖整个集群。nodeSelector、节点亲和性等决定目标范围，实际运行还受资源和调度情况影响。

新增一个符合条件的节点时，控制器会为它安排对应Pod；扩容普通API时，则通常修改Deployment期望副本数。这两种数量变化的原因不同。

![按符合条件的节点安排](https://note.lgdsunday.club/img/Q555/04-eligible-nodes.webp)

### 判断选型，先画替换之后会发生什么

我会把某个Pod删掉重建作为推演。API的新副本是否能直接接流量？数据库实例是否还能找到自己的卷与身份？新节点是否需要本地采集器？

还要检查Readiness、滚动更新和存储保留策略。尤其删除StatefulSet、缩容与PVC回收的关系可能受配置影响，不要背一句“PVC永远不会删”就去操作。

本文未部署集群，具体策略需要在当前版本的测试环境核验。生产删除或迁移要先确认数据保留和回滚方案。

技术依据：[Kubernetes 控制器](https://kubernetes.io/docs/concepts/workloads/controllers/)。工程场景与解法按本文说明的条件展开。

## 面试官继续追问

### Deployment不能挂持久卷吗？

可以挂。区别不在有没有卷，而在副本可替换性和是否需要由控制器管理稳定身份与逐Pod存储关系。

### DaemonSet是否一定每节点一份？

针对符合条件的节点维护对应副本；节点范围和能否实际运行要看选择条件、资源及状态。

## 面试速记卡

> - Deployment：可替换副本与声明式更新。
> - StatefulSet：稳定身份与存储关联，内存不会原样恢复。
> - DaemonSet：面向符合条件的节点安排副本。
> - 数据库：复制、选主和一致性不是StatefulSet自动提供的。
> - 选型：问互换性、身份关系与节点覆盖，不只看有没有数据库。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **莉莉丝 · 平台运维 · 实习**：Deployment 和 StatefulSet 有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/41883e388cc14abe97de11d46816e45d)；正文记录 5 月 11 日一面通知、5 月 15 日二面；页面显示 05-20 编辑，未明确年份。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

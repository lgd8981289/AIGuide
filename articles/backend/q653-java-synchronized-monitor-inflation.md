# synchronized 底层怎么实现？对象头、Monitor 和锁膨胀是什么关系？

[美团后端面试真题](../companies/meituan-backend.md) · [阿里后端面试真题](../companies/alibaba-backend.md) · [快手后端面试真题](../companies/kuaishou-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q653-java-synchronized-monitor-inflation/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 **面试官：** synchronized 底层怎么实现？

🙋‍♂️ **我：** 通过对象头和 Monitor，锁会从偏向锁升级到轻量级锁，再升级到重量级锁。

🧑‍💻 **面试官：** 你说的是哪个 JDK？今天如果讨论 JDK 21，这条升级路线还适用吗？

🙋‍♂️ **我：** 需要看具体实现，不能照搬旧版的偏向锁流程。

🧑‍💻 **面试官：** 那 synchronized 的语言保证，和 HotSpot 为了提速采用的锁实现，怎样分开讲？

> 先讲“锁住谁、保证什么”，再讲指定版本怎样实现。否则很容易用一套旧口诀回答所有 JDK。

## 面试速答（60 秒版）

synchronized 让线程围绕同一个监视器进行互斥访问。实例同步方法锁的是当前对象，静态同步方法锁的是对应 Class 对象，同步代码块锁的是括号里的对象。

它还提供可重入和内存可见性保证：同一监视器上的解锁，先行发生于后续加锁。因此，共享数据的读写要遵守同一套同步约定。

对象头和 Monitor 属于 JVM 实现层。以本文核对的 OpenJDK 21u 默认传统栈锁模式为例，没有竞争时可以走较轻的加锁路径；需要更完整的竞争或等待管理时，可以膨胀为 ObjectMonitor。对象头会参与记录锁的状态或关联信息。

具体布局、快速路径和膨胀条件会随 JDK、虚拟机和配置变化，所以不能把“偏向锁一路升级”当成现代 JVM 永远适用的流程。

![synchronized，语义和实现分两层](https://note.lgdsunday.club/img/Q653/01-java-synchronized-monitor-inflation.webp)

## 知识点详解：先把监视器和 ObjectMonitor 分开

### 两个线程用的是不是同一把锁？

假设一个对象里有同步方法，两个线程调用这个对象的该方法，它们需要竞争同一个监视器。

但如果两个线程各自 new 了一个对象，即使执行的是同一段方法代码，也不代表它们在竞争同一把锁。锁跟对象关联，不能只看 synchronized 写在哪一行。

静态同步方法则不同，它关联类的 Class 对象。用同一个类的两个实例去调用，也不能把它理解成两把实例锁。[Java 语言规范对同步语句的定义](https://docs.oracle.com/javase/specs/jls/se21/html/jls-14.html#jls-14.19)是这部分语义的依据。

![方法一样，锁对象也一样吗？](https://note.lgdsunday.club/img/Q653/02-java-synchronized-monitor-inflation.webp)

### 语言层的监视器，不等于每次都创建一个重量级对象

在语言模型里，对象关联监视器，线程进入同步区域之前要获得它。

但实现时，如果每次进入一个没有竞争的短代码块，都付出完整的等待队列管理成本，就不太划算。HotSpot 会为常见情况提供快速路径，只在需要时采用更完整的 Monitor 管理。

这里容易混淆两个词。**监视器**可以指语言规定的同步机制；**ObjectMonitor**则是 HotSpot 里的一种具体实现结构。不能因为规范说对象有关联监视器，就推导出堆里每个对象从创建开始都配好一个独立的 ObjectMonitor。

### 对象头记录线索，ObjectMonitor 管理竞争

对象头里不只保存锁的信息。它还涉及运行时需要的其他信息，实际编码方式也会随实现变化。

在本文核对的 JDK 21u 传统栈锁实现中，快速加锁过程会使用对象头和线程栈中的锁记录。进入膨胀状态后，则通过相关关联信息找到 ObjectMonitor，由它管理所有者、竞争和等待等状态。

可以把一次竞争想成这样：线程 A 已经进入同步区域，线程 B 也要进入。如果 B 不能取得锁，就需要等待后续竞争机会。但 B 不会因为“排进队伍”就已经获得执行共享数据的权利。

这里不画固定的对象头位数图，因为位宽、平台以及锁模式会影响解释。本文范围是 [OpenJDK 21u 的同步实现](https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/runtime/synchronizer.cpp)；它的[配置源码](https://github.com/openjdk/jdk21u/blob/master/src/hotspot/share/runtime/globals.hpp)中，默认 LockingMode 为传统模式，同时还存在其他模式。

### wait 为什么不能被理解成普通的锁竞争？

锁竞争中的线程，目标是取得锁进入同步区域。调用 wait 的线程则已经持有锁，现在要释放它，等条件可能发生变化后再重新竞争。

因此，wait 涉及等待集合和重新获取监视器，不能只用“多试几次 CAS”解释完整语义。JDK 21u 的 wait 路径会使用膨胀后的 ObjectMonitor。

即使收到 notify，线程也不会立即拿到锁；从 wait 返回以前，还需要重新获得它。条件检查要放在循环里，醒过来以后重新判断共享状态。[Object.wait 的 API 说明](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html#wait\(\))明确了这些约束。

![wait 醒来以后，还要重新获得锁](https://note.lgdsunday.club/img/Q653/03-java-synchronized-monitor-inflation.webp)

## 面试官继续追问

### 锁膨胀就是性能一定变差了吗？

不能只根据名字判断。要看竞争强度、临界区长度、线程数量和真实等待时间。把一段慢查询放在锁里，成本可能远高于加锁指令本身。先缩小临界区和消除不必要的共享，再根据剖析结果讨论实现开销。

### 怎么观察？

先固定 java -version、虚拟机和锁相关配置，再使用对应版本支持的 JFR 事件、线程转储和监视器日志。本文是源码核验，不冒充已在某个业务上量出锁膨胀比例，也不拿对象头截图代替性能测试。

## 面试速记卡

> - 先看锁对象：实例、Class 和代码块表达式要分清。
> - 语言保证：互斥、可重入，以及同一监视器上的同步可见性。
> - 实现分层：监视器语义不等于始终分配一个 ObjectMonitor。
> - 膨胀：从较轻路径转入完整监视器管理，条件依版本而定。
> - 回答边界：先报 JDK 和实现范围，不套用旧偏向锁口诀。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · Java后端 · 社招**：锁状态怎样变化，对象头与锁升级有什么关系？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。
- **阿里巴巴 · Java后端 · 社招**：synchronized 的原理是什么，怎样保证重入和可见性？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157517968613376)；历史面经，面试年份未明确；页面编辑于 2024-07-19。
- **快手 · Java开发 · 原帖未明确批次**：synchronized 怎样保证线程安全，怎样实现可重入？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353156433057357824)；快手部分记录 5 月 13 日、5 月 18 日面试，未明确面试年份；原帖编辑于 2021-08-22。
- **美团 · Java后台开发 · 春招实习（原帖标签）**：synchronized 关键字的底层怎样实现，锁升级过程是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154361599664128)；原帖编辑于 2018-05-02。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

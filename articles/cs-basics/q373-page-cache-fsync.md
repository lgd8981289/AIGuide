# Linux Page Cache 是什么？write 成功后，为什么数据还可能丢失？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/cs-basics/q373-page-cache-fsync/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：write 成功，文件就安全落盘了吗？

🙋‍♂️ 我：不一定，可能只写进 Page Cache。

🧑‍💻 面试官：立刻 read 能读到新内容，为什么不能证明持久化？

🙋‍♂️ 我：读取也可能来自缓存。

🧑‍💻 面试官：写临时文件再 rename，是不是断电也不会丢？目录要不要同步？

> 「现在能读到」和「故障后能恢复」是两种保证。原子性与持久性不能画等号。

## 面试速答（60 秒版）

Linux 普通缓冲文件 I/O 使用 Page Cache。write 成功通常表示数据已被相应层接受，不保证进入持久存储；随后读取也可能命中缓存。

修改过但未回写的页面叫脏页，内核会安排回写。需要明确持久化时，使用 fsync 或合适的 fdatasync，并检查错误。

临时文件再 rename 可以提供相应的原子替换，但不自动保证断电后的目录项持久化。可靠更新还需同步文件，并按文件系统要求同步父目录。

同时区分语言缓冲与内核缓存。Python flush 只推进到下一层，仍需 os.fsync；Node 也要使用同步 API。保证还取决于文件系统、设备和错误处理。

![能读到，不等于已经持久化](https://note.lgdsunday.club/img/Q373/01-overview-v2.webp)

*图：能读到，不等于已经持久化。*

## 知识点详解：文件写入经过哪些层？

### 语言缓冲、Page Cache 与存储

假设保存一份配置。高级语言可能先把数据放在用户态缓冲；系统调用后，普通写入进入内核 Page Cache；之后回写到设备。

语言 flush 不等于设备同步，write 成功也不等于全部字节持久化。

Page Cache 用于复用数据并减少昂贵访问。写入让页面变脏，稍后回写，见 [Linux 内存概念](https://docs.kernel.org/admin-guide/mm/concepts.html#page-cache)。

### 读回成功，为什么仍可能丢失？

read 可以从缓存取得刚写内容。它证明当前内核能提供数据，不证明设备已经持有。

整机故障会丢失尚未回写内容。应用崩溃与断电也不同：内核仍运行时，缓存可能继续回写。

![读回新内容，也可能来自缓存](https://note.lgdsunday.club/img/Q373/02-crash.webp)

*图：读回新内容，也可能来自缓存。*

### fsync 不是忽略错误的仪式

fsync 请求同步文件数据与元数据，等待设备报告完成。fdatasync 可以减少与数据读取无关的元数据同步，但文件大小等必要信息仍需处理。

同步可能出现空间不足或 I/O 错误，不能吞掉后报告保存成功，见 [fsync 手册](https://man7.org/linux/man-pages/man2/fsync.2.html)。

下面只展示已有文件的数据写入与同步，不包含目录持久化或原子替换。

#### TypeScript

```ts
import { open } from "node:fs/promises";
async function persistExisting(path: string, text: string) {
  const file = await open(path, "r+");
  try {
    await file.truncate(0);
    await file.writeFile(text, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
}
```

#### Python

```python
import os

def persist_existing(path, text):
    with open(path, "r+", encoding="utf-8") as file:
        file.seek(0)
        file.truncate()
        file.write(text)
        file.flush()
        os.fsync(file.fileno())
```

TypeScript 使用 Node.js 的 [FileHandle.sync](https://nodejs.org/api/fs.html#filehandlesync)，Python 则先推进语言层缓冲，再调用 [os.fsync](https://docs.python.org/3/library/os.html#os.fsync)。具体持久化保证还依赖操作系统与存储设备。

示例原地修改文件，故障窗口可能只剩部分数据，**不是可直接采用的原子更新方案**。

### 原子替换还要考虑目录

更完整的方案：同目录创建临时文件，写入并同步文件，rename 到目标，再按文件系统要求同步父目录。

文件同步保护内容，目录同步涉及名称与目录项。原子性解决其他访问者看到旧文件还是新文件；持久性解决崩溃后恢复哪个状态。

跨文件系统、权限保留和临时文件清理还需处理。不能把简单 rename 说成所有平台无条件可靠。

![文件内容与目录名称，都要考虑同步](https://note.lgdsunday.club/img/Q373/03-rename.webp)

*图：以 Linux 上同目录、同文件系统为例：临时文件同步后替换名字，再同步目录。新内容来自 app.tmp，不是重新写一遍 app。*

## 面试官继续追问

### close 保证落盘吗？

不能视为 fsync 的等价保证。关闭描述符与请求持久化不同。

### O\_DIRECT 能替代吗？

不能简单替代。绕缓存与持久化不同，还有对齐、设备缓存和同步标志。

### 每行都 fsync 最好？

成本很高，也不解决多文件事务。按业务允许丢失量设计批量与提交语义。

## 面试速记卡

> - Page Cache：缓存文件数据，写入可先形成脏页。
> - write/read 成功：不等于故障后恢复。
> - flush：推进语言缓冲；fsync：请求文件同步。
> - 原子替换：与持久性分开判断。
> - 目录项：创建与 rename 后考虑目录同步。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

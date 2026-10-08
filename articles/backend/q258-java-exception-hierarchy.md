# Java 异常体系怎么分？Exception、Error 和 RuntimeException 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q258-java-exception-hierarchy/) · [题库目录](../../README.md)

*下面是一段教学用的模拟面试。*

🧑‍💻 面试官：Java 的 Exception 和 Error 有什么区别？

🙋‍♂️ 我：Exception 是程序异常，Error 是比较严重的错误。Exception 可以捕获，Error 一般不处理。

🧑‍💻 面试官：那 Error 在语法上不能 catch 吗？RuntimeException 又是不是 Exception？

🙋‍♂️ 我：RuntimeException 属于 Exception，Error 在语法上也能捕获。

🧑‍💻 面试官：如果接口层 catch 了 Throwable，然后继续返回成功，是不是就把异常处理好了？受检异常到底检查的是什么？

> 这里有两条线需要分开：类型属于哪一类，以及代码有没有能力让失败后的工作继续成立。

## 面试速答（60 秒版）

Java 中可以抛出的异常对象都属于 Throwable 体系，主要分为 Exception 和 Error。

Exception 又包含 RuntimeException 及其子类，以及其他常见的受检异常。受检异常通常要求调用方在编译时选择捕获处理，或者通过 throws 声明继续向上传递；RuntimeException 和 Error 属于非受检异常，没有这项编译期要求。

但受检不代表容易恢复，非受检也不代表一定不能处理。Error 往往涉及运行环境或严重资源问题，语法上可以捕获，却不能因此保证服务还能正常工作。实际处理要说明这次操作失败了什么、在哪一层能处理，以及哪些资源需要清理，避免 catch 以后假装成功。

![异常继承与受检规则](https://note.lgdsunday.club/img/Q258/01-exception-overview-v2.webp)

## 知识点详解：从一次文件读取，看异常怎么往上传

### 先看类型关系，再看检查规则

可以把常见关系写成下面这棵树：

```text
Throwable
├── Error                  非受检
└── Exception
    ├── RuntimeException   非受检
    └── 其他常见异常        受检，例如 IOException
```

RuntimeException 是 Exception 的子类，所以“Exception 都是受检异常”这句话不对。

更严格地说，受检类型是 Throwable 体系中，除 RuntimeException、Error 及其子类之外的类型。上面用 IOException 帮助理解常见分支，不是把整个类型体系缩成三个孤立类。[Java 语言规范](https://docs.oracle.com/javase/specs/jls/se25/html/jls-11.html)定义了这项分类。

### 受检，检查的是代码有没有交代异常去向

假设咱们写一个方法，从文件里读取配置。读取过程中可能发生 IOException，比如文件不存在或者读取失败。

调用它的代码需要作出选择：在当前层捕获，或者把相应异常声明在 throws 中，让上层知道它可能失败。

那么，编译通过是不是说明读取一定成功？

不是。编译器只检查代码是否满足异常声明与处理规则，它不会提前打开线上文件，也不会替你判断这次异常能不能恢复。

同样，一个可能抛出 NullPointerException 的调用，编译器没有要求你写 catch，也不表示这行代码安全。非受检只是免去这项强制声明检查。

### 异常抛出来以后，调用链怎样停止？

假设 Controller 调用配置服务，配置服务再调用文件读取方法。

读取失败后，当前正常执行路径被打断。运行时沿调用链寻找能匹配这个异常类型的处理器；找到以后，进入相应 catch。没有找到时，异常继续向当前线程的未捕获异常处理路径传播。

原来“读取后继续计算”的语句不会凭空执行。这一点很重要，因为上层如果只是打印日志，再用一个未准备好的结果继续工作，就可能把明确失败变成更难查的数据错误。

例如配置是必须项，读取失败就应该阻止相应功能继续启动；配置只是可选的展示文案，才可能使用预先定义好的默认值。能不能继续，取决于这份数据在当前任务里的作用。

![异常产生、栈展开与处理位置](https://note.lgdsunday.club/img/Q258/02-unwind-stack.webp)

### catch 应该放在能作出处理决定的地方

底层读文件的方法知道读取失败，却未必知道业务要不要取消整个请求。

因此，它可以保留原因并向上传递。到了有业务语境的一层，再决定返回明确错误、重试、使用合法的备用值，或者停止任务。

这里也要区分两种“处理”：记录日志让错误可见，和采取措施让任务恢复。只写了一句日志，不等于恢复完成。

换成业务异常时，还应保存原始 cause，否则调用链最后只剩一句“处理失败”，真正的文件路径、异常种类和发生位置都丢了。日志里则避免打印令牌、密码或完整敏感内容。

### finally 负责收尾，却不是绝对不会失败

当控制流通过相关 try 语句离开时，finally 通常会执行，所以经常用来做资源清理。但进程被强制结束、虚拟机退出等情况，不能靠 finally 保证收尾。

还有一个容易忽略的问题：如果 finally 自己 return 或抛出新的异常，原来的返回值或异常可能被覆盖。代码看起来“认真清理了”，却让真正的失败原因消失了。

对于实现 AutoCloseable 的资源，可以使用 try-with-resources。资源关闭也出错时，它有保留主异常和 suppressed 异常的规则；这和随手在 finally 里抛一个新错误不一样。[资源关闭规则](https://docs.oracle.com/javase/specs/jls/se25/html/jls-14.html#jls-14.20.3)值得在需要时展开。

![try-with-resources 同时失败时的主异常与 suppressed](https://note.lgdsunday.club/img/Q258/03-resource-suppressed-v2.webp)

### 怎么检查一段异常处理是真的有用？

分别模拟正常读取、文件不存在、内容格式错误和关闭资源失败，检查调用方最后得到什么结果。

需要关注三个地方：失败是否被正确报告，原始原因是否保留，资源是否按约定释放。如果错误日志已经出现，接口却仍然返回一个合法的成功结果，就需要确认这是否真的是业务允许的降级。

这比统计代码里写了多少个 catch，更能说明异常处理是否完整。

## 面试官继续追问

### Error 一定不能捕获吗？

语法上可以。但例如内存耗尽时，再分配大量对象来组织错误响应，也可能继续失败。框架边界有时需要记录或隔离故障，普通业务代码不应一概吞掉 Error 后继续假装正常。

### throw 和 throws 有什么区别？

throw 是执行时抛出一个异常对象；throws 在方法声明中说明可能向上传递的异常类型。声明不会代替实际抛出，也不会自动完成恢复。

### 一次请求失败，会让整个进程退出吗？

不一定。线程、线程池、Web 容器和任务框架各有异常传播边界。需要看异常发生在哪里、谁负责接住，而不是看见 RuntimeException 就断言 JVM 退出。

## 面试速记卡

> - 类型：Throwable 下主要有 Exception 和 Error。
> - 非受检：RuntimeException、Error 及其子类。
> - 受检：编译期要求交代捕获或传播，不保证能恢复。
> - 处理位置：在有能力决定失败后怎么办的一层处理，保留原因。
> - 清理：关注关闭失败与异常覆盖，catch 之后不默认返回成功。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

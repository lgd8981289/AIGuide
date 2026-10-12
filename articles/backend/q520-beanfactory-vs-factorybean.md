# BeanFactory 和 FactoryBean 有什么区别？为什么 getBean 可能拿到不同对象？

[字节后端面试真题](../companies/bytedance-backend.md) · [百度后端面试真题](../companies/baidu-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q520-beanfactory-vs-factorybean/) · [题库目录](../../README.md)

下面是一段模拟面试对话。

🧑‍💻 面试官：BeanFactory 和 FactoryBean 有什么区别？

🙋‍♂️ 我：一个管理 Bean，一个创建 Bean。

🧑‍💻 面试官：容器本来也会创建 Bean。那 FactoryBean 为什么还需要存在？

🙋‍♂️ 我：它可以封装复杂对象的创建过程，比如创建代理。

🧑‍💻 面试官：调用 getBean("client") 取到的是这个工厂，还是它创建的客户端？工厂是单例，产品就一定是单例吗？

> 先把三个对象分开：「容器」「工厂 Bean」「工厂产物」。两个名称相近的接口，处在不同位置。

## 面试速答（60 秒版）

BeanFactory 是 Spring 容器的基础接口，负责按名称或类型管理、获取 Bean。ApplicationContext 在此基础上提供更多应用能力。

FactoryBean 则是一个可以放进容器的工厂对象，用来定制某个对象的创建过程。它通过 getObject 提供产品，通过 getObjectType 说明产品类型，isSingleton 描述产品是否按单例契约提供。

例如名为 client 的 FactoryBean 创建一个远程客户端代理。通常 getBean("client") 取到产品，getBean("\&client") 才取到工厂本身。[Spring 官方说明](https://docs.spring.io/spring-framework/reference/core/beans/factory-extension.html)。

因此，FactoryBean 本身的作用域和产品是否单例，需要分别判断。它也不是把方法上的 @Bean 换个名字，两者是不同的创建机制。

![BeanFactory 与 FactoryBean](https://note.lgdsunday.club/img/Q520/01-factory-overview.webp)

## 知识点详解：一个工厂怎样替容器提供产品

### BeanFactory 是容器的一套入口

假设服务需要获取一个远程客户端。开发者向容器请求 client，容器要解析名称、处理作用域和依赖，再返回可使用对象。

BeanFactory 描述的就是这类容器能力。它不是某个业务工厂类，也不是只有创建动作的工具。

ApplicationContext 提供更完整的应用上下文，但并没有把 BeanFactory 变成另一个同名概念。回答时说清“容器接口”，比只说“管理 Bean”更容易接住后面的追问。

### FactoryBean 本身也是容器中的对象

普通 Bean 可以直接由构造方法和配置创建。但是有些对象的构建需要复杂参数、代理或第三方库流程，不适合直接暴露全部细节。

这时，可以创建一个 FactoryBean，把构建工作放在工厂内部。容器管理这个工厂，并按约定取出它提供的产品。

假设工厂负责组装一个客户端代理。工厂有连接配置和创建逻辑，产品则是业务服务调用的客户端接口。二者不是同一个对象。

### 为什么同一个名字会拿到不同内容？

Spring 对 FactoryBean 有特定查找规则。普通名称 client 面向产品，\&client 面向工厂本身。

可以把一次查找沿着对象关系讲出来：调用方请求 client，容器先定位注册的工厂，再根据产品契约获得客户端。请求 \&client 时，则明确要求返回那个工厂对象。

名字上的 & 是解引用工厂的约定，不是创建另一个名为 \&client 的独立业务 Bean。也不要和一般字符串转义混淆。

![同一名字，两种取法](https://note.lgdsunday.club/img/Q520/02-name-lookup.webp)

### 两层单例与生命周期不能混为一谈

工厂自身可以按容器作用域管理，产品的共享行为则由 FactoryBean 的契约描述。

所以，工厂是同一个实例，也可以在不同请求中提供不同产品。反过来，判断产品缓存时，还要结合工厂作用域和容器处理，不能只看一个字段。

产品的生命周期也有边界。工厂本身可以获得普通 Bean 的初始化和销毁处理；产品不能直接照搬一整套工厂生命周期。FactoryBean 的 API 明确说明，容器不会自动管理产品的销毁，工厂实现应在需要时安排清理。[FactoryBean API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/FactoryBean.html)。

例如客户端产品持有连接，关闭工厂时如果没有关闭这些连接，就可能留下资源。产品创建成功与资源能正确回收，是两个需要分别检查的结果。

![工厂单例，不等于产品单例](https://note.lgdsunday.club/img/Q520/03-two-lifecycles.webp)

## 面试官继续追问

### FactoryBean 和 @Bean 有什么关系？

都可以参与对象创建，但机制不同。@Bean 标记配置中的工厂方法；FactoryBean 是容器识别的一种特殊 Bean 接口，有产品获取和工厂解引用规则。

不需要为了说明它们不同，就断言哪一种一定更高级。

### getObjectType 为什么重要？

容器按类型查找或装配时，需要知道工厂会提供什么产品类型。返回工厂自己的类型，就可能让类型判断出错。

它可能在较早阶段被调用，因此不应为了返回类型就进行不必要的重型初始化，具体行为还要按 API 契约处理。

### 怎样证明自己理解了这道题？

准备一个简单工厂，分别检查普通名称和 & 名称的实际类型，再重复获取产品，检查单例契约。

资源型产品还应验证容器关闭后是否释放。本篇核对了接口规则，未声称已运行 Spring 工程。

## 面试速记卡

> - BeanFactory：提供容器管理与获取 Bean 的基础接口。
> - FactoryBean：容器中的特殊工厂对象，负责提供产品。
> - 普通名称：取产品；& 名称：取工厂。
> - 单例判断：工厂作用域与产品共享契约分开看。
> - 生命周期：产品资源的销毁责任需要显式安排。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **字节跳动 · 后端（抖音电商） · 实习**：BeanFactory 和 FactoryBean 有什么区别，FactoryBean 的 BeanName 如何区分工厂与返回对象？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353157731001507840)；原帖编辑于 2021-03-29。
- **百度 · 后端 · 原帖未明确批次**：FactoryBean 和 BeanFactory 有什么区别，哪一个是容器？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/792082986211483648)；原帖发布于 2025-09-01。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

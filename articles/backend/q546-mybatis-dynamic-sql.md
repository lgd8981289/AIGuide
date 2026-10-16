# MyBatis 动态 SQL 是怎么实现的？if、where、choose 和 foreach 分别有什么用？

[美团后端面试真题](../companies/meituan-backend.md) · [吉利后端面试真题](../companies/geely-backend.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/backend/q546-mybatis-dynamic-sql/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：MyBatis 动态 SQL 是怎么实现的？

🙋‍♂️ 我：它根据参数判断 XML 中的条件节点，再拼出这次要执行的 SQL。

🧑‍💻 面试官：第一个条件没有值，第二个条件前面留下 AND，会不会报错？

🙋‍♂️ 我：where 节点可以按规则处理前导连接词和是否加 WHERE。

🧑‍💻 面试官：如果 ID 列表为空，把 IN 条件整个省掉，你会不会查到本来不该返回的全部记录？

> 动态 SQL 要同时保证语法能执行、筛选含义没有变；空条件的行为应由接口合同决定。

## 面试速答（60 秒版）

MyBatis 的 XML 动态 SQL 会根据当前参数选择和组合 SQL 片段，再生成带绑定参数的执行内容。

`if` 决定某段条件是否出现，`choose` 从条件分支中选择一项，`where` 在有条件内容时加入 WHERE 并处理相应前导连接词，`foreach` 则根据集合生成重复片段。

例如列表查询可以按状态和 ID 集合增加筛选，但空集合不一定意味着省略筛选。接口如果要求只查询指定 ID，空集合应该返回空结果。参数值也要继续绑定，不应因为使用动态标签就改成任意字符串拼接。

![参数决定这次 SQL 的形状](https://note.lgdsunday.club/img/Q546/01-overview.webp)

## 知识点详解：这次输入，怎样变成这一次 SQL

### Mapper 找到语句以后，还要生成当前 SQL

假设接口传入 status 和 ids。它们每次可能不同，而 Mapper 中只保存了一套语句定义。

动态 SQL 的节点根据这些参数生成当前片段，随后形成执行内容与参数绑定信息。Mapper 代理解决‘调用哪个映射’，动态 SQL 解决‘这次语句长什么样’，两个步骤不要混在一起。

因此，排查时既要看调用了哪个 statement，也要看当前输入生成了哪些条件。

### if、choose 和 where，不是同一种判断

if 可以让多个满足条件的片段同时出现。choose 则类似从若干选项中选择一个匹配分支；不能把两者换用以后还期待筛选完全相同。

where 检查内部是否产生内容，再添加 WHERE 并处理匹配规则中的前导 AND/OR。它不是 SQL 含义修复器，不会帮咱们发现条件写反了。

如果输入合同把空字符串也当没有筛选，要显式处理；只判断 null 与判断 null 或空字符串，会生成不同查询。

![前面的 AND，怎样被组织好](https://note.lgdsunday.club/img/Q546/02-where.webp)

### foreach 处理集合，也要定义空集合

以下查询只允许查询传入 ID 集合；没有有效 ID 时返回空结果。XML 和 SQL 本身不需要补两套语言实现。

```xml
<select id="findByIds" resultType="Record">
  SELECT id, status FROM records
  <where>
    <if test="status != null and status != ''">
      AND status = #{status}
    </if>
    <choose>
      <when test="ids != null and ids.size() > 0">
        AND id IN
        <foreach collection="ids" item="id"
                 open="(" separator="," close=")">
          #{id}
        </foreach>
      </when>
      <otherwise>AND 1 = 0</otherwise>
    </choose>
  </where>
</select>
```

这里选择 1=0，是把‘没有指定 ID，就没有匹配记录’写成明确语义。另一种实现可以在应用入口直接返回空列表，只要与接口合同一致。

![空 ID 集合，不应悄悄扩大范围](https://note.lgdsunday.club/img/Q546/03-empty.webp)

### 生成了正确语法，还要核对绑定与负载

foreach 中的 #{id} 继续形成绑定参数。表名、列名等结构部分不能简单按普通参数处理，应通过服务端明确允许的映射选择。

集合很大时，语句长度、参数数量与执行计划也可能成为问题。可以限制输入、分批查询或选择合适的数据传递方案，再核对合并后的结果与顺序。

测试时记录输入、生成 SQL 和绑定值，分别检查空输入、组合条件与边界规模。不要把生产敏感值不加处理地记录到日志。

依据：[MyBatis Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)。

![SQL 结构和参数值分开](https://note.lgdsunday.club/img/Q546/04-bindings.webp)

## 面试官继续追问

### where 能修复任意 SQL 吗？

它处理特定的前缀组织，不负责检查业务筛选是否正确，也不替代数据库语法与执行验证。

### 空集合可以默认查全部吗？

只有接口明确这样约定才可以。指定 ID 查询或批量修改场景通常不能静默扩大范围。

### 使用 ${} 拼接排序字段就安全了吗？

仍要用服务端白名单映射，不能直接接受任意输入。动态标签不提供自动授权或注入防护。

## 面试速记卡

> - 动态节点：按参数组织本次 SQL。
> - if 可叠加；choose 选择分支。
> - where 管组织，不保证条件语义正确。
> - foreach：集合展开仍使用参数绑定。
> - 空集合与大集合都要明确处理。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **美团 · Java后台开发 · 春招实习（原帖标签）**：MyBatis 动态 SQL 如何实现？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/353154361599664128)；原帖编辑于 2018-05-02。
- **吉利 · 后端开发（数字化） · 原帖未明确批次**：MyBatis 怎样解析 SQL，静态 SQL 与动态 SQL 的底层机制有什么区别？（题意整理）。[面经来源](https://www.nowcoder.com/feed/main/detail/6fdc176992134a5187e4880131883e46)；原帖编辑于 2025-09-24。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

# Django 的 makemigrations 和 migrate 有什么区别？迁移冲突怎么处理？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q629-django-makemigrations-migrate/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：makemigrations 和 migrate 的区别是什么？

🙋‍♂️ 我：前者生成迁移文件，后者按迁移计划修改数据库。

🧑‍💻 面试官：我手工给数据库加了列，makemigrations 会自动发现并生成对应历史吗？

🙋‍♂️ 我：它主要比较模型与迁移历史，不是对线上数据库做万能差异扫描。

🧑‍💻 面试官：两个人从同一迁移分出两个分支怎么办？数据迁移又该导入现在的模型，还是使用当时的模型状态？

> 迁移记录的是可执行的模型历史；文件、依赖图和数据库实际状态要一起对齐。

## 面试速答（60 秒版）

makemigrations 根据当前模型与迁移历史的差异生成迁移文件；migrate 则按依赖计划把迁移应用到数据库。生成文件不等于数据库已经改好，手动改库也不会自动变成正确的迁移历史。

迁移之间通过 dependencies 形成依赖图。不同分支产生多个末端时，需要检查操作是否兼容，再安排合并迁移，不能只改编号让文件看起来顺序正常。

数据迁移要用迁移框架提供的历史模型，避免以后模型改了，旧迁移就无法重跑。回退也需要相应可逆操作，删字段后丢失的数据不会凭空回来。

部署时还要考虑新旧代码并存、锁表和运行时间。先在临时数据库验证迁移计划、升级与可支持的回退，不用 fake 随意掩盖状态不一致。

![先生成历史，再执行数据库计划](https://note.lgdsunday.club/img/Q629/01-overview.webp)

## 知识点详解：模型变更，怎样成为可重放的数据库历史

### 生成文件与执行数据库操作，分两步

假设给 Product 增加一个可空的说明字段。修改 models.py 以后，makemigrations 会生成包含相应操作的文件，文件需要代码审阅和版本管理。

migrate 读取依赖与数据库已经登记的迁移，计算待执行计划，再应用操作。两者分开，让开发阶段能审阅变化，部署阶段能明确执行什么。

makemigrations 主要依据模型与迁移文件历史比较，不会把任意手工改库都自动转换成准确历史。数据库和登记状态偏离时，需要核查实际结构，不能靠再生成一个同名文件掩盖。

### 依赖形成图，不只是编号排序

下面命令用于已有 Django 项目。先查看，再执行；不要直接对生产数据库练习。

```bash
python manage.py makemigrations catalog
python manage.py showmigrations catalog
python manage.py migrate --plan
# 审阅计划并在临时环境验证后再执行
python manage.py migrate
```

迁移编号帮助阅读，真正关系还包含 dependencies。两个分支都依赖同一个父迁移，可能各自新增字段，也可能对同一字段做冲突修改。

兼容的分支可以通过合并迁移建立后续共同历史；不兼容操作要先调整方案。不能只把其中一个文件重命名，假装真实依赖与数据变化已经解决。

![两个分支，先检查再合并](https://note.lgdsunday.club/img/Q629/02-graph.webp)

### 数据迁移需要当时的模型

RunPython 的回调会得到历史 app registry。下面示例假设迁移所在 app 为 catalog，前一迁移已定义 Product 与 note 字段。

#### Python

```python
from django.db import migrations

def fill_note(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    alias = schema_editor.connection.alias
    Product.objects.using(alias).filter(note__isnull=True).update(note="")

class Migration(migrations.Migration):
    dependencies = [("catalog", "0002_product_note")]
    operations = [migrations.RunPython(fill_note)]
```

不要改成从当前 models.py 导入 Product，否则几年后当前模型多了字段，旧迁移重放时数据库却还没那些列，就可能失败。历史模型也不会自动带齐当前自定义方法。

本例没有 reverse\_code，因此这个数据操作不应宣称可逆。空字符串究竟来自原数据还是这次更新，已经不能只凭当前值区分。这是 Django/Python 专属机制，没有官方 TS RunPython API。

![旧迁移，使用当时那份模型](https://note.lgdsunday.club/img/Q629/03-historical.webp)

### 部署兼容和回退，都要提前想

数据库结构改好到新代码全部部署，中间可能仍有旧实例。先扩展兼容字段、逐步迁移读写、最后清理旧结构，比一边运行旧代码一边删除它需要的列更稳妥。

DDL 是否能在事务内回退、执行会锁多久，与数据库及操作有关。即使结构可以还原，被删除的数据也需要恢复方案。migrate --fake 只改变登记等行为，不替你执行真实结构变化，使用前必须确认状态。

验证在临时数据库进行，包含从旧版本升级、空库重放和计划支持的回退，观察实际结构与数据。成功生成文件不算完成验证。

依据：[Django 迁移、依赖与历史模型](https://docs.djangoproject.com/en/5.2/topics/migrations/)、[RunPython 与可逆性](https://docs.djangoproject.com/en/5.2/ref/migration-operations/#runpython)、[迁移管理命令](https://docs.djangoproject.com/en/5.2/ref/django-admin/#migrate)。

![新旧代码并存，数据库先保持兼容](https://note.lgdsunday.club/img/Q629/04-deployment-v2.webp)

## 面试官继续追问

### 改文件编号就能合并冲突吗？

不能，依赖图和实际操作都要兼容，名字顺了不代表状态正确。

### 为什么旧迁移不用现在的模型？

重放时数据库处于历史阶段，当前模型可能依赖尚未存在的字段或方法。

### 删除列再回退，数据会回来吗？

不能自动恢复已经丢失的数据，需要可逆逻辑或备份恢复方案。

## 面试速记卡

> - makemigrations 生成历史操作，migrate 应用数据库计划。
> - 模型历史不是万能线上数据库差异扫描。
> - dependencies 决定迁移关系。
> - RunPython 用历史模型并考虑数据库 alias。
> - 兼容发布与可逆回退，需要独立验证。

## 公司面试真题

这道题暂未收录可核验的公司真题来源。你可以先阅读本文解析，或浏览已收录的公司面试真题。

[浏览公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

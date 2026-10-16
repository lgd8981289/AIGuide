# Django 的 MTV 是什么？一个请求怎样经过路由、中间件和视图？

[腾讯测试开发面试真题](../companies/tencent-test-development.md)

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/python/q627-django-mtv-request-middleware/) · [题库目录](../../README.md)

*下面是模拟面试对话，用来讲解本题，不是真实面经。*

🧑‍💻 面试官：Django 的 MTV 分别负责什么？

🙋‍♂️ 我：Model 管数据，Template 管展示，View 处理请求并产生响应。

🧑‍💻 面试官：浏览器访问页面，先直接调用 View 吗？

🙋‍♂️ 我：还要经过服务器入口、中间件与路由匹配。

🧑‍💻 面试官：如果第二层中间件直接返回 403，后面的视图和所有中间件还会执行吗？

> 沿着一次请求走进去，再沿响应走出来，MTV 和中间件的职责就容易分清了。

## 面试速答（60 秒版）

Django 的 MTV 是职责划分。Model 表达数据与相关规则，Template 组织展示，View 接收请求并决定返回什么；URL 路由负责把请求路径映射到相应视图。

一次正常请求进入 Django 后，按配置顺序经过中间件，再由框架路由到视图。视图可以查询模型并渲染模板，也可以直接返回 JSON，不要求每次都把三部分用满。

响应通常沿已经进入的中间件反向返回。如果某层不调用 get\_response，直接生成响应，内层中间件与视图就不会看到这次请求。

因此排查时要确认请求停在哪一层、路由命中谁、视图是否真正执行。异步部署还需要检查中间件的同步与异步支持，不能只把视图改成 async 就认为全链路一致。

![沿一次请求，看清每个职责](https://note.lgdsunday.club/img/Q627/01-overview.webp)

## 知识点详解：请求进来以后，谁先处理它

### MTV 是分工，不是三个必经站点

假设页面展示商品列表。Model 定义商品数据，View 处理本次请求、查询需要的记录，Template 把结果组织成 HTML。

那么返回 JSON 的接口呢？它仍然可以使用 Model 与 View，但不用模板。一个简单健康检查也可能不查数据库。MTV 不要求每次请求都经过模型、模板、视图三个盒子。

View 也不是只负责画页面，它在 Django 术语中决定本次请求的处理与响应。不要拿另一框架里 View 的含义直接套过来。

### 路由把路径交给具体视图

下面片段分别位于 Django 项目的 views.py 和 urls.py，按已有项目配置运行。

#### Python

```python
# views.py
from django.http import JsonResponse

def item_list(request):
    return JsonResponse({"items": []})
```

#### Python

```python
# urls.py
from django.urls import path
from .views import item_list

urlpatterns = [path("items/", item_list)]
```

匹配的路径进入 item\_list，视图得到 HttpRequest，返回 HttpResponse 的相应实现。未匹配路由与视图内部错误是不同问题，不能只看最终状态码猜执行到了哪里。

这是 Django 项目片段，不是独立脚本，也没有官方同名 TS urlpatterns。代码核验使用最小 Django 配置与请求测试，不把框架机制翻译成假 API。

### 中间件包住后续处理

中间件可以在调用后续 get\_response 前检查请求，也可以在得到响应后加工。下面是同步中间件示例，假设已注册到 MIDDLEWARE。

#### Python

```python
from django.http import JsonResponse

class GateMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path == "/blocked/":
            return JsonResponse({"error": "教学拒绝示例"}, status=403)
        response = self.get_response(request)
        response["X-Demo"] = "passed"
        return response
```

拒绝分支没有调用 get\_response，因此后面的处理不执行。正常分支在返回时添加响应头，本例的拒绝响应没有走到那段添加逻辑。

若配置顺序是 A、B、C，正常请求依次进入，响应反向出来；B 提前返回，C 与视图不会执行。只有已经进入的外层得到这个响应，不能说所有层都照常执行。实际框架还有视图、异常与模板响应钩子，不应把教学主线图当作完整源码时序。

![进了哪些层，响应就从哪些层回来](https://note.lgdsunday.club/img/Q627/02-onion.webp)

### 排查要保留进入与返回的证据

给相关中间件与视图记录同一请求标识，可以确认请求走到哪一层、何处生成响应。但记录请求时要过滤令牌与敏感字段。

同步中间件默认只声明同步能力。异步链路需要按 Django 规则标记支持方式，框架适配可能带来额外开销。验证时测正常路由、未匹配、提前返回及响应头，而不是只看浏览器最后有没有页面。

依据：[Django MTV 概览](https://docs.djangoproject.com/en/5.2/intro/overview/)、[URL 调度](https://docs.djangoproject.com/en/5.2/topics/http/urls/)、[中间件与短路](https://docs.djangoproject.com/en/5.2/topics/http/middleware/)。

![先找请求停在哪里](https://note.lgdsunday.club/img/Q627/03-hooks-v2.webp)

## 面试官继续追问

### 返回 JSON 还必须渲染 Template 吗？

不需要。MTV 是职责划分，不要求每次请求使用所有组成部分。

### B 提前返回，C 的响应处理还会执行吗？

C 没有被进入，不会看到该请求与响应。外层 A 仍得到 B 的响应。

### 中间件定义顺序会影响功能吗？

会，某些层依赖前面准备的信息，请求与响应顺序也受到包装关系影响。

## 面试速记卡

> - Model 管数据，Template 管展示，View 处理与响应。
> - URL 路由匹配具体视图。
> - 中间件按配置进入，响应沿已进入的层反向返回。
> - 提前返回会跳过内层与视图。
> - 同步/异步支持与适配需要按配置验证。

## 公司面试真题

真题根据求职者公开面经整理，题意经过概括，非逐字原话或公司官方题库；本文为 Sunday 的独立解析。

- **腾讯 · 测试开发 · 2022实习（原帖标题；腾讯为日常实习）**：Django 的 MTV 模式是什么？（题意整理）。[面经来源](https://www.nowcoder.com/discuss/364846466995679232)；正文记录 3 月腾讯日常实习；原帖编辑于 2022-06-10。

[浏览更多公司面试真题](https://note.lgdsunday.club/companies/)

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

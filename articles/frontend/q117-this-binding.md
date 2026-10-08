# JavaScript 的 this 指向谁？箭头函数、call、apply、bind 有什么区别？

> 作者：程序员Sunday · [Sunday面试指南](https://note.lgdsunday.club/)
>
> [在线阅读与配图](https://note.lgdsunday.club/frontend/q117-this-binding/) · [题库目录](../../README.md)

<!-- 以下对话为教学模拟，非真实面经。 -->

🧑‍💻 面试官：普通函数里的 this，由什么决定？

🙋‍♂️ 我：一般看函数怎么调用。obj.run() 里的 this 是 obj。

🧑‍💻 面试官：那把 obj.run 赋给另一个变量，再调用呢？

🙋‍♂️ 我：这时调用表达式里已经没有 obj，需要重新判断。

🧑‍💻 面试官：如果换成箭头函数，再用 call(obj) 调用，是不是就能恢复？

> this 要沿着「调用方式」判断；箭头函数则沿定义时的外层作用域寻找，不能靠 call 再指定。

## 面试速答（60 秒版）

JavaScript 的普通函数，this 通常由调用方式决定。以 obj.run() 调用时，obj 是接收对象；把 run 单独拿出来调用，就不会自动记住原来的 obj。

call 和 apply 都可以在调用普通函数时指定 this，区别主要在于参数怎么传。bind 会返回一个绑定后的函数，方便以后再调用。

箭头函数没有自己的 this，它使用定义位置外层的 this。因此，call、apply 和 bind 不能把箭头函数的 this 改成另一个对象。

实际项目中，最容易出问题的是把对象方法交给定时器或其他回调。需要保留实例时，可以绑定方法，或者在合适的实例作用域里用箭头函数包装。还要说明严格模式、模块和运行环境，不能把所有独立调用都说成指向 window。

![普通函数按调用方式取得 this，箭头函数沿外层作用域取得 this](https://note.lgdsunday.club/img/Q117/00-60s-overview.webp)

## 知识点详解：方法还是那个方法，接收对象为什么丢了？

### 把方法拿出来，改变的是调用表达式

假设咱们有一个用户对象，showName 方法会读取 this.name。执行 user.showName()，调用表达式提供了 user 这个接收对象。

现在写 const show = user.showName，再执行 show()。赋值只取出了函数，并没有把 user 一起打包过去。

在严格模式的普通函数中，这种独立调用的 this 是 undefined；继续读取 this.name，就会报错。非严格模式还有不同规则，浏览器顶层脚本和 ES Module 也不能混着看。

这里真正需要检查的是最后那次调用，不是函数最早放在哪个对象里。

### call、apply、bind 分别改变什么？

call 立即调用函数，参数逐个传。apply 也立即调用，但把参数放在数组或类数组中。bind 则先返回一个新函数，之后再调用。

```typescript
function readName(this: { name: string }, prefix: string) {
  return prefix + this.name;
}
const user = { name: "Lin" };
console.log(readName.call(user, "Hi "));   // Hi Lin
console.log(readName.apply(user, ["Hi "])); // Hi Lin
const bound = readName.bind(user, "Hi ");
console.log(bound());                      // Hi Lin
```

这是 JavaScript 调用语义的示例。Python 的绑定方法和参数规则不同，没有同义的 call/apply/bind API，不能只换语法来解释这道题。

bind 也可以预先填一部分参数。但绑定后的普通调用再使用 call 指定其他 this，通常不会覆盖原来的绑定。构造调用又有单独规则，需要与普通调用区分。

### 箭头函数为什么不会听 call 的？

箭头函数创建时，没有给自己建立独立的 this。执行函数体时，沿外层词法作用域取得 this。

例如类的方法里定义 const later = () => this.name，later 可以继续使用该次方法调用中的实例。把它作为回调传出去，外部怎么调用 later，不会重新给它指定 this。

但是，在普通对象字面量里写 show: () => this.name，也不意味着 this 就是这个对象。对象字面量不会自动创建一个供箭头函数捕获的 this。

所以，“箭头函数能保留 this”还得接着问：保留的是哪个外层 this？

### 回调里保留实例，也要注意引用身份

如果注册事件时写 listener = method.bind(instance)，清理时要继续使用这个 listener。再次调用 bind，会产生另一个函数；把它交给 removeEventListener，未必能删除之前注册的监听。

可以先保存绑定结果，再注册与移除。这个细节关系到页面关闭后，旧监听会不会继续运行。

验证时，把方法调用、独立调用、call、bind 和箭头函数分别执行，打印接收对象或结果。不要只测一段刚好能工作的对象方法。

本题机制参考：[MDN this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)。

![对象方法取出后丢失接收对象，保存绑定回调可同时支持调用与清理](https://note.lgdsunday.club/img/Q117/01-detail.webp)

## 面试官继续追问

### 对象方法换一个名字赋给其他对象呢？

例如 other.show = user.show，再调用 other.show()。普通函数会以 other 为接收对象，名称和最早的存放位置都不决定 this。

### class 方法是不是会自动绑定实例？

不会。类方法通常在严格模式下执行，取出来独立调用仍可能丢失 this。需要绑定或使用合适的包装方式。

### 箭头函数能用 new 吗？

不能作为构造函数使用。不要为了省掉绑定，把所有构造函数或原型方法都改成箭头函数。

## 面试速记卡

> - 普通函数：先看最终调用表达式。
> - call/apply：立即调用并指定接收对象，传参方式不同。
> - bind：保存普通调用的接收对象，返回新函数。
> - 箭头函数：使用外层 this，不能重新绑定。
> - 回调清理：保存绑定后的函数，别用新函数去删旧监听。

---

本文收录于 [Sunday面试指南](https://note.lgdsunday.club/)。转载请注明作者与原文链接。

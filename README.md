# FGO_AnyProxy

通过AnyProxy修改FGO战斗数据。

需要使用我的Xposed模块xfgo来过sign验证

模块地址 [xfgo](https://github.com/locbytes/xfgo)

可以很方便的根据自己的需求修改数据，代码中有必要的注释信息。

### 关于撤退胜利

使用该功能必须使用xfgo模块v1.2版，否则请注释掉相关代码并使用v1.1版xfgo模块。

只要使用的是v1.2版的xfgo模块，就必须开启撤退胜利的功能。

## 使用方法：

```
anyproxy --intercept --rule ./rule.js
```

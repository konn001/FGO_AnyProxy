# FGO_AnyProxy

捐赠我以支持我继续开发维护 [捐赠地址](https://github.com/locbytes/donation)

通过AnyProxy修改FGO战斗数据。

需要使用我的Xposed模块xfgo来过sign验证

模块地址 [xfgo](https://github.com/locbytes/xfgo)

可以很方便的根据自己的需求修改数据，代码中有必要的注释信息。

### 关于撤退胜利

当前已更新至v1.3版，需要同步使用xfgo模块v1.3版

如果不使用撤退胜利功能，请注释掉相关代码并使用v1.1版xfgo模块。

## 使用方法：

从v1.3版开始anyproxy是作为一个npm模块引入使用的

代码中有判断是否有已生成根证书的逻辑，如果是Windows系统且未生成根证书，会在生成完成后自动打开目录。

```bash
npm i anyproxy  // 安装anyproxy
```

启动

```bash
node fgo.js
```

代码中对于生成随机数的服务端地址`randomServerAddress`默认设定为`com.locbytes.xfgo.random`

如果不修改代码则对应的xfgo模块里应该填写为`http://com.locbytes.xfgo.random/`

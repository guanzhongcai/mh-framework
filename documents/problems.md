问题
========
5.30

A：
redis只做高速缓存，数据从mongo加载到redis后，以后读都从redis开始，并设置TTL，修改操作，都先做redis，再做mongo，集群分片版本

B:
redis使用[混合存储型实例](https://help.aliyun.com/document_detail/126650.html?spm=5176.11451019.101.3.2ca122bcEwGCrv)
- 验证
- 开一台单组，开一台新的

一个组=gatewayx1 + loginxN + gamexN

客户端先到gateway取自己属于哪一组服：
- 客户端提供win32/ios/android区分不同env环境，gateway区分玩家属于哪个login&game

后续方案
=========
# 目前完成
基本完成微服务框架改造，包括客户端核心服务的框架改造，和服务的配置中心、监控中心、管理后台

# 后续工作
- 搭建一套外网服务器，跑现在的微服务
- redis采用混合存储型实例
- 提供新的redis访问模块，兼容现在的业务API使用
- mongo只做数据落地，暂还以redis数据为准

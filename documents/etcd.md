etcd v3
======================
- [官网]()https://etcd.io/)
- [etcd-manager](https://www.npmjs.com/package/etcd-manager)

## etcd v3 ubuntu环境安装
   - 下载3.4.1版本:
   ```bash
    export RELEASE="3.4.1"
    wget https://github.com/etcd-io/etcd/releases/download/v${RELEASE}/etcd-v${RELEASE}-linux-amd64.tar.gz
    tar xvf etcd-v${RELEASE}-linux-amd64.tar.gz
    cd etcd-v${RELEASE}-linux-amd64
    sudo mv etcd etcdctl /usr/local/bin 
    etcd --version
   ```
    
   + 使用下面的命令启动服务（请写成start.sh脚本）：
   ```bash
        nohup etcd --name s1 --data-dir /root/etcd/etcd-data --listen-client-urls http://0.0.0.0:2379 --advertise-client-urls http://0.0.0.0:2379 --listen-peer-urls http://0.0.0.0:2380 --initial-advertise-peer-urls http://0.0.0.0:2380 --initial-cluster s1=http://0.0.0.0:2380 &
   ```
## 开启登录验证
   - [教程](https://github.com/etcd-io/etcd/blob/master/Documentation/op-guide/authentication.md)
   - 建立用户名和角色并开启登录验证
```bash
    etcdctl user add root #会提示输入初始密码
    etcdctl role add root
    etcdctl user grant-role root root
    etcdctl auth enable
```

## 常用操作命令
   + 使用etcd v3版本、CRUD
```bash
    export ETCDCTL_API=3
    etcdctl --user root:goodluck put account-1 '{"host": "192.168.1.119", "port":9001}'
    etcdctl --user root:goodluck get account-1
    etcdctl --user root:goodluck del account-1
    etcdctl --user root:goodluck get account --prefix    
    etcdctl --endpoints http://localhost:2379 get key
    etcdctl --endpoints http://localhost:2379 get key
```

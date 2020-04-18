## 运行环境
```nodejs11.11.0及以上```

## 安装
在项目目录使用终端执行
```bash
npm install 
```

安装依赖

## 运行
### 服务端
* 用于处理所有在线用户以及当前播放的时间
* 在项目目录终端执行
```
npm run server
```


### 客户端
* 新建一个终端
* 在项目目录终端执行
```
npm run client
```

### 端口修改
* 在server.js中修改port变量为需要的端口
* 在web目录下的index.html中，修改script部分的port为服务器的设置的端口，端口一致才能通信

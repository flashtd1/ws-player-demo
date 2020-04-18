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

### 端口修改
* 在server.js中修改port变量为需要的端口
* 在web目录下的index.html中，修改script部分的port为服务器的设置的端口，端口一致才能通信

### 其他说明
* audio标签中的controls是为了方便查看状态，使用的时候，点下方的播放按钮来通知音乐播放
* 由于audio标签在chrome中属于即将废弃的标签，所以只能在edge、IE10以上，Firefox等浏览器中运行，chrome浏览器在播放之后进入不会跳转到最新的时间
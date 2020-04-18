const io = require('socket.io')()

const port = 3000       // 服务器运行的端口号
let clients = {}        // 所有在线的客户端列表
let currentHost = null  // 当前的主唱，主唱的时间是其他所有人的时间参考
let currentTime = 0     // 当前音乐播放的时间

// 有客户端连接
io.on('connection', client => {
    const welcomeMessage = `欢迎${client.id}进入`
    console.log(welcomeMessage)

    // 初始化客户端，给名字，是否在唱歌的状态
    Object.assign(client, {
        name: '未知',
        singing: false
    })

    // 将客户端加入在线列表
    clients[client.id] = client
    
    // 500毫秒后通知所有客户端在线人数更新
    setTimeout(() => {
        updatelist()
    }, 500)
    
    // 当客户端收到事件的时候的处理方法
    client.on('event', data => {
        switch(data.name) {
            // 客户端请求重命名
            case 'rename': 
                client.name = data.content
                updatelist()
                break
            // 客户端告诉服务器自己是否播放音乐
            case 'sing':
                client.singing = data.content
                // 不唱了
                if (!data.content && currentHost && currentHost.id === client.id) {
                    // 如果这个客户端是主唱，那么就要找下一个主唱
                    let result = Object.values(clients).filter(item => item.id != client.id && item.singing === true)[0]
                    if (result) {
                        currentHost = result
                    } else {
                        currentHost = null  // 如果没有人在唱歌了
                        updateTime('pause') // 通知所有人暂停音乐
                    }
                }

                // 如果目前没有主唱，那么这个客户端就是主唱
                if (data.content && currentHost === null) {
                    currentHost = client
                }

                // 通知所有客户端更新在线用户状态
                updatelist()
                break
            // 客户端更新音乐播放时间
            case 'updatetime': 
                // 如果当前客户端是主唱，才能更新时间
                if (currentHost && currentHost.id === client.id) {
                    console.log('主唱更新时间', data.content)
                    currentTime = data.content.time
                    // 通知所有客户端当前的播放时间
                    updateTime('play')
                }
                break
            // 其他情况
            default: 
                console.log(`${client.id}对我说：${data.content}`)
                break
        }
    })

    // 当有客户端断线
    client.on('disconnect', () => {
        console.log(`${client.id}掉线了`)
        
        // 删除在线用户列表
        delete clients[client.id]
        // 如果掉线的客户端是主唱，那就找下一个主唱
        if(currentHost && client.id === currentHost.id) {
            let result = Object.values(clients).filter(f => f.singing)[0]
            if (result) {
                currentHost = result
            } else {
                currentHost = null // 没有其他在线用户在唱歌，就没有主唱
            }
        }

        // 更新在线用户列表
        setTimeout(() =>{
            updatelist()
        }, 500)
    })
})

// 更新客户端列表函数
const updatelist = () => {
    let clientsArr = Object.values(clients)
    // 发送广播
    io.emit('broadcast', {
        name: 'updatelist',
        content: clientsArr.map((client) => {
            return {
                id: client.id,
                name: client.name,
                singing: client.singing,
                isHost: client.id === (currentHost || {}).id || 0
            }
        })
    })
}

// 判断是否有其他人在唱歌
const hasOtherSinger = () => {
    let clientsArr = Object.values(clients)
    if (currentHost) {
        let other = clientsArr.filter((client) => {
            return client.id !== currentHost.id
        }).filter((client) => {
            return client.singing
        })
        return other.length > 0
    }
    return false
}

const updateTime = (state) => {
    io.emit('broadcast', {
        name: 'updateTime',
        content: {
            time: currentTime,
            state: state,
            hasOtherSinger : hasOtherSinger()
        }
    })
}

io.listen(port)
console.log(`服务器运行在http://localhost:${port}`)
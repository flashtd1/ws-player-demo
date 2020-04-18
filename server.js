const io = require('socket.io')()

const port = 3000

let clients = {}

let isSinging = false

let currentHost = null
let currentTime = 0

io.on('connection', client => {
    //console.log(client)
    const welcomeMessage = `欢迎${client.id}进入`
    console.log(welcomeMessage)
    Object.assign(client, {
        name: '未知',
        singing: false
    })

    clients[client.id] = client
    setTimeout(() => {
        updatelist()
    }, 1000)
    
    client.on('event', data => {
        switch(data.name) {
            case 'rename': 
                client.name = data.content
                updatelist()
                break
            case 'sing':
                client.singing = data.content
                // 不唱了
                if (!data.content && currentHost && currentHost.id === client.id) {
                    let result = Object.values(clients).filter(item => item.id != client.id && item.singing === true)[0]
                    console.log(result)
                    if (result) {
                        currentHost = result
                    } else {
                        currentHost = null
                        updateTime('pause')
                    }
                }
                // 换成主唱
                if (data.content && currentHost === null) {
                    currentHost = client
                }
                updatelist()
                break
            case 'updatetime': 
                if (currentHost && currentHost.id === client.id) {
                    console.log('主唱更新时间', data.content)
                    currentTime = data.content.time
                    updateTime(currentHost.singing ? 'play' : 'pause')
                }
                break
            default: 
                console.log(`${client.id}对我说：${data.content}`)
                break
        }
    })

    client.on('disconnect', () => {
        console.log(`${client.id}掉线了`)
        
        delete clients[client.id]
        if(currentHost && client.id === currentHost.id) {
            let result = Object.values(clients).filter(f => f.singing)[0]
            if (result) {
                currentHost = result
            } else {
                currentHost = null
            }
        }
        setTimeout(() =>{
            updatelist()
        }, 500)
    })
})

const updatelist = () => {
    let clientsArr = Object.values(clients)
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

const hasSinger = () => {
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
            hasOtherSinger : hasSinger()
        }
    })
}

io.listen(port)
console.log(`服务器运行在http://localhost:${port}`)
const Koa = require('koa')
const app = new Koa()
const server = require('http').createServer(app.callback())
const io = require('socket.io')(server)
const serve = require('koa-static')
app.use(serve('web'))

const port = 8085

let clients = {}


let currentHost = null
let currentTime = 0

io.on('connection', client => {
    //console.log(client)
    const welcomeMessage = `welcome: ${client.id}`
    console.log(welcomeMessage)
    Object.assign(client, {
        name: 'Unknown',
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
                    console.log('main singer update time', data.content)
                    currentTime = data.content.time
                    updateTime(currentHost.singing ? 'play' : 'pause')
                }
                break
            default: 
                console.log(`${client.id} says：${data.content}`)
                break
        }
    })

    client.on('disconnect', () => {
        console.log(`${client.id} off line`)
        
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

server.listen(port)
console.log(`server run on http://localhost:${port}`)
import express from 'express'
import { Server } from "socket.io"
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 3500
const ADMIN = "Admin"

const app = express()

app.use(express.static(path.join(__dirname, "public")))

const expressServer = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})

// state
const UsersState = {
    users: [],
    addUser: function (usersArray) {
        this.users = usersArray
    }
}

const io = new Server(expressServer, {
    cors: {
        origin: "*"
    }
})

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`)

    // emit message only to the user that connected
    socket.emit('message', "Welcome to OwlChat")

    // Upon connection to all others
    socket.broadcast.emit('message', `User ${socket.id.substring(0, 5)} connected`)

    // Listening for message event
    socket.on('message', data => {
        console.log(data)
        io.emit('message', `${socket.id.substring(0,5)}: ${data}`)
    })

    // When user disconnects, message to all others
    socket.on('disconnect', () => {
        socket.broadcast.emit('message', `User ${socket.id.substring(0, 5)} Disconnected`)
    })

    // Listen for activity
    socket.on('activity', (name) => {
        socket.broadcast.emit('activity', name)
    })
})

function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        }).format(new Date())
    }
}

// User functions
function activateUser(id, name, room) {
    const user = {
        id,
        name,
        room
    }
    UsersState.addUser([...UsersState.users.filter(user => user.id !== id),
        user
    ])
    return user
}

function userLeaves(id) {
    UsersState.addUser(
        UsersState.users.filter(user => user.id !== id)
    )
}

function getCurrentUser(id) {
    return UsersState.users.find(user => user.id === id)
}

function getRoomUsers(room) {
    return UsersState.users.filter(user => user.room === room)
}

function getRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)))
}
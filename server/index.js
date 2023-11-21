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
    socket.emit('message', buildMsg(ADMIN, "Welcome to the OwlChat!"))

    socket.on('enterRoom', ({ name, room }) => {
        // leave previous room
        const prevRoom = getCurrentUser(socket.id)?.room

        if (prevRoom) {
            socket.leave(prevRoom)
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} has left the room`))
        }
        const user = activateUser(socket.id, name, room)

        // Can't update room before joining
        if (prevRoom) {
            io.to(prevRoom).emit('roomUsers', {
                users: getRoomUsers(prevRoom)
            })
        }
        // join room
        socket.join(user.room)

        // emit message to the user that connected
        socket.emit('message', buildMsg(ADMIN, `Welcome to ${user.room}!`))

        // emit message to all others
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`))

        // Update user list for room
        io.to(user.room).emit('roomUsers', {
            users: getRoomUsers(user.room)
        })

        // Update room list for everyone
        io.emit('roomList', {
            rooms: getRooms()
        })
    })


    // Listening for message event
    socket.on('message', ({ name, text }) => {
        const room = getCurrentUser(socket.id)?.room
        if (room) {
            io.to(room).emit('message', buildMsg(name, text))
        }
    })

    // When user disconnects, message to all others
    socket.on('disconnect', () => {
        const user = getCurrentUser(socket.id)
        userLeaves(socket.id)
        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`))
            io.to(user.room).emit('roomUsers', {
                users: getRoomUsers(user.room)
            })

            io.emit('roomList')
        }

        console.log(`User ${socket.id} disconnected`)
    })

    // Listen for activity
    socket.on('activity', (name) => {
        const room = getCurrentUser(socket.id)?.room
        if (room) {
            socket.broadcast.to(room).emit('activity', name)
        }
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
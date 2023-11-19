const socket = io('ws://localhost:3500')


const msgInput = document.querySelector('#message')
const nameInput = document.querySelector('#name')
const chatRoom = document.querySelector('#room')
const activity = document.querySelector('.activity')
const usersList = document.querySelector('.user-list')
const roomList = document.querySelector('.room-list')
const chatDisplay = document.querySelector('.chat-display')

function sendMessage(e) {
    e.preventDefault()
    if (nameInput.value && msgInput.value && chatRoom.value) {
        socket.emit('message', {
            "name": nameInput.value,
            "text": msgInput.value
        })
        msgInput.value = ""
    }
    msgInput.focus()
}

function joinRoom(e) {
    e.preventDefault()
    if (chatRoom.value && nameInput.value) {
        socket.emit('enterRoom', {
            "name": nameInput.value,
            "room": chatRoom.value
        })
        }
    chatRoom.focus()
}

document.querySelector('.form-msg')
    .addEventListener('submit', sendMessage)

document.querySelector('.form-join')
    .addEventListener('submit', joinRoom)

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', nameInput.value)
})


// Listen for messages
socket.on("message", (data) => {
    activity.textContent = ""
    const li = document.createElement('li')
    li.textContent = data
    document.querySelector('ul').appendChild(li)
})

msgInput.addEventListener('keypress', () => {
    socket.emit('activity', socket.id.substring(0, 5))
})

let activityTimer
socket.on("activity", (name) => {
    activity.textContent = `${name} is typing...`

    clearTimeout(activityTimer)
    activityTimer = setTimeout(() => {
        activity.textContent = ""
    }, 1000)
})
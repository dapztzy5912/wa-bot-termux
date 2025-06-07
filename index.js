const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const readline = require('readline')

const { state, saveState } = useSingleFileAuthState('./auth.json')

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = new Boom(lastDisconnect?.error))?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect)
            if (shouldReconnect) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('Bot is connected')
            sendMessages(sock)
        }
    })
}

function sendMessages(sock) {
    const rl = readline.createInterface({
        input: fs.createReadStream('daftar.txt'),
        crlfDelay: Infinity
    })

    rl.on('line', async (line) => {
        const [number, message] = line.split('|')
        if (!number || !message) return console.log(`Format salah: ${line}`)
        const jid = number + '@s.whatsapp.net'
        await sock.sendMessage(jid, { text: message.trim() })
        console.log(`Pesan terkirim ke ${number}`)
    })

    rl.on('close', () => {
        console.log('Semua pesan selesai dikirim.')
    })
}

startBot()

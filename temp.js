const qrcode = require('qrcode-terminal');

const { Client, MessageMedia } = require('whatsapp-web.js');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');

    client.sendMessage("917227875933@c.us", "Hello world from bot");
    client.sendMessage("919512806147@c.us", "Hello world from bot");
    client.sendMessage("917227875933@c.us", MessageMedia.fromFilePath("C:\\Users\\patel\\Downloads\\bot.jpg"), { caption: "Image from bot" });
    client.sendMessage("919512806147@c.us", MessageMedia.fromFilePath("C:\\Users\\patel\\Downloads\\bot.jpg"), { caption: "Image from bot" });

});

client.on('message', message => {
    if (message.body === '!ping') {
        console.log(message.from);
        client.sendMessage(message.from, 'pong');
    }
});

client.initialize();
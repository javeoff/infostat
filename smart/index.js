const Discord = require('discord.js');
const client = new Discord.Client();

function createEmbed(title, desc, footer, img, author, asrc) {
    const Embed = new Discord.MessageEmbed({
    title: title,
    description: desc,
    footer: footer,
    })

    Embed.setColor("DARK_BUT_NOT_BLACK")
    Embed.setImage(img)
    Embed.setAuthor(author,asrc)
    Embed.setFooter(footer)

    return Embed
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    const ch = client.channels.cache.find(ch => ch.id === "771006316881248266")
    await ch.messages.cache.delete()
    let title, desc, footer, img, author, asrc

    title = 'Аниме смайлики'
    desc = "**:rainbow: Без нитро** (Добавь сервер, Перезапусти дискорд)\n"
    desc += "**:green_apple:  Анимированные смайлы:** отсутствуют\n\n"
    desc += '[Добавить сервер](https://discord.gg/RH2JRCN)'
    footer = ''
    img = 'https://cdn.discordapp.com/attachments/770423722238410822/770998605686636554/2020-10-28_16.11.07.png'
    author = '1 пак смайлов'
    asrc = 'https://cdn.discordapp.com/attachments/770423722238410822/771000415356452884/unknown.png'
    ch.send(createEmbed(title, desc, footer, img, author, asrc));

    title = 'Рандом смайлики'
    desc = "**:rainbow: Без нитро** (Добавь сервер, Перезапусти дискорд)\n"
    desc += "**:green_apple:  Анимированные смайлы:** отсутствуют\n\n"
    desc += '[Добавить сервер](https://discord.gg/ydakRZ9)'
    footer = 'В #rules добавьте реакцию к сообщениям'
    img = 'https://cdn.discordapp.com/attachments/770423722238410822/771001977927630848/unknown.png'
    author = '2 пак смайлов'
    asrc = 'https://cdn.discordapp.com/attachments/770423722238410822/771002164319092777/unknown.png'
    ch.send(createEmbed(title, desc, footer, img, author, asrc));

    title = 'Огромный пак смайликов'
    desc = "**:rainbow: Без нитро** (Добавь сервер, Перезапусти дискорд)\n"
    desc += "**:green_apple:  Анимированные смайлы:** отсутствуют\n\n"
    desc += '[Добавить сервер](https://discord.gg/FV2KPFR)'
    footer = 'Ждите 5 минут, чтобы получить доступ'
    img = 'https://cdn.discordapp.com/attachments/770423722238410822/771004707778986004/unknown.png'
    author = '3 пак смайлов'
    asrc = 'https://cdn.discordapp.com/attachments/770423722238410822/771003155618070579/unknown.png'
    ch.send(createEmbed(title, desc, footer, img, author, asrc));

    title = 'Аниме смайлики'
    desc = "**:rainbow: Без нитро** (Добавь сервер, Перезапусти дискорд)\n"
    desc += "**:green_apple:  Анимированные смайлы:** отсутствуют\n\n"
    desc += '[Добавить сервер](https://discord.gg/sltind)'
    footer = 'Перезапустите дискорд, для получения смайлов'
    img = 'https://cdn.discordapp.com/attachments/770423722238410822/771005638419283978/unknown.png'
    author = '4 пак смайлов'
    asrc = 'https://cdn.discordapp.com/attachments/770423722238410822/771005002197499944/unknown.png'
    ch.send(createEmbed(title, desc, footer, img, author, asrc));
});

client.login('NzcwOTg3ODYwODk0NDE2OTU2.X5lkZg.DeiyyXCrVZ4nVk4O3lg0xrydwBk');
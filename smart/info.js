const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const weather = require('weather-js');

channels = require('./servers.json')["channels"]

CORONA = []
CITIES = []

function updateCoronaInfo(country) {
    return new Promise(async (resolve, reject) => {
        const Link = "https://en.wikipedia.org/wiki/Template:2019%E2%80%9320_coronavirus_pandemic_data"
        let response = await fetch(Link)
        response = await response.text();
        let $ = cheerio.load(response);
        let virus = $('#thetable tr th a:contains("'+country+'")').parents('tr').find($('td')).text().split("\n");
        
        if (!virus) reject(new Error('Информация о данной стране отсутствует. Убедитесь, что название страны указано на английском'))

        CORONA[country] = {}
        CORONA[country].deaths = virus[1]
        CORONA[country].health = virus[2]
        CORONA[country].sick = virus[0]

        resolve()
    })
}

function updateWeather(geo) {
    return new Promise((resolve, reject) => {
        weather.find({search: geo, degreeType: 'C'}, function(err, result) {
            if(err) reject(err)

            CITIES[geo] = result[0]
        });
    })
}

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

async function updateChannel(guild, id, type, geo='') {
    const channel = await guild.channels.cache.find(ch => ch.id === id)
    if (!channel) {
        channels.splice(channels.indexOf(channels.find(cd => cd.id === id)), 1)
        fs.writeFileSync('servers.json', JSON.stringify({channels}))
        return
    }
    //const guild = channel.guild
    if (type === 'online') type = `✅ Онлайн  ${guild.members.cache.filter(m => m.presence.status !== 'offline').size}`
    if (type === 'members') type = `👥 Участников  ${guild.memberCount}`
    let smile = ''
    if (type === 'corona1') title = `🦠${smile} Заболели: ${CORONA[geo].sick}`
    if (type === 'corona2') title = `💊${smile} Вылеченных: ${CORONA[geo].health}`
    if (type === 'corona3') title = `💀${smile} Умерших: ${CORONA[geo].deaths}`

    channel.edit({ name: type })
}

async function createChannel(msg, type, geo='') {
    const guild = msg.guild
    let title = ''
    if (type === 'online') title = `✅ Онлайн  ${guild.members.cache.filter(m => m.presence.status !== 'offline').size}`
    if (type === 'members') title = `👥 Участников  ${guild.memberCount}`
    if (type === 'corona') {
        await updateCoronaInfo(geo)

        createChannel(msg, 'corona1', geo)
        createChannel(msg, 'corona2', geo)
        createChannel(msg, 'corona3', geo)

        return
    }

    let smile = ''
    if (geo === "Russia") smile = '🇷🇺'
    if (geo === "Ukraine") smile = '🇺🇦'
    if (geo === "Belarus") smile = '🇧🇾'
    if (geo === "Kazakhstan") smile = '🇰🇿'

    if (type === 'corona1') title = `🦠${smile} Заболели: ${CORONA[geo].sick}`
    if (type === 'corona2') title = `💊${smile} Вылеченных: ${CORONA[geo].health}`
    if (type === 'corona3') title = `💀${smile} Умерших: ${CORONA[geo].deaths}`

    
    if (type === 'weather') {
        await updateWeather(geo)
        const weatherData = CITIES[geo]
        let icon = ''
        let skytext = weatherData["current"]["skytext"]

        if (skytext === "Sunny") icon = '☀'
        if (skytext === "Partly Sunny") icon = '🌥'
        if (skytext === "Mostly Cloudy") icon = '☁'

        title = `${icon} ${geo}: ${weatherData["current"]["temperature"]} °С`
    }

    const channel = await msg.guild.channels.create(title, {
        type: 'voice',
        permissionOverwrites: [
          {
            id: msg.guild.roles.everyone.id, // @everyone role
            deny: ['CONNECT']
          }
        ]
    });

    if (type === 'corona1' || type === 'corona2' || type === 'corona3') {
        channels.push({id:channel.id, type:type, guild_id:channel.guild.id,country:geo})
    }
    if (type === 'weather') {
        channels.push({id:channel.id, type:type, guild_id:channel.guild.id, city:city})
    }
    else channels.push({id:channel.id, type:type, guild_id:channel.guild.id})

    fs.writeFileSync('servers.json', JSON.stringify({channels}))
}

client.on('ready', () => {
    console.log('Бот включен');

    updateData()
})

client.on('channelDelete', ch => {
    const channel = channels.find(c => ch.id === c.id)
    if (channel) {
        channels.splice(channels.indexOf(channel), 1)
        fs.writeFileSync('servers.json', JSON.stringify({channels}))
    }
})

client.on('message', async msg => {
    const prefix = '/'

    if (msg["content"][0] != prefix) return
    if (msg.author.bot) return
    data = msg.content.split(' ');
    cmd = {};
    cmd.prefix = data[0];
    cmd.start = data[0].slice(prefix.length).trim();
    cmd.args = data.slice(1);

    let title, desc, footer, img, author, asrc
    title = "Управление информацией InfoStat"
    footer = "Если возникли ошибки: **Jave#8076**"
    img = 'https://cdn.discordapp.com/attachments/770423722238410822/771071124649148436/unknown.png'
    author = '/online, /members'
    asrc = 'https://cdn.discordapp.com/attachments/770423722238410822/771071598462500924/unknown.png'

    switch (cmd.start) {
        case "online":
            if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.reply('У вас нет прав на использование этой команды')
            if (channels.find(cd => {if (cd.guild_id === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющимся онлайном')

            createChannel(msg, 'online')
            desc = "Информация об онлайне упешно **добавлена**"
            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "members":
            if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.reply('У вас нет прав на использование этой команды')
            if (channels.find(cd => {if (cd.guild_id === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющимся количеством участников')
            
            createChannel(msg, 'members')
            desc = "Информация о количестве участников упешно **добавлена**"
            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "corona":
        case "covid":
            if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.reply('У вас нет прав на использование этой команды')
            let country = cmd.args[0]

            if(!country) country = 'Russia'

            if (channels.find(cd => {if (cd.guild_id === String(msg.guild.id) && cd.type === cmd.start || cd.type === "corona1" || cd.type === "corona2" || cd.type === "corona3") return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющимся количеством участников')
            
            createChannel(msg, 'corona', country)
            desc = "Информация о количестве заболевших упешно **добавлена**"
            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "weather":
            if (!msg.member.permissions.has('ADMINISTRATOR')) return msg.reply('У вас нет прав на использование этой команды')
            let city = cmd.args[0]

            if(!city) city = 'Moscow'
            if (channels.find(cd => {if (cd.guild_id === String(msg.guild.id) && cd.type === cmd.start && cd.cities && cd.cities.find(c => c.name === city)) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющейся погодой этого города')

            createChannel(msg, 'weather', city)
            desc = "Погода города **"+city+"** успешно добавлена"
            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
    }
})

async function updateData() {
    console.log('Синхронизация данных...');

    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        if (channel["country"]) {
            await updateCoronaInfo(channel["country"])
        }
        else if (channel["cities"]) {
            for (city of channel["cities"]) {
                await updateWeather(city)
            }
        }
    }

    console.log(CORONA, CITIES)

    if (channels.length != 0) {
        channels.forEach(async channelData => {
            console.log(`${channelData.id} обновлен`);
            let guild = await client.guilds.fetch(channelData.guild_id)
            if (channelData.type.includes("corona")) updateChannel(guild, channelData.id, channelData.type, channelData.country)
            if (channelData.type.includes("weather")) updateChannel(guild, channelData.id, channelData.type, channelData.country)
            else updateChannel(guild, channelData.id, channelData.type)
        })
    }
    else {
        console.log('Данные для синхронизации отсутствуют');
    }

    setTimeout(updateData, 10000)
}

client.login('NzcxMDE1OTgwNjc0ODQyNjI1.X5l-lg.Nqa5KxpdMUO1j-vLktaUpQSkctI');
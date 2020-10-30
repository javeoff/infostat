const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs')
const fetch = require('node-fetch')
const cheerio = require('cheerio')
const weather = require('weather-js');

channels = require('./servers.json')["channels"]

CORONA = []
WEATHER = []

class ChannelTitle {
    constructor(guild) {
        this.guild = guild
    }

    getCountrySmile(geo) {
        let smile = ''
        if (geo === "Russia") smile = '🇷🇺'
        if (geo === "Ukraine") smile = '🇺🇦'
        if (geo === "Belarus") smile = '🇧🇾'
        if (geo === "Kazakhstan") smile = '🇰🇿'
        return smile
    }

    getWeatherSmile(tw) {
        let smile = ''
        if (tw === "Sunny") smile = '☀'
        if (tw === "Partly Sunny") smile = '🌥'
        if (tw === "Mostly Cloudy") smile = '☁'
        if (tw === "Cloudy") smile = '☁'
        return smile
    }

    onlineTitle(online) {
        return `✅ Онлайн  ${online}`
    }

    memberTitle(count) {
        return `👥 Участников  ${count}`
    }

    coronaTitle(type, count, smile) {
        switch (type) {
            case "sick":
                return `🦠${smile} Заболели: ${count}`
            break;
            case "health":
                return `💊${smile} Вылеченных: ${count}`
            break;
            case "deaths":
                return `💀${smile} Умерших: ${count}`
            break;
        }
        return 'corona'
    }

    weatherTitle(degree, geo, smile) {
        return `${smile} ${geo}: ${degree} °С`
    }
}

class Information {
    constructor(guild) {
        this.guild = guild
    }

    get online() {
        return this.guild.members.cache.filter(m => m.presence.status !== 'offline').size
    }

    get memberCount() {
        return this.guild.memberCount
    }

    coronaInfo(country) {
        return CORONA[country]
    }

    weatherInfo(city) {
        return WEATHER[city]
    }

    fetchCorona(country) {
        return new Promise(async (resolve, reject) => {
            const Link = "https://en.wikipedia.org/wiki/Template:2019%E2%80%9320_coronavirus_pandemic_data"
            let response = await fetch(Link)
            response = await response.text();
            let $ = cheerio.load(response);
            let virus = $('#thetable tr th a:contains("'+country+'")').parents('tr').find($('td')).text().split("\n");
            
            if (!virus) reject(new Error('Информация о данной стране отсутствует. Убедитесь, что название страны указано на английском'))
    
            console.log('fetch corona');

            CORONA[country] = {}
            CORONA[country].deaths = virus[1]
            CORONA[country].health = virus[2]
            CORONA[country].sick = virus[0]
    
            resolve(CORONA[country])
        })
    }

    fetchWeather(city) {
        return new Promise((resolve, reject) => {
            weather.find({search: city, degreeType: 'C'}, function(err, result) {
                if(err) reject(err)
    
                WEATHER[city] = result[0]
                resolve(result[0])
            });
        })
    }
}

class File {
    appendServerData(obj) {
        channels.push(obj)
        this.saveFile()
    }

    getValue(ch_id, key) {
        let index = channels.indexOf(channels.find(cd => cd.id === ch_id))
        return channels[index][key] = value
    }

    changeValue(ch_id, key, value) {
        let index = channels.indexOf(channels.find(cd => cd.id === ch_id))
        channels[index][key] = value
        return channels
    }

    hasChannel(ch_id) {
        return channels.find(cd => cd.channel_id === ch_id)
    }

    deleteChannel(ch_id) {
        channels.splice(channels.indexOf(channels.find(cd => String(cd.channel_id) === String(ch_id))), 1)
        this.saveFile()
        return channels
    }

    get data() {
        return channels
    }

    readFile() {
        return JSON.parse(fs.readFileSync('servers.json'))["channels"]
    }

    saveFile() {
        fs.writeFileSync('servers.json', JSON.stringify({channels:channels}))
    }
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

function createVChannel(guild, text) {
    return guild.channels.create(text, {
        type: 'voice',
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id, // @everyone role
            deny: ['CONNECT']
          }
        ]
    });
}

function editVChannel(channel, name) {
    return channel.edit({name})
}

async function loadData(timeout) {
    console.log('Синхронизация данных...');

    let file = new File()
    let data = file.data
    if (data.length > 0) {
        for (channelData of data) {
            const ch_id = channelData["channel_id"]
            const channel = await client.channels.cache.find(ch => ch.id === ch_id)
            if (!channel) {
                file.deleteChannel(ch_id)
                continue;
            }
            const guild = channel.guild
            const info = new Information(guild)
            var ch_title = new ChannelTitle(guild)
    
            switch (channelData["type"]) {
                case "members":
                    await editVChannel(channel, ch_title.memberTitle(info.memberCount))
                break;
                case "online":
                    await editVChannel(channel, ch_title.onlineTitle(info.online))
                break;
                case "deaths":
                case "health":
                case "sick":
                    var type = channelData["type"]
                    var country = channelData["geo"]

                    //var coronaData = info.coronaInfo(country)
                    var coronaData = coronaData = await info.fetchCorona(country)
                    //if (!coronaData) coronaData = await info.fetchCorona(country)

                    var ch_title = new ChannelTitle(guild)
                    console.log(ch_title.coronaTitle(type, coronaData[type], ch_title.getCountrySmile(country)));
                    await editVChannel(channel, ch_title.coronaTitle(type, coronaData[type], ch_title.getCountrySmile(country)))
                break;
                case "weather":
                    var city = channelData["geo"]

                    var weatherData = info.weatherInfo(city)
                    if (weatherData !== true) weatherData = await info.fetchWeather(city)
                    var degree = weatherData["current"]["temperature"]
                    var tw = weatherData["current"]["skytext"]

                    console.log(degree, tw);

                    var ch_title = new ChannelTitle(guild)
                    await editVChannel(channel, ch_title.weatherTitle(degree, city, ch_title.getWeatherSmile(tw)))
                break;
            }
        }
    }
    else console.log("Данные для инициализации отсутствуют.");

    setTimeout(() => loadData(timeout), timeout)
}

client.on('channelDelete', ch => {
    let file = new File()
    if (file.hasChannel(ch.id)) file.deleteChannel(ch.id)
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
            var guild = msg.guild
            var ch_title = new ChannelTitle(guild)
            let online = guild.members.cache.filter(m => m.presence.status !== 'offline').size
            desc = "Online"

            if (!msg.member.permissions.has('ADMINISTRATOR')) 
            return msg.reply('У вас нет прав на использование этой команды')

            if (channels.find(cd => {if (String(cd.guild_id) === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющимся онлайном')

            var file = new File()
            var channel = await createVChannel(guild, ch_title.onlineTitle(online))
            file.appendServerData({
                channel_id: channel.id,
                guild_id: msg.guild.id,
                type: "online"
            })

            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "members":
            var guild = msg.guild
            var ch_title = new ChannelTitle(guild)
            let memberCount = guild.memberCount
            desc = "members"

            if (!msg.member.permissions.has('ADMINISTRATOR')) 
            return msg.reply('У вас нет прав на использование этой команды')

            if (channels.find(cd => {if (String(cd.guild_id) === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющимся количеством участников')

            var file = new File()
            var channel = await createVChannel(guild, ch_title.memberTitle(memberCount))
            file.appendServerData({
                channel_id: channel.id,
                guild_id: msg.guild.id,
                type: "members"
            })

            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "corona":
            var guild = msg.guild
            var ch_title = new ChannelTitle(guild)
            desc = "corona"

            let country = cmd.args[0]
            if (!country) country = 'Russia'

            if (!msg.member.permissions.has('ADMINISTRATOR')) 
            return msg.reply('У вас нет прав на использование этой команды')

            if (channels.find(cd => {if (String(cd.guild_id) === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющейся информацией о заболевших')

            var info = new Information()
            var coronaData = info.coronaInfo(country)
            if (!coronaData) coronaData = await info.fetchCorona(country)

            const types = ["deaths","health","sick"]
            var file = new File()
            types.forEach(async type => {
                var title = ch_title.coronaTitle(type, coronaData[type], ch_title.getCountrySmile(country))
                var channel = await createVChannel(guild, title, country)

                file.appendServerData({
                    channel_id: channel.id,
                    guild_id: msg.guild.id,
                    type: type,
                    geo: country
                })
    
            })

            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
        case "weather":
            var guild = msg.guild
            var ch_title = new ChannelTitle(guild)
            desc = "weather"

            let city = cmd.args[0]
            if (!city) city = 'Moscow'

            if (!msg.member.permissions.has('ADMINISTRATOR')) 
            return msg.reply('У вас нет прав на использование этой команды')

            if (channels.find(cd => {if (String(cd.guild_id) === String(msg.guild.id) && cd.type === cmd.start) return true}))
            return msg.reply('В этом сервере уже есть динамический канал с обновляющейся погодой')

            var info = new Information()
            var weatherData = info.weatherInfo(city)
            if (!weatherData) weatherData = await info.fetchWeather(city)
            var degree = weatherData["current"]["temperature"]
            var tw = weatherData["current"]["skytext"]
            console.log(tw);

            var channel = await createVChannel(guild, ch_title.weatherTitle(degree, city, ch_title.getWeatherSmile(tw)), city)

            var file = new File()
            file.appendServerData({
                channel_id: channel.id,
                guild_id: msg.guild.id,
                type: "weather",
                geo: city
            })

            msg.reply(createEmbed(title, desc, footer, img, author, asrc))
        break;
    }
})

client.on('ready', () => {
    console.log('Бот включен');

    loadData(1000*60*60)
})

client.login('NzcxMDE1OTgwNjc0ODQyNjI1.X5l-lg.Nqa5KxpdMUO1j-vLktaUpQSkctI');

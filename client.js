///////////////////////////////////
// MAIN SCRIPT FOR BLOOM BATTLER //
// grassimp :) ////////////////////
///////////////////////////////////

//Discord.JS initiation.
Discord = require('discord.js');
Voice = require('@discordjs/voice');
Builders = require('@discordjs/builders');
client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
		Discord.Intents.FLAGS.GUILD_VOICE_STATES
	],
	partials: [
		'MESSAGE',
		'CHANNEL',
		'REACTION'
	]
});

// Path to 'data' folder
dataPath = './data'

// Path to 'packages' folder
packPath = './Packages'

// Bot Stuff
utilityFuncs = require(packPath + '/utilityFuncs.js');
charFuncs = require(packPath + '/charFuncs.js');
enemyFuncs = require(packPath + '/enemyFuncs.js');
attackFuncs = require(packPath + '/attackFuncs.js');
turnFuncs = require(packPath + '/turnFuncs.js');
skillFuncs = require(packPath + '/skillFuncs.js');

RF = require(packPath + '/relicFuncs.js');

//Canvas, for making custom pictures.
Canvas = require('canvas');

//FS, for writing files.
fs = require('fs');

//Request, for requesting files
request = require('request');

// Voice Shit
ffmpeg = require('ffmpeg-static');
ytdl = require('ytdl-core');
http = require('http');

//hatebin, for converting long walls of text into links
hastebin = require('hastebin-gen');

// Daily Quote - Resets at midnight
let dailyQuote = 'none'

let tempQuote = fs.readFileSync(dataPath+'/dailyquote.txt', {flag: 'as+'});
if (tempQuote && tempQuote != '')
	dailyQuote = tempQuote.toString();

// Daily Skill - Resets at midnight
let dailySkill = 'none'

let tempSkill = fs.readFileSync(dataPath+'/dailyskill.txt', {flag: 'as+'});
if (tempSkill && tempSkill != '')
	dailySkill = tempSkill.toString();

// Midnight Moment
function midnightInMS() {
    return new Date().setHours(24, 0, 0, 0) - new Date().getTime()
}

setTimeout(function() {
	dailyQuote = 'none';
	dailySkill = 'none';

	fs.writeFileSync(dataPath+'/dailyquote.txt', '');
	fs.writeFileSync(dataPath+'/dailyskill.txt', '');

	setTimeout(function() {
		dailyQuote = 'none';
		dailySkill = 'none';

		fs.writeFileSync(dataPath+'/dailyquote.txt', '');
		fs.writeFileSync(dataPath+'/dailyskill.txt', '');
	}, midnightInMS());
}, midnightInMS());

// Elements
Elements = [
    "strike",
    "slash",
    "pierce",
    "fire",
    "water",
    "ice",
    "electric",
    "wind",
    "earth",
    "grass",
    "psychic",
    "poison",
    "nuclear",
    "metal",
    "curse",
    "bless",
	"gravity",
	"sound",
    "almighty",

    "status",
    "heal",
    "passive"
]

elementEmoji = {
	strike: "<:strike:877132710370480190>",
	slash: "<:slash:877132710345338960> ",
	pierce: "<:pierce:877132710315950101>",
	
	fire: "<:fire:877132709934301216>",
	water: "<:water:877132710471147571>",
	ice: "<:ice:877132710299181076>",
	electric: "<:electric:877132710194348072>",
	wind: "<:wind:877140815649075241>",
	earth: "<:earth:877140476409577482>",
	grass: "<:grass:877140500036075580>",
	psychic: "<:psychic:877140522530140171>",
	poison: "<:poison:906759861742760016>",
	metal: "<:metal:906748877955268638>",
	curse: "<:curse:906748923354443856>",
	bless: "<:bless:903369721980813322>",
	nuclear: "<:nuclear:906877350447300648>",
	gravity: "🌍",
	sound: "🎵",
	
	almighty: "<:almighty:906748842450509894>",
	
	status: "<:status:906877331711344721>",
	heal: "<:heal:906758309351161907>",
	passive: "<:passive:906874477210648576>"
}

elementColors = {
	strike: '#ffc012',
	slash: '#aba060',
	pierce: '#e3c8ac',
	
	fire: '#ff425f',
	water: '#8c19ff',
	ice: '#5cf4ff',
	electric: '#ffe100',
	wind: '#d6f2ff',
	earth: '#82612b',
	grass: '#2da659',
	psychic: '#ff2ee3',
	poison: '#6f00b0',
	metal: '#d6d6d6',
	curse: '#7a1730',
	bless: '#fff4cc',
	nuclear: '#5eb000',
	gravity: '#030a96',
	sound: '#15ff00',
	
	almighty: '#ffffff',
	
	status: '#0008ff',
	heal: '#61ffab',
	passive: '#ffa200'
}

// Item
itemTypes = [
	"skill",
	"heal",
	"healmp",
	"healhpmp",
	"revive",
	"material",
	"pacify"
]

itemTypeEmoji = {
	skill: '🎇',

	heal: "🌀",
	healmp: "⭐",
	healhpmp: "🔰",

	revive: "✨",
	material: '🛠',
	pacify: '🎵',
}

// Status Effects
statusEffects = [
    "burn",
	"bleed",
    "freeze",
    "paralyze",
	"dizzy",
	"sleep",
	"despair",
    "poison",
    "brainwash",
	"fear",
	"rage",
	"ego",
	"silence",
	"dazed",
	"hunger",
	"illness",
	"infatuation",
	"mirror",
	"blind",
	"confusion"
]

statusEmojis = {
    burn: "🔥",
	bleed: "<:bleed:906903499462307870>",
    freeze: "❄",
    paralyze: "⚡",
	sleep: "💤",
	dizzy: "💫",
	despair: "💦",
    poison: "<:poison:906903499961434132>",
	dizzy: "💫",
    brainwash: "🦆",
	fear: "👁",
	rage: "<:rage:906903500053696532>",
	ego: "🎭",
	silence: '<:silence:905238069207240734>',
	dazed: '✨',
	hunger: '🍪',
	illness: '🤢',
	infatuation: '❣️',
	mirror: '<:mirror:929864689406582784>',
	blind: '🕶️',
	confusion: '☄️'
}

// Enemy Habitats
enmHabitats = [
	"grasslands",
	"forests",
	"swamps",
	"mountains",
	"caverns",
	"volcanic",
	"icy",
	"unknown"
]

weathers = [
	"rain",
	"thunder",
	"sunlight",
	"windy",
	"sandstorm",
	"hail"
]

terrains = [
	"flaming", // 10 damage with 10% chance of burn
	"thunder", // 1.2x to elec
	"grassy", // 10% heal before turn
	"light", // 1.2x to bless
	"psychic", // reverse turn order
	"misty", // ignore status inflictions
	"sky", // 1.2x to wind
	"muddy", // 1.2x to earth, -33% agl

	// boss specific
	"flooded", // 1.3x to water
	"swamp", // 1.3x to earth and grass
	"glacial", // 1.3x to ice, +20% freeze chance on ice skills
	"fairydomain",
	"graveyard",
	"factory",
	"blindingradiance",
	"eternaldarkness"
]

Targets = [
	'one', // target one foe
	'ally', // target one ally
	'caster', // target the caster

	'allopposing', // target all foes
	'allallies', // target all allies
	'randomopposing', // target random foes
	'randomallies', // target random allies

	'random', // target random fighters
	'everyone', // target all fighters
	
	'spreadopposing', // target one foe, damage spreads to 2 surrounding.
	'spreadallies' // target one ally, effects spread to 2 surrounding.
]

costTypes = [
	'mp',
	'mppercent',
	'hp',
	'hppercent',
	'lb',
	'lbpercent',
	'money',
	'moneypercent'
]

getPrefix = (server) => {
	return 'rpg!' // for now
}

// Clone Object
objClone = (source) => {
	if (Object.prototype.toString.call(source) === '[object Array]') {
		let clone = []

		for (let i = 0; i < source.length; i++)
			clone[i] = objClone(source[i]);

		return clone
	} else if (typeof(source)=="object") {
		let clone = {}

		for (let prop in source) {
			if (source.hasOwnProperty(prop)) clone[prop] = objClone(source[prop]);
		}

		return clone
	} else {
		return source
	}
}

// setUpFile
fileStore = {};
setUpFile = (file) => {
	if (fileStore[file]) return fileStore[file];
	let fileRead = fs.readFileSync(file, {flag: 'as+'});

	if (!fileRead || fileRead == "" || fileRead == " ") {
		fileRead = "{}"
		fs.writeFileSync(file, fileRead);
	}

	let fileFile = JSON.parse(fileRead);
	fileStore[file] = fileFile
	return fileFile;
}

//global got json stuff
skillFile = setUpFile(`${dataPath}/json/skills.json`)

// makeDirectory
makeDirectory = (dir) => {
	let directories = [dir];

	for (let i = 0; i < dir.length; i++) {
		if (dir.charAt(i) == '/') {
			let dire = dir.slice(0, i);
			if (!fs.existsSync(dire)) directories.push(dire);
		}
	}
	
	if (directories.length < 1) return;

	for (let i in directories) {
		if (!fs.existsSync(directories[i])) {
			fs.mkdir(directories[i], function(err) {
				if (err) {
					console.log(err)
				} else {
					console.log(`Created directory at "${directories[i]}"`)
				}
			})
		}
	}
	
	return directories;
}

elementList = () => {		
	const DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('List of usable elements:')

	let elementTxt = ''
	for (const i in Elements)
		elementTxt += `${elementEmoji[Elements[i]]} **${[Elements[i]]}**\n`;
	
	DiscordEmbed.setDescription(elementTxt)
	return DiscordEmbed;
}

typeParsers = {
	Num: ({arg}) => {return parseInt(arg) || undefined},
	Decimal: ({arg}) => {return parseFloat(arg) || undefined},
	Word: ({arg}) => {return typeParsers.Ping(arg) || typeParsers.Channel(arg) ? undefined : arg},
	Ping: ({message}) => {return message.mentions.users.first() || undefined},
	Channel: arg => {}, //placeholders
	ID: arg => {}
}

Command = class {
	constructor(object) {
		this.name = object.name
		this.desc = object.desc
		this.section = object.section
		this.func = object.func
		this.args = object.args ?? []
	}

	call(message, rawargs) {
		let args = []
		for (const [i, arg] of this.args.entries()) {
			const rawarg = rawargs[i]
			if (rawarg) {
				const parser = typeParsers[arg.type]
				const parsedArg = parser ? parser({rawarg: arg, message}) : rawarg
				if (!parsedArg) return void message.channel.send("Invalid argument for \"" + arg.name + "\", it has to be of type \"" + arg.type + "\".")
				args.push(parsedArg)
			} else if (arg.forced) {
				const desc = this.getFullDesc()
				const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`Missing required argument "${arg.name}"!`)
					.setDescription(desc)
				return void message.channel.send({embeds: [DiscordEmbed]})
			}
		}
		this.func(message, args)
	}

	getFullDesc() {
		let args = "*"
		for (const arg of this.args) {
			const argdesc = `${arg.type}: ${arg.name}`
			args += arg.forced ? `<${argdesc}> ` : `\{${argdesc}\} `
		}
		args = args == "*" ? "" : args + "*\n"
		return `${args}${this.desc}` 
	}
}

commands = {}
const commandFiles = fs.readdirSync(`${packPath}/commands`).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`${packPath}/commands/${file}`);
}

client.on("guildCreate", (guild) => {
	makeDirectory(`${dataPath}/json/${message.guild.id}`);

	// Server Data
	setUpFile(`${dataPath}/json/${message.guild.id}/server.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/items.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/blacksmiths.json`)

	// Character Data
	setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
	setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)
	
	// Battle Data
	setUpFile(`${dataPath}/json/${message.guild.id}/battle-${message.channel.id}.json`)

	//make an embed with a welcome message
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Welcome, everyone!')
		.setDescription(`I'm Bloom Battler, and welcome to my extravagant Real-Time RPG experience.`)
		.addField('What can I do?', `I can do whatever you imagine. This includes:
			**- Characters
			- Items
			- Skills
			- Chests
			- Enemies
			- Etc.**
			I can also do a multitiude of misc. things!`)
		.addField('How can I start?', `Type ${getPrefix(guild.id)}help to get started!`)

	let channel = guild.channels.cache.find(
		(ch) => ch.type === 'GUILD_TEXT',
	);
		
	if (!channel) return console.log('Where should I post?');
		
	//send an image, and then the embed
	channel.send({files: [`${dataPath}/images/welcome.png`]})
		.then(() => channel.send({embeds: [DiscordEmbed]}))
})

prefix = 'rpg!';
client.on("messageCreate", (message) => {
	makeDirectory(`${dataPath}/json/${message.guild.id}`);

	// Register commands
	if (!message.content.startsWith(prefix)) return;
	let args = [...message.content.slice(prefix.length).matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
	let command = commands[args.shift()];

	if (!command) return message.channel.send("That command does not exist!");
	command.call(message, args)
})

client.login(process.env.TOKEN);
console.log(`The bot is now in session! Enjoy!`)
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
dailyQuote = 'none'

let tempQuote = fs.readFileSync(dataPath+'/dailyquote.txt', {flag: 'as+'});
if (tempQuote && tempQuote != '')
	dailyQuote = tempQuote.toString();

// Daily Skill - Resets at midnight
dailySkill = 'none'

let tempSkill = fs.readFileSync(dataPath+'/dailyskill.txt', {flag: 'as+'});
if (tempSkill && tempSkill != '')
	dailySkill = tempSkill.toString();

// Daily Item - Resets at midnight
dailyItem = {}

let tempItem = fs.readFileSync(dataPath+'/dailyitem.txt', {flag: 'as+'});
if (tempItem && tempItem != '')
	dailyItem = JSON.parse(tempItem);

// Daily Weapon - Resets at midnight
dailyWeapon = {}

let tempWeapon = fs.readFileSync(dataPath+'/dailyweapon.txt', {flag: 'as+'});
if (tempWeapon && tempWeapon != '')
	dailyWeapon = JSON.parse(tempWeapon);

// Daily Armor - Resets at midnight
dailyArmor = {}

let tempArmor = fs.readFileSync(dataPath+'/dailyarmor.txt', {flag: 'as+'});
if (tempArmor && tempArmor != '')
	dailyArmor = JSON.parse(tempArmor);

// Daily Character - Resets at midnight
dailyChar = {}

let tempCharacter = fs.readFileSync(dataPath+'/dailycharacter.txt', {flag: 'as+'});
if (tempCharacter && tempCharacter != '')
dailyChar = JSON.parse(tempCharacter);

// Midnight Moment
function midnightInMS() {
    return new Date().setHours(24, 0, 0, 0) - new Date().getTime()
}

setTimeout(function() {
	dailyQuote = 'none';
	dailySkill = 'none';
	dailyItem = {};
	dailyWeapon = {};
	dailyArmor = {};
	dailyChar = {};

	fs.writeFileSync(dataPath+'/dailyquote.txt', '');
	fs.writeFileSync(dataPath+'/dailyskill.txt', '');
	fs.writeFileSync(dataPath+'/dailyitem.txt', '');
	fs.writeFileSync(dataPath+'/dailyweapon.txt', '');
	fs.writeFileSync(dataPath+'/dailyarmor.txt', '');
	fs.writeFileSync(dataPath+'/dailycharacter.txt', '');
}, midnightInMS());

// Elements
Elements = [
    "strike",
    "slash",
    "pierce",
	"explode",

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
	"spirit",
	"gravity",
	"sound",
    "almighty",

    "status",
    "heal",
    "passive"
]

elementEmoji = {
	strike: "<:strike:963413845764874290>",
	slash: "<:slash:963413845244797029>",
	pierce: "<:pierce:963413845337063424>",
	explode: "<:explode:963413844544344155>",

	fire: "<:fire:963413844825362532>",
	water: "<:water:963413845886505011>",
	ice: "<:ice:963413845186072576>",
	electric: "<:electric:963413844733100042>",
	wind: "<:wind:963413845848776714>",
	earth: "<:earth:963413844670173225>",
	grass: "<:grass:963413844879880243>",
	psychic: "<:psychic:963413845500624896>",
	poison: "<:poison:963413845353840681>",
	metal: "<:metal:963413845131530240>",
	curse: "<:curse:963413844531740684>",
	bless: "<:bless:963413844628230254>",
	spirit: '<:spirit:963413845265756171>',
	nuclear: "<:nuclear:963413845156692028>",
	gravity: "<:gravity:963413844951179314>",
	sound: "<:sound:963413845517422642>",

	almighty: "<:almighty:963413844326219787>",

	status: "<:status:963413845693587497>",
	heal: "<:heal:963413844972154900>",
	passive: "<:passive:963413845253193758>"
}

elementColors = {
	strike: '#ffc012',
	slash: '#aba060',
	pierce: '#e3c8ac',
	explode: '#FF5900',

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
	spirit: '#F3C6FF',
	nuclear: '#5eb000',
	gravity: '#030a96',
	sound: '#15ff00',

	almighty: '#ffffff',

	status: '#0008ff',
	heal: '#61ffab',
	passive: '#ffa200'
}

Affinities = ['superweak', 'weak', 'resist', 'block', 'repel', 'drain'];

affinityEmoji = {
	deadly: '<:deadly:963413916879319072>',
	superweak: '<:supereffective:963413917198082048>',
	weak: '<:effective:963413917038694401>',
	resist: '<:resist:963413917185491014>',
	block: '<:block:963413916191432764>',
	repel: '<:repel:963413917063860234>',
	drain: '<:drain:963413916959010896>'
}

stats = ['atk', 'mag', 'prc', 'end', 'chr', 'int', 'agl', 'luk']

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
	skill: '<:skill:963788061068656661>',
	
	heal: "<:healhp:963788060665970709>",
	healmp: "<:healmp:963788061253201980>",
	healhpmp: "<:healhpmp:963788060976357446>",

	revive: "<:revive:963788061056049213>",
	material: '<:material:963788061731348510>',
	pacify: '<:pacify:963788061068648479>',
}

itemRarities = [
	"common",
	"uncommon",
	"rare",
	"veryrare",
	"epic",
	"legendary",
	"sentient",
	"artifact"
]

itemRarityEmoji = {
	common: '<:common:963787701230915614>',
	uncommon: '<:uncommon:963787700903743509>',
	rare: '<:rare:963787701444804608>',
	veryrare: '<:veryrare:963787701256077332>',
	epic: '<:epic:963787701268643890>',
	legendary: '<:legendary:963787701524516875>',
	sentient: '<:sentient:963787701205745754>',
	artifact: '<:artifact:963787701084106872>'
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
	"blind",
	"confusion",

	// Positive Statusses
	"happy",
	"mirror"
]

statusNames = {
    burn: 'Burning',
	bleed: 'Bleeding',
    freeze: 'Freezing',
    paralyze: 'Paralysis',
	sleep: 'Sleeping',
	dizzy: 'Dizziness',
	despair: 'Despair',
    poison: 'Poison',
    brainwash: 'Brainwash',
	fear: 'Fear',
	rage: 'Rage',
	ego: 'Ego',
	silence: 'Silence',
	dazed: 'Daze',
	hunger: 'Hunger',
	illness: 'Illness',
	infatuation: 'Infatuation',
	blind: 'Blindness',
	confusion: 'Confusion',

	// Positive Statusses
	happy: 'Happiness',
	mirror: 'Mirror'
}

statusEmojis = {
    burn: "<:burn:963387466423873607>",
	bleed: "<:bleed:963387466323206174>",
    freeze: "<:freeze:963387466885259324>",
    paralyze: "<:electric:962465467400851518>",
	sleep: "<:sleep:963389074213847070>",
	dizzy: "<:dizzy:963387466935570444>",
	despair: "<:despair:963387466574856242>",
    poison: "<:poison:963389074146738216>",
    brainwash: "<:brainwash:963387466230956044>",
	fear: "<:fear:963387466918813747>",
	rage: "🗯️",
	ego: "<:ego:963387466788794380>",
	silence: '<:silence:963389866983440456>',
	dazed: '<:dazed:963387466235134013>',
	hunger: '<:hunger:963387467002675261>',
	illness: '🤢',
	infatuation: '❣️',
	mirror: '<:mirror:963389073974755358>',
	blind: '<:blind:963387466570690560>',
	confusion: '<:confusion:963387466541330472>',
	happy: '🙂'
}

elementTechs = {
	burn: ['water', 'earth', 'nuclear'],
	bleed: ['slash', 'poison', 'nuclear'],
	freeze: ['strike', 'fire', 'earth'],
	paralyze: ['strike', 'slash', 'pierce'],
	dizzy: ['psychic', 'earth', 'wind'],
	sleep: ['all'],
	despair: ['psychic', 'curse', 'grass'],
	poison: ['slash', 'pierce', 'wind'],
	brainwash: ['psychic', 'bless', 'curse'],
	fear: ['psychic', 'curse', 'ice'],
	rage: ['bless', 'ice', 'psychic'],
	ego: ['ice', 'sound', 'spirit'],
	silence: ['sound', 'poison', 'nuclear'],
	dazed: ['strike', 'wind', 'water'],
	hunger: ['strike', 'pierce', 'earth'],
	illness: ['slash', 'poison', 'nuclear'],
	mirror: ['strike', 'slash', 'pierce', 'explode'],
	blind: ['curse', 'bless', 'gravity'],
	happy: ['curse', 'poison', 'spirit']
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

quoteTypes = ['melee', 'phys', 'mag', 'allyatk', 'lb', 'tc', 'strong', 'badatk', 'landed', 'miss', 'superweak', 'weak', 'hurt', 'resist', 'block', 'repel', 'drain', 'dodge', 'kill', 'pacify', 'allydeath', 'heal', 'helped', 'console', 'imfine', 'lvl']

getPrefix = (server) => {
	let settings = setUpSettings(server)
	return settings['prefix']
}

getCurrency = (server) => {
	let settings = setUpSettings(server)
	return settings['currency']
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
	for (const i in Elements) elementTxt += `${elementEmoji[Elements[i]]} **${Elements[i].charAt(0).toUpperCase()+Elements[i].slice(1)}**\n`;
	
	DiscordEmbed.setDescription(elementTxt)
	return DiscordEmbed;
}

getServerUser = (user, message) => {
    let userTxt = ''
	if (user) {
		if (user === 'Default')
			userTxt = 'Default/Official';
		else {
			try { userTxt = message.guild.members.cache.get(user).user.username } catch (e) { userTxt = user }
		}
	} else
		userTxt = 'Default/Official';

    return userTxt;
}

setUpSettings = (guild) => {
	let settings = setUpFile(`${dataPath}/json/${guild}/settings.json`)

	if (Object.keys(settings).length === 0) {
		settings = {
			prefix: 'rpg!',
			mechanics: {
				limitbreaks: false,
				teamcombos: false,
				onemores: false,
				stataffinities: false,
				charms: false,
				leaderskills: false,
				transformations: false,
				technicaldamage: false,
			},
			caps: {
				levelcap: 99,
				hpmpcap: 70,
				statcap: 99,
				basestatcap: 10,
				bstcap: 45,
				skillamount: 8,
				transformations: {
					hpmpcap: 10,
					statcap: 99,
					basestatcap: 10,
					bstcap: 15
				}
			},
			rates: {
				xprate: 1,
				trustrate: 1,
				goldchance: 0.01,
				mainelement: 1.1,
				crit: 1.5,
				tech: 1.1,
				affinities: {
					deadly: 4.2,
					superweak: 2.1,
					weak: 1.5,
					resist: 0.5,
					repel: 1,
					drain: 1,
				}
			},
			formulas: {
				damageFormula: "persona",
				levelUpFormula: "original",
				xpCalcFormula: "original"
			},
			currency: 'BB Token',
			pvpstuff: {
				none: {},
				metronome: {},
				randskills: {},
				randstats: {},
				charfuck: {},
				enemies: {}
			},
			banned: [],
			themes: {
				battle: [],
				advantage: [],
				disadvantage: [],
				bossfight: [],
				miniboss: [],
				strongfoe: [],
				finalboss: [],
				colosseum: [],
				colosseumstrong: [],
				pvp: [],
				victory: [],
				colosseumvictory: [],
				loss: []
			},
			encountered: [],
			desc: ""
		}

		fs.writeFileSync(`${dataPath}/json/${guild}/settings.json`, JSON.stringify(settings, null, 4))
	}

	return settings
}

setUpUserData = (user) => {
	let userdata = setUpFile(`${dataPath}/userdata/${user}.json`)

	if (Object.keys(userdata).length === 0) {
		userdata = {
			exports: {}
		}

		fs.writeFileSync(`${dataPath}/userdata/${user}.json`, JSON.stringify(settings, null, 4))
	}

	return userdata
}

const backButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Back',
	emoji: '⬅️',
	customId: 'back'
})
const forwardButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Forward',
	emoji: '➡️',
	customId: 'forward'
})

listArray = async(channel, theArray, page) => {
	const generateEmbed = async start => {
		const current = theArray.slice(start, start + 10)
		return new Discord.MessageEmbed({
			title: `Showing results ${start + 1}-${start + current.length} out of ${theArray.length}`,
			fields: await Promise.all(
				current.map(async arrayDefs => ({
					name: arrayDefs.title,
					value: arrayDefs.desc,
				}))
			)
		})
	}

	const canFitOnOnePage = theArray.length <= 10
	const embedMessage = await channel.send({
		embeds: [await generateEmbed(0)],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton]})]
	})

	if (canFitOnOnePage) return

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => true // fuck you and your (the sequel)
	})

//	let currentIndex = page*10;
	let currentIndex = 0;
	collector.on('collect', async interaction => {
		if (interaction.customId === 'back') {
			if (currentIndex - 10 < 0) {
				currentIndex = theArray.length-10
			} else {
				currentIndex -= 10
			}
		} else {
			if (currentIndex + 10 >= theArray.length) {
				currentIndex = 0
			} else {
				currentIndex += 10
			}
		}

		await interaction.update({
			embeds: [await generateEmbed(currentIndex)],
			components: [
				new Discord.MessageActionRow({components: [backButton, forwardButton]})
			]
		})
	})
}

specialDates = {
	"24 12": "Christmas Eve",
	"25 12": "Christmas",
	"26 12": "Boxing Day",
	"31 12": "New Years' Eve",
	"1 1": "New Years",
	"1 4": "April Fools' day",
	"2 6": "<@516359709779820544>'s birthday",
	"31 10": "Halloween"
}

getCurrentDate = () => {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0');
	let yyyy = today.getFullYear();

	today = specialDates[`${dd} ${mm}`] ?? dd + '/' + mm + '/' + yyyy;

	if (dd === '17' && mm === '4' && yyyy == '2022')
		today = 'Easter (2022)';
	
	return today
}

// Global JSONs
skillFile = setUpFile(`${dataPath}/json/skills.json`)
shipFile = setUpFile(`${dataPath}/json/ships.json`);
pmdFile = setUpFile(`${dataPath}/json/PMDQuestions.json`);

// 2 Week Moment
function twoWeekInMS() {
	return new Date().setDate(new Date().getDate() + 14) - new Date().getTime()
}

setTimeout(function() {
	shipFile = {}

	fs.writeFileSync(`${dataPath}/json/ships.json`, '{}');
}, twoWeekInMS());

typeParsers = {
	Num: ({arg}) => {return isNaN(arg) ? undefined : parseInt(arg)},
	Decimal: ({arg}) => {return isNaN(arg) ? undefined : parseFloat(arg)},
	Word: (vars) => {return (typeParsers.Ping(vars) || typeParsers.Channel(vars)) ? undefined : vars.arg},
	Ping: ({message}) => {return message.mentions.users.first()},
	Channel: ({message, arg}) => {return message.guild.channels.cache.find(c => c.name == arg || c.id == arg || c.id == arg.replace(/[<#>]/g, '')) ? message.guild.channels.cache.find(c => c.name == arg || c.id == arg || c.id == arg.replace(/[<#>]/g, '')).id : undefined},
	ID: arg => {},
	Image: ({message}) => {return checkImage(message, undefined, message.attachments.first())}
}

ArgList = class {
	constructor(args, desc) {
		this.args = args ?? []
		this.desc = desc ?? ""
	}

	parse(message, rawargs) {
		const args = []
		for (const arg of this.args) {
			const rawarg = rawargs.shift()
			if (rawarg) {
				const parser = typeParsers[arg.type]
				const parsedArg = parser ? parser({arg: rawarg, message}) : rawarg
				if (parsedArg === undefined) return void message.channel.send(`Invalid argument for "${arg.name}", it has to be of type "${arg.type}".`)
				args.push(parsedArg)
				if (arg.multiple) {
					for (const rawarg of rawargs) {
						const parsedExtraArg = parser ? parser({arg: rawarg, message}) : rawarg
						if (!parsedExtraArg) return void message.channel.send(`Invalid extra argument for "${arg.name}", it has to be of type "${arg.type}".`)
						args.push(parsedExtraArg)
					}
					break
				}
			} else if (arg.forced) {
				const desc = this.getFullDesc()
				const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`Missing required argument "${arg.name}"!`)
					.setDescription(desc)
				return void message.channel.send({embeds: [DiscordEmbed]})
			}
		}
		return args
	}

	getFullDesc() {
		const args = this.args.map(arg => {
			let argdesc = `${arg.type}: ${arg.name}`
			argdesc = arg.forced ? `<${argdesc}>` : `\{${argdesc}\}`
			if (arg.multiple) argdesc += " {...}"
			return argdesc
		})
		return args.length > 0 ? `*${args.join(" ")}*\n${this.desc}` : this.desc
	}
}

Command = class extends ArgList {
	constructor(object) {
		super(object.args, object.desc)
		this.section = object.section
		this.func = object.func
	}

	call(message, rawargs) {
		const args = this.parse(message, rawargs)
		if (args)
			this.func(message, args)
	}
}

commands = {}
const commandFiles = fs.readdirSync(`${packPath}/commands`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	let command = require(`${packPath}/commands/${file}`);
}

// Run this shit
let folders = ['skills', 'characters'] // i TOLD YOU there WILL be moreee

for (const i in folders) {
	let files = fs.readdirSync(`${packPath}/${folders[i]}`).filter(file => file.endsWith('.js'));
	for (const file of files) {
		require(`${packPath}/${folders[i]}/${file}`);
	}
}

client.on("guildCreate", (guild) => {
	makeDirectory(`${dataPath}/json/${guild.id}`);

	// Server Data
	setUpSettings(guild.id)
	setUpFile(`${dataPath}/json/${guild.id}/trials.json`)
	setUpFile(`${dataPath}/json/${guild.id}/parties.json`)
	setUpFile(`${dataPath}/json/${guild.id}/items.json`)
	setUpFile(`${dataPath}/json/${guild.id}/weapons.json`)
	setUpFile(`${dataPath}/json/${guild.id}/armors.json`)
	setUpFile(`${dataPath}/json/${guild.id}/blacksmiths.json`)
	setUpFile(`${dataPath}/json/${guild.id}/skills.json`)
	setUpFile(`${dataPath}/json/${guild.id}/loot.json`)
	setUpFile(`${dataPath}/json/${guild.id}/chests.json`)

	// Character Data
	setUpFile(`${dataPath}/json/${guild.id}/characters.json`)
	setUpFile(`${dataPath}/json/${guild.id}/enemies.json`)
	setUpFile(`${dataPath}/json/${guild.id}/parties.json`)

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

client.on("messageCreate", (message) => {
	if (message.channel.type !== 'DM') makeDirectory(`${dataPath}/json/${message.guild.id}`);
	if (message.author.bot) return;

	// Register commands
	prefix = getPrefix(message.guild.id)
	if (!message.content.startsWith(prefix)) return;
	let args = [...message.content.slice(prefix.length).matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
	if (args.length == 0) return;
	let command = commands[args[0]];
	if (!command) {
		for (const i in commands) {
			if (commands[i].aliases && commands[i].aliases.includes(args[0])) {
				command = commands[i];
				break;
			}
		}
	}

	args.shift()

	if (!command) return;
	command.call(message, args)
})

client.login(process.env.TOKEN);
console.log(`The bot is now in session! Enjoy!`)

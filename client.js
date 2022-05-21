///////////////////////////////////
// MAIN SCRIPT FOR BLOSSOM BATTLER //
// grassimp :) ////////////////////
///////////////////////////////////

//Discord.JS initiation.
Discord = require('discord.js');
Builders = require('@discordjs/builders');
client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MEMBERS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
		Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Discord.Intents.FLAGS.DIRECT_MESSAGES,
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

//hatebin, for converting long walls of text into links
hastebin = require('hastebin-gen');

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
	"healall",
	"healmp",
	"healallmp",
	"healhpmp",
	"healallhpmp",
	"revive",
	"material",
	"pacify"
]

itemTypeEmoji = {
	skill: '<:physical:973077052129423411>',
	
	heal: "<:healhp:973078508123328522>",
	healmp: "<:healmp:973078513827606589>",
	healhpmp: "<:healhpmp:973078513747902504>",

	revive: '<:revive:973078509868183572>',
	material: '<:material:973078509595537459>',
	pacify: '<:pacify:973077052142026752>',
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
	common: '<:common:973078463848280124>',
	uncommon: '<:uncommon:973078464083152906>',
	rare: '<:rare:973078463844057100>',
	veryrare: '<:veryrare:973078464963952670>',
	epic: '<:epic:973078463554658325>',
	legendary: '<:legendary:973078464011862066>',
	sentient: '<:sentient:973078464057991220>',
	artifact: '<:artifact:973078463227510825>'
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
	"infatuation",
	"blind",
	"confusion",
	"irradiation",
	"sensitive",

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
	infatuation: 'Infatuation',
	blind: 'Blindness',
	confusion: 'Confusion',
	irradiation: 'Irradiation',
	sensitive: 'Sensitive',

	// Positive Statusses
	happy: 'Happiness',
	mirror: 'Mirror'
}

statusEmojis = {
    burn: "<:burn:963387466423873607>",
	bleed: "<:bleed:963387466323206174>",
    poison: "<:poison:963389074146738216>",
    freeze: "<:freeze:963387466885259324>",
    paralyze: "<:electric:962465467400851518>",
	sleep: "<:sleep:963389074213847070>",
	dizzy: "<:dizzy:963387466935570444>",
	despair: "<:despair:963387466574856242>",
    brainwash: "<:brainwash:963413989537222666>",
	fear: "<:fear:963387466918813747>",
	rage: "<:rage:973076333838098452>",
	ego: "<:ego:963387466788794380>",
	silence: '<:silence:963389866983440456>',
	dazed: '<:dazed:963387466235134013>',
	hunger: '<:hunger:963387467002675261>',
	infatuation: '<:infatuation:973076333884227594>',
	blind: '<:blind:963387466570690560>',
	confusion: '<:confusion:963387466541330472>',
	irradiation: '<:irradiated:973076333599031379>',
	sensitive: '<:sensitive:973076333825499156>',

	// Positive Statusses
	mirror: '<:mirror:963389073974755358>',
	happy: '<:happy:973076333871644733>'
}

elementTechs = {
	burn: ['explode', 'wind', 'grass', 'nuclear'],
	bleed: ['slash', 'pierce', 'nuclear'],
	freeze: ['strike', 'explode', 'fire', 'earth', 'gravity', 'nuclear', 'metal'],
	paralyze: ['strike', 'slash', 'pierce', 'gravity'],
	dizzy: ['psychic', 'spirit', 'sound'],
	sleep: ['all'],
	despair: ['psychic', 'curse', 'spirit'],
	poison: ['slash', 'pierce', 'nuclear'],
	brainwash: ['psychic', 'bless', 'spirit'],
	fear: ['psychic', 'curse', 'spirit'],
	rage: ['bless', 'sound', 'psychic'],
	ego: ['psychic', 'sound', 'curse'],
	silence: ['sound', 'psychic'],
	dazed: ['psychic', 'wind', 'gravity', 'sound'],
	hunger: ['poison', 'nuclear'],
	mirror: ['strike', 'slash', 'pierce', 'explode', 'sound'],
	blind: ['all'],
	irradiation: ['fire', 'nuclear', 'water'],
	sensitive: ['strike', 'slash', 'pierce', 'explode', 'spirit', 'wind'],
	happy: ['psychic', 'bless', 'curse', 'spirit', 'sound']
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

// weather and terrain
weathers = [
	"rain", // 1.3x to water
	"thunder", // 1.3x to elec
	"sunlight", // 1.3x to fire
	"windy", // 1.3x to wind
	"sandstorm", // -33% perception to non earth main elements
	"hail" // 10 damage per turn to non ice main elements
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

quoteTypes = ['melee', 'phys', 'mag', 'allyatk', 'lb', 'tc', 'strong', 'badatk', 'landed', 'miss', 'superweak', 'weak', 'hurt', 'resist', 'block', 'repel', 'drain', 'dodge', 'death', 'kill', 'pacify', 'allydeath', 'heal', 'helped', 'console', 'imfine', 'lvl']

enemyTypes = [
	'miniboss',
	'boss',
	'bigboss',
	'deity'
]

enemyTypeColors = {
	none: '#00FF24',
	miniboss: '#F6FF00',
	boss: '#FF9000',
	bigboss: '#FF0000',
	deity: '#FFFFFF'
}

barEmojis = {
	hp: {
		left: '<:hpbarleft:974742791643090984>',
		middle: '<:hpbarmidl:974742791768920065>',
		right: '<:hpbarrigh:974742791722782780>'
	},

	mp: {
		left: '<:mpbarleft:974742791857012736>',
		middle: '<:mpbarmidl:974742791760531506>',
		right: '<:mpbarrigh:974742791865380885>'
	},

	xp: {
		left: '<:xpbarleft:974742791861207041>',
		middle: '<:xpbarmidl:974742791777316924>',
		right: '<:xpbarrigh:974742791609544725>'
	},

	none: {
		left: '<:nobarleft:974743873249243248>',
		middle: '<:nobarmidl:974743873760923678>',
		right: '<:nobarrigh:974743874390089778>'
	}
}

critEmoji = '<:crit:973077052083286056>';

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

getPrefix = (server) => {
	let settings = setUpSettings(server)
	return settings['prefix']
}

getCurrency = (server) => {
	let settings = setUpSettings(server)
	return settings['currency']
}

getCurrentDate = () => {
	let today = new Date();
	let dd = String(today.getDate()).padStart(2, '0');
	let mm = String(today.getMonth() + 1).padStart(2, '0');
	let yyyy = today.getFullYear();

	today = specialDates[`${dd} ${mm}`] ?? dd + '/' + mm + '/' + yyyy;

	if (dd === '17' && mm === '4' && yyyy == '2022')
		today = `Easter (${yyyy})`;
	
	return today
}

// Daily Quote - Resets at midnight
dailyQuote = {}

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

// Daily Enemy - Resets at midnight
dailyEnemy = {}

let tempEnemy = fs.readFileSync(dataPath+'/dailyenemy.txt', {flag: 'as+'});
if (tempEnemy && tempEnemy != '')
dailyEnemy = JSON.parse(tempEnemy);

// Daily Enemy Quote - Resets at midnight
dailyEnemyQuote = {}

let tempEnemyQuote = fs.readFileSync(dataPath+'/dailyenemyquote.txt', {flag: 'as+'});
if (tempEnemyQuote && tempEnemyQuote != '')
dailyEnemyQuote = JSON.parse(tempEnemyQuote);

// Daily Ship - Resets at midnight
dailyShip = {}

let tempShip = fs.readFileSync(dataPath+'/dailyship.txt', {flag: 'as+'});
if (tempShip && tempShip != '')
dailyShip = JSON.parse(tempShip);

function resetDailies() {
	dailyQuote = {};
	dailySkill = 'none';
	dailyItem = {};
	dailyWeapon = {};
	dailyArmor = {};
	dailyChar = {};
	dailyEnemy = {};
	dailyEnemyQuote = {};

	fs.writeFileSync(dataPath+'/dailyquote.txt', '');
	fs.writeFileSync(dataPath+'/dailyskill.txt', '');
	fs.writeFileSync(dataPath+'/dailyitem.txt', '');
	fs.writeFileSync(dataPath+'/dailyweapon.txt', '');
	fs.writeFileSync(dataPath+'/dailyarmor.txt', '');
	fs.writeFileSync(dataPath+'/dailycharacter.txt', '');
	fs.writeFileSync(dataPath+'/dailyenemy.txt', '');
	fs.writeFileSync(dataPath+'/dailyenemyquote.txt', '');
}

// reset if the last day isnt... well, the last day.
let lastDay = fs.readFileSync(dataPath+'/lastday.txt', {flag: 'as+'});
if (!lastDay || lastDay != getCurrentDate()) resetDailies();

fs.writeFileSync(dataPath+'/lastday.txt', getCurrentDate());

// reset by time.
function midnightInMS() {
    return new Date().setHours(24, 0, 0, 0) - new Date().getTime()
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

// Random Num
randNum = (minNum, maxNum) => {
	if (!maxNum) {
		return Math.round(Math.random()*minNum);
	} else {
		return minNum + Math.round(Math.random()*maxNum);
	}
}

// setUpFile
fileStore = {};
setUpFile = (file, force) => {
	if (fileStore[file] && !force) return fileStore[file];
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
				hpmpcap: 65,
				statcap: 99,
				basestatcap: 10,
				bstcap: 45,
				skillamount: 8,
				teamsize: 4,
				transformations: {
					hpcap: 10,
					statcap: 99,
					basestatcap: 10,
					bstcap: 15,
					level: 70
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
			encountered: [],
			desc: ""
		}

		fs.writeFileSync(`${dataPath}/json/${guild}/settings.json`, JSON.stringify(settings, '	', 4))
	}

	return settings
}

setUpUserData = (user) => {
	let userdata = setUpFile(`${dataPath}/userdata/${user}.json`)

	if (Object.keys(userdata).length === 0) {
		userdata = {
			exports: {}
		}

		fs.writeFileSync(`${dataPath}/userdata/${user}.json`, JSON.stringify(userdata, '	', 4))
	}

	return userdata
}

getBar = (type, value, maxvalue) => {
	let barType = barEmojis[type.toLowerCase()] ?? barEmojis.none;

	let p = Math.floor((parseInt(value)/parseInt(maxvalue))*10);

	let firstOne = barType.left;
	if (p < 1) firstOne = barEmojis.none.left;

	let lastOne = barType.right;
	if (p < 10) lastOne = barEmojis.none.right;

	let middleOnes = '';
	for (let i = 2; i < 9; i++) {
		middleOnes += (p >= i) ? barType.middle : barEmojis.none.middle;
	}

	return `${firstOne}${middleOnes}${lastOne}`;
}

backButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Back',
	emoji: '⬅️',
	customId: 'back'
})
forwardButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Forward',
	emoji: '➡️',
	customId: 'forward'
})
cancelButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Cancel',
	emoji: '⏸',
	customId: 'cancel'
})
pageButton = new Discord.MessageButton({
	style: 'SECONDARY',
	label: 'Page',
	emoji: '#️⃣',
	customId: 'page'
})

listArray = async(channel, theArray, author, forceIndex) => {
	let index = forceIndex ?? 10;

	const generateEmbed = async start => {
		const current = theArray.slice(start, start + index)
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

	const canFitOnOnePage = theArray.length <= index
	let embedMessage
	if (canFitOnOnePage) {
		embedMessage = await channel.send({
			embeds: [await generateEmbed(0)]
		})
		return
	}

	embedMessage = await channel.send({
		embeds: [await generateEmbed(0)],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]})]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == author
	})

	let currentIndex = 0;
	collector.on('collect', async interaction => {
		if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
			if (interaction.customId === 'back') {
				if (currentIndex - index < 0) {
					currentIndex = theArray.length - (theArray.length % index)
				} else {
					currentIndex -= index
				}
			} else if (interaction.customId === 'forward') {
				if (currentIndex + index >= theArray.length) {
					currentIndex = 0
				} else {
					currentIndex += index
				}
			}

			await interaction.update({
				embeds: [await generateEmbed(currentIndex)],
				components: [
					new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
				]
			})
		} else if (interaction.component.customId === 'page') {
			channel.send(`Please enter the page number you want to go to.`)
			const pageCollector = channel.createMessageCollector({
				time: 3000
			})

			await new Promise((resolve, reject) => {
				pageCollector.on('collect', async pageInteraction => {
					if (pageInteraction.author.id == author) {
						try {
							const page = parseInt(pageInteraction.content) - 1
							if (page > -1 && page <= Math.floor(theArray.length / index)) {
								currentIndex = page * index
								await interaction.update({
									embeds: [await generateEmbed(currentIndex)],
									components: [
										new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
									]
								})
								pageCollector.stop()
								resolve()
							} else {
								channel.send(`Please enter a valid page number.`)
								pageCollector.stop()
								resolve()
							}
						} catch (err) {
							channel.send('Please enter a valid page number.')
							pageCollector.stop()
							resolve()
						}
					}
				})
			})
		} else {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed(currentIndex)],
			components: []
			})
		}
	})
}

// Global JSONs
skillFile = setUpFile(`${dataPath}/json/skills.json`)
shipFile = setUpFile(`${dataPath}/json/ships.json`);
pmdFile = setUpFile(`${dataPath}/json/pmdquestions.json`);

function getDateAfterTwoWeeks() {
	const date = new Date();
	date.setDate(date.getDate() + 14);
	const dateString = date.toISOString();
	return dateString;
}

checkShips();

function resetShips() {
	shipFile = {};
	fs.writeFileSync(`${dataPath}/json/ships.json`, '{}');
}

function checkShips() {
	let lastWeek = fs.readFileSync(dataPath + '/datein2weeks.txt', { flag: 'as+' });
	const today = new Date();
	if (lastWeek && lastWeek <= today.toISOString()) {
		resetShips();
		writeShipDayFile()
	}
	
	if (!lastWeek) writeShipDayFile()
	
	function writeShipDayFile() {
	fs.writeFileSync(dataPath + '/datein2weeks.txt', getDateAfterTwoWeeks());
	}
}

setTimeout(function() {
	resetDailies();
	checkShips()
}, midnightInMS());

typeParsers = {
	Num: ({arg}) => {return isNaN(arg) ? undefined : parseInt(arg)},
	Decimal: ({arg}) => {return isNaN(arg) ? undefined : parseFloat(arg)},
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
		this.checkban = object.checkban
		this.admin = object.admin
		if (object.aliases) {
			const aliases = object.aliases
			object.section = "aliases"
			object.aliases = null
			for (const alias of aliases)
				commands[alias] = new Command(object)
		}
	}

	call(message, rawargs) {
		const args = this.parse(message, rawargs)
		if (!args)
			return
		if (this.checkban && utilityFuncs.isBanned(message.author.id, message.guild.id))
			return message.channel.send(`${message.author.username}, you are banned from using this bot.`)
		if (this.admin && !utilityFuncs.isAdmin(message))
			return message.channel.send(this.admin);
		this.func(message, args)
	}
}

commands = {}
const commandFiles = fs.readdirSync(`${packPath}/commands`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	let command = require(`${packPath}/commands/${file}`);
}

// Run this shit
let folders = ['skills', 'characters', 'party', 'battle', 'items'] // i TOLD YOU there WILL EEEVEN be moreee

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
		.setDescription(`I'm Blossom Battler, and welcome to my extravagant Real-Time RPG experience.`)
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
	if (message.author.bot) return;
	if (message.channel.type === 'DM') return message.channel.send("Don't use me in DMs! That's kinda sussy!");

	// Set up directory :)
	makeDirectory(`${dataPath}/json/${message.guild.id}`);

	// Register commands
	prefix = getPrefix(message.guild.id)
	if (!message.content.startsWith(prefix)) return;

	let args = [...message.content.slice(prefix.length).matchAll(/"([^"]*?)"|[^ ]+/gm)].map(el => el[1] || el[0] || "");
	if (args.length == 0) return;

	let command = commands[args[0]];
	if (!command) return;

	args.shift();
	command.call(message, args);
})

//last ditch things
makeDirectory(`${dataPath}/userdata`)

client.login(process.env.TOKEN);
console.log(`The bot is now in session! Enjoy!`)

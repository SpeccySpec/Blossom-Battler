// Path to 'data' folder
dataPath = './data'

// Path to 'packages' folder
packPath = './packages'

// Bot Stuff
utilityFuncs = require(packPath + '/utilityFuncs');
charFuncs = require(packPath + '/charFuncs');
enemyFuncs = require(packPath + '/enemyFuncs');
attackFuncs = require(packPath + '/attackFuncs');
turnFuncs = require(packPath + '/turnFuncs');
skillFuncs = require(packPath + '/skillFuncs');

RF = require(packPath + '/relicFuncs');

//Canvas, for making custom pictures.
Canvas = require('canvas');

//FS, for writing files.
fs = require('fs');

//Request, for requesting files
request = require('request');

//hatebin, for converting long walls of text into links
hastebin = require('hastebin-gen');

//ArgList class, for the Command class
const ArgList = require(packPath + "/arglist.js");

////////////////////
// Global Objects //
////////////////////

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
	water: '#030bfc',
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
	normal: '<:normal:979825616809508895>',
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
	healall: "<:healall:1008718601718616115>",
	healmp: "<:healmp:973078513827606589>",
	healallmp: "<:healallmp:1008718604772061307>",
	healhpmp: "<:healhpmp:973078513747902504>",
	healallhpmp: "<:healallhpmp:1008718603463438366>",

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
    "burn", // 1/10th HP lost. [WEAK] 1/5th HP lost. [RESIST] 1/20th HP lost.
	"bleed", // 1/10th HP lost. [WEAK] 1/5th HP lost. [RESIST] 1/20th HP lost.
    "freeze", // One turn lost. [WEAK] Two turns lost. [RESIST] Chance to have turn lost.
    "paralyze", // Turns can be lost. Chance for this to happen lowers over time. [WEAK] Doubled Length. [RESIST] Halved Length.
	"dizzy", // 50% accuracy on moves [WEAK] 33% accuracy on moves [RESIST] 80% accuracy on moves
	"sleep",
	"despair",
    "toxin",
    "brainwash",
	"fear",
	"rage",
	"ego",
	"silence", // Cannot use magic skills.
	"dazed", // Cannot use physical skills.
	"hunger",
	"infatuation",
	"blind",
	"confusion",
	"irradiation",
	"sensitive",
	"drenched", // Stackable. Nullifies status affinities - both positive and negative - while afflicted.

	// Positive Statusses
	"happy",
	"mirror",
	"airborne"
]

statusNames = {
    burn: 'Burning',
	bleed: 'Bleeding',
    freeze: 'Freezing',
    paralyze: 'Paralysis',
	sleep: 'Sleeping',
	dizzy: 'Dizziness',
	despair: 'Despair',
    toxin: 'Toxin',
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
	drenched: 'Drenched',

	// Positive Statusses
	happy: 'Happiness',
	mirror: 'Mirror',
	airborne: 'Airborne'
}

statusEmojis = {
    burn: "<:burn:963413989688213524>",
	bleed: "<:bleed:963413989281390612>",
    toxin: "<:toxin:963413990044737548>",
    freeze: "<:freeze:963413989960843324>",
    paralyze: "<:electric:963413844733100042>",
	sleep: "<:sleep:980497282103390308>",
	dizzy: "<:dizzy:963413989805662269>",
	despair: "<:despair:963413989805674516>",
    brainwash: "<:brainwash:963413989537222666>",
	fear: "<:fear:963413990376091668>",
	rage: "<:rage:963413990384472084>",
	ego: "<:ego:963413989839212564>",
	silence: '<:silence:963413990145409036>',
	dazed: '<:dazed:963413989805682778>',
	hunger: '<:hunger:963413990027984936>',
	infatuation: '<:infatuation:963413990195757107>',
	blind: '<:blind:963413989482696754>',
	confusion: '<:confusion:963413989604339762>',
	irradiation: '<:irradiated:963413990199947294>',
	sensitive: '<:sensitive:973076333825499156>',
	drenched: '<:water:963413845886505011>',

	// Positive Statusses
	mirror: '<:mirror:963413990229311588>',
	happy: '<:happy:973076333871644733>',
	airborne: '<:wind:963413845848776714>',

	// Buffs
	atkup: "<:atkup:990629395486089216>",
	magup: "<:magup:990629404126355496>",
	endup: "<:endup:990629401517506580>",
	aglup: "<:aglup:991703686881480794>",
	prcup: '<:prcup:990629408907870330>',
	critup: "<:critup:990629398258540604>",

	// Debuffs
	atkdown: "<:atkdown:990629394236211230>",
	magdown: "<:magdown:990629402851299338>",
	enddown: "<:enddown:990629399902695445>",
	agldown: "<:agldown:991703685098917908>",
	prcdown: '<:prcdown:990629407238529044>',
	critdown: "<:critdown:990629396983476275>",

	// Shields
	reduce: "<:shield:991704544847335546>",
	repelphys: "<:tetrakarn:991704547791749200>",
	repelmag: "<:makarakarn:991704552086716437>",

	pinch: "<:pinch:1004506376036429924>",
}

elementTechs = {
	burn: ['explode', 'wind', 'grass', 'nuclear'],
	bleed: ['slash', 'pierce', 'nuclear'],
	freeze: ['strike', 'explode', 'fire', 'earth', 'gravity', 'nuclear', 'metal'],
	paralyze: ['strike', 'slash', 'pierce', 'gravity'],
	dizzy: ['psychic', 'spirit', 'sound'],
	sleep: ['all'],
	despair: ['psychic', 'curse', 'spirit'],
	toxin: ['slash', 'pierce', 'nuclear'],
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
	happy: ['psychic', 'bless', 'curse', 'spirit', 'sound'],
	airborne: ['pierce', 'electric', 'metal', 'gravity']
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

// Enemy AI
aiTypes = {
	easy: "Select random options. Only change if the target is dead. Never consider bad outcomes. Never watch out for affinities. Never watch out for shields, traps, ect.",
	medium: "Little consideration for bad outcomes, aware of affinities but must discover them first. Aware of traps and shields when deployed.",
	hard: "Actively try to avoid bad outcomes, but may slip up sometimes. Take advantage of affinities, but must discover them first. Avoid traps and shields when deployed. Aware that Almighty, Feint and BrickBreak moves can bypass shields.",
	perfect: "Perfect play. Avoid bad outcomes. Abuses affinities, without needing to discover them. Avoid or break traps and shields when deployed.",
	legacy: "The way we used to do it..."
}

// weather and terrain
weathers = [
	'none',
	"rain", // 1.3x to water, 0.7x to fire. Also puts out burning fighters.
	"thunder", // 1.3x to elec, water skills become dualelement electric.
	"sunlight", // 1.3x to fire, 1.1x to nuclear, 0.7x to water, grass. Also thaws freezing fighters.
	"windy", // 1.3x to wind, physicals get dualelement wind.
	"sandstorm", // -33% perception to non earth main elements.
	"hail" // 10 ice based damage per turn to non ice main elements. Yes, that means this is affected by affinities.
]

terrains = [
	'none',
	"flaming", // 10 damage with 10% chance of burn to non fire main elements. Also puts out freezing fighters.
	"thunder", // 1.2x to elec. 1.25x paralysis chance.
	"grassy", // 10% heal before turn. 17% for grass mains.
	"light", // 1.3x to bless. 0.5x to curse.
	"psychic", // reverse turn order.
	"misty", // ignore status inflictions. Also removes all status effects on turn.
	"sky", // 1.2x to wind. 0.9x to earth. +25% agl. +40% to wind mains.
	"muddy", // 1.35x to earth, 0.8x accuracy to physicals, -33% agl to non earth mains.

	// boss specific
	"flooded", // 1.3x to water. Makes physical skills dualelement water.
	"swamp", // 1.3x to earth and grass. Grass or Earth skills become dualelement with eachother.
	"glacial", // 1.3x to ice, +20% freeze chance on ice skills. Water skills become ice.
	"fairydomain", // 1.2x to Psychic and Bless. Psychic, Spirit skills become dualelement bless.
	"graveyard", // 1.3x to Spirit. Curse Skills become DualElement Spirit.
	"factory", // 1.5x to Metal.
	"blindingradiance", // 1.5x to Bless. Curse Skills become unusable. Ignore Status Inflictions.
	"eternaldarkness" //1.5x to Curse. Bless Skills become unusable. All Curse Skills get Feint.
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

trustLvl = {
	meleeatk: 3,
	showoff: 6,
	healbuff: 10,
	morehealbuff: 20
}

quoteTypes = ['melee', 'phys', 'mag', 'allyatk', 'lb', 'tc', 'strong', 'badatk', 'landed', 'miss', 'superweak', 'weak', 'hurt', 'resist', 'block', 'repel', 'drain', 'dodge', 'death', 'kill', 'pacify', 'allydeath', 'heal', 'helped', 'console', 'imfine', 'lvl']

enemyTypes = [
	'miniboss',
	'boss',
	'bigboss',
	'deity'
]

weaponClasses = {
	none: "Every weapon can be used, albeit... inefficiently. Each weapon will lose 40% of it's original benefit.",
	bludgeon: "Hammers, Maces, Clubs",
	bladed: "Swords, Daggers, Katanas",
	longbladed: "Longswords, Greatswords",
	pierce: "Rapiers, Knives",
	ranged: "Bow & Arrow, Ninja Stars",
	books: "Magical Books that allow one to cast spells.",
	staff: "Magical Staffs or Wands",
	incorporeal: "Magical Staffs or Wands"
}

armorClasses = {
	none: "Every armor can be worn. Heavy will decrease agility, Magic will decrease endurance",
	light: "Lighter, smaller pieces of armor like Shields.",
	heavy: "Entire suits of armor.",
	magic: "Magical pieces of armor, like barriers."
}

accessoryClasses = {
	default: "<:golden:973077051751940138>",
	amulet: "<:magic:1008794362307674204>",
	necklace: "<:magic:1008794362307674204>",
	crystal: "<:magic:1008794362307674204>",
	magical: "<:magic:1008794362307674204>"
}

classEmoji = {
	weapon: {
		bludgeon: "<:bludgeon:1008794352706932817>",
		bladed: "<:bladed:1008794351591239842>",
		longbladed: "<:longbladed:1008794360676110457>",
		pierce: "<:pierce:1008794365231104052>",
		ranged: "<:ranged:1008794366648791161>",
		books: "<:books:1008794354959269938>",
		staff: "<:staff:1008794368750141540>",
		incorporeal: "<:incorporeal:1085978225911533668>"
	},
	armor: {
		light: "<:light:1008794358637662338>",
		heavy: "<:heavy:1008794356620214433>",
		magic: "<:magic:1008794362307674204>"
	},
	accessory: {
		default: "<:golden:973077051751940138>",
		amulet: "<:magic:1008794362307674204>",
		necklace: "<:magic:1008794362307674204>",
		crystal: "<:magic:1008794362307674204>",
		magical: "<:magic:1008794362307674204>"
	}
}

leaderSkillTxt = {
	boost: 'Boosts the specified type.',
	discount: 'Takes away the amount of cost specified to the specified type.',
	buff: 'Start the battle with the specified stat buff.',
	debuff: 'Start the battle with the specified stat debuff to the enemy team.',
	status: 'Increased chance to land the specified status effect.',
	crit: 'Increased crit chance to the specified element.',
	money: 'Increased money gain after battle.',
	items: 'Increased item gain after battle.',
	pacify: 'Pacify Enemies by the specified percentage at the start of battle.',
	endure: 'One character in your team can endure one fatal attack.',
}

enemyTypeColors = {
	none: '#00FF24',
	miniboss: '#F6FF00',
	boss: '#FF9000',
	bigboss: '#FF0000',
	deity: '#FFFFFF'
}

barEmojis = {
	hp: {
		left: '<:hpbarleft:1008737386546606171>',
		middle: '<:hpbarmidl:1008737388442431640>',
		right: '<:hpbarrigh:1008737390501838978>'
	},

	mp: {
		left: '<:mpbarleft:1008737392322162688>',
		middle: '<:mpbarmidl:1008737394440290394>',
		right: '<:mpbarrigh:1008737396449362041>'
	},

	xp: {
		left: '<:xpbarleft:1008737404242382909>',
		middle: '<:xpbarmidl:1008737405731340309>',
		right: '<:xpbarrigh:1008737407811727460>'
	},

	none: {
		left: '<:nobarleft:1008737398424862830>',
		middle: '<:nobarmidl:1008737400169697280>',
		right: '<:nobarrigh:1008737402199748689>'
	},

	angel: {
		lefter: '<:angelbarlefter:1009835845362122863>',
		left: '<:angelbarleft:1009835843722158211>',
		middle: '<:angelbarmidl:1009835847123734672>',
		right: '<:angelbarright:1009835849061503067>',
		righter: '<:angelbarrighter:1009835850919592076>'
	},

	devil: {
		lefter: '<:devilbarlefter:1009835854400852029>',
		left: '<:devilbarleft:1009835852484067500>',
		middle: '<:devilbarmidl:1009835856376365076>',
		right: '<:devilbarright:1009835858377064529>',
		righter: '<:devilbarrighter:1009835860159635609>'
	},

	none_angel: {
		lefter: '<:angelbarlefter:1009835845362122863>',
		left: '<:noangelbarleft:1009835862185488474>',
		middle: '<:nobarmidl:1008737400169697280>',
		right: '<:noangelbarright:1009835864190361754>',
		righter: '<:angelbarrighter:1009835850919592076>'
	},

	none_devil: {
		lefter: '<:devilbarlefter:1009835854400852029>',
		left: '<:nodevilbarleft:1009835866518196244>',
		middle: '<:nobarmidl:1008737400169697280>',
		right: '<:nodevilbarright:1009835868443385948>',
		righter: '<:devilbarrighter:1009835850919592076>'
	}
}

noneBars = {
	angel: 'none_angel',
	devil: 'none_devil'
}

// Misc. Emojis
critEmoji = '<:crit:973077052083286056>';
leaderEmoji = '<:leader:993557760581058610>';
goldenEmoji = `<:golden:973077051751940138>`;

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

//////////////////////
// Global functions //
//////////////////////
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

truncNum = (x, n) => {
    let z = n*10;
    return Math.floor(x*z)/z;
}

// setUpFile
fileStore = {};
setUpFile = (file, force) => {
	if (fileStore[file] && !force) return fileStore[file];

	// check if the directories before this file exists
	let dir = file.split("/");
	dir.pop();
	makeDirectory(dir.join("/"));

	// Let's get this file!
	let fileRead = fs.readFileSync(file, {flag: 'as+'});

	if (!fileRead || fileRead == "" || fileRead == " ") {
		fs.writeFileSync(file, "{}");
		return {};
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

getServerUserFromGuild = (user, guild) => {
    let userTxt = ''
	if (user) {
		if (user === 'Default')
			userTxt = 'Default/Official';
		else {
			try { userTxt = guild.members.cache.get(user).user.username } catch (e) { userTxt = user }
		}
	} else
		userTxt = 'Default/Official';

    return userTxt;
}

setUpSettings = (guild) => {
	let settings = setUpFile(`${dataPath}/json/${guild}/settings.json`);

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
				moneyrate: 1,
				goldchance: 0.01,
				mainelement: 1.2,
				crit: 1.5,
				tech: 1.2,
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
			currency_emoji: '<:token:981579648993460355>',
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
	if (typeof(user) != 'string') user = user.id;

	let userdata = setUpFile(`${dataPath}/userdata/${user}.json`)

	if (Object.keys(userdata).length === 0) {
		userdata = {
			stars: 0,
			exports: {},
			vars: {},
			achievements: {}
		}

		fs.writeFileSync(`${dataPath}/userdata/${user}.json`, JSON.stringify(userdata, '	', 4))
	}

	return userdata
}

getBar = (type, value, maxvalue, len) => {
	let barType = barEmojis[type.toLowerCase()] ?? barEmojis.none;
	let noneBar = barEmojis[noneBars[type.toLowerCase()] ?? 'none']

	let p = Math.floor((parseInt(value)/parseInt(maxvalue))*10);

	let firstOne = barType.left
	if (p < 1) firstOne = noneBar.left;
	if (barType.lefter) {
		if (typeof barType.lefter == 'object') barType.lefter = barType.lefter.join('');
		firstOne = barType.lefter + firstOne;
	}

	let lastOne = barType.right;
	if (p < (len ?? 10)) lastOne = noneBar.right;
	if (barType.righter) {
		if (typeof barType.righter == 'object') barType.righter = barType.righter.join('');
		lastOne = lastOne + barType.righter;
	}

	let middleOnes = '';
	for (let i = 2; i < ((len ?? 10)-1); i++) {
		middleOnes += (p >= i) ? barType.middle : noneBar.middle;
	}

	return `${firstOne}${middleOnes}${lastOne}`;
}

replaceTxt = (str, ...txt) => {
	let a = []
	for (let i in txt) {
		if (i%2) {// Odd
			a[1] = txt[i];
		} else {
			a[0] = txt[i];
		}

		if (a.length < 2) continue;

		if (a[0] && a[1]) {
			while(str.includes(a[0])) str = str.replace(a[0], a[1]);
			a = [];
		}
	}

	return str;
}

let phys = ['burn', 'freeze', 'bleed', 'paralyze', 'toxin', 'dazed', 'hunger', 'blind', 'irradiation', 'mirror'];
isPhysicalStatus = (status) => {
	if (!status) return false;

	return phys.includes(status.toLowerCase());
}

let stackable = ['confusion', 'infatuation', 'drenched'];
isStackableStatus = (status) => {
	if (!status) return false;

	return stackable.includes(status.toLowerCase());
}

getPrefix = (server) => {
	let settings = setUpSettings(server)
	return settings['prefix']
}

getCurrency = (server) => {
	let settings = setUpSettings(server)
	return ((settings['currency_emoji'] != '' && settings['currency_emoji'] != '') ? settings['currency_emoji'] : '') + ' ' + settings['currency']
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

//////////////
// COMMANDS //
//////////////
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
			for (const alias of aliases) {
				commands[alias] = new Command(object)
				commands[alias].alias = true;
			}
		}
	}

	call(message, rawargs, guilded) {
		const args = this.parse(message, rawargs)
		if (!args)
			return
		if (this.checkban && utilityFuncs.isBanned(message.author.id, message.guild.id))
			return message.channel.send(`${message.author.username}, you are banned from using this bot.`)
		if (this.admin && !utilityFuncs.isAdmin(message))
			return message.channel.send(this.admin);
		this.func(message, args, guilded ?? false);
	}
}

commands = {}
const commandFiles = fs.readdirSync(`${packPath}/commands`).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	let command = require(`${packPath}/commands/${file}`);
}
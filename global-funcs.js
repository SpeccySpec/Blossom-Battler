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
	"acid",
    "nuclear",
    "metal",
    "curse",
    "bless",
	"spirit",
	"gravity",
	"sound",
    "almighty",

	"status",
    "support",
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
	acid: "<:acid:1224111765504266300>",
	metal: "<:metal:963413845131530240>",
	curse: "<:curse:963413844531740684>",
	bless: "<:bless:963413844628230254>",
	spirit: '<:spirit:963413845265756171>',
	nuclear: "<:nuclear:963413845156692028>",
	gravity: "<:gravity:963413844951179314>",
	sound: "<:sound:963413845517422642>",

	almighty: "<:almighty:963413844326219787>",

	status: "<:status:963413845693587497>",
	support: "<:status:963413845693587497>",
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
	acid: '#99ffc3',
	metal: '#d6d6d6',
	curse: '#7a1730',
	bless: '#fff4cc',
	spirit: '#F3C6FF',
	nuclear: '#5eb000',
	gravity: '#030a96',
	sound: '#15ff00',

	almighty: '#ffffff',

	status: '#0008ff',
	support: '#0008ff',
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
	"pacify",
	"key"
]

consumableItems = ["heal","healall","healmp","healallmp","healhpmp","healallhpmp","revive"];

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
	key: '<:key_item:1222988722660970578>'
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
	"stun",
	"dissolved",
    "paralyze", // Turns can be lost. Chance for this to happen lowers over time. [WEAK] Doubled Length. [RESIST] Halved Length.
	"dizzy", // 50% accuracy on moves [WEAK] 33% accuracy on moves [RESIST] 80% accuracy on moves
	"sleep",
	"despair",
    "toxin",
    "brainwash",
	"fear",
	"rage",
	"ego",
	"blind",
	"confusion",
	"irradiation",
	"sensitive",
	"insanity", // Random Effects based on chance, different against bosses
	"stagger",
	"shrouded",
	"apathy",
	"grassimped",
	"tired",
	"disabled",
	"target",
	"leisure",
	"cursed",
	"dispelled",
	"unstable",

	// Neutral Statusses
	"dry",
	"wet", 
	"light",
	"heavy",
	"enchanted",
	"invisible",
	"chilled",
	"overheat",
	"brimstone",
	"trisagion",
	"neutralized",

	// Positive Statusses
	"happy",
	"mirror",
	"dragonscale",
	"airborne",
	"cloud9",
	"blessed",
	"brave",
	"lovable",
	"energized",
	"haste"
]

statusNames = {
    burn: 'Burning',
	bleed: 'Bleeding',
    freeze: 'Freezing',
    stun: 'Stun',
	dissolved: 'Dissolving',
    paralyze: 'Paralysis',
	sleep: 'Sleeping',
	dizzy: 'Dizziness',
	despair: 'Despair',
    toxin: 'Toxin',
	fear: 'Fear',
	rage: 'Rage',
	ego: 'Ego',
	blind: 'Blindness',
	confusion: 'Confusion',
	irradiation: 'Irradiation',
	sensitive: 'Sensitivity',
	insanity: 'Insanity',
	stagger: 'Staggering',
	shrouded: 'Shrouded',
	apathy: 'Apathy',
	grassimped: 'Grassimped',
	tired: "Tiredness",
	disabled: "Disability",
	target: "Target",
	leisure: 'Leisure',
	petrified: 'Petrification',
	cursed: 'Cursed',
	dispelled: 'Dispelled',
	unstable: 'Unstable',

	// Neutral Statusses
	dry: 'Dried',
	wet: 'Wet', 
	light: 'Light',
	heavy: 'Heavy',
	enchanted: 'Enchanted',
	invisible: 'Invisible',
	chilled: "Chilled",
	overheat: "Overheating",
	brimstone: 'Brimstone',
	trisagion: 'Trisagion',
	neutralized: 'Neutralized',

	// Positive Statusses
	happy: 'Happiness',
	mirror: 'Mirror',
	dragonscale: 'Dragon Scale',
	airborne: 'Airborne',
	cloud9: 'Cloud 9',
	blessed: 'Blessed',
	brave: 'Brave',
	lovable: 'Lovable',
	energized: 'Energization',
	haste: 'Haste'
}

statusEmojis = {
    burn: "<:burn:1224662396313014324>",
	bleed: "<:bleed:963413989281390612>",
    toxin: "<:toxin:963413990044737548>",
    freeze: "<:freeze:963413989960843324>",
	stun: "<:stun:1225850856021168200>",
    paralyze: "<:paralyze:1224050178307260517>",
	sleep: "<:sleep:980497282103390308>",
	dizzy: "<:dizzy:963413989805662269>",
	despair: "<:despair:963413989805674516>",
	fear: "<:fear:963413990376091668>",
	rage: "<:rage:963413990384472084>",
	ego: "<:ego:963413989839212564>",
	blind: '<:blind:963413989482696754>',
	confusion: '<:confusion:963413989604339762>',
	irradiation: '<:irradiated:963413990199947294>',
	sensitive: '<:sensitive:1224663804613361756>',
	insanity: '<:insanity:1217924742237913218>',
	stagger: '<:staggered:1223972073014300682>',
	shrouded: '<:shrouded:1223968915122815026>',
	apathy: '<:apathy:1224057009511338154>',
	dissolved: '<:dissolved:1224276500870725712>',
	grassimped: '<:grassimped:1224076081225531412>',
	tired: '<:tired:1224663100918206576>',
	disabled: '<:disabled:1224663101962453042>',
	leisure: '<:leisure:1224663103229268078>',
	petrified: '<:petrification:1224993134744698950>',
	target: '<:target:1224663104575508481>',
	cursed: '<:cursed:1228457914096681050>',
	dispelled: '<:dispelled:1228457908531101706>',
	unstable: '<:unstable:1228727138736410665>',

	// Neutral Statusses
	dry: '<:dry:1224057395706204262>',
	wet: '<:wet:1224993103895728218>', 
	light: '<:light:1224309188755456000>',
	heavy: '<:heavy:1224309198834372608>',
	enchanted: '<:enchanted:1224285253170892851>',
	invisible: '<:invisible:1224290091661394020>',
	chilled: '<:chilled:1224993256299827271>',
	overheat: '<:overheat:1224993287509905409>',
	brimstone: '<:brimstone:1224663099794128916>',
	trisagion: '<:trisagion:1228641515614634007>',
	neutralized: '<:neutralized:1228719416884199476>',

	// Positive Statusses
	mirror: '<:mirror:963413990229311588>',
	dragonscale: '<:dragonscale:1224681842846994572>',
	happy: '<:happy:1224044692358828092>',
	airborne: '<:airborne:1225491225495343155>',
	cloud9: '<:cloud9:1224993225878802463>',
	blessed: '<:blessed:1223966695241158666>',
	brave: '<:brave:1223985925206446170>',
	lovable: '<:lovable:1224346501237575833>',
	energized: '<:energized:1225589766913785998>',
	haste: '<:haste:1224663098581975061>',

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
	stun: ['strike', 'earth', 'metal', 'electric'],
	paralyze: ['strike', 'slash', 'pierce', 'gravity'],
	dizzy: ['psychic', 'spirit', 'sound'],
	sleep: ['all'],
	despair: ['psychic', 'curse', 'spirit'],
	toxin: ['slash', 'pierce', 'nuclear'],
	fear: ['psychic', 'curse', 'spirit'],
	rage: ['bless', 'sound', 'psychic'],
	ego: ['psychic', 'sound', 'curse'],
	mirror: ['strike', 'slash', 'pierce', 'explode', 'sound'],
	blind: ['strike', 'slash', 'pierce', 'explode'],
	irradiation: ['fire', 'nuclear', 'water'],
	sensitive: ['strike', 'slash', 'pierce', 'explode', 'spirit', 'wind'],
	insanity: ['psychic', 'curse'],
	stagger: ['strike', 'earth', 'gravity'],
	grassimped: ['fire', "wind"],
	tired: ['electric', 'sound', 'ice', 'explode'],
	disabled: ['sound', 'acid', 'gravity', 'psychic'],
	leisure: ['earth', 'gravity', 'acid'],

	// Neutral Statusses
	enchanted: ['strike', 'slash', 'pierce'],
	invisible: ['curse', 'bless', 'psychic'],
	brimstone: ['fire', 'earth', 'curse'],
	trisagion: ['water', 'wind', 'bless'],

	// Positive Statusses
	happy: ['psychic', 'bless', 'curse', 'spirit', 'sound'],
	airborne: ['pierce', 'electric', 'metal', 'gravity'],
	cloud9: ['wind', 'water', 'ice', 'nuclear'],
	dragonscale: ['psychic', 'spirit', 'bless', 'curse', 'nuclear'],
	energized: ['psychic', 'poison', 'curse', 'gravity'],
	haste: ['electric', 'wind', 'metal']
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
	'none', //
	"rain", //
	"thunderstorm", //
	"sunlight", //
	"windy", //
	"sandstorm", //
	"hail", //
	"radiation", //
	"earthquake", //
	"smog", //
	"airstrikes", //
	"cherryblossoms",
	"fallingash", //
	"blizzard", //

	"acidrain", //
	"cindershower", //
	"meteorshower", //
	"junkstorm", //

	"darkmoon", //
	"eclipse", //
	"bloodmoon", //
	"supermoon", //
	"bluemoon", //
]

weatherDescs = {
	none: {
		name: "Normal",
		emoji: "",
		desc: "Just the usual weather, nothing interesting."
	},
	rain: {
		name: "Rain",
		emoji: "<:rain:1225501726073819187>",
		desc: `Gives **30%** more skill power to ${elementEmoji['water']}**water** skills but reduces skill power of ${elementEmoji['fire']}**fire** skills by **30%**.\nWill put out the ${statusEmojis['burn']}**burning** fighters.\nWill make fighters ${statusEmojis['wet']}**wet**.`
	},
	thunderstorm: {
		name: "Thunderstorm",
		emoji: "<:thunderstorm:1225504268430213270>",
		desc: `Gives **30%** more skill power to ${elementEmoji['electric']}**electric** skills and **10%** more skill power to ${elementEmoji['water']}**water** skills.\n${elementEmoji['water']}**Water** skills will also get the ${elementEmoji['electric']}**electric dual typing** and **single ${statusEmojis['paralyze']}paralyze** chance is raised by **25%**.`
	},
	sunlight: {
		name: "Sunlight",
		emoji: "<:sunlight:1219375987255677031>",
		desc: `Gives **30%** more skill power to ${elementEmoji['fire']}**fire** skills and **10%** more skill power to ${elementEmoji['nuclear']}**nuclear** skills, but reduces skill power of ${elementEmoji['water']}**water** and ${elementEmoji['grass']}**grass** skills by **30%**.\nWill thaw out the ${statusEmojis['freeze']}**freezing** fighters.\nWill make fighters ${statusEmojis['overheat']}**overheat**.`
	},
	windy: {
		name: "Windy",
		emoji: "<:windy:1225505946009337856>",
		desc: `Gives **30%** more skill power to ${elementEmoji['wind']}**wind** skills.\n<:physical:973077052129423411>**Physical** single element **non-${elementEmoji['wind']}wind** skills will also get the ${elementEmoji['wind']}**wind dual typing**.`
	},
	sandstorm: {
		name: "Sandstorm",
		emoji: "<:sandstorm:1219379309920387162>",
		desc: `Decreases perception by **30%** for **non-${elementEmoji['earth']}earth** main fighters.\nWill make fighters ${statusEmojis['dry']}**dry**.`
	},
	hail: {
		name: "Hail",
		emoji: "<:hail:1225500528742760629>",
		desc: `Attacks **non-${elementEmoji['ice']}ice** main fighters with **10 ${elementEmoji['ice']}ice** damage.\nDoubles damage the weaker the fighter is.\nWill make fighters ${statusEmojis['chilled']}**chilled**.`
	},
	radiation: {
		name: "Radiation",
		emoji: "<:radiation:1225877694890115092>",
		desc: `Inflicts a **random debuff** on a fighter between turns.\nEvery turn there's a **10%** chance they get ${statusEmojis['irradiation']}**irradiated**.`
	},
	earthquake: {
		name: "Earthquake",
		emoji: "<:earthquake:1225880581422710807>",
		desc: `Gives **30%** more skill power to ${elementEmoji['earth']}**earth** skills.\nEvery turn there's a **10%** chance they get ${statusEmojis['stagger']}**staggered**.`
	},
	smog: {
		name: "Smog",
		emoji: "<:smog:1225870978404581386>",
		desc: `Every turn there's a **20%** chance a fighter gets ${statusEmojis['shrouded']}**shrouded** and a **40%** that their raw ${statusEmojis['magdown']}**PRC** stat is lowered by **30%**.`
	},
	airstrikes: {
		name: "Air Strikes",
		emoji: "<:airstrikes:1225877692927311902>",
		desc: `Every turn a random fighter is attacked with **10 ${elementEmoji['explode']}explode** damage.`
	},
	cherryblossoms: {
		name: "Cherry Blossoms",
		emoji: "<:cherryblossom:1225867080218443776>",
		desc: `Has a **30%** chance to increase the raw ${statusEmojis['critup']}**LUK** stat by **25%**.\nEvery turn a random fighter becomes ${statusEmojis['blessed']}**blessed**.`
	},
	fallingash: {
		name: "Falling Ash",
		emoji: "<:fallingash:1225870976198115358>",
		desc: `Every fighter has a **20%** chance of getting ${statusEmojis['burn']}**burned** every turn.`
	},
	blizzard: {
		name: "Blizzard",
		emoji: "<:blizzard:1219385823795875982>",
		desc: `Gives **50%** more skill power to ${elementEmoji['ice']}**ice** skills but reduces skill power of ${elementEmoji['fire']}**fire** skills by **50%**.\nWill put out the ${statusEmojis['burn']}**burning** fighters and **__single__ ${statusEmojis['freeze']}freezing** chance is raised by **25%**.`
	},

	acidrain: {
		name: "Acid Rain",
		emoji: "<:acidrain:1225866899502661715>",
		desc: `Attacks **non-${elementEmoji['acid']}acid** main fighters with **10 ${elementEmoji['acid']}acid** damage.\nDoubles damage the weaker the fighter is.\nEvery turn there's a **10%** chance they get ${statusEmojis['dissolved']}**dissolved**.`
	},
	cindershower: {
		name: "Cinder Shower",
		emoji: "<:cindershower:1265642394246709398>",
		desc: `Every turn, deal **${elementEmoji['fire']}Fire** based damage to a fighter on their turn.\nAffinity based.\nAny affliction of **${statusEmojis['overheat']}Overheating** will afflict **${statusEmojis['burn']}Burning** instead.`
	},
	meteorshower: {
		name: "Meteor Shower",
		emoji: "<:meteorshower:1265631578130743408>",
		desc: `**33%** chance to deal **${elementEmoji['explode']}Explode** based damage to a fighter on their turn.\nAffinity based.`
	},
	junkstorm: {
		name: "Junk Storm",
		emoji: "<:junkstorm:1265648947406442538>",
		desc: `**33%** chance to deal **${elementEmoji['metal']}Metal** based damage to a fighter on their turn.\nAffinity based.\n10% chance to afflict ${statusEmojis.dizzy}**Dizziness** on hit.`
	},

	darkmoon: {
		name: "Dark Moon",
		emoji: "<:darkmoon:1219385827730133022>",
		desc: `Gives **10%** more skill power to ${elementEmoji['psychic']}**psychic** skills but reduces skill power of other skills by **10%**.\nHas a **1/3** chance to ${statusEmojis['confusion']}**confuse non-${elementEmoji['psychic']}psychic/${elementEmoji['spirit']}spirit** mains.`
	},
	eclipse: {
		name: "Eclipse",
		emoji: "<:eclipse:1219385829093539921>",
		desc: `Gives **10%** more skill power to **non-${elementEmoji['strike']}strike, non-${elementEmoji['slash']}slash and non-${elementEmoji['pierce']}pierce** skills.`
	},
	bloodmoon: {
		name: "Blood Moon",
		emoji: "<:bloodmoon:1219385825641365647>",
		desc: `Gives **40%** more skill power to ${elementEmoji['curse']}**curse** skills and **20%** more skill power to **${elementEmoji['strike']}strike, ${elementEmoji['slash']}slash and ${elementEmoji['pierce']}pierce** skills, but **cuts the raw ${statusEmojis['magdown']}MAG stat of ${elementEmoji['bless']}bless mains by 25%**.`
	},
	supermoon: {
		name: "Super Moon",
		emoji: "<:supermoon:1219385822521065502>",
		desc: `Gives **20%** more skill power to **${elementEmoji['psychic']}psychic, ${elementEmoji['bless']}bless, ${elementEmoji['curse']}curse and ${elementEmoji['spirit']}spirit** skills.\n**Increases the raw ${statusEmojis['critup']}LUK stat by 15%**, but also cuts skill accuracy by **15%**.`
	},
	bluemoon: {
		name: "Blue Moon",
		emoji: "<:bluemoon:1225862772676628561>",
		desc: `Increases **${elementEmoji['spirit']}spirit** damage by **20%** and increases the raw ${statusEmojis['magup']}**MAG** stat for ${elementEmoji['spirit']}**spirit** mains by **10%**.`
	},
}

terrains = [
	'none',
	"flaming", //
	"grassy", //
	"light", //
	"dark", //
	"psychic", //
	"misty", //
	"sky", //
	"underground", //
	"muddy", //
	"spiritual", //
	"damned", //
	"purged", //
	"forest", //
	"desert", //
	"mountainside", //
	"acidpools", //

	// boss specific
	"flooded", //
	"swamp", // 
	"glacial", //
	"fairydomain", //
	"graveyard", //
	"factory", //
	"blindingradiance", //
	"eternaldarkness" //
]

terrainDescs = {
	none: {
		name: "Normal",
		emoji: "",
		desc: "Just the usual terrain, nothing interesting."
	},
	flaming: {
		name: "Flaming",
		emoji: "<:flaming:1225089585197879397>",
		desc: `Attacks **non-${elementEmoji['fire']}fire** main fighters with **10 ${elementEmoji['fire']}fire** damage.\nWill thaw out the ${statusEmojis['freeze']}**freezing** fighters, but every turn there's a **10%** chance they start ${statusEmojis['burn']}**burning**.`
	},
	grassy: {
		name: "Grassy",
		emoji: "<:grassy:1225523399699464345>",
		desc: `Heals **10%** of **non-${elementEmoji['grass']}grass** main's max HP every turn, **17%** otherwise.`
	},
	light: {
		name: "Light",
		emoji: "<:light:1225520969628520448>",
		desc: `Gives **30%** more skill power to ${elementEmoji['bless']}**bless** skills but reduces skill power of ${elementEmoji['curse']}**curse** skills by **50%**.`
	},
	dark: {
		name: "Dark",
		emoji: "<:dark:1225887008568905769>",
		desc: `Gives **30%** more skill power to ${elementEmoji['curse']}**curse** skills but reduces skill power of ${elementEmoji['bless']}**bless** skills by **50%**.`
	},
	psychic: {
		name: "Psychic",
		emoji: "<:psychic:1225515672646324366>",
		desc: `Reverses the turn order while active.`
	},
	misty: {
		name: "Misty",
		emoji: "<:misty:1225508753827168466>",
		desc: `Removes any possibility of having status effects.`
	},
	sky: {
		name: "Sky",
		emoji: "<:sky:1219423963361443871>",
		desc: `Gives **20%** more skill power to ${elementEmoji['wind']}**wind** skills but reduces skill power of ${elementEmoji['earth']}**earth** skills by **10%**.\n**Increases the raw ${statusEmojis['aglup']}AGL stat by 25% for non-${elementEmoji['wind']}wind mains, 40% otherwise**.`
	},
	underground: {
		name: "Underground",
		emoji: "<:underground:1225896677525684245>",
		desc: `Gives **50%** more skill power to ${elementEmoji['earth']}**earth** skills but reduces skill power of ${elementEmoji['wind']}**wind and ${elementEmoji['grass']}grass** skills by **30%**.`
	},
	muddy: {
		name: "Muddy",
		emoji: "<:muddy:1219423961830523081>",
		desc: `Gives **35%** more skill power to ${elementEmoji['earth']}**earth** skills, but cuts accuracy of <:physical:973077052129423411>**physical** skills by **20%**.\n**Reduces ${statusEmojis['agldown']}AGL stat by 33% for non-${elementEmoji['earth']}earth mains**.`
	},
	spiritual: {
		name: "Spiritual",
		emoji: "<:spiritual:1225518817728266370>",
		desc: `Gives **25%** more skill power to ${elementEmoji['spirit']}**spirit** skills and **increases raw ${itemTypeEmoji['pacify']}CHR stat by 25%**.\n${elementEmoji['spirit']}**Spirit** affinities are amplified.`
	},
	damned: {
		name: "Damned",
		emoji: "<:damned:1219685300700184747>",
		desc: `Gives **25%** more skill power to <:physical:973077052129423411>**physical** skills, but **cuts the raw ${statusEmojis['magdown']}MAG stat by 75%**.`
	},
	purged: {
		name: "Purged",
		emoji: "<:purged:1219685299156684900>",
		desc: `Gives **25%** more skill power to <:ranged:1008794366648791161>**ranged** and <:magic:1008794362307674204>**magic** skills, but **cuts the raw ${statusEmojis['atkdown']}ATK stat by 75%**.`
	},
	forest: {
		name: "Forest",
		emoji: "<:forest:1225905414558847017>",
		desc: `Gives **50%** more skill power to ${elementEmoji['grass']}**grass** skills and **30%** more skill power to ${elementEmoji['fire']}**fire** skills, but reduces skill power of ${elementEmoji['water']}**water** skills by **30%**.`
	},
	desert: {
		name: "Desert",
		emoji: "<:desert:1225905412877062185>",
		desc: `Increases skill power of ${elementEmoji['fire']}**fire and ${elementEmoji['earth']}earth** skills, but reduces skill power of ${elementEmoji['ice']}**ice and ${elementEmoji['water']}water** skills by **30%**.`
	},
	mountainside: {
		name: "Mountainside",
		emoji: "<:mountainside:1225896675898429460>",
		desc: `Gives **30%** more skill power to ${elementEmoji['earth']}**earth, ${elementEmoji['wind']}wind and ${elementEmoji['ice']}ice** skills.`
	},
	acidpools: {
		name: "Acid Pools",
		emoji: "<:acidpools:1225882996796821574>",
		desc: `Attacks **non-${elementEmoji['acid']}acid** main fighters with **10 ${elementEmoji['acid']}acid** damage.\nEvery turn there's a **10%** chance they start ${statusEmojis['dissolved']}**dissolving**.`
	},
	flooded: {
		name: "Flooded",
		emoji: "<:flooded:1219426902888939600>",
		boss: true,
		desc: `Gives **30%** more skill power to ${elementEmoji['water']}**water** skills.\n<:physical:973077052129423411>**Physical** skills will also get the ${elementEmoji['water']}**water dual typing**.`
	},
	swamp: {
		name: "Swamp",
		emoji: "<:swamp:1219423964397310095>",
		boss: true,
		desc: `Gives **30%** more skill power to ${elementEmoji['earth']}**earth** and ${elementEmoji['grass']}**grass** skills.\n${elementEmoji['earth']}**Earth** and ${elementEmoji['grass']}**grass skills** will become **dual typed with each other**.`
	},
	glacial: {
		name: "Glacial",
		emoji: "<:glacial:1219423956826853466>",
		boss: true,
		desc: `Gives **30%** more skill power and **20%** more ${statusEmojis['freeze']}**freezing** chance to ${elementEmoji['ice']}**ice**.\n${elementEmoji['water']}**Water** skills will become ${elementEmoji['ice']}**ice** skills and ${statusEmojis['wet']}**wet** affliction becomes ${statusEmojis['freeze']}**frozen** instead while active.`
	},
	fairydomain: {
		name: "Fairy Domain",
		emoji: "<:fairydomain:1219423955128156291>",
		boss: true,
		desc: `Gives **30%** more skill power to ${elementEmoji['psychic']}**psychic** and ${elementEmoji['bless']}**bless** skills.\n${elementEmoji['psychic']}**Psychic** and ${elementEmoji['spirit']}**spirit** skills will also get the ${elementEmoji['bless']}**bless dual typing**.`
	},
	graveyard: {
		name: "Graveyard",
		emoji: "<:graveyard:1225511222728855662>",
		boss: true,
		desc: `Gives **30%** more skill power to ${elementEmoji['spirit']}**spirit** skills.\n${elementEmoji['curse']}**Curse** skills will also get the ${elementEmoji['spirit']}**spirit dual typing**.`
	},
	factory: {
		name: "Factory",
		emoji: "<:factory:1219676417005191309>",
		boss: true,
		desc: `Gives **50%** more skill power to ${elementEmoji['metal']}**metal** skills.`
	},
	blindingradiance: {
		name: "Blinding Radiance",
		emoji: "<:blindingradiance:1225524909464096870>",
		boss: true,
		desc: `Gives **50%** more skill power to ${elementEmoji['bless']}**bless** skills and removes any possibility of having status effects.\n${elementEmoji['curse']}**Curse skills become unusable**.`
	},
	eternaldarkness: {
		name: "Eternal Darkness",
		emoji: "<:eternaldarkness:1225513844823035994>",
		boss: true,
		desc: `Gives **50%** more skill power and the **Feint** extra to ${elementEmoji['curse']}**curse** skills.\n${elementEmoji['bless']}**Bless skills become unusable**.`
	}
}

//tiers of AOE: one -> spreadopposing -> widespreadopposing -> allopposing
Targets = [
	//SINGLE TARGETS
	'one', // target one foe
	'ally', // target one ally
	'caster', // target the caster

	//RANDOM SINGLE TARGETS
	'randomopposing', // target random foes
	'randomallies', // target random allies
	'random', // target random fighters

	//ENTIRE SIDES
	'allopposing', // target all foes
	'allallies', // target all allies
	'allalliesnocaster', // target all allies except the caster

	//EVERYONE
	'everyone', // target all fighters

	//SINGLE SPREADS
	'spreadopposing', // target one foe, damage spreads to 2 surrounding.
	'spreadallies', // target one ally, effects spread to 2 surrounding.

	//RANDOM SPREADS
	'randomspreadopposing', // target random foe, damage spreads to 2 surrounding.
	'randomspreadallies', // target random ally, effects spread to 2 surrounding.
	'randomspread', // target random target, effects spread to 2 surrounding.

	//ENTIRE SIDE SPREADS
	'widespreadopposing', //target one foe, damage spread to all foes based on distance
	'widespreadallies', //target one ally, effects spread to all allies based on distance

	//RANDOM ENTIRE SIDE SPREADS
	'randomwidespreadopposing', //target random foe, damage spread to all foes based on distance
	'randomwidespreadallies', //target random ally, effects spread to all allies based on distance
	'randomwidespread', //target random target, effects spread to all targets on the same side based on distance

	//CASTER + TARGET
	'casterandfoe', //target caster and foe.
	'casterandally', //target caster and ally.
	'casterandrandom', //target caster and a random fighter.
	'casterandrandomfoe', //target caster and a random enemy.
	'casterandrandomally' //target caster and a random ally.
]

TargetDesc = {
	one: 'Targets one enemy.',
	ally: 'Targets one ally.',
	caster: 'Targets the user of the skill.',

	randomopposing: 'Targets a random foe. Multi-hit skills will target a new enemy every hit rather than just attacking a single foe multiple times.',
	randomallies: 'Targets a random ally. Multi-hit skills will target a new ally every hit rather than just being used on a single ally multiple times.',
	random: 'Targets a random person on the battlefield exclusing the user. Multi-hit skills will target a new member on the battlefield every hit rather than just attacking a single fighter multiple times.',

	allopposing: 'Targets all enemies.',
	allallies: 'Targets all allies.',
	allalliesnocaster: 'Targets all allies excluding the user.',

	everyone: 'Targets every person on the battlefield excluding the user without fail.',

	spreadopposing: 'Targets one enemy, but the damage spreads to the 2 surrounding.',
	spreadallies: 'Targets one ally, but the effects (or damage) spreads to the 2 surrounding, possibly including the user.',

	randomspreadopposing: 'Targets a random enemy, but the damage spreads to the 2 surrounding. Multi-hit skills will target a new enemy every hit rather than just attacking a single foe multiple times.',
	randomspreadallies: 'Targets a random ally, but the effects (or damage) spreads to the 2 surrounding, possibly including the user. Multi-hit skills will target a new ally every hit rather than just being used on a single ally multiple times.',
	randomspread: 'Targets a random person on the battlefield exclusing the user, but the effects (or damage) spreads to the 2 surrounding, possibly including the user. Multi-hit skills will target a new member on the battlefield every hit rather than just attacking a single fighter multiple times.',

	widespreadopposing: 'Targets one enemy, but the damage spreads to all enemies based on distance, i.e., the skill will affect a foe less the farther they are away from the target.',
	widespreadallies: 'Targets one ally, but the effects spread to all allies based on distance, i.e., the skill will affect an ally less the farther they are away from the target.',

	randomwidespreadopposing: 'Targets a random enemy, but the damage spreads to all enemies based on distance, i.e., the skill will affect a foe less the farther they are away from the target. Multi-hit skills will target a new enemy every hit rather than just attacking a single foe multiple times.',
	randomwidespreadallies: 'Targets a random ally, but the effects spread to all allies based on distance, i.e., the skill will affect an ally less the farther they are away from the target. Multi-hit skills will target a new ally every hit rather than just being used on a single ally multiple times.',
	randomwidespreadallies: 'Targets a random person on the battlefield exclusing the user, but the effects spread to all fighters on the side that was targetted based on distance, i.e., the skill will affect a fighter less the farther they are away from the target. Multi-hit skills will target a new member on the battlefield every hit rather than just being used on a single fighter multiple times.',

	casterandfoe: 'Targets the user of the skill, and a chosen enemy.',
	casterandally: 'Targets the user of the skill, and a chosen ally.',
	casterandrandom: 'Targets the user of the skill, and a random fighter. Multi-hit skills will target a new member on the battlefield every hit rather than just attacking a single fighter multiple times.',
	casterandrandomfoe: 'Targets the user of the skill, and a random foe. Multi-hit skills will target a new enemy on the battlefield every hit rather than just attacking a single enemy multiple times.',
	casterandrandomally: 'Targets the user of the skill, and a random foe. Multi-hit skills will target a new ally on the battlefield every hit rather than just being used on a single ally multiple times.'
}

costTypes = [
	'mp',
	'mppercent',
	'hp',
	'hppercent',
	'hpandmp',
	'hpandmppercent',
	'lb',
	'lbpercent',
	'money',
	'moneypercent',
]

trustLvl = {
	meleeatk: 3,
	showoff: 6,
	healbuff: 10,
	morehealbuff: 20
}

quoteTypes = {
	//Melee skill
	melee: 'Used upon using a melee attack.',

	//Quotes based on skill name are separate from this list...
	
	//Target Types
	phys: 'Used upon using a <:physical:973077052129423411>**Physical Attack**.',
	mag: 'Used upon using a **Magical Attack**.',
	ranged: 'Used upon using a **Ranged Attack**.',
	sorcery: 'Used upon using a **Sorcery Attack**.',

	//Trust: Ally Attack
	allyatk: 'Used when assisting a trusted ally with a powered up melee attack in battle.',

	//Limit Breaks
	lb1: 'Used when using a Level 1 Limit Break.',
	lb2: 'Used when using a Level 2 Limit Break.',
	lb3: 'Used when using a Level 3 Limit Break.',
	lb4: 'Used when using a Level 4 Limit Break.',

	//Team Combo
	tc: 'Used when using a Team Combo.',

	//Affinities - Striking
	strong: `Used when landing a ${affinityEmoji.weak}**Weakness**, ${affinityEmoji.superweak}**Super Weakness**, or ${affinityEmoji.deadly}**Deadly** attack.`,
	badatk: `Used when landing a ${affinityEmoji.resist}**Resist**, or worse attack.`,

	//Accuracy-based
	landed: '_Might_ be used when landing a normal attack.',
	miss: 'Used when missing an attack.',

	//Affinity-based - Hit
	deadly: `Used when being hit by a move with ${affinityEmoji.deadly}**Deadly** effectiveness.`,
	superweak: `Used when being hit by a move with ${affinityEmoji.superweak}**Super Weak** effectiveness.`,
	weak: `Used when being hit by a move with ${affinityEmoji.weak}**Weak** effectiveness.`,
	hurt: '_Might_ be used when hit by an attack.',
	resist: `Used when being hit by a move with ${affinityEmoji.resist}**Resist** effectiveness.`,
	block: `Used when being hit by a move with ${affinityEmoji.block}**Block** effectiveness.`,
	repel: `Used when being hit by a move with ${affinityEmoji.repel}**Repel** effectiveness.`,
	drain: `Used when being hit by a move with ${affinityEmoji.drain}**Drain** effectiveness.`,

	//Status
	status: 'Used upon landing a negative status ailment.',
	neutralstatus: 'Used upon landing a neutral status ailment.',
	positivestatus: 'Used upon landing a positive status ailment.',

	//Quotes based on status name are separate from this list...

	//Misc
	dodge: 'Used when dodging a move.',
	death: 'Used upon death.',
	kill: 'Used upon killing a foe.',
	pacify: 'Used upon pacifying an enemy.',
	support: `Used upon using a ${elementEmoji.support}**Support** skill.`,
	heal: 'Used when healing allies.',
	helped: 'Used when being helped by an ally (heal or buff)',
	lvl: 'Used on level up.',

	//Trust Quotes
	allydeath: 'Used when a trusted ally dies. Banter text.',
	console: `Used when a trusted ally takes ${affinityEmoji.weak}**Weak**, ${affinityEmoji.superweak}**Super Weak**, or ${affinityEmoji.deadly}**Deadly** damage. Banter text.`,
	imfine: 'Used in response to "console" quotes. Banter text.',
	cheer: `Used when a trusted ally deals ${affinityEmoji.weak}**Weakness**, ${affinityEmoji.superweak}**Super Weakness**, or ${affinityEmoji.deadly}**Deadly** damage, or lands a critical hit. Banter text.`,
	response: 'Used in response to "cheer" quotes. Banter text.',
	killpraise: 'Used when a trusted ally kills a foe. Banter text.',
	killresponse: 'Used in response to "killpraise" quotes. Banter text.',

	//Trust XP Quotes
	trustlovemax: 'Used on trust level up if the **love** trust reaches level _20_, the max level.',
	trustloveup: 'Used for **love** trust of level _15 to 19_, on level up.',
	trustlovedown: 'Used for **love** trust of level _15 to 19_, on level down.',
	trustlikeup: 'Used for **like** trust of level _5 to 14_, on level up.',
	trustlikedown: 'Used for **like** trust of level _5 to 14_, on level down.',
	trustneutralposup: 'Used for **neutral** trust of level _1 to 4_, on level up.',
	trustneutralposdown: 'Used for **neutral** trust of level _1 to 4_, on level down.',
	trustneutralnegup: 'Used for **neutral** trust of level _-1 to -4_, on level up.',
	trustneutralnegdown: 'Used for **neutral** trust of level _-1 to -4_, on level down.',
	trustdislikeup: 'Used for **dislike** trust of level _-5 to -14_, on level up.',
	trustdislikedown: 'Used for **dislike** trust of level _-5 to -14_, on level down.',
	trusthateup: 'Used for **hate** trust of level _-15 to -19_, on level up.',
	trusthatedown: 'Used for **hate** trust of level _-15 to -19_, on level down.',
	trusthatemax: 'Used on trust level down if the **hate** trust reaches level _-20_, the max level.'
}

enemyTypes = [
	'miniboss',
	'boss',
	'bigboss',
	'deity'
]

weaponClasses = {
	none: "Every weapon can be used, albeit... inefficiently. Each weapon will lose 40% of it's original benefit.",
	bludgeon: "Hammers, Maces, Clubs.",
	bladed: "Swords, Daggers, Katanas.",
	longbladed: "Longswords, Greatswords.",
	pierce: "Rapiers, Knives.",
	ranged: "Bow & Arrow, Ninja Stars.",
	books: "Magical Books that allow one to cast spells.",
	staff: "Staffs or Wands that cast magic.",
	incorporeal: "Weapons formed by magic.",
	polearms: "Spears, Halberds, Scythes, Naginatas.",
	small: "Tasers, Stun Guns, Brass Knuckles.",
	improvised: "Chains, Glass Bottles, Wood Boards.",
	flail: "Flails, Chained Maces, Nunchucks, Whips.",
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
		none: "<:golden:973077051751940138>",
		bludgeon: "<:bludgeon:1008794352706932817>",
		bladed: "<:bladed:1008794351591239842>",
		longbladed: "<:longbladed:1008794360676110457>",
		pierce: "<:pierce:1008794365231104052>",
		ranged: "<:ranged:1008794366648791161>",
		books: "<:books:1008794354959269938>",
		staff: "<:staff:1008794368750141540>",
		incorporeal: "<:incorporeal:1085978225911533668>",
		polearms: '<:polearms:1228809460248608833>',
		small: '<:small:1228809453902495856>',
		flail: '<:flail:1228809456100315188>',
		improvised: '<:improvised:1228809458617024593>',
	},
	armor: {
		none: "<:golden:973077051751940138>",
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
	heal: 'Heal the character with the lowest health on the start of your turn.',
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

// Tier Emojis
tierEmojis = [
	'<:tier1:1233826057027715244>',
	'<:tier2:1233825926664425553>',
	'<:tier3:1233826055777947788>',
	'<:tier4:1233825924928114782>',
	'<:tier5:1233828584465109012>',
	'<:warning:1007649173413298227>'
]

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
//     Requires     //
//////////////////////
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
let fusionpath = `${dataPath}/json/fusionskills.json`;

setUpFile = (file, force) => {
	if (fileStore[file] && !force) return fileStore[file];

	// we love hacking
	if (file === fusionpath) {
		let filedata = setUpFile(`${dataPath}/json/skills.json`, true);

		let obj = Object.keys(filedata)
			.filter(key => filedata[key].fusionskill)
			.reduce((obj, key) => {
				obj[key] = filedata[key];
				return obj;
			}, {});

		fileStore[file] = obj;
		return obj;
	}

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
				fusionskills: false,
				powerlevels: false,
				trust: false,
				pets: false
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
				dualmainelement: 1.1,
				crit: 1.5,
				tech: 1.2,
				affinities: {
					deadly: 4.2,
					superweak: 2.1,
					weak: 1.5,
					resist: 0.5,
					repel: 1,
					drain: 1,
				},
				limitbreak: 1
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

badVal = (val) => {
	return (isNaN(val) || val == null || val == undefined);
}

// Damest Thou FOobd
validExtensions = ['png', 'bmp', 'tiff', 'tif', 'gif', 'jpg', 'jpeg', 'apng', 'webp']
checkImage = (message, arg, image) => {
	if (!image && !arg) return false;
	
	if (image != undefined) arg = image.url;
	
	if (arg.startsWith('||') && arg.endsWith('||')) {
		arg = arg.slice(2, -2)
	}
	if (arg.startsWith('<') && arg.endsWith('>')) {
		arg = arg.slice(1, -1)
	}

	let tempArg = arg.split('.');
	let tempExtension = tempArg[tempArg.length - 1].split('?')[0];

	console.log(arg, tempArg, tempExtension);

	if (!validExtensions.includes(tempExtension)) {
		message.channel.send(`The image you uploaded is not a valid image.`)
		return false
	}
	return arg
}

//////////////
// COMMANDS //
//////////////
Command = class extends ArgList {
	constructor(object) {
		super(object.args, object.desc, object.doc)
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

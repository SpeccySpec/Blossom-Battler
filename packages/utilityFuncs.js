// Require
const fs = require('fs');

// Path to 'data' folder
const dataPath = './data'

// Elements
const Elements = [
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

const elementEmoji = {
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

// Item
const itemTypes = [
	"weapon",
	"heal",
	"healmp",
	"healhpmp"
]

const itemTypeEmoji = {
	weapon: "🔪",

	heal: "🌀",
	healmp: "⭐",
	healhpmp: "🔰"
}

// Status Effects
const statusEffects = [
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

const statusEmojis = {
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
const enmHabitats = [
	"grasslands",
	"forests",
	"swamps",
	"mountains",
	"caverns",
	"volcanic",
	"icy",
	"unknown"
]

const Targets = [
	'one',
	'ally',
	'allopposing',
	'allallies',
	'caster',
	'everyone',
	'random',
	'randomopposing'
]

const adminList = [
	'516359709779820544',
	'532291526634635285',
	'441198920668938260'
]

function objClone(source) {
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

/*
function random(max) {
    var milliseconds = new Date().getMilliseconds();
    return Math.floor(milliseconds * max / 1000);
}
*/

// Export Functions
module.exports = {
	validType: function(type) {
		if (!type) return false;

		for (const i in Elements) {
			if (type.toLowerCase() === Elements[i])
				return true;
		}

		return false;
	},
	
	validStatus: function(eff) {
		if (!eff) return false;

		for (const i in statusEffects) {
			if (eff.toLowerCase() === statusEffects[i])
				return true;
		}

		return false;
	},

	validTarg: function(type) {
		if (!type) return false;
		for (const i in Targets) {
			if (type.toLowerCase() === Targets[i])
				return true;
		}

		return false
	},

	validStat: function(stat) {
		var stats = ['atk', 'mag', 'agl', 'end', 'prc', 'luk', 'chr', 'int']
		for (const i in stats) {
			if (stat === stats[i]) {
				return true
			}
		}

		return false
	},
	
	cloneObj: function(source) {
		return objClone(source)
	},
	
	orderSkills: function() {
		let skillPath = dataPath+'/skills.json'
		
		try {
			var skillRead = fs.readFileSync(skillPath);
		} catch(err) {
			console.error(err);
		}

		let skillFile = JSON.parse(skillRead);
		
		let skillArray = []
		for (const i in skillFile) {
			if (!skillFile[i].name) skillFile[i].name = `${i}`;
			
			if (skillFile[i].type != "status" && skillFile[i].type != "heal" && skillFile[i].type != "passive") {
				if (!skillFile[i].target) skillFile[i].target = "one";
				if (!skillFile[i].atktype) skillFile[i].atktype = "physical";
				if (skillFile[i].status && typeof skillFile[i].status == 'string') skillFile[i].status = skillFile[i].status.toLowerCase();

				skillFile[i].target = skillFile[i].target.toLowerCase()
				skillFile[i].atktype = skillFile[i].atktype.toLowerCase()
			}

			skillArray.push([i, skillFile[i]])
		}
		
		const elementOrder = {
			strike: 1,
			slash: 2,
			pierce: 3,
			
			fire: 4,
			water: 5,
			ice: 6,
			electric: 7,
			wind: 8,
			earth: 9,
			grass: 10,
			psychic: 11,
			poison: 12,
			metal: 13,
			nuclear: 14,
			curse: 15,
			bless: 16,
			sound: 17,
			gravity: 18,
			
			almighty: 19,
			
			heal: 20,
			status: 21,
			passive: 22,
			
			invalid: 23
		}
		
		/*
		const targetTypeOrder = {
			one: 1,
			allopposing: 2,
			oneally: 3,
			allallies: 4,
			everyone: 5,
			caster: 6
		}
		*/
		
		skillArray.sort(function(a, b) {return a[1].pow - b[1].pow});
		skillArray.sort(function(a, b) {return elementOrder[a[1].type] - elementOrder[b[1].type]});
		
		skillFile = {}
		for (const i in skillArray)
			skillFile[skillArray[i][0]] = objClone(skillArray[i][1]);

		console.log("Ordered skills.json.")
		fs.writeFileSync(skillPath, JSON.stringify(skillFile, null, '    '));
	},
	
	isBanned: function(id, server) {
		let servPath = dataPath+'/Server Settings/server.json'
		let servRead = fs.readFileSync(servPath);
		let servFile = JSON.parse(servRead);
		
		if (!servFile[server] || !servFile[server].banned) return false;

		var servDefs = servFile[server]
		for (const i in servFile[server].banned) {
			if (id === servFile[server].banned) {
				return true
			}
		}
		
		return false
	},
	
	AdminList: adminList,
	
	RPGBotAdmin: function(id) {
		for (const i in adminList) {
			if (id === adminList[i]) {
				return true
			}
		}
		
		return false	
	},
	
	roundToDecimals: function(num, places) {
		return +(Math.round(num + "e+" + places)  + "e-" + places);
	},

	randNum: function(max) {
		return Math.round(Math.random() * max)
	},

	randBetweenNums: function(min, max) {
		return min + Math.round(Math.random() * (max-min))
	},
	
	randPercent: function() {
		return Math.round(Math.random()*100);
	},
	
	getChannel: function(channel) {
		if (typeof(channel) == "string") {
			if (client.channels.cache.get(arg[2]))
				return client.channels.cache.get(arg[2]);
			else
				return null
		} else {
		}
	},

	getChest: function(name, message) {
		var chestPath = dataPath+'/chests.json'
		var chestRead = fs.readFileSync(chestPath);
		var chestFile = JSON.parse(chestRead);

		for (const channelID in chestFile[message.guild.id]) {
			for (const chest in chestFile[message.guild.id][channelID]) {
				if (chestFile[message.guild.id][channelID][name]) {
					return true;
				}
			}
		}

		return false;
	},
	
	setDamageFormula: function(server, type) {
		var servPath = dataPath+'/Server Settings/server.json'
		var servRead = fs.readFileSync(servPath);
		var servFile = JSON.parse(servRead);

		switch(type.toLowerCase()) {
			case 'persona':
				servFile[server].damageFormula = 'persona'
			
			case 'pokemon':
			case 'pkmn':
				servFile[server].damageFormula = 'pkmn'
		}
	}

	/*
	random: function(max) {
		return random(max)
	}
	*/
}
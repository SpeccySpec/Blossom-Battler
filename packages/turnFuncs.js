// Require
const fs = require('fs');

// Path to 'data' folder
const dataPath = './data'

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
	support: "<:status:906877331711344721>",
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

///////////////
// Functions //
///////////////
function setUpBattleVars(btl, server) {
	if (!btl.allies.backup)
		btl.allies.backup = [];
	if (!btl.enemies.backup)
		btl.enemies.backup = [];

	btl.battling = true;
	btl.battleteam = "none";
	btl.battleteam2 = "none";
	btl.battlechannel = "none";
	btl.doturn = -1;
	btl.turn = 1;
	
	btl.turnorder = [];
	
	btl.pvp = false;
	btl.pvpmode = "none";

	btl.colosseum[0] = false;
	btl.colosseum[1] = 0;
	btl.colosseum[2] = "none";
	
	// Reset Endless Mode
	btl.colosseum[3] = {
		curLvl: 1,
		lvlLeft: 2,
		upperBound: 0,
		lowerBound: 0
	}
	
	btl.weather = "clear";
	btl.terrain = "normal"
	
	var servPath = `${dataPath}/Server Settings/server.json`
	var servRead = fs.readFileSync(servPath);
	var servFile = JSON.parse(servRead);
	
	btl.damageFormula = (servFile[server] && servFile[server].damageFormula) ? servFile[server].damageFormula : 'persona'
	btl.customDamageFormula = (servFile[server] && servFile[server].customDamageFormula) ? servFile[server].customDamageFormula : '0'
}

function clearBTL(btl) {
	btl.enemies.members = [];
	btl.enemies.backup = [];
    btl.allies.members = [];
    btl.allies.backup = [];
    btl.battlechannel = "none";
	btl.battleteam = "none";
	btl.battleteam2 = "none";
	btl.battling = false;
	btl.doturn = 0;
	btl.turn = 0;

	btl.pvp = false;
	btl.pvpmode = "none";

	btl.colosseum[0] = false;
	btl.colosseum[1] = 0;
	btl.colosseum[2] = "none";
	
	// Reset Endless Mode
	btl.colosseum[3] = {
		curLvl: 1,
		lvlLeft: 2,
		upperBound: 0,
		lowerBound: 0
	}

	// Reset Weather & Terrain
	btl.weather = "clear";
	btl.terrain = "normal"

	delete btl.onemore	
	delete btl.testing
	delete btl.petattack
	delete btl.turnorder
	delete btl.damageFormula
}

function hasPassiveCopyLOL(userDefs, passivetype) {					
	for (const skillNum in userDefs.skills) {
		const skillPath = dataPath+'/skills.json'
		const skillRead = fs.readFileSync(skillPath);
		const skillFile = JSON.parse(skillRead);

		var skillDefs2 = skillFile[userDefs.skills[skillNum]];
		if (skillDefs2 && skillDefs2.type && skillDefs2.type === "passive") {
			if (skillDefs2.passive.toLowerCase() === passivetype.toLowerCase()) {
				console.log(`${userDefs.name} has the ${passivetype} passive.`)
				return true
			}
		}
	}
	
	return false
}

function healPassives(charDefs) {
	var passiveMsg = ''
	if (hasPassiveCopyLOL(charDefs, 'affinitypoint')) {
		if (!charDefs.affinitypoint) {
			charDefs.affinitypoint = 0
		}

		if (charDefs.affinitypoint < 10) {
			passiveMsg += `\n${charDefs.name} got a spirit point!`
			charDefs.affinitypoint = Math.min(10, charDefs.affinitypoint+1);
			if (charDefs.affinitypoint >= 10) {
				passiveMsg += ' (MAX)'
			}
		}
	}
	
	return passiveMsg
}

function buffPassives(charDefs) {
	var passiveMsg = ''
	if (hasPassiveCopyLOL(charDefs, 'teamworkpoint')) {
		if (!charDefs.affinitypoint)
			charDefs.affinitypoint = 0;

		if (charDefs.affinitypoint < 8) {
			passiveMsg += `\n${charDefs.name} got a teamwork point!`
			charDefs.affinitypoint = Math.min(8, charDefs.affinitypoint+1);
			if (charDefs.affinitypoint >= 8) {
				passiveMsg += ' (MAX)'
			}
		}
	}
	
	return passiveMsg
}

// Export Functions
module.exports = {
	setUpBattleVars: function(servBtl, server) {
		setUpBattleVars(servBtl, server)
	},

	clearBTL: function(serverBtl) {
		clearBTL(serverBtl);
	},
	
	limitBreaks: function(server) {
		var servPath = dataPath+'/Server Settings/server.json'
		var servRead = fs.readFileSync(servPath);
		var servFile = JSON.parse(servRead);
		var servDefs = servFile[server]

		return servDefs.limitbreaks ? true : false
	},

	oneMores: function(server) {
		var servPath = dataPath+'/Server Settings/server.json'
		var servRead = fs.readFileSync(servPath);
		var servFile = JSON.parse(servRead);
		var servDefs = servFile[server]

		return servDefs.onemores ? true : false
	},

	teamCombos: function(server) {
		var servPath = dataPath+'/Server Settings/server.json'
		var servRead = fs.readFileSync(servPath);
		var servFile = JSON.parse(servRead);
		var servDefs = servFile[server]

		return servDefs.teamCombos ? true : false
	},

	healPassives: function(charDefs) {
		return healPassives(charDefs)
	},

	buffPassives: function(charDefs) {
		return buffPassives(charDefs)
	}
}
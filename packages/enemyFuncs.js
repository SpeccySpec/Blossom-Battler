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
	"confusion",
	"insanity"
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
	confusion: '☄️',
	insanity: '<:insanity:1217924742237913218>',
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

// Write enemy
function writeEnemy(author, server, name, lvl, hp, mp, xp, str, mag, prc, end, chr, int, agl, luk, boss, j) {
	let enmPath = `${dataPath}/Enemies/enemies-${server}.json`
	let enmRead = fs.readFileSync(enmPath, {flag: 'as+'});

	if (!enmRead || enmRead == '') {
		enmRead = '{}'
		fs.writeFileSync(enmPath, enmRead);
	}

    let enmFile = JSON.parse(enmRead);

	var enemyDefs = {
		name: name ? name : "???",
		creator: author.id,
		level: lvl ? lvl : 1,
		hp: hp ? hp : 60,
		mp: mp ? mp : 50,
		atk: str ? str : 6,
		mag: mag ? mag : 6,
		prc: prc ? prc : 6,
		end: end ? end : 6,
		chr: chr ? chr : 6,
		int: int ? int : 6,
		agl: agl ? agl : 6,
		luk: luk ? luk : 6,
		melee: ["Strike Attack", "strike"],
		skills: [],
		weak: [],
		resist: [],
		block: [],
		repel: [],
		drain: [],
		journal: j ? j : "???",
		awardxp: xp ? xp : 100
	}

	if (boss === 'miniboss')
		enemyDefs.miniboss = true
	else if (boss === 'boss' || boss === 'true' || boss === 'yes')
		enemyDefs.boss = true
	else if (boss === 'finalboss' || boss === 'bigboss')
		enemyDefs.bigboss = true
	else if (boss === 'diety' || boss === 'god')
		enemyDefs.diety = true

	if (!enmFile[server])
		enmFile[server] = {}

	enmFile[server][name] = enemyDefs
    fs.writeFileSync(enmPath, JSON.stringify(enmFile, null, '    '));

	return enemyDefs
}

// Raid Enemies
function writeRaidEnemy(author, server, name, lvl, hp, mp, str, mag, prc, end, chr, int, agl, luk, boss, j) {
    var raidPath = dataPath+'/raidenemy.json'
    var raidRead = fs.readFileSync(raidPath, {flag: 'as+'});
    var raidFile = JSON.parse(raidRead);

	var enemyDefs = {
		name: name ? name : "???",
		boss: true,
		bigboss: true,
		raidboss: true,
		creator: author.id,
		level: lvl ? lvl : 1,
		hp: hp ? hp : 60,
		mp: mp ? mp : 50,
		atk: str ? str : 6,
		mag: mag ? mag : 6,
		prc: prc ? prc : 6,
		end: end ? end : 6,
		chr: chr ? chr : 6,
		int: int ? int : 6,
		agl: agl ? agl : 6,
		luk: luk ? luk : 6,
		melee: ["Strike Attack", "strike"],
		skills: [],
		weak: [],
		resist: [],
		block: [],
		repel: [],
		drain: [],
		journal: j ? j : "???",
	}

	if (!raidFile[name])
		raidFile[name] = {}

	raidFile[name] = enemyDefs
    fs.writeFileSync(raidPath, JSON.stringify(raidFile, null, '    '));

	return enemyDefs
}

/*
	CAN I EVEN USE THIS SKILL?
	- No passives
	- Account for other statusses.
*/

function canUseSkill(userDefs, allySide, oppSide, skillDefs) {
	// The skill gotta exist lol.
	if (!skillDefs)
		return false;
	
	// Can't use Passives.
	if (skillDefs.passive || skillDefs.type === 'passive')
		return false;
	
	// Ego?
	if (userDefs.status === 'ego' && skillDefs.type === 'heal')
		return false;
	
	// Silence?
	if (userDefs.status === 'silence')
		return false;
	
	// Don't use heal skills until needed
	if (skillDefs.type === 'heal') {
		if (skillDefs.statusheal) {
			var canSkill = false;
			for (const i in allySide) {
				if (allySide[i].status != 'none')
					canSkill = true
			}
			
			if (!canSkill)
				return false;
		} else {
			var canSkill = false;
			for (const i in allySide) {
				if (allySide[i].hp < 100)
					canSkill = true
			}
			
			if (!canSkill)
				return false;
		}
	}
	
	// needlessthan Skills?
	if (skillDefs.needlessthan) {
		switch(skillDefs.costtype) {
			case "mp":
				if (userDefs.mp > skillDefs.needlessthan)
					return false;
				break;

			case "mppercent":
				if (userDefs.mp > (userDefs.maxmp/100)*skillDefs.needlessthan)
					return false;
				break;

			case "hppercent":
				if (userDefs.hp > (userDefs.maxhp/100)*skillDefs.needlessthan)
					return false;
				break;

			case "hpandmp":
				if (userDefs.hp > skillDefs.needlessthan || userDefs.mp > skillDefs.needlessthan)
					return false;
				break;

			case "hpandmppercent":
				if (userDefs.hp > (userDefs.maxhp/100)*skillDefs.needlessthan || userDefs.mp > (userDefs.maxmp/100)*skillDefs.needlessthan)
					return false;
				break;

			default:
				if (userDefs.hp > skillDefs.needlessthan)
					return false;
		}
	}
	
	// Chaos Stir Skills
	if (skillDefs.chaosStir && userDefs.doneChaosStir)
		return false;
	
	return true;
}

/*
	BASIC ENEMY THINKERS
	- Learn weaknesses
*/

function enemyThinker(userDefs, allySide, oppSide) {
	var skillPath = dataPath+'/skills.json'
	var skillRead = fs.readFileSync(skillPath);
	var skillFile = JSON.parse(skillRead);

	var possibleSkills = [];
	for (const i in userDefs.skills) {
		var skillDefs = skillFile[userDefs.skills[i]]
		
		if (canUseSkill(userDefs, allySide, oppSide, skillDefs))
			possibleSkills.push(userDefs.skills[i]);
	}
	
	// Heal if under 1/5 hp
	if (!userDefs.miniboss && !userDefs.boss && !userDefs.bigboss && Math.random() < 0.5) {
		var healSkills = [];
		for (const i in possibleSkills) {
			var skillDefs = skillFile[possibleSkills[i]]
			
			if (skillDefs.type === "heal" || skillDefs.terrain && skillDefs.terrain === "grassy" || skillDefs.drain)
				healSkills.push(possibleSkills[i]);
		}
	
		if (healSkills.length > 0 && userDefs.hp < Math.round(userDefs.maxhp/3)) {
			var healSkill = healSkills[Math.round(Math.random() * (healSkills.length-1))];
			for (const i in allySide) {
				if (allySide[i] == userDefs)
					return [healSkill, userDefs, i];
			}
			
			var targNum = Math.round(Math.random() * (allySide.length-1))
			if (allySide[targNum]) {
				while (allySide[targNum].hp <= 0) {
					targNum = Math.round(Math.random() * (allySide.length-1))
				}
			}
			return [healSkill, allySide[targNum], targNum];
		}
	}
	
	// Shield at low health
	if (userDefs.hp < userDefs.maxhp/2 && !userDefs.miniboss && !userDefs.bigboss && !userDefs.boss) {
		var shieldSkills = [];
		for (const i in possibleSkills) {
			var skillDefs = skillFile[possibleSkills[i]]
			
			if (skillDefs.makarakarn || skillDefs.tetrakarn || skillDefs.trap || skillDefs.shield)
				shieldSkills.push(possibleSkills[i]);
		}

		var skillName = shieldSkills[Math.round(Math.random() * (shieldSkills.length-1))]
		var skillDefs = skillFile[skillName];
		if (shieldSkills.length > 0 && ((skillDefs.makarakarn && !userDefs.makarakarn) || (skillDefs.tetrakarn && !userDefs.tetrakarn) || (skillDefs.trap && !userDefs.trap) || (skillDefs.shield && !userDefs.shield))) {
			for (const i in allySide) {
				if (allySide[i] == userDefs)
					return [skillName, userDefs, i]
			}

			return [skillName, allySide[0], 0];
		}
	}

	// Finally, attack.
	if (!userDefs.oppAff)
		userDefs.oppAff = {}

	var ignore = []
	if (userDefs.oppAff) {
		for (const i in userDefs.oppAff) {
			// Target Weaknesses
			if (oppSide[parseInt(i)] && oppSide[parseInt(i)].hp > 0 && userDefs.oppAff[i].weak && Math.random() < 0.3) {
				for (const k in userDefs.skills) {
					var skillDefs = skillFile[userDefs.skills[k]]

					if (skillDefs.type == userDefs.oppAff[i].weak)
						return [userDefs.skills[k], oppSide[parseInt(i)], parseInt(i)];
				}
			}

			/*
			var affinities = ['resist', 'block', 'repel', 'drain']
			for (const k in affinities) {
				if (userDefs.oppAff[i][affinities[k]]) {
					ignore.push([i, affinities[k]])
				}
			}
			*/
		}
	}
			
	// Since we know nothing else... might as well experiment
	var targNum = Math.round(Math.random() * (oppSide.length-1))	
	if (oppSide[targNum]) {
		while (oppSide[targNum].hp <= 0) {
			targNum = Math.round(Math.random() * (oppSide.length-1))
		}
	}

	var oppDefs = oppSide[targNum];

	var chosenSkill = possibleSkills[Math.round(Math.random() * (possibleSkills.length-1))];
	var skillDefs = skillFile[chosenSkill]
	
	if (skillDefs.type === 'status') {
		// Target allies with shields
		if (skillDefs.makarakarn || skillDefs.shield || skillDefs.tetrakarn || skillDefs.trap) {
			var allyNum = Math.round(Math.random() * (allySide.length-1))
			return [chosenSkill, oppSide[targNum], allyNum]
		}
	}

	if (!userDefs.oppAff[targNum]) {
		userDefs.oppAff[targNum] = {
			weak: [],
			resist: [],
			block: [],
			repel: [],
			drain: []
		}
	}

	for (const k in oppDefs.weak) {
		if (skillDefs.type == oppDefs.weak[k])
			userDefs.oppAff[targNum].weak.push(skillDefs.type)
	}

	/*
	var affinities = ['resist', 'block', 'repel', 'drain']
	for (const k in affinities) {
		for (const j in oppDefs[affinities[k]]) {
			if (skillDefs.type == oppDefs[affinities[k]][j] && ) {
				userDefs.oppAff[targNum][affinities[k]].push(skillDefs.type)
			}
		}
	}
	*/

	console.log(`${chosenSkill} => ${oppDefs.name}`)
	return [chosenSkill, oppDefs, targNum]
}

// Export Functions
module.exports = {
	writeEnemy: function(author, server, name, lvl, hp, mp, xp, str, mag, prc, end, chr, int, agl, luk, boss, j) {
		return writeEnemy(author, server, name, lvl, hp, mp, xp, str, mag, prc, end, chr, int, agl, luk, boss, j)
	},
	
	writeRaidEnemy: function(author, server, name, lvl, hp, mp, xp, str, mag, prc, end, chr, int, agl, luk, boss, j) {
		return writeRaidEnemy(author, server, name, lvl, hp, mp, xp, str, mag, prc, end, chr, int, agl, luk, boss, j)
	},

	genEnm: function(enemy, server) {
		if (!enemy) {
			console.log(`Invalid enemy: ${enemy}.`)
			return undefined
		}
		
		var enmPath = dataPath+'/Enemies/enemies-' + server + '.json'
		var enmRead = fs.readFileSync(enmPath);
		var enmFile = JSON.parse(enmRead);
		const enm = enmFile[server][enemy]

		var enemyDefs = {
			name: enm.name ? enm.name : enemy,
			truename: enemy,
			team: "enemies",
			enemy: true,
			id: 0,

			level: enm.level,
			maxhp: enm.hp,
			maxmp: enm.mp,
			hp: enm.hp,
			mp: enm.mp,
			lb: 0,
				
			boss: (enm.boss || enm.bigboss) ? true : false,
			miniboss: enm.miniboss ? true : false,
			finalboss: enm.finalboss ? true : false,
			diety: enm.diety ? true : false,

			atk: enm.atk,
			mag: enm.mag,
			prc: enm.prc,
			end: enm.end,
			chr: enm.chr,
			int: enm.int,
			agl: enm.agl,
			luk: enm.luk,
			weapon: "none",
			guard: false,

			status: "none",
			statusturns: 0,

			melee: {
				name: enm.melee[0],
				type: enm.melee[1],
				pow: 30,
				acc: 95,
				crit: 16
			},

			skills: enm.skills,
			superweak: enm.superweak,
			weak: enm.weak,
			resist: enm.resist,
			block: enm.block,
			repel: enm.repel,
			drain: enm.drain,

			buffs: {
				atk: 0,
				mag: 0,
				prc: 0,
				end: 0,
				agl: 0,
				
				crit: 0
			},
			
			limitbreak: enm.lb ? enm.lb : null,
			
			meleequote: enm.meleequote ? enm.meleequote : [],
			physquote: enm.physquote ? enm.physquote : [],
			magquote: enm.magquote ? enm.magquote : [],
			strongquote: enm.strongquote ? enm.strongquote : [],
			critquote: enm.critquote ? enm.critquote : [],
			weakquote: enm.weakquote ? enm.weakquote : [],
			missquote: enm.missquote ? enm.missquote : [],
			dodgequote: enm.dodgequote ? enm.dodgequote : [],
			resistquote: enm.resistquote ? enm.resistquote : [],
			blockquote: enm.blockquote ? enm.blockquote : [],
			repelquote: enm.repelquote ? enm.repelquote : [],
			drainquote: enm.drainquote ? enm.drainquote : [],
			hurtquote: enm.hurtquote ? enm.hurtquote : [],
			healquote: enm.healquote ? enm.healquote : [],
			helpedquote: enm.helpedquote ? enm.helpedquote : [],
			killquote: enm.killquote ? enm.killquote : [],
			deathquote: enm.deathquote ? enm.deathquote : [],
			lbquote: enm.lbquote ? enm.lbquote : [],

			trust: {},

			negotiateOptions: enm.negotiate ? enm.negotiate : null,
			negotiateDefs: enm.negotiateDefs ? enm.negotiateDefs : null,

			itemLoot: enm.loot ? enm.loot : undefined
		}
		
		if (enm.mainElement)
			enemyDefs.mainElement = enm.mainElement
		
		if (!enm.boss && !enm.miniboss && !enm.finalboss && !enm.bigboss && !enm.diety) {
			var servPath = dataPath+'/Server Settings/server.json'
			var servRead = fs.readFileSync(servPath);
			var servFile = JSON.parse(servRead);
			
			if (!servFile[server].goldChance)
				servFile[server].goldChance = 0.1
			
			if (Math.random() <= servFile[server].goldChance/100)
				enemyDefs.golden = true;
		}
		
		return enemyDefs
	},
	
	thinkerFunc: function(charDefs, allyingSide, opposingSide) {
		return enemyThinker(charDefs, allyingSide, opposingSide)
	},

	makePet: function(enm) {
		var enemyDefs = {
			name: enm.name,

			atk: enm.atk,
			mag: enm.mag,
			prc: enm.prc,
			end: enm.end,
			chr: enm.chr,
			int: enm.int,
			agl: enm.agl,
			luk: enm.luk,

			buffAtk: enm.negotiateDefs.qualities.atk ?? 1,
			buffMag: enm.negotiateDefs.qualities.mag ?? 1,
			buffEnd: enm.negotiateDefs.qualities.def ?? 1,

			melee: enm.melee,
			skill: enm.negotiateDefs.qualities.skill ?? 'Lunge'
		}

		if (enm.mainElement)
			enemyDefs.mainElement = enm.mainElement;

		if (enm.golden)
			enemyDefs.golden = true;

		return enemyDefs
	},
}
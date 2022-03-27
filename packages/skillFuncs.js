const dataPath = './data'
const fs = require('fs');
const enemyFuncs = require('./enemyFuncs.js');
const utilityFuncs = require('./utilityFuncs.js');

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
	"skill",
	"heal",
	"healmp",
	"healhpmp",
	"revive",
	"material",
	"pacify"
]

const itemTypeEmoji = {
	skill: '🎇',

	heal: "🌀",
	healmp: "⭐",
	healhpmp: "🔰",

	revive: "✨",
	material: '🛠',
	pacify: '🎵',
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

const weathers = [
	"rain",
	"thunder",
	"sunlight",
	"windy",
	"sandstorm",
	"hail"
]

const terrains = [
	"flaming", // 10 damage with 10% chance of burn
	"thunder", // 1.2x to elec
	"grassy",
	"light",
	"psychic",
	"misty",
	"sky",
	
	// boss specific
	"flooded",
	"swamp",
	"glacial",
	"fairydomain",
	"graveyard",
	"factory",
	"blindingradiance",
	"eternaldarkness"
]

// Apply Extra Effects to an existing skill
function applyExtra(skill, extra1, extra2, extra3) {
	if (extra1 === 'ohko') {
		skill[extra1] = true;
		switch(skill.target) {
			case 'everyone':
				if (skill.acc >= 80)
					skill.levelLock = 99;
				else if (skill.acc >= 35)
					skill.levelLock = 80;
				else
					skill.levelLock = 55;
				break;

			case 'allopposing':
				if (skill.acc >= 80)
					skill.levelLock = 90;
				else if (skill.acc >= 35)
					skill.levelLock = 65;
				else
					skill.levelLock = 40;
				break;
			
			default:
				if (skill.acc >= 80)
					skill.levelLock = 80;
				else if (skill.acc >= 35)
					skill.levelLock = 40;
				else
					skill.levelLock = 20;
		}
	} else if (extra1 === 'sacrifice')
		skill.sacrifice = true;
	else if (extra1 === 'buff' || extra1 === 'debuff' || extra1 === 'debuffuser') {
		skill[extra1] = extra2.toLowerCase();
		skill.buffchance = parseInt(extra3);
		
		if (extra1 === 'buff' || extra1 === 'debuff')
			skill.levelLock += 7;
	} else if (extra1 === 'dualbuff' || extra1 === 'dualdebuff') {
		skill[extra1] = [extra2.toLowerCase(), extra3.toLowerCase()];
		skill.levelLock += 15;
	} else if (extra1 === 'takemp') {
		skill.takemp = parseInt(extra2);
		skill.levelLock += 5;
	} else if (extra1 === 'healverse') {
		skill.verse = ['heal', parseInt(extra2)];
		skill.levelLock += 10;
	} else if (extra1 === 'powerverse') {
		skill.verse = ['power', parseInt(extra2)];
		skill.levelLock += 10;
	} else if (extra1 === 'spreadverse') {
		skill.verse = ['spread', parseInt(extra2)];
		skill.levelLock += 15;
	} else if (skill.type === 'mp' && extra1 === 'healmp')
		skill.healmp = true;
	else if (extra1 === 'steal') {
		skill.steal = parseInt(extra2);
		skill.levelLock += (extra1 === 'steal') ? 20 : 8;
	} else if (extra1 === 'powerbuff') {
		if (utilityFuncs.validStat(extra2))
			skill.powerbuff = [extra2.toLowerCase(), parseInt(extra3)];
	} else if (extra1 === 'multistatus') {
		if (skill.status && typeof skill.status === 'string')
			skill.status = [skill.status]
		else if (typeof skill.status === 'object')
			skill.status = [skill.status[0]]
		else
			skill.status = []

		if (utilityFuncs.validStatus(extra2)) skill.status.push(extra2);
		if (utilityFuncs.validStatus(extra3)) skill.status.push(extra3);
	} else if (extra1 === 'statcalc') {
		if (utilityFuncs.validStat(extra2.toLowerCase()))
			skill.statCalc = extra2.toLowerCase();
	} else if (extra1 === 'hpcalc' || extra1 === 'mpcalc' || extra1 === 'feint' || extra1 === 'rest' || extra1 === 'stealmp' || extra1 === 'lonewolf' || extra1 === 'heavenwrath') {
		skill[extra1] = true;
		
		if (extra1 === 'feint' || extra1 === 'stealmp')
			skill.levelLock = Math.min(99, skill.levelLock+15);
	} else if (extra1 === 'rollout') {
		skill.rollout = parseFloat(extra2);

		if (skill.rollout >= 75)
			skill.levelLock = Math.min(99, skill.levelLock+60);
		else if (skill.rollout >= 50)
			skill.levelLock = Math.min(99, skill.levelLock+45);
		else if (skill.rollout >= 25)
			skill.levelLock = Math.min(99, skill.levelLock+30);
		else
			skill.levelLock = Math.min(99, skill.levelLock+15);
	} else if (extra1 === 'forcetech') {
		if (utilityFuncs.validStatus(extra2)) {
			if (utilityFuncs.validStatus(extra3))
				skill.forceTech = [extra2, extra3];
			else
				skill.forceTech = [extra2];
		} else
			return false;
	// Verwex's Dual-Element Extra
	} else if (extra1 === 'dualelement' || extra1 === 'dualtype') {
		if (utilityFuncs.validType(extra2.toLowerCase()) && extra2.toLowerCase() != skill.type && extra2.toLowerCase() != 'passive' && extra2.toLowerCase() != 'status' && extra2.toLowerCase() != 'heal') {
			skill.type = [(typeof skill.type === 'object') ? skill.type[0] : skill.type, extra2.toLowerCase()];
		} else
			return false;
	} else if (extra1 === 'sustain' || extra1 === 'sustaindmg' || extra1 === 'susdmg') {
		skill.susDmg = true; // AMONGUS
	} else if (extra1 === 'reverse' || extra1 === 'reversedmg' || extra1 === 'revdmg') {
		skill.revDmg = true; // AMONGUS
	} else if (extra1 === 'powhit') {
		skill.powHits = [parseInt(extra2), extra3 ? parseInt(extra3) : null]
	} else
		return false;

	return true;
}

function applyHealExtra(skill, extra1, extra2, extra3) {
	if (extra1 === 'sacrifice' || extra1 === 'healmp' || extra1 === 'regenerate' || extra1 === 'invigorate' || extra1 === 'statusheal' || extra1 === 'recarmdra' || extra1 === 'fullheal' || extra1 === 'wish')
		skill[extra1] = true;
	else
		return false;

	return true;
}

// Get the full embed of a skill
function statusDesc(skillDefs) {
	var finalText = '';

	if (skillDefs.autoguard && skillDefs.protectitem)
		finalText += `Protects **one** party member with ${skillDefs.protectitem}.\n`;
	else if (skillDefs.autoguardall && skillDefs.protectitem)
		finalText += `Protects **all** party members with ${skillDefs.protectitem}.\n`;

	if (skillDefs.mimic)
		finalText += 'Mimics **one ally/foe**.\n';

	if (skillDefs.copyskill)
		finalText += 'Uses a **randomly known ally skill**.\n';

	if (skillDefs.sketch)
		finalText += "Copies a **random skill of the opponent's**.\n";
	
	if (skillDefs.futuresight)
		finalText += 'Will deal damage in **${skillDefs.futuresight.turns} turns**.\n';

	if (skillDefs.reincarnate)
		finalText += 'Adds an **undead ally** to the party temporarily.\n';

	return finalText;
}

function passiveDesc(skillDefs) {
	var finalText = `Passive Type: **${skillDefs.passive}**\n`
	return finalText;
}

function atkDesc(skillDefs) {
	var finalText = '';

	if (skillDefs.metronome) {
		finalText += 'Uses a **randomly defined skill**.\n';
	} else {
		if (skillDefs.affinitypow)
			finalText += `Affected by **<:passive:906874477210648576>SpiritCharge** or **<:passive:906874477210648576>Teamwork**, by **${skillDefs.affinitypow} power**.\n`;

		if (skillDefs.buff) {
			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to buff **${skillDefs.buff.toUpperCase()}**.\n`
			} else {
				finalText += `Buffs **${skillDefs.buff.toUpperCase()}**.\n`
			}
		}

		if (skillDefs.debuff) {
			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to debuff target's **${skillDefs.debuff.toUpperCase()}**.\n`
			} else {
				finalText += `Debuffs target's **${skillDefs.debuff.toUpperCase()}**.\n`
			}
		}

		if (skillDefs.debuffuser)
			finalText += `Debuffs the caster's **${skillDefs.debuffuser.toUpperCase()}**.\n`;

		if (skillDefs.dualbuff) {
			var stats = '';
			for (const i in skillDefs.dualbuff) {
				stats += `**${skillDefs.dualbuff[i].toUpperCase()}**`;
				if (i < skillDefs.dualbuff.length-1) stats += ', ';
			}

			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to buff caster's ${stats}.\n`
			} else {
				finalText += `Will buff the caster's ${stats}.\n`
			}
		}

		if (skillDefs.dualdebuff) {
			var stats = '';
			for (const i in skillDefs.dualdebuff) {
				stats += `**${skillDefs.dualdebuff[i].toUpperCase()}**`;
				if (i < skillDefs.dualdebuff.length-1) stats += ', ';
			}

			if (skillDefs.buffchance) {
				finalText += `**${skillDefs.buffchance}%** chance to debuff foe's ${stats}.\n`
			} else {
				finalText += `WIll debuff the foe's ${stats}.\n`
			}
		}

		if (skillDefs.lonewolf)
			finalText += `Power is multiplied by 1.5x if **the user is alone or the last one standing**\n`;
	}
	
	return finalText;
}

function skillDesc(skillDefs, skillName, server) {
	var finalText = ``;
	if (skillDefs.pow && skillDefs.type != "status" && skillDefs.type != "passive") {
		if (skillDefs.ohko && skillDefs.type != "heal")
			finalText += 'Defeats the foe in **one shot**!';
		else {
			if (skillDefs.type === 'heal') {
				if (skillDefs.fullheal)
					finalText += '**Fully heals**';
				else if (skillDefs.statusheal)
					finalText += '**Cures status ailments**';
				else
					finalText += `Heals **around ${skillDefs.pow}HP**`;
			} else
				finalText += `Has **${skillDefs.pow}** Power`;
		}

		if (skillDefs.hits && skillDefs.hits > 1 && skillDefs.type != "heal" && !skillDefs.ohko) 
			finalText += ` and hits **${skillDefs.hits}** times.`;

		finalText += "\n";
	}

	switch(skillDefs.target) {
		case "allopposing":
			finalText += "Targets **all foes**.\n";
			break;
		case "allallies":
			finalText += "Targets **all allies**.\n";
			break;
		case "ally":
			finalText += "Targets **an ally**.\n";
			break;
		case "everyone":
			finalText += "Targets **all fighters** in-battle.\n";
			break;
		case "caster":
			finalText += "Targets **the user**.\n";
			break;
		case "random":
			finalText += "Targets a **random fighter** in-battle.\n";
			break;
		case "randomopposing":
			finalText += "Targets a **random opponent** in-battle.\n";
			break;
		default:
			finalText += "Targets **one foe**.\n";
	}

	if (skillDefs.cost && skillDefs.costtype) {
		switch(skillDefs.costtype) {
			case "hp":
				finalText += `Costs **${skillDefs.cost}HP**.\n`;
				break;
			case "hppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max HP**.\n`;
				break;
			case "mppercent":
				finalText += `Costs **${skillDefs.cost}% of the user's Max MP**.\n`;
				break;
			case "money":
				finalText += `Costs **${skillDefs.cost} of the team's money**.\n`;
				break;
			default:
				finalText += `Costs **${skillDefs.cost}MP**.\n`;
		}
	}
	
	if (skillDefs.acc && skillDefs.type != "heal" && skillDefs.type != "passive")
		finalText += `Has **${skillDefs.acc}%** Accuracy.\n`;

	if (skillDefs.drain && skillDefs.type != "heal") {
		if (skillDefs.drain > 1) {
			finalText += `Drains 1/${skillDefs.drain} of damage dealt.\n`;
		} else {
			finalText += `Drains all damage dealt.\n`;
		}
	}

	if (skillDefs.crit && skillDefs.type != "heal" && skillDefs.type != "status" && skillDefs.type != "passive")
		finalText += `**${skillDefs.crit}%**<:crit:876905905248145448>\n`;

	if (skillDefs.status) {
		if (typeof skillDefs.status === 'object') {
			if (skillDefs.statuschance) {
				finalText += `Has a **${skillDefs.statuschance}%** chance of inflicting either `;
			} else if (!skillDefs.statuschance || skillDefs.statuschance >= 100) {
				finalText += '**Guaranteed** to inflict either ';
			}

			for (const i in skillDefs.status) {
				finalText += `**${skillDefs.status[i]}**`
				if (i == skillDefs.status.length-2)
					finalText += ' or '
				else if (i >= skillDefs.status.length-1)
					finalText += '.\n'
				else
					finalText += ', '
			}
		} else if (skillDefs.status !== "none" && skillDefs.type != "heal") {
			if (skillDefs.statuschance) {
				finalText += `Has a **${skillDefs.statuschance}%** chance of inflicting **${skillDefs.status}**.\n`;
			} else if (!skillDefs.statuschance || skillDefs.statuschance >= 100) {
				finalText += `Guaranteed to inflict **${skillDefs.status}**.\n`;
			}
		}
	}

	if (skillDefs.type === 'status') {
		finalText += statusDesc(skillDefs)
	} else if (skillDefs.type === 'passive') {
		finalText += passiveDesc(skillDefs)
	} else if (skillDefs.type != 'passive') {
		finalText += atkDesc(skillDefs)
	}

	if (skillDefs.atktype) {
		var attackArray = skillDefs.atktype.split('');
		attackArray[0] = attackArray[0].toUpperCase()
		
		var attackString = attackArray.join('');
		finalText += `**${attackString}** attack.\n`;
	}

	if (skillDefs.preSkill)
		finalText += `**Previous Tier**: *${skillDefs.preSkill[0]}, LV${skillDefs.preSkill[1]}*\n`;

	if (skillDefs.evoSkill)
		finalText += `**Next Tier**: *${skillDefs.evoSkill[0]}, LV${skillDefs.evoSkill[1]}*\n`;

	if (skillDefs.levelLock)
		finalText += `🔒 *Skill Locked until level **${skillDefs.levelLock}***`;
	
	finalText += '\n'
	
	if (skillDefs.desc)
		finalText += `\n*${skillDefs.desc}*`;
	
	finalText += '\n\n**Known By**:'

	var charPath = `${dataPath}/Characters/characters-${server}.json`
	var charRead = fs.readFileSync(charPath, {flag: 'as+'});
	var charFile = JSON.parse(charRead);
	var enmPath = `${dataPath}/Enemies/enemies-${server}.json`
	var enmRead = fs.readFileSync(enmPath, {flag: 'as+'});
	var enmFile = JSON.parse(enmRead);
	
	var knownBy = ""

	for (const i in charFile) {
		for (const k in charFile[i].skills) {
			if (!charFile[i].hidden && charFile[i].skills[k] == skillName) {
				if (knownBy != "") knownBy += ", ";
				knownBy += `${i}`
			}
		}
	}

	for (const i in enmFile[server]) {
		if (enemyFuncs.encounteredEnemy(i, server)) {
			for (const k in enmFile[server][i].skills) {
				if (enmFile[server][i].skills[k] == skillName) {
					if (knownBy != "") knownBy += ", ";
					knownBy += `${i}`
				}
			}
		}
	}

	finalText += `\n${knownBy}`
	
	return finalText;
}

module.exports = {
	skillDesc: function(skill, id, serv) {
		return skillDesc(skill, id, serv);
	},
	
	applyExtra: function(skill, extra1, extra2, extra3) {
		return applyExtra(skill, extra1, extra2, extra3);
	},
	
	applyHealExtra: function(skill, extra1, extra2, extra3) {
		return applyHealExtra(skill, extra1, extra2, extra3);
	}
}
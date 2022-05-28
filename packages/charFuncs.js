function writeTransformation(userDefs, trnsName, req, hpBuff, atkBuff, magBuff, prcBuff, endBuff, chrBuff, intBuff, aglBuff, lukBuff, skill, desc) {
	if (!userDefs.transformations)
		userDefs.transformations = {};
	
	userDefs.transformations[trnsName] = {
		name: trnsName,
		requirement: req.toLowerCase(),
		desc: '',
		
		hp: parseInt(hpBuff),
		atk: parseInt(atkBuff),
		mag: parseInt(magBuff),
		prc: parseInt(prcBuff),
		end: parseInt(endBuff),
		chr: parseInt(chrBuff),
		int: parseInt(intBuff),
		agl: parseInt(aglBuff),
		luk: parseInt(lukBuff),
		
		tp: 0,
		tpmax: 10,
		level: 1
	}
	console.log(`Written ${userDefs.name}'s ${trnsName} Transformation.`)
}

// FUNCTIONS
function canTransform(userDefs, allySide, oppSide, trans) {
	if (userDefs.level < 70) return false;
	if (!userDefs.transformations) return false;
	if (!userDefs.transformations[trans]) return false;

	var transDefs = userDefs.transformations[trans];
	if (!transDefs.requirement) return true;

	switch(transDefs.requirement.toLowerCase()) {
		case 'allydown':
			for (const i in allySide) {
				if (allySide[i].hp <= 0) return true;
			}
			break;
		
		case 'onlystanding':
			if (allySide.length <= 1) return true;
			break;
		
		case 'belowhalfhp':
			if (userDefs.hp <= userDefs.maxhp/2) return true;
			break;
		
		case 'outofmp':
			if (userDefs.mp <= 0) return true;
			break;
		
		case 'leaderdown':
			for (const i in allySide) {
				if (allySide[i].hp <= 0 && allySide[i].leader) return true;
			}
			break;
		
		case 'trusteddown':
			for (const i in allySide) {
				if (allySide[i].hp <= 0 && userDefs.trust[allySide[i].truename] && userDefs.trust[allySide[i].truename].level >= 10) return true;
			}
			break;
		
		default:
			return false;
	}

	return false;
}

function transformChar(userDefs, transformation) {
	if (!userDefs.transformations)
		return false;
	
	if (!userDefs.transformations[transformation])
		return false;
	
	var transformDefs = userDefs.transformations[transformation]

	var addStats = [
		"hp",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk"
	]

	userDefs.beforeTransformation = {}
	for (const i in addStats) {
		if (userDefs[addStats[i]] && transformDefs[addStats[i]]) {
			userDefs.beforeTransformation[addStats[i]] = userDefs[addStats[i]]
			userDefs[addStats[i]] += transformDefs[addStats[i]]
		}
	}
	
	userDefs.transformation = 5
	return true
}

function deTransformChar(userDefs) {
	if (!userDefs.beforeTransformation)
		return false;

	var addStats = [
		"hp",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk"
	]

	for (const i in addStats) {
		if (userDefs[addStats[i]] && userDefs.beforeTransformation[addStats[i]]) {
			userDefs[addStats[i]] = userDefs.beforeTransformation[addStats[i]];
		}
	}

	delete userDefs.beforeTransformation
	delete userDefs.transformation
	return true
}

function mimic(userDefs, targDefs, turns) {
	var copyStats = [
		"name",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk",
		"weak",
		"resist",
		"block",
		"repel",
		"drain",
		"skills",
		"lb1",
		"lb2",
		"lb3",
		"lb4"
	]

	userDefs.old = {}
	for (const i in copyStats) {
		userDefs.old[copyStats[i]] = userDefs[copyStats[i]]
		if (userDefs[copyStats[i]] && targDefs[copyStats[i]])
			userDefs[copyStats[i]] = targDefs[copyStats[i]];
	}
	
	userDefs.mimic = true
	userDefs.mimicturns = turns+1
	userDefs.name += ` (${userDefs.truename})`
	return true
}

function resetMimic(userDefs) {
	if (!userDefs.old) return false;
	
	var copyStats = [
		"name",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk",
		"weak",
		"resist",
		"block",
		"repel",
		"drain",
		"skills",
		"lb1",
		"lb2",
		"lb3",
		"lb4"
	]

	for (const i in copyStats) {
		if (userDefs[copyStats[i]] && userDefs.old[copyStats[i]])
			userDefs[copyStats[i]] = userDefs.old[copyStats[i]];
	}

	delete userDefs.mimic
	delete userDefs.old
	delete userDefs.mimicturns
	return true
}

function swapBodies(userDefs, targDefs, turns) {
	var copyStats = [
		"name",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk",
		"weak",
		"resist",
		"block",
		"repel",
		"drain",
		"skills",
		"owner",
		"enemy"
	]

	var takeStats = [{}, {}]
	for (const i in copyStats) {
		if (userDefs[copyStats[i]])
			takeStats[0][copyStats[i]] = userDefs[copyStats[i]];
		if (targDefs[copyStats[i]])
			takeStats[1][copyStats[i]] = targDefs[copyStats[i]];
	}
	
	for (const i in copyStats) {
		userDefs[copyStats[i]] = takeStats[1][copyStats[i]];
		targDefs[copyStats[i]] = takeStats[0][copyStats[i]];
	}
	
	userDefs.swapped = turns+1;
	userDefs.swappedWith = targDefs.id;
	targDefs.swapped = turns+1;
	targDefs.swappedWith = userDefs.id;
	return true
}

function returnBodies(userDefs, targDefs) {
	if (!userDefs.swapped) return false;

	var copyStats = [
		"name",
		"atk",
		"mag",
		"prc",
		"end",
		"agl",
		"int",
		"chr",
		"luk",
		"weak",
		"resist",
		"block",
		"repel",
		"drain",
		"skills",
		"owner",
		"enemy"
	]

	var takeStats = [{}, {}]
	for (const i in copyStats) {
		if (userDefs[copyStats[i]])
			takeStats[0][copyStats[i]] = userDefs[copyStats[i]];
		if (targDefs[copyStats[i]])
			takeStats[1][copyStats[i]] = targDefs[copyStats[i]];
	}
	
	for (const i in copyStats) {
		userDefs[copyStats[i]] = takeStats[1][copyStats[i]];
		targDefs[copyStats[i]] = takeStats[0][copyStats[i]];
	}
	
	delete userDefs.swapped
	delete userDefs.swappedWith
	delete targDefs.swapped
	delete targDefs.swappedWith
	return true
}

function knowsSkill(userDefs, skillName) {
	const skillPath = dataPath+'/skills.json'
	const skillRead = fs.readFileSync(skillPath);
	const skillFile = JSON.parse(skillRead);
	
	console.log('Knows ' + skillName + '?')
	for (const i in userDefs.skills) {
		if (userDefs.skills[i] == skillName) {
			console.log('true')
			return true
		}
	}
	
	console.log('false')
	return false
}

function hasPassive(userDefs, passivetype) {
	const skillPath = dataPath+'/skills.json'
	const skillRead = fs.readFileSync(skillPath);
	const skillFile = JSON.parse(skillRead);

	for (const skillNum in userDefs.skills) {
		var skillDefs = skillFile[userDefs.skills[skillNum]];
		if (skillDefs && skillDefs.type && skillDefs.type === "passive") {
			if (skillDefs.passive && skillDefs.passive.toLowerCase() === passivetype.toLowerCase()) {
				console.log(`${userDefs.name} has the ${passivetype} passive.`)
				return skillDefs
			}
		}
	}

	return false
}

function isOpposingSide(userDefs, serverBtl) {
	if (!serverBtl) {
		console.log("Some serverBtl wasnt defined somewhere.")
		return false
	}

	for (const i in serverBtl.enemies.members) {
		if (serverBtl.enemies.members[i].id == userDefs.id) {
			return true
		}
	}

	return false
}

function hasteamCombo(charName, allyName, server) {
	var tcPath = `${dataPath}/TeamCombos/teamcombos-${server}.json`
    var tcRead = fs.readFileSync(tcPath);
    var tcFile = JSON.parse(tcRead);

	for (const i in tcFile) {
		if (tcFile[i].user == charName && tcFile[i].ally == allyName) return tcFile[i];
	}

	return null
}

function equippedCharm(charDefs, charm) {
	if (charDefs.charms) {
		for (const i in charDefs.charms) {
			if (charDefs.charms[i] == charm) return true;
		}
	}
	
	return false
}

// Trust
function initTrust(charDefs, targName) {
	if (!charDefs.trust) charDefs.trust = {};

	if (!charDefs.trust[targName]) {
		charDefs.trust[targName] = {
			value: 0,
			nextLevel: 100,
			level: 1
		}
	}
	
	return true
}

function trustLevel(charDefs, targName, btl, client) {
	if (!charDefs.trust)
		charDefs.trust = {};

	if (!charDefs.trust[targName]) {
		charDefs.trust[targName] = {
			value: 0,
			nextLevel: 100,
			level: 1
		}
	}

	charDefs.trust[targName].level++;
	charDefs.trust[targName].value = Math.max(0, charDefs.trust[targName].value-charDefs.trust[targName].nextLevel);

	// Next Level Poggers!
	charDefs.trust[targName].nextLevel += 20;

	const trustEmbed = new Discord.MessageEmbed()
		.setColor('#ff40af')
		.setTitle(`Level ${charDefs.trust[targName].level-1} => ${charDefs.trust[targName].level}`)
		.setDescription(`${charDefs.name} & ${targName} are getting closer...`)

	client.channels.fetch(btl.battlechannel)
		.then(channel => channel.send({embeds: [trustEmbed]}))
}

function dislikeChar(charDefs, targName, btl, client) {
	if (!charDefs.trust)
		charDefs.trust = {};

	if (!charDefs.trust[targName]) {
		charDefs.trust[targName] = {
			value: 0,
			dislike: 100,
			nextLevel: 100,
			level: 1
		}
	}

	// Dislike
	charDefs.trust[targName].dislike = 100;

	const trustEmbed = new Discord.MessageEmbed()
		.setColor('#ff40af')
		.setTitle('Dislikes and anger!')
		.setDescription(`${charDefs.name} & ${targName} seem to dislike eachother.`)

	client.channels.fetch(btl.battlechannel)
		.then(channel => channel.send({embeds: [trustEmbed]}))
}

function buffStat(charDefs, stat, amount) {
	var statBuff = stat.toLowerCase()
	charDefs.buffs[statBuff] += amount

	if (charDefs.buffs[statBuff] > 3)
		charDefs.buffs[statBuff] = 3
	if (charDefs.buffs[statBuff] < -3)
		charDefs.buffs[statBuff] = -3
}

function leaderSkillsAtBattleStart(allySide) {
	var leaderDefs = {}
	for (const i in allySide) {
		if (allySide[i].leader)
			leaderDefs = allySide[i]
	}
	
	if (!leaderDefs.leaderSkill)
		return false;
	
	if (leaderDefs.leaderSkill.type.toLowerCase() == 'buff') {
		for (const i in allySide) {
			if (leaderDefs.leaderSkill.target == 'all') {
				buffStat(allySide[i], 'atk', leaderDefs.leaderSkill.percent)
				buffStat(allySide[i], 'mag', leaderDefs.leaderSkill.percent)
				buffStat(allySide[i], 'end', leaderDefs.leaderSkill.percent)
				buffStat(allySide[i], 'agl', leaderDefs.leaderSkill.percent)
				buffStat(allySide[i], 'prc', leaderDefs.leaderSkill.percent)
			} else
				buffStat(allySide[i], leaderDefs.leaderSkill.target.toLowerCase(), leaderDefs.leaderSkill.percent)
		}
		
		return true;
	}
}

function copyObj(source) {
	if (Object.prototype.toString.call(source) === '[object Array]') {
		var clone = []

		for (var i = 0; i < source.length; i++) {
			clone[i] = copyObj(source[i])
		}

		return clone
	} else if (typeof(source)=="object") {
		var clone = {}

		for (var prop in source) {
			if (source.hasOwnProperty(prop)) {
				clone[prop] = copyObj(source[prop])
			}
		}

		return clone
	} else {
		return source
	}
}

// Export Functions
module.exports = {
	makeTransformation: function(userDefs, trnsName, req, auto, hpBuff, atkBuff, magBuff, prcBuff, endBuff, chrBuff, intBuff, aglBuff, lukBuff) {
		writeTransformation(userDefs, trnsName, req, auto, hpBuff, atkBuff, magBuff, prcBuff, endBuff, chrBuff, intBuff, aglBuff, lukBuff)
	},

	genChar: function(charDefs, leader, partyDefs) {
		var battlerDefs = {
			name: charDefs.name,
			truename: charDefs.name,
			team: "allies",
			id: 0,
			
			mainElement: charDefs.mainElement,

			melee: {
				name: charDefs.melee[0],
				type: charDefs.melee[1],
				pow: 30,
				acc: 93,
				crit: 15
			},

			level: charDefs.level,
			hp: charDefs.hp,
			mp: charDefs.mp,
			maxhp: charDefs.maxhp,
			maxmp: charDefs.maxmp,
			basehp: charDefs.basehp,
			basemp: charDefs.basemp,
			
			mpMeter: charDefs.mpMeter ? charDefs.mpMeter : ['Magic Points', 'MP'],

			lb: 0,
			xp: charDefs.xp,
			maxxp: charDefs.maxxp,

			status: "none",
			statusturns: 0,

			atk: charDefs.atk,
			mag: charDefs.mag,
			prc: charDefs.prc,
			end: charDefs.end,
			chr: charDefs.chr,
			int: charDefs.int,
			agl: charDefs.agl,
			luk: charDefs.luk,

			baseatk: charDefs.baseatk,
			basemag: charDefs.basemag,
			baseprc: charDefs.baseprc,
			baseend: charDefs.baseend,
			basechr: charDefs.basechr,
			baseint: charDefs.baseint,
			baseagl: charDefs.baseagl,
			baseluk: charDefs.baseluk,

			weapon: charDefs.weapon ? charDefs.weapon : "none",
			guard: false,

			buffs: {
				atk: 0,
				mag: 0,
				prc: 0,
				end: 0,
				agl: 0,
				
				crit: 0
			},

			meleequote: charDefs.meleequote ? charDefs.meleequote : [],
			physquote: charDefs.physquote ? charDefs.physquote : [],
			magquote: charDefs.magquote ? charDefs.magquote : [],
			strongquote: charDefs.strongquote ? charDefs.strongquote : [],
			critquote: charDefs.critquote ? charDefs.critquote : [],
			missquote: charDefs.missquote ? charDefs.missquote : [],
			weakquote: charDefs.weakquote ? charDefs.weakquote : [],
			dodgequote: charDefs.dodgequote ? charDefs.dodgequote : [],
			resistquote: charDefs.resistquote ? charDefs.resistquote : [],
			blockquote: charDefs.blockquote ? charDefs.blockquote : [],
			repelquote: charDefs.repelquote ? charDefs.repelquote : [],
			drainquote: charDefs.drainquote ? charDefs.drainquote : [],
			hurtquote: charDefs.hurtquote ? charDefs.hurtquote : [],
			healquote: charDefs.healquote ? charDefs.healquote : [],
			helpedquote: charDefs.helpedquote ? charDefs.helpedquote : [],
			killquote: charDefs.killquote ? charDefs.killquote : [],
			deathquote: charDefs.deathquote ? charDefs.deathquote : [],
			allydeathquote: charDefs.allydeathquote ? charDefs.allydeathquote : [],
			lbquote: charDefs.lbquote ? charDefs.lbquote : [],
			lvlquote: charDefs.lvlquote ? charDefs.lvlquote : [],

			bio: charDefs.bio ? charDefs.bio : {info: "", backstory: "", voice: "", theme: ""},

			superweak: charDefs.superweak,
			weak: charDefs.weak,
			resist: charDefs.resist,
			block: charDefs.block,
			repel: charDefs.repel,
			drain: charDefs.drain,
			skills: charDefs.skills,

			trust: charDefs.trust ? charDefs.trust : {},

			charms: charDefs.charms ? charDefs.charms : [],
			
			transformations: charDefs.transformations ? charDefs.transformations : null
		}
		
		if (charDefs.owner)
			battlerDefs.owner = charDefs.owner;
		else if (charDefs.npcchar)
			battlerDefs.npc = charDefs.npcchar;
		
		if (leader) {
			battlerDefs.leader = true;
			
			if (charDefs.leaderSkill)
				battlerDefs.leaderSkill = charDefs.leaderSkill;
		}
		
		// Insert Limit Breaks if they have them.
		if (charDefs.lb1)
			battlerDefs.lb1 = charDefs.lb1;
		if (charDefs.lb2)
			battlerDefs.lb2 = charDefs.lb2;
		if (charDefs.lb3)
			battlerDefs.lb3 = charDefs.lb3;
		if (charDefs.lb4)
			battlerDefs.lb4 = charDefs.lb4;
		
		// Charm Stat Buffs
		if (equippedCharm(charDefs, "GatheringSwarm"))
			battlerDefs.endurance += 5;
		
		if (equippedCharm(charDefs, "FragileHeart") || equippedCharm(charDefs, "UnbreakableHeart")) {
			battlerDefs.maxhp += 50;
			battlerDefs.hp += 50;
		}

		// Weapons and Armor
		if (partyDefs.weapons) {
			for (const i in partyDefs.weapons) {
				if (partyDefs.weapons[i].equipped != charDefs.name) continue;

				if (partyDefs.weapons[i].atk)
					battlerDefs.atk += partyDefs.weapons[i].atk;
				if (partyDefs.weapons[i].mag)
					battlerDefs.mag += partyDefs.weapons[i].mag;
				if (partyDefs.weapons[i].def)
					battlerDefs.end += partyDefs.weapons[i].def;
				if (partyDefs.weapons[i].melee)
					battlerDefs.melee.pow += partyDefs.weapons[i].melee;
				if (partyDefs.weapons[i].element)
					battlerDefs.melee.type = partyDefs.weapons[i].element;
				if (partyDefs.weapons[i].skill)
					battlerDefs.skills.push(partyDefs.weapons[i].skill);

				battlerDefs.weaponData = copyObj(partyDefs.weapons[i]);
			}
		}

		if (partyDefs.armors) {
			for (const i in partyDefs.armors) {
				if (partyDefs.armors[i].equipped != charDefs.name) continue;

				if (partyDefs.armors[i].atk)
					battlerDefs.atk += partyDefs.armors[i].atk
				if (partyDefs.armors[i].mag)
					battlerDefs.mag += partyDefs.armors[i].mag
				if (partyDefs.armors[i].def)
					battlerDefs.end += partyDefs.armors[i].def
				if (partyDefs.armors[i].melee)
					battlerDefs.melee.pow += partyDefs.armors[i].melee
				if (partyDefs.armors[i].element)
					battlerDefs.melee.type = partyDefs.armors[i].element
				if (partyDefs.armors[i].skill)
					battlerDefs.skills.push(partyDefs.armors[i].skill);

				battlerDefs.armorData = copyObj(partyDefs.armors[i]);
			}
		}

		return battlerDefs
	},

	mimic: function(userDefs, targDefs, turns) {
		mimic(userDefs, targDefs, turns)
	},

	resetMimic: function(userDefs) {
		resetMimic(userDefs)
	},

	knowsSkill: function(userDefs, skillName) {
		return knowsSkill(userDefs, skillName)
	},

	hasPassive: function(userDefs, passiveString) {
		return hasPassive(userDefs, passiveString)
	},
	
	isOpposingSide: function(userDefs, serverBtl) {
		return isOpposingSide(userDefs, serverBtl)
	},
	
	hasteamCombo: function(charName, allyName, server) {
		return hasteamCombo(charName, allyName, server)
	},
	
	initTrust: function(charDefs, targName) {
		initTrust(charDefs, targName)
	},
	
	trustLevel: function(charDefs, targName) {
		trustLevel(charDefs, targName)
	},
	
	trustUp: function(charDefs, targDefs, increment, server, client) {
		if (charDefs == targDefs || charDefs.name === targDefs.name)
			return false;

		if (!charDefs.trust)
			charDefs.trust = {};

		if (!targDefs.trust) 
			targDefs.trust = {};

		var btlPath = dataPath+'/Battles/battle-' + server + '.json'
		var btlRead = fs.readFileSync(btlPath);
		var btl = JSON.parse(btlRead);
        var servPath = dataPath+'/Server Settings/server.json'
        var servRead = fs.readFileSync(servPath, {flag: 'as+'});
        var servFile = JSON.parse(servRead);
		
		var charName = charDefs.truename ? charDefs.truename : charDefs.name
		var targName = targDefs.truename ? targDefs.truename : targDefs.name

		if (targDefs.trust && !btl[server].pvp) {
			if (!targDefs.trust[charName]) {
				initTrust(charDefs, targName)
				initTrust(targDefs, charName)
			}

			if (targDefs.trust[charName].dislike) {
				targDefs.trust[charName].dislike += increment*(servFile[server].trustrate ? servFile[server].trustrate : 1)
				if (targDefs.trust[charName].dislike >= 200)
					delete targDefs.trust[charName].dislike;
			} else {
				targDefs.trust[charName].value += increment*(servFile[server].trustrate ? servFile[server].trustrate : 1)
				if (targDefs.trust[charName].value < 0) {
					dislikeChar(targDefs, charName, btl[server], client)
				} else {
					while (targDefs.trust[charName].value >= targDefs.trust[charName].nextLevel) {
						trustLevel(targDefs, charName, btl[server], client)
					}
				}
			}
			
			charDefs.trust[targName] = targDefs.trust[charName];
			return true
		}
		
		// we'll get here if its pvp mode
		return false
	},
	
	buffStat: function(char, stat, am) {
		buffStat(char, stat, am)
	},
	
	startBattleLeaderSkill: function(allySide) {
		return leaderSkillsAtBattleStart(allySide);
	},
	
	needNotches: function(level) {
		if (level < 15)
			return 3
		else if (level < 23)
			return 4
		else if (level < 30)
			return 5
		else if (level < 39)
			return 6
		else if (level < 45)
			return 7
		else if (level < 53)
			return 8
		else if (level < 60)
			return 9
		else if (level < 69)
			return 10
		else
			return 11
	},
	
	equippedCharm: function(charDefs, charm) {
		return equippedCharm(charDefs, charm)
	},
	
	canTransform: function(charDefs, allySide, oppSide, trans) {
		return canTransform(charDefs, trans);
	},
	
	transform: function(charDefs, trans) {
		transformChar(charDefs, trans)
	},
	
	untransform: function(charDefs) {
		deTransformChar(charDefs)
	}
}
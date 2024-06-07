const adminList = [
	'516359709779820544',
	'441198920668938260',
	'412328234198237189',
	'621307633718132746',
	'798092550392381450',
	'532291526634635285'
]

checkListArgument = (type, variable, validTypes, message, settings) => {
	if (!settings) settings = setUpSettings(message.guild.id);

	if (!validTypes.includes(type)) {
		message.channel.send(`**${type.charAt(0).toUpperCase() + type.slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
		return false
	}

	//check if the thing accepts truths and falses
	let doesaccepttruths = ['pets', 'preskill', 'evoskill', 'item', 'weapon', 'armor', 'skill', 'melee', 'atk', 'mag', 'heal', 'healmp', 'healhpmp', 'revive', 'pacify', 'end', 'money',
							'limitbreaks', 'teamcombos', 'leaderskills', 'transformations', 'levellock']
	let canonlyaccepttruths = ['charms', 'endless']

	if (doesaccepttruths.includes(type) && (variable.toString().toLowerCase() == 'true' || variable.toString().toLowerCase() == 'false')) {
		return true
	}

	if (canonlyaccepttruths.includes(type) && !variable.toString().toLowerCase() == 'true' && !variable.toString().toLowerCase() == 'false') {
		message.channel.send(`${type} can only accept true or false!`);
		return false
	}

	//then check if their mechanic is disabled
	const fullNames = {
		leaderskills: 'Leader Skills',
		limitbreaks: 'Limit Breaks',
		charms: 'Charms',
		transformations: 'Transformations',
		teamcombos: 'Team Combos'
	}

	if (fullNames[type]) {
		if (!settings.mechanics[type]) {
			message.channel.send(`${fullNames[type]} are not enabled on this server! I shall exclude it from searching.`);
			return 'disabled'
		}
	}

	//then check if the type (value of keys) need to process jsons (the keys) first
	const jsonChecks = {
		character: ['teamcombos', 'character'],
		skillFile: ['preskill', 'evoskill', 'skill'],
		item: ['item'],
		weapon: ['weapon'],
		armor: ['armor'],
		enemie: ['pets', 'enemy'],
	}

	for (let key in jsonChecks) {
		if (jsonChecks[key].includes(type)) {
			if (key == 'skillFile') {
				if (!skillFile[variable]) {
					message.channel.send(`${variable} is not a valid skill!`);
					return false
				}
			} else {
				let file = setUpFile(`${dataPath}/json/${message.guild.id}/${key}s.json`);
				if (!file[variable]) {
					message.channel.send(`${variable} is not a valid ${key}!`);
					return false
				}
			}
		}
	}

	//and then check their real thing
	let userbased = ['user', 'leader']
	let channelbased = ['channel']
	let numberbased = ['cost', 'level', 'pow', 'acc', 'crit', 'hits', 'statuschance', 'money', 'melee', 'atk', 'mag', 'heal', 'healmp', 'healhpmp', 'revive', 'pacify', 'end', 'money', 'levellock', 'waves', 'notches']
	let limitbreak = ['limitbreaks']
	let arraybased = ['transformations', 'leaderskills', 'element', 'status', 'costtype', 'atktype', 'target', 'lock', 'extra', 'rarity', 'type']
	let affinitydependent = ['superweak', 'weak', 'resist', 'repel', 'block', 'drain']
	let jsonvariabledependent = ['pets']

	if (userbased.includes(type)) {
		variable = variable.toLowerCase();
		if (variable.startsWith('<@') && variable.endsWith('>')) {
			let user = message.guild.members.cache.find(m => m.id == variable.slice(2, -1));
			if (!user) {
				message.channel.send('Invalid user! Please enter a valid user.');
				return false
			}
		} else if (variable.startsWith('<@!') && variable.endsWith('>')) {
			let user = message.guild.members.cache.find(m => m.id == variable.slice(3, -1));
			if (!user) {
				message.channel.send('Invalid user! Please enter a valid user.');
				return false
			}
		}
		if (!variable.includes('@') && message.mentions.members.size == 0) {
			let user = message.guild.members.cache.find(m => m.id == variable);
			if (!user) {
				message.channel.send('Invalid user! Please enter a valid user.');
				return false
			}
		}
	}

	if (channelbased.includes(type)) {
		if (variable.startsWith('<#') && variable.endsWith('>')) {
			let channel = message.guild.channels.cache.find(c => c.id == variable.slice(2, -1));
			if (!channel) {
				message.channel.send('Invalid channel! Please enter a valid channel.');
				return false
			}
		} else if (variable.startsWith('<#!') && variable.endsWith('>')) {
			let channel = message.guild.channels.cache.find(c => c.id == variable.slice(3, -1));
			if (!channel) {
				message.channel.send('Invalid channel! Please enter a valid channel.');
				return false
			}
		} 
		if (!variable.includes('#') && message.mentions.channels.size == 0) {
			if (variable.match(/^[0-9]+$/)) {
				let channel = message.guild.channels.cache.find(c => c.id == variable);
				if (!channel) {
					message.channel.send('Invalid channel! Please enter a valid channel.');
					return false
				}
			} else {
				let channel = message.guild.channels.cache.find(c => c.name == variable);
				if (!channel) {
					message.channel.send('Invalid channel! Please enter a valid channel.');
					return false
				}
			}
		}
	}
	
	if (numberbased.includes(type)) {
		let otherWords = {
			levellock: ['unobtainable']
		}
		if (otherWords[type] && otherWords[type].includes(variable.toLowerCase())) return true

		if (isNaN(variable)) {
			message.channel.send('Invalid number! Please enter a valid number.');
			return false
		}
	}

	if (limitbreak.includes(type)) {
		if (!isNaN(variable)) {
			if (parseInt(variable) < 1 || parseInt(variable) > 4) {
				message.channel.send(`${variable} is not in the range of 1-4!`);
				return false
			}
		} else {
			variable = variable.toLowerCase()
			if (variable != 'atk' && variable != 'heal') {
				message.channel.send(`${variable} is not a valid limit break class! (atk/heal)`);
				return false
			}
		}
	}

	if (affinitydependent.includes(type)) {
		variable = variable.toLowerCase();
		if (!utilityFuncs.inArray(variable, Elements) && !utilityFuncs.inArray(variable, statusEffects)) {
			message.channel.send(`${variable} is not a valid status or element!`);
			return false
		}
		if (utilityFuncs.inArray(variable, statusEffects) && !settings.mechanics.stataffinities) {
			message.channel.send(`Status affinities are not enabled on this server! I shall exclude it from searching.`);
			return 'disabled'
		}
	}

	if (arraybased.includes(type)) {
		let acceptsNone = ['rarity', 'type']

		if (acceptsNone.includes(type) && variable.toLowerCase() == 'none') return true

		let arraysToCheck = {
			transformations: ['allydown', 'onlystanding', 'belowhalfhp', 'outofmp', 'leaderdown', 'trusteddown'],
			leaderskills: ['boost', 'discount', 'crit', 'status', 'buff', 'debuff', 'money', 'pacify', 'items', 'endure'],
			element: Elements,
			status: statusEffects,
			costtype: costTypes,
			atktype: ['physical', 'sorcery', 'magic', 'ranged'],
			target: Targets,
			lock: ['party', 'character', 'money', 'pet', 'item', 'weapon', 'armor', 'password', 'none'],
			extra: [...Object.keys(statusList), ...Object.keys(passiveList), ...Object.keys(healList), ...Object.keys(extrasList)],
			type: enemyTypes,
			rarity: itemRarities,
		}

		let appropriateNames = {
			transformations: 'tranformation',
			leaderskills: 'leader skill',
			status: 'status effect',
			costtype: 'cost type',
			atktype: 'attack type',
			type: 'enemy type',
		}

		variable = variable.toLowerCase();
		if (!utilityFuncs.inArray(variable, arraysToCheck[type])) {
			message.channel.send(`${variable} is not a valid ${appropriateNames[type] ?? type}!`);
			return false
		}
	}

	if (jsonvariabledependent.includes(type)) {
		let jsonsvariables = {
			pets: ['negotiationDefs'],
		}

		let jsons = {
			pets: enemies,
		}

		let propernames = {
			pets: 'negotiation defs',
		}

		let file = setUpFile(`${dataPath}/json/${message.guild.id}/${jsons[type]}.json`);
		if (!file[variable][jsonsvariables[type][0]] || (file[variable][jsonsvariables[type][0]] && Object.keys(file[variable][jsonsvariables[type][0]]).length == 0)) {
			message.channel.send(`${variable} does not have any ${propernames[type]}!`);
			return false
		}
	}

	return true
}

operators = ['+', '-', '*', '/'];
possibleMathFloats = ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '0.01', '0.02', '0.03', '0.04', '0.05', '0.06', '0.07', '0.08', '0.09', '0.15', '0.45', '0.25', '0.75', '0.125', '0.375', '0.625', '0.875', '0.001', '0.002', '0.003', '0.004', '0.005', '0.006', '0.007', '0.008', '0.009'];
superscriptDictionary = {'-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'};

nthroot = (x, nun) => {
    ng = nun % 2;
    if ((ng == 1) || x < 0) x = -x;
    var r = Math.pow(x, 1 / nun);
    nun = Math.pow(r, nun);

    if(Math.abs(x - nun) < 1 && (x > 0 === nun > 0)) return ng ? -r : r;
	return r;
}

// Export Functions
module.exports = {	
	inArray: function(val, arr) {
		for (const i in arr) {
			if (val === arr[i]) return true;
		}

		return false
	},
	
	cloneObj: function(source) {
		return objClone(source)
	},
	
	orderSkills: function() {
		let elementPoints = {}

		for (const element in Elements) {
			elementPoints[Elements[element]] = parseInt(element) + 1;
		}

		for (skill in skillFile) {
			let elementScore = 0;
			let powScore = 0;
			let accScore = 0;

			if (typeof skillFile[skill].type === 'string') {
				elementScore = elementPoints[skillFile[skill].type] ? parseInt(elementPoints[skillFile[skill].type])*100 : 0
			} else {
				for (const i in skillFile[skill].type) {
					if (i == 0) elementScore = elementPoints[skillFile[skill].type[i]] ? parseInt(elementPoints[skillFile[skill].type[i]])*100 : 0
					else elementScore += elementPoints[skillFile[skill].type[i]] ? parseInt(elementPoints[skillFile[skill].type[i]]) : 0
				}
			}

			powScore += skillFile[skill]?.pow ? Math.min(skillFile[skill].pow, 2000) : 0
			accScore += skillFile[skill]?.acc ? Math.min(skillFile[skill].acc, 100) : 0

			skillFile[skill].rating = (elementScore*10000 + powScore)*1000 + accScore;
		}
		
		//convert skillFile to an array, sort it, and then convert it back to an object
		let skillArray = []
		for (const skill in skillFile) {
			skillArray.push([skill, skillFile[skill]])
		}

		skillArray.sort(function(a, b) {
			return b[1].rating - a[1].rating
		})
		skillArray = skillArray.reverse();

		let skillObj = {}
		for (const skill in skillArray) {
			skillObj[skillArray[skill][0]] = skillArray[skill][1]
		}

		let directoryList = fs.readdirSync(`${dataPath}/json`).filter(file => !isNaN(file));
						
		for (directory in directoryList) {
			charFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/characters.json`);
			enemyFile = setUpFile(`${dataPath}/json/${directoryList[directory]}/enemies.json`);

			
			for (const char in charFile) {
				if (charFile[char].skills && charFile[char].skills.length) {
					charFile[char].skills = charFile[char].skills.filter(skill => skill in skillObj)
					charFile[char].skills.sort(function(a, b) {
						return skillObj[b].rating - skillObj[a].rating
					})
					charFile[char].skills.reverse()
					
					let mainElement = charFile[char].mainElement;

					if (typeof mainElement === "object") {
						charFile[char].skills.sort(function(a, b) {
							for (let k in mainElement) {
								if (skillObj[a].type.includes(mainElement[k])) return -1
								else if (skillObj[b].type.includes(mainElement[k])) return 1
								else return 0
							}
						})
					} else {
						charFile[char].skills.sort(function(a, b) {
							if (skillObj[a].type.includes(mainElement)) return -1
							else if (skillObj[b].type.includes(mainElement)) return 1
							else return 0
						})
					}
				}
			}
			fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/characters.json`, JSON.stringify(charFile))

			for (const enemy in enemyFile) {
				if (enemyFile[enemy].skills && enemyFile[enemy].skills.length) {
					enemyFile[enemy].skills = enemyFile[enemy].skills.filter(skill => skill in skillObj)
					enemyFile[enemy].skills.sort(function(a, b) {
						return skillObj[b].rating - skillObj[a].rating
					})
					enemyFile[enemy].skills.reverse()

					let mainElement = enemyFile[enemy].mainElement

					if (typeof mainElement === "object") {
						enemyFile[enemy].skills.sort(function(a, b) {
							for (let k in mainElement) {
								if (skillObj[a].type.includes(mainElement[k])) return -1
								else if (skillObj[b].type.includes(mainElement[k])) return 1
								else return 0
							}
						})
					} else {
						enemyFile[enemy].skills.sort(function(a, b) {
							if (skillObj[a].type.includes(mainElement)) return -1
							else if (skillObj[b].type.includes(mainElement)) return 1
							else return 0
						})
					}
				}
			}
			fs.writeFileSync(`${dataPath}/json/${directoryList[directory]}/enemies.json`, JSON.stringify(enemyFile))
		}

		for (skill in skillObj) {
			delete skillObj[skill].rating
		}

		console.log("Ordered skills.json.")
		fs.writeFileSync(dataPath+'/json/skills.json', JSON.stringify(skillObj, null, 2))
	},
	
	isBanned: function(id, server) {
		let settings = setUpSettings(server)
		return settings['banned'].includes(id)
	},
	
	AdminList: adminList,
	
	RPGBotAdmin: function(id) {
		return adminList.includes(id)	
	},

	isAdmin: function(message) {
		return message.member.permissions.serialize().ADMINISTRATOR || this.RPGBotAdmin(message.author.id)
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
		}
	},

	getChest: function(name, message) {
		var chestFile = setUpFile(`${dataPath}/json/${server}/chests.json`)

		for (const channelID in chestFile[message.guild.id]) {
			for (const chest in chestFile[message.guild.id][channelID]) {
				if (chestFile[message.guild.id][channelID][name]) return true;
			}
		}

		return false;
	},
	
	setDamageFormula: function(server, type) {
		let servFile = setUpFile(`${dataPath}/json/${server}/server.json`)

		switch(type.toLowerCase()) {
			case 'persona':
				servFile.damageFormula = 'persona'
			
			case 'pokemon':
			case 'pkmn':
				servFile.damageFormula = 'pkmn'
			
			default:
				servFile.damageFormula = 'custom'
		}
	}
}
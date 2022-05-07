const adminList = [
	'516359709779820544',
	'532291526634635285',
	'441198920668938260'
]

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
			elementPoints[Elements[element]] = parseInt(element) + 1
		}

		for (skill in skillFile) {
			if (typeof skillFile[skill].type === 'string') {
				skillFile[skill].rating = elementPoints[skillFile[skill].type] ? parseInt(elementPoints[skillFile[skill].type])*1000000000 : 0
			} else {
				for (const i in skillFile[skill].type) {
					if (i == 0) skillFile[skill].rating = elementPoints[skillFile[skill].type[i]] ? parseInt(elementPoints[skillFile[skill].type[i]])*1000000000 : 0
					else skillFile[skill].rating += elementPoints[skillFile[skill].type[i]] ? parseInt(elementPoints[skillFile[skill].type[i]])*10000000 : 0
				}
			}

			skillFile[skill].rating += skillFile[skill].pow ? skillFile[skill].pow*1000 : 0
			skillFile[skill].rating += skillFile[skill].acc ? skillFile[skill].acc : 0
		}
		
		//convert skillFile to an array, sort it, and then convert it back to an object
		let skillArray = []
		for (const skill in skillFile) {
			skillArray.push([skill, skillFile[skill]])
		}

		skillArray.sort(function(a, b) {
			return b[1].rating - a[1].rating
		})
		skillArray.reverse()

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
					
					let mainElement = charFile[char].mainElement

					charFile[char].skills.sort(function(a, b) {
						if (skillObj[a].type.includes(mainElement)) return -1
						else if (skillObj[b].type.includes(mainElement)) return 1
						else return 0
					})
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

					enemyFile[enemy].skills.sort(function(a, b) {
						if (skillObj[a].type.includes(mainElement)) return -1
						else if (skillObj[b].type.includes(mainElement)) return 1
						else return 0
					})
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
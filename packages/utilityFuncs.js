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
		let skillFile = setUpFile(`${dataPath}/json/skills.json`)
		
		// well let's make skills first
	},
	
	isBanned: function(id, server) {
		let servFile = setUpFile(`${dataPath}/json/${server}/server.json`)
		if (!servFile || !servFile.banned) return false;

		for (const i in servFile.banned) {
			if (id === servFile.banned) return true;
		}
		
		return false
	},
	
	AdminList: adminList,
	
	RPGBotAdmin: function(id) {
		for (const i in adminList) {
			if (id === adminList[i]) return true;
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
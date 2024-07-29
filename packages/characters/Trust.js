setUpTrust = (char, char2) => {
	if (!char.trust) char.trust = {};
	if (!char2.trust) char2.trust = {};

	let a = {
		amount: 0,
		maximum: 100,
		level: 1
	}

	if (!char.trust[char2.truename]) char.trust[char2.truename] = a;
	if (!char2.trust[char.truename]) char2.trust[char.truename] = a;

	return a;
}

trustEmojis = {
	'love': '❤️',
	'like': '👍',
	'neutral': '😐',
	'dislike': '👎',
	'hate': '🤬',

	'up': affinityEmoji['weak'],
	'down': affinityEmoji['resist'],
}

trustRanges = { //minumum to maximum trust levels
	'love': [15, 20],
	'like': [5, 14],
	'neutral': [-4, 4],
	'dislike': [-14, -5],
	'hate': [-20, -15]
}

changeTrust = (char, char2, i, send = true, btl, passiveCall, char1Name, char2Name, isMutual = true) => {
	if (char1Name) {
		char.truename = char1Name;
		char2.truename = char2Name;
	}
	setUpTrust(char, char2);

	let color = elementColors[char.mainElement] ?? elementColors.strike;

	if (typeof char.mainElement === "object") color = elementColors[char.mainElement[0]] ?? elementColors.strike;

	let trustDesc = ""

	let checkThrough = [char]
	if (isMutual) checkThrough.push(char2)

	for (c in checkThrough) {
		let chacha = checkThrough[c] == char ? char.trust[char2.truename] : char2.trust[char.truename]

		let detectedLevelUp = false;
		let previousLevel = chacha.level;

		if (typeof chacha.amount === "string") chacha.amount = 0;

		let xpGiven = parseFloat(i)

		if (passiveCall && doPassives(btl)) {
			let psv = null;
			for (let i in checkThrough[c].skills) {
				if (!skillFile[checkThrough[c].skills[i]]) continue;
				if (skillFile[checkThrough[c].skills[i]].type != 'passive') continue;
	
				psv = skillFile[checkThrough[c].skills[i]];
				for (let k in psv.passive) {
					if (passiveList[k] && k == 'attachment') {
						if (needCheck(checkThrough[c], checkThrough[c], psv, 'passive', 'skillbeforeuse', btl) !== true) continue;
						if (!needCheck(checkThrough[c], checkThrough[c], psv, 'passive', k, btl)) continue;
						
						for (ex in psv.passive[k]) {
							if ((((psv.passive[k][ex][0] && checkThrough[c] == char2) || (!psv.passive[k][ex][0] && checkThrough[c] == char)) || ['onwin', 'onfusionskill', 'onteamcombo'].includes(passiveCall)) && psv.passive[k][ex][1].includes(passiveCall)) xpGiven *= psv.passive[k][ex][2]/100
						}
					}
				}
			}
		}
		
		chacha.amount += Math.round(xpGiven);
		
		if (xpGiven == 0) continue

		if ((chacha.level == 20 && chacha.amount >= chacha.maximum) || (chacha.level == -20 && chacha.amount <= chacha.maximum)) {
			chacha.amount = chacha.maximum;
			continue;
		} else {
			if ((chacha.amount <= 0 && chacha.level >= 1) || (chacha.amount <= chacha.maximum && chacha.level < 1)) {
				while (((chacha.amount <= 0 && chacha.level >= 1) || (chacha.amount <= chacha.maximum && chacha.level < 1)) && Math.abs(chacha.level) > -20) {
					detectedLevelUp = true;
					
					previousLevel = chacha.level;
					chacha.level--;
					if (chacha.level == 0) chacha.level = -1;
	
					if (chacha.level >= -1) {
						if (previousLevel <= 1) chacha.amount -= Math.abs(chacha.maximum);
						chacha.maximum = (100+((Math.abs(chacha.level)-1)*15)) * (chacha.level > 0 ? 1 : -1);
						if (previousLevel > 1) chacha.amount += Math.abs(chacha.maximum);
					} else {
						if (previousLevel <= 1) chacha.amount += Math.abs(chacha.maximum);
						chacha.maximum = (100+((Math.abs(chacha.level)-1)*15)) * (chacha.level > 0 ? 1 : -1);
						if (previousLevel > 1) chacha.amount -= Math.abs(chacha.maximum);
					}
	
					if (chacha.level == -1) chacha.amount += Math.abs(chacha.maximum);
				}
			} else if ((chacha.amount >= chacha.maximum && chacha.level >= 0) || (chacha.amount >= 0 && chacha.level < 0)) {
				while (((chacha.amount >= chacha.maximum && chacha.level >= 0) || (chacha.amount >= 0 && chacha.level < 0)) && Math.abs(chacha.level) < 20) {
					detectedLevelUp = true;
					
					previousLevel = chacha.level;
					chacha.level++;
					if (chacha.level == 0) chacha.level = 1;
	
					if (chacha.level == 1) chacha.amount += Math.abs(chacha.maximum);
	
					if (chacha.level >= -1) {
						if (previousLevel >= -1) chacha.amount -= Math.abs(chacha.maximum);
						chacha.maximum = (100+((Math.abs(chacha.level)-1)*15)) * (chacha.level > 0 ? 1 : -1);
						if (previousLevel < -1) chacha.amount += Math.abs(chacha.maximum);
					} else {
						if (previousLevel >= -1) chacha.amount += Math.abs(chacha.maximum);
						chacha.maximum = (100+((Math.abs(chacha.level)-1)*15)) * (chacha.level > 0 ? 1 : -1);
						if (previousLevel < -1) chacha.amount -= Math.abs(chacha.maximum);
					}
				}
			}
		}
		if ((chacha.level == 20 && chacha.amount >= chacha.maximum) || (chacha.level == -20 && chacha.amount <= chacha.maximum)) {
			chacha.amount = chacha.maximum;
		}

		if (detectedLevelUp) {
			let trustemoji = [(xpGiven > 0 ? trustEmojis['up'] : trustEmojis['down'])];

			if (i > 0) trustemoji.push((chacha.level >= 15) ? trustEmojis['love'] : (chacha.level >= 5) ? trustEmojis['like'] : trustEmojis['neutral'])
			else trustemoji.push((chacha.level <= -15) ? trustEmojis['hate'] : (chacha.level <= -5) ? trustEmojis['dislike'] : trustEmojis['neutral'])

			trustDesc += `**LEVEL ${(xpGiven > 0 ? 'UP' : 'DOWN')}!**\n**${trustemoji.join("")} ${checkThrough[c] == char ? char.name : char2.name}** ${(xpGiven > 0 ? 'grows closer to' : 'draws away from')} **${checkThrough[c] == char ? char2.name : char.name}**, reaching _Trust Level __${chacha.level}___! ${trustemoji.reverse().join("")}`
			
			trustDesc += `\n${selectQuote(checkThrough[c], 'trust'+(chacha.level <= 0 ? ((chacha.level >= 15) ? 'love' : (chacha.level >= 5) ? 'like' : 'neutral') : ((chacha.level <= -15) ? 'hate' : (chacha.level <= -5) ? 'dislike' : 'neutral'))+((chacha.level >= -4 && chacha.level <= -1 ? 'neg' : (chacha.level >= 1 && chacha.level <= 4 ? 'pos' : '')))+`${Math.abs(chacha.level >= 20) ? 'max' : (parseInt(i) > 0 ? 'up' : 'down')}`, null, "%ALLY%", checkThrough[c] == char ? char2.name : char.name)}`
		} else {
			trustDesc += `${getBar((chacha.level > 0 ? 'angel' : 'devil'), chacha.amount, chacha.maximum)} ${chacha.amount}/${chacha.maximum}\n*${checkThrough[c] == char ? char.name : char2.name} got ${i} trust XP with ${checkThrough[c] == char ? char2.name : char.name}.*\n`;
		}

		trustDesc += '\n'
	}

	if (trustDesc == "") trustDesc = "*No trust change occured...*"

	return send ? void btl.channel.send({embeds: [new Discord.MessageEmbed().setColor(color).setTitle(`${char.name} & ${char2.name}`).setDescription(trustDesc)]}) : trustDesc;
}

trustLevel = (char, char2) => {
	if (!char.trust) return 0;
	if (!char.trust[char2.truename ?? char2.name]) return 0;
	return char.trust[char2.truename ?? char2.name].level;
}

trustBio = async (char, channel, author) => {
	let trust = char.trust;

	//sort it based on trust level and value
	//the higher the trust level
	let sortedTrust = Object.keys(trust).sort((a, b) => {
		return (trust[b].level*100000 + ((trust[b]?.amount ?? trust[b].value) / (trust[b]?.maximum ?? trust[b].nextLevel))) - (trust[a].level*100000 + ((trust[a]?.amount ?? trust[a].value) / (trust[a]?.maximum ?? trust[a].nextLevel)));
	}).map(key => {
		return {
			name: key,
			level: trust[key].level,
			amount: trust[key].amount ?? trust[key].value,
			maximum: trust[key].maximum ?? trust[key].nextLevel
		}
	})
	
	//split it into groups depending on trustRanges
	let trustGroups = {};
	for (let i = 0; i < sortedTrust.length; i++) {
		let trust = sortedTrust[i];
		for (let j = 0; j < Object.keys(trustRanges).length; j++) {
			let range = trustRanges[Object.keys(trustRanges)[j]];
			if (trust.level >= range[0] && trust.level <= range[1]) {
				if (!trustGroups[Object.keys(trustRanges)[j]]) trustGroups[Object.keys(trustRanges)[j]] = [];
				trustGroups[Object.keys(trustRanges)[j]].push(trust);
			}
		}
	}

	//now rearrange all entries of each group into text
	let bar;
	for (i in trustGroups) {
		for (l in trustGroups[i]) {
			bar = trustGroups[i][l].level > 0 ? 'angel' : 'devil';
			trustGroups[i][l] = `**${trustGroups[i][l].name}** (lv ${trustGroups[i][l].level})      ${getBar(bar, trustGroups[i][l].amount, trustGroups[i][l].maximum)} ${trustGroups[i][l].amount}/${trustGroups[i][l].maximum}`;
		}

		//split it into chunks of 10
		let chunks = [];
		for (let l = 0; l < trustGroups[i].length; l += 10) {
			chunks.push(trustGroups[i].slice(l, l+10));
		}
		trustGroups[i] = chunks;
	}

	//now create the embed with buttons
	let index = 0;
	let currentCategory = 0;

	let prefix = charPrefix(char);
	let color = charColor(char);

	const generateEmbed = async => {
		const current = trustGroups[Object.keys(trustGroups)[currentCategory]][index];
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor(color)
			.setTitle(`${prefix}__${char.name}__'s Trust`)
			.setDescription(`**${trustEmojis[Object.keys(trustGroups)[currentCategory]]} ${Object.keys(trustGroups)[currentCategory]} (lv ${trustRanges[Object.keys(trustGroups)[currentCategory]][0]} - ${trustRanges[Object.keys(trustGroups)[currentCategory]][1]})**:\n\n${current.join('\n')}`);

		return DiscordEmbed;
	}

	//check if it has more than one category, or more than one chunk
	let canFit = (Object.keys(trustGroups).length == 1 && trustGroups[Object.keys(trustGroups)[0]].length == 1)
	let embedMessage;

	if (canFit) {
		embedMessage = await channel.send({embeds: [await generateEmbed()]});
		return;
	}
	
	embedMessage = await channel.send({
		embeds: [await generateEmbed()],
		components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
	});

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == author
	});

	collector.on('collect', async interaction => {
		if (interaction.component.customId == 'cancel') {
			collector.stop()
			await interaction.update({
			embeds: [await generateEmbed()],
			components: []
			})
		} else {
			if (interaction.customId === 'back') {
				if (index == 0) {
					currentCategory--;
					if (currentCategory < 0) currentCategory = Object.keys(trustGroups).length - 1;
					index = trustGroups[Object.keys(trustGroups)[currentCategory]].length - 1;
				} else {
					index--;
				}
			} else if (interaction.customId === 'forward') {
				if (index == trustGroups[Object.keys(trustGroups)[currentCategory]].length - 1) {
					currentCategory++;
					if (currentCategory >= Object.keys(trustGroups).length) currentCategory = 0;
					index = 0;
				} else {
					index++;
				}
			}

			await interaction.update({
				embeds: [await generateEmbed()],
				components: [
					new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
				]
			})
		}
	});
}
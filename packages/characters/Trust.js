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
	'Loves': '❤️',
	'Likes': '👍',
	'Is neutral to': '😐',
	'Dislikes': '👎',
	'Hates': '🤬',

	'Raising': '😐',
	'Lowering': '😔',
}

trustRanges = { //minumum to maximum trust levels
	'Loves': [15, 20],
	'Likes': [5, 14],
	'Is neutral to': [-4, 4],
	'Dislikes': [-14, -5],
	'Hates': [-20, -15]
}

changeTrust = (char, char2, i, send, channel, char1Name, char2Name) => {
	if (char1Name) {
		char.truename = char1Name;
		char2.truename = char2Name;
	}
	setUpTrust(char, char2);

	let prefix = elementEmoji[char.mainElement] ?? elementEmoji.strike;
	let color = elementColors[char.mainElement] ?? elementColors.strike;

	if (typeof char.mainElement === "object") {
		prefix = "";
		for (let i in char.mainElement)
			prefix += elementEmoji[char.mainElement[i]] ?? elementEmoji.strike;

		color = elementColors[char.mainElement[0]] ?? elementColors.strike;
	}

	let detectedLevelUp = false;
	let previousLevel = char.trust[char2.truename].level;

	if (typeof char.trust[char2.truename].amount === "string") char.trust[char2.truename].amount = 0;
	char.trust[char2.truename].amount += parseInt(i);

	if ((char.trust[char2.truename].level == 20 && char.trust[char2.truename].amount >= char.trust[char2.truename].maximum) || (char.trust[char2.truename].level == -20 && char.trust[char2.truename].amount <= char.trust[char2.truename].maximum)) {
		char.trust[char2.truename].amount = char.trust[char2.truename].maximum;
	} else {
		if ((char.trust[char2.truename].amount <= 0 && char.trust[char2.truename].level >= 1) || (char.trust[char2.truename].amount <= char.trust[char2.truename].maximum && char.trust[char2.truename].level < 1)) {
			while (((char.trust[char2.truename].amount <= 0 && char.trust[char2.truename].level >= 1) || (char.trust[char2.truename].amount <= char.trust[char2.truename].maximum && char.trust[char2.truename].level < 1)) && Math.abs(char.trust[char2.truename].level) > -20) {
				detectedLevelUp = true;
				
				previousLevel = char.trust[char2.truename].level;
				char.trust[char2.truename].level--;
				if (char.trust[char2.truename].level == 0) char.trust[char2.truename].level = -1;

				if (char.trust[char2.truename].level >= -1) {
					if (previousLevel <= 1) char.trust[char2.truename].amount -= Math.abs(char.trust[char2.truename].maximum);
					char.trust[char2.truename].maximum = (100+((Math.abs(char.trust[char2.truename].level)-1)*15)) * (char.trust[char2.truename].level > 0 ? 1 : -1);
					if (previousLevel > 1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);
				} else {
					if (previousLevel <= 1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);
					char.trust[char2.truename].maximum = (100+((Math.abs(char.trust[char2.truename].level)-1)*15)) * (char.trust[char2.truename].level > 0 ? 1 : -1);
					if (previousLevel > 1) char.trust[char2.truename].amount -= Math.abs(char.trust[char2.truename].maximum);
				}

				if (char.trust[char2.truename].level == -1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);
			}
		} else if ((char.trust[char2.truename].amount >= char.trust[char2.truename].maximum && char.trust[char2.truename].level >= 0) || (char.trust[char2.truename].amount >= 0 && char.trust[char2.truename].level < 0)) {
			while (((char.trust[char2.truename].amount >= char.trust[char2.truename].maximum && char.trust[char2.truename].level >= 0) || (char.trust[char2.truename].amount >= 0 && char.trust[char2.truename].level < 0)) && Math.abs(char.trust[char2.truename].level) < 20) {
				detectedLevelUp = true;
				
				previousLevel = char.trust[char2.truename].level;
				char.trust[char2.truename].level++;
				if (char.trust[char2.truename].level == 0) char.trust[char2.truename].level = 1;

				if (char.trust[char2.truename].level == 1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);

				if (char.trust[char2.truename].level >= -1) {
					if (previousLevel >= -1) char.trust[char2.truename].amount -= Math.abs(char.trust[char2.truename].maximum);
					char.trust[char2.truename].maximum = (100+((Math.abs(char.trust[char2.truename].level)-1)*15)) * (char.trust[char2.truename].level > 0 ? 1 : -1);
					if (previousLevel < -1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);
				} else {
					if (previousLevel >= -1) char.trust[char2.truename].amount += Math.abs(char.trust[char2.truename].maximum);
					char.trust[char2.truename].maximum = (100+((Math.abs(char.trust[char2.truename].level)-1)*15)) * (char.trust[char2.truename].level > 0 ? 1 : -1);
					if (previousLevel < -1) char.trust[char2.truename].amount -= Math.abs(char.trust[char2.truename].maximum);
				}
			}
		}
	}
	if ((char.trust[char2.truename].level == 20 && char.trust[char2.truename].amount >= char.trust[char2.truename].maximum) || (char.trust[char2.truename].level == -20 && char.trust[char2.truename].amount <= char.trust[char2.truename].maximum)) {
		char.trust[char2.truename].amount = char.trust[char2.truename].maximum;
	}

	char2.trust[char.truename] = { //this is for consistency's sake
		amount: char.trust[char2.truename].amount,
		maximum: char.trust[char2.truename].maximum,
		level: char.trust[char2.truename].level
	}

	let trustemoji;
	if (detectedLevelUp) {
		if (i > 0) {
			trustemoji = (char.trust[char2.truename].level >= 15) ? trustEmojis['Loves'] : (char.trust[char2.truename].level >= 5) ? trustEmojis['Likes'] : trustEmojis['Is neutral to'];
			if (char.trust[char2.truename].level < 0) trustemoji = trustEmojis['Raising'];
			
			if (send) {
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle(`${trustemoji} ${char.name} & ${char2.name} grow closer... ${trustemoji}`)
					.setDescription(`${char.name} & ${char2.name} reached _Trust Level __${char.trust[char2.truename].level}___!`)
				return void channel.send({embeds: [DiscordEmbed]});
			} else {
				return `\n${trustemoji} ${char.name} & ${char2.name} grow closer, reaching _Trust Level __${char.trust[char2.truename].level}___! ${trustemoji}`;
			}
		} else {
			trustemoji = (char.trust[char2.truename].level <= -15) ? trustEmojis['Hates'] : (char.trust[char2.truename].level <= -5) ? trustEmojis['Dislikes'] : trustEmojis['Is neutral to'];
			if (char.trust[char2.truename].level > 0) trustemoji = trustEmojis['Lowering'];

			if (send) {
				let DiscordEmbed = new Discord.MessageEmbed()
					.setColor(color)
					.setTitle(`${trustemoji} ${char.name} & ${char2.name} draw farther away... ${trustemoji}`)
					.setDescription(`${char.name} & ${char2.name} reached _Trust Level __${char.trust[char2.truename].level}___!`)
				return void channel.send({embeds: [DiscordEmbed]});
			} else {
				return `\n${trustemoji} ${char.name} & ${char2.name} draw farther away, reaching _Trust Level __${char.trust[char2.truename].level}___! ${trustemoji}`;
			}
		}
	} else {
		if (send) {
			let bar = char.trust[char2.truename].level > 0 ? 'angel' : 'devil';
			return void channel.send(`${getBar(bar, char.trust[char2.truename].amount, char.trust[char2.truename].maximum)} ${char.trust[char2.truename].amount}/${char.trust[char2.truename].maximum}\n*${char.name} got ${i} trust XP with ${char2.name}.*`);
		}
	}

	return send ? undefined : '';
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
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

changeTrust = (char, char2, i, send, channel) => {
	setUpTrust(char, char2);

	char.trust[char2.truename].amount += i;

	if (char.trust[char2.truename].amount >= char.trust[char2.truename].maximum) {
		char.trust[char2.truename].level++;
		char.trust[char2.truename].maximum = 100+((char.trust[char2.truename].level-1)*15);

		let trustemoji = (char.trust[char2.truename].level >= 10) ? '❤️' : '✨';

		if (send) {
			let DiscordEmbed = new Discord.MessageEmbed()
				.setColor(elementColors[char.mainElement] ?? elementColors.strike)
				.setTitle(`${trustemoji} ${char.name} & ${char2.name} grow closer... ${trustemoji}`)
				.setDescription(`${char.name} & ${char2.name} reached _Trust Level __${char.trust[char2.truename].level}___!`)
			return void channel.send({embeds: [DiscordEmbed]});
		} else {
			return `\n${trustemoji} ${char.name} & ${char2.name} grow closer, reaching _Trust Level __${char.trust[char2.truename].level}___! ${trustemoji}`;
		}
	}

	return send ? undefined : '';
}

trustLevel = (char, char2) => {
	if (!char.trust) return 0;
	if (!char.trust[char2.truename ?? char2.name]) return 0;
	return char.trust[char2.truename ?? char2.name].level;
}
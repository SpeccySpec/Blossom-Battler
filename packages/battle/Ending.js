pvpWin = (btl, i) => {
	btl.channel.send(`**[DEBUG]**\nTeam #${i} won`);
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

loseBattle = (btl, i) => {
	btl.channel.send('**[DEBUG]**\nEnemy team won');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

winBattle = (btl, i) => {
	let settings = setUpSettings(btl.guild.id);
	let embedtxt = "**[BATTLE COMPLETE!]**\n"

	// How did we win this battle. Were we murderers or friends :)
	let pacified = `Team ${btl.teams[i].name} defeated the enemies!`;
	let pacifycount = 0;
	let maxcount = 0;
	
	let intendedxp = 0; // psst lets sneak xp in here too
	for (let k in btl.teams) {
		if (k == i) continue;
		for (let char of btl.teams[k].members) {
			if (char.pacified) pacifycount++;
			maxcount++;

			if (char.xp) {
				let xp = char.xp
				if (char.golden) xp *= 2.5;

				intendedxp += Math.round(xp);
			}
		}
	}

	if (pacifycount >= maxcount)
		pacified = `Team ${btl.teams[i].name} befriended the enemies!`;
	else if (pacifycount > 0)
		pacified = `Team ${btl.teams[i].name} pacified _some_ of the enemies... and defeated the rest!`;

	embedtxt += pacified;

	// Now let's talk about XP.
	let enemyxp = intendedxp;

	// XP reduced for pacifying
	if (pacifycount >= maxcount) enemyxp = Math.round(enemyxp*0.6);

	// Inteligence added to XP
	for (let char of btl.teams[i].members) enemyxp += char.stats.int;

	// XP Rate
	enemyxp = Math.round(enemyxp*(settings.rates.xprate ?? 1));

	// Alright, let's award XP!
	let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`);

	for (let char of btl.teams[i].members) {
		if (charFile[char.truename]) {
			gainXp(btl.channel, charFile[char.truename], enemyxp, true);
			charFile[char.truename].hp = Math.min(charFile[char.truename].maxhp, char.hp);
			charFile[char.truename].mp = Math.min(charFile[char.truename].maxmp, char.mp);

			// While I'm here... why don't I sort out Trust!
			if (!char.trust) char.trust = {};

			for (let char2 of btl.teams[i].members) {
				if (char2.id  == char.id) continue;
				embedtxt += `\n{changeTrust(char, char2, Math.round(35*settings.rates.trustrate), false)}`;
				charFile[char.truename].trust = char.trust;
				charFile[char2.truename].trust = char2.trust;
			}
		}
	}

	// Loot
	// (unfinished)
	let items = {};
	

	// Save character shit.
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[btl.teams[i].members[0].mainElement] ?? elementColors.strike)
		.setTitle("__Battle Results__")
		.setDescription(embedtxt)
	btl.channel.send({embeds: [DiscordEmbed]})

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

runFromBattle = (char, btl) => {
	btl.channel.send('**[DEBUG]**\nRan from Battle :/');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}
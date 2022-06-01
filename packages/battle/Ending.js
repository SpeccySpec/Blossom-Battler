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

	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor(elementColors[btl.teams[i].members[0].mainElement] ?? elementColors.strike)
		.setTitle("Well done!")
		.setDescription(embedtxt)

	// Now let's talk about XP.
	let enemyxp = intendedxp;

	// XP reduced for pacifying
	if (pacifycount >= maxcount) enemyxp = Math.round(enemyxp*0.6);

	// Inteligence added to XP
	for (let char of btl.teams[i].members) enemyxp += char.stats.int;

	// XP Rate
	enemyxp = Math.round(enemyxp*(settings.rates.xprate ?? 1));

	// Alright, let's award XP!
	btl.channel.send({embeds: [DiscordEmbed]}).then(message => {
		let charFile = setUpFile(`${dataPath}/json/${btl.guild.id}/characters.json`);
	
		for (let char of btl.teams[i].members) {
			if (charFile[char.truename]) {
				gainXp(message, charFile[char.truename], enemyxp, true);
				charFile[char.truename].hp = Math.min(charFile[char.truename].maxhp, char.hp);
				charFile[char.truename].mp = Math.min(charFile[char.truename].maxmp, char.mp);
			}
		}

		// We'll uh... do the rest in here for async reasons.

		// Loot
		// (unfinished)

		// Trust
		// (unfinished)
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/characters.json`, JSON.stringify(charFile, null, '    '));
	})

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}

runFromBattle = (char, btl) => {
	btl.channel.send('**[DEBUG]**\nRan from Battle :/');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
}
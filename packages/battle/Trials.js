saveTrial = (btl) => {
	makeDirectory(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}`);
	let save = setUpFile(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}/save-${btl.teams[0].name.toLowerCase()}.json`);

	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
	fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/${btl.trial.name}/save-${btl.teams[0].name.toLowerCase()}.json`, JSON.stringify(btl, null, '    '));
	btl = {};
}

nextWave = (btl) => {
	let DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#cc3b69')
		.setTitle(`Wave #${btl.trialwave+1} completed!`)

	if (!btl.trial.waves[btl.trialwave+1]) {
		let str = `Team **${btl.teams[0].name}** is _victorious_ in the trial of **${btl.trial.name}**!`;

		if (btl.trial.stars) {
			str += `\n**All participants earned __${btl.trial.stars}<:golden:973077051751940138>__!**`;
		}

		if (!btl.trial.online) {
			let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`, true);

			if (trials[btl.trial.id]) {
				trials[btl.trial.id].verified = true;
				str += "\n_The trial is now been verified! Why not try uploading it with ''rpg!uploadtrial''?_";
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trials, null, 4));
			}
		}

		DiscordEmbed.setDescription(str);
		btl.channel.send({embeds: [DiscordEmbed]});

		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
		btl = {};
	} else {
		btl.trialwave++;

		let enmFile = btl.trial.enemydata ?? setUpFile(`${dataPath}/json/${btl.guild.id}/enemies.json`, true);

		btl.teams[1].members = [];
		btl.teams[1].backup = [];

		let encounter = btl.trial.waves[btl.trialwave];
		let battleid = (btl.teams[0].members.length+btl.teams[0].backup.length)-1;
		let bosswave = false;

		for (let i in encounter) {
			let enemy = objClone(enmFile[encounter[i]]);
			enemy.enemy = true;

			enemy.truename = encounter[i];
			if (!enemy.name) enemy.name = encounter[i];
			enemy.maxhp = enemy.hp;
			enemy.maxmp = enemy.mp;
			enemy.id = battleid;
			battleid++;

			// For enemy ai
			enemy.memory = {};

			// Pacifying
			enemy.pacify = 0;

			// Boss Wave txt
			if (enemy.type.includes('boss') || enemy.type.includes('deity')) bosswave = true;
			
			// Just to be sure...
			enemy.team = 1;
			enemy.pos = i;

			setupBattleStats(enemy);
			enemy.team = 1;
			if (btl.teams[1].members.length < 4) {
				if (i <= 0 && enemy.leaderskill) {
					enemy.leader = true;
					btl.teams[1].leaderskill = enemy.leaderskill;
				}

				btl.teams[1].members.push(enemy);
			} else {
				btl.teams[1].backup.push(enemy);
			}
		}

		let txt = `The Enemies were defeated!\nThe next wave, **Wave #${btl.trialwave+1}**, aproaches!`;
		if (bosswave) txt += "\nDanger lurks ahead... Good luck.";

		DiscordEmbed.setDescription(txt);
		btl.channel.send({embeds: [DiscordEmbed]});

		btl.turnorder = getTurnOrder(btl);
		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, JSON.stringify(btl, null, '    '));
		setTimeout(function() {
			advanceTurn(btl)
        }, 500)
	}
}
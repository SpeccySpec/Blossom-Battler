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
			let trials = setUpFile(`${dataPath}/json/${btl.guild.id}/trials.json`, true);

			if (trials[btl.trial.id]) {
				let verifiedchars = true;
				for (let char of btl.teams[0].members) {
					if (!verifiedChar(char)) verifiedchars = false;
				}
				for (let char of btl.teams[0].backup) {
					if (!verifiedChar(char)) verifiedchars = false;
				}

				if (verifiedchars) {
					trials[btl.trial.id].verified = true;
					str += "\n_The trial is now been verified! Why not try uploading it with ''rpg!uploadtrial''?_";
					fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/trials.json`, JSON.stringify(trials, null, 4));
				} else {
					str += "\n_To verify this trial, use only verified characters!_";
				}
			}
		} else {
			let gtrials = setUpFile(`${dataPath}/json/globaltrials.json`, true);
			if (btl.trial.onlineid && gtrials[btl.trial.onlineid]) {
				gtrials[btl.trial.onlineid].completions++;
				fs.writeFileSync(`${dataPath}/json/globaltrials.json`, JSON.stringify(gtrials, null, 4));
				str += "\n_Documented your completion online!_";
			}
		}

		DiscordEmbed.setDescription(str);
		btl.channel.send({embeds: [DiscordEmbed]});

		fs.writeFileSync(`${dataPath}/json/${btl.guild.id}/${btl.channel.id}/battle.json`, '{}');
		btl = {};
	} else {
		btl.trialwave++;

		btl.teams[1].members = [];
		btl.teams[1].backup = [];

		let enmFile = (btl.trial?.enemydata && btl.trial?.enemydata.length > 0) ? btl.trial.enemydata : setUpFile(`${dataPath}/json/${btl.guild.id}/enemies.json`, true);

		let encounter = btl.trial.waves[btl.trialwave];
		let battleid = btl.teams[0].members.length+btl.teams[0].backup.length;
		let bosswave = false;

		for (let i in encounter) {
			if (!enmFile[encounter[i]]) {
				btl.channel.send(`There was something wrong with this trial! ${encounter[i]} does not exist.`);
				continue;
			}

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

////////////////////////////
// LIST ALL GLOBAL TRIALS //
////////////////////////////
listGlobalTrials = async(channel, theArray, author, forceIndex) => {
	let index = forceIndex ?? 10;

	let ae;
	const generateEmbed = async start => {
		const current = theArray.slice(start, start + index);

		let opts = []
		for (let arrayDefs of current) {
			let l = arrayDefs.trialdata?.name ?? 'No Name Provided'
			let d = arrayDefs.trialdata?.desc ?? 'No Description Provided'

			opts.push({
				label: l,
				description: d,
				value: arrayDefs.id.toString() ?? '0'
			})
		}

		ae = new Discord.MessageSelectMenu({
			placeholder: "Choose a global trial to play.",
			customId: 'trialsel',
			maxValues: 1,
			options: opts
		})

		return new Discord.MessageEmbed({
			title: `Showing results ${start + 1}-${start + current.length} out of ${theArray.length}`,
			fields: await Promise.all(
				current.map(async arrayDefs => ({
					name: arrayDefs.display.title,
					value: arrayDefs.display.desc,
					inline: arrayDefs.display.inline ?? false
				}))
			)
		})
	}

	let embedMessage = await channel.send({
		embeds: [await generateEmbed(0)],
		components: [
			new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
			new Discord.MessageActionRow({components: [ae]})
		]
	})

	const collector = embedMessage.createMessageComponentCollector({
		filter: ({user}) => user.id == author
	})

	let currentIndex = 0;
	let gtrials = setUpFile(`${dataPath}/json/globaltrials.json`, true);
	collector.on('collect', async interaction => {
		if (interaction.component.customId == 'trialsel') {
			if (!interaction.isSelectMenu()) return;
			channel.send(`Please enter a party to play the trial of ${gtrials[interaction.values[0]].name ?? '???'} with!`);

			var trialCollect = channel.createMessageCollector({ time: 15000 })
			trialCollect.on('collect', tInteract => {
				if (tInteract.author.id == author) {
					try {
						let party = tInteract.content;
						let parties = setUpFile(`${dataPath}/json/${channel.guild.id}/parties.json`);

						if (parties[party] && isPartyLeader(tInteract.author, parties[party], channel.guild.id)) {
							if (!gtrials[interaction.values[0]]) {
								channel.send('Something went wrong...! Please try again in a moment!');
								trialCollect.stop();
							} else {
								// Increment the play counter.
								gtrials[interaction.values[0]].online.plays++;
								fs.writeFileSync(`${dataPath}/json/globaltrials.json`, JSON.stringify(gtrials, null, 4));

								// Begin this global trial.
								beginGlobalTrial(gtrials[interaction.values[0]], interaction.values[0], parties[party], party, channel);
								trialCollect.stop();
							}
						}
					} catch (err) {
						console.log(err);
						channel.send('Please enter a valid party.');
						trialCollect.stop();
					}
				}
			})
		} else if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
			if (interaction.customId === 'back') {
				if (currentIndex - index < 0) {
					currentIndex = theArray.length - ((theArray.length % index != 0) ? theArray.length % index : index)
				} else {
					currentIndex -= index
				}
			} else if (interaction.customId === 'forward') {
				if (currentIndex + index >= theArray.length) {
					currentIndex = 0
				} else {
					currentIndex += index
				}
			}

			await interaction.update({
				embeds: [await generateEmbed(currentIndex)],
				components: [
					new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
					new Discord.MessageActionRow({components: [ae]})
				]
			})
		} else if (interaction.component.customId === 'page') {
			channel.send(`Please enter the page number you want to go to.`)
			const pageCollector = channel.createMessageCollector({
				time: 3000
			})

			await new Promise((resolve, reject) => {
				pageCollector.on('collect', async pageInteraction => {
					if (pageInteraction.author.id == author) {
						try {
							const page = parseInt(pageInteraction.content) - 1
							if (page > -1 && page <= Math.floor(theArray.length / index)) {
								currentIndex = page * index
								await interaction.update({
									embeds: [await generateEmbed(currentIndex)],
									components: [
										new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
										new Discord.MessageActionRow({components: [ae]})
									]
								})
								pageCollector.stop()
								resolve()
							} else {
								channel.send(`Please enter a valid page number.`)
								pageCollector.stop()
								resolve()
							}
						} catch (err) {
							channel.send('Please enter a valid page number.')
							pageCollector.stop()
							resolve()
						}
					}
				})
			})
		} else {
			collector.stop()
			await interaction.update({
				embeds: [await generateEmbed(currentIndex)],
				components: []
			})
		}
	})
}

//////////////////////////
// BEGIN A GLOBAL TRIAL //
//////////////////////////
beginGlobalTrial = (trial, trialid, party, partyid, channel) => {
	if (forceEndBattles[`${channel.guild.id}-${channel.id}`]) forceEndBattles[`${channel.guild.id}-${channel.id}`] = false;

	let settings = trial.forcesettings ?? setUpSettings(channel.guild.id);

	// Set up Battle Field
	let battle = {
		battling: true,
		channel: channel, // so i dont have to do it later
		guild: channel.guild, // so i dont have to do it later

		turn: 0,
//		curturn: -1,
		turnorder: [],

		trialwave: 0,

//		weather: 'none',
//		terrain: 'none',
		effects: {},

		teams: [
			{
				name: "",
				id: "",
				members: [],
				backup: [],
				items: {},
				pets: {},
			},
			{
				name: "Enemies",
				id: 'enemies',
				enemyteam: true,
				forcehorde: true, // more than 4 enemies mean some will be put into backup and automatically switched in, either by the team leader, or once an enemy dies.
				members: [],
				backup: [],
				items: {},
				pets: {},
			}
		],

		forcesettings: settings
	}

	// Battle File!
	makeDirectory(`${dataPath}/json/${channel.guild.id}/${channel.id}`);

	let btl = setUpFile(`${dataPath}/json/${channel.guild.id}/${channel.id}/battle.json`, true);
	let charFile = setUpFile(`${dataPath}/json/${channel.guild.id}/characters.json`, true);
	let enmFile = setUpFile(`${dataPath}/json/${channel.guild.id}/enemies.json`, true);
	let trials = setUpFile(`${dataPath}/json/${channel.guild.id}/trials.json`, true);

	// Can't battle while another party is!
	if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

	// Save this for errors!
	if (!battleFiles) battleFiles = [];
	if (!battleFiles.includes(`${dataPath}/json/${channel.guild.id}/${channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${channel.guild.id}/${channel.id}/battle.json`);

	// Set up Ally Side.
	let battleid = 0;
	let levellock = trial.levellock ?? 0;
	let levelcap = trial.forcesettings.levelcap;

	if (!party.discoveries) party.discoveries = {};

	for (const i in party.members) {
		if (!charFile[party.members[i]]) continue;

		let char = objClone(charFile[party.members[i]]);

		// Level Lock
		if (char.level < levellock) return channel.send(`${char.name} is not strong enough to attmept this trial! They must be level ${levellock} to do this trial.`);

		// Level Cap
		if (char.level > levelcap) {
			channel.send(`This trial has a level cap of ${levelcap}! For this trial, we will force ${char.name} to that level.`);

			char.level = levelcap;
			updateStats(char, channel.guild.id, true);

			//check every skill. if skill exists, check its level lock. If level lock is lower, set it to '', and then filter later
			for (let skill in char.skills) {
				if (skillFile[char.skills[skill]].levelLock > levelcap) char.skills[skill] = '';
			}
			char.skills = char.skills.filter(skill => skill != '');
			char.xp = 0;
		}

		char.truename = party.members[i];
		if (!char.name) char.name = party.members[i];

		char.id = battleid;
		battleid++;

		setupBattleStats(char);

		if (i <= 0) {
			char.leader = true;
			battle.teams[0].leaderskill = char.leaderskill;
		}

		char.team = 0;
		battle.teams[0].members.push(char);
	}

	for (const i in party.backup) {
		if (!charFile[party.backup[i]]) continue;

		let char = objClone(charFile[party.backup[i]]);
		if (!char.name) char.name = party.backup[i];

		// Level Lock
		if (char.level < levellock) return message.channel.send(`${char.name} (who is in backup) is not strong enough to attmept this trial! They must be level ${levellock} to do this trial.`);

		// Level Cap
		if (char.level > levelcap) {
			channel.send(`This trial has a level cap of ${levelcap}! For this trial, we will force ${char.name} (who is in backup) to that level.`);

			char.level = levelcap;
			updateStats(char, channel.guild.id, true);

			//check every skill. if skill exists, check its level lock. If level lock is lower, set it to '', and then filter later
			for (let skill in char.skills) {
				if (skillFile[char.skills[skill]].levelLock > levelcap) char.skills[skill] = '';
			}
			char.skills = char.skills.filter(skill => skill != '');
			char.xp = 0;
		}

		char.truename = party.backup[i];
		char.id = battleid;
		battleid++;

		setupBattleStats(char);

		char.team = 0;
		battle.teams[0].backup.push(char);
	}

	battle.teams[0].name = party.name;
	battle.teams[0].pets = objClone(party.negotiateAllies);
	battle.teams[0].id = partyid;

	// Set up Enemy Side, This will be the first wave of the colosseum.
	// == this time, no encounters set until the enemy is killed or pacified == //
	let encounter = trial.waves[0];

	battle.trial = trial;
	battle.trial.id = trialid;
	battle.onlineid = trialid;

	let enmDesc = '';
	for (let i in encounter) {
		let enemy = objClone(trial.enemydata[encounter[i]]);
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

		setupBattleStats(enemy);

		enmDesc += `${enemy.name} (LV${enemy.level})\n`;

		enemy.team = 1;
		if (battle.teams[1].members.length < 4) {
			if (i <= 0 && enemy.leaderskill) {
				enemy.leader = true;
				battle.teams[1].leaderskill = enemy.leaderskill;
			}

			battle.teams[1].members.push(enemy);
		} else
			battle.teams[1].backup.push(enemy);
	}

	funcsAtBattleStart(battle);
	if (settings?.mechanics?.leaderskills) battle = leaderSkillsAtBattleStart(battle);

	// turn order :)
	battle.turnorder = getTurnOrder(battle);

	// Save all this data to a file.
	fs.writeFileSync(`${dataPath}/json/${channel.guild.id}/${channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

	channel.send(`Team ${party.name} have challenged the **${trial.name}** Trial! Good Luck!`);
	setTimeout(function() {
		advanceTurn(battle)
	}, 1000)
}
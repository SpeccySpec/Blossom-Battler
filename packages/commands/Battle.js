commands.guide = new Command({
	desc: "How do battles work here you ask? Well you've come to the right place! Read this guide to get all the know-hows about battling.",
	section: "battle",
	aliases: ["battleguide", "battleguide"],
	args: [{
		name: "Page Number",
		type: "Num",
		forced: true
	}],
	func(message, args, guilded) {
		let pageNum = parseInt(args[0])
		
		let guidePath = `${dataPath}/guide.json`
		let guideRead = fs.readFileSync(guidePath, {flag: 'as+'});
		let guide = JSON.parse(guideRead);

		if (!guide[pageNum]) pageNum = 0;

		if (guide[pageNum]) {
			const guideTxt = guide[pageNum]
			const DiscordEmbed = new Discord.MessageEmbed()

			if (guideTxt.color) DiscordEmbed.setColor(guideTxt.color.toLowerCase);
			if (guideTxt.title) DiscordEmbed.setTitle(guideTxt.title);
			if (guideTxt.desc) DiscordEmbed.setDescription(guideTxt.desc);

			if (guideTxt.fields) {
				DiscordEmbed.addFields()

				for (const i in guideTxt.fields) {
					let titleTxt = guideTxt.fields[i].title ? guideTxt.fields[i].title : `Section ${i}`
					let descTxt = guideTxt.fields[i].text ? guideTxt.fields[i].text : 'Description Text'
					let inline = guideTxt.fields[i].inline ? true : false

					if (descTxt.includes('%RANDOMSKILL%')) {
						let possibleSkills = []
						for (const val in skillFile) {
							if (skillFile[val].type != "heal" && (skillFile[val].type != "status" && !skillFile[val].buff) && skillFile[val].type != "passive" && val != "Metronome") {
								possibleSkills.push(val)
							}
						}

						let skillVal = possibleSkills[Math.round(Math.random() * (possibleSkills.length-1))]
						skillDefs = skillFile[skillVal]

						descTxt = descTxt.replace('%RANDOMSKILL%', `${elementEmoji[skillDefs.type]}${skillDefs.name ? skillDefs.name : skillVal}`)
					}

					descTxt = descTxt.replace('rpg!', getPrefix(message.guild.id))

					DiscordEmbed.fields.push({name: titleTxt, value: descTxt, inline: inline})
				}
			}
			
			message.reply({embeds: [DiscordEmbed]})
		}
	}
})

commands.pvpleaderboards = new Command({
	desc: "View the leaderboards for the different gamemodes.",
	section: "battle",
	aliases: ["pvpleaderboards", "pvpleaders", "pvpwinners", 'leaderboards', 'leaders', 'winners'],
	args: [{
		name: "Gamemode",
		type: "Word",
	}],
	doc: {
		desc: `The gamemodes that you can check for are:\n- ${['regular', 'metronome', 'randskills', 'randstats', 'charscramble'].join("\n- ")}`,
		/*fields: [
			{
				name: "Field Placeholder",
				value: "Field Description Placeholder",
				inline: true,
			},
		],*/
	},
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id)

		if (!settings['pvpstuff'] || settings['pvpstuff'].length <= 2) {
			settings['pvpstuff'] = {
				none: {},
				metronome: {},
				randskills: {},
				randstats: {},
				charfuck: {},
				enemies: {}
			} 
			
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, '	', 4))
		}

		let gamemode = "none"
		if (args[0]) {
			if (args[0].toLowerCase() === "metronome" || args[0].toLowerCase() === "randskills" || args[0].toLowerCase() === "randstats" || args[0].toLowerCase() === "charscramble") {
				gamemode = args[0].toLowerCase()
			}
		}

		let leaderBoard = []
		for (const i in settings['pvpstuff'][gamemode]) {
			leaderBoard.push([i, settings['pvpstuff'][gamemode][i]])
		}

		leaderBoard.sort(function(a, b) {return b[1].points - a[1].points});

		let leaderText = ""
		for (const i in leaderBoard) {
			let boardUser = client.users.fetch(leaderBoard[i][0])
			boardUser.then(function(user) {
				leaderText += `${+i+1}: ${user.username} (${leaderBoard[i][1].points} points)\n`;
			})
		}

		if (gamemode === "none") {gamemode = "regular"}

		setTimeout(function() {
			if (leaderText == "") {leaderText = "No Users on the leaderboard."}

			const DiscordEmbed = new Discord.MessageEmbed()
				.setColor('#b4eb34')
				.setTitle(`${message.guild.name}'s ${gamemode} leaderboard`)
				.setDescription(`${leaderText}`)
			message.channel.send({embeds: [DiscordEmbed]})
		},	500)
	}
})

/*
	LOCATION SHIT
	- Location Settings
	- Enemy Encounter Tables
							  */

commands.locationsettings = new Command({
	desc: "Set certain values based on channel. You can change them freely.\n```diff\n=== Weather ===\n" +
		"+ <Type of Weather>\n" +
		"Forces the weather to be the one set unless Explicitly defined in battle.\n" +
		"\n" +
		"=== Terrain ===\n" +
		"+ <Type of Terrain>\n" +
		"Forces the terrain to be the one set unless Explicitly defined in battle.\n" +
		"\n" +
		"=== Perma-Status ===\n" +
		"+ <Status Effect>\n" +
		"Forces all battlers to have this status for the entire battle unless inflicted with another one.```",

	section: "battle",
	aliases: ['localesettings', 'lsettings', 'locationset'],
	args: [
		{
			name: "Location",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Setting",
			type: "Word",
			forced: true
		},
		{
			name: "Arguments",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (!args[0].id) return message.channel.send("That isn't a channel!");

		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${args[0].id}`);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, true);

		switch(args[1].toLowerCase()) {
			case 'weather':
			case 'precipitation':
				if (weathers.includes(args[2].toLowerCase())) {
					locale.weather = args[2].toLowerCase()
				} else {
					return message.channel.send("You entered a nonexistant weather type!");
				}

				break;

			case 'terrain':
			case 'floor':
				if (terrains.includes(args[2].toLowerCase())) {
					locale.terrain = args[2].toLowerCase()
				} else {
					return message.channel.send("You entered a nonexistant terrain type!");
				}

				break;

			case 'permastatus':
			case 'perma-status':
			case 'permstatus':
				if (terrains.includes(args[2].toLowerCase())) {
					locale.terrain = args[2].toLowerCase()
				} else {
					return message.channel.send("You entered a nonexistant terrain type!");
				}

				break;
		}

		message.channel.send(`Set ${args[0]}'s ${args[1]} to ${args[2]}.`);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, JSON.stringify(locale, '	', 4));
	}
})

commands.addencounter = new Command({
	desc: "Adds an enemy encounter to the specified channel. If no enemies are specified in battle commands, these will be used instead.",
	section: "battle",
	aliases: ['makeencounter', 'setencounter'],
	args: [
		{
			name: "Location",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Enemies",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (!args[0].id) return message.channel.send("That isn't a channel!");

		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${args[0].id}`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, true);

		if (!locale.encounters) locale.encounters = [];

		let e = [];
		for (let i in args) {
			if (i <= 0) continue;
			if (!enemyFile[args[i]]) return message.channel.send(`${args[i]} is an invalid enemy!`);
			e.push(args[i]);
		}

		message.react('👍');
		locale.encounters.push(e);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, JSON.stringify(locale, '	', 4));
	}
})

commands.removeencounter = new Command({
	desc: "Removes an enemy encounter from the specified channel.",
	section: "battle",
	aliases: ['killencounter', 'purgeencounter'],
	args: [
		{
			name: "Location",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Encounter Number",
			type: "Num",
			forced: true
		}
	],
	func(message, args, guilded) {
		if (!args[0].id) return message.channel.send("That isn't a channel!");

		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${args[0].id}`);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, true);

		// Kill encounters
		if (!locale.encounters) return message.channel.send("There are no encounters here!");
		if (!locale.encounters[args[1]-1]) return message.channel.send(`Encounter #${args[1]} does not exist.`);
		locale.encounters.splice(args[1]-1, 1);

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, JSON.stringify(locale, '	', 4));
	}
})

commands.channeldata = new Command({
	desc: "Lists all of the channel data made for this channel.",
	section: "battle",
	aliases: ['getdata', 'getchanneldata'],
	args: [
		{
			name: "Channel",
			type: "RealChannel",
			forced: false
		}
	],
	func(message, args, guilded) {
		if (!args[0] || !args[0].id) args[0] = message.channel;

		// a
		const DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#cc3b69')
		.setTitle(`Data for ${args[0].name}:`)
		.addFields()

		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${args[0].id}`);
		let channel = setUpFile(`${dataPath}/json/${message.guild.id}/${args[0].id}/location.json`, true);

		if (channel.weather) DiscordEmbed.fields.push({name: 'Weather right now:', value: channel.weather.charAt(0).toUpperCase() + channel.weather.slice(1), inline: true})
		if (channel.terrain) DiscordEmbed.fields.push({name: 'Terrain right now:', value: channel.terrain.charAt(0).toUpperCase() + channel.terrain.slice(1), inline: true})

		if (channel.encounters) {
			let encounters = '';
			for (let i in channel.encounters) {
				encounters += `**[${parseInt(i)+1}]** `;
				for (let k in channel.encounters[i]) {
					encounters += `${channel.encounters[i][k]}`;
					if (k <= channel.encounters[i].length) encounters += ', ';
				}
				encounters += '\n';
			}
			DiscordEmbed.fields.push({name: "Possible Encounters", value: encounters, inline: false})
		}

		if (DiscordEmbed.fields.length <= 0) return message.channel.send("There's no data for this channel!");
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

/*
	BATTLE STUFF
	This here starts battles and stuff.
	We're mostly finished but there's just a few cosmetic things to handle.
																			 */

// Todo:
// Colosseum

commands.endbattle = new Command({
	desc: "Manually ends a battle happening in this channel. No stat changes, xp or money is saved.",
	section: "battle",
	aliases: ["endfight"],
	func(message, args, guilded) {
		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);

		if (!utilityFuncs.isAdmin(message) && btl?.initiator != message.author.id) return message.channel.send("You don't have permission to end this battle!");

		// Can't end a battle if it's not actually happening :/
		if (!btl.battling) return message.channel.send("No battle is happening in this channel!");

		// Clear the file
		message.react('👍');
		forceEndBattles[`${message.guild.id}-${message.channel.id}`] = true;

		btl = {};
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, '{}');
	}
})

commands.startbattle = new Command({
	desc: "Start a battle in this channel. Without any enemies, use the set encounters for this channel. I hope you enjoy!\n\nThis definitely won't work without the following:```diff\n+ Characters\n+ Skills\n+ Enemies\n+ Parties```",
	section: "battle",
	aliases: ["startenemybattle", "battlebegin", "fightenemies"],
	args: [
		{
			name: "Party",
			type: "Word",
			forced: true
		},
		{
			name: "Escapable",
			type: "Word",
			forced: true
		},
		{
			name: "Weather",
			type: "Word",
			forced: true
		},
		{
			name: "Terrain",
			type: "Word",
			forced: true
		},
		{
			name: "Enemies",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true);
		let settings = setUpSettings(message.guild.id);

		// Set up Battle Field
		let battle = {
			battling: true,
			channel: message.channel, // so i dont have to do it later
			guild: message.guild, // so i dont have to do it later

			turn: 0,
//			curturn: -1,
			turnorder: [],

//			weather: 'none',
//			terrain: 'none',
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
			]
		}

		// Validity Check for Parties
		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/location.json`, true);
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);
		enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);

		let weather = locale.weather ?? 'none'
		let terrain = locale.terrain ?? 'none';
		if (args[2].toLowerCase() != 'none') weather = args[2].toLowerCase();
		if (args[3].toLowerCase() != 'none') terrain = args[3].toLowerCase();

		// Weather and stuff
		if (weather != 'none') {
			if (!weathers.includes(weather)) return message.channel.send(`${args[2].toLowerCase()} is an invalid weather type!`);

			battle.weather = {
				type: weather,
				turns: -1,
				force: weather,
			}
		}

		// Terrains and stuff
		if (terrain != 'none') {
			if (!terrains.includes(terrain)) return message.channel.send(`${args[3].toLowerCase()} is an invalid terrain type!`);

			battle.terrain = {
				type: terrain,
				turns: -1,
				force: terrain,
			}
		}

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

		// Save this for errors!
		if (!battleFiles) battleFiles = [];
		if (!battleFiles.includes(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);

		// Set up Ally Side.
		let battleid = 0;
		let party = parties[args[0]];
		
		if (!party.discoveries) party.discoveries = {};

		for (const i in party.members) {
			if (!charFile[party.members[i]]) continue;

			let char = objClone(charFile[party.members[i]]);
			console.log(char.lb);

			char.truename = party.members[i];
			if (!char.name) char.name = party.members[i];

			if (charFile[party.members[i]].ai) {
				char.automove = true;
				char.memory = {};
			}

			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			if (i <= 0) {
				char.leader = true;
				battle.teams[0].leaderskill = char.leaderskill;
			}

			char.team = 0;
			if (char.owner) addData(char.owner, "totalbattles", 1);

			battle.teams[0].members.push(char);
		}

		for (const i in party.backup) {
			if (!charFile[party.backup[i]]) continue;

			let char = objClone(charFile[party.backup[i]]);
			if (!char.name) char.name = party.backup[i];

			if (charFile[party.backup[i]].ai) {
				char.automove = true;
				char.memory = {};
			}

			char.truename = party.backup[i];
			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			char.team = 0;
			battle.teams[0].backup.push(char);
		}

		// Save other shit
		battle.teams[0].name = args[0];
		battle.teams[0].items = objClone(party.items);
		battle.teams[0].pets = objClone(party.negotiateAllies);
		battle.teams[0].weapons = objClone(party.weapons);
		battle.teams[0].armors = objClone(party.armors);
		battle.teams[0].id = args[0];
		if (party.currency) battle.teams[0].currency = battle.teams[0].maxcur = party.currency

		// Current pet
		if (party.curpet) battle.teams[0].curpet = party.curpet;

		// Set up Enemy Side.
		// == this time, no encounters set until the enemy is killed or pacified == //
		let encounter = [];
		if (args.length < 5) {
			if (!locale.encounters || locale.encounters.length <= 0) return message.channel.send("You've not set any enemies, and there are no encounters assigned to this channel!");
			encounter = locale.encounters[randNum(0, locale.encounters.length-1)] ?? locale.encounters[0];
		} else {
			for (let i = 4; i < args.length; i++) {
				if (!enmFile[args[i]]) return message.channel.send(`${args[i]} is an invalid enemy!`);
				encounter.push(args[i]);
			}
		}

		let lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`, true);

		let enmDesc = '';
		let goldenChance = settings?.rates?.goldchance ?? 0.01;
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
			
			// Does this battle pass as a boss
			if (enemy.type.includes('boss') || enemy.type.includes('bigboss') || enemy.type.includes('deity')) battle.bossbattle = true;

			//check for golden chance
			if (!battle.bossbattle && Math.random() <= (goldenChance / 100)) enemy.golden = true;

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

			if (enemy.loot) enemy.loot = objClone(lootFile?.[enemy.loot]?.items) ?? [];
		}

		funcsAtBattleStart(battle);
		if (settings?.mechanics?.leaderskills) battle = leaderSkillsAtBattleStart(battle);

		// turn order :)
		battle.turnorder = getTurnOrder(battle);

		// Save all this data to a file.
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

		message.channel.send(`Team ${args[0]} encountered some enemies!`);
		setTimeout(function() {
			advanceTurn(battle)
        }, 500)
	}
})

commands.forcebattle = new Command({
	desc: "Start a battle in this channel, _**replacing any existing ones**_.\n\nThis definitely won't work without the following:```diff\n+ Characters\n+ Skills\n+ Enemies\n+ Parties```",
	section: "battle",
	aliases: ["forceenemybattle"],
	args: [
		{
			name: "Party",
			type: "Word",
			forced: true
		},
		{
			name: "Escapable",
			type: "Word",
			forced: true
		},
		{
			name: "Weather",
			type: "Word",
			forced: true
		},
		{
			name: "Terrain",
			type: "Word",
			forced: true
		},
		{
			name: "Enemies",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		commands.endbattle.call(message)
		commands.startbattle.call(message, args)
	}
})

commands.startpvp = new Command({
	desc: "Start a PVP battle in this channel. The best fighter(s) win, strike down your foes in a classic 1v1, free for all, or a team battle! No Leader Skills or items allowed here! Good luck!\nAlso comes with gamemode DLC (free lol)```diff\n=== NORMAL ===\nYour generic PVP battle. Show them who's boss without any quirky business!\n\n=== SKILLSCRAMBLE ===\nFight with a set of 8 random skills! You'll never know what you get, so adapt to win!\n\n=== STATSCRAMBLE ===\nFight with random stats, HP and MP! You could be turned into the tankiest fighter, or the frailest one - maybe you go from a physical main to a magical one! Try your best to defeat your foe in the fray!\n\n=== METRONOME ===\nAll fighters only have the skill Metronome! It's an Almighty Type skill that allows you to use ANY defined move! If ya like RNG, you'll love this!\n\n=== CHARACTERSCRAMBLE ===\nScramble your characters' stats, skills, affinities, and more for a jolly good session of Rage Quit!```",
	section: "battle",
	aliases: ["pvp", "playerversusplayer"],
	args: [
		{
			name: "Ranked",
			type: "Word",
			forced: true
		},
		{
			name: "Gamemode",
			type: "Word",
			forced: true
		},
		{
			name: "Parties",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true);
		let settings = setUpSettings(message.guild.id);

		// Set up Battle Field
		let battle = {
			battling: true,
			channel: message.channel, // so i dont have to do it later
			guild: message.guild, // so i dont have to do it later

			turn: 0,
//			curturn: -1,
			turnorder: [],

//			weather: 'none',
//			terrain: 'none',
			effects: {},
			teams: []
		}

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/location.json`, true);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);

		// Preset Weather & Terrain.
		let weather = locale.weather ?? 'none'
		let terrain = locale.terrain ?? 'none';

		// Weather and stuff.
		if (weather != 'none') {
			if (!weathers.includes(weather)) return message.channel.send(`${args[2].toLowerCase()} is an invalid weather type!`);

			battle.weather = {
				type: weather,
				turns: -1,
				force: weather,
			}
		}

		// Terrains and stuff.
		if (terrain != 'none') {
			if (!terrains.includes(terrain)) return message.channel.send(`${args[3].toLowerCase()} is an invalid terrain type!`);

			battle.terrain = {
				type: terrain,
				turns: -1,
				force: terrain,
			}
		}

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

		// Save this for errors!
		if (!battleFiles) battleFiles = [];
		if (!battleFiles.includes(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);

		// Set up the parties
		let battleid = 0;
		let clone = false;
		let existant = []

		for (let i in args) {
			if (i <= 1) continue;

			let party = parties[args[i]];
			if (!party) return message.channel.send(`${args[i]} is a nonexistant party!`);

			if (!party.discoveries) party.discoveries = {};

			battle.teams[i-2] = {
				members: [],
				backup: []
			};

			for (const k in party.members) {
				if (!charFile[party.members[k]]) continue;

				let char = objClone(charFile[party.members[k]]);

				char.truename = party.members[k];
				if (!char.name) char.name = party.members[k];

				if (existant.includes(char.truename)) clone = true;
				existant.push(char.truename)

				char.id = battleid;
				battleid++;

				setupBattleStats(char);

				if (k <= 0) {
					char.leader = true;
					battle.teams[i-2].leaderskill = char.leaderskill;
				}

				char.team = i-2;
				battle.teams[i-2].members.push(char);
			}

			for (const k in party.backup) {
				if (!charFile[party.backup[k]]) continue;

				let char = objClone(charFile[party.backup[k]]);
				if (!char.name) char.name = party.backup[k];

				char.truename = party.backup[i];
				char.id = battleid;
				battleid++;

				setupBattleStats(char);

				char.team = i-2;
				battle.teams[i-2].backup.push(char);
			}

			battle.teams[i-2].name = party.name;
			battle.teams[i-2].weapons = objClone(party.weapons);
			battle.teams[i-2].armors = objClone(party.armors);
			battle.teams[i-2].id = args[i];
		}

		// Now THIS is a battle!
		battle.pvp = true

		// Is this battle ranked
		if (args[0].toLowerCase() == 'y' || args[0].toLowerCase() == 'yes' || args[0].toLowerCase() == 'true') {
			battle.ranked = true;
			if (clone) return message.channel.send("You cannot have a clone of a character in a __Ranked Battle__!");
		}

		// Is this battle a specific gamemode

		// Optimize code
		let skillkeys = Object.keys(skillFile);
		let skilllen = skillkeys.length;

		if (args[1].toLowerCase() != 'none' || args[1].toLowerCase() != 'normal') {
			switch(args[1].toLowerCase()) {
				case 'anyskill':
				case 'metronome':
					for (party of battle.teams) {
						for (let i in party.members) {
							party.members[i].skills = ["Metronome"]
						}
					}
					break;

				case 'statscramble':
				case 'statfuck':
				case 'randstats':
					for (party of battle.teams) {
						for (let i in party.members) {
							let char = party.members[i];

							// StatFuck Stats
							char.maxhp = 200 + randNum(400);
							char.maxmp = 150 + randNum(250);
							char.hp = char.maxhp
							char.mp = char.maxmp
							for (const k in char.stats) char.stats[k] = randNum(1, 99);
						}
					}
					break;

				case 'skillscramble':
				case 'skillfuck':
				case 'randskills':
					for (party of battle.teams) {
						party.currency = party.maxcur = 200 + randNum(5000);
						
						for (let i in party.members) {
							let char = party.members[i];
	
							// SkillFuck Skills
							for (let k = 0; k < 8; k++) {
								char.skills[k] = skillkeys[Math.floor(Math.random() * skilllen)];
							}
						}
					}
					break;

				case 'characterscramble':
				case 'charfuck':
				case 'charscramble':
					for (party of battle.teams) {
						party.currency = party.maxcur = 200 + randNum(5000);

						for (let i in party.members) {
							let char = party.members[i];
	
							// CharFuck Skills
							for (let k = 0; k < 8; k++) {
								char.skills[k] = skillkeys[Math.floor(Math.random() * skilllen)];
							}

							// CharFuck Stats
							char.maxhp = 200 + randNum(400);
							char.maxmp = 150 + randNum(250);
							char.hp = char.maxhp;
							char.mp = char.maxmp;
							for (const k in char.stats) char.stats[k] = randNum(1, 99);

							// CharFuck Melee Attack
							char.melee.type = Elements[Math.floor(Math.random() * Elements.length)];
							char.melee.pow = randNum(1, 60);
							char.melee.acc = randNum(0, 100);
							char.melee.crit = randNum(0, 100);

							// CharFuck Affinities
							if (!char.affinities) char.affinities = {};
							if (!char.statusaffinities) char.statusaffinities = {};

							for (let k in char.affinities) char.affinities[k] = [];
							for (let k in char.statusaffinities) char.statusaffinities[k] = [];

							let aMod = ["superweak", "weak", "weak", "weak", "normal", "normal", "normal", "normal", "resist", "resist", "block", "repel", "drain"];
							for (const type of Elements) {
								if (type === "status" || type === "heal" || type === "passive" || type === "almighty") continue;

								let j = randNum(aMod.length-1);
								if (aMod[j] != "normal") {
									if (!char.affinities[aMod[j]]) char.affinities[aMod[j]] = [];
									char.affinities[aMod[j]].push(type);
								}
							}

							aMod = ["weak", "weak", "weak", "normal", "normal", "normal", "normal", "resist", "resist", "block"];
							for (const type of statusEffects) {
								let j = randNum(aMod.length-1);
								if (aMod[j] != "normal") {
									if (!char.statusaffinities[aMod[j]]) char.statusaffinities[aMod[j]] = [];
									char.statusaffinities[aMod[j]].push(type);
								}
							}
						}
					}
					break;
			}

			battle.pvpmode = args[1].toLowerCase();
		}

		funcsAtBattleStart(battle);

		// turn order :)
		battle.turnorder = getTurnOrder(battle);

		// Save all this data to a file.
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

		message.channel.send("A PVP Battle has begun! Good luck to the participants!");
		setTimeout(function() {
			advanceTurn(battle)
        }, 500)
	}
})

commands.starttrial = new Command({
	desc: "Start a trial in this channel. Challenge yourself against the endless onslaught of enemies of the trial until you reign victorious!\n\nNO ITEMS ARE ALLOWED! You must do this with your own intuition!",
	section: "battle",
	aliases: ["challengetrial", "startcolosseum"],
	args: [
		{
			name: "Party",
			type: "Word",
			forced: true
		},
		{
			name: "Trial",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true);
		let settings = setUpSettings(message.guild.id);

		// Set up Battle Field
		let battle = {
			battling: true,
			channel: message.channel, // so i dont have to do it later
			guild: message.guild, // so i dont have to do it later

			turn: 0,
//			curturn: -1,
			turnorder: [],

			trialwave: 0,

//			weather: 'none',
//			terrain: 'none',
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
			]
		}

		// Validity Check for Parties
		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);

		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);
		enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);
		trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`, true);

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");
		if (!trials[args[1]]) return message.channel.send(`${args[1]} is an invalid trial!`);

		// Save this for errors!
		if (!battleFiles) battleFiles = [];
		if (!battleFiles.includes(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);

		// Set up Ally Side.
		let battleid = 0;
		let party = parties[args[0]];

		let trial = trials[args[1]];
		let levellock = trial.levellock ?? 0;

		if (!party.discoveries) party.discoveries = {};

		for (const i in party.members) {
			if (!charFile[party.members[i]]) continue;

			let char = objClone(charFile[party.members[i]]);
			if (char.level < levellock) return message.channel.send(`${char.name} is not strong enough to attmept this trial! They must be level ${levellock} to do this trial.`);

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

			char.truename = party.backup[i];
			if (char.level < levellock) return message.channel.send(`${char.name} (who is in backup) is not strong enough to attmept this trial! They must be level ${levellock} to do this trial.`);

			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			char.team = 0;
			battle.teams[0].backup.push(char);
		}

		battle.teams[0].name = args[0];
		battle.teams[0].pets = objClone(party.negotiateAllies);
		battle.teams[0].weapons = objClone(party.weapons);
		battle.teams[0].armors = objClone(party.armors);
		battle.teams[0].id = args[0];

		// Set up Enemy Side, This will be the first wave of the colosseum.
		// == this time, no encounters set until the enemy is killed or pacified == //
		let encounter = trial.waves[0];

		battle.trial = trial;
		battle.trial.id = args[1];

		let enmDesc = '';
		for (let i in encounter) {
			if (!enmFile[encounter[i]]) {
				message.channel.send(`There was something wrong with this trial! ${encounter[i]} does not exist.`);
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
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

		message.channel.send(`Team ${args[0]} have challenged the **${args[1]}** Trial! Good Luck!`);
		setTimeout(function() {
			advanceTurn(battle)
        }, 1000)
	}
})

commands.testbattle = new Command({
	desc: "Start a battle with a specified amount of moves to test your character/characters against a set enemy. Without any enemies, use the set encounters for this channel. This battle lasts for the set number of turns.",
	section: "battle",
	aliases: ["starttestbattle", "testbegin", "testfight"],
	args: [
		{
			name: "Character or Party",
			type: "Word",
			forced: true
		},
		{
			name: "Turns",
			type: "Num",
			forced: true
		},
		{
			name: "Weather",
			type: "Word",
			forced: true
		},
		{
			name: "Terrain",
			type: "Word",
			forced: true
		},
		{
			name: "Enemies",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true);
		let settings = setUpSettings(message.guild.id);

		if (args[1] <= 0) return message.channel.send(`"Turns" cannot be below 0! ${args[1]} is not a possible value.`);

		// Set up Battle Field
		let battle = {
			battling: true,
			channel: message.channel, // so i dont have to do it later
			guild: message.guild, // so i dont have to do it later

			turn: 0,
//			curturn: -1,
			turnorder: [],
			
			testing: args[1],
			initiator: message.author.id,

//			weather: 'none',
//			terrain: 'none',
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
			]
		}

		// Validity Check for Parties
		charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);

		if (!parties[args[0]]) {
			if (!charFile[args[0]]) return message.channel.send(`${args[0]} is an invalid party or character!"`);

			parties[args[0]] = {
				name: args[0],
				members: [args[0]],
				backup: [],
				items: {},
				weapons: {},
				armors: {},
				negotiates: {},
				negotiateAllies: {}
			}
		}

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/location.json`, true);
		enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);

		let weather = locale.weather ?? 'none'
		let terrain = locale.terrain ?? 'none';
		if (args[2].toLowerCase() != 'none') weather = args[2].toLowerCase();
		if (args[3].toLowerCase() != 'none') terrain = args[3].toLowerCase();

		// Weather and stuff
		if (weather != 'none') {
			if (!weathers.includes(weather)) return message.channel.send(`${args[2].toLowerCase()} is an invalid weather type!`);

			battle.weather = {
				type: weather,
				turns: -1,
				force: weather,
			}
		}

		// Terrains and stuff
		if (terrain != 'none') {
			if (!terrains.includes(terrain)) return message.channel.send(`${args[3].toLowerCase()} is an invalid terrain type!`);

			battle.terrain = {
				type: terrain,
				turns: -1,
				force: terrain,
			}
		}

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

		// Save this for errors!
		if (!battleFiles) battleFiles = [];
		if (!battleFiles.includes(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);

		// Set up Ally Side.
		let battleid = 0;
		let party = parties[args[0]];

		if (!party.discoveries) party.discoveries = {};

		for (const i in party.members) {
			if (!charFile[party.members[i]]) continue;

			let char = objClone(charFile[party.members[i]]);

			char.truename = party.members[i];
			if (!char.name) char.name = party.members[i];

			if (charFile[party.members[i]].ai) {
				char.automove = true;
				char.memory = {};
			}

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

			if (charFile[party.backup[i]].ai) {
				char.automove = true;
				char.memory = {};
			}

			char.truename = party.backup[i];
			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			char.team = 0;
			battle.teams[0].backup.push(char);
		}

		// Save other shit
		battle.teams[0].name = args[0];
		battle.teams[0].items = objClone(party.items);
		battle.teams[0].pets = objClone(party.negotiateAllies);
		battle.teams[0].weapons = objClone(party.weapons);
		battle.teams[0].armors = objClone(party.armors);
		battle.teams[0].id = args[0];
		if (party.currency) battle.teams[0].currency = battle.teams[0].maxcur = party.currency;

		// Current pet
		if (party.curpet) battle.teams[0].curpet = party.curpet;

		// Set up Enemy Side.
		// == this time, no encounters set until the enemy is killed or pacified == //
		let encounter = [];
		if (args.length < 5) {
			if (!locale.encounters || locale.encounters.length <= 0) return message.channel.send("You've not set any enemies, and there are no encounters assigned to this channel!");
			encounter = locale.encounters[randNum(0, locale.encounters.length-1)] ?? locale.encounters[0];
		} else {
			for (let i = 4; i < args.length; i++) {
				if (!enmFile[args[i]]) return message.channel.send(`${args[i]} is an invalid enemy!`);
				encounter.push(args[i]);
			}
		}

		let lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`, true);

		let enmDesc = '';
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
			
			// Does this battle pass as a boss
			if (enemy.type.includes('boss') || enemy.type.includes('bigboss') || enemy.type.includes('deity')) battle.bossbattle = true;

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

			if (enemy.loot) enemy.loot = objClone(lootFile?.[enemy.loot]?.items) ?? [];
		}

		funcsAtBattleStart(battle);
		if (settings?.mechanics?.leaderskills) battle = leaderSkillsAtBattleStart(battle);

		// turn order :)
		battle.turnorder = getTurnOrder(battle);

		// Save all this data to a file.
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

		message.channel.send(`Beginning a test battle!`);
		setTimeout(function() {
			advanceTurn(battle, true)
        }, 500)
	}
})

commands.aibattle = new Command({
	desc: "Make enemies fight to the death in a 1v1 or FFA battle!",
	section: "battle",
	aliases: ["startaibattle"],
	args: [
		{
			name: "Weather",
			type: "Word",
			forced: true
		},
		{
			name: "Terrain",
			type: "Word",
			forced: true
		},
		{
			name: "Enemies",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true);
		let settings = setUpSettings(message.guild.id);

		// Set up Battle Field
		let battle = {
			battling: true,
			channel: message.channel, // so i dont have to do it later
			guild: message.guild, // so i dont have to do it later

			turn: 0,
//			curturn: -1,
			turnorder: [],

//			weather: 'none',
//			terrain: 'none',
			effects: {},

			pvp: true,

			teams: []
		}

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		let locale = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/location.json`, true);
		enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);

		let weather = locale.weather ?? 'none'
		let terrain = locale.terrain ?? 'none';
		if (args[0].toLowerCase() != 'none') weather = args[0].toLowerCase();
		if (args[1].toLowerCase() != 'none') terrain = args[1].toLowerCase();

		// Weather and stuff
		if (weather != 'none') {
			if (!weathers.includes(weather)) return message.channel.send(`${args[0].toLowerCase()} is an invalid weather type!`);

			battle.weather = {
				type: weather,
				turns: -1,
				force: weather,
			}
		}

		// Terrains and stuff
		if (terrain != 'none') {
			if (!terrains.includes(terrain)) return message.channel.send(`${args[1].toLowerCase()} is an invalid terrain type!`);

			battle.terrain = {
				type: terrain,
				turns: -1,
				force: terrain,
			}
		}

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

		// Save this for errors!
		if (!battleFiles) battleFiles = [];
		if (!battleFiles.includes(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`)) battleFiles.push(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);

		let battleid = 0;
		for (let i in args) {
			if (i <= 1 || i >= 6) continue;

			let enemy = objClone(enmFile[args[i]]);
			enemy.enemy = true;

			enemy.truename = args[i];
			if (!enemy.name) enemy.name = args[i];
			enemy.maxhp = enemy.hp;
			enemy.maxmp = enemy.mp;
			enemy.id = battleid;
			battleid++;

			// For enemy ai
			enemy.memory = {};

			// Pacifying
			enemy.pacify = 0;

			setupBattleStats(enemy);
			enemy.team = i-2;

			battle.teams.push({
				name: i-1,
				id: 'enemies',
				enemyteam: true,
				members: [enemy],
				backup: [],
				items: {},
				pets: {},
				currency: 1000,
				maxcur: 1000
			});
		}

		funcsAtBattleStart(battle);
		if (settings?.mechanics?.leaderskills) battle = leaderSkillsAtBattleStart(battle);

		// turn order :)
		battle.turnorder = getTurnOrder(battle);

		// Save all this data to a file.
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, JSON.stringify(battle, null, '    '));

		message.channel.send(`A ${(battle.teams.length > 2) ? "Free-For-All" : "1v1"} battle has broken out amongst enemies!`);
		setTimeout(function() {
			advanceTurn(battle)
        }, 500)
	}
})

commands.resendembed = new Command({
	desc: "Resends the Battle Embed. Maybe it broke or something, I suck.",
	section: "battle",
	aliases: ["makeembed", "replacembed"],
	func(message, args, guilded) {
		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);

		// Sadly, no battle.
		if (!btl.battling) return message.channel.send("No battle is happening!");

		// Set channel again
		btl.channel = message.channel;
		message.react('👍');

		// bruh
		if (btl.action && !btl.intendedstate) delete btl.action;

		// Resend the Embed.
		let char = getCharFromTurn(btl);
		if (btl.petturn) {
			let party = btl.teams[char.team];
			let petchar = objClone(char);
			delete petchar.leader;

			let pet = party.pets[party.curpet];
			petchar.pet = pet;

			petchar.stats = pet.stats;
			petchar.name = pet.nickname;
			petchar.melee = pet.melee ?? {name: "Strike Attack", type: "strike", pow: 30, acc: 95, crit: 15};
			petchar.quotes = {};
			sendCurTurnEmbed(petchar, btl);
		} else {
			sendCurTurnEmbed(char, btl);
		}
	}
})

commands.resumetrial = new Command({
	desc: "Resume a saved trial in this channel. Only the leader can continue it.",
	section: "battle",
	aliases: ["continuetrial", "resumecolosseum"],
	args: [
		{
			name: "Party",
			type: "Word",
			forced: true
		},
		{
			name: "Trial",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		if (forceEndBattles[`${message.guild.id}-${message.channel.id}`]) forceEndBattles[`${message.guild.id}-${message.channel.id}`] = false;

		let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`, true);
		if (!trials[args[1]]) return message.channel.send(`${args[0]} is a nonexistant trial!`);

		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}/${args[1]}`);
		let save = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/${args[1]}/save-${args[0].toLowerCase()}.json`, true);

		if (!save || !save.teams || !save.trial) return message.channel.send("This save doesn't exist!");
		if (message.author.id != save.teams[0].members[0].owner) return message.channel.send("Only the leader can resume a battle!");

		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");
		message.react('👍');

		btl = objClone(save);
		btl.channel = message.channel;
		if (btl.action) delete btl.action;

		// Resend the Embed.
		let char = getCharFromTurn(btl);
		if (btl.petturn) {
			let party = btl.teams[char.team];
			let petchar = objClone(char);
			delete petchar.leader;

			let pet = party.pets[party.curpet];
			petchar.pet = pet;

			petchar.stats = pet.stats;
			petchar.name = pet.nickname;
			petchar.melee = pet.melee ?? {name: "Strike Attack", type: "strike", pow: 30, acc: 95, crit: 15};
			petchar.quotes = {};
			sendCurTurnEmbed(petchar, btl);
		} else {
			sendCurTurnEmbed(char, btl);
		}
	}
})

commands.listweather = new Command({
	desc: 'Lists all the weather types and their effects.',
	section: "battle",
	aliases: ['listweathers', 'weatherlist'],
	args: [
		{
			name: "Status",
			type: "Word",
			forced: false,
		}
	],
	async func(message, args, guilded) {
		let weatherListing = [];

		for (i in weatherDescs) weatherListing.push([i, weatherDescs[i]]);

		let page = 0;

		const generateEmbed = async (page) => {
			const current = weatherListing.slice(page, page + 6);
			return new Discord.MessageEmbed({
				color: '#0099ff',
				title: 'List of Weather Types:',
				description: `Weather Types will affect fighters in-battle with various strengths and weaknesses.`,
				fields: await Promise.all(
					current.map(async arrayDefs => ({
						name: `${arrayDefs[1].emoji}${arrayDefs[1].name} (${arrayDefs[0]})`,
						value: arrayDefs[1].desc,
						inline: true
					}))
				)
			})
		}

		embedMessage = await message.channel.send({
			embeds: [await generateEmbed(page)],
			components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
		})
		
		const collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id == message.author.id
		})

		collector.on('collect', async interaction => {
			if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
				if (interaction.customId === 'forward') {
					page += 6

					if (page >= weatherListing.length) {
						page = 0
					}
				} else if (interaction.customId === 'back') {
					page -= 6

					if (page < 0) {
						page = weatherListing.length - (weatherListing.length % 6 != 0 ? weatherListing.length % 6 : 6)
					}
				}

				await interaction.update({
					embeds: [await generateEmbed(page)],
					components: [
						new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
					]
				})
			} else {
				collector.stop()
				await interaction.update({
				embeds: [await generateEmbed(page)],
				components: []
				})
			}
		})
	}
})

commands.listterrain = new Command({
	desc: 'Lists all the terrain types and their effects.',
	section: "skills",
	aliases: ['listterrains', 'terrainlist'],
	args: [
		{
			name: "Status",
			type: "Word",
			forced: false,
		}
	],
	async func(message, args, guilded) {
		let terrainArray = [[],[]];

		for (i in terrainDescs) terrainArray[!terrainDescs[i]?.boss ? 0 : 1 ].push([i, terrainDescs[i]]);

		let page = 0;
		let pageIndex = 0;

		const generateEmbed = async (page) => {
			const current = terrainArray[page].slice(pageIndex, pageIndex + 6);
			return new Discord.MessageEmbed({
				color: '#0099ff',
				title: 'List of Terrain Types:',
				description: `Terrain Types will affect fighters in-battle with various strengths and weaknesses.${current[0][1].boss ? "\n### These Terrain Types are boss specific. I don't recommend characters use these, but I won't stop you." : ""}`,
				fields: await Promise.all(
					current.map(async arrayDefs => ({
						name: `${arrayDefs[1].emoji}${arrayDefs[1].name} (${arrayDefs[0]})`,
						value: arrayDefs[1].desc,
						inline: true
					}))
				)
			})
		}

		embedMessage = await message.channel.send({
			embeds: [await generateEmbed(page)],
			components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
		})
		
		const collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id == message.author.id
		})

		collector.on('collect', async interaction => {
			if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
				if (interaction.customId === 'forward') {
					pageIndex += 6

					if (pageIndex >= terrainArray[page].length) {
						page++

						if (page >= terrainArray.length) {
							page = 0
						}
						pageIndex = 0
					}
				} else if (interaction.customId === 'back') {
					pageIndex -= 6

					if (pageIndex < 0) {
						page--

						if (page < 0) {
							page = terrainArray.length-1
						}

						pageIndex = terrainArray[page].length - (terrainArray[page].length % 6 != 0 ? terrainArray[page].length % 6 : 6)
					}
				}

				await interaction.update({
					embeds: [await generateEmbed(page)],
					components: [
						new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
					]
				})
			} else {
				collector.stop()
				await interaction.update({
				embeds: [await generateEmbed(page)],
				components: []
				})
			}
		})
	}
})
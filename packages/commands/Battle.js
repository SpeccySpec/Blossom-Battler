commands.guide = new Command({
	desc: "How do battles work here you ask? Well you've come to the right place! Read this guide to get all the know-hows about battling.",
	section: "battle",
	aliases: ["battleguide", "battleguide"],
	args: [{
		name: "Page Number",
		type: "Num",
		forced: true
	}],
	func: (message, args) => {
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
	func: (message, args) => {
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
			if (args[0].toLowerCase() === "metronome" || args[0].toLowerCase() === "randskills" || args[0].toLowerCase() === "randstats" || args[0].toLowerCase() === "charfuck") {
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
		"Forces the weather to be the one set unless explicitely defined in battle.\n" +
		"\n" +
		"=== Terrain ===\n" +
		"+ <Type of Terrain>\n" +
		"Forces the terrain to be the one set unless explicitely defined in battle.\n" +
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
	func: (message, args) => {
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
	func: (message, args) => {
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
	func: (message, args) => {
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
	func: (message, args) => {
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
// Weapons and Armors in battle.
// Charms in battle.
// Finish all Extras, Status Skills and Passives.

commands.endbattle = new Command({
	desc: "Manually ends a battle happening in this channel. No stat changes, xp or money is saved.",
	admin: "You do not have permission to manually end the battle!",
	section: "battle",
	aliases: ["endfight"],
	func: (message, args) => {
		// Set up files
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);

		// Can't end a battle if it's not actually happening :/
		if (!btl.battling) return message.channel.send("No battle is happening in this channel!");

		// Clear the file
		message.react('👍');
		
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
	func: (message, args) => {
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
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);
		let enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);

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

			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			char.team = 0;
			battle.teams[0].backup.push(char);
		}

		battle.teams[0].items = objClone(party.items);
		battle.teams[0].pets = objClone(party.negotiateAllies);
		battle.teams[0].id = args[0];

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
			if (enemy.type.includes('boss') || enemy.type.includes('deity')) battle.bossbattle = true;

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

		for (party of battle.teams) leaderSkillsAtBattleStart(party);

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
	func: (message, args) => {
		commands.endbattle.call(message)
		commands.startbattle.call(message, args)
	}
})

commands.resendembed = new Command({
	desc: "Resends the Battle Embed. Maybe it broke or something, I suck.",
	section: "battle",
	aliases: ["makeembed", "replacembed"],
	func: (message, args) => {
		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);

		// Sadly, no battle.
		if (!btl.battling) return message.channel.send("No battle is happening!");

		// Set channel again
		btl.channel = message.channel;
		message.react('👍');

		// Resend the Embed
		sendCurTurnEmbed(getCharFromTurn(btl), btl)
	}
})
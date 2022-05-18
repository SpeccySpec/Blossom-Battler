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
			
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
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

// IT'S TIME
// EVERYTHING'S BEEN BUILDING UP TO THIS MOMENT
// TIME FOR BATTLES!!
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
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
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
					members: [],
					backup: [],
					items: {},
					pets: {},
				},
				{
					name: "Enemies",
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

		// Weather and stuff
		if (args[2].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[2].toLowerCase(), weathers)) return message.channel.send(`${args[2].toLowerCase()} is an invalid weather type!`);

			battle.weather = {
				type: args[2].toLowerCase(),
				turns: -1
			}
		}

		// Terrains and stuff
		if (args[3].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[3].toLowerCase(), terrains)) return message.channel.send(`${args[3].toLowerCase()} is an invalid terrain type!`);

			battle.terrain = {
				type: args[3].toLowerCase(),
				turns: -1
			}
		}

		// Battle File!
		makeDirectory(`${dataPath}/json/${message.guild.id}/${message.channel.id}`);
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`, true);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`, true);
		let enmFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true);

		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");

		// Set up Ally Side.
		let battleid = 0;
		let party = parties[args[0]];

		for (const i in party.members) {
			if (!charFile[party.members[i]]) continue;

			let char = objClone(charFile[party.members[i]]);
			if (!char.name) char.name = party.members[i];

			char.id = battleid;
			battleid++;

			setupBattleStats(char);

			if (i <= 0) {
				char.leader = true
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
		battle.teams[0].pets = objClone(party.pets);

		// Set up Enemy Side.
		// == this time, no encounters set until the enemy is killed or pacified == //
		let enmDesc = '';
		for (let i = 4; i <= args.length; i++) {
			if (!args[i]) continue;
			if (!enmFile[args[i]]) return message.channel.send(`${args[i]} is an invalid enemy!`);

			let enemy = objClone(enmFile[args[i]]);
			enemy.enemy = true;

			if (!enemy.name) enemy.name = args[i];
			enemy.maxhp = enemy.hp;
			enemy.maxmp = enemy.mp;
			enemy.id = battleid;
			battleid++;
			
			if (enemy.boss || enemy.miniboss || enemy.bigboss || enemy.finalboss || enemy.deity) battle.bossbattle = true;

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
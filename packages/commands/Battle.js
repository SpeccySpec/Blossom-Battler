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
		settings = setUpSettings(message.guild.id)

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

			turn: 0,
			curturn: 0,
			turnorder: [],

//			weather: 'none',
//			terrain: 'none',
			effects: {},

			teams: {
				1: {
					name: "",
					members: [],
					backup: [],
					items: {},
					pets: {},
				},
				2: {
					name: "",
					members: [],
					backup: [],
					items: {},
					pets: {},
				}
			}
		}

		// Validity Check for Parties
		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);

		// Weather and stuff
		if (args[2].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[2].toLowerCase(), weathers)) return message.channel.send(`${args[2].toLowerCase()} is an invalid weather type!`);
			battle.weather = args[2].toLowerCase();
		}

		// Terrains and stuff
		if (args[3].toLowerCase() != 'none') {
			if (!utilityFuncs.inArray(args[3].toLowerCase(), terrains)) return message.channel.send(`${args[3].toLowerCase()} is an invalid terrain type!`);
			battle.terrain = args[3].toLowerCase();
		}

		// Battle File!
		let btl = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/battle.json`);
		
		// Can't battle while another party is!
		if (btl.battling) return message.channel.send("You can't battle in this channel while another battle is happening!");
	}
})
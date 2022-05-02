const enemyFuncs = require("../enemyFuncs");

function writeEnemy(creator, guild, name, mainelement, level, health, magicpoints, experience, attack, magic, perception, endurance, charisma, intelligence, agility, luck, type, description) {
    let enemyFile = setUpFile(`${dataPath}/json/${guild.id}/enemies.json`);

    enemyFile[name] = {
        name: name,
		mainElement: mainelement,

        // Only the owner can move this character, if they don't have admin permissions.
        owner: creator.id,

        // Level, HP and MP
        level: level,
        hp: health,
        mp: magicpoints,


        // Status Effect
        status: "none",
        statusturns: 0,

        // Melee Attack
        melee: {
			name: "Strike Attack",
			type: "strike",
			pow: 30,
			acc: 95,
			crit: 15,
		},

        // Main stats
		stats: {
			atk: attack ? attack : 1,
			mag: magic ? magic : 1,
			prc: perception ? perception : 1,
			end: endurance ? endurance : 1,
			chr: charisma ? charisma : 1,
			int: intelligence ? intelligence : 1,
			agl: agility ? agility : 1,
			luk: luck ? luck : 1
		},

        // Limit Break Meter, XP.
        lb: 0,
        xp: experience,

        // Affinities & Skills
		affinities: {
			superweak: [],
			weak: [],
			resist: [],
			block: [],
			repel: [],
			drain: [],
		},

        skills: [],
        lb: {},

        // Quotes
		quotes: {},

        // Dreams
        dreams: [],

        // Negotiations
        negotiate: [],
		negotiateDefs: {
			required: 5
		},

        // Loot
        loot: '',

        // Image
        image: '',

        type: type,
        journal: description
    }

    //im lazy
	for (const i in quoteTypes) enemyFile[name].quotes[`${quoteTypes[i]}quote`] = [];

    fs.writeFileSync(`${dataPath}/json/${guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
	return enemyFile[name];
}

















commands.registerenemy = new Command({
	desc: "Register an enemy to use in battle!",
	section: "enemies",
	aliases: ['regenemy', 'regenemyment', 'regenemymentary', 'regenemymentarys', 'regenemymentarys'],
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		},
		{
			name: "Main Element",
			type: "Word",
			forced: true
		},
		{
			name: "Level",
			type: "Num",
			forced: true
		},
		{
			name: "HP",
			type: "Num",
			forced: true
		},
		{
			name: "MP",
			type: "Num",
			forced: true
		},
		{
			name: "XP",
			type: "Num",
			forced: true
		},
		{
			name: "Attack",
			type: "Num",
			forced: true
		},
		{
			name: "Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Intelligence",
			type: "Num",
			forced: true
		},
		{
			name: "Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Luck",
			type: "Num",
			forced: true
		},
		{
			name: "Enemy Type (none/miniboss/boss/bigboss/deity)",
			type: "Word",
		},
		{
			name: "Journal Entry",
			type: "Word",
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send(`${message.author.username}, you do not have permission to use this command.`);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);

		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
		if (charFile[args[0]]) {
			message.channel.send(`${args[0]} already exists as a character. I'll add (Enemy) to the end of the name for you.`);
			args[0] += '(Enemy)';
		}

		if (enemyFile[args[0]]) {
			message.channel.send(`${args[0]} already exists, so I'll overwrite them for you.`);
		}

		if (!utilityFuncs.inArray(args[1].toLowerCase(), Elements) || args[1].toLowerCase() == "almighty") return message.channel.send(`${args[1]} is not a valid main element that an enemy can have.`);

		//from arg 1 to arg 12, make sure they are above zero, and change them to 1 if it's the case
		for (let i = 2; i < 14; i++) {
			args[i] = args[i] > 0 ? args[i] : 1;
		}

		if (args[14] && args[14].toLowerCase() != 'none' && !utilityFuncs.inArray(args[14].toLowerCase(), enemyTypes)) return message.channel.send({content: 'Please enter a valid enemy type!', embeds: [enemyTypeList()]});

		let enemyDefs = writeEnemy(message.author, message.guild, args[0], args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11], args[12], args[13], args[14] ? args[14].toLowerCase() : 'none', args[15] ? args[15] : '');
		message.channel.send({content: `${args[0]} has been registered!`, embeds: [briefDescription(enemyDefs)]})
	}
})

commands.journal = new Command({
	desc: "View the journal of an enemy.",
	section: "enemies",
	aliases: ['getenemy', 'getenemyment', 'getenemymentary', 'showenemy', 'showenemyment', 'showenemymentary'],
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[0]]) return message.channel.send('Nonexistant Enemy.');

		if (!enemyFuncs.encounteredEnemy(args[0], message.guild.id)) {
			var noEmbed = new Discord.MessageEmbed()
				.setColor(enemyTypeColors[enemyFile[args[0]].type])
				.setTitle(`${enemyFile[args[0]].name}`)
				.setDescription("This enemy hasn't been seen yet, encounter it in battle to reveal it's stats & affinities.")

			message.channel.send({embeds: [noEmbed]})

			if (utilityFuncs.isAdmin(message)) {
				let DiscordEmbed = longDescription(enemyFile[args[0]], enemyFile[args[0]].level, message.guild.id, message);
				if (enemyFile[args[0]].image && (enemyFile[args[0]].image.includes(`https://`) || enemyFile[args[0]].image.includes(`http://`))) {
					message.author.send({content: `Since you're an administrator, I will send the journal to you.`, embeds: [DiscordEmbed]});
				} else {
					if (enemyFile[args[0]].image != '') {
						message.author.send({content: `Since you're an administrator, I will send the journal to you.`, embeds: [DiscordEmbed], files: [imageFile(enemyFile[args[0]])]});
					} else {
						message.author.send({content: `Since you're an administrator, I will send the journal to you.`, embeds: [DiscordEmbed]});
					}
				}
			}
		} else {
			let DiscordEmbed = longDescription(enemyFile[args[0]], enemyFile[args[0]].level, message.guild.id, message);
			if (enemyFile[args[0]].image && (enemyFile[args[0]].image.includes(`https://`) || enemyFile[args[0]].image.includes(`http://`))) {
				message.channel.send({embeds: [DiscordEmbed]});
			} else {
				if (enemyFile[args[0]].image != '') {
					message.channel.send({embeds: [DiscordEmbed], files: [imageFile(enemyFile[args[0]])]});
				} else {
					message.channel.send({embeds: [DiscordEmbed]});
				}
			}
		}
	}
})

commands.encounter = new Command({
	desc: "Manually set an enemy as encountered.",
	section: "enemies",
	aliases: ['encounterenemy', 'encounterenemyment', 'encounterenemymentary', 'encounterment', 'encountermentary'],
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send(`${message.author.username}, you do not have permission to use this command.`);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[0]]) return message.channel.send('Nonexistant Enemy.');
		
		let settings = setUpSettings(message.guild.id);

		if (!enemyFuncs.encounteredEnemy(args[0], message.guild.id)) {
			settings.encountered.push(args[0]);
			message.channel.send(`${args[0]} has been set as encountered.`);
		} else {
			settings.encountered.splice(settings.encountered.indexOf(args[0]), 1);
			message.channel.send(`${args[0]} has been set as not encountered.`);
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings));
	}
})

commands.updateenemies = new Command({
	desc: "Updates enemies!",
	section: "enemies",
	args: [],
	func: (message, args) => {
		if (!utilityFuncs.RPGBotAdmin(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are not a hardcoded admin of this bot.`);
		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		for (let i in enemyFile) {
			enemyFile[i].name = i;
			if (!enemyFile[i].mainElement) enemyFile[i].mainElement = 'strike';

			enemyFile[i].owner = enemyFile[i].creator;
			delete enemyFile[i].creator;

			enemyFile[i].xp = enemyFile[i].awardxp
			delete enemyFile[i].awardxp;

			// Melee Attack
			enemyFile[i].melee = {
				name: enemyFile[i].melee[0],
				type: enemyFile[i].melee[1],
				pow: 30,
				acc: 95,
				crit: 15
			}

			enemyFile[i].stats = {
				atk: enemyFile[i].atk,
				mag: enemyFile[i].mag,
				prc: enemyFile[i].prc,
				end: enemyFile[i].end,
				chr: enemyFile[i].chr,
				int: enemyFile[i].int,
				agl: enemyFile[i].agl,
				luk: enemyFile[i].luk
			}
			
			// Affinities & Skills
			enemyFile[i].affinities = {
				superweak: enemyFile[i].superweak,
				weak: enemyFile[i].weak,
				resist: enemyFile[i].resist,
				block: enemyFile[i].block,
				repel: enemyFile[i].repel,
				drain: enemyFile[i].drain
			}

			// Quotes
			if (!enemyFile[i].quotes) enemyFile[i].quotes = {};
			for (const k in quoteTypes) {
				enemyFile[i].quotes[`${quoteTypes[k]}quote`] = enemyFile[i][`${quoteTypes[k]}quote`];
			}

			if (!enemyFile[i].lb) enemyFile[i].lb = {};
			else enemyFile[i].lb = {
				"1": enemyFile[i].lb
			}

			for (let k = 1; k < 4; k++) {
				if (enemyFile[i][`lb${k}`]) enemyFile[i].lb[k] = enemyFile[i][`lb${k}`];
			}

			enemyFile[i].type = 'none';
			if (enemyFile[i].miniboss) enemyFile[i].type = 'miniboss';
			if (enemyFile[i].boss) enemyFile[i].type = 'boss';
			if (enemyFile[i].bigboss) enemyFile[i].type = 'bigboss';
			if (enemyFile[i].diety) enemyFile[i].type = 'deity';
		}

		// delete old shit
		setTimeout(function() {
			for (let i in enemyFile) {
				delete enemyFile[i].autoLearn;
				delete enemyFile[i].leaderSkill;
				for (let k of stats) delete enemyFile[i][k];
				for (let k of Affinities) delete enemyFile[i][k];
				for (let k = 1; k < 4; k++) delete enemyFile[i][`lb${k}`];
				for (let k of quoteTypes) delete enemyFile[i][`${k}quote`];
				for (let k of enemyTypes) delete enemyFile[i][k];
			}

			setTimeout(function() {
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));

				// Send an Embed to notify us!
				message.channel.send('Enemies have been updated from an older version to a newer one!');
			}, 300);
		}, 300);
	}
})

commands.assignloot = new Command({
    desc: `Assigns a loot table to an enemy.`,
    section: 'enemies',
    args: [
        {
            name: "Enemy",
            type: "Word",
            forced: true
        },
        {
            name: "Loot",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
        if (!utilityFuncs.isAdmin(message)) return message.channel.send("You do not have sufficient permissions to assign loot to enemies.")
        lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
        enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)

        if (!lootFile[args[1]]) return message.channel.send(`${args[1]} is not a valid loot table name.`);

        if (enemyFile[args[0]]) {
            enemyFile[args[0]].loot = args[1]
            message.channel.send(`${args[0]} now has the loot table ${args[1]}.`)
        } else
            return message.channel.send(`${args[0]} is not a valid enemy.`)

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, 4));
    }
})

commands.deassignloot = new Command({
	desc: `Deassigns a loot table from an enemy.`,
	section: 'enemies',
	args: [
		{
			name: "Enemy",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send("You do not have sufficient permissions to deassign loot from enemies.")
		lootFile = setUpFile(`${dataPath}/json/${message.guild.id}/loot.json`)
		enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)

		if (enemyFile[args[0]]) {
			if (!enemyFile[args[0]].loot || enemyFile[args[0]].loot == "") return message.channel.send(`${args[0]} does not have a loot table.`)
			enemyFile[args[0]].loot == ''
			message.channel.send(`${args[0]} now has no loot table.`)
		} else
			return message.channel.send(`${args[0]} is not a valid enemy.`)

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, 4));
	}
})

commands.changeenemystats = new Command({
	desc: "Change the stats of an enemy.",
	aliases: ['setenemystats', 'changeenemystat', 'setenemystat'],
	section: "enemies",
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		},
		{
			name: "Level",
			type: "Num",
			forced: true
		},
		{
			name: "HP",
			type: "Num",
			forced: true
		},
		{
			name: "MP",
			type: "Num",
			forced: true
		},
		{
			name: "XP",
			type: "Num",
			forced: true
		},
		{
			name: "Attack",
			type: "Num",
			forced: true
		},
		{
			name: "Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Intelligence",
			type: "Num",
			forced: true
		},
		{
			name: "Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Luck",
			type: "Num",
			forced: true
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to use this command.`);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[0]]) return message.channel.send(`${args[0]} is not a valid enemy!`);

		enemyFile[args[0]].level = args[1];
		enemyFile[args[0]].hp = args[2];
		enemyFile[args[0]].mp = args[3];
		enemyFile[args[0]].xp = args[4];

		enemyFile[args[0]].stats = {
			atk: args[5] != 0 ? args[5] : 1,
			mag: args[6] != 0 ? args[6] : 1,
			prc: args[7] != 0 ? args[7] : 1,
			end: args[8] != 0 ? args[8] : 1,
			chr: args[9] != 0 ? args[9] : 1,
			int: args[10] != 0 ? args[10] : 1,
			agl: args[11] != 0 ? args[11] : 1,
			luk: args[12] != 0 ? args[12] : 1
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		message.channel.send({content: `${args[0]}'s stats have been changed!`, embeds: [briefDescription(enemyFile[args[0]])]})
	}
})

commands.enemytype = new Command({
	desc: "Change the type of an enemy.",
	aliases: ['setenemytype', 'changeenemytype', 'setenemytype'],
	section: "enemies",
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		},
		{
			name: "Type (none/miniboss/boss/bigboss/deity)",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to use this command.`);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[0]]) return message.channel.send(`${args[0]} is not a valid enemy!`);

		if (!utilityFuncs.inArray(args[1].toLowerCase(), enemyTypes) && args[1].toLowerCase() != 'none') return message.channel.send(`${args[1]} is not a valid enemy type! Valid types are: ${enemyTypes.join(', ')}`);

		enemyFile[args[0]].type = args[1].toLowerCase();

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		message.channel.send(`${args[0]}'s type has been changed to ${args[1]}!`)
	}
})

commands.enemyjournal = new Command({
	desc: "Change an enemy's journal entry.",
	aliases: ['setenemyjournal', 'changeenemyjournal', 'setenemyjournal'],
	section: "enemies",
	args: [
		{
			name: "Enemy Name",
			type: "Word",
			forced: true
		},
		{
			name: "Journal Entry",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		if (!utilityFuncs.isAdmin(message)) return message.channel.send(`You don't have permission to use this command.`);
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid enemy name! Please enter an actual name.');

		let enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);
		if (!enemyFile[args[0]]) return message.channel.send(`${args[0]} is not a valid enemy!`);

		enemyFile[args[0]].journal = args[1];

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/enemies.json`, JSON.stringify(enemyFile, null, '    '));
		message.channel.send(`${args[0]}'s journal entry has been changed!`)
	}
})
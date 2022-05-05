partyLeader = (party, guild) => {
	let charFile = setUpFile(`${dataPath}/json/${guild}/characters.json`);

	if (party.members[0] && charFile[party.members[0]]) return charFile[party.members[0]].owner;
	return '957671901197647912' // BB's ID lol
}

isPartyLeader = (user, party, guild) => {
	return user.id === partyLeader(party, guild);
}

partyNum = (char, party) => {
	for (const i in party.members) {
		if (party.members[i] == char) return i;
	}

	return null;
}

backupPartyNum = (char, party) => {
	for (const i in party.backup) {
		if (party.backup[i] == char) return i;
	}

	return null;
}

removeFromParty = (party, char) => {
	let pnum = partyNum(char, party);

	if (pnum) {
		party.members.splice(partyNum(char, party), 1);
		return true;
	} else
		return false;
}

commands.makeparty = new Command({
	desc: 'Makes a team to battle with! They can consist of up to 4 members in a main group, and an unlimited amount in backup by default.',
	aliases: ['partymake', 'maketeam', 'teammake', 'registerparty', 'registerteam'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Characters",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	admin: "You don't have permission to make a party.",
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		parties[args[0]] = {
			name: args[0],
			currency: 0,
			members: [],
			backup: [],
			items: {},
			weapons: {},
			armors: {},
			negotiates: {},
			negotiateAllies: {}
		}
		
		for (let i in args) {
			if (i > 0) {
				if (!charFile[args[i]]) return message.channel.send(`${args[i]} is not a valid character!`);

				if (i <= settings.caps.teamsize)
					parties[args[0]].members.push(args[i])
				else
					parties[args[0]].backup.push(args[i])
			}
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[0]} has been assembled! You can now use them in battles!`);
	}
})

commands.partycurrency = new Command({
	desc: 'Set the currency of a party.',
	aliases: ['partysetcurrency', 'teamsetcurrency'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Currency",
			type: "Num",
			forced: true
		}
	],
	admin: "You don't have permission to set the currency of a party.",
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party!`);
		
		if (isNaN(args[1])) return message.channel.send(`${args[1]} is not a valid number!`);

		parties[args[0]].currency = Math.max(0, args[1]);
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[0]}'s currency has been set to ${args[1]}!`);
	}
})


commands.setleader = new Command({
	desc: "Sets a character as the party's leader.",
	aliases: ['partyleader', 'leader', 'makeleader'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Character",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		if (removeFromParty(parties[args[0]], args[1])) {
			parties[args[0]].members.unshift(args[1]);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
			message.channel.send(`${charFile[args[1]]} is now the leader of ${args[0]}!`);
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}
	}
})

commands.changepos = new Command({
	desc: "Changes a characters' position in the party.",
	aliases: ['partyposition', 'position', 'partyorder'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Character",
			type: "Word",
			forced: true
		},
		{
			name: "Position",
			type: "Num",
			forced: true
		}
	],
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (args[2] > parties[args[0]].members.length - 1 || args[2] < 0) return message.channel.send(`${args[2]} is not a valid position!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		if (removeFromParty(parties[args[0]], args[1])) {
			parties[args[0]].members.splice(args[2], 0, args[1]);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
			message.channel.send(`${charFile[args[1]]} is now the leader of ${args[0]}!`);
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}
	}
})

commands.backup = new Command({
	desc: "Makes a character in the party backup and vice versa.",
	aliases: ['makebackup', 'swapbackup'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Character",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		let pnum = partyNum(args[1], parties[args[0]]);
		let bnum = backupPartyNum(args[1], parties[args[0]]);

		if (pnum) {
			parties[args[0]].members.splice(pnum, 1);
			parties[args[0]].backup.push(args[1]);
		} else if (bnum) {
			parties[args[0]].backup.splice(bnum, 1);
			parties[args[0]].members.push(args[1]);
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
	}
})

commands.getparty = new Command({
	desc: "Get Party Info, including rings, pets, weapons and more!",
	aliases: ['partyinfo'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		}
	],
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);

		// Alright, let's get the party!
		let DiscordEmbed = partyDesc(parties[args[0]], message);
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.listparty = new Command({
	desc: "Lists all the parties in the server.",
	aliases: ['listparties', 'listteam', 'listteams'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Leader",
			type: "Ping",
			forced: false
		}
	],
	func: (message, args) => {
		let array = [];
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		const validTypes = ['leader', 'character', 'money', 'item', 'weapon', 'armor', 'pets'];

		if (args[0]) {
			if (args.length % 2 != 0) return message.channel.send('The number of arguments must be even.');

			for (i in args) {
				if (i % 2 == 1) {
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message, settings)
					if (!thingy) return
					if (thingy == 'disabled') {
						args[i-1] = '';
						args[i] = '';
					}
				}
			}
			args = args.filter(arg => arg != '');
			
			for (i in args) {
				if (i % 2 == 0) {
					if (args.filter(arg => arg == args[i]).length > 1) {
						return message.channel.send('You cannot have multiple of the same type.');
					}
				}
			}
		}

		for (const i in parties) {
			let isConditionMet = true;
			for (a in args) {
				if (a % 2 == 1) {
					switch (args[a-1].toLowerCase()) {
						case 'leader':
							args[a] = args[a].toLowerCase();
                            if (args[a].startsWith('<@') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(2, -1));
                                args[a] = user.id;
                            } else if (args[a].startsWith('<@!') && args[a].endsWith('>')) {
                                let user = message.guild.members.cache.find(m => m.id == args[a].slice(3, -1));
                                args[a] = user.id;
                            }
                            if (!args[a].includes('@') && message.mentions.members.size == 0) {
                                let user = message.guild.members.cache.find(m => m.id == args[a]);
                                args[a] = user.id;
                            }
                            if (message.mentions.members.size > 0) {
                                args[a] = message.mentions.members.first().id;
                            }

							isConditionMet = (parties[i].members[0] && charFile[parties[i].members[0]].owner == args[a])
							break;
						case 'character':
							isConditionMet = (parties[i].members.includes(args[a]) || (parties[i].backup && parties[i].backup.includes(args[a])));
							break;
						case 'money':
							args[a] = parseInt(args[a]);
							isConditionMet = (parties[i].currency == args[a]);
							break;
						case 'item':
						case 'weapon':
						case 'armor':
						case 'pets':
							if (args[a-1] == 'pets') args[a-1] = 'negotiateAllie'

							if (args[a].toString().toLowerCase() != 'true' || args[a].toString().toLowerCase() != 'false') {
								isConditionMet = (parties[i][args[a-1]+"s"] && parties[i][args[a-1]+"s"][args[a]]);
							} else if (args[a].toString().toLowerCase() == 'true') {
								isConditionMet = (parties[i][args[a-1]+"s"]);
							} else if (args[a].toString().toLowerCase() == 'false') {
								isConditionMet = (!parties[i][args[a-1]+"s"]);
							}
							break;
					}
					if (isConditionMet == false || isConditionMet == undefined) break;
				}
			}
			if (isConditionMet == false || isConditionMet == undefined) break;

			let members = '';
			
			for (const k in parties[i].members) {
				members += parties[i].members[k];
				if (k <= parties[i].members.length) members += ', ';
			}

			array.push({title: i, desc: members});
		}

		if (array.length == 0) return message.channel.send('No parties found!');

		// Alright, let's get the party!
		listArray(message.channel, array, message.author.id);
	}
})

commands.purgeparty = new Command({
	desc: `Deletes a party. **YOU CANNOT GET IT BACK AFTER DELETION!**`,
	section: 'parties',
	aliases: ['unregisterparty', 'partyunregister', 'partypurge', 'partypurge', 'deleteparty', 'partydelete'],
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party name.`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this party, therefore, you have insufficient permissions to delete it.")

		message.channel.send(`Are you **sure** you want to delete ${parties[args[0]].name}? This will delete the team's pets, items and such. You will NEVER get this back, so please, ensure you _WANT_ to delete this party.\n**Y/N**`);

		var givenResponce = false
		var collector = message.channel.createMessageCollector({ time: 15000 });
		collector.on('collect', m => {
			if (m.author.id == message.author.id) {
				if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
					message.channel.send(`${parties[args[0]].name} has been erased from existance.`)
					delete parties[args[0]]

					chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
					for (let channel in chestFile) {
						for (let chest in chestFile[channel]) {
							if (chestFile[channel][chest].lock[0] == 'party') {
								if (chestFile[channel][chest].lock[1] == args[0]) {
									chestFile[channel][chest].lock = ['none', '']
								}
							}
						}
					}
					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, '    '));

					fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
				} else
					message.channel.send(`${parties[args[0]].name} will not be deleted.`);
				
				givenResponce = true
				collector.stop()
			}
		});
		collector.on('end', c => {
			if (givenResponce == false)
				message.channel.send(`No response given.\n${parties[args[0]].name} will not be deleted.`);
		})
	}
})

commands.chanegepartyname = new Command({
	desc: "Change the name of a party.",
	section: "parties",
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	aliases: ['renameparty'],
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party name.`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this party, therefore, you have insufficient permissions to change it.")

		parties[args[0]].name = args[1];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
		message.channel.send(`${args[0]} has been renamed to ${args[1]}`);
	}
})

commands.partytruename = new Command({
	desc: "Change the true name of a party.",
	section: "parties",
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "New Name",
			type: "Word",
			forced: true
		}
	],
	checkban: true,
	func: (message, args) => {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party name.`);
		
		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this party, therefore, you have insufficient permissions to change it.")

		if (!parties[args[1]]) return message.channel.send(`${args[1]} is not a valid party name.`);
		if (args[0] == args[1]) return message.channel.send(`${args[0]} is already the true name of ${args[1]}.`);
		if (parties[args[1]]) return message.channel.send(`${args[1]} is already a party.`);

		parties[args[1]] = parties[args[0]];
		delete parties[args[0]];
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
		message.channel.send(`${args[0]} has been renamed to ${args[1]}.`);

		chestFile = setUpFile(`${dataPath}/json/${message.guild.id}/chests.json`)
		for (let channel in chestFile) {
			for (let chest in chestFile[channel]) {
				if (chestFile[channel][chest].lock[0] == 'party') {
					if (chestFile[channel][chest].lock[1] == args[0]) {
						chestFile[channel][chest].lock[1] = args[1]
					}
				}
			}
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/chests.json`, JSON.stringify(chestFile, null, '    '));
	}
})
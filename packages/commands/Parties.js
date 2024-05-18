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

mergeParties = (party, party2) => {
	party.currency += party2.currency;

	for (let i in party2.members) {
		if (party.members.length < 4) {
			party.members.push(party2.members[i]);
		} else {
			party.backup.push(party2.members[i]);
		}
	}

	if (party2.backup && party2.backup.length > 0) {
		for (let i in party2.backup) {
			party.backup.push(party2.backup[i]);
		}
	}

	let numeric = ["items", "negotiates"];
	for (let k of numeric) {
		if (party2[k]) {
			for (let i in party2[k]) {
				if (!party[k]) party[k] = {};
				if (!party[k][i]) party[k][i] = 0;
				party[k][i] += party2[k][i];
			}
		}
	}

	let equipment = ['weapons', 'armors', 'negotiateAllies'];
	for (let k of equipment) {
		if (party2[k]) {
			for (let i in party2[k]) {
				let id = i;
				if (party[k][id]) id = `${i}-2`;
				party[k][id] = party2[k][i];
			}
		}
	}
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
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (parties[args[0]]) {
			if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send(`${args[0]} is an existing party and cannot be overwritten.`);
		}

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
	func(message, args, guilded) {
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
	func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		if (removeFromParty(parties[args[0]], args[1])) {
			parties[args[0]].members.unshift(args[1]);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
			message.channel.send(`${charFile[args[1]].name} is now the leader of ${args[0]}!`);
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}
	}
})

commands.addtoparty = new Command({
	desc: "Adds a character to a party.",
	aliases: ['partyadd', 'add', 'addto', 'addtoparty'],
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
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		if (parties[args[0]].members.includes(args[1]) || parties[args[0]].backup.includes(args[1])) return message.channel.send(`${args[1]} is already in the party!`);

		if (parties[args[0]].members.length < settings.caps.teamsize) {
			parties[args[0]].members.push(args[1]);
		} else {
			parties[args[0]].backup.push(args[1]);
		}
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[1]} has been added to ${args[0]}!`);
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
	func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (args[2] > parties[args[0]].members.length - 1 || args[2] < 0) return message.channel.send(`${args[2]} is not a valid position!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")

		if (removeFromParty(parties[args[0]], args[1])) {
			message.react('👍');
			parties[args[0]].members.splice(args[2], 0, args[1]);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}
	}
})

commands.kickfromparty = new Command({
	desc: "Kicks a character from a party.",
	aliases: ['partykick', 'kick'],
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
	func(message, args, guilded) {
		const parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		const party = parties[args[0]]
		const charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!party) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (!isPartyLeader(message.author, party, message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot edit this party.")
		
		if (party.members?.includes(args[1])) {
			message.channel.send(`${args[1]} has been kicked from ${args[0]}!`);
			party.members.splice(party.members.indexOf(args[1]), 1);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		} else if (party.backup?.includes(args[1])) {
			message.channel.send(`${args[1]} has been kicked from ${args[0]}!`);
			party.backup.splice(party.backup.indexOf(args[1]), 1);
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
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
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
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
			if (parties[args[0]].members.length >= settings['caps']['teamsize']) return message.channel.send(`You can only have ${settings['caps']['teamsize']} characters fighting at a time.`);

			parties[args[0]].backup.splice(bnum, 1);
			parties[args[0]].members.push(args[1]);
		} else {
			return message.channel.send(`${args[1]} is not in the party!`);
		}

		message.react('👍');
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
	}
})

commands.splitparty = new Command({
	desc: 'Split one team into 2. You can choose to split items between the two teams or not.',
	aliases: ['partysplit', 'cutparty', 'partycut'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Second Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Position",
			type: "Num",
			forced: true
		},
		{
			name: "Split Items?",
			type: "Word",
			forced: false
		}
	],
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is a nonexistant party!`);
		if (parties[args[1]]) return message.channel.send(`${args[1]} is an existing party and cannot be overwritten.`);
		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You cannot split this party!")

		parties[args[1]] = {
			name: args[1],
			currency: 0,
			members: [],
			backup: [],
			items: {},
			weapons: {},
			armors: {},
			negotiates: {},
			negotiateAllies: {}
		}

		if (!parties[args[0]].members[args[2]]) return message.channel.send(`${args[2]} is an invalid position in team ${parties[args[0]].name}`);

		// Remove members from the 1st party, and then put them in the 2nd.
		for (let i = args[2]; i < parties[args[0]].members.length; i++) {
			parties[args[1]].members.push(parties[args[0]].members[i]);
		}
		parties[args[0]].members.splice(args[2], parties[args[0]].members.length-args[2]);

		// Check for the 4th argument.
		if (args[3]) {
			if (args[3].toLowerCase() === 'y' || args[3].toLowerCase() === 'yes' || args[3].toLowerCase() === 'true') {
				// Split Currency.
				if (parties[args[0]].currency > 1) {
					parties[args[1]].currency = Math.round(parties[args[0]].currency/2);
					parties[args[0]].currency = Math.round(parties[args[0]].currency/2);
				}

				// Split Items.
				for (let i in parties[args[0]].items) {
					if (parties[args[0]].items[i] <= 1) continue;
					parties[args[1]].items[i] = Math.round(parties[args[0]].items[i]/2);
					parties[args[0]].items[i] = Math.round(parties[args[0]].items[i]/2);
				}
			}
		}

		// Save File :)
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[0]} was split into 2 parties! ${args[1]} is the result of this split.`);
	}
})

commands.mergeparty = new Command({
	desc: 'Merge 2 teams into one! This places all members, backup, items, pets and more into one party.',
	aliases: ['partymerge', 'combineparty', 'partycombine'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Second Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Delete Second Party",
			type: "Word",
			forced: false
		}
	],
	func: async(message, args) => {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is a nonexistant party!`);
		if (!parties[args[1]]) return message.channel.send(`${args[1]} is a nonexistant party!`);

		if (!isPartyLeader(message.author, parties[args[0]], message.guild.id)) return message.channel.send(`You cannot merge ${args[0]} with other parties!`);

		mergeParties(parties[args[0]], parties[args[1]]);

		if (args[2]) {
			if (args[2].toLowerCase() === 'yes' || args[2].toLowerCase() === 'y' || args[2].toLowerCase() === 'true') delete parties[args[1]];
		}

		if (!isPartyLeader(message.author, parties[args[1]], message.guild.id)) {
			if (!parties[args[1]].members[0]) return message.channel.send("Nobody... owns this party?");
	
			let user = await client.users.fetch(parties[args[1]].members[0].owner);
			message.channel.send(`${user}, ${message.author} wishes for their party ${args[0]} to be merged with yours, ${args[1]}. Do you accept?`);

			let givenResponce = false;
			let collector = message.channel.createMessageCollector({ time: 15000 });
			collector.on('collect', m => {
				if (m.author.id == charFile[args[1]].owner) {
					if (m.content.toLowerCase() === 'yes' || m.content.toLowerCase() === 'y') {
						m.react('👍');
						message.react('👍');
						fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
					} else
						message.channel.send("The user has declined. Therefore, no team merge will happen.");

					givenResponce = true;
					collector.stop()
				}
			});
			collector.on('end', c => {
				if (!givenResponce) message.channel.send("No response given.\nThe user has declined. Therefore, no team merge will happen.");
			});
		} else {
			message.react('👍');
			fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		}
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
	func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);

		// Alright, let's get the party!
		let DiscordEmbed = partyDesc(parties[args[0]], message);
		message.channel.send({embeds: [DiscordEmbed]});
	}
})

commands.getpartyitems = new Command({
    desc: "Gets a given party's items, in pages if there are too many.",
    section: 'trials',
    aliases: ['searchtrial', 'searchtrials'],
    args: [
		{
			name: "Party ID",
			type: "Word",
			forced: true
		}
    ],
    func(message, args, guilded) {
        let array = [];
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let itemFile = setUpFile(`${dataPath}/json/${message.guild.id}/items.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party.`);
		let partydata = parties[args[0]];

		if (!partydata.items || partydata.items == {}) return message.channel.send(`Team ${partydata.name} has no items.`);

		let itemname;
		let itemtotal;
        for (let i in partydata.items) {
			itemname = i;
			if (itemFile[i]) itemname = `${itemRarityEmoji[itemFile[i].rarity ?? 'common']}**${itemFile[i].name ?? i}**`

			itemtotal = "Unsellable.";
			if (itemFile[i] && itemFile[i].cost) itemtotal = `Totals up to ${itemFile[i].cost*partydata.items[i]}${setUpSettings(message.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}`;

			array.push({title: itemname, desc: `Owns ${partydata.items[i]}, ${itemtotal}`});
		}

        if (array.length == 0) return message.channel.send(`Team ${partydata.name} has no items.`)
        
        listArray(message.channel, array, message.author.id);
    }
})

commands.listparty = new Command({
	desc: "Lists all the parties in the server.",
	aliases: ['listparties', 'listteam', 'listteams'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Type #1, Variable #1",
			type: "Word",
			forced: false,
			multiple: true
		}
	],
	func(message, args, guilded) {
		let array = [];
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		const validTypes = ['leader', 'character', 'money', 'item', 'weapon', 'armor', 'pets'];

		if (args[0]) {
			if (args.length % 2 != 0) {
				//check if the last argument exists in validTypes
				if (validTypes.includes(args[args.length - 1])) {
					return message.channel.send(`The **${args[args.length - 1]}** type is missing a variable.`);
				} else {
					return message.channel.send(`**${args[args.length - 1].charAt(0).toUpperCase() + args[args.length - 1].slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
				}
			}

			for (i in args) {
				if (i % 2 == 1) {
					let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message)
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
			if (isConditionMet == false || isConditionMet == undefined) continue;

			let members = '';
			
			if (parties[i]?.members.length > 0) {
				members = `*Members:* ${parties[i].members.join(', ')}`;
			}
			if (parties[i]?.backup.length > 0) {
				if (members != '') members += `\n`;
				members += `*Backup:* ${parties[i].backup.join(', ')}`;
			}
			if (members.length == 0) {
				members = 'No members';
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
	func(message, args, guilded) {
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
	aliases: ['renameparty', 'partyname'],
	func(message, args, guilded) {
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
	func(message, args, guilded) {
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

commands.useweapon = new Command({
    desc: "Stashes a weapon from the party into the Character's weapon inventory.",
	aliases: ['claimweapon', 'takeweapon', 'grabweapon', 'stealweapon'],
    section: 'items',
	checkban: true,
    args: [
        {
            name: "Party",
            type: "Word",
            forced: true
        },
        {
            name: "Character",
            type: "Word",
            forced: true
        },
        {
            name: "Weapon",
            type: "Word",
            forced: true
        }
    ],
    func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party name.`);

		if (parties[args[0]].members.includes(args[1]) || parties[args[0]].backup.includes(args[1])) {
			let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
			let char = charFile[args[1]];

			if (!char.weapons) char.weapons = {};

			if (parties[args[0]].weapons && parties[args[0]].weapons[args[2]]) {
				char.weapons[args[2]] = objClone(parties[args[0]].weapons[args[2]]);
				delete parties[args[0]].weapons[args[2]];

				message.channel.send(`${char.name} has claimed the ${args[2]}.`);
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));
			} else {
				return message.channel.send(`Team ${parties[args[0]].name} has not got a ${args[2]}.`);
			}
		} else {
			return message.channel.send(`${args[1]} is not in Team ${parties[args[0]].name}`);
		}
    }
})

commands.usearmor = new Command({
    desc: "Staches an armor from the party into the Character's armor inventory.",
	aliases: ['claimarmor', 'takearmor', 'grabarmor', 'stealarmor'],
    section: 'items',
	checkban: true,
    args: [
        {
            name: "Party",
            type: "Word",
            forced: true
        },
        {
            name: "Character",
            type: "Word",
            forced: true
        },
        {
            name: "Armor",
            type: "Word",
            forced: true
        }
    ],
    func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		if (!parties[args[0]]) return message.channel.send(`${args[0]} is not a valid party name.`);

		if (parties[args[0]].members.includes(args[1]) || parties[args[0]].backup.includes(args[1])) {
			let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
			let char = charFile[args[1]];

			if (!char.armors) char.armors = {};

			if (parties[args[0]].armors && parties[args[0]].armors[args[2]]) {
				char.armors[args[2]] = objClone(parties[args[0]].armors[args[2]]);
				delete parties[args[0]].armors[args[2]];

				message.channel.send(`${char.name} has claimed the ${args[2]}.`);
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));
			} else {
				return message.channel.send(`Team ${parties[args[0]].name} has not got a ${args[2]}.`);
			}
		} else {
			return message.channel.send(`${args[1]} is not in Team ${parties[args[0]].name}`);
		}
    }
})

commands.putweapon = new Command({
    desc: "Stashes a weapon from a character into the party's weapon inventory.",
	aliases: ['placeweapon', 'stashweapon'],
    section: 'items',
	checkban: true,
    args: [
        {
            name: "Character",
            type: "Word",
            forced: true
        },
        {
            name: "Party",
            type: "Word",
            forced: true
        },
        {
            name: "Weapon",
            type: "Word",
            forced: true
        }
    ],
    func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		if (!parties[args[1]]) return message.channel.send(`${args[1]} is not a valid party name.`);

		if (parties[args[1]].members.includes(args[0]) || parties[args[1]].backup.includes(args[0])) {
			let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
			let char = charFile[args[0]];

			if (!char.weapons) char.weapons = {};
			if (!parties[args[1]].weapons) parties[args[1]].weapons = {};

			if (char.weapons[args[2]]) {
				parties[args[1]].weapons[args[2]] = objClone(char.weapons[args[2]]);
				delete char.weapons[args[2]];

				message.channel.send(`${char.name} has placed the ${args[2]} back into the party's inventory.`);
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));
			} else {
				return message.channel.send(`${char.name} does not possess a ${args[2]}.`);
			}
		} else {
			return message.channel.send(`${args[0]} is not in Team ${parties[args[0]].name}`);
		}
    }
})

commands.putarmor = new Command({
    desc: "Stashes a weapon from a character into the party's weapon inventory.",
	aliases: ['placearmor', 'stasharmor'],
    section: 'items',
	checkban: true,
    args: [
        {
            name: "Character",
            type: "Word",
            forced: true
        },
        {
            name: "Party",
            type: "Word",
            forced: true
        },
        {
            name: "Weapon",
            type: "Word",
            forced: true
        }
    ],
    func(message, args, guilded) {
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		if (!parties[args[1]]) return message.channel.send(`${args[1]} is not a valid party name.`);

		if (parties[args[1]].members.includes(args[0]) || parties[args[1]].backup.includes(args[0])) {
			let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);
			let char = charFile[args[0]];

			if (!char.armors) char.armors = {};
			if (!parties[args[1]].armors) parties[args[1]].armors = {};

			if (char.armors[args[2]]) {
				parties[args[1]].armors[args[2]] = objClone(char.armors[args[2]]);
				delete char.armors[args[2]];

				message.channel.send(`${char.name} has placed the ${args[2]} back into the party's inventory.`);
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, 4));
				fs.writeFileSync(`${dataPath}/json/${message.guild.id}/characters.json`, JSON.stringify(charFile, null, 4));
			} else {
				return message.channel.send(`${char.name} does not possess a ${args[2]}.`);
			}
		} else {
			return message.channel.send(`${args[0]} is not in Team ${parties[args[0]].name}`);
		}
    }
})

commands.setpet = new Command({
	desc: "Sets this party's pet. Pets can help with extra damage output, defense of even healing. Essentially, they're lesser characters.",
	aliases: ['usepet'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Pet Name",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		let party = parties[args[0]];
		if (!party) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!isPartyLeader(message.author, party, message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this party, therefore, you have insufficient permissions to change it.");
		if (!party.negotiateAllies || party.negotiateAllies == {}) return message.channel.send(`Team ${party.name} has no pets!\n\n**[NOTICE]**\nTo obtain a pet, try pacifying the enemy in battle. If they can be pacified, enough of them being pacified will cause them to be recruited as pets.`);
		if (!party.negotiateAllies[args[1]]) return message.channel.send(`${args[1]} is not a pet that Team ${party.name} has recruited.`);

		party.curpet = args[1];

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${party.negotiateAllies[args[1]].nickname} is now the pet to be used by Team ${args[0]}!`);
	}
})

commands.petnickname = new Command({
	desc: "Changes this pet's nickname to something you'd prefer.",
	aliases: ['nickpet', 'petnick'],
	section: "parties",
	checkban: true,
	args: [
		{
			name: "Party Name",
			type: "Word",
			forced: true
		},
		{
			name: "Pet Name",
			type: "Word",
			forced: true
		},
		{
			name: "Nickname",
			type: "Word",
			forced: true
		}
	],
	func(message, args, guilded) {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		let party = parties[args[0]];
		if (!party) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!isPartyLeader(message.author, party, message.guild.id) && !utilityFuncs.isAdmin(message)) return message.channel.send("You do not own this party, therefore, you have insufficient permissions to change it.");
		if (!party.negotiateAllies || party.negotiateAllies == {}) return message.channel.send(`Team ${party.name} has no pets!\n\n**[NOTICE]**\nTo obtain a pet, try pacifying the enemy in battle. If they can be pacified, enough of them being pacified will cause them to be recruited as pets.`);
		if (!party.negotiateAllies[args[1]]) return message.channel.send(`${args[1]} is not a pet that Team ${party.name} has recruited.`);

		party.negotiateAllies[args[1]].nickname = args[2];

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[1]}'s nickname is now "${args[2]}"!`);
	}
})
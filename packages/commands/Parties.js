partyLeader = (party, guild) => {
	let charFile = setUpFile(`${dataPath}/json/${guild}/characters.json`);

	if (party.members[0] && charFile[party.members[0]]) return charFile[party.members[0]].owner;
	return '957671901197647912' // BB's ID lol
}

isPartyLeader = (user, party, guild) => {
	return user.id === partyLeader(party);
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
	func: (message, args) => {
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (parties[args[0]] && !utilityFuncs.RPGBotAdmin(message.author.id)) {
			if (isPartyLeader(message.author, parties[args[0]], message.guild.id))
				return message.channel.send('Not even the party leader can overwrite this party!')
			else
				return message.channel.send("You can't overwrite this party.")
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

				if (i <= 4)
					parties[args[0]].members.push(args[i])
				else
					parties[args[0]].backup.push(args[i])
			}
		}

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${args[0]} has been assembled! You can now use them in battles!`);
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
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (parties[args[0]] && !utilityFuncs.RPGBotAdmin(message.author.id)) {
			if (!isPartyLeader(message.author, parties[args[0]], message.guild.id)) return message.channel.send("You cannot edit this party.")
		}

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
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (parties[args[0]] && !utilityFuncs.RPGBotAdmin(message.author.id)) {
			if (!isPartyLeader(message.author, parties[args[0]], message.guild.id)) return message.channel.send("You cannot edit this party.")
		}

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
		let settings = setUpSettings(message.guild.id);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);
		let charFile = setUpFile(`${dataPath}/json/${message.guild.id}/characters.json`);

		if (!parties[args[0]]) return message.channel.send(`${args[0]} is an invalid party!`);
		if (!charFile[args[1]]) return message.channel.send(`${args[1]} is an invalid character!`);

		if (parties[args[0]] && !utilityFuncs.RPGBotAdmin(message.author.id)) {
			if (!isPartyLeader(message.author, parties[args[0]], message.guild.id)) return message.channel.send("You cannot edit this party.")
		}

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
	desc: "Get Party Info, including rings, pets, weapons and more!",
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
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`);

		let array = [];
		for (let i in parties) {
			let members = '';
			
			for (const k in parties[i].members) {
				members += parties[i].members[k];
				if (k <= parties[i].members.length) members += ', ';
			}

			array.push({title: i, desc: descTxt});
		}

		// Alright, let's get the party!
		listArray(message.channel, array, message.author.id);
	}
})
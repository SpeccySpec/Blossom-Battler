partyLeader = (party, guild) => {
	let charFile = setUpFile(`${dataPath}/json/${guild}/characters.json`);

	if (party.members[0] && charFile[party.members[0]]) return charFile[party.members[0]].owner;
	return '957671901197647912' // BB's ID lol
}

isPartyLeader = (user, party, guild) => {
	return user.id === partyLeader(party);
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
			type: "Num",
			forced: true,
			multiple: true
		},
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
			armors: {}
		}
		
		for (let i in args) {
			if (!charFile[args[i]]) return message.channel.send(`${args[i]} is not a valid character!`);

			if (i > 0) {
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
			name: "Character",
			type: "Num",
			forced: true
		},
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

		let inParty = false;
		for (let i in parties[args[0]].members) {
			if (charFile[parties[args[0]].members[i]] && parties[args[0]].members[i].toLowerCase() == args[1].toLowerCase()) {
				inParty = true;
				parties[args[0]].members.splice(i, 1);
			}
		}

		if (!inParty) return message.channel.send(`${args[1]} is not in the party!`);
		parties[args[0]].members.unshift(args[1]);

		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		message.channel.send(`${charFile[args[1]]} is now the leader of ${args[0]}!`);
	}
})
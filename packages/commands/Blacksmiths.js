// Alright alright... I'll implement blacksmiths.
commands.openblacksmith = new Command({
	desc: 'Opens a blacksmiths with <Name> at <Channel>. They should only be able to refine specific equipments. Set to "all" to ignore this.',
	aliases: ['registerblacksmiths', 'blacksmithopen'],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
		{
			name: "Channel",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Equipments",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "shops",
	checkban: true,
	admin: "Only admins can create blacksmiths!",
	func(message, args, guilded) {
		const bsName = args[0];
		const trueName = bsName.toLowerCase();
		const bsID = args[1].id;
		const blacksmiths = setUpFile(`${dataPath}/json/${message.guild.id}/${bsID}/blacksmiths.json`, true);

		if (blacksmiths[trueName]) return void message.channel.send('A blacksmiths with the ID of `' + trueName + '` already exists!');

		let blacksmith = {name: bsName}

		const weapons = setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`, true);
		const armors = setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`, true);

		if (args[2] != "all") {
			blacksmith.refine = [];

			for (let i = 2; i < args.length; i++) {
				if (weapons[args[i]])
					blacksmith.refine.push(["weapon", args[i]]);
				else if (armors[args[i]])
					blacksmith.refine.push(["armor", args[i]]);
				else
					return void message.channel.send(`${args[i]} is not a valid equipment!`);
			}

			if (blacksmith.refine == []) {
				message.channel.send("You never set any items to be refined... I'll set it to ''all'' for you!");
				delete blacksmith.refine;
			}
		}

		blacksmiths[trueName] = blacksmith;
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${bsID}/blacksmiths.json`, JSON.stringify(blacksmiths, '	', 4));

		message.channel.send(`The blacksmiths **${bsName}** is ready!`)

		if (blacksmith.refine) {
			listArray(message.channel, blacksmith.refine.map((equipment) => {
				return {
					title: weapons[equipment[1]].name,
					desc: weapons[equipment[1]].desc ?? "No description provided.",
					inline: true
				}
			}), message.author)
		} else {
			let DiscordEmbed = new Discord.MessageEmbed()
				.setTitle(blacksmith.name)
				.setDescription("This blacksmiths has experience with anything!");
			message.channel.send({embeds: [DiscordEmbed]});
		}
	}
})

commands.enterblacksmiths = new Command({
	desc: "Enter the shop named <Name>!",
	aliases: ["enterbs", "useblacksmiths", "usebs"],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
		{
			name: "Party",
			type: "Word",
			forced: true
		}
	],
	section: "shops",
	checkban: true,
	func(message, args, guilded) {
		let blacksmiths = setUpFile(`${dataPath}/json/${message.guild.id}/${message.channel.id}/blacksmiths.json`, true);
		let parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`, true)
		let name = vars[0].toLowerCase();
		let party = vars[1];
		
		if (!blacksmiths[name]) return void message.channel.send(`A blacksmiths with the ID of ${name} does not exist in this channel.`);
		if (!parties[party]) return void message.channel.send(`Team ${party} does not exist!`);
		if (!isPartyLeader(message.author, parties[party], message.guild.id)) return void message.channel.send("Only the party leader can enter a blacksmiths!")

//		new Blacksmiths(message.channel, message.author.id, shop, party).startup(message)
	}
})
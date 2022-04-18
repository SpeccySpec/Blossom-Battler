// Handle Skills
commands.registerchar = new Command({
	desc: `Register a character to use in-battle! Characters can learn skills, use items, and initiate in combat, along with wayyy more!.`,
	aliases: ['registercharacter', 'makechar', 'regchar', 'regcharacter', 'charmake'],
	section: "characters",
	args: [
		{
			name: "Character Name",
			type: "Word",
			forced: true
		},
		{
			name: "Main Element",
			type: "Word",
			forced: false
		},
		{
			name: "Base HP",
			type: "Num",
			forced: true
		},
		{
			name: "Base MP",
			type: "Num",
			forced: true
		},
		{
			name: "Base Strength",
			type: "Num",
			forced: true
		},
		{
			name: "Base Magic",
			type: "Num",
			forced: true
		},
		{
			name: "Base Perception",
			type: "Num",
			forced: true
		},
		{
			name: "Base Endurance",
			type: "Num",
			forced: true
		},
		{
			name: "Base Charisma",
			type: "Num",
			forced: true
		},
		{
			name: "Base Inteligence",
			type: "Num",
			forced: true
		},
		{
			name: "Base Agility",
			type: "Num",
			forced: true
		},
		{
			name: "Base Luck",
			type: "Num",
			forced: true
		},
	],
	func: (message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid character name! Please enter an actual name.');
		
		let charFile = setUpFile(`${dataPath}/json/${guild.id}/characters.json`);
		if (charFile[args[0]]) {
			if (charFile[args[0]].owner != message.author.id) {
				return message.channel.send(`${args[0]} already exists, and you don't own them. You cannot overwrite them.`);
			} else {
				return message.channel.send(`${args[0]} already exists, so I'll overwrite them for you.`);
			}
		}

		if (!utilityFuncs.inArray(args[1].toLowerCase(), Elements)) message.channel.send({content: 'Please enter a valid element for **Main Element!**', embeds: [elementList()]});

		if ((args[2] + args[3]) > 70) return message.channel.send(`The maximum total points for HP and MP is 70! Currently, you have ${args[2]+args[3]}.`);

		let bst = 0;
		for (let i = 4; i < args.length-1; i++) {
			if (args[i]) {
				if (args[i] <= 0) return message.channel.send("You can't have a stat that is less than 0!");
				if (args[i] > 10) return message.channel.send("You can't have a stat that is more than 10!");
				bst += args[i];
			}
		}

		if (bst > 45) return message.channel.send(`45 is the maximum amount of points across stats! Currently, you have ${bst}.`)
		if (bst < 30) message.channel.send(`${bst}BST is... sort of concerning. I-I won't stop you.`)

		let charDefs = writeChar(message.author, message.guild, args[0], args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9], args[10], args[11]);
		message.channel.send({content: `${args[0]} has been registered!`, embeds: [briefDescription(charDefs)]})
	}
})
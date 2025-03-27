//////////////////////////////////////
// Gee this is gonna be a nightmare //
//////////////////////////////////////

let setupElements = (server) => {
    let elemFile = setUpFile(`${dataPath}/json/${server}/elements.json`);

    if (Object.keys(elemFile).length === 0) {
        for (let element of Elements) {
            elemFile[element] = {
                name: element.charAt(0).toUpperCase() + element.slice(1),
                emoji: elementEmoji[element],
                color: elementColors[element],
                techs: element,
            }
        }

        fs.writeFileSync(`${dataPath}/json/${server}/elements.json`, JSON.stringify(elemFile, null, '    '));
    }

    return elemFile;
}



// List the server's current elements.
commands.listelements = new Command({
	desc: 'Lists all the elements in this server at the moment.',
	section: "skills",
	aliases: ['listelement', 'elementlist'],
	args: [],
	func(message, args, guilded) {
		let elemFile = setupElements(message.guild.id);
		let elementList = '';
        for (let i in elemFile) {
			elementList += `${elemFile[i].emoji}**${elemFile[i].name}**`;

            if (elemFile[i].replacements) {
                elementList += " (Includes: "
                for (let k in elemFile[i].replacements) {
                    elementList += `**${elemFile[i].replacements[k]}**`
                    if (k < elemFile[i].replacements.length-1) elementList += ", "
                }
                elementList += ")"
            }

            elementList += "\n"
        }

		const DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle('List of usable elements:')
            .setDescription(elementList);
		message.channel.send({embeds: [DiscordEmbed]})
	}
})

commands.removeelement = new Command({
	desc: 'Remove the element specified. Must specify a replacement element for spells.',
	section: "skills",
	aliases: ['killelement', 'emptyelement'],
	args: [
		{
			name: "Element",
			type: "Word",
			forced: true
		},
		{
			name: "Replacement",
			type: "Word",
			forced: true
		}
    ],
	func(message, args, guilded) {
		let elemFile = setupElements(message.guild.id);
        let i = args[0].toLowerCase();
        let i2 = args[1].toLowerCase();

        if (!elemFile[i]) return message.channel.send(i + " does not exist.");
        if (!elemFile[i2]) return message.channel.send(i2 + " does not exist.");
        if (Object.keys(elemFile).length <= 1) return message.channel.send("You cannot be left with no elements!");
        delete elemFile[i];
		if (!elemFile[i2].replacements) elemFile[i2].replacements = [];
        elemFile[i2].replacements.push(i);

        // If any replacements involved the original, let's set them to this new replacement.
        let element;
        for (let k in elemFile) {
            element = elemFile[k];
            if (element.replacements) {
                for (let rep of element.replacements) {
                    if (rep == i) rep = i2;
                }
            }
        }

        message.channel.send(`**${i}** was deleted.`);
        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/elements.json`, JSON.stringify(elemFile, null, '    '));
	}
})

commands.renameelement = new Command({
	desc: "Rename the element specified. **This changes the display name, not the true name.** You will have to remove and recreate this element to change it's true name.",
	section: "skills",
	aliases: ['nameelement', 'elementrename'],
	args: [
		{
			name: "Current Element",
			type: "Word",
			forced: true
		},
		{
			name: "New Element",
			type: "Word",
			forced: true
		}
    ],
	func(message, args, guilded) {
		let elemFile = setupElements(message.guild.id);
        let i = args[0].toLowerCase();

        if (!elemFile[i]) return message.channel.send(i + " does not exist.");
        elemFile[i].name = args[1];

        message.channel.send(`**${i}** was renamed to ${args[1]}.`);
        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/elements.json`, JSON.stringify(elemFile, null, '    '));
	}
})
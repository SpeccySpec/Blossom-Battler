// Open Shop
// Can't be done before items are created
// Leave this to me - Spectra
commands.openshop = new Command({
	desc: 'Opens a shop with <Name> at <Channel>, selling all of the <Items> listed!',
	aliases: ['registershop', 'shopopen'],
	args: [
		{
			name: "Name",
			type: "Word",
			forced: true
		},
		{
			name: "Channel",
			type: "Channel",
			forced: true
		},
		{
			name: "Items",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "shops",
	func: (message, args) => {
		if (utilityFuncs.isBanned(message.author.id, message.guild.id)) return message.channel.send(`${message.author.username}, you are banned from using this bot.`);
		let shopData = setUpFile(`${dataPath}/json/${message.guild.id}/shops.json`);
        if (!utilityFuncs.isAdmin(message)) return message.channel.send("You lack sufficient permissions, I'm so sorry!");

        if (!args[1]) {
            const DiscordEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${prefix}openshop`)
				.setDescription(commands.openshop.desc)
            return message.channel.send({embeds: [DiscordEmbed]})
        }
		
		message.channel.send("I just realised... I can't do this without any defined items!")
	}
})
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
			type: "ID",
			forced: true
		},
		{
			name: "Items",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "items",
	func: (message, args) => {
		let shopData = setUpFile(`${dataPath}/json/${message.guild.id}/shops.json`);
		if (utilityFuncs.isBanned(message.author.id, message.guild.id) && !utilityFuncs.RPGBotAdmin(message.author.id)) return message.channel.send("I've been told you were banned from using the RPG sections of the bot, sorry!")
        if (!message.member.permissions.serialize().ADMINISTRATOR) return message.channel.send("You lack sufficient permissions, I'm so sorry!");

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
// Open Shop
// Can't be done before items are created
// Leave this to me - Spectra
// The above comment did not age well - Maiori
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
			type: "RealChannel",
			forced: true
		},
		{
			name: "Can Sell?",
			type: "YesNo"
		},
		{
			name: "Type, Item #1",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "shops",
	checkban: true,
	admin: "Only admins can create shops!",
	func(message, args) {
		const shopName = args[0]
		const trueName = shopName.toLowerCase()
		const shopid = args[1].id
		const shopData = setUpFile(`${dataPath}/json/${message.guild.id}/${shopid}/shops.json`);
		if (shopData[trueName])
			return void message.channel.send('A shop with the ID of `' + trueName + '` already exists!');

		const files = {
			item: setUpFile(`${dataPath}/json/${message.guild.id}/items.json`, true),
			weapon: setUpFile(`${dataPath}/json/${message.guild.id}/weapons.json`, true),
			armor: setUpFile(`${dataPath}/json/${message.guild.id}/armors.json`, true)
		}

		const shop = {
			name: shopName,
			cansell: args[2] ?? false,
			items: []
		}

		let itembuild = {};
		for (let i = 3; i < args.length; i++) {
			if (i % 2 == 1) {
				const itemtype = args[i].toLowerCase()
				if (!['item', 'weapon', 'armor'].includes(itemtype))
					return void message.channel.send(`${itemtype} is not a valid item type! Use either ''Item'', ''Weapon'' or ''Armor''.`);
				itembuild.type = itemtype
			} else {
				const item = args[i]
				const info = files[itembuild.type][item]
				if (!info)
					return void message.channel.send(`${item} is an invalid ${itembuild.type}!`)
				itembuild.item = item
				itembuild.cost = info.cost ?? 5000;
				if (info.desc)
					itembuild.desc = `${(info.desc.length > 100)
						? `${info.desc.slice(0, 97)}...`
						: info.desc ?? "No description provided."}`
				shop.items.push(itembuild);
				itembuild = {};
			}
		}

		shopData[trueName] = shop;
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${shopid}/shops.json`, JSON.stringify(shopData, '	', 4));

		message.channel.send(`The shop **${shopName}** is ready!`)
		listArray(message.channel, shop.items.map((item) => {
			return {
				title: item.item,
				desc: item.desc ?? "No description provided.",
				inline: true
			}
		}), message.author)
	}
})

openshops = {}

makeList = (options, customId, placeholder) => {
	return new Discord.MessageSelectMenu({
		customId, placeholder, options,
		maxValues: Math.min(options.length, 25)
	})
}

class Shop {
	constructor(channel, userid, shop, party) {
		this.channel = channel
		this.id = userid
		this.shop = shop
		this.party = party
		openshops[this.id] = this
	}

	startup(message) {
		const [embeds, components] = this.main()
		message.channel.send({embeds, components})
	}

	setupEmbed(embed, components, components2) {
		if (this.shop.color)
			embed.color = this.shop.color
		let collector = makeCollector(this.channel, {
			filter: ({user}) => user.id == this.id || utilityFuncs.RPGBotAdmin(user.id)
		})
		collector.on("collect", async i => {
			if (!this[i.customId])
				return
			const [embeds, components] = this[i.customId](i)
			i.message.edit({embeds, components})
			i.deferUpdate()
		})
		const toreturn = [
			[new Discord.MessageEmbed(embed)],
			[new Discord.MessageActionRow({components})]
		]
		if (components2)
			toreturn[1].push(new Discord.MessageActionRow({components: components2}))
		return toreturn
	}

	main() {
		return this.setupEmbed({
			title: `Welcome to ${this.shop.name}!`,
			description: "What will you do here?"
		}, [
			makeButton("Buy", "👜", "green", null, null, this.shop.items.length == 0),
			makeButton("Sell", "<:token:981579648993460355>", "gray", null, null, this.party.items != 0),
			makeButton("Talk", statusEmojis.silence, "blue", null, null, !this.shop.dialogues?.length > 0),
			makeButton("Exit", "<:boot:995268449154629699>", "red")
		])
	}

	buy() {
		return this.setupEmbed({
			title: `What will you buy?`,
			description: `Choose using the list below.\nYou have ${this.currency}.`
		}, [
			makeList(this.shop.items.map(({type, item, desc}) => ({
				label: item,
				description: desc?.slice(0, 100) ?? "No description provided.",
				value: item
			})), "buy2", "Choose the items to buy")
		], [
			makeButton('Back', '◀️', 'grey', null, "main")
		])
	}

	buy2(i) {
		
	}

	exit() {
		openshops[this.id] = undefined
		return this.setupEmbed({
			title: "You left the shop.",
			description: "Farewell!"
		}, [
			makeButton("Buy", "👜", "green", null, null, true),
			makeButton("Sell", "<:token:981579648993460355>", "gray", null, null, true),
			makeButton("Talk", statusEmojis.silence, "blue", null, null, true),
			makeButton("Exit", "<:boot:995268449154629699>", "red", null, null, true)
		])
	}
}

commands.getshop = new Command({
	desc: "Enter the shop named <Name>!",
	aliases: ["entershop"],
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
	func(message, args) {
		const shopName = args[0]
		const trueName = shopName.toLowerCase()
		const shopid = message.channel.id
		const shop = setUpFile(`${dataPath}/json/${message.guild.id}/${shopid}/shops.json`)[trueName]
		if (!shop)
			return void message.channel.send(`A shop with the ID of ${trueName} does not exist!`)
		const partyName = args[1]
		const party = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)[partyName]
		if (!party)
			return void message.channel.send(`${partyName} is an invalid party!`)
		if (!isPartyLeader(message.author, party, message.guild.id))
			return void message.channel.send("Only the party leader can enter a shop!")
		new Shop(message.channel, message.author.id, shop, party).startup(message)
	}
})

commands.setshopcolor = new Command({
	desc: "Sets the color of the shop, supports either #RRGGBB or element names.",
	args: [
		{
			name: "Shop name",
			type: "Word",
			forced: true
		},
		{
			name: "Channel",
			type: "RealChannel",
			forced: true
		},
		{
			name: "Color",
			type: "Word",
			forced: true
		}
	],
	section: "shops",
	checkban: true,
	admin: "Only admins can change a shop's color!",
	func(message, args) {
		const trueName = args[0].toLowerCase()
		const shopid = args[1].id
		const shopPath = `${dataPath}/json/${message.guild.id}/${shopid}/shops.json`
		const shopData = setUpFile(shopPath)
		const shop = shopData[trueName]
		if (!shop)
			return void message.channel.send(`A shop with the ID of ${trueName} does not exist!`)
		const color = args[2].toLowerCase()
		shop.color = elementColors[color] ?? color
		fs.writeFileSync(shopPath, JSON.stringify(shopData, '	', 4))
		message.react('👍')
	}
})
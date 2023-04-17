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

//		if (shopData[trueName])
//			return void message.channel.send('A shop with the ID of `' + trueName + '` already exists!');

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

makeList = (options, customId, placeholder, maxvalues) => {
	return new Discord.MessageSelectMenu({
		customId, placeholder, options,
		maxValues: maxvalues ?? Math.min(options.length, 25)
	})
}

class Shop {
	constructor(channel, userid, shop, party) {
		this.channel = channel
		this.id = userid
		this.shop = shop
		this.party = party
		openshops[this.id] = this
		this.shopList = makeList(this.shop.items.map(({type, cost, item, desc}) => ({
			label: `${item} (Costs ${cost})`,
			description: desc?.slice(0, 100) ?? "No description provided.",
			value: `${item}-${type}s-${cost}`
		})), "buy2", "Choose the items to buy")
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
		const cansell = (!this.shop.cansell)
			|| (Object.keys(this.party.items).length == 0
			&& Object.keys(this.party.armors).length == 0
			&& Object.keys(this.party.weapons).length == 0)
		return this.setupEmbed({
			title: `Welcome to ${this.shop.name}!`,
			description: "What will you do here?"
		}, [
			makeButton("Buy", "👜", "green", null, null, this.shop.items.length == 0),
			makeButton("Sell", "<:token:981579648993460355>", "gray", null, null, cansell),
			makeButton("Talk", statusEmojis.silence, "blue", null, null, !this.shop.dialogues?.length > 0),
			makeButton("Exit", "<:boot:995268449154629699>", "red")
		])
	}

	buy() {
		return this.setupEmbed({
			title: "What will you buy?",
			description: `Choose using the list below.\nYou have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
		}, [
			this.shopList
		], [
			makeButton('Back', '◀️', 'grey', null, "main")
		])
	}

	buy2(i, force) {
		let cost = 0
		const stuff = {
			items: [],
			armors: [],
			weapons: []
		}
		for (const rawitemdata of i.values) {
			const item = rawitemdata.split("-")
			cost += parseInt(item.pop())
			stuff[item.pop()].push(item.join("-"))
		}
		if (stuff.armors.length == 0 && stuff.weapons.length == 0 && !force) {
			const items = JSON.stringify(stuff.items)
			return this.setupEmbed({
				title: "How many of these items do you want to buy?",
				description: `Choose the amount using the list below.\nYou have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
			}, [
				makeList([
					{label: "1", value: `{"items":${items},"cost":${cost},"amount":1}`},
					{label: "2", value: `{"items":${items},"cost":${cost},"amount":2}`},
					{label: "3", value: `{"items":${items},"cost":${cost},"amount":3}`},
					{label: "4", value: `{"items":${items},"cost":${cost},"amount":4}`},
					{label: "5", value: `{"items":${items},"cost":${cost},"amount":5}`},
					{label: "10", value: `{"items":${items},"cost":${cost},"amount":10}`},
					{label: "25", value: `{"items":${items},"cost":${cost},"amount":25}`},
					{label: "50", value: `{"items":${items},"cost":${cost},"amount":50}`},
					{label: "100", value: `{"items":${items},"cost":${cost},"amount":100}`},
				], "buy3", "Choose the amount of items you want to buy", 1)
			], [
				makeButton('Back', '◀️', 'grey', null, "buy")
			])
		}
		if (cost > this.party.currency)
			return this.setupEmbed({
				title: "You can't afford that!",
				description: `The selected items costed **${cost}** while you have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
			}, [
				this.shopList
			], [
				makeButton('Back', '◀️', 'grey', null, "main")
			])
		this.party.currency -= cost
		const partyitems = this.party.items
		for (const item of stuff.items)
			if (!partyitems[item])
				partyitems[item] = 1
			else
				partyitems[item] += 1
		const armors = setUpFile(`${dataPath}/json/${i.message.guild.id}/armors.json`)
		const partyarmors = this.party.armors
		for (const armor of stuff.armors)
			if (!partyarmors[armor])
				partyarmors[armor] = armors[armor]
			else
				return this.setupEmbed({
					title: `You already have ${armor}!`,
					description: `You cannot have 2 identical armors.\nYou have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
				}, [
					this.shopList
				], [
					makeButton('Back', '◀️', 'grey', null, "main")
				])
		const weapons = setUpFile(`${dataPath}/json/${i.message.guild.id}/weapons.json`)
		const partyweapons = this.party.weapons
		for (const weapon of stuff.weapons)
			if (!partyweapons[weapon])
				partyweapons[weapon] = weapons[weapon]
			else
				return this.setupEmbed({
					title: `You already have ${weapon}!`,
					description: `You cannot have 2 identical weapons.\nYou have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
				}, [
					this.shopList
				], [
					makeButton('Back', '◀️', 'grey', null, "main")
				])
		const parties = setUpFile(`${dataPath}/json/${i.message.guild.id}/parties.json`)
		fs.writeFileSync(`${dataPath}/json/${i.message.guild.id}/parties.json`, JSON.stringify(parties, null, '    '));
		return this.setupEmbed({
			title: "Items bought!",
			description: `The selected items costed **${cost}**, so now you have **${this.party.currency}${setUpSettings(this.channel.guild.id).currency_emoji ?? '<:token:981579648993460355>'}** at the moment.`
		}, [
			this.shopList
		], [
			makeButton('Back', '◀️', 'grey', null, "main")
		])
	}

	buy3(i) {
		const {items, cost, amount} = JSON.parse(i.values[0])
		let allitems = []
		for (let i = 0; i < amount; i++)
			allitems = [...allitems, ...items]
		const newcost = (cost * (allitems.length / items.length)) / allitems.length
		return this.buy2({
			values: allitems.map(item => `${item}-items-${newcost}`),
			message: i.message
		}, true)
	}

	talk(_, title = "What will you talk about?", description = "Choose one of the 5 options below") {
		const dialogues = this.shop.dialogues
		const title1 = dialogues[0]?.title ?? "This message should never appear, lol"
		const title2 = dialogues[1]?.title ?? "None"
		const title3 = dialogues[2]?.title ?? "None"
		const title4 = dialogues[3]?.title ?? "None"
		const title5 = dialogues[4]?.title ?? "None"
		return this.setupEmbed({title, description}, [
			makeButton(title1, statusEmojis.silence, "blue", null, "talk1", !dialogues[0]),
			makeButton(title2, statusEmojis.silence, "blue", null, "talk2", !dialogues[1]),
			makeButton(title3, statusEmojis.silence, "blue", null, "talk3", !dialogues[2]),
			makeButton(title4, statusEmojis.silence, "blue", null, "talk4", !dialogues[3]),
			makeButton(title5, statusEmojis.silence, "blue", null, "talk5", !dialogues[4])
		], [
			makeButton('Back', '◀️', 'grey', null, "main")
		])
	}

	talk1() {
		const dialogue = this.shop.dialogues[0]
		return this.talk(null, dialogue.title, dialogue.text)
	}

	talk2() {
		const dialogue = this.shop.dialogues[1]
		return this.talk(null, dialogue.title, dialogue.text)
	}

	talk3() {
		const dialogue = this.shop.dialogues[2]
		return this.talk(null, dialogue.title, dialogue.text)
	}

	talk4() {
		const dialogue = this.shop.dialogues[3]
		return this.talk(null, dialogue.title, dialogue.text)
	}

	talk5() {
		const dialogue = this.shop.dialogues[4]
		return this.talk(null, dialogue.title, dialogue.text)
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

commands.addshopdialogue = new Command({
	desc: "Adds a dialogue in the given shop, the title must be at most 80 chars long while the text must be at most 4096 chars long.",
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
			name: "Dialogue title",
			type: "Word",
			forced: true,
		},
		{
			name: "Dialogue text",
			type: "Word",
			forced: true,
		}
	],
	section: "shops",
	checkban: true,
	admin: "Only admins can add dialogue to shops!",
	func(message, args) {
		const trueName = args[0].toLowerCase()
		const shopid = args[1].id
		const shopPath = `${dataPath}/json/${message.guild.id}/${shopid}/shops.json`
		const shopData = setUpFile(shopPath)
		const shop = shopData[trueName]
		if (!shop)
			return void message.channel.send(`A shop with the ID of ${trueName} does not exist!`)
		if (!shop.dialogues)
			shop.dialogues = []
		if (shop.dialogues.length >= 5)
			return void message.channel.send("A shop can't have more than 5 dialogues!")
		shop.dialogues.push({title: args[2].slice(0, 80), text: args[3].slice(0, 4096)})
		fs.writeFileSync(shopPath, JSON.stringify(shopData, '	', 4))
		message.react('👍')
	}
})

commands.setshopcolor = new Command({
	desc: "Sets the color of the given shop, supports either #RRGGBB or element names.",
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
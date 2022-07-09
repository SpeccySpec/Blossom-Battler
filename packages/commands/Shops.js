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
	admin: "You lack sufficient permissions, I'm so sorry!",
	func: (message, args) => {
		const shopName = args[0]
		const trueName = shopName.toLowerCase()
		const shopData = setUpFile(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`);
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
				if (info.desc)
					itembuild.desc = `${(info.desc.length > 100)
						? `${info.desc.slice(0, 100)}_..._`
						: info.desc}`
				shop.items.push(itembuild);
				itembuild = {};
			}
		}

		shopData[trueName] = shop;
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`, JSON.stringify(shopData, '	', 4));

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
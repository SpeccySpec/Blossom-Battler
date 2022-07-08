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
			type: "RealChannel",
			forced: true
		},
		{
			name: "Can Sell?",
			type: "YesNo"
		},
		{
			name: "Items",
			type: "Word",
			forced: true,
			multiple: true
		}
	],
	section: "shops",
	checkban: true,
	admin: "You lack sufficient permissions, I'm so sorry!",
	func: (message, args) => {
		let shopData = setUpFile(`${dataPath}/json/${message.guild.id}/${args[1].id}/shops.json`);

		let shop = {
			name: args[0],
			cansell: args[2] ?? false,
			items: []
		}
	}
})
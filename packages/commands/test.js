commands.test = new Command({
	desc: "a",
	section: "misc",
	func: (message, args) => {
		message.reply("**[DEBUG]**\nThis is a test command.")
	}
})
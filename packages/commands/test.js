class Command {
	constructor(object) {
		this.desc = object.desc
		this.call = object.func
	}
}

const commands = {}

commands.test = new Command({
	desc: "a",
	section: "misc",
	func: (message, args) => {
		message.reply("**[DEBUG]**\nThis is a test command.")
	}
})

module.exports = {

    getCommands: (mainCommands) => {
		for (const command in commands) {
			mainCommands[command] = commands[command]
		}
    }
}
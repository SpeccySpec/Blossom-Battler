class ArgList {
	constructor(args, desc) {
		this.args = args ?? []
		this.desc = desc ?? ""
	}

	parse(message, rawargs) {
		const args = []
		for (const arg of this.args) {
			const rawarg = rawargs.shift()
			if (rawarg) {
				const parser = typeParsers[arg.type]
				const parsedArg = parser ? parser({arg: rawarg, message}) : rawarg
				if (parsedArg === undefined) return void message.channel.send(`Invalid argument for "${arg.name}", it has to be of type "${arg.type}".`)
				args.push(parsedArg)
				if (arg.multiple) {
					for (const rawarg of rawargs) {
						const parsedExtraArg = parser ? parser({arg: rawarg, message}) : rawarg
						if (!parsedExtraArg) return void message.channel.send(`Invalid extra argument for "${arg.name}", it has to be of type "${arg.type}".`)
						args.push(parsedExtraArg)
					}
					break
				}
			} else if (arg.forced) {
				const desc = this.getFullDesc()
				const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`Missing required argument "${arg.name}"!`)
					.setDescription(desc)
				return void message.channel.send({embeds: [DiscordEmbed]})
			}
		}
		return args
	}

	getFullDesc() {
		const args = this.args.map(arg => {
			let argdesc = `${arg.type}: ${arg.name}`
			argdesc = arg.forced ? `<${argdesc}>` : `\{${argdesc}\}`
			argdesc = arg.long ? `"${argdesc}"` : argdesc;
			if (arg.multiple) argdesc += " {...}"
			return argdesc
		})
		return args.length > 0 ? `*${args.join(" ")}*\n${this.desc}` : this.desc
	}
}

module.exports = ArgList
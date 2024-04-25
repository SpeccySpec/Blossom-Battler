class ArgList {
	constructor(args, desc, doc) {
		this.args = args ?? []
		this.desc = desc ?? ""
		this.doc = doc ?? undefined
	}

	parse(message, rawargs, replacementTitle) {
		if (this.args && [...this.args].filter(x => x?.forced == true).length > 0 && rawargs.length == 0) {
			return void this.summonDocumentation(message, rawargs, replacementTitle);
		}

		const args = []
		for (const arg of this.args) {
			const rawarg = rawargs.shift()

			if (rawarg) {
				const parser = typeParsers[arg.type]
				let parsedArg = parser ? parser({arg: rawarg, message}) : rawarg
				if (arg?.preventBlank && parsedArg.toString().trim() == '') parsedArg = undefined;

				if (parsedArg === undefined) {
					const DiscordEmbed = new Discord.MessageEmbed()
						.setColor('#ff0000')
						.setTitle(`Invalid argument for "${arg.name}", it has to be of type "${arg.type}".`)
						.setDescription(`**Argument:** *${this.getArgs().join(" ").replace(
								`${arg.type}: ${arg.name}`,
								`__${arg.type}: ${arg.name}__`,
							)}*\n**Offender:** __${rawarg.length > 256 ? `${rawarg.substring(0, 256)}...` : rawarg}__` +
							`${arg.multiple ? ` ${rawargs.join(" ")}` : ""}${this.getDoc()}`
					)

					return void message.channel.send({embeds: [DiscordEmbed]});
				}

				if (arg?.maxlength && rawarg.toString().length > arg.maxlength) {
					const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#ff0000')
					.setTitle(`The "${arg.name}" argument is too long. It should be no longer than ${arg.maxlength} characters.`)
					.setDescription(`**Argument:** *${this.getArgs().join(" ").replace(
							`${arg.type}: ${arg.name}`,
							`__${arg.type}: ${arg.name}__`,
						)}*\n**Offender:** __${rawarg.substring(0, arg.maxlength)}...__` +
						`${this.getDoc()}`
				)

				return void message.channel.send({embeds: [DiscordEmbed]});
				}

				args.push(parsedArg)
				if (arg.multiple) {
					for (const rawarg of rawargs) {
						let parsedExtraArg = parser ? parser({arg: rawarg, message}) : rawarg
						if (arg?.preventBlank && parsedExtraArg.toString().trim() == '') parsedExtraArg = undefined;

						if (!parsedExtraArg) {
							const DiscordEmbed = new Discord.MessageEmbed()
								.setColor('#ff0000')
								.setTitle(`Invalid extra argument for "${arg.name}", it has to be of type "${arg.type}".`)
								.setDescription(`**Argument:** *${this.getArgs().join(" ").replace(
										`${arg.type}: ${arg.name}`,
										`__${arg.type}: ${arg.name}__`,
									)}*\n**Offender:** ${
									parsedArg +
									" " +
									rawargs.join(" ").replace(rawarg, `__${rawarg.length > 256 ? `${rawarg.substring(0, 256)}...` : rawarg}__`)
									}${this.getDoc()}`
							)

							return void message.channel.send({embeds: [DiscordEmbed]});
						}

						if (arg?.maxlength && rawarg.toString().length > arg.maxlength) {
							const DiscordEmbed = new Discord.MessageEmbed()
							.setColor('#ff0000')
							.setTitle(`The "${arg.name}" extra argument is too long. It should be no longer than ${arg.maxlength} characters.`)
							.setDescription(`**Argument:** *${this.getArgs().join(" ").replace(
									`${arg.type}: ${arg.name}`,
									`__${arg.type}: ${arg.name}__`,
								)}*\n**Offender:** ${
								parsedArg +
								" " +
								rawargs.join(" ").replace(rawarg, `__${rawarg.substring(0, arg.maxlength)}...__`)
								}${this.getDoc()}`
							)

							return void message.channel.send({embeds: [DiscordEmbed]});
						}

						args.push(parsedExtraArg)
					}
					break
				}
			} else if (arg.forced) {
				const DiscordEmbed = new Discord.MessageEmbed()
					.setColor('#ff0000')
					.setTitle(`Missing required argument "${arg.name}"!`)
					.setDescription(this.getFullDesc().replace(
						`${arg.type}: ${arg.name}`,
						`__${arg.type}: ${arg.name}__`,
					) + this.getDoc()
				)
				return void message.channel.send({embeds: [DiscordEmbed]})
			}
		}
		return args
	}

	summonDocumentation(message, rawargs, replacementTitle) {
		let DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#0099ff')
			.setTitle(replacementTitle ?? [...message.content.matchAll(/"([^"]*?)"|[^ ]+/gm)].map(
				(el) => el[1] || el[0] || "",
			)[0])
			.setDescription(this.getFullDesc() +
			this.getDoc());

		if (this?.doc?.fields != undefined) DiscordEmbed.addFields(this.doc.fields);

		return void message.channel.send({
			embeds: [DiscordEmbed]
		});
	}

	getDoc() {
		let txt = '';

		let argLengths = this.args.filter(x => x?.maxlength);

		if (argLengths.length > 0) txt += `\n\n### ARGUMENT LENGTHS:`

		for (let i in argLengths) {
			let argdesc = argLengths[i].name;
			argdesc = argLengths[i].forced ? `<${argdesc}>` : `\{${argdesc}\}`;
			argdesc = argLengths[i].long ? `"${argdesc}"` : argdesc;

			txt += `\n*${argdesc}* can be up to **${argLengths[i].maxlength}** characters long.`
		}

		txt += (this.doc != undefined
			? `\n### DOCUMENTATION:${
				this.doc.desc != undefined ? `\n${this.doc.desc}` : ""
			}`
		: "");

		return txt;
	}

	getArgs() {
		return this.args.map((arg) => {
			let argdesc = `${arg.type}: ${arg.name}`;
			argdesc = arg.forced ? `<${argdesc}>` : `\{${argdesc}\}`;
			argdesc = arg.long ? `"${argdesc}"` : argdesc;
			if (arg.multiple) argdesc += " {...}";
			return argdesc;
		});
	}
	
	getFullDesc() {
		const args = this.getArgs();
		return args.length > 0 ? `*${args.join(" ")}*\n\n${this.desc}` : this.desc;
	}
}

module.exports = ArgList
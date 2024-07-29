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
				const parser = typeParsers[arg.type];
				const parsedArg = (rawarg === "-") ? null : (parser ? parser({arg: rawarg, message}) : rawarg);

				if (parsedArg === undefined) {
					const DiscordEmbed = new Discord.MessageEmbed()
						.setColor('#ff0000')
						.setTitle(`Invalid argument for "${arg.name}", it has to be of type "${arg.type}".`)
						.setDescription(`**Argument:** *${this.getArgs().join(" ").replace(
								`${arg.type}: ${arg.name}`,
								`__${arg.type}: ${arg.name}__`,
							)}*\n**Offender:** __${rawarg}__` +
							`${arg.multiple ? ` ${rawargs.join(" ")}` : ""}`
					)

					return void message.channel.send({embeds: [DiscordEmbed]});
				}

				args.push(parsedArg)
				if (arg.multiple) {
					for (const rawarg of rawargs) {
						const parsedExtraArg = parser ? parser({arg: rawarg, message}) : rawarg
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
									rawargs.join(" ").replace(rawarg, `__${rawarg}__`)
									}`
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
					)
				)
				return void message.channel.send({embeds: [DiscordEmbed]})
			}
		}
		return args
	}

	async summonDocumentation(message, rawargs, replacementTitle) {
		let curPage = 0;

		const documentationEmbed = async () => {
			let embed = new Discord.MessageEmbed({
				title: replacementTitle ?? [...message.content.matchAll(/"([^"]*?)"|[^ ]+/gm)].map(
					(el) => el[1] || el[0] || "",
				)[0],
				description: this.getFullDesc() +
				(this.doc != undefined
					? `\n\n**DOCUMENTATION:**${
						this?.doc?.pages[curPage]?.desc != undefined ? `\n${this.doc.pages[curPage].desc}` : ""
					}`
				: ""),
				color: '#0099ff'
			})

			if (this?.doc?.pages[curPage]?.fields != undefined) embed.addFields(this.doc.pages[curPage].fields);

			if (this?.doc?.pages) {
				embed.setFooter(`Page ${curPage+1}/${this?.doc?.pages.length ?? 1}`)
			}

			return embed
		}

		let embedMessage
		if ((this?.doc?.pages?.length ?? 1) == 1) {
			embedMessage = await message.channel.send({
				embeds: [await documentationEmbed()]
			})
			return
		}

		embedMessage = await message.channel.send({
			embeds: [await documentationEmbed()],
			components: [new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]})]
		})

		const collector = embedMessage.createMessageComponentCollector({
			filter: ({user}) => user.id == message.author.id
		})

		collector.on('collect', async interaction => {
			if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
				if (interaction.customId === 'back') {
					curPage--;
					if (curPage < 0) curPage = this.doc.pages.length - 1
				} else if (interaction.customId === 'forward') {
					curPage++;
					if (curPage >= this.doc.pages.length) curPage = 0
				}
	
				await interaction.update({
					embeds: [await documentationEmbed()],
					components: [
						new Discord.MessageActionRow({components: [backButton, forwardButton, cancelButton]}),
					]
				})
			} else {
				collector.stop()
				await interaction.update({
				embeds: [await documentationEmbed()],
				components: []
				})
			}
		})
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
const Discord = require('discord.js');
const fs = require('fs');

const dataPath = './data'

// Elements
const Elements = [
    "strike",
    "slash",
    "pierce",
    "fire",
    "water",
    "ice",
    "electric",
    "wind",
    "earth",
    "grass",
    "psychic",
    "poison",
    "nuclear",
    "metal",
    "curse",
    "bless",
    "almighty",

    "status",
    "heal",
    "passive"
]

const elementEmoji = {
	strike: "<:strike:877132710370480190>",
	slash: "<:slash:877132710345338960> ",
	pierce: "<:pierce:877132710315950101>",
	
	fire: "<:fire:877132709934301216>",
	water: "<:water:877132710471147571>",
	ice: "<:ice:877132710299181076>",
	electric: "<:electric:877132710194348072>",
	wind: "<:wind:877140815649075241>",
	earth: "<:earth:877140476409577482>",
	grass: "<:grass:877140500036075580>",
	psychic: "<:psychic:877140522530140171>",
	poison: "☠️",
	metal: "🔩",
	curse: "👻",
	bless: "⭐",
	nuclear: "☢",
	
	almighty: "💫",
	
	status: "🔰",
	heal: "➕",
	passive: "⏎"
}

var skillSteps = {}

function step1(skillName, client, channel, author) {
	skillSteps[author.id] = {
		step: 1,
		substep: 1,
		channel: channel,
		skillDefs: {
			name: skillName
		}
	}

	const DiscordEmbed = new Discord.MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`Stats - Step ${skillSteps[author.id].step}`)
		.setDescription("We'll start with registering the skill's stats. Each skill must have the basic stats: Power, Accuracy, Critical Hit Chance, Element, Physical/Magic and Cost.\n\nNow, enter the skill's **power**.")
	
	channel.send({content: `${author}`, embeds: [DiscordEmbed]})

	var collector = channel.createMessageCollector({ time: 60000 });
	collector.on('collect', m => {
		if (m.author.id === author.id) {
			skillSteps[author.id].skillDefs.pow = parseInt(m.content)
			channel.send('Now enter accuracy.')
			collector.stop()

			collector = channel.createMessageCollector({ time: 60000 });
			collector.on('collect', m => {
				if (m.author.id === author.id) {
					skillSteps[author.id].skillDefs.acc = parseInt(m.content)
					channel.send('Now enter critical hit chance.')
					collector.stop()

					collector = channel.createMessageCollector({ time: 60000 });
					collector.on('collect', m => {
						if (m.author.id === author.id) {
							skillSteps[author.id].skillDefs.crit = parseInt(m.content)

							const DiscordEmbed = new Discord.MessageEmbed()
								.setColor('#0099ff')
								.setTitle('List of usable elements:')

							var elementTxt = ''
							for (const i in Elements)
								elementTxt += `${elementEmoji[Elements[i]]} **${[Elements[i]]}**\n`;

							DiscordEmbed.setDescription(elementTxt)

							channel.send({content: 'Now enter the element!', embeds: [DiscordEmbed]})
							collector.stop()

							collector = channel.createMessageCollector({ time: 60000 });
							collector.on('collect', m => {
								if (m.author.id === author.id) {
									skillSteps[author.id].skillDefs.type = m.content.toLowerCase()
									channel.send("There! Now, you just lost your skill, because this is unfinished. Have a nice day.")

									collector.stop()
								}
							})
						}
					})
				}
			})
		}
	})
}

module.exports = {
	step1: function(skillName, client, channel, author) {
		return step1(skillName, client, channel, author)
	}
}
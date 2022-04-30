commands.settings = new Command({
    desc: 'View this server\'s settings here.',
    section: 'moderation',
    aliases: ['serversettings', 'viewsettings', 'getsettings'],
    args: [],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

        /**{
        "formulas": {
            "damageFormula": "persona",
            "levelUpFormula": "original",
            "xpCalcFormula": "original"
        }
        } */
        let mechanicText = ''
        for (const i in settings['mechanics']) {
            switch (i) {
                case 'limitbreaks':
                    mechanicText += `**Limit Breaks**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
                case 'teamcombos':
                    mechanicText += `**Team Combos**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
                case 'onemores':
                    mechanicText += `**One Mores**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
                case 'stataffinties':
                    mechanicText += `**Status Affinities**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
                case 'leaderskills':
                    mechanicText += `**Leader Skills**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
                case 'charms':
                case 'transformations':
                    mechanicText += `**${i.charAt(0).toUpperCase() + i.slice(1)}**: ${settings['mechanics'][i] == true ? 'Enabled' : 'Disabled'}\n`
                    break
            }
        }
        
        let capText = ''
        for (const i in settings['caps']) {
            switch (i) {
                case 'levelcap':
                    capText += `**Level Cap**: ${settings['caps'][i]}\n`
                    break
                case 'hpmpcap':
                    capText += `**HP+MP Stat Cap**: ${settings['caps'][i]}\n`
                    break
                case 'statcap':
                    capText += `**Stat Cap**: ${settings['caps'][i]}\n`
                    break
                case 'basestatcap':
                    capText += `**Base Stat Cap**: ${settings['caps'][i]}\n`
                    break
                case 'bstcap':
                    capText += `**Base Stat Total Cap**: ${settings['caps'][i]}\n`
                    break
                case 'skillamount':
                    capText += `**Character Skill Cap**: ${settings['caps'][i]}\n`
                    break
            }
        }

        let affinityRateText = ''
        for (const i in settings['rates']['affinities']) {
            affinityRateText += `**${affinityEmoji[i]} ${i.charAt(0).toUpperCase() + i.slice(1)} Affinity Rate**: ${settings['rates']['affinities'][i]}x\n`
        }

        /**
		// LvlUp Formula
		if (!servStuff.levelUpFormula) {
			servStuff.levelUpFormula = 'original'
			fs.writeFileSync(servPath, JSON.stringify(servFile, null, '    '));
		}

		let lvlFormulas = {
			percent: 'BaseStat * (1 + ((Level-1) * 0.091))',
			assist: '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
			original: 'No Specific Formula'
		}

		let lvlArray = servStuff.levelUpFormula.split('');
		lvlArray[0] = lvlArray[0].toUpperCase()
		let lvlString = lvlArray.join('');
		
		DiscordEmbed.fields.push({name: 'Level Up Formula', value: lvlString + '\n`' + lvlFormulas[servStuff.levelUpFormula] + '`', inline: true}) */

        let dForText = ''
        let damageFormulas = {
            'persona': '5*√(Attack/Endurance * Skill Power)',
            'pokemon': '(((2*level)/5+2)*Power*Attack/Endurance)/50+2',
            'custom': 'uhhhh Spectra you handle this'
        }

        dForText += `${settings['formulas']['damageFormula'].charAt(0).toUpperCase() + settings['formulas']['damageFormula'].slice(1)}\n\`${damageFormulas[settings['formulas']['damageFormula']]}\``

        let lvlUpText = ''
        let levelUpFormulas = {
            'original': 'No Specific Formula',
            'assist': '(BaseStat+3) * (1 + ((Level-1) * 0.06751))',
            'percent': 'BaseStat * (1 + ((Level-1) * 0.091))',
            'custom': 'uhhhh Spectra you handle this'
        }

        lvlUpText += `${settings['formulas']['levelUpFormula'].charAt(0).toUpperCase() + settings['formulas']['levelUpFormula'].slice(1)}\n\`${levelUpFormulas[settings['formulas']['levelUpFormula']]}\``

        let xpCalcText = ''
        let xpCalcFormulas = {
            'original': 'No Specific Formula',
            'custom': 'uhhhh Spectra you handle this'
        }

        xpCalcText += `${settings['formulas']['xpCalcFormula'].charAt(0).toUpperCase() + settings['formulas']['xpCalcFormula'].slice(1)}\n\`${xpCalcFormulas[settings['formulas']['xpCalcFormula']]}\``

        let DiscordEmbed = new Discord.MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Server Settings for ' + message.guild.name)
            .addField('Mechanics', `${mechanicText}`, true)
            .addField('Caps', `${capText}`, true)
            .addField('Affinity Rates', `${affinityRateText}`, true)
            .addField('Prefix', `${settings['prefix']}`, true)
            .addField('Currency', `${settings['currency']}, ${settings['currency']}s`, true)
            .addField('_ _', `_ _`, false)
            .addField('XP Rate', `${settings['rates']['xprate']}x`, true)
            .addField('Trust Rate', `${settings['rates']['trustrate']}x`, true)
            .addField('Golden Enemy Chance', `${settings['rates']['goldchance']}%`, true)
            .addField('Damage Formula', `${dForText}`, true)
            .addField('Level Up Formula', `${lvlUpText}`, true)
            .addField('XP Requirement Formula', `${xpCalcText}`, true)

            if (settings['mechanics']['transformations'] == true) {
                let transformationText = ''
                for (const i in settings['caps']['transformations']) {
                    switch (i) {
                        case 'hpmpcap':
                            transformationText += `**HP+MP Stat Cap**: ${settings['caps']['transformations'][i]}\n`
                            break
                        case 'statcap':
                            transformationText += `**Stat Cap**: ${settings['caps']['transformations'][i]}\n`
                            break
                        case 'basestatcap':
                            transformationText += `**Base Stat Cap**: ${settings['caps']['transformations'][i]}\n`
                            break
                        case 'bstcap':
                            transformationText += `**Base Stat Total Cap**: ${settings['caps']['transformations'][i]}\n`
                            break
                    }
                }
                DiscordEmbed.addField('Transformation Caps', `${transformationText}`, false)
            }
            if (settings['desc'] == true) {
                DiscordEmbed.addField('Description', `${settings['desc']}`, false)
            }

        message.channel.send({embeds: [DiscordEmbed] })
    }
})
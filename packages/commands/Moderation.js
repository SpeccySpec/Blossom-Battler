commands.settings = new Command({
    desc: 'View this server\'s settings here.',
    section: 'moderation',
    aliases: ['serversettings', 'viewsettings', 'getsettings'],
    args: [],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

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

commands.prefix = new Command({
    desc: 'Change the prefix for the server',
    section: 'moderation',
    aliases: ['serverprefix', 'setprefix'],
    args: [
        {
            name: 'New Prefix',
            type: 'Word',
            forced: true
        }
    ],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

        if (utilityFuncs.isAdmin(message)) {
            settings['prefix'] = args[0]
            fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
            message.channel.send('Prefix set to ' + args[0])
        } else {
            return message.channel.send('You do not have permission to change the prefix!')
        }
    }
})

commands.ban = new Command({
    desc: 'Ban a user from using rpg-related commands in the server.',
    section: 'moderation',
    aliases: ['banuser', 'banmember'],
    args: [
        {
            name: 'User',
            type: 'Ping',
            forced: true
        },
        {
            name: 'Reason',
            type: 'Word',
            forced: false
        }
    ],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

        if (utilityFuncs.isAdmin(message)) {
            let bannedUser = args[0]
            let reason = args[1]
            if (reason == undefined) {
                reason = 'No reason given'
            }

            if (bannedUser.id == message.author.id) {
                return message.channel.send('You cannot ban yourself!')
            }
            if (utilityFuncs.RPGBotAdmin(bannedUser.id) || bannedUser.flags.serialize().ADMINISTRATOR) {
                return message.channel.send('You cannot ban an admin!')
            }
            if (bannedUser.id == client.user.id) {
                return message.channel.send('You cannot ban me! Why would you do that?')
            }

            if (settings['banned'].includes(bannedUser.id)) {
                return message.channel.send('This user is already banned!')
            }

            settings['banned'].push(bannedUser.id)
            fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))

            message.channel.send(`<@${bannedUser.id}> You have been banned from using rpg-related commands in the server ` + message.guild.name + ' for the following reason: ' + reason)
        } else {
            return message.channel.send('You do not have permission to ban users!')
        }
    }
})

commands.unban = new Command({
    desc: 'Unban a user from using rpg-related commands in the server.',
    section: 'moderation',
    aliases: ['unbanuser', 'unbanmember'],
    args: [
        {
            name: 'User',
            type: 'Ping',
            forced: true
        }
    ],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

        if (utilityFuncs.isAdmin(message)) {
            let bannedUser = args[0]

            if (!settings['banned'].includes(bannedUser.id)) {
                return message.channel.send('This user is not banned!')
            }

            settings['banned'].splice(settings['banned'].indexOf(bannedUser.id), 1)
            fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))

            message.channel.send(`<@${bannedUser.id}> You have been unbanned from using rpg-related commands in the server ` + message.guild.name)
        } else {
            return message.channel.send('You do not have permission to unban users!')
        }
    }
})

commands.currency = new Command({
    desc: 'Change the currency for the server.',
    section: 'moderation',
    aliases: ['setcurrency', 'setmoney', 'setmoneytype'],
    args: [
        {
            name: 'Currency',
            type: 'Word',
            forced: true
        }
    ],
    func: (message, args) => {
        let settings = setUpSettings(message.guild.id)

        if (utilityFuncs.isAdmin(message)) {
            settings['currency'] = args[0]
            fs.writeFileSync(`${dataPath}/json/${message.guild.id}/settings.json`, JSON.stringify(settings, null, 4))
            message.channel.send('Currency set to ' + args[0])
        } else {
            return message.channel.send('You do not have permission to change the currency!')
        }
    }
})
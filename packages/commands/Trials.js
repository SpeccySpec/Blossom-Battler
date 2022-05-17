trialDesc = (trial, name, message) => {
    const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`${name}`)
        .setFooter(`0 Waves`)
        .setDescription(trial.desc ?  `${trial.desc}` : 'None')
        .addField('Endless?', trial.endless ? 'Yes' : 'No', false)
        .addField('No Waves', 'none', false)

    return embed
}

longtrialdesc = async(trial, name, message) => {
    const generateEmbed = async start => {
        const current = trial.waves.slice(start, start + 15)
        if (current.length > 0) {
            return new Discord.MessageEmbed({
                color: '#0099ff',
                title: `${name}`,
                description: `${trial.desc ?  `${trial.desc}` : 'No Description'}`,
                fields: await Promise.all(
                    current.map(async arrayDefs => ({
                        name: `Wave ${trial.waves.indexOf(arrayDefs) + 1}`,
                        value: arrayDefs.join(', '),
                        inline: true
                    }))
                )
            })
        } else {
            return new Discord.MessageEmbed({
                color: '#0099ff',
                title: `${name}`,
                description: `${trial.desc ?  `${trial.desc}` : 'No Description'}`,
                fields: [{
                    name: 'No Waves',
                    value: 'None'
                }]
            })
        }
    }
    
    const canFitOnOnePage = trial.waves.length <= 15
    let embedMessage
    if (canFitOnOnePage) {
        embedMessage = await message.channel.send({
            embeds: [await generateEmbed(0)]
        })
        return
    }

    embedMessage = await message.channel.send({
        embeds: [await generateEmbed(0)],
        components: [new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]})]
    })

    
    const collector = embedMessage.createMessageComponentCollector({
        filter: ({user}) => user.id == message.author.id
    })

    let currentIndex = 0;
    collector.on('collect', async interaction => {
        if (interaction.component.customId != 'cancel' && interaction.component.customId != 'page') {
            if (interaction.customId === 'back') {
                if (currentIndex - 15 < 0) {
                    currentIndex = trial.waves.length - (trial.waves.length % 15)
                } else {
                    currentIndex -= 15
                }
            } else if (interaction.customId === 'forward') {
                if (currentIndex + 15 >= trial.waves.length) {
                    currentIndex = 0
                } else {
                    currentIndex += 15
                }
            }

            await interaction.update({
                embeds: [await generateEmbed(currentIndex)],
                components: [
                    new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
                ]
            })
        } else if (interaction.component.customId === 'page') {
            message.channel.send(`Please enter the page number you want to go to.`)
            const pageCollector = message.channel.createMessageCollector({
                time: 3000
            })

            await new Promise((resolve, reject) => {
                pageCollector.on('collect', async pageInteraction => {
                    if (pageInteraction.author.id == message.author.id) {
                        try {
                            const page = parseInt(pageInteraction.content) - 1
                            if (page > -1 && page <= Math.floor(trial.waves.length / 15)) {
                                currentIndex = page * 15
                                await interaction.update({
                                    embeds: [await generateEmbed(currentIndex)],
                                    components: [
                                        new Discord.MessageActionRow({components: [backButton, forwardButton, pageButton, cancelButton]}),
                                    ]
                                })
                                pageCollector.stop()
                                resolve()
                            } else {
                                message.channel.send(`Please enter a valid page number.`)
                                pageCollector.stop()
                                resolve()
                            }
                        } catch (err)
                        {
                            message.channel.send('Please enter a valid page number.')
                            pageCollector.stop()
                            resolve()
                        }
                    }
                })
            })
        } else {
            collector.stop()
            await interaction.update({
                embeds: [await generateEmbed(currentIndex)],
                components: []
            })
        }
    })
}

commands.registertrial = new Command({
    desc: `Registers a new trial for people to test themselves with.`,
    section: 'trials',
    aliases: ['maketrial', 'regtrial'],
    checkban: true,
    admin: 'You don\'t have permission to register a trial.',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Is Endless?",
            type: "Word"
        },
        {
            name: "Description",
            type: "Word"
        }
    ],
    func: (message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
        if (args[0].length > 50) return message.channel.send(`${args[0]} is too long of a trial name.`);

        trialFile[args[0]] = {
            name: args[0],
            endless: args[1] ? args[1].toLowerCase() == 'true' : false,
            waves: [],
        }

        if (args[2]) trialFile[args[0]].desc = args[2];

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4));
        const embed = trialDesc(trialFile[args[0]], args[0], message)
        message.channel.send({content: `${trialFile[args[0]].name} has been registered:`, embeds: [embed]})
    }
})

commands.gettrial = new Command({
    desc: `Gets a trial by name.`,
    section: 'trials',
    aliases: ['gettrial', 'gettrials', 'gettrialsbyname', 'gettrialsbyname'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
        longtrialdesc(trialFile[args[0]], args[0], message)
    }
})

commands.trialendless = new Command({
    desc: `Toggles a trial to be endless or not.`,
    section: 'trials',
    aliases: ['trialendless', 'endless'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        }
    ],
    admin: 'You don\'t have permission to change a trial\'s endless status.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)

        trialFile[args[0]].endless = !trialFile[args[0]].endless
        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`${trialFile[args[0]].name} is now ${trialFile[args[0]].endless ? 'endless' : 'not endless'}.`)
    }
})

commands.listtrials = new Command({
    desc: `Lists all the trials.`,
    section: 'trials',
    aliases: ['listtrial', 'listtrials'],
    args: [
        {
            name: "Type #1, Variable #1",
            type: "Word",
            forced: false,
            multiple: true
        }
    ],
    func: (message, args) => {
        let array = [];
        let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`);

        const validTypes = ['enemy', 'endless', 'waves'];

        if (args[0]) {
            if (args.length % 2 != 0) return message.channel.send('The number of arguments must be even.');

            for (i in args) {
                if (i % 2 == 1) {
                    let thingy = checkListArgument(args[i-1].toLowerCase(), args[i], validTypes, message)
                    if (!thingy) return
                    if (thingy == 'disabled') {
                        args[i-1] = '';
                        args[i] = '';
                    }
                }
            }
            args = args.filter(arg => arg != '');
            
            for (i in args) {
                if (i % 2 == 0) {
                    if (args.filter(arg => arg == args[i]).length > 1) {
                        return message.channel.send('You cannot have multiple of the same type.');
                    }
                }
            }
        }

        for (const i in trials) {
            let isConditionMet = true;
            for (a in args) {
                if (a % 2 == 1) {
                    switch (args[a-1].toLowerCase()) {
                        case 'enemy':
                            isConditionMet = (trials[i].waves.some(wave => wave.includes(args[a])));
                            break;
                        case 'endless':
                            isConditionMet = (trials[i].endless == args[a]);
                            break;
                    }
                    if (isConditionMet == false || isConditionMet == undefined) break;
                }
            }
            if (isConditionMet == false || isConditionMet == undefined) break;

            array.push({title: trials[i].name, desc: `${trials[i].waves.length} Waves`});
        }
        
        if (array.length == 0) return message.channel.send('No trials found!')
        
        listArray(message.channel, array, message.author.id);
    }
})

commands.searchtrials = new Command({
    desc: `Searches for trials by phrase.`,
    section: 'trials',
    aliases: ['searchtrial', 'searchtrials'],
    args: [
        {
            name: "Phrase",
            type: "Word",
            forced: true
        }
    ],
    func: (message, args) => {
        let array = [];
        let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`);

        for (const i in trials) {
            if (trials[i].name.toLowerCase().includes(args[0].toLowerCase()) || i.toLowerCase().includes(args[0].toLowerCase())) {
                array.push({title: trials[i].name, desc: `${trials[i].waves.length} Waves`});
            }
        }

        if (array.length == 0) return message.channel.send('No trials found!')
        
        listArray(message.channel, array, message.author.id);
    }
})
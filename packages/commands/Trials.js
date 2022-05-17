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

async function longtrialdesc(trial, name, message){
    enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)
    const newtrial = trial.waves

    const generateEmbed = async start => {
        const current = newtrial.slice(start, start + 15)

        for (let i = 0; i < current.length; i++) {
            for (let j = 0; j < current[i].length; j++) {
                if (current[i][j].startsWith('<:warning:878094052208296007>')) {
                    current[i][j] = current[i][j].replace('<:warning:878094052208296007>', '')
                }
                if (current[i][j].startsWith('||') && current[i][j].endsWith('||')) {
                    current[i][j] = current[i][j].slice(2, current[i][j].length - 2)
                }
                if (!enemyFuncs.encounteredEnemy(current[i][j], message.guild.id)) {
                    current[i][j] = `||${current[i][j]}||`
                }
                if (enemyFile[current[i][j]].type == 'miniboss' || enemyFile[current[i][j]].type == 'boss' || enemyFile[current[i][j]].type == 'bigboss' || enemyFile[current[i][j]].type == 'deity') {
                    current[i][j] = `<:warning:878094052208296007>${current[i][j]}`
                }
            }
        }

        if (current.length > 0) {
            return new Discord.MessageEmbed({
                color: '#0099ff',
                title: `${name}`,
                description: `${trial.desc ?  `${trial.desc}` : 'No Description'}`,
                fields: await Promise.all(
                    current.map(async arrayDefs => ({
                        name: `Wave ${newtrial.indexOf(arrayDefs) + 1}`,
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
    
    const canFitOnOnePage = newtrial.length <= 15
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
                    currentIndex = newtrial.length - (newtrial.length % 15)
                } else {
                    currentIndex -= 15
                }
            } else if (interaction.customId === 'forward') {
                if (currentIndex + 15 >= newtrial.length) {
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
                            if (page > -1 && page <= Math.floor(newtrial.length / 15)) {
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
        const embed = trialDesc(trialFile[args[0]], trialFile[args[0]].name, message)
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
        longtrialdesc(trialFile[args[0]], trialFile[args[0]].name, message)
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

commands.trialwave = new Command({
    desc: `Adds a wave to a trial.`,
    section: 'trials',
    aliases: ['trialwave', 'addwave', 'addwaves'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Wave",
            type: "Num",
            forced: true
        },
        {
            name: "Enemies",
            type: "Word",
            forced: true,
            multiple: true
        }
    ],
    admin: 'You don\'t have permission to add waves to a trial.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)
        enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)

        if (args[1] <= 0) return message.channel.send('Wave must be greater than 0.')
        if (args[1] > trialFile[args[0]].waves.length + 1) return message.channel.send(`The trial ${args[0]} only has ${trialFile[args[0]].waves.length} waves.`)

        for (i in args) {
            if (i > 1) {
                if (!enemyFile[args[i]]) return message.channel.send(`No enemy with the name ${args[i]} was found.`)
            }
        }

        trialFile[args[0]].waves.push(args.slice(1));

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`Added wave ${args[1]} to ${args[0]}. Here's the trial so far:`)
        longtrialdesc(trialFile[args[0]], trialFile[args[0]].name, message)
    }
})

commands.cleartrialwave = new Command({
    desc: `Removes a wave from a trial.`,
    section: 'trials',
    aliases: ['cleartrialwave', 'cleartrialwaves', 'removewave', 'removewaves'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Wave",
            type: "Num",
            forced: true
        }
    ],
    admin: 'You don\'t have permission to remove waves from a trial.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)
        enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
        if (trialFile[args[0]].waves.length == 0) return message.channel.send(`The trial ${args[0]} has no waves.`)

        if (args[1] <= 0) return message.channel.send('Wave must be greater than 0.')
        if (args[1] > trialFile[args[0]].waves.length) return message.channel.send(`The trial ${args[0]} only has ${trialFile[args[0]].waves.length} waves.`)

        trialFile[args[0]].waves.splice(args[1] - 1, 1);

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`Removed wave ${args[1]} from ${args[0]}. Here's the trial so far:`)
        longtrialdesc(trialFile[args[0]], trialFile[args[0]].name, message)
    }
})

commands.trialtruename = new Command({
    desc: `Changes the true name of a trial.`,
    section: 'trials',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "New Name",
            type: "Word",
            forced: true
        }
    ],
    admin: 'You don\'t have permission to change the true name of a trial.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
        if (trialFile[args[1]]) return message.channel.send(`A trial with the name ${args[1]} already exists.`)
        if (args[0] == args[1]) return message.channel.send(`What are you trying to do?`)

        trialFile[args[1]] = trialFile[args[0]];
        delete trialFile[args[0]];

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`Changed the true name of ${args[0]} to ${args[1]}.`)
    }
})

commands.renametrial = new Command({
    desc: `Changes the name of a trial.`,
    section: 'trials',
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "New Name",
            type: "Word",
            forced: true
        }
    ],
    admin: 'You don\'t have permission to change the true name of a trial.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
        if (args[0] == args[1]) return message.channel.send(`What are you trying to do?`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");
        if (args[1].length > 50) return message.channel.send(`${args[1]} is too long of a trial name.`);

        trialFile[args[0]].name = args[1];

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`Changed the name of ${args[0]} to ${args[1]}.`)
    }
})

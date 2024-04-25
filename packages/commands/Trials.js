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

async function longtrialdesc(trialDefs, name, message) {
    enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`);

	let trial = objClone(trialDefs);
    let newtrial = trial.waves;

    const generateEmbed = async start => {
        const current = newtrial.slice(start, start + 15);

        for (let i = 0; i < current.length; i++) {
            for (let j = 0; j < current[i].length; j++) {
                if (current[i][j].startsWith('<:warning:878094052208296007>')) current[i][j] = current[i][j].replace('<:warning:878094052208296007>', '');
                if (current[i][j].startsWith('||') && current[i][j].endsWith('||')) current[i][j] = current[i][j].slice(2, current[i][j].length - 2);
                if (!foundEnemy(current[i][j], message.guild.id)) current[i][j] = `||${current[i][j]}||`;
                if (isBoss(enemyFile[current[i][j]])) current[i][j] = `<:warning:878094052208296007>${current[i][j]}`;
            }
        }

		let restriction = trial.levellock ? `\n🔒 Trial locked behind **Level ${trial.levellock}**` : '';

        if (current.length > 0) {
            return new Discord.MessageEmbed({
                color: '#0099ff',
                title: `${name}`,
                description: `${trial.desc ?  `${trial.desc}` : '_No Description_'}${restriction}`,
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
                description: `${trial.desc ?  `${trial.desc}` : '_No Description_'}${restriction}`,
                fields: [{
                    name: '__No Waves!__',
                    value: `_Maybe you should set some waves... use ${getPrefix(message.guild.id)}trialwave to add some!_`
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
            forced: true,
            preventBlank: true,
            maxLegnth: 64
        },
        {
            name: "Is Endless?",
            type: "Word"
        },
        {
            name: "Description",
            type: "Word",
            maxLegnth: 128
        }
    ],
    func(message, args, guilded) {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return message.channel.send("Don't even try it.");

        trialFile[args[0]] = {
            name: args[0],
			id: args[0],
            endless: args[1] ? (args[1].toLowerCase() == 'true' || args[1].toLowerCase() == 'yes' || args[1].toLowerCase() == 'y' || args[1].toLowerCase() == '1') : false,
            waves: [],
        }

        if (args[2]) {
			trialFile[args[0]].desc = args[2];
		}

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

commands.verifytrial = new Command({
    desc: "**[SUPER ADMIN ONLY]**\nVerifies a trial.",
    section: 'trials',
    aliases: ['trialverify', 'verifyt'],
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
		if (!utilityFuncs.RPGBotAdmin(message.author.id)) return void message.channel.send("Only a super admin can use this.");

        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)

        trialFile[args[0]].verified = !trialFile[args[0]].verified
        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`${trialFile[args[0]].name} is now ${trialFile[args[0]].verified ? 'verified' : 'not verified'}.`)
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
    doc: {
        desc: "List filtration will be revamped eventually, but what you can search for are: Specific enemy names present in waves *<Enemy>*, Wave amounts *<Waves>*, and Endless *<Endless> (True/False)*.\nThe format for *<Type #1, Variable #1>* is **waves 13 endless true** etc."
    },
    func(message, args, guilded) {
        let array = [];
        let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`);

        const validTypes = ['enemy', 'endless', 'waves'];

        if (args[0]) {
            if (args.length % 2 != 0) {
				//check if the last argument exists in validTypes
				if (validTypes.includes(args[args.length - 1])) {
					return message.channel.send(`The **${args[args.length - 1]}** type is missing a variable.`);
				} else {
					return message.channel.send(`**${args[args.length - 1].charAt(0).toUpperCase() + args[args.length - 1].slice(1)}** is invalid! Valid types are: \n -\`${validTypes.join('\`\n -\`')}\``);
				}
			}

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
            if (isConditionMet == false || isConditionMet == undefined) continue;

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
    func(message, args, guilded) {
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
    doc: {
        desc: "If you set *<Wave>* as an existing wave, it will overwrite it."
    },
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)
        enemyFile = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
		let trial = trialFile[args[0]];

        for (i in args) {
            if (i <= 1) continue;
			if (!enemyFile[args[i]]) return message.channel.send(`No enemy with the name ${args[i]} was found.`)
        }

        if ((args[1]-1) > trial.waves.length) {
			message.channel.send("This trial does not have that many waves! Therefore, I'll insert this wave at the very end of this trial.");
			trialFile[args[0]].waves.push(args.slice(2));
		} else {
			message.channel.send(`I will overwrite wave #${args[1]}!`);
			trialFile[args[0]].waves[args[1]-1] = (args.slice(2));
		}

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`Here's the trial so far:`)
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
            forced: true,
            preventBlank: true,
            maxLegnth: 64
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
            forced: true,
            preventBlank: true,
            maxLegnth: 64
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

commands.triallevel = new Command({
    desc: "Sets the trial's level restriction. Set to 0 to remove the level restriction.",
    section: 'trials',
    aliases: ['triallevelrestriction', 'trialstrength', 'addwaves'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Level",
            type: "Num",
            forced: true
        }
    ],
    admin: 'You don\'t have permission to add waves to a trial.',
    checkban: true,
    func: async(message, args) => {
        trialFile = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`)

        if (!trialFile[args[0]]) return message.channel.send(`No trial with the name ${args[0]} was found.`)
		let trial = trialFile[args[0]];

        if (args[1] <= 0 && trial.levellock)
			delete trial.levellock;
		else {
			let settings = setUpSettings(message.guild.id);
			if (args[1] > settings.caps.levelcap) return message.channel.send(`You can't lock a trial above the level cap of ${settings.caps.levelcap}!`);

			trial.levellock = args[1];
		}

        fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trialFile, null, 4))
        message.channel.send(`The level restriction has been set! Here's the trial so far:`)
        longtrialdesc(trialFile[args[0]], trialFile[args[0]].name, message)
    }
})

commands.uploadtrial = new Command({
    desc: "Uploads the trial for all to see! You can force all users to use this server's current settings, or you can let them use their own.",
    section: 'trials',
    aliases: ['globaltrial', 'setglobaltrial'],
    args: [
        {
            name: "Name",
            type: "Word",
            forced: true
        },
        {
            name: "Use Server Settings",
            type: "YesNo",
            forced: false
        }
    ],
    checkban: true,
    doc: {
        desc: "There are criteria to uploading trials!```diff\n- Be as sensible as possible please!\n-Don't make your trial impossible.\n- Do not copy another's trial!```"
    },
    func(message, args, guilded) {
		enemies = setUpFile(`${dataPath}/json/${message.guild.id}/enemies.json`, true)
        trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`, true)
        trialGlobals = setUpFile(`${dataPath}/json/globaltrials.json`, true)

		if (!trials[args[0]]) return void message.channel.send("There was a problem uploading this trial! Please see the following:\nThis trial does not exist in this server!");
		if (!trials[args[0]].waves || trials[args[0]].waves.length <= 0) return void message.channel.send("There was a problem uploading this trial! Please see the following:\nThis trial does not have any waves! Try adding some before uploading them!");
		if (trials[args[0]].uploaded) return void message.channel.send(`There was a problem uploading this trial! Please see the following:\nThis trial has already been uploaded! Check ID **${trials[args[0]].uploaded}**.`);
		if (!trials[args[0]].verified) return void message.channel.send("There was a problem uploading this trial! Please see the following:\nThis trial has not been verified. To verify the trial, complete it atleast once!");

		// Let's get this trial up and out there!
		let gTrial = objClone(trials[args[0]]);

		// Send all enemies to the challengers.
		gTrial.enemydata = {};
		for (let i in gTrial.waves) {
			for (let k in gTrial.waves[i]) {
				if (!enemies[gTrial.waves[i][k]]) return void message.channel.send(`There was a problem uploading this trial! Please see the following:\nThe enemy ${gTrial.waves[i][k]} does not exist.`);

				if (!gTrial.enemydata[gTrial.waves[i][k]]) {
					gTrial.enemydata[gTrial.waves[i][k]] = objClone(enemies[gTrial.waves[i][k]]);
				}
			}
		}

		// Send server settings.
		if (args[1]) gTrial.forcesettings = objClone(setUpSettings(message.guild.id));

		// Online stats
		gTrial.online = {
			likes: 0,
			dislikes: 0,
			plays: 0,
			completions: 0
		}

		gTrial.author = [message.author.username, message.author.id];

		// Calculate stars (number of waves/2)
		gTrial.stars = Math.max(1, Math.floor(trials[args[0]].waves.length/2));

		// Nothing went wrong! Let's save this trial.
		message.channel.send(`The trial of ${trials[args[0]].name} has been uploaded as ID ${Object.keys(trialGlobals).length}!`);
		trials[args[0]].uploaded = Object.keys(trialGlobals).length;

		trialGlobals[Object.keys(trialGlobals).length] = objClone(gTrial);
		fs.writeFileSync(`${dataPath}/json/globaltrials.json`, JSON.stringify(trialGlobals, null, 4));
		fs.writeFileSync(`${dataPath}/json/${message.guild.id}/trials.json`, JSON.stringify(trials, null, 4));
	}
})

commands.globaltrials = new Command({
    desc: "Gets all currently uploaded global trials.",
    section: 'trials',
    aliases: ['seeglobaltrials', 'listglobaltrials'],
    args: [
        {
            name: "Sort By",
            type: "Word",
            forced: false
        }
    ],
    doc: {
        desc: "Can be sorted by different methods:```diff\n+ Newest\n+ Oldest\n+ MostLiked\n+ MostDisliked\n+ MostPlayed\n+ MostCompleted```"
    },
    func(message, args, guilded) {
		trialGlobals = setUpFile(`${dataPath}/json/globaltrials.json`, true);

		let valid = ['newest', 'oldest', 'mostliked', 'mostdisliked', 'mostplayed', 'mostcompleted'];
		let search = (args[0] && valid.includes(args[0].toLowerCase())) ? args[0].toLowerCase() : 'mostliked';
		let array = [];

		let t = {}
		for (let i in trialGlobals) {
			let canadd = false;

			// Will do search types later.
			canadd = true;

			// If we can't add, skip the rest of this.
			if (!canadd) continue;

			// The trial.
			t = trialGlobals[i];

			// Title of the trial + stars.
			let titlet = `__<:golden:973077051751940138>${t.stars ?? 1}__ ${t.name ?? `Public Trial #${i}`} ${t.author ? `_(${t.author[0]})_` : ''}`;
			let desct = `**ID: ${i}\n${t.online.likes}<:effective:963413917038694401>, ${t.online.dislikes}<:resist:963413917185491014>, ${t.online.plays}${statusEmojis.fear}, ${t.online.completions}${elementEmoji.slash}**`;

			// Level Locks
			if (t.levellock) desct += `\n🔒 _Trial locked behind **Level ${t.levellock}**_`;

			// Add this one to the display!
			array.push({
				display: {title: titlet, desc: desct},
				trialdata: t,
				id: i
			});
		}

		if (array.length < 1) return void message.channel.send("No online trials found! Why not be the first to make one? That ID of 0 would look pretty sweet...");
		listGlobalTrials(message.channel, array, message.author.id);
    }
})

commands.playglobaltrial = new Command({
    desc: "Begins a global trial in this channel denoted by the <ID> with <Party>",
    section: 'trials',
    aliases: ['enterglobaltrial'],
    args: [
        {
            name: "ID",
            type: "Num",
            forced: true
        },
        {
            name: "Party",
            type: "Word",
            forced: true
        }
    ],
    func(message, args, guilded) {
		trialGlobals = setUpFile(`${dataPath}/json/globaltrials.json`, true);
		parties = setUpFile(`${dataPath}/json/${message.guild.id}/parties.json`)

		if (trialGlobals[args[0]] && parties[args[1]]) {
			trialGlobals[args[0]].online.plays++;
			fs.writeFileSync(`${dataPath}/json/globaltrials.json`, JSON.stringify(trialGlobals, null, 4));
			beginGlobalTrial(trialGlobals[args[0]], args[0], parties[args[1]], args[1], message.channel);
		} else {
			message.channel.send("Either the trial or party you entered does not exist!");
		}
    }
})

commands.exporttrialjson = new Command({
	desc: "Exports a trial json file. I don't know why you'd want it but... sure.",
	aliases: ['exporttrialfile', 'realexporttrial'],
	section: "characters",
	args: [
		{
			name: "Trial Name",
			type: "Word",
			forced: true
		}
	],
    admin: 'You don\'t have permission to export a trial\'s definitions.',
	checkban: true,
	func: async(message, args) => {
		if (args[0] == "" || args[0] == " ") return message.channel.send('Invalid trial name! Please enter an actual name.');

		let trials = setUpFile(`${dataPath}/json/${message.guild.id}/trials.json`, true)
		if (!trials[args[0]]) return message.channel.send(`${args[0]} is a nonexistant trial!`);

		let link = await hastebin(JSON.stringify(trials[args[0]], '	', 4), {extension: "json"});

		message.channel.send(`👍 ${message.author}, check your DMs!`);
		message.author.send(`Here is the trial data for ${trials[args[0]].name}!\n${link}`);
	}
})
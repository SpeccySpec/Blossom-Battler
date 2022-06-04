statusList = {
	status: new Extra({
		name: 'Status',
		desc: '<Chance>% to inflict one of multiple <Status Effect>s on the target.',
		args: [
			{
				name: 'Status Effect #1',
				type: 'Word',
				forced: true,
				multiple: true,
			},
			{
				name: 'Chance',
				type: 'Decimal'
			}
		],
		applyfunc(message, skill, args) {
			let statusEffect = args.filter(x => statusEffects.includes(x.toLowerCase()))
			if (statusEffect.length === 0) return message.channel.send("You're not adding any valid status effects! Use the ''liststatus'' command to list all status effects.");
			statusEffect = statusEffect.map(x => x.toLowerCase())

			let chance = args[args.length - 1] > 0 ? args[args.length - 1] : 100;

			if (statusEffect.length === 1) statusEffect = statusEffect[0];

			skill.status = statusEffect;
			skill.statuschance = chance;
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			if (hasStatusAffinity(char, skill.status.toLowerCase(), 'block')) return `__${targ.name}__ blocked it!\n${selectQuote(char, 'badatk')}\n${selectQuote(targ, 'block')}`;

			let chance = (skill.statusChance ?? skill.statuschance) + ((char.stats.chr-targ.stats.chr)/2);
			if (isPhysicalStatus(skill.status.toLowerCase())) chance = (skill.statusChance ?? skill.statuschance) + ((char.stats.luk-targ.stats.luk)/2);

			if (randNum(1, 100) <= chance) {
				return `${inflictStatus(targ, skill.status.toLowerCase())}\n${selectQuote(char, 'landed')}\n${selectQuote(targ, 'hurt')}`;
			} else {
				return dodgeTxt(char, targ);
			}
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: extrasList.buff.desc,
		args: extrasList.buff.args,
		multiple: true,
		diffflag: [0, 1, 3],
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const chance = Math.min(args[3] ?? 100, 100)
			const turns = args[4] ?? null

			if (target != 'user' && target != 'target') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\` or \`target\`.`)
			if (!stats.includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (chance <= 0)
				return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makeStatus(skill, "buff", [target, stat, stages, chance, turns])
			return true
		},
		onselect(char, skill, btl, vars) {
			return extrasList.buff.onselect(char, skill, btl, vars);
		},
		onuse(char, targ, skill, btl, vars) {
			return extrasList.buff.onuse(char, targ, skill, btl, vars)
		}
	}),

	dekunda: new Extra({
		name: "Dekunda",
		desc: "Removes the target's positive buffs.",
		args: [],
		applyfunc(message, skill, args) {
			makeStatus(skill, "dekunda", [true]);
			return true;
		},
		onuse(char, targ, skill, btl, vars) {
			for (let i in targ.buffs) {
				if (targ.buffs[i] > 0) targ.buffs[i] = 0;
			}

			return `__${targ.name}__'s positive buffs were nullified!`;
		}
	}),

	heartswap: new Extra({
		name: "Heart Swap",
		desc: "Swaps the target's stat changes with the user's.",
		args: [],
		applyfunc(message, skill, args) {
			makeStatus(skill, "heartswap", [true]);
			return true;
		}
	}),

	mimic: new Extra({
		name: "Mimic",
		desc: "Morphs into an ally or an enemy of the user's choice for <Turns> turns. The user can change back with {Skill}.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Skill",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			let turns = args[0]
			let skillName = args[1]
			if (turns < 1) return void message.channel.send("You can't have less than 1 turn!");

			if (skillName && !skillFile[skillName]) return void message.channel.send("That's not a valid skill!");
			if (skillName && skillFile[skillName] && (!skillFile[skillName].statusses || (skillFile[skillName].statusses && !skillFile[skillName].statusses.unmimic))) return void message.channel.send("That skill can't unmimic people!");

			makeStatus(skill, "mimic", [turns, skillName ?? null]);
			return true;
		}
	}),

	unmimic: new Extra({
		name: "Unmimic",
		desc: "Will return the user to their original form.",
		args: [],
		applyfunc: function(message, skill, args) {
			makeStatus(skill, "unmimic", [true]);
			return true;
		}
	}),

	clone: new Extra({
		name: "Clone",
		desc: "Clones the user into a new ally with <HP Percent>% of Max HP, <MP Percent>% of Max MP, and <Percent>% of the user's stats.",
		args: [
			{
				name: "HP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "MP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let hpPercent = args[0]
			let mpPercent = args[1]
			let percent = args[2]

			if (hpPercent < 10) return void message.channel.send("The clone would be dead with such a low HP!");
			if (mpPercent < 10) return void message.channel.send("The clone wouldn't really be able to use skills if the one it cloned is a magic user!");
			if (percent < 10) return void message.channel.send("With such low stats, the clone would be useless!");

			makeStatus(skill, "clone", [hpPercent, mpPercent, percent]);
			return true;
		}
	}),

	shield: new Extra({
		name: "Shield",
		desc: "Protects the target with an <Element> shield called <Shield Name> that can take {Hits} hits.",
		args: [
			{
				name: "Shield Name",
				type: "Word",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Hits",
				type: "Num",
			}
		],
		applyfunc(message, skill, args) {
			let shieldName = args[0]
			let element = args[1].toLowerCase()
			let hits = args[2] ?? 1

			if (shieldName.length < 1) return void message.channel.send("You need to name the shield!");
			if (!Elements.includes(element)) return void message.channel.send("That's not a valid element!");
			if (hits < 1) return void message.channel.send("The shield would be destroyed before it can even serve its purpose!");
			
			makeStatus(skill, "shield", [shieldName, element, hits]);
			return true;
		}
	}),

	karn: new Extra({
		name: "Karn",
		desc: "Protects the target with a shield that repels <Phys/Mag> attacks.",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let phys = args[0].toLowerCase()

			if (!["phys", "mag"].includes(phys)) return void message.channel.send("That's not a valid type! The shield can only repel physical or magical attacks.");

			makeStatus(skill, "karn", [phys]);
			return true;
		}
	}),

	shieldbreak: new Extra({
		name: "Shield Break",
		desc: "_<Shield/Tetra/Makara> <Chance>_\nHas a <Chance>% chance to break the target's <Shield/Tetra/Makara>.",
		args: [
			{
				name: "Shield/Tetra/Makara",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let type = args[0].toLowerCase()
			let chance = args[1]

			if (!["shield", "tetra", "makara"].includes(type)) return void message.channel.send("That's not shield/tetra/makara!");
			if (chance < 1) return void message.channel.send("How would you break a shield with a less than 1% chance?");
			
			makeStatus(skill, "shieldbreak", [type, chance]);
			return true;
		}
	}),

	trap: new Extra({
		name: "Trap",
		desc: "Protects the target with a trap called <Trap Name> that is set off once a physical attack strikes them and multiplies power by <Power Multiplier>x. Variables differ based on <Type>\n```diff\n+ Buff: Stat, Stages, Chance\n+ Status: Valid Status Effect, Chance\n+ Damage: Power, Accuracy, Element```",
		args: [
			{
				name: "Trap Name",
				type: "Word",
				forced: true
			},
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Type",
				type: "Word",
				forced: true
			},
			{
				name: "Variable #1",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			let trapName = args[0]
			let powerMult = args[1]
			let type = args[2].toLowerCase()

			if (trapName.length < 1) return void message.channel.send("You need to name the trap!");
			if (!["buff", "status", "damage"].includes(trapName)) return void message.channel.send("That's not a valid trap type! The trap can only be a buff, status, or damage type.");

			if (type == "buff") {
				let stat = args[3].toLowerCase()
				let stages = (args[4] && parseInt(args[4])) ? parseInt(args[4]) : -1
				let chance = (args[5] && parseFloat(args[4])) ? parseFloat(args[4]) : 100

				if (!stats.includes(stat)) return void message.channel.send("That's not a valid stat!");
				if (chance <= 0) return void message.channel.send("The trap would be useless if it had a chance of 0%!");

				makeStatus(skill, "trap", [trapName, powerMult, type, stat, stages, chance]);
			} else if (type == "status") {
				let status = args[3].toLowerCase()
				let chance = (args[4] && parseFloat(args[4])) ? parseFloat(args[4]) : 100

				if (!statusEffects.includes(status)) return void message.channel.send("That's not a valid status effect!");
				if (chance <= 0) return void message.channel.send("The trap would be useless if it had a chance of 0%!");

				makeStatus(skill, "trap", [trapName, powerMult, type, status, chance]);
			} else if (type == "damage") {
				let power = (args[3] && parseInt(args[3])) ? parseInt(args[3]) : 60
				let accuracy = (args[4] && parseFloat(args[4])) ? parseFloat(args[4]) : 100
				let element = args[5] ? args[5].toLowerCase() : "strike"

				if (power < 1) return void message.channel.send("The trap would be useless if it had a power of less than 1!");
				if (accuracy <= 0) return void message.channel.send("The trap would be useless if it had an accuracy of 0%!");

				if (!Elements.includes(element)) return void message.channel.send("That's not a valid element!");
				if (element == "heal") return void message.channel.send("You can't set a trap to heal!");
				if (element == "status") return void message.channel.send("You can't set a trap to status!");
				if (element == "passive") return void message.channel.send("You can't set a trap to passive!");

				makeStatus(skill, "trap", [trapName, powerMult, type, power, accuracy, element]);
			}
			return true;
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity",
		desc: extrasList.changeaffinity.desc,
		args: extrasList.changeaffinity.args,
		multiple: true,
		diffflag: extrasList.changeaffinity.diffflag,
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const element = args[1].toLowerCase()
			const affinity = args[2].toLowerCase()
			const side = args[3].toLowerCase()
			const turns = args[4]
			if (target != 'target' && target != 'user')
				return void message.channel.send("You entered an invalid value for <target/user>! It can be either Target or User.");
			if (![...Affinities, 'normal'].includes(affinity))
				return void message.channel.send("You entered an invalid value for <Affinity>! It can be any of the following: " + Affinities.join(', ') + " or Normal.");
			if (!Elements.includes(element))
				return void message.channel.send("You entered an invalid value for <Element>!");
			if (side != 'weak' && side != 'resist' && side != 'both')
				return void message.channel.send("You entered an invalid value for <Weak/Resist/Both>! It can be either Weak, Resist, or Both.");
			if (turns && turns < 5)
				return void message.channel.send("You can't have a turn count less than 1!");
			makeStatus(skill, "changeaffinity", [target, element, affinity, side, turns]);
			return true
		},
		onselect(char, skill, btl, vars) {
			extrasList.changeaffinity.onselect(char, skill, btl, vars);
		},
		onuse(char, targ, skill, btl, vars) {
			extrasList.changeaffinity.onuse(char, targ, skill, btl, vars);
		}
	}),

	weather: new Extra({
		name: "Weather",
		desc: "Changes the weather to <Weather>, which will affect the battle.",
		args: [
			{
				name: "Weather",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!weathers.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid weather!");

			makeStatus(skill, "weather", [args[0].toLowerCase()]);
			return true;
		}
	}),

	terrain: new Extra({
		name: "Terrain",
		desc: "Changes the terrain to <Terrain>, which will affect the battle.",
		args: [
			{
				name: "Terrain",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!terrains.includes(args[0].toLowerCase())) return void message.channel.send("That's not a valid terrain!");

			makeStatus(skill, "terrain", [args[0].toLowerCase()]);
			return true;
		}
	}),

	reincarnate: new Extra({
		name: "Reincarnate",
		desc: "Summons a level <Level> reincarnate to the user's team. The reincarnate will have stats randomized between <Minimum of Stat> and <Maximum of Stat>, HP at <HP Percent>% of user's Max HP and MP at <Percent>% of user's Max HP. You also choose which skills the reincarnated has. You can add flair to this skill with a {Deploy Message}. These can use %PLAYER% to replace with the user, and %UNDEAD% to replace with the undead.",
		args: [
			{
				name: "Level",
				type: "Num",
				forced: true
			},
			{
				name: "Minimum of Stat",
				type: "Num",
				forced: true
			},
			{
				name: "Maximum of Stat",
				type: "Num",
				forced: true
			},
			{
				name: "HP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "MP Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			},
			{
				name: "Skill #1",
				type: "Word",
				forced: true,
				multiple: true
			},
		],
		applyfunc(message, skill, args) {
			const level = args[0];
			let min = args[1]
			let max = args[2]
			let hp = args[3]
			let mp = args[4]
			let deploy = (args[5] && args[5].toLowerCase() != 'none') ? args[5] : "%PLAYER% has summoned an undead %UNDEAD%"
			let skills = args.slice(6)
			
			let settings = setUpSettings(message.guild.id)

			if (level < 1 || level > settings.caps.levelcap) return void message.channel.send("You can't have a level less than 1 or greater than " + settings.caps.levelcap + "!");
			if (min < 1) return void message.channel.send("Minimum of Stat must be at least 1!");
			if (max < 1) return void message.channel.send("Maximum of Stat must be at least 1!");
			if (max < min) return void message.channel.send("Maximum of Stat must be greater than or equal to Minimum of Stat!");
			if (hp <= 0) return void message.channel.send("HP Percent must be at least 1!");
			if (mp <= 0) return void message.channel.send("MP Percent must be at least 1!");
			if (deploy.length <= 0 || deploy.length > 500) return void message.channel.send("Deploy Message must be between 1 and 500 characters!");

			skills.filter(skill => skillFile[skill] && (!skill.levellock || (skill.levellock && (!skill.levellock != 'unobtainable' && skill.levellock <= level))))

			if (skills.length < 1) return void message.channel.send("None of the skills you entered are valid! They either don't exist or their level lock is higher than the level chosen.");

			makeStatus(skill, "reincarnate", [min, max, hp, mp, deploy, skills]);
			return true;
		}
	}),

	futuresight: new Extra({
		name: "Futuresight",
		desc: "This skill becomes an attacking skill that strikes the foe in <Turns>.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Power",
				type: "Num",
				forced: true
			},
			{
				name: "Accuracy",
				type: "Decimal",
				forced: true
			},
			{
				name: "Critical Hit Chance",
				type: "Decimal",
			},
			{
				name: "Hits",
				type: "Num",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Attack Type",
				type: "Word",
				forced: true
			},
			{
				name: "Targets",
				type: "Word",
				forced: true
			},
			{
				name: "Status",
				type: "Word",
			},
			{
				name: "Status Chance",
				type: "Decimal",
			}
		],
		applyfunc(message, skill, args) {
			let turns = args[0];
			let power = args[1];
			let accuracy = args[2];
			let critChance = math.max((args[3] ?? 0), 0);
			let hits = args[4];
			let element = args[5]?.toLowerCase();
			let atype = args[6]?.toLowerCase();
			let targets = args[7]?.toLowerCase();
			let status = args[8] || "none";
			let statusChance = math.min(math.max((args[9] ?? 0), 0), 100);

			if (turns < 1) return void message.channel.send("Turns must be at least 1!");

			if (power < 1) return void message.channel.send('Counters with 0 power or less will not function!');

			if (accuracy < 1) return void message.channel.send('Counters with 0% accuracy or less will not function!');

			if (hits < 1) return void message.channel.send('Counters with 0 hits or less will not function!');

			if (!Elements.includes(element)) {
				return void message.channel.send({content: 'Please enter a valid element for **Element!**', embeds: [elementList()]})
			}
			if (element == 'passive' || element == 'heal' || element == 'status')
				return void message.channel.send("The counter must be an attack!");

			if (atype != 'physical' && atype != 'magic' && atype != 'ranged') return void message.channel.send(`${atype} is an invalid form of contact! Try physical, magic or ranged.`);

			if (Targets.includes(targets)) return void message.channel.send('Please enter a valid target type for **Target**!```diff\n- One\n- Ally\n- Caster\n- AllOpposing\n- AllAllies\n- RandomOpposing\n- RandomAllies\n- Random\n- Everyone\n-SpreadOpposing\n- SpreadAllies```')

			let definition = {
				name: skill.name,
				pow: power,
				acc: accuracy,
				crit: critChance,
				type: element,
				target: targets,
				hits: hits,
				atktype: atype,
				turns: turns,
			}

			if (status != 'none') {
				if (!utilityFuncs.inArray(status, statusEffects)) {
					let str = `${status} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
					for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
					str += '```'
	
					return void message.channel.send(str)
				}

				definition.status = status;
				definition.statuschance = statusChance;
			}

			makeStatus(skill, "futuresight", [definition]);
			return true
		}
	}),

	chaosstir: new Extra({
		name: "Chaos Stir",
		desc: "Upon getting hit with a skill, the user strikes back with the skill with <Power Multiplier>x power and <Accuracy>% accuracy.",
		args: [
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Accuracy",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let power = args[0];
			let accuracy = args[1];

			if (power < 1) return void message.channel.send("Power must be above 0!");
			if (accuracy < 1) return void message.channel.send("Accuracy must be above 0!");

			makeStatus(skill, "chaosstir", [power, accuracy]);
			return true;
		}
	}),

	pacifystatus: new Extra({
		name: "Pacify Status",
		desc: "_<Status Effect> <Amount>_\nPacifies the target if they have <Status Effect>, by <Amount>. Accepts 'physical', 'mental', and 'all' as statuses.",
		args: [
			{
				name: "Status Effect",
				type: "Word",
				forced: true
			},
			{
				name: "Amount",
				type: "Num",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let status = args[0].toLowerCase();
			let amount = args[1];

			if (!status == "physical" && !status == "mental" && !status == "all") {
				if (!statusEffects.includes(status)) return void message.channel.send("That's not a valid status effect!");
			}

			if (amount == 0) return void message.channel.send("It won't change anything if you set the amount to 0!");

			makeStatus(skill, "pacifystatus", [status, amount]);
			return true;
		}
	}),

	ragesoul: new Extra({
		name: "Rage Soul",
		desc: "Multiplies the user's Melee Attack Power by <Melee Power Multiplier> and their Attack Stat by <ATK Stat Multiplier>, but locks them into using Melee Attacks.",
		args: [
			{
				name: "Melee Power Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "ATK Stat Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let power = args[0];
			let atk = args[1];

			makeStatus(skill, "ragesoul", [power, atk]);
			return true;
		}
	}),

	charge: new Extra({
		name: "Charge",
		desc: "Boosts <Phys/Mag> damage by <Power Multiplier>x for one turn. Removed whether attacked or not.",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			},
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let type = args[0].toLowerCase();
			let power = args[1];

			if (type != "phys" && type != "mag") return void message.channel.send("That's not a valid type! Try phys or mag.");

			makeStatus(skill, "charge", [type, power]);
			return true;
		}
	}),

	orgiamode: new Extra({
		name: "Orgia Mode",
		desc: "Modifies user's ATK and MAG by <ATK & MAG Multiplier>x and END by <END Multiplier>x for <Turns> turns. Falls asleep afterwards.",
		args: [
			{
				name: "ATK & MAG Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "END Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[2] < 1) return void message.channel.send("Turns must be above 0!");

			makeStatus(skill, "orgiamode", [args[0], args[1], args[2]]);
			return true;
		}
	})
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeStatus(skill, extra, func) {
	if (!skill.statusses) skill.statusses = {};
	if (!skill.statusses[extra]) skill.statusses[extra] = [];

	if (statusList[extra].multiple) {
		if (statusList[extra].diffflag) {
			for (i in skill.statusses[extra]) {
				if (typeof skill.statusses[extra][i] == "number") {
					if (skill.statusses[extra][i][statusList[extra].diffflag] === func[statusList[extra].diffflag]) {
						skill.statusses[extra][i] = func;
						return true;
					}
				} else {
					let alltrue = true;
					for (j in statusList[extra].diffflag) {
						if (skill.statusses[extra][i][statusList[extra].diffflag[j]] !== func[statusList[extra].diffflag[j]]) {
							alltrue = false;
							break;
						}
					}
					if (alltrue) {
						skill.statusses[extra][i] = func;
						return true;
					}
				}
			}
		}
		skill.statusses[extra].push(func);
	} else {
		skill.statusses[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this either
hasStatus = (skill, extra) => {
	if (!skill.statusses) return false;
	if (!skill.statusses[extra]) return false;
	return skill.statusses[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyStatus = (message, skill, skillExtra, rawargs) => {
	if (!skill.statusses) skill.statusses = {};
	if (!skillExtra || !statusList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''liststatusextras'' command to list all extras.");
	if (!statusList[skillExtra].apply(message, skill, rawargs)) return false
	
	message.react('👍')
	skill.done = true;
	console.log("win")
	return true;
}

buildStatus = (message, extra, args) => {
	let skill = {
		name: args[0],
		type: 'status',
		cost: args[1],
		costtype: args[2],
		target: args[3],
		originalAuthor: message.author.id
	}

	applyStatus(message, skill, extra, args.slice(6))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}

// Ah you know what
// This file shares names with Status Effects anyway lol
// We might as well shove some extra stuff in here
// statusEffectFuncs will be an object that doe ufnnye status
statusEffectFuncs = {
	burn: {
		onturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10)
			if (char.boss || char.miniboss) dmg = 5;

			if (hasStatusAffinity(char, 'burn', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'burn', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(1, char.hp-dmg);
			
			return `${char.name} took ${dmg}${affinityTxt} damage from their burns!`
		},
		statmod: function(char, stats) {
			if (hasStatusAffinity(char, 'burn', 'weak')) {
				stats.mag /= 4;
			} else if (hasStatusAffinity(char, 'burn', 'resist')) {
				stats.mag /= 1.25;
			} else {
				stats.mag /= 2;
			}

			return stats;
		}
	},

	poison: {
		onturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/10)
			if (char.boss || char.miniboss) dmg = 5;

			if (hasStatusAffinity(char, 'poison', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'poison', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(1, char.hp-dmg);
			return `${char.name} took ${dmg}${affinityTxt} damage from their poison!`;
		},
		statmod: function(char, stats) {
			if (hasStatusAffinity(char, 'poison', 'weak')) {
				stats.mag /= 4;
			} else if (hasStatusAffinity(char, 'poison', 'resist')) {
				stats.mag /= 1.25;
			} else {
				stats.mag /= 2;
			}

			return stats;
		}
	},

	bleed: {
		onturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxhp/8)
			if (char.boss || char.miniboss) dmg = 10;

			if (hasStatusAffinity(char, 'bleed', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'bleed', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(0, char.hp-dmg);
			if (char.hp <= 0) return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding, being defeated!`;

			return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding!`;
		}
	},

	freeze: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'freeze', 'weak'))
				char.statusturns = 2;
			else
				char.statusturns = 1;
		},
		onturn: function(btl, char) {
			let chance = 100;
			if (hasStatusAffinity(char, 'freeze', 'resist')) chance = 50;

			if (randNum(1, 100) <= chance)
				return [`${char.name} is frozen, losing their turn!`, false];
			else 
				return `${char.name} thaws out!`;
		}
	},

	paralyze: {
		oninflict: function(char) {
			if (hasStatusAffinity(char, 'paralysis', 'weak')) {
				char.parachance = 160;
				char.statusturns = 5;
			} else if (hasStatusAffinity(char, 'paralysis', 'resist')) {
				char.parachance = 40;
				char.statusturns = 4;
			} else {
				char.parachance = 80;
				char.statusturns = 3;
			}
		},
		onremove: function(char) {
			delete char.parachance
		},
		onturn: function(btl, char) {
			if (randNum(1, 100) <= char.parachance) {
				char.parachance /= 2;
				return [`${char.name} is stopped in their tracks by paralysis, losing their turn!`, false];
			} else {
				char.parachance /= 2;
			}
		}
	},

	sleep: {
		onturn: function(btl, char) {
			let hp = Math.round(char.maxhp/20);
			let mp = Math.round(char.maxmp/20);
			if (hasStatusAffinity(char, 'sleep', 'resist')) {
				hp *= 2
				mp *= 2
			}

			if (!hasStatusAffinity(char, 'sleep', 'weak')) {
				char.hp = Math.min(char.maxhp, char.hp+hp);
				char.mp = Math.min(char.maxmp, char.mp+mp);
				return [`${char.name} is asleep. They are able to restore ${hp}HP and ${mp}MP!`, false];
			} else {
				return [`${char.name} is in a deep sleep...`, false];
			}
		}
	},

	dizzy: {
		onturn: function(btl, char) {
			return `${char.name} is dizzy!`;
		},
		skillmod: function(char, skill, btl) {
			skill.acc /= 2;
			skill.nomod = {
				acc: true
			};
		}
	},

	despair: {
		onturn: function(btl, char) {
			let statusTxt = '';
			let affinityTxt = '';

			let dmg = Math.round(char.maxmp/10)
			if (char.boss || char.miniboss) dmg = 10;

			if (hasStatusAffinity(char, 'despair', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'despair', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.mp = Math.max(0, char.mp-dmg);
			if (char.mp <= 0) {
				char.hp = 0;
				return `${char.name} lost ${dmg}${affinityTxt}MP from their despair, running out of MP and therefore being defeated!`;
			}

			return `${char.name} lost ${dmg}${affinityTxt}MP from their despair!`;
		}
	},
}
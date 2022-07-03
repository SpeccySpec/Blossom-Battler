passiveList = {
	// On Attack.
	boost: new Extra({
		name: "Boost",
		desc: "Boosts the powers of skills of a specific element. Values for <Percentage> that are less than 100% will actually have negative effects! Negative values may even heal the foe... somehow.",
		args: [
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Percentage",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let element = args[0]?.toLowerCase();
			let percentage = args[1];

			if ((!utilityFuncs.inArray(element, Elements) && element != 'all' && element != 'magic' && element != 'physical') || element === 'almighty') return void message.channel.send("You entered an invalid element!");

			makePassive(skill, "boost", [element, percentage]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if ((typeof(skill.type) === 'object' && skill.type.includes(vars[0])) || (typeof(skill.type) === 'string' && skill.type == vars[0])) {
				skill.pow *= vars[1]/100;
			}
		}
	}),

	moodswing: new Extra({
		name: "Mood Swing",
		desc: "Every <Turns> turns, your mood will switch from Calm to Angry and back, buffing/nerfing skills respectively.",
		args: [
			{
				name: "Percentage Boost",
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
			let percentage = args[0];
			let turns = args[1];

			if (percentage == 0) return void message.channel.send("What's the point if you're not boosting anything?");
			if (turns <= 0) return void message.channel.send("You can't set it to last 0 turns or less!");

			makePassive(skill, "moodswing", [percentage, turns]);
			return true;
		},
		onturn(btl, char, vars) {
			if (char.custom?.angry) {
				char.custom.angry--;

				if (char.custom.angry <= 0) {
					killVar(char, 'angry');
					return `__${char.name}__ calmed themselves down...`;
				}
			} else {
				if (!char.custom?.calmturns) addCusVal(char, 'calmturns', vars[1]);
				char.custom.calmturns++;

				if (!char.custom.calmturns >= vars[1]) {
					killVar(char, 'calmturns');
					addCusVal(char, 'angry', vars[1]);
					return `__${char.name}__ becomes enraged, with burning fury!`;
				}
			}
		},
		statmod(btl, char, skill, vars) {
			if (char.custom?.angry) {
				skill.pow *= vars[0]/100;
			} else {
				skill.pow *= 1-(100-vars[0])/100;
			}
		}
	}),

	berserk: new Extra({
		name: "Berserk",
		desc: "With more HP, the user is more willing to fight. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		args: [
			{
				name: "Percentage Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Highest HP Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percentage = args[0];
			let hpPercent = args[1];

			if (percentage == 0) return void message.channel.send("What's the point if you're not boosting anything?");

			makePassive(skill, "berserk", [percentage, hpPercent]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (skill.atktype === 'physical' || skill.atktype === 'ranged') {
				let hppercent = (char.hp/char.maxhp)*100;
				let percent = (vars[0]-100)/100;
				let hpcap = vars[1];

				if (hppercent <= hpcap) {
					skill.pow *= 1+percent;
				} else {
					let realPercent = percent*(100-hppercent);
					skill.pow *= 1+realPercent;
				}
			}
		}
	}),

	enraged: new Extra({
		name: "Enraged",
		desc: "With less HP, the user is more angered. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		args: [
			{
				name: "Percentage Multiplier",
				type: "Decimal",
				forced: true
			},
			{
				name: "Highest HP Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percentage = args[0];
			let hpPercent = args[1];

			if (percentage == 0) return void message.channel.send("What's the point if you're not boosting anything?");

			makePassive(skill, "enraged", [percentage, hpPercent]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (skill.atktype === 'magic') {
				let hppercent = (char.hp/char.maxhp)*100;
				let percent = (vars[0]-100)/100;
				let hpcap = vars[1];

				if (hppercent <= hpcap) {
					skill.pow *= 1+percent;
				} else {
					let realPercent = percent*(100-hppercent);
					skill.pow *= 1+realPercent;
				}
			}
		}
	}),

	// Start Of Turn
	heal: new Extra({
		name: "Heal",
		desc: "Restores <Amount> of max <Cost Type> on the start of your turn, <Cost Type> being either HP, HPPercent, MP, MPPercent, or LB.",
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			},
			{
				name: "Cost Type",
				type: "Word",
				forced: true
			}
		],
		multiple: true,
		diffflag: 1,
		applyfunc(message, skill, args) {
			let amount = args[0];
			let stat = args[1]?.toLowerCase();

			if (amount == 0) return void message.channel.send("What's the point if you're healing nothing?")
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return void message.channel.send("You entered an invalid value for <Stat>! It can be either HP, HPPercent, MP, MPPercent, or LB.");

			makePassive(skill, "heal", [amount, stat]);
			return true;
		},
		onturn(btl, char, vars) {
			let finalTxt = '';
			let settings = setUpSettings(btl.guild.id);

			switch(vars[1].toLowerCase()) {
				case 'mp':
					char.mp += parseInt(vars[0]);
					finalTxt = `__${char.name}__'s MP was restored by **${vars[0]}**!`;
					break;

				case 'lb':
					if (settings.mechanics.limitbreaks) {
						char.lbpercent += parseInt(vars[0]);
						finalTxt = `__${char.name}__'s LB% was restored by **${vars[0]}**!`;
					} else {
						char.mp += (char.maxmp/100)*parseInt(vars[0]);
						finalTxt = `__${char.name}__'s MP was restored by **${(char.maxmp/100)*parseInt(vars[0])}**!`;
					}

					break;

				case 'hppercent':
					char.hp += (char.maxhp/100)*parseInt(vars[0]);
					finalTxt = `__${char.name}__'s HP was restored by **${(char.maxhp/100)*parseInt(vars[0])}**!`;
					break;

				case 'mppercent':
					char.mp += (char.maxmp/100)*parseInt(vars[0]);
					finalTxt = `__${char.name}__'s MP was restored by **${(char.maxmp/100)*parseInt(vars[0])}**!`;
					break;

				default:
					char.hp += parseInt(vars[0]);
					finalTxt = `__${char.name}__'s HP was restored by **${vars[0]}**!`;
					break;
			}

			char.hp = Math.min(char.maxhp, char.hp);
			char.mp = Math.min(char.maxmp, char.mp);
			return finalTxt;
		}
	}),

	damage: new Extra({
		name: "Damage",
		desc: "Inflicts <Damage> of <Element> damage to the target when attacked with a <Phys/Mag> skill.",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			},
			{
				name: "Damage",
				type: "Num",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let physmag = args[0]?.toLowerCase();
			let damage = args[1];
			let element = args[2]?.toLowerCase();

			if (physmag != 'phys' && physmag != 'mag')
				return void message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");

			if (damage == 0) return void message.channel.send("What's the point if it's dealing no damage?");

			if (!Elements.includes(element.toLowerCase())) return void message.channel.send("You entered an invalid value for <Element>!");
			if (skill.type == 'status' || skill.type == 'heal' || skill.type == 'passive') return void message.channel.send("You can't use this element!");
			
			makePassive(skill, "damage", [physmag, damage, element]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			let affinity = getAffinity(inf, vars[2]);
			let affinityTxt = affinityEmoji[affinity] ?? '';
			let d = vars[1];

			if ((vars[0] === 'phys' && skill.atktype === 'physical') || (vars[0] === 'mag' && skill.atktype === 'magic')) {
				if (vars[1] < 0) {
					inf.hp -= vars[1];
					return `__${inf.name}__ had their HP restored by ***${-vars[1]}*** thanks to __${char.name}__'s _${passive.name}_.`;
				} else {
					switch(affinity) {
						case 'deadly':
							d *= settings.rates.affinities?.deadly ?? 4.2;
							break;
						
						case 'superweak':
							d *= settings.rates.affinities?.superweak ?? 2.1;
							break;
						
						case 'weak':
							d *= settings.rates.affinities?.weak ?? 1.5;
							break;
						
						case 'resist':
							d *= settings.rates.affinities?.resist ?? 0.5;
							break;
						
						case 'block':
						case 'repel':
							return `__${inf.name}__ blocked __${char.name}__'s _${passive.name}_.`;

						case 'drain':
							inf.hp = Math.min(inf.maxhp, inf.hp+d);
							return `__${inf.name}__ drained __${char.name}__'s _${passive.name}_. Their HP was restored by ***${d}***${affinityTxt}!`;
					}

					inf.hp -= d;
					if (inf.hp <= 0) {
						return `Having taken ***${d}***${affinityTxt} damage, __${inf.name}__ perished due to __${char.name}__'s _${passive.name}_!`;
					} else {
						return `__${inf.name}__ took ***${d}***${affinityTxt} damage due to __${char.name}__'s _${passive.name}_!`;
					}
				}
			}
		}
	}),

	dodge: new Extra({
		name: "Dodge",
		desc: "Has a <Chance>% chance to dodge attacks from a <Phys/Mag> skill.",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let physmag = args[0]?.toLowerCase();
			let chance = args[1];

			if (physmag != 'phys' && physmag != 'mag')
				return void message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");

			if (chance < 1) return void message.channel.send("What's the point if it never dodges?");

			makePassive(skill, "dodge", [physmag, chance]);
			return true;
		},
		forcedodge(char, inf, skill, passive, btl, vars) {
			if ((vars[0] === 'phys' && skill.atktype === 'physical') || (vars[0] === 'mag' && skill.atktype === 'magic')) {
				if (randNum(1, 100) <= vars[1]) return true;
				return false;
			} else {
				return false;
			}
		}
	}),

	counter: new Extra({
		name: "Counter",
		desc: "Has a <Chance>% chance to counter <Phys/Mag> attacks with an <Attack Type> skill named <Counter Name> with <Power> power, <Accuracy>% accuracy, {Critical Hit Chance}% crit chance, and such. *Treat it like a regular skill, but without cost.*",
		args: [
			{
				name: "Phys/Mag",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Counter Name",
				type: "Word",
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
			let physmag = args[0]?.toLowerCase();
			let chance = args[1];
			let counterName = args[2];
			let power = args[3];
			let accuracy = args[4];
			let critChance = Math.max((args[5] ?? 0), 0);
			let hits = args[6];
			let element = args[7]?.toLowerCase();
			let atype = args[8]?.toLowerCase();
			let targets = args[9]?.toLowerCase();
			let status = args[10] || "none";
			let statusChance = Math.min(Math.max((args[11] ?? 0), 0), 100);

			if (physmag != 'phys' && physmag != 'mag')
				return void message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");

			if (chance < 1) return void message.channel.send("What's the point if it never happens?");

			if (message.content.includes("@everyone") || message.content.includes("@here") || message.mentions.users.first()) return void message.channel.send("Don't even try it.");
			if (counterName.length > 50) return void message.channel.send(`${counterName} is too long of a counter name.`);

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

			if (status != 'none') {
				if (!utilityFuncs.inArray(status, statusEffects)) {
					let str = `${status} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
					for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
					str += '```'
	
					return void message.channel.send(str)
				}
				makePassive(skill, "counter", [physmag, chance, {
					name: counterName,
					pow: power,
					acc: accuracy,
					crit: critChance,
					type: element,
					atktype: atype,
					target: targets,
					hits: hits,
					extras: {
						affinitypow: [5]
					},
					status: status,
					statuschance: statusChance
				}]);
			} else {
				makePassive(skill, "counter", [physmag, chance, {
					name: counterName,
					pow: power,
					acc: accuracy,
					crit: critChance,
					type: element,
					atktype: atype,
					target: targets,
					hits: hits,
					extras: {
						affinitypow: [5]
					}
				}]);
			}
			return true;
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars) {
			if ((vars[0] === 'phys' && skill.atktype === 'physical') || (vars[0] === 'mag' && skill.atktype === 'magic')) {
				if (randNum(1, 100) <= vars[2]) {
					// Run this function again... but with the COUNTER. Ban repelling to avoid infinite loops, and avoid taking damage ourselves.
					let newResults = attackWithSkill(char, inf, objClone(vars[3]), btl, true);
					result.oneMore = newResults.oneMore;
					result.teamCombo = newResults.teamCombo;

					// Return this txt
					return `${selectQuote(char, 'dodge', null, "%ENEMY%", inf.name, "%SKILL%", skill.name)}\n__${char.name}__'s _${passive.name}_ allowed them to dodge and counter!\n${newResults.txt}`;
				}
			}
		}
	}),

	status: new Extra({
		name: "Status",
		desc: "Has a <Chance>% chance of inflicting <Status Effect> on a fighter if they use a physical attack.",
		args: [
			{
				name: "Status Effect",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let status = args[0].toLowerCase();
			let chance = args[1];

			if (!Status.includes(status)) return void message.channel.send("You entered an invalid value for <Status Effect>!");
			if (chance < 1) return void message.channel.send("What's the point if it never happens?");

			makePassive(skill, "status", [status, chance]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			if (skill.atktype === 'physical') {
				if (randNum(1, 100) <= vars[1]) return inflictStatus(inf, vars[0]);
			}
		}
	}),

	statusdodge: new Extra({
		name: "Status Dodge",
		desc: "Has a <Chance>% chance to avoid <Status Effect> from being inflicted. Accepts 'physical', 'mental' and 'all' as status effects.",
		args: [
			{
				name: "Status Effect",
				type: "Word",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5) {
			let status = args[0].toLowerCase();
			let chance = args[1];

			if (!status == 'physical' && !status == 'mental' && !status == 'all') {
				if (!Status.includes(status)) return void message.channel.send("You entered an invalid value for <Status Effect>!");
			}
			if (chance < 1) return void message.channel.send("What's the point if it never happens?");

			makePassive(skill, "statusdodge", [status, chance]);
			return true;
		}
	}),

	curestatus: new Extra({
		name: "Cure Status",
		desc: "<Chance>% chance to cure a negative status effect on the start of your turn.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] < 1) return void message.channel.send("What's the point if it never cures any statusses?");
			makePassive(skill, "curestatus", [args[0]]);
			return true;
		},
		onturn(btl, char, vars) {
			if (char.status && randNum(1, 100) <= vars[0]) {
				delete char.status;
				delete char.statuschance;
				return `__${char.name}__ was able to cure themselves of their status effect.`;
			}
		}
	}),

	perfectkeeper: new Extra({
		name: "Perfect Keeper",
		desc: "Power of Physical Attacks is boosted at higher HP, and decreased at lower HP up to <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] == 0) return void message.channel.send("What's the point if it never changes?");
			makePassive(skill, "perfectkeeper", [args[0]]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (skill.atktype === 'physical') {
				skill.pow *= 1+(userDefs.hp/userDefs.maxhp)/1.42857142-0.2;
			}
		}
	}),

	extrahit: new Extra({
		name: "Extra Hit",
		desc: "Has a <Chance>% chance to hit <Hits> more times from a single hit skill with <Power Multiplier>x as much power.",
		args: [
			{
				name: "Hits",
				type: "Number",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Power Multiplier",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let hits = args[0];
			let chance = args[1];
			let powerMult = args[2];

			if (parseInt(hits) == 0) return void message.channel.send("Why bother if it doesn't add any hits?");
			if (parseInt(chance) < 1) return void message.channel.send("What's the point if it never happens?");

			makePassive(skill, "extrahit", [hits, chance, powerMult]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			let txt = false;
			for (let i = 0; i < skill.hits; i++) {
				let c = vars[1]-((vars[1]/10)*i);

				if (randNum(1, 100) <= c) {
					if (!txt) {
						addAtkMsg(btl, `__${char.name}__ was able to strike again!`);
						txt = true;
					}

					if (!skill.hits) skill.hits = 1;
					skill.hits++;
				} else {
					break;
				}
			}
		}
	}),

	kindheart: new Extra({
		name: "Kind Heart",
		desc: "_<Percent>_\nBoosts pacify rate by <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc: function(message, skill, args) {
			if (args[0] == 0) return void message.channel.send("What's the point if it never changes?");
			makePassive(skill, "kindheart", [args[0]]);
			return true;
		},
		hardcoded: true
	}),

	affinitycutter: new Extra({
		name: "Affinity Cutter",
		desc: "<Chance>% chance to bypass resist affinities.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] < 1) return void message.channel.send("If it never happens, why bother?");
			makePassive(skill, "affinitycutter", [args[0]]);
			return true;
		},
		affinitymod(inf, char, skill, affinity, btl, vars) {
			if (affinity === 'resist' || affinity === 'block') {
				if (randNum(1, 100) <= vars[0]) {
					return ['normal', `__${inf.name}__ cuts through __${char.name}__'s ${affinityEmoji[affinity]}**${affinity}** affinity!`];
				}
			}

			return null;
		}
	}),

	affinityslicer: new Extra({
		name: "Affinity Slicer",
		desc: "<Chance>% chance to bypass all affinities, turning them into a resist or better.\n```diff\n+ Drain, Repel, Block ---> Resist\n+ Resist ---> Normal\n```",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] < 1) return void message.channel.send("If it never happens, why bother?");
			makePassive(skill, "affinityslicer", [args[0]]);
			return true;
		},
		affinitymod(inf, char, skill, affinity, btl, vars) {
			if (affinity === 'resist' || affinity === 'block' || affinity === 'repel' || affinity === 'drain') {
				if (randNum(1, 100) <= vars[0]) {
					return ['normal', `__${inf.name}__ cuts through __${char.name}__'s ${affinityEmoji[affinity]}**${affinity}** affinity!`];
				}
			}

			return null;
		}
	}),

	swordbreaker: new Extra({
		name: "Sword Breaker",
		desc: "<Chance>% chance to physical attacks that hit the user to a resist.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] < 1) return void message.channel.send("If it never happens, why bother?");
			makePassive(skill, "swordbreaker", [args[0]]);
			return true;
		},
		affinitymodoninf(char, inf, skill, passive, affinity, btl, vars) {
			if (affinity === 'deadly' || affinity === 'superweak' || affinity === 'weak' || affinity === 'normal') {
				if (randNum(1, 100) <= vars[0]) {
					return ['resist', `__${char.name}__'s __${passive.name}__ changed __${skill.name}__'s attack to a resist!`];
				}
			}

			return null;
		}
	}),

	magicmelee: new Extra({
		name: "Magic Melee",
		desc: "Turns user's melee attack into a magic attack.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "magicmelee", [true]);
			return true;
		},
		hardcoded: true
	}),

	attackall: new Extra({
		name: "Attack All",
		desc: "Melee Attack targets all foes.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "attackall", [true]);
			return true;
		},
		hardcoded: true
	}),

	wonderguard: new Extra({
		name: "Wonder Guard",
		desc: "Nullifies damage from attacks that the user is not weak to.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "wonderguard", [true]);
			return true;
		},
		affinitymodoninf(char, inf, skill, passive, affinity, btl, vars) {
			if (affinity === 'deadly' || affinity === 'superweak' || affinity === 'weak') {
				return null;
			}

			return ['block', `__${char.name}__'s __${passive.name}__ made the skill have no affect!`];
		}
	}),

	repelmag: new Extra({
		name: "Repel Magic",
		desc: "<Chance>% chance to repel magic or ranged attacks of specific elements.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "Element #1",
				type: "Element",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			let chance = args[0]
			let elements = args.slice(1);
			for (let i = 0; i < elements.length; i++) elements[i] = elements[i].toLowerCase();

			if (chance < 1) return void message.channel.send("Why do this if it never happens?");

			elements = elements.filter(e => (Elements.includes(e) && e !== 'passive' && e !== 'heal' && e !== 'status' && e !== 'almighty'));

			if (elements.length < 1) return void message.channel.send("You didn't supply any valid elements!");
			makePassive(skill, "repelmag", [chance, elements]);
			return true;
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars, result) {
			// Magic/Ranged, If type is an object then check for the first two, otherwise check for type itself as it should be a string.
			if ((skill.atktype === 'magic' || skill.atktype === 'ranged') && ((typeof(skill.type) === 'object' && (vars[1].includes(skill.type[0]) || vars[1].includes(skill.type[1]))) || vars[1].includes(skill.type))) {
				if (randNum(1, 100) <= vars[0]) {
					affinity = 'repel';
					result.txt += `\n__${char.name}__'s __${passive.name}__ repelled the attack!\n`;
				}
			}

			return false;
		}
	}),

	endure: new Extra({
		name: "Endure",
		desc: "Upon defeat, revives the user until <Amount> times with {HP} HP.",
		args: [
			{
				name: "Amount",
				type: "Num",
				forced: true
			},
			{
				name: "HP",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			let amount = args[0];
			let hp = args[1] ?? 1;

			if (amount < 1) return void message.channel.send("Why do this if it never happens?");
			if (hp < 1) return void message.channel.send("One would think that you'd be able to survive with less than 1 HP.");
			
			makePassive(skill, "endure", [amount, hp]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			if (!char.custom?.endure) addCusVal(char, 'endure', 0);

			let endures = char.custom.endure;
			if (char.hp <= 0 && endures < vars[0]) {
				char.custom.endure++;
				char.hp = 1;

				return `...however, ${char.name} was able to endure the attack!`;
			}
		}
	}),

	guardboost: new Extra({
		name: "Guard Boost",
		desc: "Reduces damage taken when guarding further by <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percent = args[0];

			if (percent == 0) return void message.channel.send("Why do this if it never changes anything?");
			makePassive(skill, "guardboost", [percent]);
			return true
		},
		hardcoded: true
	}),

	guarddodge: new Extra({
		name: "Guard Dodge",
		desc: "Boosts dodigng attacks when guarding by <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percent = args[0];

			if (percent == 0) return void message.channel.send("Why do this if it never changes anything?");
			makePassive(skill, "guarddodge", [percent]);
			return true
		},
		hardcoded: true
	}),

	sacrificial: new Extra({
		name: "Sacrificial",
		desc: "Boosts the power of sacrifice skills by <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percent = args[0];

			if (percent == 0) return void message.channel.send("Why do this if it never changes anything?");
			makePassive(skill, "sacrificial", [percent]);
			return true
		},
		statmod(btl, char, skill, vars) {
			if (skill.extras?.sacrifice) skill.pow *= vars[0]/100;
		}
	}),

	alterpain: new Extra({
		name: "Alter Pain",
		desc: "Gain <Percent>% of damage taken as MP.",
		args: [
			{
				name: "Percent",
				type: "Decimal",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let percent = args[0];

			if (percent == 0) return void message.channel.send("Why do this if it never changes anything?");
			makePassive(skill, "alterpain", [percent]);
			return true
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			if (char.hp > 0) {
				let heal = Math.round((dmg/100)*vars[0]);
				char.mp = Math.min(char.maxmp, char.mp+heal);
				return `__${char.name}'s__ _${passive.name}_ was able to restore **${heal}MP** from the attack!`;
			}
		}
	}),

	sacrifice: new Extra({
		name: "Sacrifice",
		desc: "Upon foe defeat, restores HP equal to <HP Percent>% of the foe's level and MP equal to <MP Percent>% of the foe's level.",
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
			}
		],
		applyfunc(message, skill, args) {
			let hp = args[0];
			let mp = args[1];

			if (hp == 0 || mp == 0) return void message.channel.send("Why do this if it never changes anything?");

			makePassive(skill, "sacrifice", [hp, mp]);
			return true
		},
		onkill(char, targ, skill, dmg, passive, btl, vars) {
			let heal = Math.round((targ.level/100)*vars[0]);
			let healmp = Math.round((targ.level/100)*vars[1]);

			char.hp = Math.min(char.maxhp, char.hp+heal);
			char.mp = Math.min(char.maxmp, char.mp+healmp);

			return `__${char.name}'s__ _${passive.name}_ was able to restore **${heal}HP** and **${healmp}MP** from __${targ.name}__'s defeat!`;
		}
	}),

	elementstore: new Extra({
		name: "Element Store",
		desc: "<Chance>% chance to store <Damage Percent>% of damage taken from <Element> attacks to add up for the next attack. Stackable. Once hit, the stored damage is reset.",
		args: [
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Damage Percent",
				type: "Decimal",
				forced: true
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let element = args[0].toLowerCase()
			let damage = args[1];
			let chance = args[2];

			if (!Elements.includes(element)) return void message.channel.send("You didn't supply a valid element!");
			if (element === "heal" || element === "status" || element === "passive") return void message.channel.send("This element doesn't deal damage!");
			if (damage == 0) return void message.channel.send("Why do this if it never changes anything?");
			if (chance <= 0) return void message.channel.send("When you're trying to store damage, you need to have it happen at least once!");

			makePassive(skill, "elementstore", [element, damage, chance]);
			return true;
		}
	}),

	affinitypoint: new Extra({
		name: "Affinity Point",
		desc: "Every heal you obtain nets you a <Point Name>. These will buff your attacks depending on the power of the affinitypoint buff on the skill.",
		args: [
			{
				name: "Max Points",
				type: "Number",
				forced: true
			},
			{
				name: "Point Name",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			makePassive(skill, "affinitypoint", [args[0]]);
			return true;
		},
		onheal(char, ally, skill, heal, btl, vars) {
			if (!char.custom.affinitypoint) addCusVal(char, 'affinitypoint', 0);

			if (char.custom.affinitypoint < vars[0]) {
				char.custom.affinitypoint++;
				return `${char.name} obtained a __${vars[1]}__. _(${char.custom.affinitypoint}/${vars[0]})_`;
			}
		}
	})
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makePassive(skill, extra, func) {
	if (!skill.passive) skill.passive = {};
	if (!skill.passive[extra]) skill.passive[extra] = [];

	if (passiveList[extra].multiple) {
		if (passiveList[extra].diffflag) {
			for (i in skill.passive[extra]) {
				if (skill.passive[extra][i][passiveList[extra].diffflag] === func[passiveList[extra].diffflag]) {
					skill.passive[extra][i] = func;
					return true;
				}
			}
		}
		skill.passive[extra].push(func);
	} else {
		skill.passive[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this either
hasPassiveType = (skill, extra) => {
	if (!skill.passive) return false;
	if (!skill.passive[extra]) return false;
	return skill.passive[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyPassive = (message, skill, skillExtra, rawargs) => {
	if (!skill.passive) skill.passive = {};
	if (!passiveList || !passiveList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''listpassiveextras'' command to list all extras.");
	if (!passiveList[skillExtra].apply(message, skill, rawargs)) return false
	
	message.react('👍')
	skill.done = true;
	console.log("win")
	return true;
}

buildPassive = (message, extra, args) => {
	let skill = {
		name: args[0],
		type: 'passive',
		originalAuthor: message.author.id
	}

	applyPassive(message, skill, extra, args.slice(3))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}
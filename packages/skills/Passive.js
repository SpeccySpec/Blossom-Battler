let costTypeNames = {
	hp: "HP",
	mp: "MP",
	hpandmp: "HP and MP",
	lb: "LB",
	lbpercent: "% of user's LB",
	hppercent: "% of user's Max HP",
	mppercent: "% of user's Max MP",
	hpandmppercent: "% of user's Max HP AND Max MP",
}
let targetNames = {
	one: 'opponent',
	ally: 'ally',
	caster: 'caster',

	randomopposing: 'random opponent',
	randomallies: 'random ally',
	random: 'random fighter',

	allopposing: 'all opponent',
	allallies: 'all ally',
	
	everyone: 'everyone',
	
	spreadopposing: 'opponent spread',
	spreadallies: 'ally spread',

	randomspreadopposing: 'random opponent spread',
	randomspreadallies: 'random ally spread',
	randomspread: 'random fighter spread',

	widespreadopposing: 'opponent wide spread',
	widespreadallies: 'ally wide spread',

	randomwidespreadopposing: 'random opponent wide spread',
	randomwidespreadallies: 'random ally wide spread',
	randomwidespread: 'random fighter wide spread',
}

/*
	[[[Hook Documentation - PASSIVE hooks in order of appearance.]]]

	statmod(btl, char, skill, vars)
	- Freely change the character and skill's stats on use.

	onturn(btl, char, vars, passive)
	- On the start of the turn, this runs.

	dmgmod(char, targ, dmg, skill, btl, vars)
	- Should return an integer that is going to be the new damage dealt.

	critmod(char, targ, dmg, crit, skill, btl, vars)
	- Returns the crit chance. You can edit the crit chance.

	endturn(btl, char, action, skill)
	- onturn() but after the player has moved, including action.

	onweather(char, weather, psv, btl, vars)
	- Every time the weather is changed.

	onterrain(char, terrain, psv, btl, vars)
	- Every time the terrain is changed.
*/

passiveList = {
	// On Attack.
	boost: new Extra({
		name: "Boost (Persona)",
		desc: "Boosts the powers/damage of skills of a specific element/attack type/cost type/target, of user's main element, multi-hit skills, skills that inflict or don't inflict a status effect, or all skills in general.",
		args: [
			{
				name: "Element / 'All' / Attack Type / 'Multi-hit' / Cost Type / Target / Status Effect / 'NoStatus' / 'MainElement' / 'Crit' / 'CritDmg' / StatusChance",
				type: "Word",
				forced: true
			},
			{
				name: "Amount",
				type: "Decimal",
				forced: true
			},
			{
				name: "Use percentages?",
				type: "YesNo"
			},
			{
				name: "Boost damage instead?",
				type: "YesNo"
			},
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let element = args[0].toLowerCase();
			let amount = args[1];
			let usePercent = args[2] ?? true;
			let boostDamage = args[3] ?? false;

			if (![...Elements, ...Targets, ...statusEffects, 'all', 'magic', 'ranged', 'sorcery', 'physical', 'multi-hit', 'nostatus', 'mainelement', 'crit', 'critdmg', 'statuschance'].includes(element) && !costTypeNames[element]) return void message.channel.send("You entered an invalid type for the boost!");
			if (element == 'almighty' || element == 'passive') return void message.channel.send("You cannot boost the powers of almighty or passive skills!");
			if (amount == 0) return void message.channel.send('With the amount being 0, it wouldn\'t change power at all.');

			makePassive(skill, "boost", [element, amount, usePercent, boostDamage]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (vars[3]) return;
			if ((typeof(skill.type) === 'object' && skill.type.includes('almighty')) || (typeof(skill.type) === 'string' && skill.type == 'almighty')) return;

			let type = vars[0];

			if (type == 'all' 
			|| ((typeof(skill.type) === 'object' && skill.type.includes(type)) || (typeof(skill.type) === 'string' && skill.type == type))
			|| type == skill?.atktype
			|| (type == 'multi-hit' && skill?.hits > 1)
			|| type == skill?.costtype
			|| type == skill?.target
			|| (type == 'nostatus' && !skill?.status)
			|| ((typeof(skill.status) === 'string' && skill?.status == type) || (typeof(skill.status) === 'object' && skill?.status.includes(type)))
			|| (type == 'mainelement' && ((typeof(skill.type) === 'object' && skill.type.includes(char.mainElement)) || (typeof(skill.type) === 'string' && skill.type == char.mainElement)))) {
				if (vars[2]) skill.pow *= (vars[1]/100) + 1;
				else skill.pow += vars[1] / (type == 'heal' || type == 'status' ? 100 : 1);
			}
		},
		dmgmod(char, targ, dmg, skill, btl, vars) {
			if (!vars[3]) return;
			if ((typeof(skill.type) === 'object' && skill.type.includes('almighty')) || (typeof(skill.type) === 'string' && skill.type == 'almighty')) return;

			let type = vars[0];

			if (type == 'all' 
			|| ((typeof(skill.type) === 'object' && skill.type.includes(type)) || (typeof(skill.type) === 'string' && skill.type == type))
			|| type == skill?.atktype
			|| (type == 'multi-hit' && skill?.hits > 1)
			|| type == skill?.costtype
			|| type == skill?.target
			|| (type == 'nostatus' && !skill?.status)
			|| ((typeof(skill.status) === 'string' && skill?.status == type) || (typeof(skill.status) === 'object' && skill?.status.includes(type)))
			|| (type == 'mainelement' && ((typeof(skill.type) === 'object' && skill.type.includes(char.mainElement)) || (typeof(skill.type) === 'string' && skill.type == char.mainElement)))) {
				if (vars[2]) dmg *= (vars[1]/100) + 1;
				else dmg += vars[1];
			}
			
			return dmg;
		},
		critmod(char, targ, dmg, crit, skill, btl, vars) {
			let type = vars[0];
			if (type == 'crit') crit += vars[1];
			return crit;
		},
		critdmgmod(char, targ, dmg, skill, btl, vars) {
			let type = vars[0];
			if (type == 'critdmg') {
				if (vars[2])
					dmg *= (vars[1]/100) + 1;
				else
					dmg += vars[1];
			}
			return crit;
		},
		getinfo(vars, skill) {
			let txt = `Boosts `;
			let symbol = '';

			for (let i in vars) {
				if (!vars[i]) continue;

				let type = vars[i][0] ?? 'fire';
				let midText = type ?? 'fire';
				if (costTypeNames[midText]) midText = costTypeNames[midText];
				if (Targets.includes(midText)) midText = targetNames[midText];
				if (midText == 'nostatus') midText = 'non-status effect';
				if (midText == 'mainelement') midText = 'user\'s main element';

				let suffixText = '';
				if (Targets.includes(type)) suffixText = ' targetting';
				if (costTypeNames[type]) suffixText = ' costing';
				if (statusEffects.includes(type)) suffixText = ' inflictable';

				if (type == 'crit') {
					symbol = statusEmojis.critup;
				} else {
					symbol = elementEmoji[type] ?? statusEmojis[type] ?? '';
				}

				let typeTxt = midText.charAt(0).toUpperCase() + midText.slice(1) + suffixText
				txt += `${symbol}**${typeTxt}** ${type == 'heal' || (type == 'support' || type == 'status') ? 'skill' : 'attack'} ${type == 'heal' || (type == 'support' || type == 'status') ? `${vars[i][3] ? 'result' : 'effectiveness'}` : `${vars[i][3] ? 'damage' : 'power'}`} by **${vars[i][1] / (!vars[i][3] && !vars[i][2] && (type == 'heal' || (type == 'support' || type == 'status')) ? 100 : 1)}${vars[i][2] ? '%' : (!vars[i][3] && (type == 'heal' || (type == 'support' || type == 'status')) ? 'x' : '')}**`

				if (i < vars.length - 2) 
					txt += `, `
				else if (i == vars.length - 2) 
					txt += ` and `
			}

			return txt;
		}
	}),

	statusboost: new Extra({
		name: "Status Boost (Original)",
		desc: "Boosts the chance of inflicting <Status Effect> by <Percentage>.",
		args: [
			{
				name: "Status Effect / Physical / Mental / All",
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
			let status = args[0].toLowerCase();
			let amount = args[1];

			if (![...statusEffects, 'physical', 'mental', 'all'].includes(status)) 
				return void message.channel.send("That status effect does not exist!");

			if (amount == 0)
				return void message.channel.send('With the amount being 0, it wouldn\'t change power at all.');

			makePassive(skill, "statusboost", [status, amount]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			let type = vars[0];
			let phys = isPhysicalStatus(type);

			if (skill.status && (type == 'all' || (type == 'physical' && phys) || (type == 'mental' && !phys) || skill.status == type) && skill.statuschance) {
				if (vars[2]) {
					skill.statuschance *= (vars[1]/100)+1;
				} else { 
					skill.statuschance += vars[1];
				}

				return;
			}
		},
		getinfo(vars, skill) {
			let txt = `Increases the chance of inflicting `;
			let type = '';
			let symbol = '';

			for (let i in vars) {
				if (!vars[i]) continue;

				type = vars[i][0];
				symbol = statusEmojis[type] ?? '';

				if (type == 'all') {
					txt += "**All status effects**"
				} else if (type == 'physical') {
					txt += "<:physical:973077052129423411>**Physical status effects**"
				} else if (type == 'mental') {
					txt += "<:mental:1004855144745291887>**Mental status effects**"
				} else {
					txt += `${symbol}**${statusNames[type]}**`
				}

				txt += ` by **${vars[i][1]}%**`
				if (i < vars.length - 2) 
					txt += `, `
				else if (i == vars.length - 2) 
					txt += ` and `
			}

			return txt;
		}
	}),

	earlybird: new Extra({
		name: "Early Bird (Pokémon)",
		desc: "For the first <Turns> turns the user's skills gain <Percentage Boost>% more power. Additionally the skills can lose <Accuracy Lost> in these turns, if set.",
		args: [
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Percentage Boost",
				type: "Decimal",
				forced: true
			},
			{
				name: "Accuracy Lost",
				type: "Decimal"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[0]
			const boost = args[1]
			const acclost = args[2] ?? 0
			if (turns <= 0)
				return void message.channel.send("The extra must last at least 1 turn!")
			makePassive(skill, "earlybird", [turns, boost, acclost]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (btl.turn <= vars[0]) {
				skill.pow *= (vars[1]/100) + 1;
				skill.acc -= vars[2]
			}
		},
		getinfo(vars, skill) {
			const turns = vars[0]
			const acclost = vars[2]
			return `Boosts power by **${vars[1]}%** for ${turns == 1 ? "**the first turn**" : `the first **${turns}** turns`}${acclost ? `, but accuracy will decrease by **${acclost}**` : ""}`
		}
	}),

	moodswing: new Extra({
		name: "Mood Swing (Original)",
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
			if (!char.custom?.moodswing) addCusVal(char, 'moodswing', {
				isAngry: false,
				turns: vars[1],
			});
			char.custom.moodswing.turns++;

			if (char.custom.moodswing.turns >= vars[1]) {
				char.custom.moodswing.turns = 0;
				char.custom.moodswing.isAngry = !char.custom.moodswing.isAngry;
				return !char.custom.moodswing.isAngry ? `__${char.name}__ calmed themselves down...` : `__${char.name}__ becomes enraged, with burning fury!`;
			}
		},
		statmod(btl, char, skill, vars) {
			let result = (vars[0]/100) + 1

			if (char.custom?.moodswing?.isAngry) {
				skill.pow *= result;
			} else {
				skill.pow /= result;
			}
		},
		getinfo(vars, skill) {
			return `Changes the user's mood **per${vars[1] > 1 ? ` ${vars[1]}` : ''} turn${vars[1] > 1 ? 's' : ''}** with a positive or negative skill power change of **${vars[0]}%**`;
		}
	}),

	berserk: new Extra({
		name: "Berserk (Original)",
		desc: "The higher the HP, up to <Highest HP Percent>%, the stronger physical and ranged attacks will be by up to <Percentage Multiplier>%. <Percentage Multiplier> should be more than 100%.",
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

				if (hppercent >= hpcap) {
					skill.pow *= 1+percent;
				} else {
					let realPercent = percent*(100-hppercent)/100;
					skill.pow *= 1+realPercent;
				}
			}
		},
		getinfo(vars, skill) {
			return `Boosts physical and ranged attacks by up to **${vars[0]-100}%** with more HP up to **${vars[1]}% of user's max HP**`;
		}
	}),

	enraged: new Extra({
		name: "Enraged (Original)",
		desc: "The less the HP, up to <Highest HP Percent>%, the stronger magical attacks will be by up to <Percentage Multiplier>%. <Percentage Multiplier> should be more than 100%.",
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
					let realPercent = percent*(100-hppercent)/100;
					skill.pow *= 1+realPercent;
				}
			}
		},
		getinfo(vars, skill) {
			return `Boosts magic attacks by up to **${vars[0]-100}%** with less HP down to **${vars[1]}% of user's max HP**`;
		}
	}),

	typemod: new Extra({
		name: "Type Mod (Pokémon)",
		desc: "Changes a move's element from one to another, along with boosting power slightly. Only works with single type skills.",
		args: [
			{
				name: "Target Type",
				type: "Word",
				forced: true
			},
			{
				name: "Type to change to",
				type: "Word",
				forced: true
			},
			{
				name: "Power Modifier in Percent",
				type: "Num",
				forced: false
			}
		],
		applyfunc(message, skill, args) {
			let usertype = args[0].toLowerCase();
			let targtype = args[1].toLowerCase();
			let dmgmod = parseInt(args[2]);

			if (!Elements.includes(usertype))
				return void message.channel.send(`${args[0]} is an invalid element!`);

			if (usertype == 'support' || usertype == 'status' || usertype == 'passive' || usertype == 'heal')
				return void message.channel.send(`You can't change skills from ${args[0]} type!`);

			if (!Elements.includes(targtype))
				return void message.channel.send(`${args[1]} is an invalid element!`);

			if (targtype == 'almighty' || targtype == 'support' || usertype == 'status' || targtype == 'passive' || targtype == 'heal')
				return void message.channel.send(`You can't change skills to ${args[1]} type!`);

			if (dmgmod && (dmgmod <= 0 || dmgmod >= 500))
				return void message.channel.send("Please enter a power modifier above 0% and below 500%!");

			makePassive(skill, "typemod", [usertype, targtype, dmgmod ?? 100]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (skill.type == vars[0]) {
				skill.type = vars[1];
				if (vars[2]) skill.pow *= vars[2]/100;
			}
		},
		getinfo(vars, skill) {
			let symbol1 = elementEmoji[vars[0]] ?? '';
			let symbol2 = elementEmoji[vars[1]] ?? '';
			let type1 = vars[0].charAt(0).toUpperCase() + vars[0].slice(1);
			let type2 = vars[1].charAt(0).toUpperCase() + vars[1].slice(1);

			let str = `Changes ${symbol1}**${type1}** skills to ${symbol2}**${type2}**`;

			if (vars[2] && vars[2] != 100)
				str += `, along with retaining **${vars[2]}%** of it's original strength`;

			return str
		}
	}),

	// Start Of Turn
	heal: new Extra({
		name: "Heal (Original)",
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
			let amount = vars[0]

			switch(vars[1].toLowerCase()) {
				case 'mp': {
					char.mp = Math.max(char.mp + amount, 0)
					finalTxt = `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was restored by **${amount}**!`;
					break;
				}

				case 'lb': {
					if (settings.mechanics.limitbreaks) {
						char.lbpercent = Math.max(char.lbpercent + amount, 0)
						finalTxt = `__${char.name}__'s LB% was increased by **${amount}%**!`;
					} else {
						amount = Math.round((char.maxmp/100)*amount)
						char.mp = Math.max(char.mp + amount, 0)
						finalTxt = `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was restored by **${amount}**!`;
					}

					break;
				}

				case 'hppercent': {
					amount = Math.round((char.maxhp/100)*amount)
					char.hp = Math.max(char.hp + amount, 0)
					finalTxt = `__${char.name}__'s HP was restored by **${amount}**!`;
					break;
				}

				case 'mppercent': {
					amount = Math.round((char.maxmp/100)*amount)
					char.mp = Math.max(char.mp + amount, 0)
					finalTxt = `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was restored by **${amount}**!`;
					break;
				}

				default:
					char.hp = Math.max(char.hp + amount, 0)
					finalTxt = `__${char.name}__'s HP was restored by **${amount}**!`;
					break;
			}

			char.hp = Math.min(char.maxhp, char.hp);
			char.mp = Math.min(char.maxmp, char.mp);
			return finalTxt;
		},
		getinfo(vars, skill) {
			let txt = 'Heals **'

			for (i in vars) {
				txt += `${vars[i][0]}${costTypeNames[vars[i][1]].length == 2 ? ' ' : ''}${costTypeNames[vars[i][1]]}`;

				if (i < vars.length - 2) {
					txt += ', ';
				} else if (i == vars.length - 2) {
					txt += ' and ';
				}
			}

			return txt + '** every turn';
		}
	}),

	damage: new Extra({
		name: "Damage (Original)",
		desc: "Inflicts <Damage> of <Element> damage to the target when attacked with a <Phys/Mag/Ranged/Sorcery> skill.",
		args: [
			{
				name: "Phys/Mag/Ranged/Sorcery",
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
		diffflag: [0, 2],
		applyfunc(message, skill, args) {
			let physmag = args[0]?.toLowerCase();
			let damage = args[1];
			let element = args[2]?.toLowerCase();

			if (physmag != 'phys' && physmag != 'mag' && physmag != 'ranged' && physmag != 'sorcery')
				return void message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS, MAG or RANGED.");

			if (damage == 0) return void message.channel.send("What's the point if it's dealing no damage?");

			if (!Elements.includes(element)) return void message.channel.send("You entered an invalid value for <Element>!");
			if (element == 'support' || element == 'status' || element == 'heal' || element == 'passive') return void message.channel.send("You can't use this element!");
			
			makePassive(skill, "damage", [physmag, damage, element]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			let affinity = getAffinity(inf, vars[2]);
			let affinityTxt = affinityEmoji[affinity] ?? '';
			let d = vars[1];

			if ((vars[0] === 'phys' && skill.atktype === 'physical') || (vars[0] === 'mag' && skill.atktype === 'magic') || (vars[0] === 'ranged' && skill.atktype === 'ranged') || (vars[0] === 'sorcery' && skill.atktype === 'sorcery')) {
				if (vars[1] < 0) {
					inf.hp -= vars[1];
					return ` __${inf.name}__ had their HP restored by ***${-vars[1]}*** thanks to __${char.name}__'s _${passive.name}_.`;
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
							return ` __${inf.name}__ blocked __${char.name}__'s _${passive.name}_.`;

						case 'drain':
							inf.hp = Math.min(inf.maxhp, inf.hp+d);
							return ` __${inf.name}__ drained __${char.name}__'s _${passive.name}_. Their HP was restored by ***${d}***${affinityTxt}!`;
					}

					inf.hp = Math.max(0, inf.hp-d);
					if (inf.hp <= 0) {
						return ` Having taken ***${d}***${affinityTxt} damage, __${inf.name}__ perished due to __${char.name}__'s _${passive.name}_!`;
					} else {
						let str = ` __${inf.name}__ took ***${d}***${affinityTxt} damage due to __${char.name}__'s _${passive.name}_!`;

						// On hit
						if (inf.hp > 0 && inf.custom) {
							for (let i in inf.custom) {
								if (customVariables[i] && customVariables[i].onhit) {
									str += '\n' + (customVariables[i].onhit(btl, inf, char, d, inf.custom[i], skill) ?? '');
								}
							}
						}

						// Return the final string.
						return str;
					}
				}
			}

			return '';
		},
		getinfo(vars, skill) {
			let txt = 'Inflicts '

			for (i in vars) {
				txt += `**${vars[i][1]} ${elementEmoji[vars[i][2]]}${vars[i][2].charAt(0).toUpperCase() + vars[i][2].slice(1)} damage** when struck with a **${vars[i][0] == 'sorcery' ? 'sorcery' : (vars[i][0] == 'phys' ? 'physical' : (vars[i][0] == 'ranged' ? 'ranged' : 'magic'))}** skill`;

				if (i < vars.length - 2) {
					txt += ', ';
				} else if (i == vars.length - 2) {
					txt += ' and ';
				}
			}

			return txt;
		}
	}),

	dodge: new Extra({
		name: "Dodge (Original)",
		desc: "Has a <Chance>% chance to dodge attacks from a <Phys/Mag/Ranged/Sorcery/Element> skill.",
		args: [
			{
				name: "Phys/Mag/Ranged/Sorcery/Element",
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

			if (physmag != 'phys' && physmag != 'mag' && physmag != 'ranged' && !Elements.includes(physmag))
				return void message.channel.send("You entered an invalid value for <Phys/Mag/Ranged/Element>! The valid ones are: PHYS, MAG, RANGED, SORCERY, "+Elements.join(', ')+".");

			if (chance < 1) return void message.channel.send("What's the point if it never dodges?");

			makePassive(skill, "dodge", [physmag, chance]);
			return true;
		},
		forcedodge(char, inf, skill, passive, btl, vars) {
			if ((vars[0] === 'phys' && skill.atktype === 'physical') || (vars[0] === 'mag' && skill.atktype === 'magic') || (vars[0] === 'ranged' && skill.atktype === 'ranged') || (vars[0] === 'sorcery' && skill.atktype === 'sorcery') || (vars[0] === skill.type || skill.type.includes(vars[0]))) {
				if (randNum(1, 100) <= vars[1]) return true;
				return false;
			} else {
				return false;
			}
		},
		getinfo(vars, skill) {
			let txt = 'Has'

			for (i in vars) {
				txt += ` a **${vars[i][1]}%** chance to dodge **${vars[i][0] == 'sorcery' ? 'sorcery' : (vars[i][0] == 'phys' ? 'physical' : (vars[i][0] == 'ranged' ? 'ranged' : 'magic'))}** attacks`;

				if (i < vars.length - 2) {
					txt += ', ';
				} else if (i == vars.length - 2) {
					txt += ' and ';
				}
			}

			return txt;
		}
	}),

	counter: new Extra({
		name: "Counter (Persona)",
		desc: "Has a <Chance>% chance to counter <Phys/Mag> attacks with an <Attack Type> skill named <Counter Name> with <Power> power, <Accuracy>% accuracy, {Critical Hit Chance}% crit chance, like a regular skill but the cost is optional and usually not necessary. **Physical** and **Sorcery** attacks will be countered by _Phys_, **Magic** and **Ranged** attacks will be countered by _Mag_.",
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
			},
			{
				name: "Cost",
				type: "Num"
			},
			{
				name: "Cost Type",
				type: "Word"
			},
			{
				name: "Attack Extra",
				type: "Word"
			},
			{
				name: "Variable #1, Variable #2 ...",
				multiple: true,
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const physmag = args[0]?.toLowerCase();
			const chance = args[1];
			const counterName = args[2];
			const power = args[3];
			const accuracy = args[4];
			const critChance = Math.max((args[5] ?? 0), 0);
			const hits = args[6];
			const element = args[7].toLowerCase();
			const atype = args[8].toLowerCase();
			const targets = args[9].toLowerCase();
			const status = (args[10] || "none").toLowerCase();
			const statusChance = Math.min(Math.max((args[11] ?? 0), 0), 100);
			const cost = args[12] ?? 0
			const costtype = args[13]?.toLowerCase() ?? "mp"

			if (physmag != 'phys' && physmag != 'mag')
				return void message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");
			if (chance < 1)
				return void message.channel.send("What's the point if it never happens?");
			if (message.mentions.users.size > 0)
				return void message.channel.send("You're mean for trying to mention someone!");
			if (counterName.length > 50)
				return void message.channel.send(`${counterName} is too long of a counter name.`);
			if (power < 1)
				return void message.channel.send('Counters with 0 power or less will not function!');
			if (accuracy < 1)
				return void message.channel.send('Counters with 0% accuracy or less will not function!');
			if (hits < 1)
				return void message.channel.send('Counters with 0 hits or less will not function!');
			if (!Elements.includes(element))
				return void message.channel.send({content: 'Please enter a valid element for **Element!**', embeds: [elementList()]})
			if (element == 'passive' || element == 'heal' || element == 'support' || element == 'status')
				return void message.channel.send("The counter must be an attack!");
			if (atype != 'physical' && atype != 'magic' && atype != 'ranged' && atype != 'sorcery')
				return void message.channel.send(`${atype} is an invalid form of contact! Try physical, magic, sorcery or ranged.`);
			if (!Targets.includes(targets))
				return void message.channel.send(`${targets} is an invalid target!\n` + 'Please enter a valid target type for **Target**!```diff\n- One\n- Ally\n- Caster\n- AllOpposing\n- AllAllies\n- RandomOpposing\n- RandomAllies\n- Random\n- Everyone\n- SpreadOpposing\n- SpreadAllies```')
			if (!costTypeNames[costtype])
				return void message.channel.send(`${costtype} is not a valid cost type!`)

			let counterSkill = {
				name: counterName,
				cost: cost,
				costtype: costtype,
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
			}

			if (status != 'none') {
				if (!utilityFuncs.inArray(status, statusEffects)) {
					let str = `${status} is an invalid status effect! Please enter a valid status effect for **Status!**` + '```diff'
					for (let i in statusEffects) str += `\n-${statusEffects[i]}`;
					str += '```'
	
					return void message.channel.send(str)
				}
				counterSkill.status = status;
				counterSkill.statuschance = statusChance;
			}

			if (args[14]) {
				if (['need', 'charges', 'forcemsg', 'rest'].includes(args[14].toLowerCase())) {
					return void message.channel.send(`The ${args[14]} extra may not be used with counters for technical reasons.`);
				}

				if (!applyExtra(message, counterSkill, args[14].toLowerCase(), args.slice(15))) {
					return void message.channel.send("Something went wrong with applying this extra. See above... maybe? Pwease?");
				}
			}

			makePassive(skill, "counter", [physmag, chance, counterSkill]);
			return true;
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars, result) {
			if ((vars[0] === 'phys' && (skill.atktype === 'physical' || skill.atktype === 'sorcery')) || (vars[0] === 'mag' && (skill.atktype === 'magic' || skill.atktype === 'ranged'))) {
				if (randNum(1, 100) <= vars[1]) {
					let cost = vars[2].cost
					if (cost > 0) {
						switch (vars[2].costtype) {
							case "mp": {
								if (char.mp < cost)
									return
								char.mp -= cost
								break
							}
							case "hp": {
								if (char.hp <= cost)
									return
								char.hp -= cost
								break
							}
							case "mppercent": {
								cost = Math.floor((char.maxmp * cost) / 100)
								if (char.mp < cost)
									return
								char.mp -= cost
								break
							}
							case "hppercent": {
								cost = Math.floor((char.maxhp * cost) / 100)
								if (char.hp <= cost)
									return
								char.hp -= cost
								break
							}
						}
					}
					// Run this function again... but with the COUNTER. Ban repelling to avoid infinite loops, and avoid taking damage ourselves.
					let newResults = attackWithSkill(char, inf, objClone(vars[2]), btl, true);
					result.oneMore = newResults.oneMore;
					result.teamCombo = newResults.teamCombo;

					// Return this txt
					return `${selectQuote(char, 'dodge', null, "%ENEMY%", inf.name, "%SKILL%", skill.name)}\n__${char.name}__'s _${passive.name}_ allowed them to dodge and counter!\n${newResults.txt}`;
				}
			}
		},
		getinfo(vars, skill) {
			return `Has a **${vars[1]}**% chance to counter with a **${vars[0] == 'phys' ? 'physical' : 'magic'} attack** named __${vars[2].name}__`
		}
	}),

	status: new Extra({
		name: "Status (Pokémon)",
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

			if (!statusEffects.includes(status)) return void message.channel.send("You entered an invalid value for <Status Effect>!");
			if (chance < 1) return void message.channel.send("What's the point if it never happens?");

			makePassive(skill, "status", [status, chance]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			if ((skill.atktype === 'physical' || skill.atktype === 'sorcery') && !char.dispelled) {
				if (randNum(1, 100) <= vars[1]) return inflictStatus(inf, vars[0]);
			}
		},
		getinfo(vars, skill) {
			let txt = 'Has'

			for (let i in vars) {
				txt += ` a **${vars[i][1]}%** chance of inflicting **${statusEmojis[vars[i][0]]}${vars[i][0].charAt(0).toUpperCase() + vars[i][0].slice(1)}**`

				if (i < vars.length - 2) txt += ','
				else if (i == vars.length - 2) txt += ' and'
			}

			return txt + ' when struck with a physical skill'
		}
	}),

	/*
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
	*/

	curestatus: new Extra({
		name: "Cure Status (Pokémon)",
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
		},
		getinfo(vars, skill) {
			return `Has a **${vars[0]}%** chance to **cure a negative status effect** every turn`
		}
	}),

	perfectkeeper: new Extra({
		name: "Perfect Keeper (Persona)",
		desc: "Power of Physical Attacks is boosted at higher HP, and decreased at lower HP by up to <Percent>%.",
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
			if (skill.atktype === 'physical' || skill.atktype === 'sorcery') {
				skill.pow *= 1+(userDefs.hp/userDefs.maxhp)/1.42857142-0.2;
			}
		},
		getinfo(vars, skill) {
			return `Changes power of **physical attacks** at higher HP, and decreases at lower HP by up to **${vars[0]}%**`
		}
	}),

	extrahit: new Extra({
		name: "Extra Hit (Original)",
		desc: "Has a <Chance>% chance to hit <Hits> more times from a single hit skill with <Power Multiplier>x as much power.",
		args: [
			{
				name: "Hits",
				type: "Num",
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
			if (parseInt(chance) > 100) return void message.channel.send("Please enter a chance below 100%!");
//			if (hits > 8) return void message.channel.send(`${hits} is too many hits!`);

			makePassive(skill, "extrahit", [hits, chance, powerMult]);
			return true;
		},
		hardcoded: true,
		statmod(btl, char, skill, vars) {
			let txt = false;
			let firstHit = false
			
			for (let i = 0; i < vars[0]-1; i++) {
				let c = vars[1]-((vars[1]/(10+(vars[1]/15*(i+1))))*i);

				if (randNum(1, 100) <= c) {
					if (!txt) {
						addAtkMsg(btl, `__${char.name}__ was able to strike again!`);
						txt = true;
					}

					if (!skill.hits) skill.hits = 1;
					skill.hits++;
					if (!firstHit) firstHit = skill.hits - 1;
				} else {
					break;
				}
			}
			if (firstHit) {
				addCusVal(skill, "multipower", [firstHit, skill.hits-1, vars[2]]);
			}
		},
		getinfo(vars, skill) {
			return `Has a **${vars[1]}%** chance to **hit up to ${vars[0]} more time${vars[0] > 1 ? 's' : ''}** from a single hit skill with **${vars[2]}%** power`
		}
	}),

	kindheart: new Extra({
		name: "Kind Heart (Original)",
		desc: "Boosts pacify rate by <Percent>%.",
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
		hardcoded: true,
		getinfo(vars, skill) {
			return `Increases **pacify rate** by **${vars[0]}%**`
		}
	}),

	affinitycutter: new Extra({
		name: "Affinity Cutter (Original)",
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
		},
		getinfo(vars, skill) {
			return `Has a **${vars[0]}%** chance to bypass **resist affinities**`
		}
	}),

	affinityslicer: new Extra({
		name: "Affinity Slicer (Original)",
		desc: "<Chance>% chance to bypass all resisting affinities, turning them into a resist or better.\n```diff\n+ Drain, Repel, Block ---> Resist\n+ Resist ---> Normal\n```",
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
					return [['drain', 'block', 'repel'].includes(affinity) ? 'resist' : 'normal', `__${inf.name}__ cuts through __${char.name}__'s ${affinityEmoji[affinity]}**${affinity}** affinity!`];
				}
			}

			return null;
		},
		getinfo(vars, skill) {
			return `Has a **${vars[0]}%** chance to bypass **all resisting affinities**, turning them into **a resist or better**`
		}
	}),

	swordbreaker: new Extra({
		name: "Sword Breaker (Persona)",
		desc: "<Chance>% chance for effective and normal attacks that hit the user to turn into a resist. When it does, could affect {User/Target} {Stat} by {Stages} for {Turns} turns.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "User/Target",
				type: "Word"
			},
			{
				name: "Stat",
				type: "Word"
			},
			{
				name: "Stages",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			if (args[0] < 1) return void message.channel.send("If it never happens, why bother?");

			if (args[1]) {
				if (!["user", "target"].includes(args[1].toLowerCase())) return void message.channel.send(`${args[1]} is not a valid input. Enter either "Male" or "Female".`);

				if (!args[2]) return void message.channel.send("{Stat} becomes mandatory when you enter {User/Target}.");
				if (![...stats, "crit", "all"].includes(args[2].toLowerCase())) return void message.channel.send(`${args[2]} is not a valid stat.`);

				let stages = args[3] ?? -1;
				if (stages == 0) return void message.channel.send("That amount of stages wouldn't do anything!");

				makePassive(skill, "swordbreaker", [args[0], args[1].toLowerCase(), args[2].toLowerCase(), stages]);
			} else {
				makePassive(skill, "swordbreaker", [args[0]]);
			}

			return true;
		},
		affinitymodoninf(char, inf, skill, passive, affinity, btl, vars) {
			if (affinity === 'deadly' || affinity === 'superweak' || affinity === 'weak' || affinity === 'normal') {
				if (randNum(1, 100) <= vars[0]) {
					if (vars[1]) {
						let str = `__${char.name}__'s __${passive.name}__ changed __${skill.name}__'s attack to a resist!`;

						if (vars[1] === "user") {
							buffStat(char, vars[2], vars[3])

							if (vars[3] <= 0) {
								str += `\n__${char.name}__'s ${vars[2].toUpperCase()} was lowered by ${Math.abs(vars[3])} stage(s)!`
							} else {
								str += `\n__${char.name}__'s ${vars[2].toUpperCase()} was boost by ${Math.abs(vars[3])} stage(s)!`
							}
						} else {
							buffStat(inf, vars[2], vars[3])

							if (vars[3] <= 0) {
								str += `\n__${inf.name}__'s ${vars[2].toUpperCase()} was lowered by ${Math.abs(vars[3])} stage(s)!`
							} else {
								str += `\n__${inf.name}__'s ${vars[2].toUpperCase()} was boost by ${Math.abs(vars[3])} stage(s)!`
							}
						}

						return ['resist', `${str}\n`];
					} else {
						return ['resist', `__${char.name}__'s __${passive.name}__ changed __${skill.name}__'s attack to a resist!`];
					}
				}
			}

			return null;
		},
		getinfo(vars, skill) {
			return `Has a **${vars[0]}%** chance for **effective and normal attacks** that hit the user to turn **into a resist**`
		}
	}),

	magicmelee: new Extra({
		name: "Magic Melee (Original)",
		desc: "Turns user's melee attack into a a given <Attack Type>. This can either be *magic*, *ranged*, or *sorcery*.",
		args: [
			{
				name: "Attack Type",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!["magic", "ranged", "sorcery"].includes(args[0].toLowerCase())) return void message.channel.send("Magic, Ranged, or Sorcery, are the only valid fields.");

			makePassive(skill, "magicmelee", [args[0].toLowerCase()]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return `Turns user's melee attack into **a ${vars[0] ?? "magic"} attack**`
		}
	}),

	meleetarget: new Extra({
		name: "Melee Target (Original)",
		desc: "Melee Attack gains a different target to choose between to attack.",
		args: [
			{
				name: "Targets",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			args = args.map(x => {return x.toLowerCase()}).filter(x => Targets.includes(x));
			if (args.includes('one')) {
				args = args.filter(x => x != 'one');
			}
			if (args.length <= 0) return void message.channel.send("You haven't put any valid targets.")
			if ([...new Set(args)].length == 1 && args[0] == 'one') return void message.channel.send("Melee attacks already attack a single foe. No point changing it witohut any RNG involved.")

			makePassive(skill, "meleetarget", [args]);
			return true;
		},
		hardcoded: true,
		getinfo(vars, skill) {
			let txt = `Melee Attack **targets ${vars[0].length > 1 ? 'either' : ''}`

			for (i in vars[0]) {
				switch (vars[0][i]) {
					case 'ally': txt += 'an ally'; break;
					case 'caster': txt += 'the caster'; break;

					case 'randomopposing': txt += 'a random foe'; break;
					case 'randomallies': txt += 'a random ally'; break;
					case 'random': txt += 'a random fighter'; break;

					case 'allopposing': txt += 'all foes'; break;
					case 'allallies': txt += 'all allies'; break;

					case 'everyone': txt += 'all fighters'; break;

					case 'spreadopposing': txt += 'a foe with spreading to 2 surrounding'; break;
					case 'spreadallies': txt += 'an ally with spreading to 2 surrounding'; break;

					case 'randomspreadopposing': txt += 'a random foe with spreading to 2 surrounding'; break;
					case 'randomspreadallies': txt += 'a random ally with spreading to 2 surrounding'; break;
					case 'randomspread': txt += 'a random fighter with spreading to 2 surrounding'; break;

					case 'widespreadopposing': txt += 'a foe with spreading to all foes based on distance'; break;
					case 'widespreadallies': txt += 'an ally with spreading to all allies based on distance'; break;

					case 'randomwidespreadopposing': txt += 'a random foe with spreading to all foes based on distance'; break;
					case 'randomwidespreadallies': txt += 'a random ally with spreading to all foes based on distance'; break;
					case 'randomwidespread': txt += 'a random fighter with spreading to all foes based on distance'; break;
				}

				if (i < vars.length - 2) {
					txt += `, `
				} else if (i == vars.length - 2) {
					txt += ` or `
				}
			}
			
			txt += `**`
			return txt
		}
	}),

	wonderguard: new Extra({
		name: "Wonder Guard (Pokémon)",
		desc: `Nullifies damage from attacks that the user is not weak to. This has the drawback of making successful hits <:deadly:963413916879319072>**Deadly**.`,
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "wonderguard", [true]);
			return true;
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars, result) {
			if (affinity === 'deadly' || affinity === 'superweak' || affinity === 'weak') {
				affinity = 'deadly';
				result.txt += `__${char.name}__'s __${passive.name}__ was surpassed!\n`;
			} else {
				affinity = 'block';
				return `__${char.name}__'s __${passive.name}__ nullified the skill!\n`;
			}
		},
		getinfo(vars, skill) {
			return `__Nullifies damage__ from attacks that the user is not <:effective:963413917038694401><:supereffective:963413917198082048><:deadly:963413916879319072>**weak** to`;
		}
	}),

	repelmag: new Extra({
		name: "Repel Magic (Original)",
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

			elements = elements.filter(e => (Elements.includes(e) && e !== 'passive' && e !== 'heal' && e !== 'support' && e !== 'status' && e !== 'almighty'));

			if (elements.length < 1) return void message.channel.send("You didn't supply any valid elements!");
			makePassive(skill, "repelmag", [chance, elements]);
			return true;
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars, result) {
			// Magic/Ranged, If type is an object then check for the first two, otherwise check for type itself as it should be a string.
			if ((skill.atktype === 'magic' || skill.atktype === 'ranged') && ((typeof(skill.type) === 'object' && (vars[1].includes(skill.type[0]) || vars[1].includes(skill.type[1]))) || vars[1].includes(skill.type))) {
				if (randNum(1, 100) <= vars[0]) {
					// Run this function again... but with the repel. Ban repelling to avoid infinite loops, and avoid taking damage ourselves.
					let newResults = attackWithSkill(inf, inf, skill, btl, true);
					result.oneMore = newResults.oneMore;
					result.teamCombo = newResults.teamCombo;

					// Return this txt
					return `\n__${char.name}__'s __${passive.name}__ repelled the attack!\n${newResults.txt}`;
				}
			}

			return false;
		},
		getinfo(vars, skill) {
			let txt = `Has a **${vars[0]}%** chance to repel **magic or ranged attacks** of **`

			for (let i in vars[1]) {
				txt += `${elementEmoji[vars[1][i]]}${vars[1][i].charAt(0).toUpperCase() + vars[1][i].slice(1)}`

				if (i < vars[1].length - 2) txt += ', '
				else if (i < vars[1].length - 1) txt += ' and '
			}

			return txt + '**';
		}
	}),

	endure: new Extra({
		name: "Endure (Persona)",
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
				char.hp = vars[1];
				if (char.hp > char.maxhp) char.hp = char.maxhp;

				return `...however, ${char.name} was able to endure the attack!`;
			}
		},
		getinfo(vars, skill) {
			return `Upon defeat, **revives the user** with **${vars[1]} HP** until struck for the **${vars[0]}${vars[0] === 1 ? 'st' : vars[0] === 2 ? 'nd' : vars[0] === 3 ? 'rd' : 'th'} time**`
		}
	}),

	pinchmode: new Extra({
		name: "Pinch Mode (Pixel Dungeon)",
		desc: "Once the user is downed, they will be revived at <Revive HP%>% max HP and their skills will have <Damage Boost>% more power, but skills that attack them will have <Defence Lost>% more power and every turn they will lose <Lost HP%>% of their max HP. Heals will have no effect on them.",
		args: [
			{
				name: "Revive HP%",
				type: "Num",
				forced: true
			},
			{
				name: "Damage Boost",
				type: "Num",
				forced: true
			},
			{
				name: "Defence Lost",
				type: "Num",
				forced: true
			},
			{
				name: "Lost HP%",
				type: "Num",
				forced: true
			}	
		],
		applyfunc(message, skill, args) {
			const starthp = args[0]
			const extradmg = args[1]
			const lostdef = args[2]
			const losthp = args[3]
			if (starthp <= 0 || starthp > 100 || losthp <= 0)
				return void message.channel.send("Don't even try.")
			makePassive(skill, "pinchmode", [starthp, extradmg, lostdef, losthp])
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			if (char.hp <= 0 && !char.custom?.pinch) {
				if (char.custom?.pinch) {
					delete char.custom.pinch
				} else {
					addCusVal(char, "pinch", true)
					char.hp = Math.floor((char.maxhp * vars[0]) / 100)
					return "...but they refuse to die just yet, and become enraged!"
				}
			}
		},
		onturn(btl, char, vars) {
			if (char.custom?.pinch) {
				const damage = Math.floor((char.maxhp * vars[3]) / 100)
				char.hp -= damage
				return `__${char.name}__ took ${statusEmojis.pinch}**${damage}** damage${char.hp <= 0 ? " and was defeated" : ""}!`
			}
		},
		statmod(btl, char, skill, vars) {
			if (char.custom?.pinch) {
				skill.pow *= (vars[1] / 100) + 1
			}
		},
		onaffinitycheck(char, inf, skill, passive, affinity, btl, vars) {
			if (char.custom?.pinch) {
				skill.pow *= (vars[2] / 100) + 1
			}
		},
		getinfo(vars, skill) {
			return `When downed, the user is revived with **${vars[0]}% of their max HP** and their skills will have **${vars[1]}%** more power, but they will lose **${vars[3]}%** HP every turn, skills that attack them will have **${vars[2]}%** more power and heals will not work`
		},
	}),

	guardboost: new Extra({
		name: "Guard Boost (Original)",
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
		hardcoded: true,
		getinfo(vars, skill) {
			return `Reduces damage taken when guarding by **${vars[0]}%**`
		}
	}),

	guarddodge: new Extra({
		name: "Guard Dodge (Original)",
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
		hardcoded: true,
		getinfo(vars, skill) {
			return `Boosts dodging attacks when guarding by **${vars[0]}%**`
		}
	}),

	sacrificial: new Extra({
		name: "Sacrificial (Original)",
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
			if (skill.extras?.sacrifice) skill.pow *= (vars[0]/100) + 1;
		},
		getinfo(vars, skill) {
			return `Boosts the power of sacrifice skills by **${vars[0]}%**`
		}
	}),

	alterpain: new Extra({
		name: "Alter Pain (Persona)",
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
				return `__${char.name}'s__ _${passive.name}_ was able to restore **${heal}${char.mpMeter ? char.mpMeter[1] : "MP"}** from the attack!`;
			}
		},
		getinfo(vars, skill) {
			return `Gain **${vars[0]}%** of damage taken as MP`
		}
	}),

	sacrifice: new Extra({
		name: "Sacrifice (SMT)",
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

			return `__${char.name}'s__ _${passive.name}_ was able to restore **${heal}HP** and **${healmp}${char.mpMeter ? char.mpMeter[1] : "MP"}** from __${targ.name}__'s defeat!`;
		},
		getinfo(vars, skill) {
			return `Upon foe defeat, restores **${vars[0]}%** of the foe's level as HP and **${vars[1]}%** of the foe's level as MP to the user`
		}
	}),

	elementstore: new Extra({
		name: "Element Store (Original)",
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
			if (element === "heal" || element === "support" || element === "status"  || element === "passive") return void message.channel.send("This element doesn't deal damage!");
			if (damage == 0) return void message.channel.send("Why do this if it never changes anything?");
			if (chance <= 0) return void message.channel.send("When you're trying to store damage, you need to have it happen at least once!");

			makePassive(skill, "elementstore", [element, damage, chance]);
			return true;
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			// Only activate for pure skills, no dual element skills.
			if (char.hp > 0 && skill.type == vars[0] && randNum(0, 100) <= vars[2]) {
				// Set elementstore for later.
				let storeValue = Math.round((dmg/100)*vars[1]);
				if (!char.custom?.elementstore)
					addCusVal(char, 'elementstore', storeValue);
				else
					char.custom.elementstore += storeValue;

				// Don't reveal this passive in PVP.
				if (btl.pvp)
					return '';
				else
					return `\n__${char.name}'s__ _${passive.name}_ was able to store **${storeValue} damage** from the attack!`;
			} else 
			return '';
		},
		statmod(btl, char, skill, vars) {
			// Add things stored by the elementstore custom variable to the skill's power.
			// Then, delete the elementstore custom variable.
			if (char.custom?.elementstore) {
				skill.pow += char.custom.elementstore;
				killVar(char, 'elementstore');
			}
		},
		getinfo(vars, skill) {
			let txt = 'Has '

			for (i in vars) {
				txt += `a **${vars[i][2]}%** chance to store **${vars[i][1]}%** of damage taken from **${elementEmoji[vars[i][0]]}${vars[i][0].charAt(0).toUpperCase() + vars[i][0].slice(1)} attacks**`

				if (i < vars.length-2)
					txt += ', '
				else if (i == vars.length-2)
					txt += ' and '
			}

			return txt + ' to add up for the next attack'
		}
	}),

	affinitypoint: new Extra({
		name: "Affinity Point (Original)",
		desc: "Every heal you obtain nets you a <Point Name>. These will buff your attacks depending on the power of the affinitypoint buff on the skill.",
		args: [
			{
				name: "Max Points",
				type: "Num",
				forced: true
			},
			{
				name: "Point Name",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let max = args[0];
			let name = args[1];

			if (message.mentions.users.size > 0) return void message.channel.send("You're mean for trying to mention someone!");
			if (max < 1) return void message.channel.send("You need to have at least one point!");

			makePassive(skill, "affinitypoint", [max, name]);
			return true;
		},
		onheal(char, ally, skill, heal, btl, vars) {
			if (!char.custom?.affinitypoint) addCusVal(char, 'affinitypoint', 0);

			if (char.custom?.affinitypoint < vars[0]) {
				char.custom.affinitypoint++;
				return `${char.name} obtained a __${vars[1]}__. _(${char.custom.affinitypoint}/${vars[0]})_`;
			}
		},
		getinfo(vars, skill) {
			return `Nets a **__${vars[1]}__** for every heal the user obtains until it reaches **${vars[0]}**`
		}
	}),

/*
	arenatrap: new Extra({
		name: "Arena Trap (Pokémon)",
		desc: "Disables fleeing, or backup switching for the opposing teams as long as the user is alive.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "srenatrap", [percent]);
			return true
		},
		hardcoded: true,
		getinfo(vars, skill) {
			return "Disables **fleeing, or backup switching**"
		}
	})
*/

	koboost: new Extra({
		name: "KO Boost (Pokémon)",
		desc: "Upon foe defeat, buff a stat.",
		multiple: true,
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Stages",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let stat = args[0].toLowerCase();
			let stages = args[1];

			if (![...stats, 'crit'].includes(stat)) return void message.channel.send("That's not a valid stat!");
			if (stages == 0) return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) return void message.channel.send("The maximum amount of stages is 3!");

			makePassive(skill, "koboost", [stat, stages]);
			return true
		},
		onkill(char, targ, skill, dmg, passive, btl, vars) {
			buffStat(char, (vars[0] ?? "atk").toLowerCase(), (vars[1] ?? 1));
			return `Defeating __${targ.name}__ let __${char.name}'s__ _${passive.name}_ ${(vars[1] ?? 1) > 0 ? 'buff' : 'debuff'} **${(vars[0] ?? "atk").toUpperCase()} ${Math.abs(vars[1] ?? 1)} times**.`;
		},
		getinfo(vars, skill) {
			let str = 'Upon foe defeat, **boosts user '

			for (let i in vars) {
				str += `${(vars[i][0] ?? '???').toUpperCase()} ${vars[i][1]} time(s)`;

				if (i < vars.length - 2) 
					str += `, `
				else if (i == vars.length - 2) 
					str += ` and `
			}

			return `${str}**`;
		}
	}),

	finalpush: new Extra({
		name: "Final Push (Pokémon)",
		desc: "Boosts the powers of skills of a specific element by <Percentage> when HP is below <HPPercent>",
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
			},
			{
				name: "HPPercent",
				type: "Decimal",
				forced: true
			},
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let element = args[0]?.toLowerCase();
			let percentage = args[1];
			let hppercentage = args[2];

			if ((!Elements.includes(element) && element != 'all' && element != 'magic' && element != 'physical' && element != 'sorcery' && element != 'ranged') || element === 'almighty') return void message.channel.send("You entered an invalid element!");
			if (hppercentage > 100 && hppercentage < 0) return void message.channel.send(`Please enter a value for <HPPercent> above 0 and below 100.`);

			makePassive(skill, "finalpush", [element, percentage, hppercentage]);
			return true;
		},
		statmod(btl, char, skill, vars) {
			if (char.hp <= (char.maxhp/100)*vars[2]) {
				return passiveList.boost.statmod(btl, char, skill, vars);
			}
		},
		getinfo(vars, skill) {
			let txt = `Boosts `

			for (let i in vars) {
				if (!vars[i]) continue;

				txt += `${elementEmoji[vars[i][0]] ?? ''}**${vars[i][0].charAt(0).toUpperCase() + vars[i][0].slice(1)}** attacks by ${vars[i][1]}% when HP is below **${vars[i][2]}%**`

				if (i < vars.length - 2) 
					txt += `, `
				else if (i == vars.length - 2) 
					txt += ` and `
			}

			return txt;
		}
	}),

	neutralisinggas: new Extra({
		name: "Neutralising Gas (Pokémon)",
		desc: "Nullifies all passives in battle until the user is defeated.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "neutralisinggas", [true]);
			return true;
		},
		battlestart(char, skill, btl, vars) {
			btl.nopassives = [skill.name, char.id];
		},
		getinfo(vars, skill) {
			return "Neutralises all passives in battle.";
		}
	}),

	forceweather: new Extra({
		name: "Force Weather (Pokémon)",
		desc: "Forces the specified weather on battle start for <Turns> turns.",
		args: [
			{
				name: "Weather",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!weathers.includes(args[0].toLowerCase())) return void message.channel.send("That's an invalid weather!");
			if (args[1] == 0 || args[1] < -1 || args[1] > 100) return void message.channel.send("Please enter a value for <Turns> that is between -1 (Permanent) and 100.");

			makePassive(skill, "forceweather", [args[0].toLowerCase(), args[1]]);
			return true;
		},
		battlestart(char, skill, btl, vars) {
			if (vars[1] <= -1) {
				btl.weather = {
					type: vars[0],
					turns: -1,
					force: vars[0],
				}
			} else {
				if (btl.weather) {
					btl.weather.type = vars[0];
					btl.weather.turns = vars[1];
				} else {
					btl.weather = {
						type: vars[0],
						turns: vars[1],
					}
				}
			}
		},
		getinfo(vars, skill) {
			return `Forces the weather to **${weatherDescs[vars[0]].emoji}${vars[0]}** on battle start ${(vars[1] <= 1) ? "**indefinitely**" : `for **${vars[1]} turns**`}`;
		}
	}),

	forceterrain: new Extra({
		name: "Force Terrain (Pokémon)",
		desc: "Forces the specified terrain on battle start for <Turns> turns.",
		args: [
			{
				name: "Terrain",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			if (!terrains.includes(args[0].toLowerCase())) return void message.channel.send("That's an invalid terrain!");
			if (args[1] == 0 || args[1] < -1 || args[1] > 100) return void message.channel.send("Please enter a value for <Turns> that is between -1 (Permanent) and 100.");

			makePassive(skill, "forceterrain", [args[0].toLowerCase(), args[1]]);
			return true;
		},
		battlestart(char, skill, btl, vars) {
			if (vars[1] <= -1) {
				btl.terrain = {
					type: vars[0],
					turns: -1,
					force: vars[0],
				}
			} else {
				if (btl.terrain) {
					btl.terrain.type = vars[0];
					btl.terrain.turns = vars[1];
				} else {
					btl.terrain = {
						type: vars[0],
						turns: vars[1],
					}
				}
			}
		},
		getinfo(vars, skill) {
			return `Forces the terrain to **${terrainDescs[vars[0]].emoji}${vars[0]}** on battle start ${(vars[1] <= 1) ? "**indefinitely**" : `for **${vars[1]} turns**`}`;
		}
	}),

	slayer: new Extra({
		name: "Slayer (Sonic Robo Blast 2 Persona)",
		desc: "Boosts the powers/damage of skills when the opponent is afflicted with <Status Effect>.",
		args: [
			{
				name: "Target Status Effect",
				type: "Word",
				forced: true
			},
			{
				name: "Boost in Percent",
				type: "Decimal",
				forced: true
			}
		],
		multiple: true,
		diffflag: 0,
		applyfunc(message, skill, args) {
			let status = args[0].toLowerCase();
			let amount = args[1];

			if (![...statusEffects, 'physical', 'mental', 'all'].includes(status)) return void message.channel.send("You entered an invalid status for the boost!");
			if (isStackableStatus(status)) return void message.channel.send("You cannot boost the power on stackable statusses.");
			if (amount == 0) return void message.channel.send('With the amount being 0, it wouldn\'t change power at all.');

			makePassive(skill, "slayer", [status, amount]);
			return true;
		},
		dmgmod(char, targ, dmg, skill, btl, vars) {
			let type = vars[0];
			let phys = isPhysicalStatus(targ.status);

			if (targ.status && (type == 'all' || (type == 'physical' && phys) || (type == 'mental' && !phys) || targ.status == type))
				dmg += Math.round(dmg*vars[1]/100);

			return dmg;
		},
		getinfo(vars, skill) {
			let txt = `Boosts the power of skills used on those inflicted with `;
			let type = '';
			let symbol = '';

			for (let i in vars) {
				if (!vars[i]) continue;

				type = vars[i][0];
				symbol = statusEmojis[type] ?? '';

				if (type == 'all') {
					txt += "**any status effect**"
				} else if (type == 'physical') {
					txt += "a <:physical:973077052129423411>**physical status effect**"
				} else if (type == 'mental') {
					txt += "a <:mental:1004855144745291887>**mental status effect**"
				} else {
					txt += `${symbol}**${statusNames[type]}**`
				}

				txt += ` by **${vars[i][1]}%**`
				if (i < vars.length - 2) 
					txt += `, `
				else if (i == vars.length - 2) 
					txt += ` and `
			}

			return txt;
		}
	}),

	skilldeny: new Extra({
		name: "Skill Deny (Original)",
		desc: "Denies use of an element... Why is this here again-",
		multiple: true,
		args: [
			{
				name: "Element",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			let element = args[0].toLowerCase();
			if (!Elements.includes(element)) return void message.channel.send("You entered an invalid type for the boost!");

			makePassive(skill, "skilldeny", [element]);
			return true
		},
		canuseskill(char, skill, passive, btl, vars) {
			if (skill.type == vars[0]) return `${elementEmoji[vars[0]]}**${vars[0].charAt(0).toUpperCase() + vars[0].slice(1)}** skills have been banned by <:passive:963413845253193758>**${passive.name}**.`;
			return true;
		},
		getinfo(vars, skill) {
			let txt = `Cannot use `;
			let type = '';
			let symbol = '';

			for (let i in vars) {
				if (!vars[i]) continue;

				type = vars[i][0];
				symbol = elementEmoji[type] ?? '';
				txt += `${symbol}**${type.charAt(0).toUpperCase() + type.slice(1)}%**`
				if (i < vars.length - 2) 
					txt += `, `
				else if (i == vars.length - 2) 
					txt += ` or `
			}

			return `${txt} skills`;
		}
	}),

	autoboost: new Extra({
		name: "Auto-Boost (Persona)",
		desc: "When the battle starts, either the character will gain a stat boost, or the foes will lose one.",
		multiple: true,
		args: [
			{
				name: "Foes/Team/User",
				type: "Word",
				forced: true
			},
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Stages",
				type: "Num"
			},
			{
				name: "Turns",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			const target = args[0].toLowerCase()
			const stat = args[1].toLowerCase()
			const stages = args[2] ?? 1
			const turns = args[4] ?? null

			if (target != 'user' && target != 'foes' && target != 'team') 
				return void message.channel.send(`You typed ${target} as the target. It must be either \`user\`, \`foes\`, or \`team\`.`)
			if (![...stats, "crit", "all"].includes(stat))
				return void message.channel.send("That's not a valid stat!");
			if (stages == 0)
				return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) 
				return void message.channel.send("The maximum amount of stages is 3!");
			if (turns && turns <= 0)
				return void message.channel.send("You can't have a turn amount less than 0, as then it would revert to normal too soon.");

			makePassive(skill, "autoboost", [target, stat, stages, 100, turns]);
			return true;
		},
		battlestart(char, skill, btl, vars) {
			switch(vars[0].toLowerCase()) {
				case 'foes':
					for (let i in btl.teams) {
						for (let k in btl.teams[i].members) {
							if (btl.teams[i].members[k].hp > 0 && btl.teams[i].members[k].id != char.id) {
								extrasList.buff.buffChange(char, btl.teams[i].members[k], skill, btl, vars, 1);
							}
						}
					}
					break;

				case 'team':
					for (let k in btl.teams[char.team].members) {
						if (btl.teams[char.team].members[k].hp > 0) {
							extrasList.buff.buffChange(char, btl.teams[char.team].members[k], skill, btl, vars, 1);
						}
					}
					break;

				default:
					extrasList.buff.buffChange(char, char, skill, btl, vars, 1);
			}
		},
		getinfo(vars, skill) {
			return `${buffText(vars)} at the **start of battle**`;
		}
	}),

/*
	simple: new Extra({
		name: "Simple (Pokémon)",
		desc: "Doubles buffs gained or lost. May have a chance assigned to it, and a specific buff.",
		args: [
			{
				name: "Stat",
				type: "Word"
			},
			{
				name: "Chance %",
				type: "Decimal"
			}
		],
		hardcoded: true,
		applyfunc(message, skill, args) {
			let stat = args[0].toLowerCase() ?? 'all';
			let chance = Math.min(args[1] ?? 100, 100);

			if (![...stats, "crit", "all"].includes(stat)) return void message.channel.send("That's not a valid stat!");
			if (chance <= 0) return void message.channel.send("You can't have a percentage less than 0, as then it would never happen!");

			makePassive(skill, "simple", [stat, chance])
			return true
		},
		getinfo(vars, skill) {
			return `The user cannot use ${elementEmoji[vars[0]]}**${vars[0].charAt(0).toUpperCase() + vars[0].slice(1)}** skills`
		}
	}),
*/

	magicbounce: new Extra({
		name: "Magic Bounce (Pokémon)",
		desc: "<Chance>% chance to reflect status afflicting moves to the opponent. If {LuckBased} is set to true, the Luck Stat may influence this stat.",
		hardcoded: true,
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: true
			},
			{
				name: "LuckBased",
				type: "YesNo"
			}
		],
		applyfunc(message, skill, args) {
			let chance = parseFloat(args[0]);
			let luckBased = args[1];

			if (chance <= 0 || chance > 100) {
				return void message.channel.send(`${chance}% is an invalid percentage! Try 1-100%.`);
			}

			makePassive(skill, "magicbounce", [chance, luckBased ?? false]);
			return true;
		},
		getinfo(vars, skill) {
			let luckbased = vars[1] ? ", **Luck-Dependant** " : " "
			let chance = vars[0] < 100 ? `**${vars[0]}%${luckbased}Chance**` : "**Guaranteed**"
			return `${chance} to reflect ${elementEmoji.status}**Skills that will afflict a status effect** back to the attacker`
		}
	}),

	dp: new Extra({
		name: "Determination Points (Original)",
		desc: "Starts the battle with 0 MP, but restores it when dealing or being dealt damage or when shielding.",
		args: [],
		applyfunc(message, skill, args) {
			makePassive(skill, "dp", [true])
			return true
		},
		battlestart(char, skill, btl, vars) {
			char.mp = 0
		},
		ondamage(char, inf, skill, dmg, passive, btl, vars) {
			return dpDamage(char, dmg / char.maxhp)
		},
		dmgmod(char, targ, dmg, skill, btl, vars) {
			addAtkMsg(btl, dpDamage(char, dmg / targ.maxhp))
			return dmg
		},
		endturn(btl, char, action, skill) {
			return char.guard
				? dpDamage(char, 0.25)
				: ""
		},
		getinfo(vars, skill) {
			return "The user starts with **no MP**, but can recover it by:\n" +
			"- Dealing damage.\n" +
			"- Taking damage.\n" +
			"- Guarding"
		}
	}),

	null: new Extra({
		name: "Null (Persona)",
		desc: "<Chance>% chance to change the user's affinity toward <Elements> upon attack.",
		multiple: true,
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: false
			},
			{
				name: "Affinity",
				type: "Word",
				forced: true
			},
			{
				name: "Element #1",
				type: "Word",
				forced: true,
				multiple: true
			}
		],
		applyfunc(message, skill, args) {
			let chance = args[0] ?? 100;
			let affinity = args[1].toLowerCase();
			let elements = args.slice(2);

			if (chance < 1) return void message.channel.send("Why do this if it never happens?");
			if (!Affinities.includes(affinity)) return void message.channel.send(`${affinity} is not a valid affinity.`);

			for (let i in elements) {
				if (elements[i] === "all") {
					elements = "all";
					break;
				}

				if (!Elements.includes(elements[i].toLowerCase()))
					return void message.channel.send(`${elements[i]} is an invalid element!`);

				if (elements[i].toLowerCase() === "almighty")
					return void message.channel.send("Don't even try it.")

				elements[i] = elements[i].toLowerCase(); // make lowercase.
			}

			makePassive(skill, "null", [chance, affinity, elements]);
			return true;
		},
		affinitymod(char, inf, skill, passive, affinity, btl, vars, result) {
			if (!vars) return false;

			let shouldProc = (typeof vars[2] == "string" && vars[2] === "all");

			if (!shouldProc) {
				if (typeof skill.type == "string" && vars[2].includes(skill.type)) {
					shouldProc = true;
				} else if (typeof skill.type == "object") {
					for (let i in skill.type) {
						if (vars[2].includes(skill.type[i])) {
							shouldProc = true;
							break;
						}
					}
				}
			}

			if (!shouldProc) return false;

			let finalChance = vars[0]+inf.stats.luck-char.stats.luck
			if (shouldProc && (vars[0] >= 100 || randNum(1, 1000) <= (finalChance*10))) {
				result.txt += `__${char.name}'s__ **${getFullName(passive)}** caused their affinity toward **${getFullName(skill)}** to become ${affinityEmoji[vars[1]]}**${vars[1]}**!\n`;
				return vars[1];
			}

			return false;
		},
		getinfo(varstbl, skill) {
			let vars;
			let txt = "";
			for (let k in varstbl) {
				vars = varstbl[k];
				txt += `${(vars[0] < 100) ? `Has a **${vars[0]}%** chance to` : "**Guaranteed** to"} change the affinity of **`

				for (let i in vars[2]) {
					txt += `${elementEmoji[vars[2][i]]}${vars[2][i].charAt(0).toUpperCase() + vars[2][i].slice(1)}`

					if (i < vars[2].length - 2)
						txt += ', ';
					else if (i < vars[2].length - 1)
						txt += ' and ';
				}

				txt += `** skills to ${affinityEmoji[vars[1]]}**${vars[1]}**`;

				if (k < varstbl.length-1)
					txt += '\n';
			}

			return txt;
		}
	}),

	chancecast: new Extra({
		name: "Chance Cast (Original)",
		desc: "{Chance}% chance to cast <Skill(s)> on a random target at the start of every turn.",
		args: [
			{
				name: "Chance",
				type: "Decimal",
				forced: false
			},
			{
				name: "Skill(s)",
				type: "Word",
				forced: true,
				multiple: true,
			}
		],
		applyfunc(message, skill, args) {
			let chance = Math.min(100, args[0] ?? 100);
			let skilllist = args.slice(1);

			if (chance < 1) return void message.channel.send("Why do this if it never happens?");

			for (let i in skilllist) {
				if (!skillFile[skilllist[i]]) return void message.channel.send(`${skilllist[i]} is an invalid skill.`);
				if (skillFile[skilllist[i]].extras?.metronome) return void message.channel.send(`Metronome skills are unsupported, so you may not use **${getFullName(skillFile[skilllist[i]])}** for this _ChanceCast_ skill.`);
				if (!["one", "randomopposing", "ally", "randomallies", "random", "caster"].includes(skillFile[skilllist[i]].target)) return void message.channel.send(`You may only use single-target skills, so you may not use **${getFullName(skillFile[skilllist[i]])}** for this _ChanceCast_ skill.`);
			}

			makePassive(skill, "chancecast", [chance, skilllist]);
			return true;
		},
		onturn(btl, char, vars, passive) {
			if (randNum(1, 1000) <= (vars[0]*10) || vars[0] >= 100) {
				skillFile = setUpFile(`${dataPath}/json/skills.json`, true);
				let skill = skillFile[vars[1][randNum(0, vars[1].length-1)]];

				if (skill) {
					let targ;
					let possible = [];
					if (["one", "randomopposing", "allopposing", "spreadopposing", "widespreadopposing", "randomspreadopposing", "randomwidespreadopposing", "casterandfoe", "casterandrandomfoe"].includes(skill.target)) {
						for (let i in btl.teams) {
							if (char.team == i) continue;

							for (let k in btl.teams[i].members)
								if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k].id);
						}

						targ = getCharFromId(possible[randNum(possible.length-1)], btl);
					} else if (["ally", "randomallies", "allallies", "spreadallies", "widespreadallies", "randomspreadallies", "randomwidespreadallies", "casterandally", "casterandrandomally"].includes(skill.target)) {
						for (let i in btl.teams[char.team].members)
							if (btl.teams[char.team].members[i].hp > 0) possible.push(btl.teams[char.team].members[i].id);

						targ = getCharFromId(possible[randNum(possible.length-1)], btl);
					} else if (["random", "everyone", "randomspread", "randomwidespread", "casterandrandom"].includes(skill.target)) {
						for (let i in btl.teams) {
							for (let k in btl.teams[i].members)
								if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k].id);
						}

						targ = getCharFromId(possible[randNum(possible.length-1)], btl);
					} else {
						targ = char;
					}

					if (targ) {
						let results = attackWithSkill(char, targ, skill, btl);
						return `__${char.name}__'s _${getFullName(passive)}_ allowed them to cast **${getFullName(skill)}** on __${(targ.id == char.id) ? "themselves" : targ.name}__!\n${results.txt}`;
					}
				}
			}
		},
		getinfo(vars, skill) {
			let txt = `${(vars[0] < 100) ? `Has a **${vars[0]}%** chance to` : "**Guaranteed** to"} cast`

			if (vars[1].length <= 1) {
				txt += ` **${getFullName(skillFile[vars[1][0]])}**`;
			} else {
				txt += " either ";
				for (let i in vars[1]) {
					txt += `**${getFullName(skillFile[vars[1][i]])}**`;

					if (i < vars[1].length - 2)
						txt += ', ';
					else if (i < vars[1].length - 1)
						txt += ' or ';
				}
			}

			return txt;
		}
	}),

	formchange: new Extra({
		name: "Form Change (Original)",
		desc: "Changes the form of the user to <Form> on select, with a {Chance}% chance. If {Transform on Failure Anyway} is Yes, then the move will allow transformation on block, repel, or other forms of failure. {Custom Message} is the message that would be displayed on transformation. _These skills should be character specific as forms are character specific and may not persist between characters._",
		args: [
			{
				name: "Form",
				type: "Word",
				forced: true
			},
			{
				name: "Condition",
				type: "Word",
				forced: true
			},
			{
				name: "Variable for Condition",
				type: "Any",
				forced: false
			},
			{
				name: "Chance",
				type: "Decimal",
				forced: false
			},
			{
				name: "Custom Message",
				type: "Word",
				forced: false
			}
		],
		applyfunc(message, skill, args) {
			let cond = args[1].toLowerCase();
			let variable = args[2];

			switch(cond) {
				case 'weather':
					if (!weathers.includes(variable.toLowerCase())) return void message.channel.send(`${variable} is an invalid weather.`);
					variable = variable.toLowerCase();
					break;

				case 'terrain':
					if (!terrains.includes(variable.toLowerCase())) return void message.channel.send(`${variable} is an invalid terrain.`);
					variable = variable.toLowerCase();
					break;

				default:
					return void message.channel.send(`${cond} is an invalid condition.`);
			}

			makePassive(skill, "formchange", [args[0], cond, variable, Math.min(100, Math.max(0, parseInt(args[3] ?? 100))), args[4] ?? undefined]);
			return true
		},
		onweather(char, weather, psv, btl, vars) {
			console.log(`the weather is ${weather}`);
			if (vars[1] === 'weather' && weather.toLowerCase() === vars[2].toLowerCase() && (vars[3] >= 100 || randNum(1, 100) <= vars[3])) {
				return extrasList.formchange.onselect(char, null, btl, [vars[0], 999, true, vars[4]]);
			}
		},
		onterrain(char, terrain, psv, btl, vars) {
			if (vars[1] === 'terrain' && terrain.toLowerCase() === vars[2].toLowerCase() && (vars[3] >= 100 || randNum(1, 100) <= vars[3])) {
				return extrasList.formchange.onselect(char, null, btl, [vars[0], 999, true, vars[4]]);
			}
		},
		getinfo(vars, skill) {
			let str = '';

			switch(vars[1]) {
				case 'weather':
					str = `On the change to ${weatherDescs[vars[2]].emoji}**${vars[2]}** weather, `;
					break;

				case 'terrain':
					str = `On the change to ${terrainDescs[vars[2]].emoji}**${vars[2]}** terrain, `;
					break;
			}

			if (vars[1] ?? vars[1] < 100)
				str += `has a **${vars[3]}%** chance to change into their **${(vars[0] === "normal") ? "Regular Form from any form they may be in now" : vars[0]}**`;
			else
				str += `may change into their **${(vars[0] === "normal") ? "Regular Form from any form they may be in now" : vars[0]}**`;

			return str;
		}
	}),

	critboost: new Extra({
		name: "Crit Boost (Original)",
		desc: "Upon critical hit, buff a stat. Optionally restrict to an element.",
		multiple: true,
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Stages",
				type: "Num",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: false
			}
		],
		applyfunc(message, skill, args) {
			let stat = args[0].toLowerCase();
			let stages = args[1];
			let element = args[2].toLowerCase() ?? "all";

			if (![...stats, 'crit'].includes(stat)) return void message.channel.send("That's not a valid stat!");
			if (stages == 0) return void message.channel.send("...This amount of stages won't do anything, I'm afraid.");
			if (Math.abs(stages) > 3) return void message.channel.send("The maximum amount of stages is 3!");
			if (!Elements.includes(element)) return void message.channel.send(`${args[2]} is not a valid element!`);

			makePassive(skill, "critboost", [stat, stages, element]);
			return true
		},
		oncritlanded(char, targ, skill, dmg, passive, btl, vars) {
			if (!vars[2] || vars[2].toLowerCase() == "all" || (typeof skill.type == "object" && skill.type.includes(vars[2])) || skill.type == vars[2]) {
				buffStat(char, (vars[0] ?? "atk").toLowerCase(), (vars[1] ?? 1));
				return `The critical hit on __${targ.name}__ let __${char.name}'s__ _${passive.name}_ ${(vars[1] ?? 1) > 0 ? 'buff' : 'debuff'} **${(vars[0] ?? "atk").toUpperCase()} ${Math.abs(vars[1] ?? 1)} times**.`;
			}
		},
		getinfo(vars, skill) {
			let e = vars[0][2].toLowerCase();
			let str = 'Upon landing a critical hit ' + ((e != "all") ? `with a **${elementEmoji[e]}${e} skill**, ` : '') + ' **boosts user ';

			for (let i in vars) {
				str += `${(vars[i][0] ?? '???').toUpperCase()} ${vars[i][1]} time(s)`;

				if (i < vars.length - 2) 
					str += `, `
				else if (i == vars.length - 2) 
					str += ` and `
			}

			return `${str}**`;
		}
	}),
}

// Determination Points extra.
function dpDamage(char, decimal) {
	let amount = Math.floor(decimal * char.maxmp)
	char.mp = Math.min(char.maxmp, char.mp+amount);
	return `__${char.name}__'s ${char.mpMeter ? char.mpMeter[1] : "MP"} was restored by **${amount}**!`
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makePassive(skill, extra, func) {
	if (!skill.passive) skill.passive = {};
	if (!skill.passive[extra]) skill.passive[extra] = [];

	if (passiveList[extra].multiple) {
		/*if (passiveList[extra].diffflag) {
			for (i in skill.passive[extra]) {
				if (skill.passive[extra][i][passiveList[extra].diffflag] === func[passiveList[extra].diffflag]) {
					skill.passive[extra][i] = func;
					return true;
				}
			}
		}*/
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
	if (!passiveList[skillExtra].apply(message, skill, rawargs, passiveList[skillExtra].name)) return false
	
	message.react('👍')
	skill.done = true;
	console.log("win")
	return true;
}

buildPassive = (message, extra, args) => {
	let skill = {
		name: args[0],
		type: 'passive',
		creationtime: Date.now(),
		originalAuthor: message.author.id
	}

	if (passiveList?.[extra]?.unregsiterable && !utilityFuncs.RPGBotAdmin(message.author.id)) {
		message.channel.send(`You lack permissions to apply ${passiveList[extra].name} for this skill.`)
		return false;
	}

	applyPassive(message, skill, extra.toLowerCase(), args.slice(3))
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}

runPassiveHook = (char, hook, btl, ...parameters) => {
	let result = '';
	if (doPassives(btl)) {
		let psv = null;
		for (let i in char.skills) {
			if (!skillFile[char.skills[i]]) continue;
			if (skillFile[char.skills[i]].type != 'passive') continue;

			psv = skillFile[char.skills[i]];
			for (let k in psv.passive) {
				if (passiveList[k] && passiveList[k][hook]) {
					if (passiveList[k].multiple) {
						for (let j in psv.passive[k]) {
							result += `${passiveList[k][hook](...parameters, psv, btl, psv.passive[k][j])}\n`;
						}
					} else {
						result += `${passiveList[k][hook](...parameters, psv, btl, psv.passive[k])}\n`;
					}
				}
			}
		}
	}

	return result
}
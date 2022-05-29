weakSide = ['superweak', 'weak', 'normal']
resistSide = ['normal', 'resist', 'block', 'repel', 'drain']

class Extra extends ArgList {
	constructor(object) {
		super(object.args, object.desc)
		this.name = object.name
		this.multiple = object.multiple
		this.diffflag = object.diffflag
		for (const i in object) {
			const func = object[i]
			if (typeof func != "function")
				continue
			this[i] = func
		}
	}

	apply(message, skill, rawargs) {
		const args = this.parse(message, rawargs)
		if (!args)
			return false
		return this.applyfunc(message, skill, args)
	}
}

extrasList = {
	ohko: new Extra({
		name: "One Hit KO",
		desc: 'Instantly defeats the foe at a <Chance>% chance. Can have {Status} to make it only affect foes with that status.',
		args: [
			{
				name: "Chance",
				type: "Float",
				forced: true
			},
			{
				name: "Status",
				type: "Word",
			}
		],
		applyfunc(message, skill, args) {
			const chance = args[0]
			const status = args[1]?.toLowerCase()
			if (chance <= 0)
				return void message.channel.send("What's the point of using this skill if it never lands?");

			if (status && !statusEffects.includes(status))
				return void message.channel.send("You're adding an invalid status effect!");

			makeExtra(skill, "ohko", [chance, status]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			if (vars[1] && vars[1] != null && targ.status != vars[1]) return dodgeTxt(targ);

			let chance = randNum(100);
			let target = vars[0]+((char.stats.luk-targ.stats.luk)/2)

			if (chance <= target) {
				targ.hp = 0;
				return `${char.name} instantly KO'd ${targ.name}!`;
			} else {
				return dodgeTxt(targ);
			}
		}
	}),

	sacrifice: new Extra({
		name: "Sacrifice",
		desc: "Will reduce the caster's HP to a {HP}.",
		args: [
			{
				name: "HP",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "sacrifice", [args[0] ?? 0]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			char.hp = vars[0];

			return `${char.name} sacrificed themselves! Their HP dropped to ${vars[0]}!`;
		}
	}),

	needlessthan: new Extra({
		name: "Need less than",
		desc: 'Will make the skill require less than <Percent>% of <Cost Type> for it to work.',
		multiple: true,
		diffflag: 1,
		args: [
			{
				name: "Percent",
				type: "Float",
				forced: true
			},
			{
				name: "Cost Type",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const percent = args[0]
			const stat = args[1].toLowerCase()
			if (percent < 1)
				return void message.channel.send("You can't need less than 0%!");
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return void message.channel.send("You entered an invalid value for <Cost Type>! It can be either HP, HPPercent, MP, MPPercent, or LB.");
			
			makeExtra(skill, "needlessthan", [percent, stat]);
			return true
		},
		canuse(char, skill, btl, vars) {
			switch(vars[1].toLowerCase()) {
				case 'mp':
					if (char.mp > vars[0]) return `You need less than ${vars[0]}MP to use this move!`;
					return true;

				case 'lb':
					if (char.lbpercent > vars[0]) return `You need less than ${vars[0]}LB% to use this move!`;
					return true;

				case 'mppercent':
					if (char.mp > (char.mp/char.maxmp)*vars[0]) return `You need less than ${(char.mp/char.maxmp)*vars[0]}MP to use this move!`;
					return true;

				case 'hppercent':
					if (char.mp > (char.hp/char.maxhp)*vars[0]) return `You need less than ${(char.hp/char.maxhp)*vars[0]}HP to use this move!`;
					return true;
				
				default:
					if (char.hp > vars[0]) return `You need less than ${vars[0]}HP to use this move!`;
					return true;
			}
		}
	}),

	changeaffinity: new Extra({
		name: "Change Affinity",
		desc: "Will change <Target/User>'s affinity from the <Weak/Resist/Both> side of <Element> to <Affinity>. *Keep in mind that if you want it to last {Turns} turns, it can't be overwritten by a different affinity until then.*",
		multiple: true,
		diffflag: [0, 1, 2],
		args: [
			{
				name: "Target/User",
				type: "Word",
				forced: true
			},
			{
				name: "Element",
				type: "Word",
				forced: true
			},
			{
				name: "Affinity",
				type: "Word",
				forced: true
			},
			{
				name: "Weak/Resist/Both",
				type: "Word",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
			}
		],
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
			makeExtra(skill, "changeaffinity", [target, element, affinity, side, turns]);
			return true
		},
		onselect(char, skill, btl, vars) {
			if (vars[0].toLowerCase() != 'user') return

			return extrasList.changeaffinity.targetchange(char, vars, skill)
		},
		onuse(char, targ, skill, btl, vars) {
			if (vars[0].toLowerCase() != 'target') return

			return extrasList.changeaffinity.targetchange(targ, vars, skill)
		},
		targetchange(target, vars, skill) {
			if (!target.affinities) target.affinities = [];

			let setAffinities = []

			let wasChanged = false;

			if (vars[3] != 'normal') {
				if (target.affinities[vars[2]] && target.affinities[vars[2]].includes(vars[1])) {
					return `${target.name} wasn't affected by ${skill.name}!`;
				}
			}

			if (vars[4] && vars[4] != null) {
				if (!target?.custom?.oldAffinities) 
					addCusVal(target, "oldAffinities", {});
			}

			for (let i in target.affinities) {
				setAffinities.push(...target.affinities[i])

				if (target?.custom?.oldAffinities?.[i] && Object.keys(target?.custom?.oldAffinities?.[i]).includes(vars[1])) continue;

				if (vars[4] && vars[4] != null) {
					if (!target?.custom?.oldAffinities[i]) target.custom.oldAffinities[i] = {};
				}

				if (vars[3] == 'resist' && !resistSide.includes(i)) continue
				if (vars[3] == 'weak' && !weakSide.includes(i)) continue

				if (target.affinities[i].includes(vars[1])) {
					target.affinities[i].splice(target.affinities[i].indexOf(vars[1]), 1);
					wasChanged = true;
					if (vars[4] && vars[4] != null) {
						if (!target?.custom?.oldAffinities[i][vars[1]]) target.custom.oldAffinities[i][vars[1]] = vars[4];
					}
					break;
				}
			}

			let normalAffinities = Elements.filter(e => !setAffinities.includes(e));

			if (!wasChanged && ((!normalAffinities.includes(vars[1]) && vars[2] != 'normal') || (vars[2] == 'normal' && normalAffinities.includes(vars[1])))) {
				return `${target.name} wasn't affected by ${skill.name}!`;
			}

			if (vars[3] != 'normal') {
				if (normalAffinities.includes(vars[1])) {
					if (!target?.custom?.oldAffinities['normal']) target.custom.oldAffinities['normal'] = {};
					if (!target?.custom?.oldAffinities['normal'][vars[1]]) target.custom.oldAffinities['normal'][vars[1]] = vars[4];
				}

				if (!target.affinities[vars[2]]) target.affinities[vars[2]] = [];
				target.affinities[vars[2]].push(vars[1]);
			}

			return `${target.name}'s affinity for ${elementEmoji[vars[1]]}**${vars[1]}** was changed to ${affinityEmoji[vars[2]]}**${vars[2]}**!`;
		}
	}),

	rest: new Extra({
		name: "Rest",
		desc: "Forces the caster to rest for one turn.",
		applyfunc: function(message, skill) {
			makeExtra(skill, "rest", [true]);
			return true
		},
		onselect: function(char, skill, btl, vars) {
			char.rest = true;
			return `_${char.name} must rest to regain their energy!_`;
		}
	}),

	buff: new Extra({
		name: "Stat Buff",
		desc: "Will buff or debuff the foe's <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff.",
		multiple: true,
		diffflag: [0, 2],
		args: [
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
				name: "Chance",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!stats.includes(stat) || stat === 'luck')
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "buff", [stat, args[1] ?? "-1", args[2] ?? 100]);
			return true
		}
	}),

	powerbuff: new Extra({
		name: "Power Buff",
		desc: "Boosts skill power with <Stat> buffs up to <Percent>%.",
		multiple: true,
		diffflag: 0,
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			},
			{
				name: "Percent",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!utilityFuncs.validStat(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "powerbuff", [stat, args[1]]);
			return true
		}
	}),

	takemp: new Extra({
		name: "Take MP",
		desc: "Will take <MP> MP from the foe each hit.",
		args: [
			{
				name: "MP",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "takemp", [args[0]]);
			return true
		}
	}),

	stealmp: new Extra({
		name: "Steal MP",
		desc: "Turns the skill into a skill that takes <Power> MP from the foe.",
		applyfunc(message, skill) {
			makeExtra(skill, "stealmp", [true]);
			return true
		},
		onuseoverride(char, targ, skill, btl, vars) {
			let mpStolen = Math.max(1, skill.pow+randNum(-10, 10));
			
			targ.mp = Math.max(0, targ.mp-mpStolen)
			char.mp = Math.min(char.maxmp, char.mp+mpStolen)
			
			return `${char.name} managed to steal ${mpStolen} MP!`;
		}
	}),

	steal: new Extra({
		name: "Steal",
		desc: "Has a <Chance>% chance to steal {Amount} of the foe team's items.",
		args: [
			{
				name: "Chance",
				type: "Float",
				forced: true
			},
			{
				name: "Amount",
				type: "Num",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const chance = args[0]
			const amount = args[1]
			if (chance <= 0)
				return void message.channel.send("What's the point of stealing if the extra never lands?");
			makeExtra(skill, "steal", [chance, amount]);
			return true
		}
	}),

	drain: new Extra({
		name: "Drain",
		desc: "Heals the caster for 1/<Amount> of the damage dealt.",
		args: [
			{
				name: "Amount",
				type: "Num"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "drain", [args[0] ?? 1]);
			return true
		}
	}),

	feint: new Extra({
		name: "Feint",
		desc: "Bypasses shielding skills like Makarakarn and Tetrakarn.",
		applyfunc(message, skill) {
			makeExtra(skill, "feint", [true]);
			return true
		}
	}),

	healverse: new Extra({
		name: "Healverse",
		desc: "After the foe is hit with this skill, each hit done to it will heal <Damage Percent>% of damage dealt to the attacker. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Float",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "healverse", [args[0], turns, args[2]]);
			return true
		},
		onuse(char, targ, skill, btl, vars) {
			if (targ.hp > 0) {
				addCusVal(targ, "healverse", {
					name: skill.name,
					infname: char.name,
					heal: vars[0],
					turns: vars[1],
					type: 'hp'
				});

				if (vars[2]) {
					let txt = vars[2];
					while (txt.includes('%SKILL%')) txt = txt.replace('%SKILL%', skill.name);
					while (txt.includes('%USER%')) txt = txt.replace('%USER%', char.name);
					while (txt.includes('%ENEMY%')) txt = txt.replace('%ENEMY%', targ.name);
					return txt;
				} else {
					return `A green aura is deployed around ${targ.name}!`;
				}
			}
		}
	}),

	powerverse: new Extra({
		name: "Powerverse",
		desc: "After the foe is hit with this skill, each hit done to it will boost LB% by <Damage Percent>%. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Float",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "powerverse", [args[0], turns, args[2]]);
			return true
		}
	}),

	spreadverse: new Extra({
		name: "Spreadverse",
		desc: "After the foe is hit with this skill, each hit done to it will spread <Damage Percent>% of damage to other foes. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		args: [
			{
				name: "Damage Percent",
				type: "Float",
				forced: true
			},
			{
				name: "Turns",
				type: "Num",
				forced: true
			},
			{
				name: "Deploy Message",
				type: "Word"
			}
		],
		applyfunc(message, skill, args) {
			const turns = args[1]
			if (turns < 1)
				return void message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "spreadverse", [args[0], turns, args[2]]);
			return true
		}
	}),

	lonewolf: new Exstra({
		name: "Lone Wolf",
		desc: "Skill Power boosted by <Multiplier>x when alone, or all allies are down.",
		args: [
			{
				name: "Mulitplier",
				type: "Float"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "lonewolf", [args[0] ?? 1.5]);
			return true
		}
	}),

	heavenwrath: new Extra({
		name: "Heaven's Wrath",
		desc: "kill Power boosted by <Multiplier>x when not alone, and all allies are alive.",
		args: [
			{
				name: "Mulitplier",
				type: "Float"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "heavenwrath", [args[0] ?? 1.5]);
			return true
		}
	}),

	statcalc: new Extra({
		name: "Stat Calculation",
		desc: "Uses the caster's <Stat> for calculating damage.",
		args: [
			{
				name: "Stat",
				type: "Word",
				forced: true
			}
		],
		applyfunc(message, skill, args) {
			const stat = args[0].toLowerCase()
			if (!utilityFuncs.validStat(stat))
				return void message.channel.send("That's not a valid stat!");
			makeExtra(skill, "statcalc", [stat]);
			return true
		}
	}),

	hpcalc: new Extra({
		name: "HP Calculation",
		desc: "Current HP can boost or decrease damage by up to <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Float"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "hpcalc", [args[0] ?? 50]);
			return true
		}
	}),

	mpcalc: new Extra({
		name: "MP Calculation",
		desc: "Current MP can boost or decrease damage by up to <Percent>%.",
		args: [
			{
				name: "Percent",
				type: "Float"
			}
		],
		applyfunc(message, skill, args) {
			makeExtra(skill, "mpcalc", [args[0] ?? 50]);
			return true
		}
	}),

	multistatus: {
		name: "Multistatus",
		desc: "_<Status> <Status> <Status>_\nThis skill becomes a status skill that will inflict one of multiple statuses.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			let backupStatus = skill.status;
			skill.status = [];
			if (statusEffects.includes(extra1)) skill.status.push(extra1);
			if (statusEffects.includes(extra2)) skill.status.push(extra2);
			if (statusEffects.includes(extra3)) skill.status.push(extra3);
			
			if (skill.status.length <= 0) {
				skill.status = backupStatus;
				return message.channel.send('All 3 status effects were invalid.');
			}
			
			if (!skill.statuschance) skill.statuschance = 100;
			return true;
		}
	},

	dualelement: {
		name: "Dual Element",
		desc: "_<Element>_\nThe skill may use the 2nd element in addition to the first.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (Elements.includes(extra1.toLowerCase()) && extra1.toLowerCase() != skill.type && extra1.toLowerCase() != 'passive' && extra1.toLowerCase() != 'status' && extra1.toLowerCase() != 'heal') {
				skill.type = [(typeof skill.type === 'object') ? skill.type[0] : skill.type, extra1.toLowerCase()];
			} else
				return message.channel.send("That's not a valid element!");	
				
			return true;
		}
	},

	affinitypow: {
		name: "Affinity Power",
		desc: "_<Damage>_\nPower boosted by <Damage> per affinity point. Works only for <:passive:963413845253193758>affinitypoint passives.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Damage>!");
			makeExtra(skill, "affinitypow", [parseInt(extra1)]);
			return true
		}
	},

	forcetech: {
		name: "Force Technical",
		desc: "_<Status Effect #1> {Status Effect #2} {Status Effect #3} {Status Effect #4} {Status Effect #5}_\nForces a skill to tech off of different status effects instead of the preset ones.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status Effect #1>!");

			if (!statusEffects.includes(extra1.toLowerCase())) return message.channel.send("That's not a valid status effect!");
			if (extra2 && !statusEffects.includes(extra2.toLowerCase())) return message.channel.send("That's not a valid status effect!");
			if (extra3 && !statusEffects.includes(extra3.toLowerCase())) return message.channel.send("That's not a valid status effect!");
			if (extra4 && !statusEffects.includes(extra4.toLowerCase())) return message.channel.send("That's not a valid status effect!");
			if (extra5 && !statusEffects.includes(extra5.toLowerCase())) return message.channel.send("That's not a valid status effect!");

			makeExtra(skill, "forcetech", [extra1.toLowerCase(), extra2, extra3, extra4, extra5]);
			return true
		}
	},

	forceformula: {
		name: "Force Formula",
		desc: "_<Formula>_\nForces a skill to use a different damage formula.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Formula>!");

			let damageFormulas = ['persona', 'pokemon', 'lamonka']
			if (damageFormulas.includes(extra1.toLowerCase())) {
				return message.channel.send('Invalid damage formula!\nValid formulas are: Persona, Pokemon, Lamonka')
			}

			makeExtra(skill, "forceformula", [extra1.toLowerCase(), extra2]);
			return true;
		}
	},

	rollout: {
		name: "Rollout",
		desc: "_<Boost> <Max Boost> <Times>_\nBoost the skill's power by <Boost> every consecutive use, but the caster is locked to using it until power reaches <Max Boost>x or skill is used <Times> times in a row.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Boost>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Max Boost>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Times>!");

			if (extra2 < extra1) return message.channel.send("You can't have a max boost lower than the boost!");
			if (parseInt(extra2) < 1) return message.channel.send("You can't have less than 1 max boost!");
			if (parseInt(extra3) < 1) return message.channel.send("You can't have less than 1 times!");

			makeExtra(skill, "rollout", [parseInt(extra1), parseInt(extra2), parseInt(extra3)]);
			return true
		}
	},

	sustain: {
		name: "Sustain",
		desc: "Multi-Hits do not have power altered as hits go on.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "sustain", [true]);
			return true
		}
	},

	reverse: {
		name: "Reverse",
		desc: "Multi-Hits gradually increase in power instead of decreasing.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "reverse", [true]);
			return true
		}
	},

	powhit: {
		name: "Power Hit",
		desc: "_<Hit #1> {Hit #2} {Hit #3} {Hit #4} {Hit #5}_\nWith multi-hits, hits <Hit #1>, {Hit #2}, {Hit #3}, {Hit #4>, and {Hit #5} will have their power increased.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Hit #1>!");

			makeExtra(skill, "powhit", [parseInt(extra1), extra2 ? parseInt(extra2) : null, extra3 ? parseInt(extra3) : null, extra4 ? parseInt(extra4) : null, extra5 ? parseInt(extra5) : null]);
			return true;
		}
	},

	multihit: {
		name: "Multi",
		desc: "_<Chance> {Number of Hits}_\nA <Chance>% chance to add {Number of Hits} extra hit(s) to the skill, multi-hit already or not.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");
			if (extra1 <= 0 || extra1 > 50) return message.channel.send("Invalid value for <Chance>! It should be above 0 or below 50.");
			
			if (extra2) {
				if (extra2 <= 0 || extra2 > 99-(skill.hits ?? 1))
					return message.channel.send(`Invalid value for {Number of Hits}. It should be above 0. Be aware that skills cannot exceed 99 hits, and so, the highest this number can be is ${99-(skill.hits ?? 1)}.`);
			}

			makeExtra(skill, "multihit", [parseInt(extra1), extra2 ? parseInt(extra2) : 1]);
			return true;
		},
		statmod: function(char, skill, vars, btl) {
			let num = randNum(100);

			if (num <= vars[0]) {
				skill.hits += vars[1];
				addAtkMsg(btl, `${char.name}'s ${skill.name} landed ${vars[1]} extra time(s)!`);
			}
		}
	}
}

// Make an Extra for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeExtra(skill, extra, func) {
	if (!skill.extras) skill.extras = {};
	if (!skill.extras[extra]) skill.extras[extra] = [];

	if (extrasList[extra].multiple) {
		if (extrasList[extra].diffflag) {
			for (i in skill.extras[extra]) {
				if (typeof skill.extras[extra][i] == "number") {
					if (skill.extras[extra][i][extrasList[extra].diffflag] === func[extrasList[extra].diffflag]) {
						skill.extras[extra][i] = func;
						return true;
					}
				} else {
					let alltrue = true;
					for (j in extrasList[extra].diffflag) {
						if (skill.extras[extra][i][extrasList[extra].diffflag[j]] !== func[extrasList[extra].diffflag[j]]) {
							alltrue = false;
							break;
						}
					}
					if (alltrue) {
						skill.extras[extra][i] = func;
						return true;
					}
				}
			}
		}
		skill.extras[extra].push(func);
	} else {
		skill.extras[extra] = func;
	}
}

// Checks if the skill has an extra
// just realise we dont need this
hasExtra = (skill, extra) => {
	if (!skill.extras) return false;
	if (!skill.extras[extra]) return false;
	return skill.extras[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyExtra = (message, skill, skillExtra, rawargs) => {
	if (!skill.extras) skill.extras = {};
	if (!skillExtra || !extrasList[skillExtra]) return message.channel.send("You're adding an invalid extra! Use the ''listatkextras'' command to list all extras.");
	if (extrasList[skillExtra].apply(message, skill, rawargs))
		message.react('👍')

	return true;
}

// Custom Variables!
addCusVal = (char, name, vars) => {
	if (!char.custom) char.custom = {};

	char.custom[name] = vars;
	return char.custom[name];
}

killVar = (char, name) => {
	if (!char.custom) return;
	if (!char.custom[name]) return;

	delete char.custom[name];

	if (Object.keys(char.custom).length == 0)
		delete char.custom;
}

customVariables = {
	healverse: {
		onturn: function(btl, char, vars) {
			vars.turns--;
			if (vars.turns <= 0) {
				killVar(char, "healverse");
				return `${vars.infname}'s ${vars.name} has worn off for ${char.name}!`;
			}

			return null;
		},
		onhit: function(btl, char, inf, dmg, vars) {
			let heal = Math.round((dmg/100)*vars.heal);
			switch(vars.type) {
				case 'mp':
					inf.mp = Math.min(inf.maxmp, inf.mp+heal);

				default:
					inf.hp = Math.min(inf.maxhp, inf.hp+heal);
			}

			return `${vars.infname}'s ${vars.name} allowed ${inf.name} to restore ${heal}${vars.type.toUpperCase()}`;
		}
	},

	oldAffinities: {
		onturn: function(btl, char, vars) {
			let text = ''

			for (i in vars) {
				for (j in vars[i]) {
					vars[i][j]--;

					if (vars[i][j] <= 0) {
						for (aff in char.affinities) {
							if (char.affinities[aff].includes(j)) {
								char.affinities[aff].splice(char.affinities[aff].indexOf(j), 1);
							}
						}

						if (i != 'normal' && !char.affinities[i])  char.affinities[i] = [];

						if (i != 'normal') {
							char.affinities[i].push(j);
						}

						text += `${char.name}'s ${affinityEmoji[aff]}**${aff}** affinity to ${elementEmoji[j]}**${j}** was restored to ${affinityEmoji[i]}**${i}**!\n`;

						delete vars[i][j];
					}
				}

				if (vars[i] && Object.keys(vars[i]).length == 0) {
					delete vars[i];
				}
			}

			if (Object.keys(vars).length == 0) {
				killVar(char, "oldAffinities");
			}

			if (text == '') return null;
			return text;
		}
	}
}
extrasList = {
	ohko: {
		name: "One Hit KO",
		desc: '_<Chance>_\nInstantly defeats the foe at a <Chance>% chance.',
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (parseFloat(extra1) < 0) return message.channel.send("What's the point of using this skill if it never lands?");

			makeExtra(skill, "ohko", [parseFloat(extra1)]);
			return true
		}
	},

	sacrifice: {
		name: "Sacrifice",
		desc: "_{HP}_\nWill reduce the caster's HP to a {HP}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "sacrifice", [parseInt(extra1)]);
			return true
		}
	},

	needlessthan: {
		name: "Need less than",
		desc: '_<Percent> <Stat>_\nWill make the skill require less than <Percent>% of <Stat> for it to work.',
		multiple: true,
		diffflag: 1,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || !extra2) return message.channel.send("You didn't supply enough arguments!");

			if (parseFloat(extra1) < 1) return message.channel.send("You can't need less than 0%!");
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return message.channel.send("You entered an invalid value for <Stat>! It can be either HP, HPPercent, MP, MPPercent, or LB.");
			
			makeExtra(skill, "needlessthan", [parseFloat(extra1), extra2]);
			return true
		}
	},

	resistremove: {
		name: "Resist Remove",
		desc: "_<Element>_\nWill remove foe's resisting, blocking, repelling or draining affinities to <Element>.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply enough arguments!");

			if (!Elements.includes(extra1.toLowerCase())) return message.channel.send("You entered an invalid value for <Element>!");

			makeExtra(skill, "resistremove", [extra1.toLowerCase()]);
			return true
		}
	},

	rest: {
		name: "Rest",
		desc: "Forces the caster to rest for one turn.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "rest", [true]);
			return true
		}
	},

	buff: {
		name: "Stat Buff",
		desc: "_<Stat> <Stages> <Chance>_\nWill buff or debuff the foe's <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff.",
		multiple: true,
		diffflag: [0, 2],
		applyfunc: function(message, skill, extra1, extra2, extra3) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Stat>!");
			if (!utilityFuncs.validStat(extra1)) return message.channel.send("That's not a valid stat!");
			if (!extra2) extra2 = '-1';
			if (!extra3) extra3 = '100';

			makeExtra(skill, "buff", [extra1.toLowerCase(), extra2.toLowerCase(), parseInt(extra3)]);
			return true
		}
	},

	powerbuff: {
		name: "Power Buff",
		desc: "_<Stat> <Percent>_\nBoosts skill power with <Stat> buffs up to <Percent>%.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Stat>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Percent>!");
			
			if (!utilityFuncs.validStat(extra1)) return message.channel.send("That's not a valid stat!");

			makeExtra(skill, "powerbuff", [extra1.toLowerCase(), parseInt(extra2)]);
			return true
		}
	},

	takemp: {
		name: "Take MP",
		desc: "_<MP>_\nWill take <MP> MP from the foe each hit.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "takemp", [parseInt(extra1)]);
			return true
		}
	},

	stealmp: {
		name: "Steal MP",
		desc: "Turns the skill into a skill that takes <Power> MP from the foe.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "stealmp", [true]);
			return true
		}
	},

	steal: {
		name: "Steal",
		desc: "_<Chance> {Amount}_\nHas a <Chance>% chance to steal {Amount} of the foe team's items.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");

			if (parseFloat(extra1) < 0) return message.channel.send("You can't steal from a foe that doesn't exist!");
			if (!extra2 && parseInt(extra2) < 1) return message.channel.send("You didn't supply anything for <Amount>!");

			makeExtra(skill, "steal", [parseFloat(extra1), parseInt(extra2)]);
			return true
		}
	},

	drain: {
		name: "Drain",
		desc: "_<Amount>_\nHeals the caster for 1/<Amount> of the damage dealt.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "drain", [parseInt(extra1) == 0 ? 1 : parseInt(extra1)]);
			return true
		}
	},

	feint: {
		name: "Feint",
		desc: "Bypasses shielding skills like Makarakarn and Tetrakarn.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "feint", [true]);
			return true
		}
	},

	healverse: {
		name: "Healverse",
		desc: "_<Damage Percent> <Turns> {Deploy Message}_\nAfter the foe is hit with this skill, each hit done to it will heal <Damage Percent>% of damage dealt to the attacker. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Damage Percent>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Turns>!");

			if (parseInt(extra2) < 1) return message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "healverse", [parseFloat(extra1), parseInt(extra2), extra3]);
			return true
		}
	},

	powerverse: {
		name: "Powerverse",
		desc: "_<Percent> <Turns> {Deploy Message}_\nAfter the foe is hit with this skill, each hit done to it will boost LB% by <Damage Percent>%. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Damage Percent>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Turns>!");

			if (parseInt(extra2) < 1) return message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "powerverse", [parseFloat(extra1), parseInt(extra2), extra3]);
			return true
		}
	},

	spreadverse: {
		name: "Spreadverse",
		desc: "_<Damage Percent> <Turns> {Deploy Message}_\nAfter the foe is hit with this skill, each hit done to it will spread <Damage Percent>% of damage to other foes. This lasts for <Turns> turns. You can add flair to this skill with a {Deploy Message}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Damage Percent>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Turns>!");

			if (parseInt(extra2) < 1) return message.channel.send("You can't have less than 1 turn for this skill.");
			makeExtra(skill, "spreadverse", [parseFloat(extra1), parseInt(extra2), extra3]);
			return true
		}
	},

	lonewolf: {
		name: "Lone Wolf",
		desc: "_<Multiplier>_\nSkill Power boosted by <Multiplier>x when alone, or all allies are down.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Multiplier>!");
			makeExtra(skill, "lonewolf", [parseFloat(extra1)]);
			return true
		}
	},

	heavenwrath: {
		name: "Heaven's Wrath",
		desc: "_<Multiplier>_\nSkill Power boosted by <Multiplier>x when not alone, and all allies are alive.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Multiplier>!");
			makeExtra(skill, "heavenwrath", [parseFloat(extra1)]);
			return true
		}
	},

	statcalc: {
		name: "Stat Calculation",
		desc: "_<Stat>_\nUses the caster's <Stat> for calculating damage.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Stat>!");

			if (!utilityFuncs.validStat(extra2.toLowerCase())) return message.channel.send("That's not a valid stat!");
			makeExtra(skill, "statcalc", [extra2.toLowerCase()]);
			return true
		}
	},

	hpcalc: {
		name: "HP Calculation",
		desc: "_<Percent>_\nCurrent HP can boost or decrease damage by up to <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "hpcalc", [parseFloat(extra1)]);
			return true
		}
	},

	mpcalc: {
		name: "MP Calculation",
		desc: "_<Percent>_\nCurrent MP can boost or decrease damage by up to <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "mpcalc", [parseFloat(extra1)]);
			return true
		}
	},

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
			
			if (!skill.statusChance) skill.statusChance = 100;
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
		desc: "_<Formula> {Custom Formula}_\nForces a skill to use a different damage formula. If the formula is custom, you must supply a custom formula.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Formula>!");

			let damageFormulas = ['persona','pokemon','custom',]
	
			if (damageFormulas.includes(extra1.toLowerCase())) {
				return message.channel.send('Invalid damage formula! Valid formulas are: persona, pokemon, custom')
			}
	
			if (extra1.toLowerCase() == 'custom') {
				return message.channel.send('Custom damage formulas are not yet supported!')
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

			makeExtra(skill, "powhit", [parseInt(extra1), extra2 ? parseInt(extra2) : 1]);
			return true;
		},
		statmod: function(char, skill, vars, btl) {
			let num = randNum(100);

			if (num <= vars[0]) {
				skill.hits += vars[1];
				addAtkMsg(`${char.name}'s ${skill.name} landed ${vars[1]} extra time(s)!`);
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
		skill.extras[extra][0] = func;
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
applyExtra = (message, skill, skillExtra, extra1, extra2, extra3, extra4, extra5) => {
	if (!skill.extras) skill.extras = {};
	if (!skillExtra || !extrasList[skillExtra.toLowerCase()]) return message.channel.send("You're adding an invalid extra! Use the ''listatkextras'' command to list all extras.");

	extrasList[skillExtra.toLowerCase()].applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5);
	message.react('👍');

	return true;
}
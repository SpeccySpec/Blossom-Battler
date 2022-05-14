passiveList = {
	// On Attack.
	boost: {
		name: "Boost",
		desc: "_<Element> <Percentage>_\nBoosts the powers of skills of a specific element. Values for <Percentage> that are less than 100% will actually have negative effects! Negative values may even heal the foe... somehow.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Percentage>!");

			let element = extra1.toLowerCase();
			if ((!utilityFuncs.inArray(element, Elements) && element != 'all' && element != 'magic' && element != 'physical') || element === 'almighty') return message.channel.send("You entered an invalid element!");

			makePassive(skill, "boost", [element, parseInt(extra2)]);
			return true;
		},
		statmod: function(btl, char, skill, vars) {
			
		}
	},

	moodswing: {
		name: "Mood Swing",
		desc: "_<Percentage Boost/Decrease> <Turns>_\nEvery <Turns> turns, your mood will switch from Calm to Angry and back, buffing/nerfing skills respectively.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseInt(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseInt(extra2)]);
			return true;
		}
	},

	berserk: {
		name: "Berserk",
		desc: "_<Percentage Multiplier> <Highest HP Percent>_\n.With more HP, the user is more willing to fight. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseFloat(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	enraged: {
		name: "Enraged",
		desc: "_<Percentage Multiplier> <Highest HP Percent>_\n.With less HP, the user is more angered. <Percentage Multiplier> should be over 100%... or you might get the opposite!",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2 || parseFloat(extra2) < 1) return message.channel.send("You didn't supply anything for <Percentage>!");
			makePassive(skill, "boost", [parseFloat(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	// Start Of Turn
	heal: {
		name: "Heal",
		desc: "_<Amount> <Stat>_\nRestores <Amount> of max <Stat> on the start of your turn, <Stat> being either HP, HPPercent, MP, MPPercent, or LB.",
		multiple: true,
		diffflag: 1,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseInt(extra1) < 1) return message.channel.send("You didn't supply anything for <Amount>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Stat>!");
			
			let stat = extra2.toLowerCase();
			if (stat != 'hp' && stat != 'mp' && stat != 'hppercent' && stat != 'mppercent' && stat != 'lb')
				return message.channel.send("You entered an invalid value for <Stat>! It can be either HP, HPPercent, MP, MPPercent, or LB.");

			makePassive(skill, "heal", [parseInt(extra1), stat]);
			return true;
		},
		onturn: function(btl, char, vars) {
			let finalTxt = '';
			let settings = setUpSettings(btl.guild.id);

			switch(vars[1].toLowerCase()) {
				case 'mp':
					char.mp += parseInt(vars[0]);
					finalTxt = `${char.name}'s MP was restored by ${vars[0]}!`;
					break;

				case 'lb':
					if (settings.mechanics.limitbreaks) {
						char.lbpercent += parseInt(vars[0]);
						finalTxt = `${char.name}'s LB% was restored by ${vars[0]}!`;
					} else {
						char.mp += (char.maxmp/100)*parseInt(vars[0]);
						finalTxt = `${char.name}'s MP was restored by ${(char.maxmp/100)*parseInt(vars[0])}!`;
					}

					break;

				case 'hppercent':
					char.hp += (char.maxhp/100)*parseInt(vars[0]);
					finalTxt = `${char.name}'s HP was restored by ${(char.maxhp/100)*parseInt(vars[0])}!`;
					break;

				case 'mppercent':
					char.mp += (char.maxmp/100)*parseInt(vars[0]);
					finalTxt = `${char.name}'s MP was restored by ${(char.maxmp/100)*parseInt(vars[0])}!`;
					break;

				default:
					char.hp += parseInt(vars[0]);
					finalTxt = `${char.name}'s HP was restored by ${vars[0]}!`;
					break;
			}

			char.hp = Math.min(char.maxhp, char.hp);
			char.mp = Math.min(char.maxmp, char.mp);
			return finalTxt;
		}
	},

	damage: {
		name: "Damage",
		desc: "_<Phys/Mag> <Damage> <Element>_\nInflicts <Damage> of <Element> damage to the target when attacked with a <Phys/Mag> skill.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Phys/Mag>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Damage>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Element>!");

			let physmag = extra1.toLowerCase();
			if (physmag != 'phys' && physmag != 'mag')
				return message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");

			if (!Elements.includes(extra3.toLowerCase())) return message.channel.send("You entered an invalid value for <Element>!");
			if (skill.type == 'status' || skill.type == 'heal' || skill.type == 'passive')
				return message.channel.send("You can't use this element!");
			
			makePassive(skill, "damage", [physmag, parseInt(extra2), extra3.toLowerCase()]);
			return true;
		}
	},

	dodge: {
		name: "Dodge",
		desc: "_<Phys/Mag> <Chance>_\nHas a <Chance>% chance to dodge attacks from a <Phys/Mag> skill.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Phys/Mag>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Chance>!");

			let physmag = extra1.toLowerCase();
			if (physmag != 'phys' && physmag != 'mag')
				return message.channel.send("You entered an invalid value for <Phys/Mag>! It can be either PHYS or MAG.");

			if (parseInt(extra2) < 1) return message.channel.send("You entered an invalid value for <Chance>!");

			makePassive(skill, "dodge", [physmag, parseInt(extra2)]);
			return true;
		}
	},

	counterphys: {
		name: "Counter Physical",
		desc: "_<Chance> <Power> <Accuracy> {Crit} <Element>_\nHas a <Chance>% chance to counter physical attacks with a skill with <Power> power, <Accuracy>% accuracy, {Crit}% crit chance, and <Element> element.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Power>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Accuracy>!");
			if (!extra5) return message.channel.send("You didn't supply anything for <Element>!");

			if (parseInt(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");
			if (parseInt(extra2) < 1) return message.channel.send("You entered an invalid value for <Power>!");
			if (parseFloat(extra3) < 1) return message.channel.send("You entered an invalid value for <Accuracy>!");

			if (!Elements.includes(extra5.toLowerCase())) return message.channel.send("You entered an invalid value for <Element>!");
			if (skill.type != 'strike' || skill.type != 'slash' || skill.type != 'pierce' || skill.type != 'explode')
				return message.channel.send("That is not a physical element!");

			makePassive(skill, "counterphys", [parseInt(extra1), {
				name: skill.name,
				pow: parseInt(extra2),
				acc: parseFloat(extra3),
				crit: Math.max(0, Math.min(parseFloat(extra4), 100)),
				type: extra5.toLowerCase(),
				atktype: 'physical',
				affinitypow: 5
			}]);
			return true;
		}
	},

	countermag: {
		name: "Counter Magic",
		desc: "_<Chance> <Power> <Accuracy> {Crit} <Element>_\nHas a <Chance>% chance to counter magical attacks with a skill with <Power> power, <Accuracy>% accuracy, {Crit}% crit chance, and <Element> element.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Power>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Accuracy>!");
			if (!extra5) return message.channel.send("You didn't supply anything for <Element>!");

			if (parseInt(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");
			if (parseInt(extra2) < 1) return message.channel.send("You entered an invalid value for <Power>!");
			if (parseFloat(extra3) < 1) return message.channel.send("You entered an invalid value for <Accuracy>!");

			if (!Elements.includes(extra5.toLowerCase())) return message.channel.send("You entered an invalid value for <Element>!");
			if (skill.type != 'status' || skill.type != 'heal' || skill.type != 'passive')
				return message.channel.send("That is not a magical element!");
			if (skill.type == 'strike' || skill.type == 'slash' || skill.type == 'pierce')
				return message.channel.send("That is not a magical element!");

			makePassive(skill, "countermag", [parseInt(extra1), {
				name: skill.name,
				pow: parseInt(extra2),
				acc: parseFloat(extra3),
				crit: Math.max(0, Math.min(parseFloat(extra4), 100)),
				type: extra5.toLowerCase(),
				atktype: 'magic',
				affinitypow: 5
			}]);
			return true;
		}
	},

	status: {
		name: "Status",
		desc: "_<Status Effect> <Chance>_\nHas a <Chance>% chance of inflicting <Status Effect> on a fighter if they use a physical attack.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status Effect>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Chance>!");

			if (!Status.includes(extra1.toLowerCase())) return message.channel.send("You entered an invalid value for <Status Effect>!");
			if (parseFloat(extra2) < 1) return message.channel.send("You entered an invalid value for <Chance>!");

			makePassive(skill, "status", [extra1.toLowerCase(), parseFloat(extra2)]);
			return true;
		}
	},

	statusresist: {
		name: "Status Resist",
		desc: "Resists status effects in some way.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makePassive(skill, "statusresist", [true]);
			return true;
		}
	},

	statusdodge: {
		name: "Status Dodge",
		desc: "_<Status Effect> <Chance>_\nHas a <Chance>% chance to avoid <Status Effect> from being inflicted. Accepts 'physical', 'mental' and 'all' as status effects.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status Effect>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Chance>!");

			if (!extra1.toLowerCase() == 'physical' && !extra1.toLowerCase() == 'mental' && !extra1.toLowerCase() == 'all') {
				if (!Status.includes(extra1.toLowerCase())) return message.channel.send("You entered an invalid value for <Status Effect>!");
			}
			if (parseFloat(extra2) < 1) return message.channel.send("You entered an invalid value for <Chance>!");

			makePassive(skill, "statusdodge", [extra1.toLowerCase(), parseFloat(extra2)]);
			return true;
		}
	},

	curestatus: {
		name: "Cure Status",
		desc: "_<Chance>_\n<Chance>% chance to cure a negative status effect on the start of your turn.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Amount>!");
			makePassive(skill, "curestatus", [parseFloat(extra1)]);
			return true;
		}
	},

	perfectkeeper: {
		name: "Perfect Keeper",
		desc: "_<Percent>_\nPower of Physical Attacks is boosted at higher HP, and decreased at lower HP up to <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || parseFloat(extra1) < 1) return message.channel.send("You didn't supply anything for <Percent>!");
			makePassive(skill, "perfectkeeper", [parseFloat(extra1)]);
			return true;
		}
	},

	extrahit: {
		name: "Extra Hit",
		desc: "_<Hits> <Chance> <Power Multiplier>_\nHas a <Chance>% chance to hit <Hits> more times from a single hit skill with <Power Multiplier>x as much power.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Hits>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Chance>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Power Multiplier>!");

			if (parseInt(extra1) < 1) return message.channel.send("You entered an invalid value for <Hits>!");
			if (parseInt(extra2) < 1) return message.channel.send("You entered an invalid value for <Chance>!");

			makePassive(skill, "extrahit", [parseInt(extra1), parseInt(extra2), parseFloat(extra3)]);
			return true;
		}
	},

	kindheart: {
		name: "Kind Heart",
		desc: "_<Percent>_\nBoosts pacify rate by <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Percent>!");

			makePassive(skill, "kindheart", [parseFloat(extra1)]);
			return true;
		}
	},

	affinitycutter: {
		name: "Affinity Cutter",
		desc: "_<Chance>_\n<Chance>% chance to bypass resist affinities.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");

			if (parseFloat(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");
			makePassive(skill, "affinitycutter", [parseFloat(extra1)]);
			return true;
		}
	},

	affinityslicer: {
		name: "Affinity Slicer",
		desc: "_<Chance>_\n<Chance>% chance to bypass all affinities, turning them into a resist or better.\n```diff\n+ Drain, Repel, Block ---> Resist\n+ Resist ---> Normal\n```",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");
			
			if (parseFloat(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");
			makePassive(skill, "affinityslicer", [parseFloat(extra1)]);
			return true;
		}
	},

	swordbreaker: {
		name: "Sword Breaker",
		desc: "_<Chance>_\n<Chance>% chance to physical attacks that hit the user to a resist.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");

			if (parseFloat(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");
			makePassive(skill, "swordbreaker", [parseFloat(extra1)]);
			return true;
		}
	},

	magicmelee: {
		name: "Magic Melee",
		desc: "Turns caster's melee attack into a magic attack.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makePassive(skill, "magicmelee", [true]);
			return true;
		}
	},

	attackall: {
		name: "Attack All",
		desc: "Melee Attack targets all foes.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makePassive(skill, "attackall", [true]);
			return true;
		}
	},

	wonderguard: {
		name: "Wonder Guard",
		desc: "Nullifies damage from attacks that the caster is not weak to.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makePassive(skill, "wonderguard", [true]);
			return true;
		}
	},

	repelmag: {
		name: "Repel Magic",
		desc: "_<Chance> <Element #1> {Element #2} {Element #3} {Element #4}_\n<Chance>% chance to repel magic of type <Element #1>, {Element #2}, {Element #3}, and {Element #4}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Chance>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Element #1>!");

			if (parseFloat(extra1) < 1) return message.channel.send("You entered an invalid value for <Chance>!");

			var elements = [];
			if (Elements.includes(extra2.toLowerCase())) elements.push(extra2.toLowerCase());
			if (extra3 && Elements.includes(extra3.toLowerCase())) elements.push(extra3.toLowerCase());
			if (extra4 && Elements.includes(extra4.toLowerCase())) elements.push(extra4.toLowerCase());
			if (extra5 && Elements.includes(extra5.toLowerCase())) elements.push(extra5.toLowerCase());

			if (elements.length < 1) return message.channel.send("You didn't supply any valid elements!");
			makePassive(skill, "repelmag", [parseFloat(extra1), elements]);
			return true;
		}
	},

	endure: {
		name: "Endure",
		desc: "_<Amount> {HP}_\nUpon defeat, revives the caster up to <Amount> times with {HP} HP.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Amount>!");

			if (parseInt(extra1) < 1) return message.channel.send("You entered an invalid value for <Amount>!");
			if (extra2 && parseInt(extra2) < 1) return message.channel.send("You entered an invalid value for <HP>!");
			makePassive(skill, "endure", [parseInt(extra1), parseInt(extra2)]);
			return true;
		}
	},

	guardboost: {
		name: "Guard Boost",
		desc: "_<Percent>_\nReduces damage taken when guarding further by <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Percent>!");

			makePassive(skill, "guardboost", [parseFloat(extra1)]);
			return true
		}
	},

	guarddodge: {
		name: "Guard Dodge",
		desc: "_<Percent>_\nBoosts dodigng attacks when guarding by <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Percent>!");

			makePassive(skill, "guarddodge", [parseFloat(extra1)]);
			return true
		}
	},

	sacrificial: {
		name: "Sacrificial",
		desc: "_<Percent>_\nBoosts the power of sacrifice skills by <Percent>%.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Percent>!");

			makePassive(skill, "sacrificial", [parseFloat(extra1)]);
			return true
		}
	},

	sacrifice: {
		name: "Sacrifice",
		desc: "_<HP Percent> <MP Percent>_\nUpon foe defeat, restores HP equal to <HP Percent>% of the foe's level and MP equal to <MP Percent>% of the foe's level.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1 || !extra2) return message.channel.send("You didn't supply anything for <HP Percent> or <MP Percent>!");

			makePassive(skill, "sacrifice", [parseFloat(extra1), parseFloat(extra2)]);
			return true
		}
	},

	alterpain: {
		name: "Alter Pain",
		desc: "_<Percent>_\nGain <Percent>% of damage taken as MP.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Percent>!");

			makePassive(skill, "alterpain", [parseFloat(extra1)]);
			return true
		}
	},

	elementstore: {
		name: "Element Store",
		desc: "_<Element> <Percent of Damage> <Chance>_\n<Chance>% chance to store <Damage Percent>% of damage taken from <Element> attacks to add up for the next attack. Stackable. Once hit, the stored damage is reset.",
		multiple: true,
		diffflag: 0,
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Element>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Damage Percent>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Chance>!");

			extra1 = extra1.toLowerCase();
			if (!Elements.includes(extra1)) return message.channel.send("You entered an invalid value for <Element>!");
			if (extra1 === "heal" || extra1 === "status" || extra1 === "passive") return message.channel.send("You entered an invalid value for <Element>!");

			if (parseFloat(extra3) < 0) return message.channel.send("You entered an invalid value for <Chance>!");

			makePassive(skill, "elementstore", [extra1, parseFloat(extra2), parseFloat(extra3)]);
			return true;
		}
	}
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
		skill.passive[extra][0] = func;
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
applyPassive = (message, skill, skillExtra, extra1, extra2, extra3, extra4, extra5) => {
	if (!skill.passive) skill.passive = {};
	if (!skillExtra || !passiveList[skillExtra.toLowerCase()]) {
		message.channel.send("You're adding an invalid passive type! Use the ''listpassivetypes'' command to list all extras.");
		return false;
	}

	if (!passiveList[skillExtra.toLowerCase()].applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5)) {
		message.channel.send("Something went wrong!");
		return false;
	}
	
	skill.done = true;

	console.log("win")
	return true;
}

buildPassive = (message, args) => {
	let skill = {
		name: args[0],
		type: 'passive',
		originalAuthor: message.author.id
	}

	applyPassive(message, skill, args[1].toLowerCase(), args[2], args[3], args[4], args[5], args[6])
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}
statusList = {
	status: {
		name: 'Status',
		desc: '_<Status> {Chance}_\n<Chance>% to inflict a <Status> on the target.',
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status>!");
			extra1 = extra1.toLowerCase();
			if (!statusEffects.includes(extra1)) return message.channel.send("That's not a valid status!");
			if (!extra2) extra2 = 100;

			skill.status = extra1;
			skill.statusChance = extra2;
			return true;
		}
	},

	buff: {
		name: "Stat Buff",
		desc: "_<Stat> <Stages> <Chance>_\nWill buff or debuff the foe's <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff.",
		multiplelimiter: [0, 2],
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Stat>!");
			if (!utilityFuncs.validStat(extra1)) return message.channel.send("That's not a valid stat!");
			if (!extra2) extra3 = '-1';
			if (!extra3) extra3 = '100';

			makeStatus(skill, "buff", [extra1.toLowerCase(), parseInt(extra2), parseFloat(extra3)]);
			return true;
		}
	},

	dekunda: {
		name: "Dekunda",
		desc: "Removes the target's positive buffs.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeStatus(skill, "dekunda", [true]);
			return true;
		}
	},

	heartswap: {
		name: "Heart Swap",
		desc: "Swaps the target's stat changes with the caster's.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeStatus(skill, "heartswap", [true]);
			return true;
		}
	},

	mimic: {
		name: "Mimic",
		desc: "_<Turns> {Skill}_\nMorphs into an ally or an enemy of the caster's choice for <Turns> turns. The caster can change back with {Skill}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Turns>!");
			if (parseInt(extra1) < 1) return message.channel.send("You can't have less than 1 turn!");

			if (extra2 && !skillFile[extra2]) return message.channel.send("That's not a valid skill!");
			if (extra2 && (!skillFile[extra2].statusses || (skillFile[extra2].statusses && !skillFile[extra2].statusses.unmimic))) return message.channel.send("That's not a valid skill!");

			makeStatus(skill, "mimic", [parseInt(extra1), extra2 ?? null]);
			return true;
		}
	},

	unmimic: {
		name: "Unmimic",
		desc: "Will return the caster to their original form.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeStatus(skill, "unmimic", [true]);
			return true;
		}
	},

	clone: {
		name: "Clone",
		desc: "_<HP Percent> <MP Percent> <Percent>_\nClones the caster into a new ally with <HP Percent>% of Max HP, <MP Percent>% of Max MP, and <Percent>% of the caster's stats.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <HP Percent>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <MP Percent>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Percent>!");

			makeStatus(skill, "clone", [parseFloat(extra1), parseFloat(extra2), parseFloat(extra3)]);
			return true;
		}
	},

	shield: {
		name: "Shield",
		desc: "_<Shield Name> <Hits>_\nProtects the target with a shield called <Shield Name> that can take <Hits> hits.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Shield Name>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Hits>!");

			if (parseInt(extra2) < 1) return message.channel.send("You can't have less than 1 hit!");
			makeStatus(skill, "shield", [extra1, parseInt(extra2)]);
			return true;
		}
	},

	makarakarn: {
		name: "Makarakarn",
		desc: "Protects the target with a shield that repels magic attacks.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeStatus(skill, "makarakarn", [true]);
			return true;
		}
	},

	tetrakarn: {
		name: "Tetrakarn",
		desc: "Protects the target with a shield that repels physical attacks.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeStatus(skill, "tetrakarn", [true]);
			return true;
		}
	},

	shieldbreak: {
		name: "Shield Break",
		desc: "_<Shield/Tetra/Makara> <Accuracy>_\nHas a <Accuracy>% chance to break the target's <Shield/Tetra/Makara>.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Shield/Tetra/Makara>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Accuracy>!");

			if (!["shield", "tetra", "makara"].includes(extra1.toLowerCase())) return message.channel.send("That's not shield/tetra/makara!");
			if (parseFloat(extra2) < 1) return message.channel.send("You can't have less than 1 hit!");
			makeStatus(skill, "shieldbreak", [extra1.toLowerCase(), parseFloat(extra2)]);
			return true;
		}
	},

	trap: {
		name: "Trap",
		desc: "_<Trap Name> <Power Multiplier> <Type> <Variable #1> <Variable #2>_\nProtects the target with a trap called <Trap Name> that is set off once a physical attack strikes them and multiplies power by <Power Multiplier>x. <Variable #1> and <Variable #2> differ based on <Type>\n```diff\n+ Debuff: Debuffable Stat, Stages\n+ Status: Valid Status Effect, Chance\n+ Damage: Fixed Damage, Element```",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Trap Name>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Power Multiplier>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Type>!");

			let validTypes = ["debuff", "status", "damage"];
			if (!validTypes.includes(extra3.toLowerCase())) return message.channel.send("That's not a valid type!");
			if (extra3.toLowerCase() == "debuff") {
				if (!extra4) return message.channel.send("You didn't supply anything for <Debuff Name>!");
				if (!extra5) return message.channel.send("You didn't supply anything for <Debuff Stages>!");

				let validStats = ["atk", "mag", "prc", "end", "chr", "int", "agl", "luk"];
				if (!validStats.includes(extra4.toLowerCase())) return message.channel.send("That's not a valid stat!");

				makeStatus(skill, "trap", [extra1, parseFloat(extra2), extra3.toLowerCase(), extra4.toLowerCase(), parseInt(extra5)]);
			} else if (extra3.toLowerCase() == "status") {
				if (!extra4) return message.channel.send("You didn't supply anything for <Status Name>!");

				if (!statusEffects.includes(extra4.toLowerCase())) return message.channel.send("That's not a valid status effect!");
				if (!extra5) extra5 = '-1';

				makeStatus(skill, "trap", [extra1, parseFloat(extra2), extra3.toLowerCase(), extra4.toLowerCase(), parseInt(extra5)]);
			} else if (extra3.toLowerCase() == "damage") {
				if (!extra4) return message.channel.send("You didn't supply anything for <Fixed Damage>!");
				if (!extra5) return message.channel.send("You didn't supply anything for <Element>!");

				if (!Elements.includes(extra5.toLowerCase())) return message.channel.send("That's not a valid element!");
				if (extra5.toLowerCase() == "heal") return message.channel.send("You can't set a trap to heal!");
				if (extra5.toLowerCase() == "status") return message.channel.send("You can't set a trap to status!");
				if (extra5.toLowerCase() == "passive") return message.channel.send("You can't set a trap to passive!");

				makeStatus(skill, "trap", [extra1, parseFloat(extra2), extra3.toLowerCase(), extra4, extra5.toLowerCase()]);
			}
			return true;
		}
	},

	weather: {
		name: "Weather",
		desc: "_<Weather>_\nChanges the weather to <Weather>, which will affect the battle.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Weather>!");
			if (!weathers.includes(extra1.toLowerCase())) return message.channel.send("That's not a valid weather!");

			makeStatus(skill, "weather", [extra1.toLowerCase()]);
			return true;
		}
	},

	terrain: {
		name: "Terrain",
		desc: "_<Terrain>_\nChanges the terrain to <Terrain>, which will affect the battle.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Terrain>!");
			if (!terrains.includes(extra1.toLowerCase())) return message.channel.send("That's not a valid terrain!");

			makeStatus(skill, "terrain", [extra1.toLowerCase()]);
			return true;
		}
	},

	reincarnate: {
		name: "Reincarnate",
		desc: "_<Mininum Stat> <Maximum Stat> <Percent> {Deploy Message}_\nSummons a reincarnate to the caster's team. The reincarnate will have stats randomized between <Minimum Stat> and <Maximum Stat> and HP and MP at <Percent>% of caster's Max HP and Max MP. You can add flair to this skill with a {Deploy Message}. These can use %PLAYER% to replace with the caster, and %UNDEAD% to replace with the undead.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Minimum Stat>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Maximum Stat>!");
			if (!extra3) return message.channel.send("You didn't supply anything for <Percent>!");
			
			if (parseInt(extra1) < 1) return message.channel.send("Minimum Stat must be above 0!");
			if (parseInt(extra2) < 1) return message.channel.send("Maximum Stat must be above 0!");
			if (parseInt(extra2) < parseInt(extra1)) return message.channel.send("Maximum Stat must be greater than Minimum Stat!");
			if (parseFloat(extra3) < 1) return message.channel.send("Percent must be above 0!");

			makeStatus(skill, "reincarnate", [parseInt(extra1), parseInt(extra2), parseFloat(extra3), extra4 ? extra4 : "%PLAYER% has summoned an undead %UNDEAD%"]);
			return true;
		}
	},

	futuresight: {
		name: "Futuresight",
		desc: "_<Power> <Accuracy> {Crit} <Element> <Turns>_\nThis skill becomes an attacking skill that strikes the foe in <Turns> turns with <Power> power, <Accuracy>% accuracy, <Crit>% critical chance, and element of <Element>.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Power>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Accuracy>!");
			if (!extra4) return message.channel.send("You didn't supply anything for <Type>!");
			if (!extra5) return message.channel.send("You didn't supply anything for <Turns>!");

			if (parseInt(extra1) < 1) return message.channel.send("Power must be above 0!");
			if (parseFloat(extra2) < 1) return message.channel.send("Accuracy must be above 0!");
			if (parseInt(extra5) < 1) return message.channel.send("Turns must be above 0!");

			if (!Elements.includes(extra4.toLowerCase())) return message.channel.send("That's not a valid element!");
			if (extra4.toLowerCase() == "heal") return message.channel.send("You can't set a futuresight to heal!");
			if (extra4.toLowerCase() == "status") return message.channel.send("You can't set a futuresight to status!");
			if (extra4.toLowerCase() == "passive") return message.channel.send("You can't set a futuresight to passive!");

			makeStatus(skill, "futuresight", [{
				name: skill.name,
				pow: parseInt(extra1),
				acc: parseFloat(extra2),
				crit: Math.max(0, Math.min(parseFloat(extra3), 100)),
				type: extra4.toLowerCase(),
				atktype: 'magic',
				turns: parseInt(extra5)
			}]);
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

	chaosstir: {
		name: "Chaos Stir",
		desc: "_<Power Multiplier> <Accuracy>_\nUpon getting hit with a skill, the caster strikes back with the skill with <Power Multiplier>x power and <Accuracy>% accuracy.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Power>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Accuracy>!");

			if (parseInt(extra1) < 1) return message.channel.send("Power must be above 0!");
			if (parseFloat(extra2) < 1) return message.channel.send("Accuracy must be above 0!");

			makeStatus(skill, "chaosstir", [parseInt(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	pacifystatus: {
		name: "Pacify Status",
		desc: "_<Status Effect> <Amount>_\nPacifies the target if they have <Status Effect>, by <Amount>. Accepts 'physical', 'mental', and 'all' as statuses.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status Effect>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Amount>!");

			if (!extra1.toLowerCase() == "physical" && !extra1.toLowerCase() == "mental" && !extra1.toLowerCase() == "all") {
				if (!statusEffects.includes(extra1)) return message.channel.send("That's not a valid status effect!");
			}

			makeStatus(skill, "pacifystatus", [extra1, parseInt(extra2)]);
			return true;
		}
	},

	ragesoul: {
		name: "Rage Soul",
		desc: "_<Melee Power Multiplier> <ATK Stat Multiplier>_\nMultiplies the caster's Melee Attack Power by <Melee Power Multiplier> and their Attack Stat by <ATK Stat Multiplier>, but locks them into using Melee Attacks.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Melee Power Multiplier>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <ATK Stat Multiplier>!");

			makeStatus(skill, "ragesoul", [parseFloat(extra1), parseFloat(extra2)]);
			return true;
		}
	},

	powercharge: {
		name: "Power Charge",
		desc: "_<Power Multiplier>_\nBoosts physical damage by <Power Multiplier>x for one turn. Removed whether attacked or not.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Power Multiplier>!");

			makeStatus(skill, "powercharge", [parseFloat(extra1)]);
			return true;
		}
	},

	mindcharge: {
		name: "Mind Charge",
		desc: "_<Power Multiplier>_\nBoosts magic damage by <Power Multiplier>x for one turn. Removed whether attacked or not.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Power Multiplier>!");

			makeStatus(skill, "mindcharge", [parseFloat(extra1)]);
			return true;
		}
	},

	orgiamode: {
		name: "Orgia Mode",
		desc: "_<ATK & MAG Multiplier> <END Multiplier> <Turns>_\nModifies caster's ATK and MAG by <ATK & MAG Multiplier>x and END by <END Multiplier>x for <Turns> turns. Falls asleep afterwards.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <ATK & MAG Multiplier>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <END Multiplier>!");

			if (parseInt(extra3) < 1) return message.channel.send("Turns must be above 0!");

			makeStatus(skill, "orgiamode", [parseFloat(extra1), parseFloat(extra2), parseInt(extra3)]);
			return true;
		}
	}
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeStatus(skill, extra, func) {
	if (!skill.statusses) skill.statusses = {};
	if (!skill.statusses[extra]) skill.statusses[extra] = [];

	/*let extrasthatcanbeinmultiples = ['buff']

	if (extrasthatcanbeinmultiples.includes(extra)) {
		let index = 0;
		for (let i in skill.statusses[extra].length) {
			if (skill.statusses[extra][i][0] == func[0] && skill.statusses[extra][i][2] == func[2]) {
				break;
			}
			index++
		}
		skill.statusses[extra][index] = func;
	} else {
		skill.statusses[extra][0] = func;
	}*/
	if (statusList[extra].multiplelimiter && skill.statusses[extra].length < 1) {
		for (i in skill.statusses[extra]) {
			if (typeof skill.statusses[extra][i] == "number") {
				if (skill.statusses[extra][i][statusList[extra].multiplelimiter] === func[statusList[extra].multiplelimiter]) {
					skill.statusses[extra][i] = func;
					return true;
				}
			} else {
				let alltrue = true;
				for (j in statusList[extra].multiplelimiter) {
					if (skill.statusses[extra][i][statusList[extra].multiplelimiter[j]] !== func[statusList[extra].multiplelimiter[j]]) {
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
		skill.statusses[extra].push(func);
	} else {
		skill.statusses[extra][0] = func;
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
applyStatus = (message, skill, skillExtra, extra1, extra2, extra3, extra4, extra5) => {
	if (!skill.statusses) skill.statusses = {};
	if (!skillExtra || !statusList[skillExtra.toLowerCase()]) {
		message.channel.send("You're adding an invalid status type! Use the ''liststatus'' command to list all extras.");
		return false;
	}

	if (!statusList[skillExtra.toLowerCase()].applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5)) {
		message.channel.send("Something went wrong!");
		return false;
	}
	
	skill.done = true;

	console.log("win")
	return true;
}

buildStatus = (message, args) => {
	let skill = {
		name: args[0],
		type: 'status',
		cost: args[1],
		costtype: args[2],
		target: args[3],
		originalAuthor: message.author.id
	}

	applyStatus(message, skill, args[4].toLowerCase(), args[5], args[6], args[7], args[8], args[9])
	
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

			let dmg = Math.round(fighterDef.maxhp/10)
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

			let dmg = Math.round(fighterDef.maxhp/10)
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

			let dmg = Math.round(fighterDef.maxhp/8)
			if (char.boss || char.miniboss) dmg = 10;

			if (hasStatusAffinity(char, 'burn', 'weak')) {
				dmg *= 2;
				affinityTxt = affinityEmoji.weak;
			} else if (hasStatusAffinity(char, 'burn', 'resist')) {
				dmg /= 2;
				affinityTxt = affinityEmoji.resist;
			}

			char.hp = Math.max(0, char.hp-dmg);
			if (char.hp <= 0) return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding, being defeated!`;

			return `${char.name} took ${dmg}${affinityTxt} damage from their bleeding!`;
		}
	}
}
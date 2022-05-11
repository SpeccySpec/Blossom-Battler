healList = {
	default: {
		name: "Default",
		desc: "_<HP>_\nThe default heal type. Restores HP by <HP>. _Negative values for <HP> will damage the target!_",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <HP>!");
			if (parseInt(extra1) == 0) extra1 = 60;
			makeHeal(skill, "default", [parseInt(extra1)]);
			return true;
		}
	},

	healmp: {
		name: "Heal MP",
		desc: "_<MP>_\nRestores MP by <MP>. _Negative values for <MP> will drain the target!_",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <MP>!");
			makeHeal(skill, "healmp", [parseInt(extra1)]);
			return true;
		}
	},

	regenerate: {
		name: "Regenerate",
		desc: "_<HP> <Turns>_\nRestores HP by <HP> over time for <Turns> turns. _Negative values for <HP> will damage the target!_",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <HP>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Turns>!");
			if (parseInt(extra1) == 0) extra1 = 20;
			if (parseInt(extra1) == 0) extra2 = 3;
			makeHeal(skill, "regenerate", [parseInt(extra1), parseInt(extra2)]);
			return true;
		}
	},

	invigorate: {
		name: "Invigorate",
		desc: "_<MP> <Turns>_\nRestores MP by <MP> over time for <Turns> turns. _Negative values for <MP> will drain the target!_",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <MP>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Turns>!");
			if (parseInt(extra1) == 0) extra1 = 20;
			if (parseInt(extra1) == 0) extra2 = 3;
			return true;
		}
	},

	revive: {
		name: "Revive",
		desc: "_<Amount>_\nRevives the target to 1/<Amount> of their max HP. _Negative values are not permitted._",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Amount>!");
			if (parseInt(extra1) <= 0) return message.channel.send("You can't revive to 0 or less!");
			makeHeal(skill, "revive", [parseInt(extra1)]);
			return true;
		}
	},

	recarmdra: {
		name: "Recarmdra",
		desc: "Fully restores party HP and MP, but downs the caster.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeHeal(skill, "recarmdra", [true]);
			return true;
		}
	},

	fullheal: {
		name: "Full Heal",
		desc: "Fully restores HP of the target.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeHeal(skill, "fullheal", [true]);
			if (hasHealType(skill, "default")) delete skill.heal["default"];
			return true;
		}
	},

	statusheal: {
		name: "Status Heal",
		desc: "_<Status>_\nCures the target of the specified status. Accepts 'physical', 'mental' and 'all' as statuses.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Status>!");
			extra1 = extra1.toLowerCase();
			if (extra1 != 'physical' || extra1 != 'mental' || extra1 != 'all') {
				if (!statusEffects.includes(extra1)) return message.channel.send("That's not a valid status!");
			}
			makeHeal(skill, "statusheal", [extra1]);
			return true;
		}
	},

	sacrifice: {
		name: "Sacrifice",
		desc: "_{HP}_\nWill reduce the caster's HP to a {HP}.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeHeal(skill, "sacrifice", [parseInt(extra1)]);
			let hasHeal = false;
			for (var i in skill.heal) {
				if (i != "wish" && i != "sacrifice") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) makeHeal(skill, "default", [60]);
			return true;
		}
	},

	wish: {
		name: "Wish",
		desc: "_<Turns>_\nWill restore after <Turns> turns. _Negative values are not permitted._",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Turns>!");
			if (parseInt(extra1) <= 0) return message.channel.send("You can't wish for 0 or less!");
			makeHeal(skill, "wish", [parseInt(extra1)]);
			let hasHeal = false
			for (var i in skill.heal) {
				if (i != "sacrifice" && i != "wish") {
					hasHeal = true;
					break;
				}
			}
			if (!hasHeal) makeHeal(skill, "default", [60]);
			return true;
		}
	}
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeHeal(skill, extra, func) {
	if (!skill.heal) skill.heal = {};
	if (!skill.heal[extra]) skill.heal[extra] = [];

	skill.heal[extra][0] = func;
}

// Checks if the skill has an extra
// just realise we dont need this either
hasHealType = (skill, extra) => {
	if (!skill.heal) return false;
	if (!skill.heal[extra]) return false;
	return skill.heal[extra];
}

// Apply Extra Effects to an existing skill using the extrasList above.
applyHeal = (message, skill, skillExtra, extra1, extra2, extra3, extra4, extra5) => {
	if (!skill.heal) skill.heal = {};
	if (!skillExtra || !healList[skillExtra.toLowerCase()]) {
		message.channel.send("You're adding an invalid heal type! Use the ''listhealtypes'' command to list all extras.");
		return false;
	}

	if (!healList[skillExtra.toLowerCase()].applyfunc(message, skill, extra1, extra2, extra3, extra4, extra5)) {
		message.channel.send("Something went wrong!");
		return false;
	}
	
	skill.done = true;

	console.log("win")
	return true;
}

buildHeal = (message, args) => {
	let skill = {
		name: args[0],
		type: 'heal',
		cost: args[1],
		costtype: args[2],
		target: args[3],
		originalAuthor: message.author.id
	}

	applyHeal(message, skill, args[4].toLowerCase(), args[5], args[6], args[7], args[8], args[9])
	
	if (skill.done) {
		delete skill.done;
		return skill;
	} else {
		return false
	}
}
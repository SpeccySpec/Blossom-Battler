extrasList = {
	ohko: {
		name: "One Hit KO",
		desc: '_<Chance>_\nInstantly defeats the foe at a <Chance>% chance.',
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (parseFloat(extra1) < 0) return message.channel.send("What's the point of using this skill if it never lands?");

			makeExtra(skill, "ohko", [parseFloat(extra1)]);
		}
	},

	sacrifice: {
		name: "Sacrifice",
		desc: "Will reduce the caster's HP to a specified value.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "sacrifice", [parseInt(extra1)]);
		}
	},

	buff: {
		name: "Stat Buff",
		desc: "_<Foe/Caster> <Stat> <Stages> <Chance>_\nWill buff or debuff the foe's <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return mesasge.channel.send("You didn't supply anything for <Foe/Caster>!");
			if (!extra2) return mesasge.channel.send("You didn't supply anything for <Stat>!");
			if (!extra3) extra3 = '-1';
			if (!extra4) extra3 = '100';

			if (extra1.toLowerCase() != 'foe' && extra1.toLowerCase() != 'caster') return message.channel.send('Please enter either "foe" or "caster" for <Foe/Caster>!');

			makeExtra(skill, "buff", [extra1.toLowerCase(), extra2.toLowerCase(), parseInt(extra3), parseFloat(extra4)]);
		}
	},

	buff: {
		name: "Stat Buff",
		desc: "_<Foe/Caster> <Stat> <Stages> <Chance>_\nWill buff or debuff the foe's <Stat> at a <Chance>% chance. Positive values for <Stages> indicate a buff while negative values for <Stages> indicate a debuff.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <Foe/Caster>!");
			if (!extra2) return message.channel.send("You didn't supply anything for <Stat>!");
			if (!extra3) extra3 = '-1';
			if (!extra4) extra3 = '100';

			if (extra1.toLowerCase() != 'foe' && extra1.toLowerCase() != 'caster') return message.channel.send('Please enter either "foe" or "caster" for <Foe/Caster>!');

			makeExtra(skill, "buff", [extra1.toLowerCase(), extra2.toLowerCase(), parseInt(extra3), parseFloat(extra4)]);
		}
	},

	takemp: {
		name: "Take MP",
		desc: "_<MP>_\nWill take <MP> MP from the foe each hit.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "takemp", [parseInt(extra1)]);
		}
	},

	stealmp: {
		name: "Steal MP",
		desc: "Turns the skill into a skill that takes <Power> MP from the foe.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
//			if hasExtra(skill, "stealmp") return message.channel.send('This skill already steals MP from the foe.');
			if (skill.extras['stealmp']) return message.channel.send('This skill already steals MP from the foe.');
			makeExtra(skill, "stealmp", []);
		}
	},

	healverse: {
		name: "Healverse",
		desc: "_<Damage Percent> <Turns> <Deploy Message>_\nAfter the foe is hit with this skill, each hit done to it will heal <Damage Percent>% of damage dealt to the attacker. This lasts for <Turns> turns. You can add flair to this skill with a <Deploy Message>.",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			makeExtra(skill, "healverse", [parseFloat(extra1), parseInt(extra2), extra3]);
		}
	},
}

// Make an Extra for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeExtra(skill, extra, func) {
	if (!skill.extras) skill.extras = {};
	if (!skill.extras[extra]) skill.extras[extra] = [];

	skill.extras[extra].push(func);
}

// Checks if the skill has an extra
// just realise we dont need this
function hasExtra(skill, extra) {
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
	
	/* === OLD EXTRAS HERE FOR REFERENCE ===

	if (extra1 === 'powerverse') {
		skill.verse = ['power', parseInt(extra2)];
		skill.levelLock += 10;
	} else if (extra1 === 'spreadverse') {
		skill.verse = ['spread', parseInt(extra2)];
		skill.levelLock += 15;
	} else if (skill.type === 'mp' && extra1 === 'healmp')
		skill.healmp = true;
	else if (extra1 === 'steal') {
		skill.steal = parseInt(extra2);
		skill.levelLock += (extra1 === 'steal') ? 20 : 8;
	} else if (extra1 === 'powerbuff') {
		if (utilityFuncs.validStat(extra2))
			skill.powerbuff = [extra2.toLowerCase(), parseInt(extra3)];
	} else if (extra1 === 'multistatus') {
		if (skill.status && typeof skill.status === 'string')
			skill.status = [skill.status]
		else if (typeof skill.status === 'object')
			skill.status = [skill.status[0]]
		else
			skill.status = []

		if (utilityFuncs.validStatus(extra2)) skill.status.push(extra2);
		if (utilityFuncs.validStatus(extra3)) skill.status.push(extra3);
	} else if (extra1 === 'statcalc') {
		if (utilityFuncs.validStat(extra2.toLowerCase()))
			skill.statCalc = extra2.toLowerCase();
	} else if (extra1 === 'hpcalc' || extra1 === 'mpcalc' || extra1 === 'feint' || extra1 === 'rest' || extra1 === 'stealmp' || extra1 === 'lonewolf' || extra1 === 'heavenwrath') {
		skill[extra1] = true;
		
		if (extra1 === 'feint' || extra1 === 'stealmp')
			skill.levelLock = Math.min(99, skill.levelLock+15);
	} else if (extra1 === 'rollout') {
		skill.rollout = parseFloat(extra2);

		if (skill.rollout >= 75)
			skill.levelLock = Math.min(99, skill.levelLock+60);
		else if (skill.rollout >= 50)
			skill.levelLock = Math.min(99, skill.levelLock+45);
		else if (skill.rollout >= 25)
			skill.levelLock = Math.min(99, skill.levelLock+30);
		else
			skill.levelLock = Math.min(99, skill.levelLock+15);
	} else if (extra1 === 'forcetech') {
		if (utilityFuncs.validStatus(extra2)) {
			if (utilityFuncs.validStatus(extra3))
				skill.forceTech = [extra2, extra3];
			else
				skill.forceTech = [extra2];
		} else
			return false;
	// Verwex's Dual-Element Extra
	} else if (extra1 === 'dualelement' || extra1 === 'dualtype') {
		if (utilityFuncs.validType(extra2.toLowerCase()) && extra2.toLowerCase() != skill.type && extra2.toLowerCase() != 'passive' && extra2.toLowerCase() != 'status' && extra2.toLowerCase() != 'heal') {
			skill.type = [(typeof skill.type === 'object') ? skill.type[0] : skill.type, extra2.toLowerCase()];
		} else
			return false;
	} else if (extra1 === 'sustain' || extra1 === 'sustaindmg' || extra1 === 'susdmg') {
		skill.susDmg = true; // AMONGUS
	} else if (extra1 === 'reverse' || extra1 === 'reversedmg' || extra1 === 'revdmg') {
		skill.revDmg = true; // AMONGUS
	} else if (extra1 === 'powhit') {
		skill.powHits = [parseInt(extra2), extra3 ? parseInt(extra3) : null]
	} else
		return false;
	*/

	return true;
}

/*
function applyHealExtra(skill, extra1, extra2, extra3) {
	if (extra1 === 'sacrifice' || extra1 === 'healmp' || extra1 === 'regenerate' || extra1 === 'invigorate' || extra1 === 'statusheal' || extra1 === 'recarmdra' || extra1 === 'fullheal' || extra1 === 'wish')
		skill[extra1] = true;
	else
		return false;

	return true;
}
*/
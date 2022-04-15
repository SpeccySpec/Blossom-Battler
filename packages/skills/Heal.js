healList = {
	default: {
		name: "Default",
		desc: "_<HP>_\nThe default heal type. Restores HP by <HP>. _Negative values for <HP> will damage the target!_",
		applyfunc: function(message, skill, extra1, extra2, extra3, extra4, extra5) {
			if (!extra1) return message.channel.send("You didn't supply anything for <HP>!");
			makeHeal(skill, "default", [parseInt(extra1)]);
			return true;
		}
	}
}

// Make a status type for a skill. "func" should be an array of 1-5 values indicating what the extra does.
function makeHeal(skill, extra, func) {
	if (!skill.heal) skill.heal = {};
	if (!skill.heal[extra]) skill.heal[extra] = [];

	skill.heal[extra].push(func);
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
	
	/* === OLD EXTRAS HERE FOR REFERENCE ===

	if (statusType === 'status') {
		if (!utilityFuncs.validStatus(extra1)) return msg.channel.send(`${extra1} is an invalid status effect.`);

		skillFile[name].status = extra1.toLowerCase()
		skillFile[name].statuschance = parseInt(extra2)
		skillFile[name].levelLock = 10
	} else if (statusType === 'multistatus') {
		skillFile[name].status = []
		if (utilityFuncs.validStatus(extra1)) skillFile[name].status.push(extra1);
		if (utilityFuncs.validStatus(extra2)) skillFile[name].status.push(extra2);
		if (utilityFuncs.validStatus(extra3)) skillFile[name].status.push(extra3);
		
		if (skillFile[name].status.length <= 0)
			return msg.channel.send('All 3 status effects were invalid.');
		
		skillFile[name].levelLock = 25
	} else if (statusType === 'buff') {
		skillFile[name].buff = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].buffCount = parseInt(extra3)
		
		if (skillFile[name].buffCount <= 1) {
			delete skillFile[name].buffCount
			skillFile[name].levelLock = 10
		}

		if (skillFile[name].buffCount >= 6) {
			skillFile[name].buffCount = 6
			skillFile[name].levelLock = 60
		}
	} else if (statusType === 'debuff') {
		skillFile[name].debuff = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].levelLock = 10
	} else if (statusType === 'dualbuff' || statusType === 'dualdebuff') {
		skillFile[name][statusType] = [extra1.toLowerCase(), extra2.toLowerCase()];
		skillFile[name].target = extra3.toLowerCase();
		skillFile[name].levelLock = 40;
	} else if (statusType === 'mimic') {
		skillFile[name].mimic = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'clone' || statusType === 'harmonics') {
		skillFile[name].clone = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'shield') {
		skillFile[name].shield = extra1.toLowerCase()
		skillFile[name].target = extra2.toLowerCase()
		skillFile[name].levelLock = 25
	} else if (statusType === 'makarakarn' || statusType === 'tetrakarn') {
		skillFile[name][statusType] = true
		skillFile[name].target = extra1.toLowerCase()
		skillFile[name].levelLock = 40
	} else if (statusType === 'trap') {
		skillFile[name].trap = true
		skillFile[name].effect = [extra1.toLowerCase(), extra2.toLowerCase()]
		skillFile[name].levelLock = 30;

		if (extra1.toLowerCase() == "damage") {
			skillFile[name].effect[2] = parseInt(extra2);
			skillFile[name].levelLock = 40
		}
	} else if (statusType === 'weather')
		skillFile[name].weather = extra1.toLowerCase();
	else if (statusType === 'terrain')
		skillFile[name].terrain = extra1.toLowerCase();
	else if (statusType === 'reincarnate') {
		skillFile[name].reincarnate = true;
		skillFile[name].levelLock = 50;
	} else if (statusType === 'chaosstir' || statusType === 'chaos') {
		skillFile[name].chaosStir = true;
		skillFile[name].levelLock = 45;
	} else if (statusType === 'futuresight' || statusType === 'delayed' || statusType === 'future') {
		skillFile[name].futuresight = {
			pow: parseInt(extra1),
			acc: 90,
			type: extra2.toLowerCase(),
			atktype: "magic",
			turns: parseInt(extra3)
		};

		skillFile[name].levelLock = 50;
	} else
		return msg.channel.send('You inputted an invalid status type.');
	*/

	console.log("win")
	return true;
}

buildHeal = (message, args) => {
	let skill = {
		name: args[0],
		type: 'status',
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
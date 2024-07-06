let extratypes = ["extras", "statusses", "heal", "passive"];

setupSkills = (char) => {
	char.skills = objClone(char.oldskills);

	// MoveLink Extra
	let skill;
	let movelinks = [];
	for (let i in char.skills) {
		if (!skillFile[char.skills[i]]) continue;
		skill = skillFile[char.skills[i]];

		movelinks = [];
		for (let k in extratypes) {
			if (skill[extratypes[k]] && skill[extratypes[k]].movelink)
				for (let j in skill[extratypes[k]].movelink) movelinks.push(skill[extratypes[k]].movelink[j]);
		}

		for (let k in movelinks) {
			if (skillFile[movelinks[k]]) {
				// Just shadow add passives to our skill list.
				if (skillFile[movelinks[k]].type === "passive") {
					char.skills.push(movelinks[k]);
				}
			}
		}
	}

	// No running from simple beam
	if (char.custom?.simplebeam) {
		char.skills.push(char.custom.simplebeam[3]);
	}
}

setupBattleStats = (f) => {
	f.oldskills = objClone(f.skills);
	setupSkills(f);

	f.buffs = {
		atk: 0,
		mag: 0,
		end: 0,
		prc: 0,
		agl: 0,
		crit: 0,
	};

//	f.lbp = 0 -- goodbye days of starting with 0LB%. You will not be missed. rip bozo

	// ok... maybe we still need to make sure. especially coming from pre-LB buff.
	f.lbp ??= 0;

	// REMNANT OF THE PAST LIVE SESSION //
	//whats f btw
	// f = fighter
	// idk why it wasnt "c" for "char". ... if you say BTW
	// MY SCREEN MOVES WHEN YOU SCROLL THE MOUSE LOL
	//do not hange it good point sowwyyyy
	// theres no point youre wasting your time
	// nah its ok lmaoooo
	// LHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHA LMAOOOOOOOOOOOOOOOOO
	// imagine im just typing the suddenly EARTHQUAKEE
	// immediatly uses the scroll wheel /j this is very funny. lol
	// AHHAHAAH
	// earthquake
	//LOL
	// I WASNT AWARE THAT HAPPENED ILL
	// TRY TO USE THE SCROLL WHEEL LESS
	// the fact that i was moving over to use my scroll wheel.
	// lmaooo
	// END OF REMNANT //
	
	f.donetc = false;

	if (f.charms) {
		if (f.charms.includes("StalwartShell")) f.stats.end += 5;

		if (f.charms.includes("FragileHeart") || f.charms.includes("UnbreakableHeart")) {
			f.maxhp += 50; f.hp += 50;
		}
	}

	if (f.curweapon) {
		let boost = {
			atk: f.curweapon.atk ?? 0,
			mag: f.curweapon.mag ?? 0,
			end: f.curweapon.end ?? 0,
			agl: f.curweapon.agl ?? 0,
            prc: f.curweapon.prc ?? 0,
            luk: f.curweapon.luk ?? 0,
            chr: f.curweapon.chr ?? 0,
            int: f.curweapon.int ?? 0
		}
		for (let i in boost) {
			if (f.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			if (typeof(f.weaponclass) === 'object') boost[i] = Math.round(boost[i]*0.66666667);
			f.stats[i] += boost[i];
		}

		if (f.curweapon.skill) f.skills.push(f.curweapon.skill);
	}

	if (f.curarmor) {
		let boost = {
			atk: f.curarmor.atk ?? 0,
			mag: f.curarmor.mag ?? 0,
			end: f.curarmor.end ?? 0,
			agl: f.curarmor.agl ?? 0,
            prc: f.curarmor.prc ?? 0,
            luk: f.curarmor.luk ?? 0,
            chr: f.curarmor.chr ?? 0,
            int: f.curarmor.int ?? 0
		}
		for (let i in boost) {
			if (f.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			f.stats[i] += boost[i];

			// Wrong Armor Class Drawbacks
			if (f.armorclass === 'none' && f.curarmor.class) {
				if (f.curarmor.class === "light") {
					boost.end = Math.max(0, boost.end-Math.round(f.level/10));
				} else if (f.curarmor.class === "heavy") {
					boost.agl = Math.max(0, boost.agl-Math.round(f.level/8));
				} else if (f.curarmor.class === "magic") {
					boost.atk = Math.max(0, boost.atk-Math.round(f.level/10));
				}
			}
		}

		if (f.curarmor.skill) f.skills.push(f.curarmor.skill);
	}

	return true;
}

statWithBuff = (stat, buff, char) => {
	if (!buff || buff == 0) return stat;

	if (char.status && char.status == 'trisagion') {
		if (hasStatusAffinity(char, 'trisagion', 'weak') || isBoss(char)) {
			if (buff > 0) buff *= 2;
		} else if (hasStatusAffinity(char, 'trisagion', 'resist') ) {
			if (buff < 0) buff *= 2;
		} else {
			buff *= 2;
		}
	}

	return Math.round(stat + (buff*(stat/4.5)));
}

buffStat = (f, stat, amount, boosted) => {
	let statBuff = (stat ?? 'atk').toLowerCase();

	switch(statBuff) {
		case 'all':
			for (let stat of f.buffs) {
				stat += amount;

				console.log(boosted + stat)

				if (boosted || Math.abs(stat) == 4) 
					stat = Math.max(Math.min(stat, 4), -4);
				else 
					stat = Math.max(Math.min(stat, 3), -3);
			}

			if (f.status && f.status.toLowerCase() == 'brimstone') {
				for (let revStat of f.custom.revertBuffs) {
					let proceed = false;
		
					if (hasStatusAffinity(f, 'brimstone', 'weak')) {
						if (amount < 0) proceed = true;
					} else if (hasStatusAffinity(f, 'brimstone', 'resist') || isBoss(f)) {
						if (amount > 0) proceed = true;
					} else {
						proceed = true;
					}
		
					if (proceed) {
						revStat += amount*-1;
			
						if (boosted || Math.abs(revStat) == 4) 
							revStat = Math.max(Math.min(revStat, 4), -4);
						else 
							revStat = Math.max(Math.min(revStat, 3), -3);
					}
				}
			}
			break;

		default:
			f.buffs[statBuff] += amount;

			console.log(boosted + f.buffs[statBuff])

			if (boosted || Math.abs(f.buffs[statBuff]) == 4) 
				f.buffs[statBuff] = Math.max(Math.min(f.buffs[statBuff], 4), -4);
			else 
				f.buffs[statBuff] = Math.max(Math.min(f.buffs[statBuff], 3), -3);

			if (f.status && f.status.toLowerCase() == 'brimstone') {
				let proceed = false;

				if (hasStatusAffinity(f, 'brimstone', 'weak')) {
					if (amount < 0) proceed = true;
				} else if (hasStatusAffinity(f, 'brimstone', 'resist') || isBoss(f)) {
					if (amount > 0) proceed = true;
				} else {
					proceed = true;
				}

				if (proceed) {
					f.custom.revertBuffs[statBuff] += amount*-1;

					if (boosted || Math.abs(f.custom.revertBuffs[statBuff]) == 4) 
						f.custom.revertBuffs[statBuff] = Math.max(Math.min(f.custom.revertBuffs[statBuff], 4), -4);
					else 
						f.custom.revertBuffs[statBuff] = Math.max(Math.min(f.custom.revertBuffs[statBuff], 3), -3);
				}
			}
	}
}

inflictStatus = (char, status, notxt) => {
	if (!status) return '';

	// Spectra is very fucking stupid, so she's going to replace common errors with the ID of the status that SHE wrote originaly.
	if (status.toLowerCase() === 'paralysis' || status.toLowerCase() === 'paralyse') status = 'paralyze';
	if (status.toLowerCase() === 'poison') status = 'toxin';

	// Doesn't exist? Let's ignore this, then.
	if (!statusEffectFuncs[status.toLowerCase()]) return '';

	// Don't Grassimp Bosses.
	if (status == "grassimped" && char.boss) return;

	// Do we block this status?
	if (hasStatusAffinity(char, status.toLowerCase(), 'block')) return '';

	// Do we have blessed?
	if (char.blessed && !isPositiveStatus(status)) return '';
	if (char.cursed && (isPositiveStatus(status) || isNeutralStatus(status))) return '';
	if (char.neutralized && !isNeutralStatus(status)) return '';

	// Inflict the status.
	let statusfuncs = statusEffectFuncs[status.toLowerCase()];
	if (statusfuncs.stackable) {
		if (char[status.toLowerCase()]) return ''; // don't overwrite an existing instance of this status.

		char[status.toLowerCase()] = statusfuncs.forceturns ?? 3;
	} else {
		char.status = status.toLowerCase();
		char.statusturns = statusfuncs.forceturns ?? 3;
	}

	//remove opposites of the newly inflicted status
	if (statusfuncs.opposite) {
		for (i of statusfuncs.opposite) {
			if (char[i]) {
				if (statusfuncs.onremove) statusfuncs.onremove(char);
				delete char[i];
			}
		}
	}

	// OnInflict status hook
	if (statusfuncs.oninflict) statusfuncs.oninflict(char);

	// Unstabled's stabilization with a non-stackable status effect
	if (char.unstable && !statusfuncs.stackable) {
		char.statusturns += char.unstable;
		killVar(char, 'unstable');
		delete char.unstable;
	}

	// Status text.
	return notxt ? '' : `${char.name} was inflicted with ${statusEmojis[status]}${statusNames[status]}!`;
}

getCharFromId = (ID, btl) => {
	for (const i in btl.teams) {
		for (const k in btl.teams[i].members) {
			if (!isNaN(btl.teams[i].members[k]?.id) && btl.teams[i].members[k].id == ID) return btl.teams[i].members[k];
		}

		// If they're in backup then return "backup"
		for (const k in btl.teams[i].backup) {
			if (!isNaN(btl.teams[i].backup[k]?.id) && btl.teams[i].backup[k].id == ID) return "backup";
		}
	}

	return btl.teams[0].members[0];
}

nextAvaliableId = (btl) => {
	let id = 0;
	for (const i in btl.teams) {
		id += btl.teams[i].members.length;
	}

	return id;
}

resetEffects = (char) => {
	if (char.ragesoul) delete char.ragesoul;

	if (char.custom?.orgiamode) {
		char.stats = objClone(char.custom.orgiamode.revert);
		killVar(char, 'orgiamode');
	}

	if (char.custom?.revert) {
		if (char.mimic) delete char.mimic;

		for (let i in char.custom.revert[1]) {
			if (char[i]) char[i] = char.custom.revert[1][i];
		}

		killVar(char, 'revert');
	}
}

isBlessed = (char, btl) => {
	if (char.hp < 0) return false;
	if (char.enemyextras?.blessed) return false;

	for (let targ of btl.teams[char.team].members) {
		if (targ.enemyextras?.blessed && targ.hp > 0) return true;
	}

	return false;
}
equipWeapon = (char, id, btl) => {
    if (!char.weapons || !char.weapons[id]) return;
    setupSkills(char);

    if (char.curweapon) {
        let oldweapon = objClone(char.curweapon);
        char.weapons[char.curweapon.name ?? `weapon${char.weapons.length}`] = oldweapon;
    }

    updateStats(char, btl.guild.id);
    char.curweapon = objClone(char.weapons[id]);
    delete char.weapons[id];

    if (char.curweapon) {
		let boost = {
			atk: char.curweapon.atk ?? 0,
			mag: char.curweapon.mag ?? 0,
			end: char.curweapon.end ?? 0,
			agl: char.curweapon.agl ?? 0,
            prc: char.curweapon.prc ?? 0,
            luk: char.curweapon.luk ?? 0,
            chr: char.curweapon.chr ?? 0,
            int: char.curweapon.int ?? 0,
		}
		for (let i in boost) {
			if (char.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			if (typeof(char.weaponclass) === 'object') boost[i] = Math.round(boost[i]*0.66666667);
			char.stats[i] += boost[i];
		}

		if (char.curweapon.skill) char.skills.push(char.curweapon.skill);
	}
}

equipArmor = (char, id, btl) => {
    if (!char.armors || !char.armors[id]) return;
    setupSkills(char);

    if (char.curarmor) {
        let oldarmor = objClone(char.curarmor);
        char.armors[char.curarmor.name ?? `armor${char.armors.length}`] = oldarmor;
    }

    updateStats(char, btl.guild.id);
    char.curarmor = objClone(char.armors[id]);
    delete char.armors[id];

    if (char.curarmor) {
		let boost = {
			atk: char.curarmor.atk ?? 0,
			mag: char.curarmor.mag ?? 0,
			end: char.curarmor.end ?? 0,
			agl: char.curarmor.agl ?? 0,
            prc: char.curarmor.prc ?? 0,
            luk: char.curarmor.luk ?? 0,
            chr: char.curarmor.chr ?? 0,
            int: char.curarmor.int ?? 0,
		}
		for (let i in boost) {
			if (char.basestats[i] > 7) boost[i] = Math.round(boost[i]*0.75);
			if (typeof(char.armorclass) === 'object') boost[i] = Math.round(boost[i]*0.5);
			char.stats[i] += boost[i];
		}

		if (char.curarmor.skill) char.skills.push(char.curarmor.skill);
	}
}

unequipWeapon = (char, btl) => {
    if (!char.curweapon) return;
    setupSkills(char);

    if (!char.weapons) char.weapons = {}
    let oldweapon = objClone(char.curweapon);
    char.weapons[char.curweapon.name ?? `weapon${char.weapons.length}`] = oldweapon;
    updateStats(char, btl.guild.id);
}

unequipArmor = (char, btl) => {
    if (!char.curweapon) return;
    setupSkills(char);

    if (!char.weapons) char.weapons = {}
    let oldweapon = objClone(char.curweapon);
    char.weapons[char.curweapon.name ?? `weapon${char.weapons.length}`] = oldweapon;
    updateStats(char, btl.guild.id);
}
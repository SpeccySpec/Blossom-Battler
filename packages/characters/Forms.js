createForm = (char, args) => {
    let formData = {
        name: args[1],
        mainElement: args[2].toLowerCase(),
        desc: args[13],

        hp: parseInt(args[3]),
        mp: parseInt(args[4]),

        stats: {
            atk: parseInt(args[5]),
            mag: parseInt(args[6]),
            prc: parseInt(args[7]),
            end: parseInt(args[8]),
            chr: parseInt(args[9]),
            int: parseInt(args[10]),
            agl: parseInt(args[11]),
            luk: parseInt(args[12]),
        },

		melee: char.melee,
        skills: char.skills,
        quotes: char.quotes,
        affinities: char.affinities,
		autolearn: char.autolearn,
    }

    return formData;
}

modForm = (char, formName, server) => {
	let settings = setUpFile(`${dataPath}/json/${server}/settings.json`);
    let origForm = char.forms[formName];
    let form = objClone(char.forms[formName]);

	if (origForm.hp > 1) {
		let END = origForm.stats.end;
		form.hp = Math.floor(origForm.hp + ((origForm.hp/10)*(char.level-1)) + ((END/2)*(char.level-1)));
	}

	if (origForm.mp > 1) {
		let INT = origForm.stats.int;
		form.mp = Math.floor(origForm.mp + ((origForm.mp/10)*(char.level-1)) + ((INT/2)*(char.level-1)));
	}

	if (settings.formulas && settings.formulas.levelUpFormula && settings.formulas.levelUpFormula === 'percent') {
		for (const i in stats) {
			let baseStat = origForm.stats[stats[i]];
			form.stats[stats[i]] = Math.min(99, Math.round(baseStat * (1 + ((char.level-1) * 0.091))));
		}
	} else if (settings.formulas && settings.formulas.levelUpFormula && settings.formulas.levelUpFormula === 'assist') {
		for (const i in stats) {
			let baseStat = origForm.stats[stats[i]];
			form.stats[stats[i]] = Math.min(99, Math.round((baseStat+3) * (1 + ((char.level-1) * 0.06751))))
		}
	} else {
		for (const stat of stats) form.stats[stat] = origForm.stats[stat];

		let highestStats = [
			["atk", origForm.stats.atk],
			["mag", origForm.stats.mag],
			["prc", origForm.stats.prc],
			["end", origForm.stats.end],
			["chr", origForm.stats.chr],
			["int", origForm.stats.int],
			["agl", origForm.stats.agl],
			["luk", origForm.stats.luk]
		];

		highestStats.sort(function(a, b) {return  a[1] - b[1]})

		for (let i in highestStats) {
			if (i > highestStats.length-4)
				form.stats[highestStats[i][0]] += (char.level-1);
			else if (i <= 1) {
				form.stats[highestStats[i][0]] += (char.level-1)/3;
			} else {
				form.stats[highestStats[i][0]] += (char.level-1)/2;
			}

			form.stats[highestStats[i][0]] = Math.round(Math.min(settings.caps.statcap, form.stats[highestStats[i][0]]));
		}
	}

    return form
}

formDesc = (char, formName, modStats, message) => {
	let settings = setUpSettings(message.guild.id);

    let form = modStats ? modForm(char, formName, message.guild.id) : char.forms[formName];
    let prefix = elementEmoji[form.mainElement] ?? elementEmoji.strike;
    let color = elementColors[form.mainElement] ?? elementColors.strike;

    if (typeof form.mainElement === "object") {
        prefix = "";
        for (let i in form.mainElement)
            prefix += elementEmoji[form.mainElement[i]] ?? elementEmoji.strike;

        color = elementColors[form.mainElement[0]] ?? elementColors.strike;
    }

    let prefix2 = elementEmoji[char.mainElement] ?? elementEmoji.strike;
    if (typeof char.mainElement === "object") {
        prefix2 = "";
        for (let i in char.mainElement)
            prefix2 += elementEmoji[char.mainElement[i]] ?? elementEmoji.strike;
    }

    let statDesc = ''
    if (!char.type)
        statDesc += `${form.hp}HP\n${form.mp}${char.mpMeter ? char.mpMeter[1] : "MP"}\n`;
    else
        statDesc += `${form.hp}HP\n${form.mp}${char.mpMeter ? char.mpMeter[1] : "MP"}\n${char.xp}XP\n`;

    let DiscordEmbed = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(`${prefix2}__${char.name}__'s _${prefix}${form.name}_`)
        .setDescription(`${statDesc}\n_${form.desc}_`)
        .addFields()

    statDesc = '';
    for (const i in form.stats) {
        statDesc += `\n${form.stats[i]}${i.toUpperCase()} _(${char.forms[formName].stats[i]} Base)_`

		if (char.curweapon && char.curweapon[i])
			statDesc += ` **${(char.curweapon[i] > 0) ? '+' : '-'}${Math.abs(char.curweapon[i])}${i.toUpperCase()}**`;
		if (char.curarmor && char.curarmor[i])
			statDesc += ` **${(char.curarmor[i] > 0) ? '+' : '-'}${Math.abs(char.curarmor[i])}${i.toUpperCase()}**`;
    }

	DiscordEmbed.fields.push({ name: 'Stats', value: statDesc, inline: true });

    // Skills
	let skillDesc = '';
	if (form.melee) {
		skillDesc += `**Melee Attack**:\n`

		if (form.melee.type) {
			if (char.curweapon && char.curweapon.element) {
				skillDesc += `${classEmoji.weapon[char.curweapon.class ?? 'none']}${elementEmoji[char.curweapon.element ?? 'strike']}`;
			} else {
				skillDesc += elementEmoji[form.melee.type];
			}
		}

		skillDesc += `${form.melee.name}\n`;

		if (char.curweapon && char.curweapon.melee)
			skillDesc += `_${form.melee.pow+char.level}**+${char.curweapon.melee}**<:physical:973077052129423411>`;
		else
			skillDesc += `_${form.melee.pow+char.level}<:physical:973077052129423411>`;

		skillDesc += `, ${form.melee.acc}% Accuracy,\n${form.melee.crit}%${critEmoji}`;
		if (form.melee.status && form.melee.statuschance) skillDesc += `, ${form.melee.statuschance}%${statusEmojis[form.melee.status]}`;
		skillDesc += '_\n\n';
	}

	if (form.skills && form.skills.length > 0) {
		skillDesc += '**Skills**:\n';

		for (const i in form.skills) {
			let skill = form.skills[i];

			if (!skillFile[skill]) {
				skillDesc += `🛑 Invalid Skill (${skill})\n`;
			} else {
				let type = typeof skillFile[skill].type == 'object' ? elementEmoji[skillFile[skill].type[0]] : elementEmoji[skillFile[skill].type];
				skillDesc += `${type}${skillFile[skill].name}`;
				if (form.autolearn && form.autolearn[i]) skillDesc += ' <:tick:973077052372701294>';
				skillDesc += `\n`;
			}
		}
	}

	// Fix skills n shit
	if (skillDesc.length > 1000) skillDesc = `${skillDesc.slice(0, 1000)}_..._`;
    if (skillDesc.length > 0) DiscordEmbed.fields.push({ name: 'Skills', value: skillDesc, inline: true });

	// Affinities
	DiscordEmbed = renderAffinities(true, form, DiscordEmbed, settings, message, message.guild.id);

    return DiscordEmbed
}

formChange = (char, form, btl) => {
	if (char.origform) {
		char.melee = char.origform.melee;
		char.stats = char.origform.stats;
		char.affinities = char.origform.affinities;
		char.quotes = char.origform.quotes;
		char.skills = char.origform.skills;
		char.maxhp = char.origform.hp;
		char.maxmp = char.origform.mp;
		delete char.origform;
	}

	if (form === "normal") {
		if (char.curform) delete char.curform;
		if (char.hp > char.maxhp) char.hp = char.maxhp;
		if (char.mp > char.maxmp) char.mp = char.maxmp;
		return true;
	}

	char.curform = form;
	char.origform = {
		hp: char.maxhp,
		mp: char.maxmp,
		melee: char.melee,
		stats: char.stats,
		affinities: char.affinities,
		quotes: char.quotes,
		skills: char.skills,
	}

	if (!char.forms || !char.forms[form]) return;

	let formData = objClone(modForm(char, form, btl.guild.id));
	char.maxhp = formData.hp;
	char.maxmp = formData.mp;
	char.melee = formData.melee;
	char.stats = formData.stats;
	char.quotes = formData.quotes;
	char.skills = formData.skills;
	char.affinities = formData.affinities;
	if (char.hp > char.maxhp) char.hp = char.maxhp;
	if (char.mp > char.maxmp) char.mp = char.maxmp;
	return true;
}
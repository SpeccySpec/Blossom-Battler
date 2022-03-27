//FS, for writing files.
const fs = require('fs');

// Path to 'data' folder
const dataPath = './data'

// Determine the Damage that this move will deal.
function genDmg(userAtk, targDef, userDefs, targDefs) {
	var itemPath = dataPath+'/items.json'
    var itemRead = fs.readFileSync(itemPath);
    var itemFile = JSON.parse(itemRead);
	
	const userWeapon = itemFile[userDefs.weapon] ? itemFile[userDefs.weapon] : itemFile["none"]
	const oppWeapon = itemFile[targDefs.weapon] ? itemFile[targDefs.weapon] : itemFile["none"]

	var atkStat = userAtk*1.5 + (userWeapon.atk ? userWeapon.atk : 0) + ((userDefs.atk/10)*userDefs.buffs.atk)
	var defStat = targDef*1.5 + (oppWeapon.end ? oppWeapon.end : 0) + ((targDefs.def/10)*targDefs.buffs.def)
	var def = atkStat / defStat;

    return Math.round((((2*20)/5+2)*atkStat*def)/50+2)
}

function genRelicFighter(name, id, atk, mag, def) {
	var relicBattler = {}
	if (!id) {
		relicBattler = {
			name: name,
			bot: true,
			hp: 50,
			atk: atk,
			mag: mag,
			def: def,
			move: '',
			weapon: '',
			guard: false,
			buffs: {
				atk: 0,
				mag: 0,
				def: 0
			}
		}
	} else {
		relicBattler = {
			name: name,
			id: id,
			hp: 50,
			atk: atk,
			mag: mag,
			def: def,
			move: '',
			weapon: '',
			guard: false,
			buffs: {
				atk: 0,
				mag: 0,
				def: 0
			}
		}
	}
	
	return relicBattler
}

// Attack Foe
function attackState(relicFight, key) {
	var physTxt = [
		'PLAYER attacks with their knee',
		"PLAYER's fists strike the foes.",
		'PLAYER uses sheer force.'
	]

	var magTxt = [
		'PLAYER casts Flare!',
		'PLAYER casts Frost!',
		'PLAYER casts Aqua!',
		'PLAYER attacks!',
		'PLAYER simply glares at the foes.'
	]

	var txt = ''
	for (const i in relicFight[key].fighters) {
		var charDefs = relicFight[key].fighters[i]
		if (charDefs.move === "phys") {
			var addTxt = physTxt[Math.floor(Math.random() * physTxt.length-1)] + '\n'
			txt += addTxt.replace('PLAYER', `**${charDefs.name}**`)

			for (const k in relicFight[key].fighters) {
				if (k != i) {
					var dmg = genDmg(charDefs.atk, relicFight[key].fighters[k].def, charDefs, relicFight[key].fighters[k])

					dmg = Math.round(dmg)
					if (relicFight[key].fighters[k].guard)
						dmg = Math.round(dmg / 6);

					relicFight[key].fighters[k].hp = Math.round(relicFight[key].fighters[k].hp - dmg)
					txt += `${relicFight[key].fighters[k].name} (👊 **${dmg}**) `
					if (relicFight[key].fighters[k].hp <= 0)
						txt += '(💀)';
					txt += '\n'
				}
			}
		} else if (relicFight[key].fighters[i].move === "mag") {
			var addTxt = magTxt[Math.floor(Math.random() * magTxt.length-1)] + '\n'
			txt += addTxt.replace('PLAYER', `**${charDefs.name}**`)

			for (const k in relicFight[key].fighters) {
				if (k != i) {
					var dmg = genDmg(charDefs.mag, relicFight[key].fighters[k].def, charDefs, relicFight[key].fighters[k])

					dmg = Math.round(dmg)
					if (relicFight[key].fighters[k].guard)
						dmg = Math.round(dmg / 6);

					relicFight[key].fighters[k].hp = Math.round(relicFight[key].fighters[k].hp - dmg)
					txt += `${relicFight[key].fighters[k].name} (✨ **${dmg}**) `
					if (relicFight[key].fighters[k].hp <= 0)
						txt += '(💀)';
					txt += '\n'
				}
			}
		}

		txt += '\n'
		relicFight[key].fighters[i].move = null
	}

	return txt
}

// Export Functions
module.exports = {
	atkState: function (rb, i) {
		return attackState(rb, i)
	},
	
	genChar: function(name, id, atk, def, mag) {
		return genRelicFighter(name, id, atk, def, mag)
	}
}
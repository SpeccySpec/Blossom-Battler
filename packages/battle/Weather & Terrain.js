weatherFuncs = {
	rain: {
		onturn(char, btl) {
			let txt = '';

			if (char.status && char.status === 'burn') {
				delete char.status;
				delete char.statusturns;
				txt += `__${char.name}__ is put out by the **Rain**!`;
			}

			txt += `\n\n${inflictStatus(char, "wet")}`;

			if (txt.trim() == '') txt = null;
			return txt;
		},
		onselect(char, skill, btl) {
			if (skill.type === "water") {
				skill.pow *= 1.3;
			} else if (skill.type === "fire") {
				skill.pow *= 0.7;
			}
		}
	},

	thunderstorm: {
		onselect(char, skill, btl) {
			if (skill.type === "electric") {
				skill.pow *= 1.3;
			} else if (skill.type === "water") {
				skill.type = ["water", "electric"];
				skill.pow *= 1.1;
			}

			if (skill.status && typeof(skill.status) === "string" && skill.status === "paralyze" && skill.statuschance) {
				skill.statuschance *= 1.25;
			}
		}
	},

	sunlight: {
		onselect(char, skill, btl) {
			if (skill.type === "fire") {
				skill.pow *= 1.3;
			} else if (skill.type === "nuclear") {
				skill.pow *= 1.1;
			} else if (skill.type === "water" || skill.type === "grass") {
				skill.pow *= 0.7;
			}
		},
		onturn(char, btl) {
			let txt = inflictStatus(char, "overheat");

			if (txt.trim() == '') txt = null;
			return txt
		},
	},

	windy: {
		onselect(char, skill, btl) {
			if (skill.type === "wind") {
				skill.pow *= 1.3;
			}

			if (skill.atktype === "physical" && typeof(skill.type) === "string" && skill.type != "wind") {
				skill.type = [skill.type, "wind"];
			}
		}
	},

	sandstorm: {
		statmod(char, stats, btl) {
			if (!isMainElement("earth", char))
				stats.prc *= 2/3;

			return stats;
		},
		onturn(char, btl) {
			let txt = inflictStatus(char, "dry");

			if (txt.trim() == '') txt = null;
			return txt
		},
	},

	hail: {
		onturn(char, btl) {
			let txt = '';

			if (!isMainElement("ice", char)) {
				let dmg = 10;
				let affinity = '';

				let ignore = false;

				if (char.affinities.weak && char.affinities.weak.includes("ice")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak && char.affinities.superweak.includes("ice")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.deadly && char.affinities.deadly.includes("ice")) {
					dmg *= 8;
					affinity = affinityEmoji.deadly;
				} else if (char.affinities.resist && char.affinities.resist.includes("ice")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if ((char.affinities.block && char.affinities.block.includes("ice")) || (char.affinities.repel && char.affinities.repel.includes("ice"))) {
					txt += `__${char.name}__ is able to negate the hail damage.`;
					ignore = true;
				} else if (char.affinities.drain && char.affinities.drain.includes("ice")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					txt += `The __Hail__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
					ignore = true;
				}

				if (!ignore) {
					char.hp = Math.max(0, char.hp-dmg);

					if (char.hp <= 0) {
						txt += `__${char.name}__ was ___defeated${affinity}___ by the __Hail__!\n${selectQuote(char, 'death', null)}`;
					} else {
						txt += `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Hail__!`;
						txt += `\n\n${inflictStatus(char, "chilled")}`;
					}
				}
			}

			if (txt.trim() == '') txt = null;
			return txt;
		}
	},

	darkmoon: {
		onselect(char, skill, btl) {
			if (skill.type === "psychic") {
				skill.pow *= 1.1;
			} else {
				skill.pow *= 0.9;
			}
		},
		onturn(char, btl) {
			if (!isMainElement("psychic", char) && !isMainElement("spirit", char)) {
				if (!char.confusion && randNum(1, 100) <= 33) {
					char.confusion = 3;
					return `__${char.name}__ is confused by the aura of the **Dark Moon**...`;
				}
			}

			return null;
		}
	},

	eclipse: {
		onselect(char, skill, btl) {
			if (!["strike", "slash", "pierce"].includes(skill.type)) {
				skill.pow *= 1.1;
			}
		},
	},

	bloodmoon: {
		onselect(char, skill, btl) {
			if (skill.type === "curse") {
				skill.pow *= 1.4;
			} else if (["strike", "slash", "pierce"].includes(skill.type)) {
				skill.pow *= 1.2;
			}
		},
		statmod(char, stats, btl) {
			if (isMainElement("bless", char))
				stats.mag *= 3/4;

			return stats;
		}
	},

	blizzard: {
		onturn(char, btl) {
			if (char.status && char.status === 'burn') {
				delete char.status;
				delete char.statusturns;
				return `__${char.name}__ is put out by the **Blizzard**!`;
			}

			return null;
		},
		onselect(char, skill, btl) {
			if (skill.type === "ice") {
				skill.pow *= 1.5;
			} else if (skill.type === "fire") {
				skill.pow /= 2;
			}

			if (skill.status && typeof(skill.status) === "string" && skill.status === "freeze" && skill.statuschance) {
				skill.statuschance *= 1.25;
			}
		}
	},

	supermoon: {
		onselect(char, skill, btl) {
			if (["psychic", "bless", "curse", "spirit"].includes(skill.type)) {
				skill.pow *= 1.2;
			}

			skill.acc -= 15;
		},
		statmod(char, stats, btl) {
			stats.luk *= 1.15;
			return stats;
		}
	},

	bluemoon: {
		dmgmod(char, dmg, skill, btl, isTarget) {
			if (!isTarget && skill.type == 'spirit') {
				dmg *= 1.2;
			}
			return dmg;
		},
		statmod(char, stats, btl) {
			if (isMainElement("spirit", char))
				stats.mag *= 1.1;

			return stats;
		}
	},

	fallingash: {
		onturn(char, btl) {
			let txt = '';
			if (randNum(1, 100) <= 20) txt = inflictStatus(char, "burn");

			if (txt.trim() == '') txt = null;
			return txt
		},
	},

	acidrain: {
		onturn(char, btl) {
			let txt = '';

			if (!isMainElement("acid", char)) {
				let dmg = 10;
				let affinity = '';

				let ignore = false;

				if (char.affinities.weak && char.affinities.weak.includes("acid")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak && char.affinities.superweak.includes("acid")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.deadly && char.affinities.deadly.includes("acid")) {
					dmg *= 8;
					affinity = affinityEmoji.deadly;
				} else if (char.affinities.resist && char.affinities.resist.includes("acid")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if ((char.affinities.block && char.affinities.block.includes("acid")) || (char.affinities.repel && char.affinities.repel.includes("acid"))) {
					txt += `__${char.name}__ is able to negate the acid rain damage.`;
					ignore = true;
				} else if (char.affinities.drain && char.affinities.drain.includes("acid")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					txt += `The __Acid Rain__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
					ignore = true;
				}

				if (!ignore) {
					char.hp = Math.max(0, char.hp-dmg);

					if (char.hp <= 0) {
						txt += `__${char.name}__ was ___defeated${affinity}___ by the __Acid Rain__!\n${selectQuote(char, 'death', null)}`;
					} else {
						txt += `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Acid Rain__!`;
						if (randNum(1, 100) <= 10) txt += `\n\n${inflictStatus(char, "dissolved")}`;
					}
				}
			}

			if (txt.trim() == '') txt = null;
			return txt;
		}
	},

	radiation: {
		onturn(char, btl) {
			let txt = '';

			txt += extrasList.buff.buffChange(char, char, {type: 'almighty'}, btl, ["target", "random", -1, 100], null);
			if (randNum(1, 100) <= 10) txt += `\n\n${inflictStatus(char, "irradiation")}`;

			if (txt.trim() == '') txt = null;
			return txt;
		}
	},

	earthquake: {
		onselect(char, skill, btl) {
			if (skill.type === "earth") {
				skill.pow *= 1.3;
			}
		},
		onturn(char, btl) {
			let txt = '';

			if (randNum(1, 100) <= 10) txt += `${inflictStatus(char, "stagger")}`;

			if (txt.trim() == '') txt = null;
			return txt;
		}
	},

	smog: {
		statmod(char, stats, btl) {
			if (randNum(1, 100) <= 40)
				stats.prc *= 0.7;

			return stats;
		},
		onturn(char, btl) {
			let txt = '';

			if (randNum(1, 100) <= 20) txt += `${inflictStatus(char, "shrouded")}`;

			if (txt.trim() == '') txt = null;
			return txt;
		}
	},

	airstrikes: {
		onturn(char, btl) {
			let txt = '';

			let dmg = randNum(8, 17);
			let affinity = '';

			let possible = [];
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k]);
			}
			let f = possible[randNum(possible.length-1)];

			if (f.affinities.weak && f.affinities.weak.includes("explode")) {
				dmg *= 2;
				affinity = affinityEmoji.weak;
			} else if (f.affinities.superweak && f.affinities.superweak.includes("explode")) {
				dmg *= 4;
				affinity = affinityEmoji.superweak;
			} else if (f.affinities.deadly && f.affinities.deadly.includes("explode")) {
				dmg *= 8;
				affinity = affinityEmoji.deadly;
			} else if (f.affinities.resist && f.affinities.resist.includes("explode")) {
				dmg *= 0.5;
				affinity = affinityEmoji.resist;
			} else if ((f.affinities.block && f.affinities.block.includes("explode")) || (f.affinities.repel && f.affinities.repel.includes("explode"))) {
				return `__${f.name}__ is able to negate the air strike's explode damage.`;
			} else if (f.affinities.drain && f.affinities.drain.includes("explode")) {
				f.hp = Math.min(f.maxhp, f.hp+dmg);
				return `The __Air Strike__ heals __${f.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
			}

			f.hp = Math.max(0, f.hp-dmg);

			if (f.hp <= 0) {
				txt += `__${f.name}__ was ___defeated${affinity}___ by the __Air Strike__!\n${selectQuote(f, 'death', null)}`;
			} else {
				txt += `__${f.name}__ took ___${dmg}${affinity}___ damage from the __Air Strike__!`;
			}

			return txt;
		}
	},

	cherryblossoms: {
		onturn(char, btl) {
			let txt = '';

			let possible = [];
			for (let i in btl.teams) {
				for (let k in btl.teams[i].members)
					if (btl.teams[i].members[k].hp > 0) possible.push(btl.teams[i].members[k]);
			}
			let f = possible[randNum(possible.length-1)];

			txt += `${inflictStatus(f, "blessed")}`

			if (txt.trim() == '') txt = null;
			return txt;
		},
		statmod(char, stats, btl) {
			if (randNum(1, 100) <= 30)
				stats.luk *= 1.25;

			return stats;
		},
	}
}

terrainFuncs = {
	flaming: {
		onturn(char, btl) {
			let txt = '';
			if (char.status && char.status === "freeze") {
				delete char.status;
				delete char.statusturns;
				txt += `${char.name} is thawed out by the __Flaming Terrain__!\n`;
			}

			if (!isMainElement("fire", char)) {
				let dmg = randNum(8, 17);
				let affinity = '';

				if (char.affinities.weak.includes("fire")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak && char.affinities.superweak.includes("fire")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.deadly && char.affinities.deadly.includes("fire")) {
					dmg *= 8;
					affinity = affinityEmoji.deadly;
				} else if (char.affinities.resist && char.affinities.resist.includes("fire")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if ((char.affinities.block && char.affinities.block.includes("fire")) || (char.affinities.repel && char.affinities.repel.includes("fire"))) {
					return `__${char.name}__ is able to negate the flaming terrain's damage.`;
				} else if (char.affinities.drain.includes("fire")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					return `The __Flaming Terrain__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
				}

				char.hp = Math.max(0, char.hp-dmg);

				if (char.hp <= 0) {
					txt += `__${char.name}__ took ___${dmg}${affinity}___ damage and was defeated by the __Flaming Terrain__!\n${selectQuote(char, 'death', null)}`;
				} else {
					txt += `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Flaming Terrain__!`;
					if (randNum(1, 100) <= 10) txt += `\n${inflictStatus(char, "burn")}`;
				}
			}

			return txt;
		}
	},

	grassy: {
		onturn(char, btl) {
			let heal = (isMainElement("grass", char)) ? char.maxhp*0.17 : char.maxhp*0.1;
			char.hp = Math.min(char.maxhp, char.hp+heal);

			if (char.hp >= char.maxhp) {
				return `__${char.name}__ was fully restored by the __Grassy Terrain__!`;
			} else {
				return `__${char.name}__'s HP was restored by ${heal} due to the __Grassy Terrain__!`;
			}
		}
	},

	light: {
		onselect(char, skill, btl) {
			if (skill.type === "bless") {
				skill.pow *= 1.3;
			} else if (skill.type === "curse") {
				skill.pow *= 0.5;
			}
		}
	},

	dark: {
		onselect(char, skill, btl) {
			if (skill.type === "curse") {
				skill.pow *= 1.3;
			} else if (skill.type === "bless") {
				skill.pow *= 0.5;
			}
		}
	},

	psychic: {
		hardcoded: true
	},

	misty: {
		onturn(char, btl) {
			if (char.status) {
				delete char.status;
				delete char.statusturns;
				return `${char.name}'s status was removed by the __Misty Terrain__!\n`;
			}

			return null;
		},
		onselect(char, skill, btl) {
			if (skill.status) delete skill.status;
			if (skill.statuschance) delete skill.statuschance;
		}
	},

	sky: {
		statmod(char, stats, btl) {
			if (isMainElement("wind", char)) {
				stats.agl *= 1.4;
			} else {
				stats.agl *= 1.25;
			}

			return stats;
		},
		onselect(char, skill, btl) {
			if (skill.type === "wind") {
				skill.pow *= 1.2;
			} else if (skill.type === "earth") {
				skill.pow *= 0.9;
			}
		}
	},

	underground: {
		onselect(char, skill, btl) {
			if (skill.type === "earth") {
				skill.pow *= 1.5;
			} else if (skill.type === "wind" || skill.type === "grass") {
				skill.pow *= 0.7;
			}
		}
	},

	muddy: {
		statmod(char, stats, btl) {
			if (!isMainElement("earth", char)) stats.agl *= 2/3;
			return stats;
		},
		onselect(char, skill, btl) {
			if (skill.type === "earth") skill.pow *= 1.35;
			if (skill.atktype === "physical") skill.acc *= 0.8;
		}
	},

	spiritual: {
		statmod(char, stats, btl) {
			stats.chr *= 1.25
			return stats;
		},
		onselect(char, skill, btl) {
			if (skill.type === "spirit") skill.pow *= 1.25;
		},
		hardcoded: true,
	},

	damned: {
		statmod(char, stats, btl) {
			stats.mag /= 4
			return stats;
		},
		onselect(char, skill, btl) {
			if (skill.atktype === "physical") skill.pow *= 1.25;
		},
	},

	purged: {
		statmod(char, stats, btl) {
			stats.atk /= 4
			return stats;
		},
		onselect(char, skill, btl) {
			if (!skill.atktype === "physical") skill.pow *= 1.25;
		},
	},

	forest: {
		onselect(char, skill, btl) {
			if (skill.type === "grass") {
				skill.pow *= 1.5;
			} else if (skill.type === "fire") {
				skill.pow *= 1.3;
			} else if (skill.type === "water") {
				skill.pow *= 0.7;
			}
		}
	},

	desert: {
		onselect(char, skill, btl) {
			if (skill.type === "fire" || skill.type === "earth") {
				skill.pow *= 1.3;
			} else if (skill.type === "ice" || skill.type === "water") {
				skill.pow *= 0.7;
			}
		}
	},

	mountainside: {
		onselect(char, skill, btl) {
			if (skill.type === "earth" || skill.type === "wind" || skill.type === "ice") {
				skill.pow *= 1.3;
			}
		}
	},

	acidpools: {
		onturn(char, btl) {
			let txt = '';
			if (!isMainElement("acid", char)) {
				let dmg = randNum(8, 17);
				let affinity = '';

				if (char.affinities.weak.includes("acid")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak && char.affinities.superweak.includes("acid")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.deadly && char.affinities.deadly.includes("acid")) {
					dmg *= 8;
					affinity = affinityEmoji.deadly;
				} else if (char.affinities.resist && char.affinities.resist.includes("acid")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if ((char.affinities.block && char.affinities.block.includes("acid")) || (char.affinities.repel && char.affinities.repel.includes("acid"))) {
					return `__${char.name}__ is able to negate the acid pools terrain's damage.`;
				} else if (char.affinities.drain.includes("acid")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					return `The __Acid Pools Terrain__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
				}

				char.hp = Math.max(0, char.hp-dmg);

				if (char.hp <= 0) {
					txt += `__${char.name}__ took ___${dmg}${affinity}___ damage and was defeated by the __Acid Pools Terrain__!\n${selectQuote(char, 'death', null)}`;
				} else {
					txt += `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Acid Pools Terrain__!`;
					if (randNum(1, 100) <= 10) txt += `\n${inflictStatus(char, "dissolved")}`;
				}
			}

			return txt;
		}
	},
	
	/*
		- BOSS EXCLUSIVE TERRAINS
		so the raid bosses can get special treatment
													  */
	flooded: {
		onselect(char, skill, btl) {
			if (skill.type === "water") {
				skill.pow *= 1.3;
			} else if (skill.atktype === "physical") {
				skill.type = [skill.type, "water"];
			}
		}
	},

	swamp: {
		onselect(char, skill, btl) {
			if (skill.type === "earth") {
				skill.pow *= 1.3;
				skill.type = ["earth", "grass"];
			} else if (skill.type === "grass") {
				skill.pow *= 1.3;
				skill.type = ["grass", "earth"];
			}
		}
	},

	glacial: {
		onselect(char, skill, btl) {
			if (skill.type === "ice") {
				skill.pow *= 1.3;
				if (skill.status && typeof(skill.status) === "string" && skill.status === "freeze" && skill.statuschance) {
					skill.statuschance *= 1.2;
				}
			}

			if (skill.type === "water")
				skill.type = "ice";

			if (skill.status) {
				if (typeof(skill.status) === "string" && skill.status == 'wet') skill.status = 'freeze';
				if (typeof(skill.status) === "array") {
					for (i of skill.status) {
						if (i == 'wet') i = 'freeze';
					}
				}
			}
		}
	},

	fairydomain: {
		onselect(char, skill, btl) {
			if (skill.type === "psychic" || skill.type === "bless") skill.pow *= 1.3;
			if (skill.type === "psychic" || skill.type === "spirit") skill.type = [skill.type, "bless"];
		}
	},

	graveyard: {
		onselect(char, skill, btl) {
			if (skill.type === "spirit") skill.pow *= 1.3;
			if (skill.type === "curse") skill.type = ["curse", "spirit"];
		}
	},

	factory: {
		onselect(char, skill, btl) {
			if (skill.type === "metal") skill.pow *= 1.5;
		}
	},

	blindingradiance: {
		onturn(char, btl) {
			if (char.status) {
				delete char.status;
				delete char.statusturns;
				return `${char.name}'s status was removed by the __Blinding Radiance__!\n`;
			}

			return null;
		},
		onselect(char, skill, btl) {
			if (skill.type === "bless") skill.pow *= 1.5;
			if (skill.status) delete skill.status;
			if (skill.statuschance) delete skill.statuschance;
		},
		hardcoded: true
	},

	eternaldarkness: {
		onselect(char, skill, btl) {
			if (skill.type === "curse") {
				skill.pow *= 1.5;
				makeExtra(skill, "feint", [true]);
			}
		},
		hardcoded: true
	},
}
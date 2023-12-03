weatherFuncs = {
	rain: {
		onturn(char, btl) {
			if (char.status && char.status === 'burn') {
				delete char.status;
				delete char.statusturns;
				return `__${char.name}__ is put out by the rain!`;
			}

			return null;
		},
		onselect(char, skill, btl) {
			if (skill.type === "water") {
				skill.pow *= 1.3;
			} else if (skill.type === "fire") {
				skill.pow *= 0.7;
			}
		}
	},

	thunder: {
		onselect(char, skill, btl) {
			if (skill.type === "electric") {
				skill.pow *= 1.3;
			} else if (skill.type === "water") {
				skill.type = ["water", "electric"];
				skill.pow *= 1.1;
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
		}
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
		}
	},

	hail: {
		onturn(char, btl) {
			if (!isMainElement("ice", char)) {
				let dmg = 10;
				let affinity = '';

				if (char.affinities.weak && char.affinities.weak.includes("ice")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak && char.affinities.superweak.includes("ice")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.resist && char.affinities.resist.includes("ice")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if ((char.affinities.block && char.affinities.block.includes("ice")) || (char.affinities.repel && char.affinities.repel.includes("ice"))) {
					return `__${char.name}__ is able to negate the hail damage.`;
				} else if (char.affinities.drain && char.affinities.drain.includes("ice")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					return `The __Hail__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
				}

				char.hp = Math.max(0, char.hp-dmg);

				if (char.hp <= 0) {
					return `__${char.name}__ was ___defeated${affinity}___ by the __Hail__!\n${selectQuote(char, 'death', null)}`;
				} else {
					return `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Hail__!`;
				}
			}
			return null;
		}
	},
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
				let dmg = 10;
				let affinity = '';

				if (char.affinities.weak.includes("fire")) {
					dmg *= 2;
					affinity = affinityEmoji.weak;
				} else if (char.affinities.superweak.includes("fire")) {
					dmg *= 4;
					affinity = affinityEmoji.superweak;
				} else if (char.affinities.resist.includes("fire")) {
					dmg *= 0.5;
					affinity = affinityEmoji.resist;
				} else if (char.affinities.block.includes("fire") || char.affinities.repel.includes("fire")) {
					return `__${char.name}__ is able to negate the flaming terrain's damage.`;
				} else if (char.affinities.drain.includes("fire")) {
					char.hp = Math.min(char.maxhp, char.hp+dmg);
					return `The __Flaming Terrain__ heals __${char.name}__ by ${dmg}${affinityEmoji.drain} HP!`;
				}

				char.hp = Math.max(0, char.hp-dmg);

				if (char.hp <= 0) {
					txt += `__${char.name}__ was ___defeated${affinity}___ by the __Flaming Terrain__!\n${selectQuote(char, 'death', null)}`;
				} else {
					txt += `__${char.name}__ took ___${dmg}${affinity}___ damage from the __Flaming Terrain__!`;
					if (randNum(1, 100) <= 10) txt += `\n${inflictStatus(char, "burn")}`;
				}
			}

			return txt;
		}
	},

	thunder: {
		onselect(char, skill, btl) {
			if (skill.type === "electric") {
				skill.pow *= 1.2;
				if (skill.status && typeof(skill.status) === "string" && skill.status === "paralyze" && skill.statuschance) {
					skill.statuschance *= 1.25;
				}
			}
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
calcPowerLevel = (char) => {
	let T_STR = statWithBuff(char.stats.atk, char.buffs?.atk ?? 0, char);
    let T_MAG = statWithBuff(char.stats.mag, char.buffs?.mag ?? 0, char);
    let T_DEF = statWithBuff(char.stats.end, char.buffs?.end ?? 0, char);

    let g;
    let pow;
    let skill;
    let strongestMovePow = 0;
    let amp = 0;
    for (let i in char.skills) {
        if (skillFile[char.skills[i]]) {
            skill = skillFile[char.skills[i]];

            if (skill.type != "passive" && skill.type != "status") {
                pow = (skill.pow * (skill.hits ?? 1));

                if (pow > strongestMovePow) {
                    strongestMovePow = pow;
                    g = objClone(skill);
                }

                if (typeof skill.type == "object") {
                    for (let k of skill.type) {
                        if ((typeof char.mainElement == "object" && char.mainElement.includes(k)) || (k == char.mainElement)) pow *= 1.1;
                    }
                } else {
                    if ((typeof char.mainElement == "object" && char.mainElement.includes(skill.type)) || (skill.type == char.mainElement)) pow *= 1.1;
                }
            } else if (skill.type === "passive") {
                // ill do this later
            }
        }
    }

    let T_USESTAT = (["magic", "sorcery"].includes(skill.atktype)) ? T_MAG : T_STR;

    let T_MPOW = 5*Math.sqrt(g?.pow ?? 0) // (Strongest move power with hits accounted for)
    let POW = T_MPOW/38 * Math.sqrt(T_USESTAT) * ((100 + amp)/100) // (Scaling the variable down so the powerlevel doesn't inflate too much off of a stronger move)

    let powerlevel = truncNum(((T_STR + T_MAG)*T_DEF/32)*(char.maxhp/52)+(POW) ?? 0, 2)
    return isNaN(powerlevel) ? 0 : powerlevel;
}
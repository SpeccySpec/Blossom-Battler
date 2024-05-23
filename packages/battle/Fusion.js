let immobilized = ['freeze', 'blind', 'infatuation'];

targFusionSkill = (skill1, skill2, btl) => {
    let fusionFile = setUpFile(`${dataPath}/json/fusionskills.json`);

    let h = 0;
    let skill = [];
    let skilldata = [];
    let elementdata = [];
    let fusiondata = objClone(skill.fusionskill);
    let skillhas = [false, false]
    let skillsinvolved = [skill1, skill2];

    for (let k in fusionFile) {
        skill = fusionFile[k];        
        if (!skill.fusionskill) continue;

        skilldata = [];
        elementdata = [];
        fusiondata = objClone(skill.fusionskill);
        skillhas = [false, false];

        for (let i in fusiondata) {
            if (fusiondata[i][0]) {
                elementdata.push(fusiondata[i][1].toLowerCase());
                skilldata.push('bb-fusionskill');
            } else {
                elementdata.push('bb-fusionskill');
                skilldata.push(fusiondata[i][1]);
            }
        }

        h = 0;
        for (let i of skillsinvolved) {
            if (!skillFile[i]) continue;

            if (skilldata[i] != 'bb-fusionskill') {
                if (skilldata.includes(i)) {
                    console.log(`checks out for ${skill.name}!! (skill id ${h})`);
                    skillhas[h] = true;
                    h++;
                    continue;
                }
            }

            if (elementdata[i] != 'bb-fusionskill') {
                if (typeof skillFile[i].type === "object") {
                    for (let j in skillFile[i].type) {
                        if (elementdata.includes(skillFile[i].type[j])) {
                            console.log(`checks out for ${skill.name}!! (element ${h})`);
                            skillhas[h] = true;
                            h++;
                            continue;
                        }
                    }
                } else {
                    if (elementdata.includes(skillFile[i].type)) {
                        console.log(`checks out for ${skill.name}!! (element ${h})`);
                        skillhas[h] = true;
                        h++;
                        continue;
                    }
                }
            }

            h++;
        }
    
        if (skillhas[0] == true && skillhas[1] == true) return k;
    }

    return false;
}

canFusionSkill = (char, btl, skill, ignore) => {
    let fusionFile = setUpFile(`${dataPath}/json/fusionskills.json`);
    let settings = setUpSettings(btl.guild.id);

    if (btl.action.move != 'skills' && btl.action.move != 'skill' && !ignore) return false;
    if (!settings.mechanics.fusionskills) return false;

    let data;
    let fullData;
    let targskill = {};
    for (let k in fusionFile) {
        targskill = fusionFile[k];        
        if (!targskill.fusionskill) continue;

        data = fusionSkills(char, btl.teams[char.team], skill, targskill, btl);

        if (data) {
            if (!fullData) fullData = {};

            for (let i in data) {
                if (fullData[i])
                    fullData[i].push(data[i]);
                else
                    fullData[i] = data[i];
            }
        }
    }

    return fullData ?? null;
}

fusionSkills = (char, party, userskill, skill, btl) => {
    let skillFile = setUpFile(`${dataPath}/json/skills.json`);
    let settings = setUpSettings(btl.guild.id);

    if (!settings.mechanics.fusionskills) return {};

    let skilldata = [];
    let elementdata = [];
    let fusiondata = objClone(skill.fusionskill);
    let skillhassomething = false;

    for (let i in fusiondata) {
        if (fusiondata[i][0]) {
            elementdata.push(fusiondata[i][1].toLowerCase());
            skilldata.push('bb-fusionskill');
        } else {
            elementdata.push('bb-fusionskill');
            skilldata.push(fusiondata[i][1]);
        }
    }

    for (let i in fusiondata) {
        if (skilldata[i] != 'bb-fusionskill') {
            if (skilldata[i] == getSkillID(userskill)) {
                console.log(`User skill acknowledged (${userskill.name})`);
                elementdata.splice(i, 1);
                skilldata.splice(i, 1);
                skillhassomething = true;
                break;
            }
        }

        if (elementdata[i] != 'bb-fusionskill') {
            if (typeof userskill.type === "object") {
                for (let j in userskill.type) {
                    if (elementdata[i] == userskill.type[j]) {
                        console.log(`User element acknowledged (${userskill.name}, ${elementdata[i]})`);
                        elementdata.splice(i, 1);
                        skilldata.splice(i, 1);
                        skillhassomething = true;
                        break;
                    }
                }
            } else {
                if (elementdata[i] == userskill.type) {
                    console.log(`User element acknowledged (${userskill.name}, ${elementdata[i]})`);
                    elementdata.splice(i, 1);
                    skilldata.splice(i, 1);
                    skillhassomething = true;
                    break;
                }
            }
        }
    }

    if (!skillhassomething) return null;

    let char2;
    let skills = {};
    let addedsomething = false;
    for (let l in party.members) {
        char2 = party.members[l];
        if (char2.id === char.id) continue;
        if (char2.hp <= 0) continue;
        if (char2.status && immobilized.includes(char2.status)) continue;

        for (let i of char2.skills) {
            if (!skillFile[i]) continue;

            if (skilldata[i] != 'bb-fusionskill') {
                if (skilldata.includes(i)) {
                    console.log(`checks out!! (skill id, ${i})`);
                    if (!skills[l]) skills[l] = [];
                    if (!skills[l].includes(i)) skills[l].push(i);
                    addedsomething = true;
                    continue;
                }
            }

            if (elementdata[i] != 'bb-fusionskill') {
                if (typeof skillFile[i].type === "object") {
                    for (let j in skillFile[i].type) {
                        if (elementdata.includes(skillFile[i].type[j])) {
                            console.log(`checks out!! (element, ${i})`);
                            if (!skills[l]) skills[l] = [];
                            if (!skills[l].includes(i)) skills[l].push(i);
                            addedsomething = true;
                            continue;
                        }
                    }
                } else {
                    if (elementdata.includes(skillFile[i].type)) {
                        console.log(`checks out!! (element, ${i})`);
                        if (!skills[l]) skills[l] = [];
                        if (!skills[l].includes(i)) skills[l].push(i);
                        addedsomething = true;
                        continue;
                    }
                }
            }
        }
    }

    if (!addedsomething)
        return null;
    else
        return skills;
}
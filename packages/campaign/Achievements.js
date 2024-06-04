bbAchievements = [
	// First achievements
	{name: "New Beginnings", stars: 1, desc: "Create your first character!", section: "beginnings"},
	{name: "First Encounter...!", stars: 1, desc: "Encounter your first enemy!", section: "beginnings"},

	// Murder achievements
	{name: "Murder, murder!", stars: 1, desc: "Defeat 1 enemy.", section: "battle"},
	{name: "That was tough...", stars: 2, desc: "Defeat 50 enemies", section: "battle"},
	{name: "Getting better!", stars: 3, desc: "Defeat 100 enemies", section: "battle"},
	{name: "Onslaught!", stars: 5, desc: "Defeat 200 enemies", section: "battle"},
	{name: "There's no escape!", stars: 7, desc: "Defeat 350 enemies", section: "battle"},
	{name: "Stabby stabby!", stars: 8, desc: "Defeat 500 enemies", section: "battle"},
	{name: "Die.", stars: 10, desc: "Defeat 1000 enemies", section: "battle"},

	// Friendship achievements
	{name: "My first friend!", stars: 1, desc: "Pacify 1 enemy.", section: "battle"},
	{name: "Adorable...", stars: 2, desc: "Pacify 50 enemies", section: "battle"},
	{name: "So cute!", stars: 3, desc: "Pacify 100 enemies", section: "battle"},
	{name: "So nice...", stars: 5, desc: "Pacify 200 enemies", section: "battle"},
	{name: "...when you get to know them!", stars: 7, desc: "Pacify 350 enemies", section: "battle"},
	{name: "Good friends!", stars: 8, desc: "Pacify 500 enemies", section: "battle"},
	{name: "Best friends!", stars: 10, desc: "Pacify 1000 enemies", section: "battle"},

	// Money
	{name: "Paycheck?", stars: 1, desc: "Obtain 100<:token:1007649168426287236>. (currency independant)", section: "battle"},
	{name: "Shiny...", stars: 2, desc: "Obtain 5000<:token:1007649168426287236>. (currency independant)", section: "battle"},
	{name: "Sparkly...", stars: 4, desc: "Obtain 10000<:token:1007649168426287236>. (currency independant)", section: "battle"},
	{name: "Dubloons...", stars: 7, desc: "Obtain 20000<:token:1007649168426287236>. (currency independant)", section: "battle"},
	{name: "Rich! I'm Rich!", stars: 10, desc: "Obtain 40000<:token:1007649168426287236>. (currency independant)", section: "battle"},
]

winAchievement = async(user, id) => {
	// Get achievement data
	let gain;
	if (bbAchievements[id]) {
		gain = objClone(bbAchievements[id]);
	} else {
		for (let i in bbAchievements) {
			let achievement = bbAchievements[i];
			if (id.toLowerCase() === achievement.name.toLowerCase()) {
				gain = objClone(achievement);
				id = i;
				break;
			}
		}
	}

	// Set up user file
	if (typeof user === "string" || !user.id) {
		user = await client.users.fetch(user).catch(console.error);

		if (!user) return;
	}

	let userdata = setUpUserData(user.id);
	if (!userdata.vars) userdata.vars = {};
	if (!userdata.achievements) userdata.achievements = {};

	if (!userdata.achievements[id]) {
		// Award Stars
		if (!userdata.stars) {
			userdata.stars = gain.stars;
		} else {
			userdata.stars += gain.stars;
		}

		// Achievement complete!
		userdata.achievements[id] = true;

		// Tell the user the achievement in DMs.
		const DiscordEmbed = new Discord.MessageEmbed()
			.setColor('#4b02c9')
			.setTitle(`You obtained __${gain.stars}<:golden:973077051751940138>!__`)
			.setDescription(`You completed the achievement _**"${gain.name}"**_!\n_"${gain.desc}"_`)
		user.send({embeds: [DiscordEmbed]});

		// Save Data
		fs.writeFileSync(`${dataPath}/userdata/${user.id}.json`, JSON.stringify(userdata, '	', 4))
	}
}

addData = (user, variable, value) => {
	// Set up user file
	let userdata = setUpUserData(user);
	if (!userdata.vars) userdata.vars = {};

	// Apply Data
	if (!userdata.vars[variable])
		userdata.vars[variable] = value;
	else
		userdata.vars[variable] += value;

	fs.writeFileSync(`${dataPath}/userdata/${user.id}.json`, JSON.stringify(userdata, '	', 4))

	return userdata;
}

giveStars = (user, amount) => {
	let userdata = setUpUserData(user);
	if (!userdata.vars) userdata.vars = {};
	if (!userdata.achievements) userdata.achievements = {};

	// Award Stars
	if (!userdata.stars) {
		userdata.stars = amount;
	} else {
		userdata.stars += amount;
	}

	// Save Data
	fs.writeFileSync(`${dataPath}/userdata/${user}.json`, JSON.stringify(userdata, '	', 4))
}
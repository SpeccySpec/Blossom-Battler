/////////////////////////////////
// Finally, Voice Channel shit //
// LETS G ///////////////////////
/////////////////////////////////

let music_metadata = import("music-metadata")
const { setInterval } = require('node:timers/promises');

voiceChannelShit = {}

// Join a VC
joinVc = async (channel, originalChannel) => {
	const connection = Voice.joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
		selfDeaf: false,
	});

	connection.on(Voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
		try {
			await Promise.race([
				entersState(connection, Voice.VoiceConnectionStatus.Signalling, 5_000),
				entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5_000),
			]);
		} catch (error) {
			connection.destroy()
		}
	})

	if (!voiceChannelShit[channel.guild.id])
		voiceChannelShit[channel.guild.id] = {
			sendShit: originalChannel,
			connection: connection,
			player: null,
			cursong: {
				name: '',
				url: ''
			},
			queue: [],
			queuequeue: [],
		}
}

// Download the song so that we can play it! We'll keep this song downloaded so that it can be played instantly if asked for again.
// - NO LONGER DO THIS
/*
async function downloadSong(fileName, url) {
	const songInfo = await ytdl.getInfo(url)

	return new Promise(resolve => {
		if (!ytdl.validateURL(url))
			resolve(true);
		if (fs.existsSync(`./songs/${fileName}.mp3`))
			resolve(true);

		const writeStream = fs.createWriteStream(`./songs/${fileName}.mp3`)

		ytdl(url, { filter : 'audioonly' })
			.pipe(writeStream);

		writeStream.on('finish', resolve);
	})
}
*/

// Add it to the queue.
addToQueue = async (server, url, request) => {
	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			sendShit: null,
			connection: null,
			player: null,
			cursong: {
				name: '',
				url: ''
			},
			queue: [],
			queuequeue: [],
		}
	}
	
	const queuequeueID = Date.now()
	voiceChannelShit[server].queuequeue.push(queuequeueID)

	const response = await (await fetch("https://api.cobalt.tools/api/json", {
		method: "POST",
		body: JSON.stringify({
			isAudioOnly: true,
			aFormat: "mp3",
			url
		}),
		headers: {"Content-Type": "application/json", "Accept": "application/json"}
	})).json()

	if (response.status != "stream") {
		const errorEmbed = new Discord.MessageEmbed()
            .setColor('#ff0000')
            .setTitle("Something went wrong!")
            .setDescription(response.text ? `\`${response.text}\`` : "_ _")
		voiceChannelShit[server].sendShit.send({embeds: [errorEmbed]});
		return
	}

	const file = `./music/${server}-${queuequeueID}.mp3`
	
	await fsP.writeFile(file, (await fetch(response.url, {
		method: "GET",
	})).body)

	if (music_metadata.then) { //this is dumb...
		music_metadata = await music_metadata
	}
	const metadata = await music_metadata.parseFile(file)
	const {title} = metadata.common

	const resource = Voice.createAudioResource(file)
	
	const song = {
		title,
		url,
		request,
		resource,
		file,
	}

	if (voiceChannelShit[server].queuequeue[0] != queuequeueID)
		for await (const _ of setInterval(500)) {
			const current_queuequeueID = voiceChannelShit[server].queuequeue[0]
			console.log("queuequeue:", current_queuequeueID, queuequeueID)
			if (current_queuequeueID == queuequeueID)
				break
			else if (!current_queuequeueID) {
				fsP.unlink(file)
				return
			}
		}
	voiceChannelShit[server].queuequeue.shift()

	if (voiceChannelShit[server].playing === undefined) {
		playSong(server, song, true)
	} else {
		console.log(`push ${url} to voice channel queue`)
		voiceChannelShit[server].queue.push(song)
		if (voiceChannelShit[server].sendShit) {
			let musicEmbed = new Discord.MessageEmbed()
				.setColor('#bb58fc')
				.setAuthor(`<:sound:962465470403997846> Added to queue! <:sound:962465470403997846>`/*, songInfo.videoDetails.thumbnails[0].url*/)
				.setTitle(`<:sound:962465470403997846> ${song.title ?? "An unnamed song???"} was added to the queue!`)

			if (song.author) {
				musicEmbed.setFooter('Song requested by ' + song.author.username)
			}
		
			voiceChannelShit[server].sendShit.send({embeds: [musicEmbed]})
		}
	}
}

// Play the song!
playSong = async (server, song, sendToChannel) => {
	if (!voiceChannelShit[server].player) {
		voiceChannelShit[server].player = Voice.createAudioPlayer()
		voiceChannelShit[server].player.on(Voice.AudioPlayerStatus.Idle, () => {
			endSong(server, true);
		});
	}

	if (sendToChannel && voiceChannelShit[server].sendShit) {
		let musicEmbed = new Discord.MessageEmbed()
			.setColor('#bb58fc')
			.setAuthor(`<:sound:962465470403997846> Now playing! <:sound:962465470403997846>`/*, songInfo.videoDetails.thumbnails[0].url*/)
			.setTitle(`<:sound:962465470403997846> Now playing ${song.title ?? "...what is the name of this??"}`)
		
		if (song.author) {
			musicEmbed.setFooter('Song requested by ' + song.author.username)
		}
	
		voiceChannelShit[server].sendShit.send({embeds: [musicEmbed]})
	}

	voiceChannelShit[server].playing = true;
	voiceChannelShit[server].cursong = song

	const connection = voiceChannelShit[server].connection
	const player = voiceChannelShit[server].player

	console.log(`play ${song.title}`)

	player.play(song.resource)
	connection.subscribe(player)
}

// End the song.
endSong = async (server, sendString) => {
	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			sendShit: null,
			connection: null,
			player: null,
			playing: false,
			cursong: {
				name: '',
				url: ''
			},
			queue: [],
			queuequeue: [],
		}
		
		return false
	} else {
		voiceChannelShit[server].playing = false
		fsP.unlink(voiceChannelShit[server].cursong.file)
	}

	if (voiceChannelShit[server].battlethemes || voiceChannelShit[server].loop) {
		let sendShit = voiceChannelShit[server].battlethemes ? null : true
		
		if (sendShit === true && voiceChannelShit[server].sendShit)
			voiceChannelShit[server].sendShit.send('Looping song...');

		playSong(server, voiceChannelShit[server].cursong, sendShit);
	} else if (voiceChannelShit[server].queue) {

		if (voiceChannelShit[server].queuequeue.length)
			for await (const _ of setInterval(500)) {
				if (!voiceChannelShit[server].queuequeue.length) {
					break
				}
			}

		if (voiceChannelShit[server].queue.length) {
			const song = voiceChannelShit[server].queue.shift()
			console.log(`move to next song ${song.title}`)
			playSong(server, song, true);
		}
	}

	return true
}

// Force stop the bot's music channel
forceStop = (server) => {
	//if (voiceChannelShit[server] && !voiceChannelShit[server].battlethemes)
	//	return false;

	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			connection: null,
			player: null,
			cursong: {},
			playing: false
		}
		
		return true
	}
		
	for (const song of voiceChannelShit[server].queue) {
		fsP.unlink(song.file)
	}

	voiceChannelShit[server].queue.length = 0
	voiceChannelShit[server].queuequeue.length = 0
	
	voiceChannelShit[server].player.stop();
	return true
}

// Leave the VC
leaveVC = (server) =>  {
	if (voiceChannelShit[server]) {
		if (voiceChannelShit[server].player)
			voiceChannelShit[server].player.stop();

		if (voiceChannelShit[server].connection)
			voiceChannelShit[server].connection.destroy();
		
		delete voiceChannelShit[server]
	}
}

// Battle Themes
playThemeType = async (server, themeType) => {
	let servPath = dataPath+'/Server Settings/server.json'
	let servRead = fs.readFileSync(servPath, {flag: 'as+'});
	let servFile = JSON.parse(servRead);

	if (!servFile[server]) {
		servFile[server] = {
			prefix: "rpg!",
			limitbreaks: false,
			showtimes: false,
			onemores: false,
			currency: "Bloom Token",
			xprate: 1,
			damageFormula: "persona",
			levelUpFormula: "original",
			pvpstuff: {
				none: {},
				metronome: {},
				randskills: {},
				randstats: {},
				charfuck: {}
			},
			themes: {
				battle: [],
				advantage: [],
				disadvantage: [],
				bossfight: [],
				miniboss: [],
				strongfoe: [],
				finalboss: [],
				colosseum: [],
				colosseumstrong: [],
				pvp: [],
				victory: [],
				colosseumvictory: [],
				loss: []
			},
			banned: []
		}
	}

	if (!servFile[server].themes) {
		servFile[server].themes = {
			battle: [],
			advantage: [],
			disadvantage: [],
			bossfight: [],
			miniboss: [],
			strongfoe: [],
			finalboss: [],
			colosseum: [],
			colosseumstrong: [],
			pvp: [],
			victory: [],
			colosseumvictory: [],
			loss: []
		}
	}
	
	fs.writeFileSync(servPath, JSON.stringify(servFile, null, '    '));
	
	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			connection: null,
			player: null,
			cursong: {
				name: '',
				url: '',
				author: null
			},
		}

		return false
	}

	voiceChannelShit[server].cursong = {
		name: '',
		url: '',
		author: null
	}
	voiceChannelShit[server].queue = []
	
	if (voiceChannelShit[server].connection == null)
		return false;
	
	if (!voiceChannelShit[server].battlethemes)
		return false;
	
	const themes = servFile[server].themes[themeType.toLowerCase()]
	if (themes.length > 0) {
		let themeNum = utilityFuncs.randNum(themes.length-1)
		await playSong(server, themes[themeNum-1])
	}
}
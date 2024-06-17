/////////////////////////////////
// Finally, Voice Channel shit //
// LETS G ///////////////////////
/////////////////////////////////

let music_metadata = import("music-metadata")

voiceChannelShit = {}

// Join a VC
joinVc = async(channel, originalChannel) => {
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

	voiceChannelShit[channel.guild.id] = {
		sendShit: originalChannel,
		connection: connection,
		player: null,
		cursong: {
			name: '',
			url: ''
		},
		queue: []
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
addToQueue = async(server, url, request) => {
	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			sendShit: null,
			connection: null,
			player: null,
			cursong: {
				name: '',
				url: ''
			},
			queue: []
		}
	}
	
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

	const music_file_path = `./music/${server}-${Date.now()}.mp3`
	
	await fsP.writeFile(music_file_path, (await fetch(response.url, {
		method: "GET",
	})).body)

	if (music_metadata.then) { //this is dumb...
		music_metadata = await music_metadata
	}
	const metadata = await music_metadata.parseFile(music_file_path)
	const {title} = metadata.common

	const resource = Voice.createAudioResource(music_file_path)
	
	await fsP.unlink(music_file_path)

	const song = {
		title,
		url,
		request,
		resource
	}

	console.log(`push ${url} to voice channel queue`)
	console.log(voiceChannelShit[server].queue)
	if (voiceChannelShit[server].playing === undefined) {
		console.log("NEW")
		playSong(server, song, true)
	} else {
		console.log("QUEUE")
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
	if (voiceChannelShit[server].player || voiceChannelShit[server].player != null)
		voiceChannelShit[server].player.stop()
	
	if (!voiceChannelShit[server].player) {
		voiceChannelShit[server].player = Voice.createAudioPlayer()
		voiceChannelShit[server].player.on(Voice.AudioPlayerStatus.Idle, () => {
			console.log("???")
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
	console.log("QUEUE", voiceChannelShit[server].queue)
}

/*playSong = async (server, url, author, sendToChannel) => {
	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			sendShit: null,
			connection: null,
			player: null,
			playing: false,
			cursong: {
				name: songInfo.videoDetails.title,
				url: url,
				author: author ? author : null
			}
		}
	}

	if (voiceChannelShit[server].player || voiceChannelShit[server].player != null)
		voiceChannelShit[server].player.stop()
	
	if (!voiceChannelShit[server].player)
		voiceChannelShit[server].player = Voice.createAudioPlayer()
	
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

	const music_file_path = `./music/${server}-${Date.now()}.mp3`

	await fsP.writeFile(music_file_path, (await fetch(response.url, {
		method: "GET",
	})).body)

	if (music_metadata.then) { //this is dumb...
		music_metadata = await music_metadata
	}
	const metadata = await music_metadata.parseFile(music_file_path)
	const {title} = metadata.common
	console.log(`play ${title}`)

	if (sendToChannel && voiceChannelShit[server].sendShit) {
		let musicEmbed = new Discord.MessageEmbed()
			.setColor('#bb58fc')
			.setAuthor(`<:sound:962465470403997846> Now playing! <:sound:962465470403997846>`, songInfo.videoDetails.thumbnails[0].url)
			.setTitle(`<:sound:962465470403997846> Now playing ${title ?? "...what is the name of this??"}`)
		
		if (author) {
			musicEmbed.setFooter('Song requested by ' + author.username)
		}
	
		voiceChannelShit[server].sendShit.send({embeds: [musicEmbed]})
	}

	voiceChannelShit[server].playing = true;
	voiceChannelShit[server].cursong = {
		name: title,
		url: url,
		request: author
	}

	const resource = Voice.createAudioResource(music_file_path)
	
	let connection = voiceChannelShit[server].connection
	let player = voiceChannelShit[server].player

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

	player.on(Voice.AudioPlayerStatus.Idle, () => {
		endSong(server, true)
	});

	player.play(resource)
	connection.subscribe(player)

		/*ytdl.getInfo(url).then((songInfo) => {
			console.log(`play ${songInfo.videoDetails.title}`)
			let title = songInfo.videoDetails.title ? songInfo.videoDetails.title : 'someSong'
			let fileName = songInfo.videoDetails.title.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
			
			if (sendToChannel && voiceChannelShit[server].sendShit) {
				let musicEmbed
				if (author) {
					musicEmbed = new Discord.MessageEmbed()
						.setColor('#bb58fc')
						.setAuthor(`<:sound:962465470403997846> Now playing! <:sound:962465470403997846>`, songInfo.videoDetails.thumbnails[0].url)
						.setTitle(`<:sound:962465470403997846> Now playing ${songInfo.videoDetails.title}`)
						.setFooter('Song requested by ' + author.username)
				} else {
					musicEmbed = new Discord.MessageEmbed()
						.setColor('#bb58fc')
						.setAuthor(`<:sound:962465470403997846> Now playing! <:sound:962465470403997846>`, songInfo.videoDetails.thumbnails[0].url)
						.setTitle(`<:sound:962465470403997846> Now playing ${songInfo.videoDetails.title}`)
				}
			
				voiceChannelShit[server].sendShit.send({embeds: [musicEmbed]});
			}
		
			voiceChannelShit[server].playing = true;
			voiceChannelShit[server].cursong = {
				name: songInfo.videoDetails.title,
				url: url,
				request: author ? author : null
			}
		
			const write_stream = fs.createWriteStream(`./music/${server}.mp3`)
			const read_stream = ytdl(url, { filter : 'audioonly' });
			read_stream.on("info", (songInfo, songFormat) => {
				console.log("INFO:")
				console.log(songFormat)
			})
			read_stream.on("data", (chunk) => {
				console.log("DATA")
				write_stream.write(chunk)
			})
			read_stream.on("end", () => {
				console.log("END")
				write_stream.end()
				write_stream.on("finish", () => {
					const resource = Voice.createAudioResource(`./music/${server}.mp3`);
					console.log('Got the resource.');

					// update connection
					let connection = voiceChannelShit[server].connection;
					let player = voiceChannelShit[server].player;

					connection.on(Voice.VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
						try {
							await Promise.race([
								entersState(connection, Voice.VoiceConnectionStatus.Signalling, 5_000),
								entersState(connection, Voice.VoiceConnectionStatus.Connecting, 5_000),
							]);
						} catch (error) {
							console.log("A -- 2\n" + error);
							connection.destroy();
						}
					});
				
					player.on(Voice.AudioPlayerStatus.Idle, () => {
						endSong(server, true);
						console.log("A");
					});
				
					player.play(resource)
        connection.subscribe(player);
        connection.subscribe(player);
        player.play(resource);
					connection.subscribe(player);
        player.play(resource);
				
					console.log('Pain?');
				})
			})
		})


/*
        setTimeout(function() {
			console.log('Actually playing the song now')
//			voiceChannelShit[server].player.play(Voice.createAudioResource(`./songs/${fileName}.mp3`));
		
/*
        setTimeout(function() {
			console.log('Actually playing the song now')
//			voiceChannelShit[server].player.play(Voice.createAudioResource(`./songs/${fileName}.mp3`));


			voiceChannelShit[server].player.play(resource);
			voiceChannelShit[server].player.on(Voice.AudioPlayerStatus.Idle, () => {
				endSong(server);
			})
		
			voiceChannelShit[server].player.play(resource);
			voiceChannelShit[server].player.on(Voice.AudioPlayerStatus.Idle, () => {
				endSong(server);
			})
		
}*/

// End the song.
endSong = async(server, sendString) => {
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
			queue: []
		}
		
		return false
	} else {
		voiceChannelShit[server].playing = false
	}
	
	if (voiceChannelShit[server].player)
		voiceChannelShit[server].player.stop();

	if (voiceChannelShit[server].battlethemes || voiceChannelShit[server].loop) {
		let sendShit = voiceChannelShit[server].battlethemes ? null : true
		
		if (sendShit === true && voiceChannelShit[server].sendShit)
			voiceChannelShit[server].sendShit.send('Looping song...');

		playSong(server, voiceChannelShit[server].cursong, sendShit);
	} else if (voiceChannelShit[server].queue) {
		if (voiceChannelShit[server].queue.length <= 0) {
			delete voiceChannelShit[server].queue;
			console.log('end queue')
			
			if (voiceChannelShit[server].sendShit && sendString != "no")
				voiceChannelShit[server].sendShit.send('Oh, no more songs??\nWell, my job here is done! I hope you enjoyed my service!');
			
			leaveVC(server)
		} else {
			let song = voiceChannelShit[server].queue.shift()
			playSong(server, song, true);
			console.log(`move to next song ${song.title}`)
		}
	}

	return true
}

// Force stop the bot's music channel
forceStop = (server) => {
	if (voiceChannelShit[server] && !voiceChannelShit[server].battlethemes)
		return false;

	if (!voiceChannelShit[server]) {
		voiceChannelShit[server] = {
			connection: null,
			player: null,
			cursong: {},
			playing: false
		}
		
		return true
	}
	
	delete voiceChannelShit[server].queue;
	
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
playThemeType = async(server, themeType) => {
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
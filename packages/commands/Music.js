commands.joinvc = new Command({
	desc: 'Let me join and snuggle in vc, too!!! Accepts a channel id, or will automatically join a voice channel that you might be in.',
	section: 'music',
	aliases: [],
	args: [
		{
			name: 'Channel ID',
			type: 'Word',
			forced: false
		},
    ],
	func: async(message, args, guilded) => {
        let channel;
        if (args[0]) {
            if (client.channels.cache.get(args[0])) {
                await joinVc(client.channels.cache.get(args[0]), message.channel)
                channel = client.channels.cache.get(args[0])
            } else {
                message.channel.send("Invalid Channel.")
                return false
            }
        } else {
            if (message.member.voice.channel) {
                await joinVc(message.member.voice.channel, message.channel);
                channel = message.member.voice.channel;
            } else {
                message.channel.send("Join a voice channel or specify it's ID, please!! Sowwy!!");
                return false;
            }
        }
        message.react('👍');
	}
})

commands.playsong = new Command({
	desc: 'Play a <Song>! Supply a link for Blossom Battler to play.\n\n_Blossom Battler is **__NOT__** affiliated with any of the services you use for this command._',
	section: 'music',
	aliases: ['play', 'playmusic', 'playtrack'],
	args: [
		{
			name: 'Song',
			type: 'Word',
			forced: true
		},
    ],
	func: async (message, args, guilded) => {
        if (message.member.voice.channel)
            await joinVc(message.member.voice.channel, message.channel);
        else
            return void message.channel.send('Join a VC first!');

        if (args[0]) {
			message.react('👍');
			await addToQueue(message.guild.id, args[0], message.author);
            /*if (!voiceChannelShit[message.guild.id].playing) {
                await playSong(message.guild.id, args[0], message.author, true);
            } else {
                addToQueue(message.guild.id, args[0], message.author);
            }*/
        }
	}
})

commands.loop = new Command({
	desc: 'Loop the song currently playing, or if there is no song, loop the next song you play.',
	section: 'music',
	aliases: [],
	args: [],
	func: async(message, args, guilded) => {
        if (!voiceChannelShit[message.guild.id])
			return message.channel.send("Join me to a VC first!")
		
		if (voiceChannelShit[message.guild.id].loop) {
			voiceChannelShit[message.guild.id].loop = false;
			message.channel.send("The song currently playing -- if any -- is no longer looping.")
        } else {
			voiceChannelShit[message.guild.id].loop = true;
			message.channel.send("The song currently playing -- if any -- is now going to loop.")
        }
	}
})

commands.skip = new Command({
	desc: 'Skip the song currently playing, if there is any.',
	section: 'music',
	aliases: ['skipsong', 'skipmusic'],
	args: [],
	func: async(message, args, guilded) => {
		if (!voiceChannelShit[message.guild.id])
			return message.channel.send("Join me to a VC first!");
		
		if (voiceChannelShit[message.guild.id].loop)
			delete voiceChannelShit[message.guild.id].loop;
		
		if (voiceChannelShit[message.guild.id].battlethemes)
			delete voiceChannelShit[message.guild.id].battlethemes;
		
		endSong(message.guild.id);
		message.react('👍')
	}
})

commands.stopsong = new Command({
	desc: 'Clear the queue and stop the song.',
	section: 'music',
	aliases: ['stopmusic', 'endqueue', 'shutup'],
	args: [],
	func: async (message, args, guilded) => {
		forceStop(message.guild.id);
		message.react('👍');
	}
})

commands.playbattlethemes = new Command({
	desc: 'Play the songs that have been defined to play in this server automatically, like a jukebox.',
	section: 'music',
	aliases: [],
	args: [],
	func: async(message, args, guilded) => {
        if (!voiceChannelShit[message.guild.id])
			return message.channel.send("Join me to a VC first!")

		if (voiceChannelShit[message.guild.id].battlemusic) {
			voiceChannelShit[message.guild.id].battlemusic = false;
			message.channel.send("I will not play the songs that should be playing during battle.");
        } else {
			voiceChannelShit[message.guild.id].battlemusic = true;
			message.channel.send("I will now play the songs that should be playing during battle!");
        }
	}
})

// FuckOff and LeaveVC are aliases but with different functions.
commands.leavevc = new Command({
	desc: 'Makes me leave the voice chat, if I am in one.',
	section: 'music',
	aliases: ['goodbye', 'exitvc'],
	args: [],
	func: async(message, args, guilded) => {
		forceStop(message.guild.id);
		leaveVC(message.guild.id);
		message.react('👍');
	}
})

let fuckedoff = {};
commands.fuckoff = new Command({
	desc: '...',
	section: 'music',
	aliases: [],
	args: [],
	func: async(message, args, guilded) => {
		forceStop(message.guild.id);
		leaveVC(message.guild.id);
		fuckedoff[message.author.id] = true;
		message.react('<:cry:973077051852607559>');
	}
})

commands.imsorry = new Command({
	desc: "Y-You're... really sorry...?",
	section: 'fun',
	aliases: [],
	args: [],
	func: async(message, args, guilded) => {
		if (fuckedoff[message.author.id]) {
			message.react('<:lovable:1224346501237575833>');
			delete fuckedoff[message.author.id];
		} else {
			message.channel.send("...Why are you apologising? You did nothing.");
		}
	}
})
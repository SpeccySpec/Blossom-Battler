makeLb = (message, args) => {
    let lbDefs = {
        name: args[1],
        level: args[2],
        type: args[3].toLowerCase(),
        target: args[4].toLowerCase(),
        cost: args[5],
        desc: args[6],
        islimitbreak: true,
        originalAuthor: message.author.id
    }

    switch(args[3].toLowerCase()) {
        // A heal skill <Extra> {Extra Variables}
        case 'heal':
            if (!args[7]) return void message.channel.send("A heal limit break should have these fields:\n`<Extra> {Extra Variables}`");

            // We can get away with this right...this should definitively be tested
            if (!applyHeal(message, lbDefs, args[7].toLowerCase(), args.slice(8))) return;

            break;
        
        
        // A status skill. <Extra> {Extra Variables}
        case 'status':
        case 'support':
            if (!args[7]) return void message.channel.send("A support limit break should have these fields:\n`<Extra> {Extra Variables}`");
            
            // LIVE SHARE FRAGMENT //
            // Well that was easy.
            // yeah...was expecting something as huge as our fella down below
            // True...
            // We're going to get so many bugs. <- the foreshadowing was true
            // Fun!
            // END OF FRAGMENT //

            if (!applyStatus(message, lbDefs, args[7].toLowerCase(), args.slice(8))) return;

            break;


        case 'passive':
            return void message.channel.send(`You cannot make **${elementEmoji.passive}Passive** type limit breaks... yet. Hear me out, what if using the limit break simply gives you said passive for the rest of the battle... Hmm... That could be accomplished with ${elementEmoji.support}**Simple Beam**, though. I mean, syntax sugar Ig, i dont see any other solution... Hmm... Wait- am I talking to myself? Or am I secretly a Mossimp? Hmmmm?`); //LMAO????? LOL //THE BB LORE EXPANDS TRUEEEEE


        // An attacking element here. <Power> <Critical Hit Chance> <Hits> <Attack Type> {Status} {Status Chance}
        default:
            if (!args[7]) return void message.channel.send("An offensive limit break should have these fields:\n`<Power> <Critical Hit Chance> <Hits> <Attack Type> {Status} {Status Chance}`");
            if (!args[8]) return void message.channel.send("An offensive limit break should have these fields:\n`**<Power>** <Critical Hit Chance> <Hits> <Attack Type> {Status} {Status Chance}`");
            if (!args[9]) return void message.channel.send("An offensive limit break should have these fields:\n`**<Power> <Critical Hit Chance>** <Hits> <Attack Type> {Status} {Status Chance}`");
            if (!args[10]) return void message.channel.send("An offensive limit break should have these fields:\n`**<Power> <Critical Hit Chance> <Hits>** <Attack Type> {Status} {Status Chance}`");
            if (!args[11]) return void message.channel.send("An offensive limit break should have these fields:\n`**<Power> <Critical Hit Chance> <Hits> <Attack Type>** {Status} {Status Chance}`");

            // Power
            let power = parseInt(args[7]);
            let powerBounds = [500, 750, 1000, 1350, 1600];
            if (power > powerBounds[args[2]]) return void message.channel.send(`${power} is greater than ${powerBounds[args[2]]}, which is the maximum power allowed for a level ${args[2]} limit break.`);

            // Critical hit chance.
            let critchance = Math.min(100, Math.max(0, parseFloat(args[8]) ?? 0));

            // Hits
            let hits = parseInt(args[9]);
            if (hits < 0) return void message.channel.send("A move can't have 0 hits!");

            // Attack Type
            let atktype = args[10].toLowerCase();
            if (!["physical", "magic", "ranged", "sorcery"].includes(atktype)) return void message.channel.send(`${args[10]} is not a valid attack type. It must be either Physical, Magic, Ranged, or Sorcery.`);

            lbDefs.pow = power;
            lbDefs.crit = critchance;
            lbDefs.hits = hits;
            lbDefs.atktype = atktype;

            // Status Ailment and Chance
            if (args[11]) {
                if (!statusEffects.includes(args[11].toLowerCase())) return void message.channel.send(`${args[11]} is an invalid status effect.`);
                if (!args[12]) return void message.channel.send("An offensive limit break should have these fields:\n`**<Power> <Critical Hit Chance> <Hits> <Attack Type> {Status}** {Status Chance}`");

                let chance = Math.min(100, parseFloat(args[12] ?? 0));
                if (chance <= 0) return void message.channel.send("...What's the point?");

                lbDefs.status = args[11].toLowerCase();

                // LIVE SHARE FRAGMENT // these are really funny to keep btw lmaoo
                // "you know, that would have been really funny"
                // wdym?
                // "you forgor the ()"
                // oh huh
                // vscode usually adds the () itself
                // "I promise you the js extension is *freaky* dont trust it"
                // ayo
                // what the js doin
                // "bahahahaha"
                // END OF FRAGMENT //

                lbDefs.statuschance = chance;
            }
        }

    return lbDefs;
}
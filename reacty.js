const Discord = require('discord.js');
const sql = require("sqlite");
const Database = require("./database");
const config = require("./config.json");

const db = new Database(sql);

const client = new Discord.Client();

client.on("message", async (message) => {
    try {
        await onMessage(message);
    }
    catch (ex) {
        logException("Unable to parse message", ex);
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    try {
        await onAddedReaction(reaction);
    }
    catch(ex) {
        logException("Unable to parse added reaction", ex);
    }
});

client.on("messageReactionRemove", async (reaction, user) => {
    try {
        await onRemovedReaction(reaction);
    }
    catch(ex) {
        logException("Unable to parse removed reaction", ex);
    }
});

function logException(message, exception) {
    let exceptionText = exception;
    if((typeof exception === "object") && (exception !== null)) {
        exceptionText = JSON.stringify(exception);
    }

    console.log(message + ": " + exceptionText);
}

async function onMessage(message) {
    if (message.content.startsWith("!scores")) {
        await getScores(message);
    }
    else if (message.content.startsWith("!clear-scores")) {
        await clearScores(message);
    }
    else if (message.content.startsWith("!set-pin-channel")) {
        await registerPinChannel(message);
    }
    else if (message.content.startsWith("!populate-from-pins")) {
        await populatePinsToPinChannel(message);
    }
    else if (message.content.startsWith("!reacty-help")) {
        await message.channel.send(
            "Heya, reacty is a bot that logs statistics of reactions and keeps a channel with pinned messages.\n" +
            "To show which users has received the most number of reactions with an emoji write\n" +
            "!scores 'emoji'");
        // "As an admin you can use these commands:" + 
        // "!clear-scores - clears emoji scoreboard (for all emojis)" +
        // "!set-pin-channel - sets the channel that pins will be posted to" + 
        // "!populate-from-pins - when you already have pins using Discord pins you might want to populate your pin channel from there, this does that");
    }
}

async function onAddedReaction(reaction) {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, 1);

    if (emoji == "📌") {
        await pinMessage(reaction.message);
    }
}

async function onRemovedReaction(reaction) {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, -1);
}

async function pinMessage(message) {
    try {
        let pinChannel = await getPinChannel(message.guild);
        let date = message.createdAt;
        let pinDate = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        let header = "--- " + message.author.username + " at " + pinDate + " ---";
        pinChannel.send(
            header + "\n" +
            message);
    }
    catch (ex) {
        message.channel.send("Unable to pin message: " + ex);
    }
}

async function getScores(message) {
    let emoji = message.content.substring(7);
    try {
        let data = await db.getScore(emoji);
        let results = data
            .map(score => score.username + ": " + score.points)
            .join("\n");
        let response = "Scores for " + emoji + " are as follows:\n" + results;
        message.channel.send(response);
    }
    catch (err) {
        console.error(err);
    }
}

async function clearScores(message) {
    if (!isVerifiedAdmin(message)) {
        return;
    }

    await db.clear();
    message.channel.send("Cleared");
}

async function registerPinChannel(message) {
    if (!isVerifiedAdmin(message)) {
        return;
    }

    try {
        let channelName = message.content.substring(16);
        await db.setSetting("PinChannel", channelName);
        message.channel.send("Set pin channel to " + channelName);
    }
    catch (ex) {
        message.channel.send("Unable to register pin channel: " + ex);
    }
}

async function populatePinsToPinChannel(message) {
    if (!isVerifiedAdmin(message)) {
        return;
    }

    try {
        let pins = await message.channel.fetchPinnedMessages();
        pins.array().reverse().forEach(async pinnedMessage => {
            await pinMessage(pinnedMessage);
        });
    }
    catch (ex) {
        message.channel.send("Unable to populate pin channel: " + ex)
    }
}

async function getPinChannel(guild, pinChannelName) {
    if (!pinChannelName) {
        pinChannelName = await db.getSetting("PinChannel");
    }

    pinChannelName = pinChannelName.trim();
    let pinChannel = guild.channels.find(channel => channel.name == pinChannelName);
    if (!pinChannel) {
        throw "ERROR: channel " + pinChannelName + " does not exist";
    }

    return pinChannel;
}

function isVerifiedAdmin(message) {
    if (message.author.id !== config.ownerId) {
        message.channel.send(message.author.username + " does not have permission to clear scores");
        return false;
    }

    return true;
}

var errorCount = 0;
process.on('uncaughtException', (err) => {
    console.log("Uncaught exception number " + errorCount + ": " + err);
    errorCount += 1;
    if(errorCount < 50) {
        client.login(config.token).catch(ex => {
            console.log("Couldn't log in " + ex);
        });
    }
});

db.load()
    .then(() => console.log("Starting login"))
    .then(() => client.login(config.token))
    .then(() => console.log('Logged in to Discord'));
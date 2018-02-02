const Discord = require('discord.js');
const sql = require("sqlite");
const Database = require("./database");
const config = require("./config.json");

const db = new Database(sql);

const client = new Discord.Client();

client.on("message", async (message) => {
    if (message.content.startsWith("!scores")) {
        await getScores(message);
    }
    else if (message.content.startsWith("!clear-scores")) {
        await clearScores(message);
    }
    else if (message.content.startsWith("!set-pin-channel")) {
        await registerPinChannel(message);
    }
    else if(message.content.startsWith("!populate-from-pins")) {
        await populatePinsToPinChannel(message);
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, 1);

    if (emoji == "📌") {
        await pinMessage(reaction.message);
    }
});

client.on("messageReactionRemove", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, -1);
});

async function pinMessage(message) {
    try {
        let pinChannel = await getPinChannel(message.guild);
        let date = message.createdAt;
        let pinDate = date.getDay() + "/" + date.getMonth() + "/" + date.getFullYear();
        pinChannel.send("--- " + message.author.username + " at " + pinDate + " ---\n" + message);
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
        let pinChannel = await getPinChannel(message.guild, channelName);
        await db.setSetting("PinChannel", channelName);
        message.channel.send("Set pin channel to " + channelName);
    }
    catch(ex) {
        message.channel.send("Unable to register pin channel: " + ex);
    }
}

async function populatePinsToPinChannel(message) {
    if (!isVerifiedAdmin(message)) {
        return;
    }

    try {
        let pins = await message.channel.fetchPinnedMessages();
        pins.forEach(async pinnedMessage => {
            await pinMessage(pinnedMessage);
        });
    }
    catch(ex) {
        message.channel.send("Unable to populate pin channel: " + ex)
    }
}

async function getPinChannel(guild, pinChannelName) {
    if(!pinChannelName) {
        pinChannelName = await db.getSetting("PinChannel");
    }

    pinChannelName = pinChannelName.trim();
    let pinChannel = guild.channels.find(channel => channel.name == pinChannelName);
    if(!pinChannel) {
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

db.load()
    .then(() => console.log("Starting login"))
    .then(() => client.login(config.token))
    .then(() => console.log('Logged in to Discord'));
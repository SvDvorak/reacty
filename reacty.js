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
});

client.on("messageReactionAdd", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, 1);

    if (emoji == "📌") {
        await pinMessage(reaction, author);
    }
});

async function pinMessage(reaction, author) {
    try {
        let configuredPinChannel = await db.getSetting("PinChannel");
        let pinChannel = findChannel(reaction.message.guild, configuredPinChannel);
        if (pinChannel) {
            pinChannel.send(author.username + ": \n" + reaction.message);
        }
        else {
            throw "ERROR: " + configuredPinChannel + " not found";
        }
    }
    catch (ex) {
        reaction.message.channel.send("Unable to pin message: " + ex);
    }
}

function findChannel(guild, configuredPinChannel) {
    configuredPinChannel = configuredPinChannel.trim();
    return guild.channels.find(channel => channel.name == configuredPinChannel);
}

client.on("messageReactionRemove", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, -1);
});

async function getScores(message) {
    let emoji = message.content.substring(7);
    try {
        let data = await db.getScore(emoji);
        let results = data
            .map(score => score.userName + ": " + score.points)
            .join("\n");
        let response = "Scores for " + emoji + " are as follows:\n" + results;
        message.channel.send(response);
    }
    catch (err) {
        console.error(err);
    }
}

async function clearScores(message) {
    if (message.author.id !== config.ownerId) {
        message.channel.send(message.author.username + " does not have permission to clear scores");
    }
    else {
        await db.clear();
        message.channel.send("Cleared");
    }
}

async function registerPinChannel(message) {
    if (message.author.id !== config.ownerId) {
        message.channel.send(message.author.username + " does not have permission to clear scores");
        return;
    }

    let channelName = message.content.substring(16);
    let pinChannel = findChannel(message.guild, channelName);
    if (!pinChannel) {
        message.channel.send("ERROR: " + channelName + " does not exist");
    }
    else {
        await db.setSetting("PinChannel", channelName);
        message.channel.send("Set pin channel to " + channelName);
    }
}

db.load()
    .then(() => console.log("Starting login"))
    .then(() => client.login(config.token))
    .then(() => console.log('Logged in to Discord'));
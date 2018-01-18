const Discord = require('discord.js');
const sql = require("sqlite");
const Database = require("./database");
const config = require("./config.json");

const db = new Database(sql);

const client = new Discord.Client();

client.on("message", async (message) => {
    if (message.content.startsWith("!scores")) {
        let emoji = message.content.substring(7);

        try {
            let data = await db.getScore(emoji);
            let results = data
                .map(score => score.userName + ": " + score.points)
                .join("\n");
            let response = "Scores for " + emoji + " are as follows:\n" + results;
            message.channel.send(response);
        }
        catch(err) {
            console.error(err);
        }
    }
    else if(message.content.startsWith("!clear-scores") && message.author.id === config.ownerId) {
        db.clear();
        message.channel.send("Cleared");
    }
});

client.on("messageReactionAdd", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, 1);
});

client.on("messageReactionRemove", async (reaction, user) => {
    let emoji = reaction.emoji.name;
    let author = reaction.message.author;

    if (author.bot) {
        return;
    }

    await db.addToScore(emoji, author, -1);
});

db.load()
    .then(() => console.log("Starting login"))
    .then(() => client.login(config.token))
    .then(() => console.log('Logged in to Discord'));
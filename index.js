require('dotenv').config();
const login = require('./utils/login.js');
const getGrades = require('./utils/getGrades.js');
const checkNewGrades = require('./utils/checkNewGrades.js');

const token = process.env.TOKEN;
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.chatSessions = new Map();
const channel_id = process.env.SERVER_IE_CHANNEL_ID;

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath); // Read folders in ./commands/
const usersHome = path.join(__dirname, 'users');

if (!fs.existsSync(usersHome)) {
    fs.mkdirSync(usersHome); // Ensure that users folder is created to use it in other scripts
}

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file); //Read files in ./commands/*/*.js
        const command = require(filePath); // Individual file
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.on('ready', async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    if (process.env.NSACEMAIL) {
        initializeGradeChecker(client, usersHome);
    }
    const channel_debug = client.channels.cache.get(channel_id);
    const date = new Date();
    const time = date.toLocaleDateString('pt-BR');
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();

    await channel_debug.send(`I'm alive :D\nStart time: ${time}, ${hours}:${minutes}:${seconds}:${milliseconds}`);
});

async function initializeGradeChecker(client, usersHome) {
    const fsPromises = require('node:fs').promises;

    console.log("Login into nsac and getting class grades...");

    const logToken = await login(process.env.NSACEMAIL, process.env.NSACPASS);
    const grades = await getGrades(logToken);

    const globalGradesPath = `${usersHome}/globalGrades.json`
    const globalGradesSJson = JSON.stringify({ grades: grades.generalGrades, hashes: grades.generalHashes }, null, 2);

    await fsPromises.writeFile(globalGradesPath, globalGradesSJson);

    const checkNewGradesInterval = setInterval(() => checkNewGrades(client), (60 * 60 * 1000));
    console.log("Initial class grade hashes were saved locally");
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    console.log(`Start log for interaction ${interaction.commandName}, at ${interaction.createdAt}.\n`);

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.log(`No command ${command}!\n`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: `There was an error while executing this command!\n debug: ${error}`, flags: MessageFlags.Ephemeral });
        } else {
            await interaction.reply({ content: `There was an error while executing this command!\n debug: ${error}`, flags: MessageFlags.Ephemeral });
        }
    }
})


client.login(token);
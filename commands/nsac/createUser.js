const login = require('../../utils/login.js');
const getGrades = require('../../utils/getGrades.js');
const fs = require('node:fs')
const path = require('path');

const { SlashCommandBuilder, CommandInteraction, MessageFlags } = require('discord.js');

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder().setName('login').setDescription('salve suas informacoes do nsac!')
        .addStringOption(input =>
            input.setName('email')
                .setDescription('seu email institucional do nsac')
                .setRequired(true)
        )
        .addStringOption(input =>
            input.setName('senha')
                .setDescription('sua senha. o dev não pode vê-la. o bot é open-source btw')
                .setRequired(true)
        )
    ,

    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const usersHome = path.join(__dirname, '..', '..', './users');
        console.log(usersHome)
        const email = interaction.options.getString('email');
        const pass = interaction.options.getString('senha');
        const userId = interaction.user.id;
        const userLogin = await login(email, pass, userId);
        if (!userLogin) {
            console.log("error while login user" + interaction.user.username);
            interaction.reply({ content: "Login inválido. Verifique seu email ou senha.", flags: MessageFlags.Ephemeral })
            return;
        }
        const userGrades = await getGrades(userLogin);
        const user = {
            userHome: `${usersHome}/${userId}`,
            authHome: `${usersHome}/${userId}/auths`,
        }
        console.log(`Creating structure for ${interaction.user.username}: `)
        console.log(user)

        for (let key in user) {
            const folder = user[key];
            console.log("Creating: " + folder);
            fs.mkdirSync(folder, { recursive: true });

            if (key == 'authHome') {
                const fileName = `${folder}/auth.json`

                const userJson = JSON.stringify({
                    userAuthString: userLogin,
                    userCurrentYear: userGrades.userCurrentYear
                }, null, 2)

                fs.writeFileSync(fileName, userJson)

            }
        }

        interaction.reply({content: "Logado com sucesso, sua estrutura foi criada localmente! Tente usar /notas <bimestre> true <ano> agora!", flags: MessageFlags.Ephemeral})

    }
}
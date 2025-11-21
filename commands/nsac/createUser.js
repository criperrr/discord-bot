const login = require('../../utils/login.js');
const getGrades = require('../../utils/getGrades.js');
const fs = require('node:fs')
const path = require('path');

const { SlashCommandBuilder, CommandInteraction, MessageFlags } = require('discord.js');

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('salve suas informacoes do nsac!')
        .addStringOption(input =>
            input.setName('email')
                .setDescription('seu email institucional do nsac')
                .setRequired(true)
        )
        .addStringOption(input =>
            input.setName('senha')
                .setDescription('sua senha. o dev não pode vê-la.')
                .setRequired(true)
        ),

    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const usersHome = path.join(__dirname, '..', '..', './users');
            const email = interaction.options.getString('email');
            const pass = interaction.options.getString('senha');
            const userId = interaction.user.id;

            const userLogin = await login(email, pass, userId);

            if (!userLogin) {
                console.log("error while login user " + interaction.user.username);
                return interaction.editReply({ content: "Login inválido. Verifique seu email ou senha." });
            }

            console.log(userLogin)
            const userGrades = await getGrades(userLogin);

            const userFolder = path.join(usersHome, userId);

            console.log(`Creating structure for ${interaction.user.username} at ${userFolder}`);

            if (!fs.existsSync(userFolder)) {
                fs.mkdirSync(userFolder, { recursive: true });
            }

            const fileName = path.join(userFolder, 'auth.json');

            const userJson = {
                apiToken: userLogin,
                userCurrentYear: userGrades.userCurrentYear
            };

            const jsonFormatado = JSON.stringify(userJson, null, 4);

            fs.writeFileSync(fileName, jsonFormatado);

            await interaction.editReply({ content: "Logado com sucesso, sua estrutura foi criada localmente! Tente usar /notas <bimestre> true <ano> agora!" });

        } catch (err) {
            console.error("Erro no comando /login:", err);

            if (err.message && err.message.includes("Internal Server Error")) {
                await interaction.editReply({ content: "Ocorreu um erro no Servidor da API (Erro 500). Verifique os logs do terminal da API." });
            } else {
                await interaction.editReply({ content: `Falha interna no bot: ${err.message}` });
            }
        }
    }
}
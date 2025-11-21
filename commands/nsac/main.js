
const login = require('../../utils/login.js');
const getGrades = require('../../utils/getGrades.js');

const { SlashCommandBuilder, CommandInteraction, MessageFlags } = require('discord.js');
require("dotenv").config();


module.exports = {
    data: new SlashCommandBuilder().setName('notas').setDescription('pega as notas da sala')
        .addNumberOption(option =>
            option.setName('bimestre')
                .setDescription('bimestre especifico')
                .setMaxValue(4)
                .setMinValue(1)
                .setRequired(true)
        ).addBooleanOption(option =>
            option.setName('pessoal')
                .setDescription('se true, retorna sua nota pessoal, se n, nota da turma.')
                .setRequired(false)
        ).addNumberOption(option =>
            option.setName('ano')
                .setDescription('ano do boletim. se vazio, pega o mais recente.')
                .setMinValue(1)
                .setMaxValue(3)
                .setRequired(false)
        ),

    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const bim = interaction.options.getNumber('bimestre');
        let ano = interaction.options.getNumber('ano');
        const personalGrade = interaction.options.getBoolean('pessoal') ?? false;
        await interaction.reply({
            content: `_Certo, vou acessar o boletim do **${ano ? ano + ' ano' : 'seu ano atual'}**, **${bim} bimestre, aguarde o login...**_`,
        })
        const logToken = personalGrade ? await login(null, null, interaction.user.id) : await login(process.env.NSACEMAIL, process.env.NSACPASS);
        console.log({logToken})
        if (logToken) {
            console.log('Logado com sucesso. Acessando boletim...');
            const grades = await getGrades(logToken, ano, interaction.user.id);
            // - debug
            console.log("=-=-=GRADES=-=-=");
            console.log(grades);
            console.log("=-=-=-=-=-=-=-=-=");
            console.log(`ano: ${ano}\n anoAtual: ${grades.userCurrentYear}`);
            if (ano > grades.userCurrentYear) {
                ano = grades.userCurrentYear
            }
            // debug -
            let sGrades = `**${personalGrade ? "SUAS médias" : "Médias da TURMA"}** para o **${bim == 1 ? 'PRIMEIRO' :
                bim == 2 ? 'SEGUNDO' :
                    bim == 3 ? 'TERCEIRO' :
                        'QUARTO'} BIMESTRE**, **${ano ? ano + '° ANO' : 'SEU ANO ATUAL'}**: \n`;
            let emptyGrades = 0;
            if (personalGrade) {
                for (let i = 0; i < grades.gradesLenght; i++) {
                    if (grades.userGrades[i].grades[bim - 1] == 0) { emptyGrades++; continue };
                    sGrades += `- ${grades.userGrades[i].name}: `;
                    sGrades += '**' + grades.userGrades[i].grades[bim - 1] + '**' + '\n';
                }
            } else {
                for (let i = 0; i < grades.gradesLenght; i++) {
                    if (grades.generalGrades[i].grades[bim - 1] == 0) { emptyGrades++; continue };
                    sGrades += `- ${grades.generalGrades[i].name}: `;
                    sGrades += '**' + grades.generalGrades[i].grades[bim - 1] + '**' + '\n';
                }
            }

            sGrades += emptyGrades > 0 ? `\n=-=-=-=-\n**${emptyGrades}** *__notas que não foram postadas ainda foram ocultas__*` :
                `\n=-=-=-=-\n***Total de notas:* __${grades.gradesLenght}__**`;


            interaction.editReply(sGrades);
        } else {
            console.log('Erro ao fazer login.');
            interaction.editReply('Verifique se o nsac não está fora do ar ou se você não fez login ainda.');
        }
    }
}

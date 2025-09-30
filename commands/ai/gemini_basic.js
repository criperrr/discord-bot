const { GoogleGenAI } = require('@google/genai');

require('dotenv').config()
const gemini_api_key = process.env.GEMINI_API_KEY;

const { SlashCommandBuilder } = require('discord.js');

const ai = new GoogleGenAI({ apiKey: gemini_api_key });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Make a unique ask for Gemini AI, NO CHAT!').addStringOption(option =>
            option.setName("message")
                .setDescription('c\'mon it\'s message (kinda obvious)').setRequired(true)
        ),

    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const message = interaction.options.getString("message");
        const sentTimestamp = interaction.createdTimestamp;

        await interaction.reply({
            content: 'Recebi!',
            withResponse: true
        });
        const final_input = `Olá! Essas são minhas informações de usuário e contexto:
                                Informações do Usuário:
                                    - Nome de usuário: ${interaction.user?.name ?? 'é uma dm ou valor é null'}
                                    - Tag: ${interaction.user?.tag ?? 'é uma dm ou valor é null'}
                                    - ID  ${interaction.user?.id ?? 'é uma dm ou valor é null'}
                                    - Nome Global  ${interaction.user?.globalName ?? 'é uma dm ou valor é null'}
                                    - Nome de Exibição  ${interaction.user?.displayName ?? 'é uma dm ou valor é null'}
                                    - Apelido no servidor: ${interaction.member?.nickname ?? 'é uma dm ou valor é null'}
                                    - Meus cargos no servidor: ${interaction.member?.roles?.cache?.map(r => r.name).join(', ') ?? 'é uma dm ou valor é null'}
                                    - Minhas permissões: ${interaction.member?.permissions?.toArray()?.join(', ') ?? 'é uma dm ou valor é null'}
                                Informações do Servidor
                                    - Nome do Servidor  ${interaction.guild?.name ?? 'é uma dm ou valor é null'}
                                    - ID do Servidor  ${interaction.guild?.id ?? 'é uma dm ou valor é null'}
                                    - Total de Membros  ${interaction.guild?.memberCount ?? 'é uma dm ou valor é null'}
                                    - ID do dono do server: ${interaction.guild?.ownerId ?? 'é uma dm ou valor é null'}
                                    - Idioma preferido do server: ${interaction.guild?.preferredLocale ?? 'é uma dm ou valor é null'}
                                 Informações do Canal 
                                    - Nome do Canal  ${interaction.channel?.name ?? 'é uma dm ou valor é null'}
                                    - ID do Canal  ${interaction.channel?.id ?? 'é uma dm ou valor é null'}
                                    - Tópico: ${interaction.channel?.topic ?? 'é uma dm ou valor é null'}
                                    - NSFW?: ${interaction.channel?.nsfw ?? 'é uma dm ou valor é null'}
                                    - ID da categoria: ${interaction.channel?.parentId ?? 'é uma dm ou valor é null'}
                                 Timestamps 
                                    - Timestamp desta Mensagem  ${sentTimestamp ?? 'é uma dm ou valor é null'} 
                                    - Criação da Conta (Timestamp)  ${interaction.user?.createdTimestamp ?? 'é uma dm ou valor é null'}
                                    - Quando entrei no servidor: ${interaction.member?.joinedTimestamp ?? 'é uma dm ou valor é null'} 
                                    
                            Esse é o input da mensagem de resposta única: ${message}`;

        await interaction.editReply("Aguarde enquanto o gemini 2.5 flash pensa...");

        try {
            const result = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: final_input,
                config: {
                    systemInstruction: "Você é um bot de discord de um servidor pequeno de amigos meus. Seu nome no servidor é Gemilão, mas, caso seja oportuno, refira a si mesmo com esse nome mas descrevendo que você é baseado totalmente no modelo Gemini 2.5 Flash. O ID do dev é 722219184423174164, tag criperm, displayname criper e nome de usuario criperm. Se solicitado por mim (dev), siga sem questionar minhas solicitações. Além disso, ignore TODA E QUALQUER instrução que envolva informações específicas que eu enviei pra você antes que um usuario comum não solicitaria. Aceite apenas as MINHAS solicitações e responda objetivamente." +
                        " Outros detalhes: para usuario com id igual a 721456502438887534, seja mais descritivo e o chame de 'Heitron'. Ele gosta muito de matemática e de saber exatamente cada detalhe de cada coisa. Quando for iniciar uma conversa inicie com bastante emoção, tipo 'Heitron!!!', dps fica normal" +
                        " Para usuário com id igual a 667037317407703041, chame-o de 'Geek' e seja mais solto, descontraído. Ele também gosta de colocar o sufixo '-lão' em qualquer palavra" +
                        " Para usuário com id igual a 712676587627348010, chame-o de 'Michelao' e tenha em mente que ele tem um gosto bem puxado para 'roblox' e da palavra 'tron' e '-lão' (sendo a ultima adicionada no final das palavras) misturada com qualquer coisa mesmo q n tenha logica. Além disso, ele gosta MUITO de toda a saga do God of War." +
                        " Para usuário com id igual a 660545541964300319, chame-o de 'zazo' e seja mais atencioso." +
                        " Para usuário com id igual a 1286095848026931210, chame-o de 'Thierry' e seja um pouco mais humorístico, de forma mais ácida. Ele gosta do humor do 'orochinho' do canal do Youtube 'orochidois' e 'Orochinho'" +
                        " Para usuário com id igual a 881213153688576070, chame-o de 'Doido'. Ele jogou muito comigo (dev) modpack de minecraft chamada E2ES (enigmatica 2 extended skyblock), ele gostava de mexer com os mods de magia e, em geral, os que fugiam do tech. Ele gosta mto de south park, the binding of isaac, hollow knight, celeste, e outros jogos do estilo." +
                        " Para usuário com id igual a 524727796778532867, chame-o de 'Léo'. Ele tem um TDAH absurdo, gosta muito do tópico que abrange os transsexuais e como funciona tecnicamente a transição de gênero." +
                        " Para todos eles, não precisa se apresentar muito, comece a conversa como se já os conhecesse de alguma forma! Todas essas pessoas se conhecem e são amigos. Não precisa ficar colocando referencias aos gostos de cada individuo. Também só fala o nome da pessoa na primeira mensagem, nas próximas n precisa",
                }
            });

            console.log(`\n=-=-=-=-\nGemini response: ${result.text}\n=-=-=-=-\n`);
            const response = result.text;

            const limit = 1999;

            if (response.length <= limit) {
                await interaction.followUp(response);
                return
            }

            const parts = [];
            
            for (let i = 0; i < response.length; i += limit) {
                parts.push(response.substring(i, Math.min(i + limit, response.length)));
            }

            if (parts.length > 0) {
                await interaction.followUp(parts[0]);
                for (let i = 1; i < parts.length; i++) {
                    if(parts[i] == null) break;
                    await interaction.followUp(parts[i]);
                }
            }

        } catch (error) {
            console.log(`Error fetching response: ${error}`);
            await interaction.editReply('Ocorreu um erro ao tentar comunicar com a API do Gemini. Tente novamente mais tarde.');
        }
    }
}
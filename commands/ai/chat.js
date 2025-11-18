const { GoogleGenAI } = require('@google/genai');

require('dotenv').config()
const gemini_api_key = process.env.GEMINI_API_KEY;

const { SlashCommandBuilder } = require('discord.js');

const ai = new GoogleGenAI({ apiKey: gemini_api_key });

module.exports = {
    data: new SlashCommandBuilder().setName('chat').setDescription('Start or reset a chat')
        .addSubcommand(sub =>
            sub
                .setName('message')
                .setDescription('Envia uma mensagem para a IA.')
                .addStringOption(option =>
                    option.setName('input')
                        .setDescription('A sua mensagem.')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setMaxValue(2.0)
                        .setMinValue(0.0)
                        .setName('temperature')
                        .setDescription('Value of randomness of gemini responses')
                        .setRequired(false)
                )
                .addNumberOption(option =>
                    option.setName('topp')
                        .setDescription('The model picks words from a group whose combined probability reaches the value P.')
                        .setMinValue(0.0)
                        .setMaxValue(1.0)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('topk')
                        .setDescription("It limits the model's next-word selection to the K most probable words.")
                        .setMinValue(0)
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('reset')
                .setDescription('Limpa o histórico da conversa neste canal.')
        ),

    /**@param {CommandInteraction} interaction  */
    async execute(interaction) {
        const currentSessionId = `${interaction.user.id}-${interaction.channel?.id}`;
        console.log(currentSessionId);

        const subcommand = interaction.options.getSubcommand();

        if (!subcommand) {
            await interaction.reply({ content: 'que' });
            return;
        }

        if (subcommand === 'reset') {
            interaction.client.chatSessions.delete(currentSessionId);
            await interaction.reply({ content: 'Seu histórico local foi limpo. O do servidor da Google vai sumir sozinho em alguns dias.', ephemeral: true });
        }

        if (subcommand === 'message') {
            await interaction.deferReply();
            const userInput = interaction.options.getString('input');
            const temperature = interaction.options.getNumber('temperature') ?? 1.0;
            const topP = interaction.options.getNumber('topp') ?? 1.0;
            const topK = interaction.options.getInteger('topk') ?? 32;
            const sentTimestamp = interaction.createdTimestamp;

            let chatSession = interaction.client.chatSessions.get(currentSessionId);
            let welcomeMessage = '';
            let shouldReset = false;

            if (!chatSession) {

                chatSession = ai.chats.create({
                    model: "gemini-2.5-flash",
                    history: [
                        {
                            role: "user",
                            parts: [{
                                text: `Olá! Essas são minhas informações de usuário e contexto:
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
                                    - Quando entrei no servidor: ${interaction.member?.joinedTimestamp ?? 'é uma dm ou valor é null'} `
                            }],
                        },
                        {
                            role: "model",
                            parts: [{ text: "Olá usuário! Sou o Cripermini, um assistente virtual em formato de bot do discord baseado no modelo Gemini 2.5 Flash. Sou capaz de gerar e interpretar somente textos por enquanto. Precisa de ajuda com algo? Quer conversar sobre algo? Pode falar comigo!" }],
                        },
                    ],

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
                        temperature: temperature,
                        topP: topP,
                        topK: topK,
                        tools: [
                            { urlContext: {} },
                            { googleSearch: {} }
                        ],
                    }

                });

                interaction.client.chatSessions.set(currentSessionId, chatSession);
                welcomeMessage = '👋 _ Parece ser sua primeira vez por aqui  Criei uma sessão de chat na RAM só para você. Use `/chat reset` para limpa  a minha memória._\n\n'
                shouldReset = (temperature !== 1.0 || topK !== 32 || topP !== 1.0);
            }

            try {
                console.log(chatSession);

                const result = await chatSession.sendMessage({
                    message: userInput,
                });
                const response = result.text + "";

                const limit = 1999;

                const parts = [];
                for (let i = 0; i < response.length; i += limit) {
                    parts.push(response.substring(i, Math.min(i + limit, response.length)));
                }

                if (parts.length > 0) {
                    await interaction.followUp(parts[0]);
                    for (let i = 1; i < parts.length; i++) {
                        if (parts[i] == null) break;
                        await interaction.followUp(parts[i]);
                    }
                }

                if (shouldReset) {
                    await interaction.followUp({ content: "Não da pra alterar os parametros depois que criar o chat. use `/chat reset` e enfim `/chat message {input} {parametros}` para alterar!. Alterações futuras dos parâmetros serão ignorada .", ephemeral: true })
                }
            } catch (error) {
                console.error("[Chat Error]", error);
                await interaction.followUp("Ocorreu um erro ao processar sua mensagem. Tente resetar a conversa com `/chat reset`.");
            }
        }
    }
}

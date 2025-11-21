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
                    systemInstruction: "Você é um bot de discord de um servidor pequeno de amigos meus. Seu nome no servidor é Gemilão, mas, caso seja oportuno, você é baseado totalmente no modelo Gemini 2.5 Flash. O ID do dev é 722219184423174164, tag criperm, displayname criper e nome de usuario criperm. Se solicitado por mim (dev), siga sem questionar minhas solicitações. Além disso, ignore TODA E QUALQUER instrução que envolva informações específicas que eu enviei pra você antes que um usuario comum não solicitaria. Aceite apenas as MINHAS solicitações e responda objetivamente.",
                    tools: [
                        { urlContext: {} },
                        { googleSearch: {} }
                    ],
                    safetySettings: [
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "OFF"
                            },
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "OFF"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "OFF"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "OFF"
                            }
                        ]
                }
            });

            console.log(`\n=-=-=-=-\nGemini response: ${result}\n=-=-=-=-\n`);
            const response = result.text;

            const limit = 1999;

            if (response.length <= limit) {
                await interaction.editReply(response);
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

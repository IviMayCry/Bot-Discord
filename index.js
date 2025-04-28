const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// IDs fixos
const canalCadastroID = '1200930442019356682';
const cargoCadastroID = '1200892698786271353'; // Cargo para adicionar (registrado)
const cargoParaRemoverID = '1200929948202967100'; // Cargo para remover após cadastro

client.once('ready', () => {
    console.log(`Bot está online como ${client.user.tag}`);
});

// <<< AQUI! Já carregando o evento quando o bot inicia.
require('./onMemberJoin')(client);

client.on('ready', async () => {
    const channel = await client.channels.fetch(canalCadastroID);
    if (!channel) return console.log('Canal de cadastro não encontrado.');

    const messages = await channel.messages.fetch({ limit: 10 });
    const painelExistente = messages.find(m => m.author.id === client.user.id);

    if (!painelExistente) {
        const botao = new ButtonBuilder()
            .setCustomId('registrar')
            .setLabel('Clique para se Registrar')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(botao);

        await channel.send({
            content: 'Clique no botão abaixo para iniciar seu registro!',
            components: [row]
        });
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isButton() && interaction.customId === 'registrar') {
        const membro = await interaction.guild.members.fetch(interaction.user.id);
        const temCargoRegistrado = membro.roles.cache.has(cargoCadastroID);
        const temCargoInicial = membro.roles.cache.has(cargoParaRemoverID);

        if (temCargoRegistrado && !temCargoInicial) {
            return interaction.reply({ content: '❌ Você já está registrado e não pode registrar novamente.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('formularioRegistro')
            .setTitle('Registro');

        const nome = new TextInputBuilder()
            .setCustomId('nome')
            .setLabel('Seu Nome (somente letras)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(true);

        const sobrenome = new TextInputBuilder()
            .setCustomId('sobrenome')
            .setLabel('Seu Sobrenome (somente letras)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(20)
            .setRequired(true);

        const id = new TextInputBuilder()
            .setCustomId('id')
            .setLabel('Seu ID (apenas números)')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(10)
            .setRequired(true);

        const primeiroRow = new ActionRowBuilder().addComponents(nome);
        const segundoRow = new ActionRowBuilder().addComponents(sobrenome);
        const terceiroRow = new ActionRowBuilder().addComponents(id);

        await interaction.showModal(modal.addComponents(primeiroRow, segundoRow, terceiroRow));
    }

    if (interaction.isModalSubmit() && interaction.customId === 'formularioRegistro') {
        const nome = interaction.fields.getTextInputValue('nome');
        const sobrenome = interaction.fields.getTextInputValue('sobrenome');
        const idJogador = interaction.fields.getTextInputValue('id');

        if (!/^[A-Za-z]+$/.test(nome)) {
            return interaction.reply({ content: '❌ O nome deve conter apenas letras, sem espaços ou caracteres especiais.', ephemeral: true });
        }

        if (!/^[A-Za-z]+$/.test(sobrenome)) {
            return interaction.reply({ content: '❌ O sobrenome deve conter apenas letras, sem espaços ou caracteres especiais.', ephemeral: true });
        }

        if (!/^\d+$/.test(idJogador)) {
            return interaction.reply({ content: '❌ O ID deve conter apenas números.', ephemeral: true });
        }

        const novoApelido = `${nome} ${sobrenome} | ${idJogador}`;

        const membros = await interaction.guild.members.fetch();
        const idExistente = membros.find(m => m.displayName.endsWith(`| ${idJogador}`));

        if (idExistente) {
            return interaction.reply({ content: `❌ O ID **${idJogador}** já está sendo usado por outro jogador!`, ephemeral: true });
        }

        try {
            await interaction.member.setNickname(novoApelido);

            const cargoCadastro = interaction.guild.roles.cache.get(cargoCadastroID);
            if (cargoCadastro) await interaction.member.roles.add(cargoCadastro);

            const cargoParaRemover = interaction.guild.roles.cache.get(cargoParaRemoverID);
            if (cargoParaRemover) await interaction.member.roles.remove(cargoParaRemover);

            await interaction.reply({ content: `✅ Registro concluído! Bem-vindo, **${novoApelido}**.`, ephemeral: true });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Ocorreu um erro ao tentar registrar você.', ephemeral: true });
        }
    }
});
    // Importa o Express
    const express = require('express');
    const app = express();

    // Cria uma rota simples para "pingar" o bot
    app.get('/', (req, res) => {
    res.send('Bot está online!');
    });

    // Define a porta (padrão para Replit)
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    });

// Seu token do bot
client.login(process.env.TOKEN);

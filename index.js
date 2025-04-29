const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

app.get('/', (req, res) => {
  res.send('Bot 2 está online');
});

app.listen(port, () => {
  console.log(`Servidor do Bot 2 rodando na porta ${port}`);
});

const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');
require('dotenv').config();

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
const cargoCadastroID = '1200892698786271353';
const cargoParaRemoverID = '1200929948202967100';

client.once('ready', async () => {
  console.log(`Bot 2 online como ${client.user.tag}`);

  // Keep-alive ping para o Bot 1
  setInterval(() => {
    axios.get('https://09bf4dd4-0309-4001-ab70-61d44b837b6d-00-35idm3z4bvyik.riker.replit.dev/')
      .then(() => console.log('Ping enviado para Bot 1'))
      .catch(err => console.error('Erro ao pingar Bot 1:', err.message));
  }, 4 * 60 * 1000);

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

require('./onMemberJoin')(client);

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === 'registrar') {
    const membro = await interaction.guild.members.fetch(interaction.user.id);
    const temCargoRegistrado = membro.roles.cache.has(cargoCadastroID);
    const temCargoInicial = membro.roles.cache.has(cargoParaRemoverID);

    if (temCargoRegistrado && !temCargoInicial) {
      return interaction.reply({ content: '❌ Você já está registrado.', ephemeral: true });
    }

    const modal = new ModalBuilder().setCustomId('formularioRegistro').setTitle('Registro');

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

    await interaction.showModal(modal.addComponents(
      new ActionRowBuilder().addComponents(nome),
      new ActionRowBuilder().addComponents(sobrenome),
      new ActionRowBuilder().addComponents(id)
    ));
  }

  if (interaction.isModalSubmit() && interaction.customId === 'formularioRegistro') {
    const nome = interaction.fields.getTextInputValue('nome');
    const sobrenome = interaction.fields.getTextInputValue('sobrenome');
    const idJogador = interaction.fields.getTextInputValue('id');

    if (!/^[A-Za-z]+$/.test(nome)) {
      return interaction.reply({ content: '❌ O nome deve conter apenas letras.', ephemeral: true });
    }

    if (!/^[A-Za-z]+$/.test(sobrenome)) {
      return interaction.reply({ content: '❌ O sobrenome deve conter apenas letras.', ephemeral: true });
    }

    if (!/^\d+$/.test(idJogador)) {
      return interaction.reply({ content: '❌ O ID deve conter apenas números.', ephemeral: true });
    }

    const novoApelido = `${nome} ${sobrenome} | ${idJogador}`;
    const membros = await interaction.guild.members.fetch();
    const idExistente = membros.find(m => m.displayName.endsWith(`| ${idJogador}`));

    if (idExistente) {
      return interaction.reply({ content: `❌ O ID **${idJogador}** já está em uso.`, ephemeral: true });
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
      await interaction.reply({ content: '❌ Erro ao registrar.', ephemeral: true });
    }
  }
});

client.login(process.env.TOKEN);

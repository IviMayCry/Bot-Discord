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

const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');
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
const canalPingID = 'SEU_CANAL_PING_ID';
const canalBotaoCargoID = '1208410007461302382';
const cargoVIPID = '1203715357127348277';

client.once('ready', async () => {
  console.log(`Bot 2 online como ${client.user.tag}`);

  // Envia mensagem de ativacao
  try {
    const canalPing = await client.channels.fetch(canalPingID);
    if (canalPing) {
      await canalPing.send('✅ Bot 2 está online!');
    }
  } catch (err) {
    console.error('Erro ao enviar mensagem de ping:', err);
  }

  // Ping para manter bot1 online
  setInterval(() => {
    axios.get('https://09bf4dd4-0309-4001-ab70-61d44b837b6d-00-35idm3z4bvyik.riker.replit.dev/')
      .then(() => console.log('Ping enviado para Bot 1'))
      .catch(err => console.error('Erro ao pingar Bot 1:', err.message));
  }, 4 * 60 * 1000);

  // Painel de registro
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

  // Botão para cargo VIP Inicial
  const canalBotao = await client.channels.fetch(canalBotaoCargoID);
  if (canalBotao) {
    const mensagensBotao = await canalBotao.messages.fetch({ limit: 10 });
    const jaExiste = mensagensBotao.find(msg => msg.author.id === client.user.id && msg.components.length > 0);

    if (!jaExiste) {
      const botaoCargo = new ButtonBuilder()
        .setCustomId('receber_cargo')
        .setLabel('Clique para receber o cargo!')
        .setStyle(ButtonStyle.Primary);

      const rowCargo = new ActionRowBuilder().addComponents(botaoCargo);

      const mensagemEnviada = await canalBotao.send({
        content: '🎉 Clique aqui para receber seu VIP Inicial\n\n💡 Após ganhar a TAG aqui, dar um `/VIP` no servidor.',
        components: [rowCargo]
      });

      try {
        await mensagemEnviada.pin();
      } catch (e) {
        console.log('Não foi possível fixar a mensagem:', e.message);
      }
    }
  }
});

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

    if (!/^[A-Za-z]+$/.test(nome) || !/^[A-Za-z]+$/.test(sobrenome)) {
      return interaction.reply({ content: '❌ Nome e sobrenome devem conter apenas letras.', ephemeral: true });
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

  if (interaction.isButton() && interaction.customId === 'receber_cargo') {
    const membro = await interaction.guild.members.fetch(interaction.user.id);
    const cargo = interaction.guild.roles.cache.get(cargoVIPID);
    if (cargo && !membro.roles.cache.has(cargoVIPID)) {
      await membro.roles.add(cargo);
      await interaction.reply({ content: '✅ Cargo VIP Inicial adicionado!', ephemeral: true });
    } else {
      await interaction.reply({ content: '⚠️ Você já possui esse cargo ou ele não está disponível.', ephemeral: true });
    }
  }
});

client.on('messageCreate', async message => {
  if (
    message.channel.id === canalPingID &&
    !message.author.bot &&
    message.content === '!ping-bot2'
  ) {
    await message.channel.send('✅ Bot 2 ativo!');
  }
});

require('./onMemberJoin')(client);
client.login(process.env.TOKEN);

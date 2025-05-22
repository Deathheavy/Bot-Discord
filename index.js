require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const caminhoJogos = path.join(__dirname, 'jogos.json');
const jogos = require(caminhoJogos);
const cooldowns = new Map();
const COOLDOWN_TEMPO = 6 * 60 * 60 * 1000; // 6 horas de cooldown no comando !lista

// Função para salvar jogos direto do discord
function salvarJogos() {
  fs.writeFileSync(caminhoJogos, JSON.stringify(jogos, null, 2), 'utf-8');
}

// Função para remover caracteres especiais, minúsculas etc
function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);

  client.user.setActivity({
    name: '!ajuda',
    type: ActivityType.Playing
  }); 
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const msg = message.content.trim();

  // !jogo – sorteia um aleatório
  if (msg.toLowerCase() === '!jogo') {
    console.log(`[COMANDO] !jogo usado por ${message.author.tag}`);
    const chaves = Object.keys(jogos);
    const chaveSorteada = chaves[Math.floor(Math.random() * chaves.length)];
    const jogo = jogos[chaveSorteada];
    message.channel.send(`🎲 Jogo sorteado: **${jogo.nome}**\n🔗 Download: ${jogo.link}`);
  }

  // !lista – mostra todos os jogos
  else if (msg.toLowerCase() === '!lista') {
    const agora = Date.now();
    const ultimoUso = cooldowns.get(message.author.id);

  if (ultimoUso && (agora - ultimoUso) < COOLDOWN_TEMPO) {
    const restanteMs = COOLDOWN_TEMPO - (agora - ultimoUso);
    const horas = Math.floor(restanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((restanteMs % (1000 * 60 * 60)) / (1000 * 60));
    return message.reply(`⏱️ Calma ae o ligeirinho! Use esse comando novamente em ${horas}h ${minutos}m.`);
 }

  cooldowns.set(message.author.id, agora);

  console.log(`[COMANDO] !lista usado por ${message.author.tag}`);
  const linhas = ['📋 **Jogos disponíveis:**\n', ...Object.values(jogos).map(j => `• ${j.nome}`)];

  let bloco = '';
  for (const linha of linhas) {
    if (bloco.length + linha.length + 1 > 2000) {
      message.channel.send(bloco);
      bloco = '';
    }
    bloco += linha + '\n';
  }

  if (bloco.length > 0) {
    message.channel.send(bloco);
  }
}

  // !ajuda – mostra os comandos disponíveis
else if (msg.toLowerCase() === '!ajuda') {
  console.log(`[COMANDO] !ajuda usado por ${message.author.tag}`);
  const ajuda = `
📚 **Comandos do bot:**
• !jogo — Sorteia um jogo aleatório
• !lista — Lista todos os jogos disponíveis
• !<nome do jogo> — Busca o jogo e envia o link
• !status — Mostra se o bot está online e quantos jogos tem 
• !ajuda — Mostra essa mensagem
`;
  message.channel.send(ajuda);
}

  // !status – informa o número de jogos
else if (msg.toLowerCase() === '!status') {
  console.log(`[COMANDO] !status usado por ${message.author.tag}`);
  const uptime = process.uptime();
  const minutos = Math.floor(uptime / 60);
  message.channel.send(`🤖 Estou online e tenho ${Object.keys(jogos).length} jogos cadastrados.`);
}

  // !nomedojogo – busca aproximada e envia o link
  else if (msg.startsWith('!')) {
    const busca = normalize(msg.substring(1)); // retira o "!" e normaliza

    console.log(`[COMANDO] Busca aproximada usada por ${message.author.tag}: "${msg.substring(1)}"`);

    // procura jogo cujo nome normalizado contenha a busca
    const jogoEncontrado = Object.values(jogos).find(jogo => normalize(jogo.nome).includes(busca));

    if (jogoEncontrado) {
      message.channel.send(`📦 Download **${jogoEncontrado.nome}**:\n${jogoEncontrado.link}`);
    } else {
      message.channel.send(`❌ Jogo não encontrado para: "${msg.substring(1)}"`);
    }
  }

// Adicionar jogos direto do canal
else {
  const canalPermitido = 'IDDOCANALAQUI';
  if (message.channel.id !== canalPermitido) return;

  const arquivos = message.attachments;

  if (arquivos && arquivos.size > 0) {
    const nome = msg || `Jogo ${Date.now()}`;
    const chave = nome.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const arquivo = arquivos.first();
    const link = arquivo.url;

    if (!jogos[chave]) {
      jogos[chave] = { nome, link };
      salvarJogos();
      console.log(`✅ Jogo adicionado automaticamente: ${nome} - ${link}`);
    } else {
      console.log(`⚠️ Jogo já existe: ${nome}`);
    }
  }
}
});

client.login(process.env.DISCORD_TOKEN);

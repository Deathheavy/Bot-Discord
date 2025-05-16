const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const PORT = 5500;
const jogosPath = path.join(__dirname, 'jogos.json');

app.use(express.json());
app.use(express.static('public'));  // Para servir arquivos estáticos (a interface web)


// Rota para listar os jogos
app.get('/api/jogos', (req, res) => {
  fs.readFile(jogosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });
    res.json(JSON.parse(data));
  });
});

// Rota para adicionar um jogo
app.post('/api/jogos', (req, res) => {
  const novoJogo = req.body;

  if (!novoJogo.nome || !novoJogo.link) {
    return res.status(400).json({ error: 'Faltando nome ou link' });
  }

  fs.readFile(jogosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });

    const jogos = JSON.parse(data);
    jogos[novoJogo.nome.toLowerCase()] = { nome: novoJogo.nome, link: novoJogo.link };

    fs.writeFile(jogosPath, JSON.stringify(jogos, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar arquivo' });
      res.json({ message: 'Jogo adicionado', jogo: novoJogo });
    });
  });
});

// Rota para deletar um jogo
app.delete('/api/jogos/:nome', (req, res) => {
  const nome = req.params.nome.toLowerCase();

  fs.readFile(jogosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });

    const jogos = JSON.parse(data);

    if (!jogos[nome]) return res.status(404).json({ error: 'Jogo não encontrado' });

    delete jogos[nome];

    fs.writeFile(jogosPath, JSON.stringify(jogos, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar arquivo' });
      res.json({ message: 'Jogo removido' });
    });
  });
});

// Rota para editar um jogo
app.put('/api/jogos/:nome', (req, res) => {
  const nome = req.params.nome.toLowerCase();
  const jogoEditado = req.body;

  if (!jogoEditado.nome || !jogoEditado.link) {
    return res.status(400).json({ error: 'Faltando nome ou link' });
  }

  fs.readFile(jogosPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Erro ao ler arquivo' });

    const jogos = JSON.parse(data);

    if (!jogos[nome]) return res.status(404).json({ error: 'Jogo não encontrado' });

    // Atualiza o jogo
    delete jogos[nome];
    jogos[jogoEditado.nome.toLowerCase()] = { nome: jogoEditado.nome, link: jogoEditado.link };

    fs.writeFile(jogosPath, JSON.stringify(jogos, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Erro ao salvar arquivo' });
      res.json({ message: 'Jogo atualizado', jogo: jogoEditado });
    });
  });
});


app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
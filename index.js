const express = require('express');
const mysql = require('mysql2/promise'); // Using promise version of mysql2
const app = express();
// const { createCanvas, loadImage, Image } = require('canvas');
const fs = require('fs').promises;
require('dotenv').config()

const steamApiKey = process.env.STEAM_API_KEY;
const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PSWD,
  database: process.env.MYSQL_DATABASE,
  port: Number(process.env.MYSQL_PORT),
  supportBigNumbers: true,
  bigNumberStrings: true,
};
const pool = mysql.createPool(dbConfig);
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/players/player', async (req, res) => {
  try {
    const steamId = req.query.steamid;
    const [rows, fields] = await pool.query('SELECT * FROM PlayerStats_Players WHERE PlayerID = ?', [steamId]);
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/logs/player', async (req, res) => {
  try {
    const steamId = req.query.steamid;
    const [rows, fields] = await pool.query('SELECT * FROM RaidLogs WHERE Owner = ?', [steamId]);
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/guides/guide', async (req, res) => {
  try {
    const guideId = req.query.guideId;
    const [rows, fields] = await pool.query('SELECT * FROM Website_Guides WHERE ID = ?', [guideId]);
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/guides', async (req, res) => {
  try {
    const [rows, fields] = await pool.query('SELECT ID, AuthorID, Title, Icon, `Desc`, Category FROM Website_Guides');
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/guides/create', async (req, res) => {
  try {
    const { AuthorID, Title, Desc, Icon, Category, Content } = req.body;
    await pool.query(
      'INSERT INTO Website_Guides (AuthorID, Title, `Desc`, Icon, Category, Content) VALUES (?, ?, ?, ?, ?, ?)',
      [AuthorID, Title, Desc, Icon, Category, Content]
    );
    res.json({ success: true, message: 'Data inserted successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/discord/link', async (req, res) => {
  try {
    const { SteamId, DiscordId } = req.body;
    await pool.query(
      'INSERT INTO Discord (SteamId, DiscordId) VALUES (?, ?)',
      [SteamId, DiscordId]
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/players/isadmin', async (req, res) => {
  try {
    const steamId = req.query.steamid;
    res.json({ result: ["76561198359842501", "76561198337674827"].includes(steamId) ? true : false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/discord/link', async (req, res) => {
  try {
    const steamId = req.query.steamid;
    res.json({ result: ["76561198359842501"].includes(steamId) ? true : false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/items/item', async (req, res) => {
  try {
    const item = req.query.item;
    getJsonObjectByKey(path.join(__dirname, 'items.json'), item)
    .then(jsonObject => {
      if (jsonObject) {
        res.json({ result: jsonObject });
      }
    })
    .catch(err => console.error(err));

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/items', async (req, res) => {
  try {
  getJsonObject(path.join(__dirname, 'items.json'))
  .then(jsonObject => {
    if (jsonObject) {
      res.json({ result: jsonObject });
    }
  })

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/players', async (req, res) => {
  try {
    const [rows, fields] = await pool.query('SELECT * FROM PlayerStats_Players');
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/steam/userstatsforgame', async (req, res) => {
  try {
    const steamId = req.query.steamid;
   fetch(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v0002/?appid=304930&key=${steamApiKey}&steamid=` + steamId)
  .then(response => response.json())
  .then(data => res.json({ result: data }));

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.get('/steam/usersummaries', async (req, res) => {
  try {
    const steamId = req.query.steamid;
   fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=` + steamId)
  .then(response => response.json())
  .then(data => res.json({ result: data }));

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
/*
const canvasWidth = 958;
const canvasHeight = 958;
const paddingX = 20;
const paddingY = 20; 
const cellPadding = 10;

app.get('/vault/grid', async (req, res) => {
  try {
    console.time('grid_generation');
    const x = req.query.x;
    const y = req.query.y;
    const cellColor = 'rgba(204, 204, 204, 0.2)';
    const borderColor = '#ffffff';
    const cellSize = Math.min(
      (canvasWidth - 2 * paddingX - (x - 1) * cellPadding) / x,
      (canvasHeight - 2 * paddingY - (y - 1) * cellPadding) / y
    );
    const offsetX = (canvasWidth - x * (cellSize + cellPadding) + cellPadding) / 2;
    const offsetY = (canvasHeight - y * (cellSize + cellPadding) + cellPadding) / 2;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < y; i++) {
      for (let j = 0; j < x; j++) {
        const x = offsetX + j * (cellSize + cellPadding);
        const y = offsetY + i * (cellSize + cellPadding);
        ctx.fillStyle = cellColor;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
    const buffer = canvas.toBuffer('image/png');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    console.timeEnd('grid_generation');
    res.end(buffer, 'binary');

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/vault/display', async (req, res) => {
  try {
    console.time('display_generation');
    const canvas = createCanvas(958, 958);
    const ctx = canvas.getContext('2d');
    const image = await fs.readFile('C:\\Users\\Nitro5\\Downloads\\grid.png');
    const background = new Image();
      background.src = image;
    ctx.drawImage(background, 0, 0, 958, 958);

    const cellSize = Math.min(
      (canvasWidth - 2 * paddingX - (10 - 1) * cellPadding) / 10,
      (canvasHeight - 2 * paddingY - (10 - 1) * cellPadding) / 10
    );

    const startCellX = 2;
    const startCellY = 1;
    const rectWidth = 5; 
    const rectHeight = 2;
    const offsetX = (canvasWidth - 10 * (cellSize + cellPadding) + cellPadding) / 2;
    const offsetY = (canvasHeight - 10 * (cellSize + cellPadding) + cellPadding) / 2;
    const rectX = offsetX + startCellX * (cellSize + cellPadding);
    const rectY = offsetY + startCellY * (cellSize + cellPadding);
    const rectWidthPixels = rectWidth * (cellSize + cellPadding) - cellPadding;
    const rectHeightPixels = rectHeight * (cellSize + cellPadding) - cellPadding;


    ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
    ctx.fillRect(rectX, rectY, rectWidthPixels, rectHeightPixels);
    const img = await fs.readFile('C:\\Users\\Nitro5\\Downloads\\59779.png');
    const item = new Image();
    item.src = img;
    ctx.drawImage(item, rectX, rectY, rectWidthPixels, rectHeightPixels);

    const buffer = canvas.toBuffer('image/png');
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length
    });
    res.end(buffer, 'binary');
    console.timeEnd('display_generation')

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




app.get('/vault/content', async (req, res) => {
  try {
    const steamId = req.query.steamid;
    const vaultId = req.query.vaultid;
    const [rows, fields] = await pool.query(
      'SELECT * FROM sherbetvaults_items WHERE VaultID = ? AND PlayerID = ?',
      [vaultId, steamId]
    );
    res.json({ result: rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
*/
const port = Number(process.env.PORT);
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
async function getJsonObjectByKey(filePath, key) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    if (jsonData.hasOwnProperty(key)) {
      const jsonObjectByKey = { [key]: jsonData[key] };
      return jsonObjectByKey;
    } else {
      throw new Error(`Key '${key}' not found in the JSON file.`);
    }
  } catch (err) {
    console.error(`Error reading/parsing JSON file '${filePath}':`, err.message);
    return null;
  }
}
async function getJsonObject(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContent);
    return jsonData;
  } catch (err) {
    console.error(`Error reading/parsing JSON file '${filePath}':`, err.message);
    return null;
  }
}
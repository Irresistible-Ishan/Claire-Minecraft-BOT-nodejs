# Claire AI Minecraft Bot - made in 2023

An AI-powered Minecraft bot built using Mineflayer and Google Gemini AI.

Claire is a semi-autonomous Minecraft companion that can:
- Chat naturally using AI
- Follow players
- Navigate to coordinates
- Chop trees automatically
- Collect resources
- Manage inventory
- Execute commands generated dynamically by AI

The bot behaves like an in-world Minecraft assistant instead of a traditional command bot.

---

# Features

## AI Chat Integration

Claire uses Gemini AI to understand natural language messages and convert them into Minecraft actions.

Example:

```text
claire can you bring me here
```

The AI may respond internally with:

```text
.come 120,64,-40
```

---

## Player Following

```text
.followme
```

Claire will continuously follow the player who issued the command.

Run again to stop following.

---

## Tree Chopping Automation

```text
.tree
```

Features:
- Finds nearest tree
- Equips axe automatically
- Cuts all connected logs
- Searches for more trees
- Returns to original Y level

---

## Block Collection

### Collect Dirt

```text
.dirt
```

### Collect Sand

```text
.sand
```

Features:
- Auto equips shovel
- Finds nearby blocks
- Walks to them
- Mines continuously

Run command again to stop collection.

---

## Inventory Management

### Throw Everything

```text
.throwall
```

### Throw Only Logs

```text
.throwlogs
```

### Throw Specific Item

```text
.throw diamond
```

### List Inventory

```text
.listitems
```

Example output:

```text
oak_log: 32, dirt: 14, cobblestone: 64
```

---

## Coordinate Navigation

```text
.come x,y,z
```

Example:

```text
.come 120,64,-20
```

Features:
- Uses pathfinding
- Attempts door handling
- Navigates obstacles

---

# Technologies Used

- Node.js
- Mineflayer
- mineflayer-pathfinder
- vec3
- Google Gemini 1.5 Flash API

---

# Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

---

## Install Dependencies

```bash
npm install
```

Required packages:

```bash
npm install mineflayer mineflayer-pathfinder vec3 @google/generative-ai
```

---

# Configuration

Edit bot connection settings:

```js
const bot = mineflayer.createBot({
  host: 'YOUR_SERVER_IP',
  port: 25565,
  username: 'claire',
  auth: 'offline'
});
```

---

# Gemini API Setup

Replace API key:

```js
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
```

Get API key from:
https://aistudio.google.com/app/apikey

---

# Run Bot

```bash
node index.js
```

---

# Available Commands

| Command | Description |
|---|---|
| `.followme` | Follow player |
| `.tree` | Auto chop trees |
| `.dirt` | Collect dirt |
| `.sand` | Collect sand |
| `.throwall` | Throw all inventory |
| `.throwlogs` | Throw only logs |
| `.throw item` | Throw specific item |
| `.listitems` | List inventory |
| `.come x,y,z` | Move to coordinates |

---

# AI Behavior

Claire receives:
- Nearby player coordinates
- Current chat context
- Available commands

The AI decides which Minecraft action should be executed automatically.

The prompt system is designed to:
- Minimize unnecessary text
- Prioritize commands
- Maintain immersive roleplay behavior

---

# Future Improvements

- Combat system
- Automatic mining
- Chest storage
- Farming
- Multi-agent coordination
- Memory system
- Vision integration
- Voice commands

---

# Warning

Never expose your Gemini API key publicly.

Use environment variables in production:

```bash
GEMINI_API_KEY=your_key_here
```

---

# License

MIT License

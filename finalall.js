
// throwall , throwlogs , throw item , come , tree , followme , claire , sand , dirt , listitems 

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { GoalFollow, GoalBlock } = goals;
const { Vec3 } = require('vec3');

const genAI = new GoogleGenerativeAI("AIzaSyC6eJncb6a4mF47lUqC94-aYglJv7JVApk");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const bot = mineflayer.createBot({
  host: '122.173.191.28', 
  port: 25565,           
  username: 'claire',    
  auth: 'offline',
  version: false         
});

bot.loadPlugin(pathfinder);

let following = false;
let followingUser = null;
let treeCutting = false;
let initialPosition = null;
let originalY = null; 
let digging = false;

bot.on('spawn', () => {
  console.log("Bot has spawned!");

  setTimeout(() => {

    if (bot.entity && bot.entity.position) {
      console.log("Bot position initialized.");
    } else {
      console.error("Bot position is not initialized yet.");
    }
  }, 3000); 
});


bot.on('chat', (username, message) => {
  try {
    if (message.startsWith('.come')) {
      const coords = message.match(/^\.come (-?\d+),(-?\d+),(-?\d+)$/);
      if (coords) {
        const [_, x, y, z] = coords.map(Number);
        moveToWithDoors(new Vec3(x, y, z));
      }
      return;
    }
    if (message === '.dirt' || message === '.sand') {
        const blockType = message.slice(1); // Extract dirt or  sand
        if (bot.collectingBlock === blockType) {
          bot.collectingBlock = null;
          bot.chat(`Stopped collecting ${blockType}.`);
        } else {
          bot.collectingBlock = blockType;
          collectBlock(blockType);
        }
        return;
      }
      
      
    if (message === '.throwall') {
      throwAllItems();
      return;
    }

    if (message === '.followme')  {
      if (!following) {
        following = true;
        followingUser = username;
        followPlayer(username);
      } else {
        following = false;
        followingUser = null;
        bot.pathfinder.setGoal(null);
      }
      return;
    }

    if (message === '.tree') {
      if (!treeCutting) {
        treeCutting = true;
        initialPosition = bot.entity.position.clone();
        originalY = bot.entity.position.y;
        cutNearestTree();
      } else {
        treeCutting = false;
        moveToWithDoors(initialPosition);
      }
      return;
    }

    if (message === '.throwlogs') {
      throwLogs();
      return;
    }
    if (message.startsWith('.throw ')) {
        const itemName = message.slice(7).trim(); 
        throwItem(itemName);
        return;
      }
      
    if (message === '.listitems') {
        listInventoryItems();
        return;
    }
      

    if (message.toLowerCase().startsWith('claire')) {
      chatWithAI(username, message.slice(7).trim());
      return;
    }
  } catch (error) {
    console.error(`Chat command error: ${error.message}`);
  }
});

// Follow player
function followPlayer(username) {
  const player = bot.players[username];
  if (!player || !player.entity) return;

  bot.pathfinder.setGoal(new GoalFollow(player.entity, 1), true);

  const interval = setInterval(() => {
    if (!following || !bot.players[username] || !bot.players[username].entity) {
      bot.pathfinder.setGoal(null);
      clearInterval(interval);
    }
  }, 1000);
}

function listInventoryItems() {
    const items = bot.inventory.items();
    if (items.length === 0) {
      bot.chat("Inventory is empty!");
      return;
    }
  

    const itemCounts = {};
  
    for (const item of items) {
      if (itemCounts[item.name]) {
        itemCounts[item.name] += item.count;
      } else {
        itemCounts[item.name] = item.count;
      }
    }
  
    // Convert to a string format: "item_name: amount, item_name: amount..."
    const itemList = Object.entries(itemCounts).map(([name, count]) => `${name}: ${count}`).join(', ');
  
    bot.chat(itemList);
  }
  
  
async function throwItem(itemName) {
    while (true) {
      const item = bot.inventory.items().find(i => i.name.includes(itemName));
      
      if (!item) {
        bot.chat(`No more ${itemName} in inventory!`);
        return;
      }
  
      try {
        await bot.tossStack(item);
        bot.chat(`Dropped ${item.count}x ${item.name}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      } catch (error) {
        bot.chat(`Error dropping ${itemName}: ${error.message}`);
        return;
      }
    }
}
  

function moveToWithDoors(targetPos) {
  try {

    if (!targetPos || !targetPos.x || !targetPos.y || !targetPos.z) {
      console.error("Invalid target position for moveToWithDoors.");
      return;
    }

    const doors = bot.findBlocks({
      matching: (block) => block.name.includes('door'),
      maxDistance: 10,
      count: 5
    });

    if (doors.length > 0) {
      const doorPos = bot.blockAt(doors[0]).position;
      bot.pathfinder.setGoal(new GoalBlock(doorPos.x, doorPos.y, doorPos.z));
      setTimeout(() => bot.pathfinder.setGoal(new GoalBlock(targetPos.x, targetPos.y, targetPos.z)), 3000);
    } else {
      bot.pathfinder.setGoal(new GoalBlock(targetPos.x, targetPos.y, targetPos.z));
    }
  } catch (error) {
    console.error(`Navigation error: ${error.message}`);
  }
}

// Cut trees
async function cutNearestTree() {
  if (!bot.entity || !bot.entity.position) {
    bot.chat("Bot position is not ready yet.");
    return;
  }

  const logs = bot.findBlocks({
    matching: (block) => block.name.includes('log'),
    maxDistance: 30, // Increased range
    count: 1 // Find only the closest tree
  });

  if (logs.length === 0) {
    bot.chat("No trees nearby!");
    return;
  }

  let logPos = bot.blockAt(logs[0]).position;
  const axe = bot.inventory.items().find(item => item.name.includes('axe'));

  if (axe) {
    await bot.equip(axe, 'hand'); // Equip axe onl y once
  }


  try {
    await bot.pathfinder.goto(new GoalBlock(logPos.x, logPos.y, logPos.z));
  } catch (err) {
    bot.chat("Tree is unreachable, trying another tree...");
    console.error(err);
    cutNearestTree(); 
    return;
  }

  bot.chat("Chopping tree...");

  let block = bot.blockAt(logPos);
  let choppedAll = false;

  while (!choppedAll) {
    try {
 
      while (block && block.name.includes('log')) {
        await bot.dig(block);
        await new Promise(resolve => setTimeout(resolve, 500)); 
        block = bot.blockAt(logPos); 
      }

      // After chopping the logs check if any more r left in the area
      const remainingLogs = bot.findBlocks({
        matching: (block) => block.name.includes('log'),
        maxDistance: 30,
        count: 5
      });

      if (remainingLogs.length > 0) {
 
        logPos = bot.blockAt(remainingLogs[0]).position;
        await bot.pathfinder.goto(new GoalBlock(logPos.x, logPos.y, logPos.z));
      } else {
        choppedAll = true;
        bot.chat("All logs chopped!");
      }
    } catch (err) {
      bot.chat("Error while chopping!");
      console.error(err);
      return;
    }
  }


  const currentPos = bot.entity.position;
  await bot.pathfinder.goto(new GoalBlock(currentPos.x, originalY, currentPos.z));


  if (treeCutting) {
    cutNearestTree();
  }
}

async function chatWithAI(username, userMessage) {
  try {
    console.log(`User (${username}): ${userMessage}`);

    const players = bot.players;
    let playersInfo = "Currently detected players:\n";
    for (const playerName in players) {
      if (players[playerName] && players[playerName].entity) {
        const { x, y, z } = players[playerName].entity.position;
        playersInfo += `${playerName}: x: ${Math.round(x)}, y: ${Math.round(y)}, z: ${Math.round(z)}\n`;
      }
    }

    const prompt = `
    You are in a human in Minecraft world named claire and you have control over a bot. 
    You can execute commands like .come x,y,z to move the bot to specific coordinates.
    and more like that such as : throwall , throwlogs , throw item_name , come x,y,z, tree [to start breaking trees] , follow username , sand [to collect sand], dirt [tocollect dirt] , listitems
    all with a "." prefix .
    dont write explainations when u know which command to write , dont write anyother text when u are writing a command
    if some information is missing then ask in minimal way being a cute girl
    Here are the currently detected players and their coordinates:
    ${playersInfo}

    The user who is chatting is: ${username}
    Respond to this message: ${userMessage}`;

    setTimeout(async () => {
      try {
        const result = await model.generateContent(prompt);
        const aiResponse = result.response.text();
        console.log(`AI: ${aiResponse}`);
        bot.chat(aiResponse);
      } catch (error) {
        console.error(`AI error: ${error.message}`);
      }
    }, 2000);
  } catch (error) {
    console.error(`Error in chatWithAI: ${error.message}`);
  }
}


function throwAllItems() {
  try {
    const items = bot.inventory.items();
    for (const item of items) {
      bot.tossStack(item);
    }
  } catch (error) {
    console.error(`Item drop error: ${error.message}`);
  }
}


function throwLogs() {
  try {
    const logs = bot.inventory.items().filter(item => item.name.includes('log'));
    if (logs.length === 0) {
      bot.chat("No logs in inventory to throw!");
      return;
    }

    logs.forEach(log => {
      bot.tossStack(log);
      console.log(`Throwing ${log.name}`);
    });

    bot.chat("All logs have been thrown!");
  } catch (error) {
    console.error(`Error throwing logs: ${error.message}`);
  }
}



async function collectBlock(blockType) {
    const shovel = bot.inventory.items().find(item => item.name.includes('shovel'));
    if (shovel) {
      await bot.equip(shovel, 'hand');
      bot.chat(`Equipped ${shovel.name} to collect ${blockType}.`);
    } else {
      bot.chat("No shovel found! Trying to dig anyway.");
    }
  
    while (bot.collectingBlock === blockType) {
      const block = bot.findBlock({
        matching: (b) => b.name.includes(blockType),
        maxDistance: 10
      });
  
      if (!block) {
        bot.chat(`No ${blockType} nearby!`);
        bot.collectingBlock = null;
        return;
      }
  
      try {
        await bot.pathfinder.goto(new GoalBlock(block.position.x, block.position.y, block.position.z));
        await bot.dig(block);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay before next action
      } catch (error) {
        bot.chat(`Error collecting ${blockType}: ${error.message}`);
      }
    }
  }
  


bot.on('error', (err) => {
  console.error('Bot encountered an error:', err);
});

bot.on('end', () => {
  console.log('Bot disconnected. Reconnecting...');
  bot = mineflayer.createBot({
    host: '223.236.214.98',
    port: 25565,
    username: 'claire',
    auth: 'offline',
    version: false
  });
});

const dotenv = require("dotenv");
dotenv.config();
const fetch = require('node-fetch')
const { Client, Collection, REST, Routes, GatewayIntentBits, Partials } =
  require("discord.js");
  const client = (module.exports = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
    ],
    partials: [Partials.Channel],
  }));
client.login(process.env.TOKEN);

const fs = require("fs");

const eventsPath = "./events";
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = `./${eventsPath}/${file}`;
  const event = require(filePath);
  if (event.once == true) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}
client.commands = new Collection();

const commands_json = [];

const commandsCategoryPath = "./commands";
const commandsCategoryFiles = fs.readdirSync(commandsCategoryPath);

for (const category of commandsCategoryFiles) {
  const commandsPath = `./commands/${category}`;
  const commandsFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandsFiles) {
    const command = require(`./commands/${category}/${file}`);
    client.commands.set(command.data.name, command);
    commands_json.push(command.data.toJSON());
  }
}

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

rest
  .put(Routes.applicationCommands(process.env.ID), { body: commands_json })
  .then((command) => console.log(`${command.length}개의 커맨드를 푸쉬했습니다`))
  .catch(console.error);

const mongoose = require('mongoose');
const mySecret = process.env['MONGOOSE']
const intialDbConnection = async () => {
  mongoose.connect(mySecret, {
    useNewUrlParser: true,
    autoIndex: false,
    connectTimeoutMS: 10000,
    family: 4,
    useUnifiedTopology: true
  }).then(console.log("MongoDB Connected"))
}
intialDbConnection()

// const ip = require("ip");
// (async () => {
//   console.log(ip.address())
//   if (ip.address() != "172.31.128.250") {
//     throw new Error("Ip different");
//   }
// })()

// 에러 떠도 봇 안꺼지게
process.on("uncaughtException", function(err) {
  console.log(err);
});

// 한디리 서버 수
client.on("ready", async () => {
  setInterval(async () => {
    await fetch(`https://koreanbots.dev/api/v2/bots/905355491708903485/stats`, { method: 'post', headers: { 'Authorization': "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkwNTM1NTQ5MTcwODkwMzQ4NSIsImlhdCI6MTY3MTY5MzI4Mn0.PLZUpymiTlFDpRXcUH_bH-4KGwiSPQJsBNhq_bN796sTOMuPOLyaQvrme0ZeuYgtnRZk1r9vgUAx9Q27P7j0NEkR5bTYy1vFptDs2QvtaHZAyHcfPVwF_jiXHWwbtRqbCPof6neLCq6rktnm5VULIQqo076QE5-kPgJ2ZkqH9IU", "Content-Type": "application/json" }, body: JSON.stringify({ "servers": client.guilds.cache.size, "shards": client.shard?.count }) });
  }, 600000)
});

// 버튼핸들러
client.buttons = new Collection()

const { readdirSync } = require("fs");
const buttonFiles = readdirSync("./Buttons").filter((file) =>
  file.endsWith(".js")
);

for (const file of buttonFiles) {
  const button = require(`./Buttons/${file}`);
  client.buttons.set(button.name, button);
  delete require.cache[require.resolve(`./Buttons/${file}`)];
}
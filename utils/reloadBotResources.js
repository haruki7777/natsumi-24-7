import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const disabledCommands = () =>
  new Set(
    (process.env.DISABLED_COMMANDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

const disabledCategories = () =>
  new Set(
    (process.env.DISABLED_COMMAND_CATEGORIES || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
const dashboardOnlyCommands = new Set(["tts설정"]);

const shouldSkipCommand = (category, commandName) => {
  return dashboardOnlyCommands.has(commandName)
    || disabledCategories().has(category.toLowerCase())
    || disabledCommands().has(commandName);
};

const importFresh = async (filePath) => {
  const url = pathToFileURL(filePath).href;
  return import(`${url}?reload=${Date.now()}-${Math.random().toString(36).slice(2)}`);
};

export const reloadBotResources = async (client) => {
  if (!client?.commands || !client?.buttons) {
    throw new Error("client.commands 또는 client.buttons 컬렉션이 없습니다.");
  }

  const previousCommandCount = client.commands.size;
  const previousButtonCount = client.buttons.size;
  const nextCommands = new Map();
  const nextButtons = new Map();
  const commandsJson = [];
  const errors = [];

  const commandsPath = path.join(process.cwd(), "commands");
  if (fs.existsSync(commandsPath)) {
    for (const category of fs.readdirSync(commandsPath)) {
      const categoryPath = path.join(commandsPath, category);
      if (!fs.statSync(categoryPath).isDirectory()) continue;

      for (const file of fs.readdirSync(categoryPath).filter((name) => name.endsWith(".js") || name.endsWith(".ts"))) {
        if (file === "tts_setup.js" || file === "level_setup.js") continue;
        try {
          const modulePath = path.resolve(categoryPath, file);
          const moduleExports = await importFresh(modulePath);
          const command = moduleExports.default || moduleExports;
          if (!command?.data || typeof command.execute !== "function") continue;

          const json = typeof command.data.toJSON === "function" ? command.data.toJSON() : command.data;
          const commandName = json.name || command.data.name;
          if (!commandName || shouldSkipCommand(category, commandName)) continue;

          command.category = category;
          nextCommands.set(commandName, command);
          if (!commandsJson.some((item) => item.name === json.name && (item.type || 1) === (json.type || 1))) {
            commandsJson.push(json);
          }
        } catch (error) {
          errors.push(`Command ${category}/${file}: ${error.message}`);
        }
      }
    }
  }

  const buttonsPath = path.join(process.cwd(), "Buttons");
  if (fs.existsSync(buttonsPath)) {
    for (const file of fs.readdirSync(buttonsPath).filter((name) => name.endsWith(".js") || name.endsWith(".ts"))) {
      try {
        const modulePath = path.resolve(buttonsPath, file);
        const moduleExports = await importFresh(modulePath);
        const button = moduleExports.default || moduleExports;
        if (button?.name) nextButtons.set(button.name, button);
      } catch (error) {
        errors.push(`Button ${file}: ${error.message}`);
      }
    }
  }

  client.commands.clear();
  client.buttons.clear();

  for (const [name, command] of nextCommands) client.commands.set(name, command);
  for (const [name, button] of nextButtons) client.buttons.set(name, button);

  return {
    previousCommandCount,
    previousButtonCount,
    commandCount: client.commands.size,
    buttonCount: client.buttons.size,
    commandsJson,
    errors,
  };
};

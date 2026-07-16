import { SubBots } from "meowsab";

async function sub(client) {

  global.subBots = new SubBots(client.commandSystem)
  
  SubBots.pariCode("ABCD1234") // Pairing
 
  const { config } = client;

  await global.subBots.setConfig({
    commandsPath: config.commandsPath || './plugins',
    owners: config.owners,
    prefix: config.prefix, // سيأخذ الرموز المحددة في index.js وهي ['.', '/', '!']
    info: config.info,
    printQR: false
  });

  global.subBots.on('error', (uid, error) => {
    console.error(`❌ [SubBot ${uid}] Error:`, error?.message || error);
  });

  const loadedCount = await global.subBots.load();
  console.log(`✅ Loaded ${loadedCount} saved bots`);

  global.subBots.on('ready', async (uid, sock) => {
    console.log(`✅ [SubBot ${uid}] Connected!`);
  });

  global.subBots.on('pair', (uid, code) => {
    console.log(`🔐 [SubBot ${uid}] Pairing code: ${code}`);
  });

  // معالجة الرسائل للأوامر والتفاعل المباشر
  global.subBots.on('message', async (uid, msg) => {
    if (msg.key.id.includes("3EB0")) return;

    const body = getMessageText(msg);
    const bot = global.subBots.get(uid);
    const sock = bot?.sock;

    if (!sock || !body) return;

    try {
      // 1. اختبار يدوي سريع لكلمة "تست" بدون نقطة
      if (body.trim() === "تست") {
        await sock.sendMessage(msg.key.remoteJid, {
          react: { text: "✅", key: msg.key }
        });
        return; // الخروج لكي لا يحاول معالجتها كأمر آخر
      }

      // 2. تمرير الرسالة إلى نظام معالجة الأوامر الخاص بالمكتبة لتشغيل الأوامر (مثل .اوامر) تلقائياً
      if (client.commandSystem) {
        await client.commandSystem.execute(sock, msg);
      }

    } catch (error) {
      console.error(`❌ [SubBot ${uid}] Send/Execute error:`, error?.message || error);
    }
  });

  global.subBots.on('close', (uid) => {
    console.log(`🔌 [SubBot ${uid}] Disconnected`);
  });

  global.subBots.on('badSession', (uid) => {
    console.log(`⚠️ [SubBot ${uid}] Bad session, removed`);
  });

  return global.subBots;
}

function getMessageText(msg) {
  if (!msg.message) return null;
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption) return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption) return msg.message.videoMessage.caption;
  return msg.body || null;
}

export default sub;

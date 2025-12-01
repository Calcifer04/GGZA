// ===========================================
// GGZA Discord Bot
// ===========================================

const { Client, GatewayIntentBits, Partials, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config({ path: '../.env' });

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// ===========================================
// Configuration
// ===========================================

const config = {
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://ggza-mauve.vercel.app',
  
  roles: {
    verified: process.env.DISCORD_ROLE_VERIFIED,
    unverified: process.env.DISCORD_ROLE_UNVERIFIED,
    premium: process.env.DISCORD_ROLE_PREMIUM,
    winner: process.env.DISCORD_ROLE_WINNER,
    cs2: process.env.DISCORD_ROLE_CS2,
    valorant: process.env.DISCORD_ROLE_VALORANT,
    fifa: process.env.DISCORD_ROLE_FIFA,
    fortnite: process.env.DISCORD_ROLE_FORTNITE,
    apex: process.env.DISCORD_ROLE_APEX,
  },
  
  channels: {
    verify: process.env.DISCORD_CHANNEL_VERIFY,
    announcements: process.env.DISCORD_CHANNEL_ANNOUNCEMENTS,
    audit: process.env.DISCORD_CHANNEL_AUDIT,
  },
  
  colors: {
    gold: 0xFFD700,
    success: 0x00FF00,
    error: 0xFF0000,
    info: 0x3498DB,
    cs2: 0xDE9B35,
    valorant: 0xFD4556,
    fifa: 0x326295,
    fortnite: 0x9D4DFF,
    apex: 0xDA292A,
  },
};

// ===========================================
// Slash Commands
// ===========================================

const commands = [
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Get the link to register and verify your account'),
  
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Check your verification status'),
  
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your current ranking')
    .addStringOption(option =>
      option.setName('game')
        .setDescription('Game to check rank for')
        .setRequired(false)
        .addChoices(
          { name: 'CS2', value: 'cs2' },
          { name: 'Valorant', value: 'valorant' },
          { name: 'FIFA', value: 'fifa' },
          { name: 'Fortnite', value: 'fortnite' },
          { name: 'Apex Legends', value: 'apex' },
        )),
  
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the current leaderboard')
    .addStringOption(option =>
      option.setName('game')
        .setDescription('Game to view leaderboard for')
        .setRequired(true)
        .addChoices(
          { name: 'CS2', value: 'cs2' },
          { name: 'Valorant', value: 'valorant' },
          { name: 'FIFA', value: 'fifa' },
          { name: 'Fortnite', value: 'fortnite' },
          { name: 'Apex Legends', value: 'apex' },
        )),
  
  new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('View the weekly quiz schedule'),
  
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your GGZA profile'),
  
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with GGZA commands'),
].map(command => command.toJSON());

// ===========================================
// Register Commands
// ===========================================

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(config.token);
  
  try {
    console.log('Registering slash commands...');
    
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );
    
    console.log('Successfully registered slash commands!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// ===========================================
// Event Handlers
// ===========================================

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);
  
  // Set bot status
  client.user.setPresence({
    activities: [{ name: 'GGZA Quiz Night', type: 3 }],
    status: 'online',
  });
  
  // Register commands
  await registerCommands();
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const { commandName } = interaction;
  
  try {
    switch (commandName) {
      case 'register':
        await handleRegister(interaction);
        break;
      case 'verify':
        await handleVerify(interaction);
        break;
      case 'rank':
        await handleRank(interaction);
        break;
      case 'leaderboard':
        await handleLeaderboard(interaction);
        break;
      case 'schedule':
        await handleSchedule(interaction);
        break;
      case 'profile':
        await handleProfile(interaction);
        break;
      case 'help':
        await handleHelp(interaction);
        break;
    }
  } catch (error) {
    console.error(`Error handling command ${commandName}:`, error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle('❌ Error')
      .setDescription('An error occurred while processing your command. Please try again.');
    
    await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
  }
});

// Handle new members
client.on('guildMemberAdd', async (member) => {
  // Assign unverified role
  if (config.roles.unverified) {
    try {
      await member.roles.add(config.roles.unverified);
    } catch (error) {
      console.error('Failed to assign unverified role:', error);
    }
  }
  
  // Send welcome DM
  try {
    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.colors.gold)
      .setTitle('🎮 Welcome to GGZA!')
      .setDescription(`Hey ${member.user.username}! Welcome to South Africa's premier gaming quiz hub.`)
      .addFields(
        { name: '📝 Get Started', value: `[Register & Verify](${config.appUrl}/login)` },
        { name: '🎯 Weekly Quizzes', value: 'CS2, Valorant, FIFA, Fortnite, Apex Legends' },
        { name: '💰 Cash Prizes', value: 'R1,000 weekly, R5,000 monthly finals' },
      )
      .setFooter({ text: 'GGZA • Fair Play • Local Pride' });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Register Now')
          .setStyle(ButtonStyle.Link)
          .setURL(`${config.appUrl}/login`),
        new ButtonBuilder()
          .setLabel('View Schedule')
          .setStyle(ButtonStyle.Link)
          .setURL(`${config.appUrl}/hub`),
      );
    
    await member.send({ embeds: [welcomeEmbed], components: [row] });
  } catch (error) {
    console.error('Failed to send welcome DM:', error);
  }
});

// ===========================================
// Command Handlers
// ===========================================

async function handleRegister(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('📝 Register for GGZA')
    .setDescription('Click the button below to register and verify your account on our website.')
    .addFields(
      { name: 'What you\'ll need:', value: '• Email address\n• Mobile number\n• Date of birth (18+ only)\n• Answer a quick SA knowledge question' },
      { name: 'Benefits:', value: '• Access to weekly quiz nights\n• Compete for cash prizes\n• Join the SA gaming community' },
    )
    .setFooter({ text: 'Complete verification to participate in quizzes' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Register Now')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/login`),
    );
  
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleVerify(interaction) {
  // In a real implementation, this would check the database
  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle('🔍 Verification Status')
    .setDescription('Check your full verification status on the website.')
    .setFooter({ text: 'Verification required to participate in quizzes' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Check Status')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/profile`),
    );
  
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleRank(interaction) {
  const game = interaction.options.getString('game');
  
  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('🏆 Your Ranking')
    .setDescription('View your full ranking and stats on the website.')
    .setFooter({ text: 'Rankings update after each quiz' });
  
  const url = game 
    ? `${config.appUrl}/leaderboard?game=${game}`
    : `${config.appUrl}/leaderboard`;
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('View Ranking')
        .setStyle(ButtonStyle.Link)
        .setURL(url),
    );
  
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleLeaderboard(interaction) {
  const game = interaction.options.getString('game');
  
  const gameNames = {
    cs2: 'Counter-Strike 2',
    valorant: 'VALORANT',
    fifa: 'EA FC / FIFA',
    fortnite: 'Fortnite',
    apex: 'Apex Legends',
  };
  
  const gameColors = {
    cs2: config.colors.cs2,
    valorant: config.colors.valorant,
    fifa: config.colors.fifa,
    fortnite: config.colors.fortnite,
    apex: config.colors.apex,
  };
  
  const embed = new EmbedBuilder()
    .setColor(gameColors[game] || config.colors.gold)
    .setTitle(`📊 ${gameNames[game]} Leaderboard`)
    .setDescription('View the full leaderboard on our website.')
    .addFields(
      { name: '🥇 Weekly Prizes', value: 'R500 / R300 / R200', inline: true },
      { name: '📅 Quiz Day', value: getQuizDay(game), inline: true },
    )
    .setFooter({ text: 'Best 2 quiz scores count towards weekly ranking' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('View Full Leaderboard')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/leaderboard?game=${game}`),
      new ButtonBuilder()
        .setLabel('Enter Hub')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/hub/${game}`),
    );
  
  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleSchedule(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('📅 Weekly Quiz Schedule')
    .setDescription('All quizzes start at **7:00 PM SAST**')
    .addFields(
      { name: 'Monday', value: '🎯 Counter-Strike 2', inline: true },
      { name: 'Tuesday', value: '🎯 VALORANT', inline: true },
      { name: 'Wednesday', value: '⚽ EA FC / FIFA', inline: true },
      { name: 'Thursday', value: '🏝️ Fortnite', inline: true },
      { name: 'Friday', value: '🔥 Apex Legends', inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
    )
    .addFields(
      { name: '💰 Weekly Prizes', value: '1st: R500 | 2nd: R300 | 3rd: R200' },
      { name: '🏆 Monthly Finals', value: 'R5,000 prize pool (best 6 weeks)' },
    )
    .setFooter({ text: 'Quiz reminders sent 30 minutes before start' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('View All Hubs')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/hub`),
    );
  
  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleProfile(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('👤 Your Profile')
    .setDescription('View and manage your GGZA profile on the website.')
    .addFields(
      { name: 'Profile includes:', value: '• Stats and rankings\n• Transaction history\n• Game preferences\n• Notification settings' },
    );
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('View Profile')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/profile`),
    );
  
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

async function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setColor(config.colors.gold)
    .setTitle('❓ GGZA Bot Commands')
    .setDescription('Here are all the available commands:')
    .addFields(
      { name: '/register', value: 'Get the registration link', inline: true },
      { name: '/verify', value: 'Check verification status', inline: true },
      { name: '/rank [game]', value: 'Check your ranking', inline: true },
      { name: '/leaderboard <game>', value: 'View game leaderboard', inline: true },
      { name: '/schedule', value: 'View quiz schedule', inline: true },
      { name: '/profile', value: 'View your profile', inline: true },
    )
    .addFields(
      { name: 'Need more help?', value: 'Visit our support channel or open a ticket on the website.' },
    )
    .setFooter({ text: 'GGZA • South African Gaming Quiz Hub' });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// ===========================================
// Helper Functions
// ===========================================

function getQuizDay(game) {
  const days = {
    cs2: 'Mondays',
    valorant: 'Tuesdays',
    fifa: 'Wednesdays',
    fortnite: 'Thursdays',
    apex: 'Fridays',
  };
  return days[game] || 'TBD';
}

// ===========================================
// API Functions (for website integration)
// ===========================================

// Send announcement to Discord channel
async function sendAnnouncement(title, description, color = config.colors.gold) {
  const channel = client.channels.cache.get(config.channels.announcements);
  if (!channel) return;
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
  
  await channel.send({ embeds: [embed] });
}

// Send quiz reminder
async function sendQuizReminder(game, startsIn) {
  const channel = client.channels.cache.get(config.channels.announcements);
  if (!channel) return;
  
  const gameNames = {
    cs2: 'Counter-Strike 2',
    valorant: 'VALORANT',
    fifa: 'EA FC / FIFA',
    fortnite: 'Fortnite',
    apex: 'Apex Legends',
  };
  
  const gameColors = {
    cs2: config.colors.cs2,
    valorant: config.colors.valorant,
    fifa: config.colors.fifa,
    fortnite: config.colors.fortnite,
    apex: config.colors.apex,
  };
  
  const roleId = config.roles[game];
  const mention = roleId ? `<@&${roleId}>` : '@everyone';
  
  const embed = new EmbedBuilder()
    .setColor(gameColors[game])
    .setTitle(`🎮 ${gameNames[game]} Quiz Starting Soon!`)
    .setDescription(`The quiz starts in **${startsIn}**!\n\nGet ready to test your knowledge and compete for cash prizes.`)
    .addFields(
      { name: '💰 Prizes', value: '1st: R500 | 2nd: R300 | 3rd: R200', inline: true },
      { name: '⏱️ Format', value: '30 questions, 5 seconds each', inline: true },
    )
    .setFooter({ text: 'Good luck! May the best gamer win.' });
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Join Quiz')
        .setStyle(ButtonStyle.Link)
        .setURL(`${config.appUrl}/hub/${game}`),
    );
  
  await channel.send({ content: mention, embeds: [embed], components: [row] });
}

// Log to audit channel
async function logAudit(action, details) {
  const channel = client.channels.cache.get(config.channels.audit);
  if (!channel) return;
  
  const embed = new EmbedBuilder()
    .setColor(config.colors.info)
    .setTitle('📋 Audit Log')
    .setDescription(action)
    .addFields(
      { name: 'Details', value: JSON.stringify(details, null, 2).slice(0, 1000) },
    )
    .setTimestamp();
  
  await channel.send({ embeds: [embed] });
}

// ===========================================
// Start Bot
// ===========================================

client.login(config.token);

// Export for external use
module.exports = {
  client,
  sendAnnouncement,
  sendQuizReminder,
  logAudit,
};


const Sequelize = require('sequelize');

module.exports = Object.freeze({
  BG1: {
    name: "Gloomhaven",
    bgg_id: 174430,
    bgg_score: 8.91442,
    gameplay_video_url: null,
    min_players: 1,
    max_players: 4,
    min_playing_time: 120,
    max_playing_time: 60,
    playing_time: 120,
    thumbnail: "https://cf.geekdo-images.com/thumb/img/e7GyV4PaNtwmalU-EQAGecwoBSI=/fit-in/200x150/pic2437871.jpg",
    image: "https://cf.geekdo-images.com/original/img/lDN358RgcYvQfYYN6Oy2TXpifyM=/0x0/pic2437871.jpg",
    description: "Gloomhaven  is a game of Euro-inspired tactical combat in a persistent world of shifting motives. Players will take on the role of a wandering adventurer with their own special set of skills and their own reasons for traveling to this dark corner of the world. Players must work together out of necessity to clear out menacing dungeons and forgotten ruins. In the process, they will enhance their abilities with experience and loot, discover new locations to explore and plunder, and expand an ever-branching story fueled by the decisions they make.&#10;&#10;This is a game with a persistent and changing world that is ideally played over many game sessions. After a scenario, players will make decisions on what to do, which will determine how the story continues, kind of like a &ldquo;Choose Your Own Adventure&rdquo; book. Playing through a scenario is a cooperative affair where players will fight against automated monsters using an innovative card system to determine the order of play and what a player does on their turn.&#10;&#10;Each turn, a player chooses two cards to play out of their hand. The number on the top card determines their initiative for the round. Each card also has a top and bottom power, and when it is a player&rsquo;s turn in the initiative order, they determine whether to use the top power of one card and the bottom power of the other, or vice-versa. Players must be careful, though, because over time they will permanently lose cards from their hands. If they take too long to clear a dungeon, they may end up exhausted and be forced to retreat.&#10;&#10;",
    year_published: 2017,
    category: "Adventure,Exploration,Fantasy,Fighting,Miniatures",
    mechanic: "Campaign / Battle Card Driven,Cooperative Play,Grid Movement,Hand Management,Modular Board,Role Playing,Simultaneous Action Selection,Storytelling,Variable Player Powers",
    family: "Campaign Games,Components: Miniatures,Crowdfunding: Kickstarter,Gloomhaven Universe,Legacy,Solitaire Games",
    updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
    createdAt: Sequelize.literal("(now() at time zone 'utc')")
  },

  BG2: {
    name: "Scythe",
    bgg_id: 169786,
    bgg_score: 8.29312,
    gameplay_video_url: null,
    min_players: 1,
    max_players: 5,
    min_playing_time: 115,
    max_playing_time: 90,
    playing_time: 115,
    thumbnail: "https://cf.geekdo-images.com/thumb/img/ZpuWhZuKrFry__SY8CTRuQp35rk=/fit-in/200x150/pic3163924.jpg",
    image: "https://cf.geekdo-images.com/original/img/enxCZt0Cn78-rlvmPvGtOej1ios=/0x0/pic3163924.jpg",
    description: "It is a time of unrest in 1920s Europa. The ashes from the first great war still darken the snow. The capitalistic city-state known simply as &ldquo;The Factory&rdquo;, which fueled the war with heavily armored mechs, has closed its doors, drawing the attention of several nearby countries.&#10;&#10;Scythe is an engine-building game set in an alternate-history 1920s period. It is a time of farming and war, broken hearts and rusted gears, innovation and valor. In Scythe, each player represents a character from one of five factions of Eastern Europe who are attempting to earn their fortune and claim their faction's stake in the land around the mysterious Factory. Players conquer territory, enlist new recruits, reap resources, gain villagers, build structures, and activate monstrous mechs.&#10;&#10;Each player begins the game with different resources (power, coins, combat acumen, and popularity), a different starting location, and a hidden goal. Starting positions are specially calibrated to contribute to each faction&rsquo;s uniqueness and the asymmetrical nature of the game (each faction always starts in the same place).&#10;&#10;Scythe gives players almost complete control over their fate. Other than each player&rsquo;s individual hidden objective card, the only elements of luck or variability are &ldquo;encounter&rdquo; cards that players will draw as they interact with the citizens of newly explored lands. Each encounter card provides the player with several options, allowing them to mitigate the luck of the draw through their selection. Combat is also driven by choices, not luck or randomness.&#10;&#10;Scythe uses a streamlined action-selection mechanism (no rounds or phases) to keep gameplay moving at a brisk pace and reduce downtime between turns. While there is plenty of direct conflict for players who seek it, there is no player elimination.&#10;&#10;Every part of Scythe has an aspect of engine-building to it. Players can upgrade actions to become more efficient, build structures that improve their position on the map, enlist new recruits to enhance character abilities, activate mechs to deter opponents from invading, and expand their borders to reap greater types and quantities of resources. These engine-building aspects create a sense of momentum and progress throughout the game. The order in which players improve their engine adds to the unique feel of each game, even when playing one faction multiple times.&#10;&#10;",
    year_published: 2016,
    category: "Economic,Fighting,Science Fiction,Territory Building",
    mechanic: "Area Control / Area Influence,Grid Movement,Variable Player Powers",
    family: "Alternate History,Components: Miniatures,Crowdfunding: Kickstarter,Scythe,Solitaire Games,Tableau Building",
    updatedAt: Sequelize.literal("(now() at time zone 'utc')"),
    createdAt: Sequelize.literal("(now() at time zone 'utc')")
  },
});

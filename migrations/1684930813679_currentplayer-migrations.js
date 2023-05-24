/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("current_players", {
    current_player_ID: {
      type: "integer",
      notNull: true,
    },
    game_ID: {
      type: "integer",
      notNull: true,
    },
    player_ID: {
      type: "integer",
      notNull: true,
    },
    score: {
      type: "varchar(45)",
      notNull: true,
    },
    player_color: {
      type: "varchar(45)",
      notNull: true,
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("current_players");
};

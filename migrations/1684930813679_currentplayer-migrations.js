/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("current_players", {
    id: "id",
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

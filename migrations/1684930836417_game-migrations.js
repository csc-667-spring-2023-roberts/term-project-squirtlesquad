/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("game", {
    game_ID: {
      type: "varchar(50)",
      notNull: true,
    },
    game_name: {
      type: "varchar(45)",
      notNull: false,
    },
    current_turn: {
      type: "smallint",
      notNull: true,
    },
    game_status: {
      type: "smallint",
      notNull: true,
    },
    active_card: {
      type: "varchar(45)",
      notNull: true,
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("game");
};

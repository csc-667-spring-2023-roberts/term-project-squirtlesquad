/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("card", {
    card_ID: {
      type: "integer",
      notNull: true,
    },
    game_ID: {
      type: "integer",
      notNull: true,
    },
    card_type: {
      type: "varchar(45)",
      notNull: true,
    },
    is_used: {
      type: "boolean",
      notNull: true,
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("card");
};

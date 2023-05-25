/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("pawns", {
    id: "id",
    player_ID: {
      type: "integer",
      notNull: true,
    },
    position: {
      type: "integer",
      notNull: true,
    },
    game_ID: {
      type: "integer",
      notNull: true,
    },
    zone: {
      type: "varchar(45)",
      notNull: true,
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("pawns");
};

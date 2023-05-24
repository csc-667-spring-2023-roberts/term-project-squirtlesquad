/* eslint-disable camelcase */

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.up = (pgm) => {
  pgm.createTable("player", {
    player_ID: {
      type: "varchar(70)",
      notNull: true,
      unique: true,
    },
    player_name: {
      type: "varchar(70)",
      notNull: true,
    },
    player_status: {
      type: "varchar(45)",
      notNull: true,
    },
    player_password: {
      type: "varchar(60)",
      notNull: true,
    },
  });
};

/**
 * @param {import("node-pg-migrate/dist/types").MigrationBuilder} pgm
 */
exports.down = (pgm) => {
  pgm.dropTable("player");
};

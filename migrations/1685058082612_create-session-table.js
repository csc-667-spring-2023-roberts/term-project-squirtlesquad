/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.createTable("session", {
    sid: { type: "varchar(255)", notNull: true },
    sess: { type: "json", notNull: true },
    expire: { type: "timestamp(6)", notNull: true },
  });

  pgm.addConstraint("session", "session_pkey", {
    primaryKey: "sid",
  });

  pgm.createIndex("session", "expire", { name: "IDX_session_expire" });
};

exports.down = (pgm) => {
  pgm.dropTable("session");
};

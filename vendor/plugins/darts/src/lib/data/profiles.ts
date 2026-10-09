import type { Profile } from '../model';
import { conflict, type Db } from './common';

interface ProfileRow {
  nickname: string;
  hand: Profile['hand'];
  level: Profile['level'];
  entry_mode: Profile['entryMode'];
  favorite_double: number | null;
}

export async function getProfile(db: Db, userId: number): Promise<Profile | null> {
  const [row] = await db.query<ProfileRow>(
    'SELECT nickname, hand, level, entry_mode, favorite_double FROM profiles WHERE user_id = ?',
    [userId],
  );
  if (!row) return null;
  return {
    nickname: row.nickname,
    hand: row.hand,
    level: row.level,
    entryMode: row.entry_mode,
    favoriteDouble: row.favorite_double,
  };
}

/** The profile, required before playing (409 errors.profileNeeded). */
export async function requireProfile(db: Db, userId: number): Promise<Profile> {
  const profile = await getProfile(db, userId);
  if (!profile) throw conflict('profileNeeded');
  return profile;
}

export async function saveProfile(db: Db, userId: number, p: Profile) {
  await db.execute(
    `INSERT INTO profiles (user_id, nickname, hand, level, entry_mode, favorite_double)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), hand = VALUES(hand),
       level = VALUES(level), entry_mode = VALUES(entry_mode),
       favorite_double = VALUES(favorite_double)`,
    [userId, p.nickname, p.hand, p.level, p.entryMode, p.favoriteDouble],
  );
  // The new name shows in games that have not started yet.
  await db.execute(
    `UPDATE game_players gp JOIN games g ON g.id = gp.game_id
        SET gp.display_name = ?
      WHERE gp.user_id = ? AND g.status = 'waiting'`,
    [p.nickname, userId],
  );
}

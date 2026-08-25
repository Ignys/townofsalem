export type RandomSource = () => number;

export type RoleAssignmentMap = Readonly<Record<string, string>>;

export type DrawRolesErrorCode =
  | "participant-role-count-mismatch"
  | "duplicate-player-uid"
  | "invalid-random-value";

export class DrawRolesError extends Error {
  readonly code: DrawRolesErrorCode;

  constructor(code: DrawRolesErrorCode, message: string) {
    super(message);
    this.name = "DrawRolesError";
    this.code = code;
  }
}

function shuffleCopy<Value>(
  values: readonly Value[],
  random: RandomSource,
): Value[] {
  const shuffled = [...values];

  for (let currentIndex = shuffled.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomValue = random();

    if (
      !Number.isFinite(randomValue) ||
      randomValue < 0 ||
      randomValue >= 1
    ) {
      throw new DrawRolesError(
        "invalid-random-value",
        "The random source must return a finite number from 0 (inclusive) to 1 (exclusive).",
      );
    }

    const swapIndex = Math.floor(randomValue * (currentIndex + 1));
    [shuffled[currentIndex], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[currentIndex],
    ];
  }

  return shuffled;
}

function assertValidInputs(
  playerUids: readonly string[],
  roleIds: readonly string[],
): void {
  if (playerUids.length !== roleIds.length) {
    throw new DrawRolesError(
      "participant-role-count-mismatch",
      `Cannot draw ${roleIds.length} roles for ${playerUids.length} participants.`,
    );
  }

  if (new Set(playerUids).size !== playerUids.length) {
    throw new DrawRolesError(
      "duplicate-player-uid",
      "Each participating player UID must be unique.",
    );
  }
}

export function drawRoles(
  playerUids: readonly string[],
  roleIds: readonly string[],
  random: RandomSource = Math.random,
): RoleAssignmentMap {
  assertValidInputs(playerUids, roleIds);

  const shuffledPlayerUids = shuffleCopy(playerUids, random);
  const shuffledRoleIds = shuffleCopy(roleIds, random);

  return Object.fromEntries(
    shuffledPlayerUids.map((playerUid, index) => [
      playerUid,
      shuffledRoleIds[index],
    ]),
  );
}

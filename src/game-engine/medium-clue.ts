export interface MediumClue {
  victimUid: string;
  responsiblePlayerUid: string;
  candidateUids: readonly string[];
  candidateCount: 2 | 3 | 4;
}

export function createMediumClue(
  victimUid: string,
  responsiblePlayerUid: string,
  distractionPool: readonly string[],
  candidateCount: 2 | 3 | 4,
  choose: (key: string, candidates: readonly string[]) => string,
): MediumClue {
  const available = [...new Set(distractionPool)]
    .filter((uid) => uid !== responsiblePlayerUid && uid !== victimUid);
  if (available.length < candidateCount - 1) {
    throw new Error("medium-clue-insufficient-distractions");
  }

  const distractions: string[] = [];
  while (distractions.length < candidateCount - 1) {
    const selected = choose(
      `medium-clue:${victimUid}:distraction:${distractions.length}`,
      available.filter((uid) => !distractions.includes(uid)),
    );
    distractions.push(selected);
  }

  return {
    victimUid,
    responsiblePlayerUid,
    candidateUids: [responsiblePlayerUid, ...distractions].sort(),
    candidateCount,
  };
}

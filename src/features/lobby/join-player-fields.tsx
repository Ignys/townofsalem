import { PLAYER_NAME_MAX_LENGTH } from "@/lib/utils/player-name";
import type { PlayerExperience } from "@/types";

interface JoinPlayerFieldsProps {
  nickname: string;
  experience: PlayerExperience;
  disabled: boolean;
  nicknameHasError: boolean;
  onNicknameChange: (value: string) => void;
  onExperienceChange: (value: PlayerExperience) => void;
}

export function JoinPlayerFields({
  nickname,
  experience,
  disabled,
  nicknameHasError,
  onNicknameChange,
  onExperienceChange,
}: JoinPlayerFieldsProps) {
  return (
    <div className="mt-5 grid gap-4 border-t border-[#d8c8b0] pt-5">
      <div>
        <label
          htmlFor="player-nickname"
          className="mb-2 block text-sm font-semibold text-[#3b322e]"
        >
          Nickname
        </label>
        <input
          id="player-nickname"
          name="nickname"
          type="text"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          disabled={disabled}
          required
          maxLength={PLAYER_NAME_MAX_LENGTH}
          autoComplete="nickname"
          enterKeyHint="go"
          aria-describedby="nickname-help game-action-feedback"
          aria-invalid={nicknameHasError}
          className="min-h-12 w-full rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 text-base text-[#251f1d] outline-none placeholder:text-[#a99c8c] focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15 disabled:cursor-not-allowed disabled:bg-[#e4d9c8]"
          placeholder="Como você quer ser chamado?"
        />
        <p id="nickname-help" className="mt-2 text-xs text-[#75685f]">
          Entre 1 e {PLAYER_NAME_MAX_LENGTH} caracteres.
        </p>
      </div>

      <div>
        <label
          htmlFor="player-experience"
          className="mb-2 block text-sm font-semibold text-[#3b322e]"
        >
          Experiência
        </label>
        <select
          id="player-experience"
          name="experience"
          value={experience}
          onChange={(event) =>
            onExperienceChange(event.target.value as PlayerExperience)
          }
          disabled={disabled}
          className="min-h-12 w-full rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 text-base text-[#251f1d] outline-none focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15 disabled:cursor-not-allowed disabled:bg-[#e4d9c8]"
        >
          <option value="beginner">Iniciante</option>
          <option value="experienced">Experiente</option>
        </select>
      </div>
    </div>
  );
}

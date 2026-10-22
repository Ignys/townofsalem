import { PLAYER_NAME_MAX_LENGTH } from "@/lib/utils/player-name";

interface JoinPlayerFieldsProps {
  nickname: string;
  disabled: boolean;
  nicknameHasError: boolean;
  onNicknameChange: (value: string) => void;
}

export function JoinPlayerFields({
  nickname,
  disabled,
  nicknameHasError,
  onNicknameChange,
}: JoinPlayerFieldsProps) {
  return (
    <div className="mb-5">
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
          aria-describedby="game-action-feedback"
          aria-invalid={nicknameHasError}
          className="min-h-12 w-full rounded-xl border border-[#b9a994] bg-[#fffaf1] px-4 py-3 text-base text-[#251f1d] outline-none placeholder:text-[#a99c8c] focus:border-[#7d2330] focus:ring-3 focus:ring-[#7d2330]/15 disabled:cursor-not-allowed disabled:bg-[#e4d9c8]"
          placeholder="Como você quer ser chamado?"
        />
      </div>
    </div>
  );
}

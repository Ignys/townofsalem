import { LobbySessionNotice } from "@/features/lobby/lobby-session-notice";

interface PlayerRoleNoticeProps {
  loading?: boolean;
  message: string;
}

export function PlayerRoleNotice({ loading = false, message }: PlayerRoleNoticeProps) {
  return <LobbySessionNotice loading={loading} message={message} title="Sua role" showHomeLink={false} />;
}

import { Megaphone, MessageCircleMore, MessageCircleX } from "lucide-react";

import { NightResolutionMessage } from "./night-resolution-message";
import type { NightResolutionMessageLine } from "./night-resolution-message-types";
import type { NightResolutionPresentation } from "./night-resolution-presentation";

interface NightResolutionSectionsProps {
  presentation: NightResolutionPresentation;
  onPlayerClick?: (playerUid: string) => void;
}

function EmptyMessage({ children }: Readonly<{ children: string }>) {
  return <p className="text-sm text-zinc-500">{children}</p>;
}

function lineKey(line: NightResolutionMessageLine, index: number): string {
  return `${index}:${line.parts.map((part) =>
    part.kind === "role" ? part.roleId : part.text
  ).join("")}`;
}

export function NightResolutionSections({
  presentation,
  onPlayerClick,
}: NightResolutionSectionsProps) {
  const hasPrivateInformation = presentation.hostPrivateInformation.length > 0
    || presentation.warnings.length > 0
    || presentation.resolutionDetails.length > 0;

  return (
    <div className="flex flex-col gap-5 pl-2">
      <section className="mt-3 flex items-start gap-3 border-b border-zinc-500/50 pb-4">
        <span className="text-zinc-400">
          <Megaphone aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xs font-bold tracking-[0.16em] text-zinc-400 uppercase">
            Anunciar ao fim da noite
          </h3>
          <ul className="mt-2 grid gap-1 text-sm text-zinc-300">
            {presentation.announcements.map((line, index) => (
              <li key={lineKey(line, index)}>
                <NightResolutionMessage line={line} onPlayerClick={onPlayerClick} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-start gap-3 border-b border-zinc-500/50 pb-4">
        <span className="text-zinc-400">
          <MessageCircleMore aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xs font-bold tracking-[0.16em] text-zinc-400 uppercase">
            Informar individualmente
          </h3>
          {presentation.individualMessages.length === 0 ? (
            <div className="mt-2">
              <EmptyMessage>Nenhuma informação individual nesta noite.</EmptyMessage>
            </div>
          ) : (
            <ul className="mt-2 grid gap-2">
              {presentation.individualMessages.map((group) => (
                <li
                  key={group.playerUid}
                  className="rounded-lg border border-sky-100/10 bg-black/15 px-3 py-2"
                >
                  {onPlayerClick ? (
                    <button
                      type="button"
                      onClick={() => onPlayerClick(group.playerUid)}
                      className="rounded-sm text-sm font-semibold text-sky-100 underline decoration-dotted underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                    >
                      {group.playerName}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold text-sky-100">{group.playerName}</p>
                  )}
                  <ul className="mt-1 grid gap-1 text-sm text-zinc-300">
                    {group.messages.map((message, index) => (
                      <li key={lineKey(message, index)}>
                        <NightResolutionMessage
                          line={message}
                          onPlayerClick={onPlayerClick}
                        />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="flex items-start gap-3">
        <span className="text-zinc-400">
          <MessageCircleX aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xs font-bold tracking-[0.16em] text-zinc-400 uppercase">
            Privado do mestre
          </h3>
          {!hasPrivateInformation ? (
            <div className="mt-2">
              <EmptyMessage>Nenhuma informação privada adicional.</EmptyMessage>
            </div>
          ) : (
            <div className="mt-2 grid gap-2">
              {presentation.hostPrivateInformation.length > 0 && (
                <ul className="grid gap-1 text-sm text-zinc-300">
                  {presentation.hostPrivateInformation.map((line, index) => (
                    <li key={lineKey(line, index)}>
                      <NightResolutionMessage line={line} onPlayerClick={onPlayerClick} />
                    </li>
                  ))}
                </ul>
              )}
              {presentation.warnings.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300/20 bg-red-400/10 p-2 text-sm text-red-200"
                >
                  {presentation.warnings.map((line, index) => (
                    <p key={`${index}:${line}`}>{line}</p>
                  ))}
                </div>
              )}
              {presentation.resolutionDetails.length > 0 && (
                <details className="rounded-lg border border-zinc-700 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-300">
                    Como a resolução foi calculada
                  </summary>
                  <ul className="mt-2 grid gap-1 text-xs text-zinc-400">
                    {presentation.resolutionDetails.map((line, index) => (
                      <li key={lineKey(line, index)}>
                        <NightResolutionMessage line={line} onPlayerClick={onPlayerClick} />
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { Megaphone, MessageCircleMore, MessageCircleX } from "lucide-react";

import { NightResolutionMessage } from "./night-resolution-message";
import type { NightResolutionMessageLine } from "./night-resolution-message-types";
import type { NightResolutionPresentation } from "./night-resolution-presentation";

interface NightResolutionSectionsProps {
  presentation: NightResolutionPresentation;
  onPlayerClick?: (playerUid: string) => void;
}

function EmptyMessage({ children }: Readonly<{ children: string }>) {
  return <p className="text-sm text-[#a9a297]">{children}</p>;
}

function lineKey(line: NightResolutionMessageLine, index: number): string {
  return `${index}:${line.parts.map((part) =>
    part.kind === "role" ? part.roleId : part.kind === "faction" ? part.faction : part.text
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
    <div className="flex flex-col gap-5">
      {/* Pergaminho = o que a vila ouve, como na tela dos jogadores. */}
      <section className="mt-3 flex items-start gap-3 rounded-xl border border-[#e0cfb4] bg-[#f4ead9] p-4 text-[#251f1d]">
        <span className="text-[#7d2330]">
          <Megaphone aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-base font-semibold">
            Anunciar ao fim da noite
          </h3>
          <ul className="mt-1 grid gap-1 text-sm text-[#3b322e]">
            {presentation.announcements.map((line, index) => (
              <li key={lineKey(line, index)}>
                <NightResolutionMessage line={line} onPlayerClick={onPlayerClick} light />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex items-start gap-3 border-b border-white/10 px-1 pb-5">
        <span className="text-[#bdb7ad]">
          <MessageCircleMore aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-base font-semibold text-[#fffaf0]">
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
                  className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2"
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
                  <ul className="mt-1 grid gap-1 text-sm text-[#d7d0c4]">
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

      <section className="flex items-start gap-3 px-1">
        <span className="text-[#bdb7ad]">
          <MessageCircleX aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-base font-semibold text-[#fffaf0]">
            Privado do mestre
          </h3>
          {!hasPrivateInformation ? (
            <div className="mt-2">
              <EmptyMessage>Nenhuma informação privada adicional.</EmptyMessage>
            </div>
          ) : (
            <div className="mt-2 grid gap-2">
              {presentation.hostPrivateInformation.length > 0 && (
                <ul className="grid gap-1 text-sm text-[#d7d0c4]">
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
                <details className="rounded-lg border border-white/15 px-3 py-2">
                  <summary className="cursor-pointer text-sm font-semibold text-[#d7d0c4]">
                    Como a resolução foi calculada
                  </summary>
                  <ul className="mt-2 grid gap-1 text-xs text-[#bdb7ad]">
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

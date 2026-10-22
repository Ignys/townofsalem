"use client";

import { useMemo } from "react";

import { getAvailableRoles, NEW_ROLE_IDS, ROLE_DEFINITIONS } from "@/data/roles";
import { useGameVariants } from "@/features/game-variants/use-game-variants";

import { averageSlotVirtue, estimateVirtue, getRandomRoleSlot, RANDOM_ROLE_SLOTS } from "./random-role-slots";
import { ROLE_COMPOSITION_RULES } from "./role-composition-rules";
import { useRoleComposition } from "./use-role-composition";
import { validateRoleComposition } from "./validate-role-composition";

/** Composição do lobby com tudo que se deriva dela; PC e celular leem daqui. */
export function useRoleCompositionState(gameId: string, playerCount: number, onBeforeChange?: () => void) {
    const composition = useRoleComposition(gameId);
    const selectedRoleCounts = useMemo(
        () =>
            composition.roleIds.reduce<Record<string, number>>((counts, roleId) => {
                counts[roleId] = (counts[roleId] ?? 0) + 1;
                return counts;
            }, {}),
        [composition.roleIds],
    );
    const gameVariants = useGameVariants(gameId);
    const respectCardCount = gameVariants.variants.compositionRespectsCardCount;
    const validation = validateRoleComposition({
        roleIds: composition.roleIds,
        playerCount,
        rules: { ...ROLE_COMPOSITION_RULES, enforceCardCounts: respectCardCount },
    });
    const disableNewRoles = gameVariants.variants.disableNewRoles;
    const availableRoles = getAvailableRoles(disableNewRoles);
    const randomOptions = {
        excludedRoleIds: [...gameVariants.randomRoleExclusions, ...(disableNewRoles ? NEW_ROLE_IDS : [])],
        respectCardCount: respectCardCount && gameVariants.variants.randomRolesRespectCardCount,
    };
    const virtue = estimateVirtue(composition.roleIds, randomOptions);
    const slotVirtues = Object.fromEntries(
        RANDOM_ROLE_SLOTS.map((slot) => {
            const average = averageSlotVirtue(slot.id, composition.roleIds, randomOptions);
            return [slot.id, average === null ? null : Math.round(average * 10) / 10];
        }),
    );

    const setRoleIds = async (roleIds: readonly string[]) => {
        onBeforeChange?.();
        await composition.updateRoleIds(roleIds);
    };

    const add = (roleId: string) => {
        if (respectCardCount && !getRandomRoleSlot(roleId) && (selectedRoleCounts[roleId] ?? 0) >= (ROLE_DEFINITIONS.find((role) => role.id === roleId)?.cardCount ?? 0)) {
            return;
        }

        void setRoleIds([...composition.roleIds, roleId]);
    };

    const remove = (index: number) => {
        void setRoleIds(composition.roleIds.filter((_, roleIndex) => roleIndex !== index));
    };

    return { composition, selectedRoleCounts, gameVariants, respectCardCount, validation, availableRoles, virtue, slotVirtues, setRoleIds, add, remove };
}

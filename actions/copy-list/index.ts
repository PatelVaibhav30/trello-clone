"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { CopyList } from "./schema";
import { timeLog } from "console";
import { CreateAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/lib/constant";

const handler = async (data: InputType): Promise<ReturnType> => {
    const { userId, orgId } = auth();

    if (!userId || !orgId) {
        return {
            error: "Unauthorized"
        }
    }

    const { id, boardId } = data
    let list;

    try {
        const listToCopy = await db.list.findUnique({
            where: {
                id, boardId,
                board: {
                    orgId,
                },
            },
            include: {
                cards: true
            }
        })
        if (!listToCopy) {
            return { error: "List not found" }
        }

        const lastList = await db.list.findFirst({
            where: { boardId },
            orderBy: { order: "desc" },
            select: { order: true }
        })

        const newOrder = lastList ? lastList.order + 1 : 1

        list = await db.list.create({
            data: {
                boardId: listToCopy.boardId,
                title: `${listToCopy.title} - Copy`,
                order: newOrder,
                cards: {
                    createMany: {
                        data: listToCopy.cards.map((card) => ({
                            title: card.title,
                            description: card.description,
                            order: card.order,

                        })),
                    }
                }
            },
            include:{
                cards: true
            }
        });
        await CreateAuditLog({
            entityTitle:list.title,
            entityId: list.id,
            entityType: ENTITY_TYPE.LIST,
            action: ACTION.CREATE
        })
    } catch (error) {
        return {
            error: "Failed to copy"
        }
    }

    revalidatePath(`/organization/${boardId}`)
    return { data: list };
}


export const copyList = CreateSafeAction(CopyList, handler);
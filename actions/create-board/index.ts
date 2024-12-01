"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { CreateBoard } from "./schema";
import { ACTION, ENTITY_TYPE } from "@/lib/constant";
import { CreateAuditLog } from "@/lib/create-audit-log";
import { hasAvailableCount, incrementAvailableCount } from "@/lib/org-limit";


const handler = async (data: InputType): Promise<ReturnType> => {
    const { userId, orgId } = auth();

    if (!userId || !orgId) {
        return {
            error: "Unauthorized",
        };
    }
    const canCreate = await hasAvailableCount();
    if(!canCreate){
        return{
            error:"You have reached your limit of free boards. Please upgrade to create more."
        }
    }
    const { title, image } = data;

    const [
        imageId, imageThumbUrl, imageFullUrl, imageLinkHTML, imageUserName
    ] = image.split('|');

    if (!imageId || !imageThumbUrl || !imageFullUrl || !imageLinkHTML || !imageUserName) {
        return {
            error: "Missing Fields. Failed to create board"
        }
    }

    let board;

    try {
        board = await db.board.create({
            data: { title, orgId, imageId, imageThumbUrl, imageFullUrl, imageLinkHTML, imageUserName }
        });
        
        await incrementAvailableCount();

        await CreateAuditLog({
            entityTitle:board.title,
            entityId: board.id,
            entityType: ENTITY_TYPE.BOARD,
            action: ACTION.CREATE
        })
    } catch (error) {
        return {
            error: "Failed to create."
        }
    }

    revalidatePath(`/board/${board.id}`);
    return { data: board };
}

export const createBoard = CreateSafeAction(CreateBoard, handler)
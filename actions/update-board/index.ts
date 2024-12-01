"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { UpdateBoard } from "./schema";
import { CreateAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/lib/constant";

const handler = async (data: InputType): Promise<ReturnType> => {
    const {userId, orgId} = auth();

    if(!userId || !orgId){
        return{
            error:"Unauthorized"
        }
    }

    const {title, id} = data
    let board;

    try{
        board = await db.board.update({
            where:{
                id,
                orgId
            },
            data:{
                title
            }
        })
        await CreateAuditLog({
            entityTitle:board.title,
            entityId: board.id,
            entityType: ENTITY_TYPE.BOARD,
            action: ACTION.UPDATE
        })
    }catch(error){
        return{
            error:"Failed to update"
        }
    }

    revalidatePath(`/board/${id}`)
    return {data: board};
}


export const updateBoard = CreateSafeAction(UpdateBoard, handler);
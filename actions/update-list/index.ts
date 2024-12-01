"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { UpdateList } from "./schema";
import { CreateAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/lib/constant";

const handler = async (data: InputType): Promise<ReturnType> => {
    const {userId, orgId} = auth();

    if(!userId || !orgId){
        return{
            error:"Unauthorized"
        }
    }

    const {title, id, boardId} = data
    let list;

    try{
        list = await db.list.update({
            where:{
                id,
                boardId,
                board:{
                    orgId
                },
            },
            data:{
                title,
            },
        })
        await CreateAuditLog({
            entityTitle:list.title,
            entityId: list.id,
            entityType: ENTITY_TYPE.CARD,
            action: ACTION.UPDATE
        })
    }catch(error){
        return{
            error:"Failed to update"
        }
    }

    revalidatePath(`/board/${boardId}`)
    return {data: list};
}


export const updateList = CreateSafeAction(UpdateList, handler);
"use server";

import { auth } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { DeleteList } from "./schema";

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
        list = await db.list.delete({
            where: {
                id,
                boardId,
                board:{
                    orgId,
                },
            }
        })
    } catch (error) {
        return {
            error: "Failed to delete"
        }
    }

    revalidatePath(`/organization/${boardId}`)
    return {data: list};
}


export const deleteList = CreateSafeAction(DeleteList, handler);
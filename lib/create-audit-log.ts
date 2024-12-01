import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
// enum ACTION { CREATE = "CREATE", UPDATE = "UPDATE", DELETE = "UPDATE" }
// enum ENTITY_TYPE { BOARD = "BOARD", LIST = "LIST", CARD = "CARD" }

interface Props {
    entityId: string,
    entityType: string,
    entityTitle: string,
    action: string,
}

export const CreateAuditLog = async (props: Props) => {
    try {
        const {orgId} = auth();
        const user = await currentUser();

        if(!user || !orgId){
            throw new Error("User not found");
        }

        const {entityId, entityType, entityTitle, action}  = props;

        await db.auditLog.create({
            data:{
                orgId,
                entityId,
                entityType,
                entityTitle,
                action,
                userId: user.id,
                userImage:user?.imageUrl,
                userName: user?.firstName + " " + user?.lastName,
            }
        })
    } catch (error) {
        console.log("[AUDIT_LOG_ERROR]", error);
    }
}



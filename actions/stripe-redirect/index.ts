"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { CreateSafeAction } from "@/lib/create-safe-action";
import { StripeRedirect } from "./schema";
import { CreateAuditLog } from "@/lib/create-audit-log";
import { ACTION, ENTITY_TYPE } from "@/lib/constant";
import { absoluteUrl } from "@/lib/utils";
import { stripe } from "@/lib/stripe";

const handler = async (data: InputType): Promise<ReturnType> => {
    const { userId, orgId } = auth();
    const user = await currentUser();

    if (!userId || !orgId || !user) {
        return {
            error: "Unauthorized"
        }
    }

    const settingUrl = absoluteUrl(`/orgationization/${orgId}`);

    let url = "";

    try {
        const orgSubscription = await db.orgSubscription.findUnique({
            where: {
                orgId
            },
        });
        if (orgSubscription && orgSubscription.stripeSubscriptionId) {
            const stripeSession = await stripe.billingPortal.sessions.create({
                customer: orgSubscription.stripeCustomerId,
                return_url: settingUrl,
            });

            url = stripeSession.url;
        } else {
            const stripeSession = await stripe.checkout.sessions.create({
                success_url: settingUrl,
                cancel_url: settingUrl,
                payment_method_types: ["card"],
                mode: "subscription",
                billing_address_collection: "auto",
                customer_email: user.emailAddresses[0].emailAddress,
                line_items: [
                    {
                        price_data: {
                            currency: "USD",
                            product_data: {
                                name: "Taskify Pro",
                                description: "Unlimited boards for your organization"
                            },
                            unit_amount: 2000,
                            recurring: {
                                interval: "month"
                            },
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    orgId,
                },
            });

            url = stripeSession.url || "";
        }
    } catch {
        return {
            error: "Something went wrong!"
        }
    }

    revalidatePath(`/organization/${orgId}`);
    return { data: url };
};


export const stripeRedirect = CreateSafeAction(StripeRedirect, handler);
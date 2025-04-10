"use client";

import { updateBoard } from "@/actions/update-board";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";
import { useAction } from "@/hooks/use-action";
import { Board } from "@prisma/client";
import { ElementRef, useRef, useState } from "react";
import { toast } from "sonner";
interface BoardTitleFormProps {
    data: Board
}

export const BoardTitleForm = ({ data }: BoardTitleFormProps) => {

    const { execute } = useAction(updateBoard, {
        onSuccess: (data) => {
            toast.success(`Board "${data.title}" updated!`)
            setTitle(data.title);
            disabledEditing();
        },
        onError:(error)=>{
            toast.error(error);
        }
    })
    const formRef = useRef<ElementRef<"form">>(null)
    const inputRef = useRef<ElementRef<"input">>(null)
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle]= useState(data.title)

    const enabledEditing = () => {
        //TODO: Focus inputs
        setIsEditing(true)
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
    }

    const disabledEditing = () => {
        setIsEditing(false)
    }

    const onSubmit = (FormData: FormData) => {
        const title = FormData.get("title") as string;
        execute({
            title,
            id: data.id
        })
    }

    const onBlur = () => {
        formRef.current?.requestSubmit();
    }

    if (isEditing) {
        return (
            <form action={onSubmit} ref={formRef} className="flex items-center gap-x-2">
                <FormInput
                    ref={inputRef}
                    id="title"
                    onBlur={() => onBlur()}
                    defaultValue={title}
                    className="text-lg font-bold px-[7px] py-1 h-7 bg-transparent focus-visible:outline-none focus-visible:ring-transparentborder-none"
                />
            </form>
        )
    }


    return (
        <Button onClick={enabledEditing} variant="transparent" className="font-bold text-lg h-auto w-auto p-1 px-2">
            {title}
        </Button>
    )
}


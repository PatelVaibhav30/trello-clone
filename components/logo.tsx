import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
// const headingFont = localFont({
//     src:"../public/fonts/font.woff2",

// })


export const Logo = () => {
    return (
        <div className="hover:opacity-75 transition items-center gap-x-2 hidden md:flex">
            <Link href={"/"}>
                <Image src={"/logo.png"} alt="Logo" height={30} width={30} />
            </Link>
            <p className="text-lg text-neutral-700 pb-1">Taskify</p>
        </div>
    )
}
import { ReactNode, useState } from "react";

interface ILargeCollapsableProps {
    title:string,
    children:ReactNode,
    accordionName?:string,
    onOpenCloseChange?:()=>void,
}

export default function LargeCollapsable({
    title,
    children,
    accordionName,
    onOpenCloseChange,
}: ILargeCollapsableProps) {

    const [isOpen, setIsOpen] = useState(false);
    const handleOpenCloseChange = () => {
        //setIsOpen(!isOpen);
        if (onOpenCloseChange) {
            onOpenCloseChange();
        }
    }

    return (
        <div className="collapse collapse-arrow border-base-300 bg-base-200 border w-full">
            <input type="radio" name={((accordionName===undefined)?title:accordionName)+"-accordion"} className="peer" onChange={handleOpenCloseChange} />
            <div className={"collapse-title text-lg font-medium " + (isOpen?"border-b-2 border-gray-800":"")}>{title}</div>
            <div className={"collapse-content " + (isOpen?"mt-4":"")}>
                <div className="flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    )
}
import { ReactNode, useState } from "react";

interface ICollapsableProps {
    title:string,
    children:ReactNode,
    onOpenCloseChange?:()=>void,
}

export default function Collapsable({
    title,
    children,
    onOpenCloseChange,
}: ICollapsableProps) {

    const [isOpen, setIsOpen] = useState(true);
    const handleOpenCloseChange = () => {
        setIsOpen(!isOpen);
        if (onOpenCloseChange) {
            onOpenCloseChange();
        }
    }

    return (
        <div className="collapse collapse-arrow border-base-300 bg-base-200 border w-[420px] ">
            <input type="radio" name={title+"-accordion"} className="peer cursor-pointer " checked={isOpen} onClick={handleOpenCloseChange} onChange={handleOpenCloseChange} />
            <div className={"collapse-title text-lg font-medium " + (isOpen?"border-b-2 border-gray-800":"")}>{title}</div>
            <div className={"collapse-content " + (isOpen?"mt-4":"")}>
                <div className="flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    )
}
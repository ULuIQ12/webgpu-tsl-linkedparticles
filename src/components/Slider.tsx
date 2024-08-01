interface ISliderProps {
    label:string,
    tooltip?:string,
    min:number,
    max:number,
    step:number,
    value:number,
    isInt?:boolean,
    paramName:string,
    onChange:(event, paramName:string)=>void,
}

export default function Slider({
    label,
    tooltip,
    min,
    max,
    step,
    value,
    isInt,
    paramName,
    onChange,
}: ISliderProps) {

    return (
        <div className="tooltip" data-tip={tooltip}>
        <div className="slider">                            
            <div className="sliderLabel">{label}</div>                            
            <input type="range" min={min} max={max} value={value} step={step}
                className="range range-xs flex-grow flex-shrink"
                onChange={(event) => onChange(event, paramName)}
            />
            <div className="sliderLabelValue">{isInt?value:value.toFixed(2)}</div>
        </div>
    </div>
    )
}
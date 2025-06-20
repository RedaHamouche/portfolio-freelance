import React from "react";
import {cursorClasses} from "./cursorStates"
function Arrow({direction, className, onClick}) {

    // const [style, setStyle] = useState(direction);

    const getStyle = () => {
        switch (direction) {
            case cursorClasses.top:
                return "rotate(0deg)";        
                case cursorClasses.right:
                    return "rotate(90deg)";        
            case cursorClasses.bottom:
                return "rotate(180deg)";        
            case cursorClasses.left:
                return "rotate(-90deg)";        
            case cursorClasses.topLeft:
                return "rotate(-45deg)";        
            case cursorClasses.topRight:
                return "rotate(45deg)";        
            case cursorClasses.bottomRight:
                return "rotate(135deg)";        
            case cursorClasses.bottomLeft:
                return "rotate(-135deg)";     
            default:
                break;
        }
    }
  return (
        <svg
        width={14}
        height={15}
        fill="none"
        style={{transform: getStyle()}}
        className={className}
        onClick={onClick}
        >
            <path
                d="M13.63 8.182L7.402.97a.6.6 0 00-.906 0L.269 8.182a.15.15 0 00.113.249h1.52a.303.303 0 00.227-.104L6.237 3.57v10.617c0 .083.067.151.15.151h1.126a.15.15 0 00.15-.15V3.57l4.108 4.757a.297.297 0 00.227.104h1.52a.15.15 0 00.112-.25z"
                fill="#F6F6F6"
            />
        </svg>
  );
}

export default Arrow;
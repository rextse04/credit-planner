import { useContext } from "react";
import { Notifs } from "./App";

export default function Window() {
    const [,,_window, setWindow] = useContext(Notifs);
    var title, content;
    if(_window !== null) ({title, content} = _window);
    return <div className={"window-manager " + (_window === null ? "" : "active")}>
        <div className="block window">
            <div className="container nav">
                <b>{title}</b>
                <button className="icon-btn cancel" onClick={() => setWindow(null)}>
                    <i className="fa-solid fa-circle-xmark"></i>
                </button>
            </div>
            <div className="main">{content}</div>
        </div>
    </div>;
}
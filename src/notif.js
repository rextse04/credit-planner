import { useState } from "react";

export function NotifBox({type = 1, message}) {
    const [closed, setClosed] = useState(false);
    var icon;
    switch(type) {
        case 1:
            icon = <i className="fa-solid fa-circle-info"></i>;
            break;
        case 2:
            icon = <i className="fa-solid fa-triangle-exclamation"></i>;
            break;
    }
    return <div className={"notif-box " + (closed ? "closed" : "")} data-type={type}>
        <div className={"container main"}>
            <div className="medium icon">{icon}</div>
            <div>{message}</div>
            <button className="icon-btn close"><i className="fa-solid fa-circle-xmark"
                onClick={() => setClosed(true)}></i></button>
        </div>
    </div>;
}
export default function NotifManager({notifs}) {
    return <div className="notif-manager">
        {notifs.map((notif, i) => <NotifBox key={i} {...notif}></NotifBox>)}
    </div>;
}
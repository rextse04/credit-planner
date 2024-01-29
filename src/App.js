import { createContext, useEffect, useState } from "react";
import Nav from "./nav";
import Planner from "./planner";
import NotifManager from "./notif";
import { getStorage, setStorage, useDB, useLS } from "./util";
import { Req } from "./req";
import Window from "./window";
import LoadingScreen from "./loading";
import "./App.css";
import "./nav.css";
import "./planner.css";
import "./notif.css";
import "./req.css";
import "./tooltip.css";
import "./window.css";
import "./loading.css";

// Default settings
export const catalog_url = "https://rextse04.github.io/credit-planner/catalog.json";
export const default_info = {
    last_opened: 0,
    theme: 0
};
export const default_plan = {
    title: "New Plan",
    startSem: "2310",
    sems: 16,
    courses: {},
    reqs: []
};

// Create contexts
export const Notifs = createContext();
export const Plan = createContext();
export const Theme = createContext();
export const Courses = createContext();

export const loader = new Worker(new URL("./load.js", import.meta.url));
export const syncer = new Worker(new URL("./sync.js", import.meta.url));

export const update_bc = new BroadcastChannel("update");
update_bc.addEventListener("message", event => {
    console.log("Broadcast", event.data);
});

function Main() {
    const [courses, setCourses] = useDB("courses");
    const [reqToggle, setReqToggle] = useState(false);
    return <Courses.Provider value={[courses, setCourses]}>
        <Nav></Nav>
        <div className={"container main " + (reqToggle ? "req-active" : "")}>
            <Planner setReqToggle={setReqToggle}></Planner>
            <Req setReqToggle={setReqToggle}></Req>
        </div>
    </Courses.Provider>;
}
export default function App() {
    const [notifs, setNotifs] = useState([]);
    const [_window, setWindow] = useState(null);
    const [plan, setPlan] = useState(() => getStorage("last_opened"));
    const [planData, setPlanData] = useState(default_plan);
    const [titles, setTitles] = useState(() => ({[plan]: planData.title}));
    const [theme, setTheme] = useLS("theme");
    const [ready, setReady] = useState(false);
    const addNotif = notif => setNotifs(notifs => [...notifs, notif]);
    const switchPlan = index => {
        setPlan(index);
        setStorage("last_opened", index);
    };

    loader.onmessage = event => {
        const message = event.data;
        if(message.status) {
            window[message.name] = message.content;
            if(message.name === "courses" && message.update) addNotif({
                type: 1,
                message: "Course listings updated. You may want to recheck your plan(s)."
            });
        } else {
            if(message.name === undefined) {
                window.courses = {};
            } else window[message.name] = {};
            addNotif({
                type: 2,
                message: message.fail_message
            });
            console.error(message.error);
        }
    };
    syncer.onmessage = event => {
        const message = event.data;
        if(message.type === "init") setReady(true);
        if(message.status) {
            switch(message.type) {
                case "init":
                    setTitles(message.titles);
                case "select":
                    switchPlan(message.plan);
                    setPlanData(message.content);
                    if(message.refresh) update_bc.postMessage({
                        plan: message.plan,
                        force: true
                    });
                    break;
                case "export":
                    const file = new File([message.content], message.filename);
                    const link = URL.createObjectURL(file);
                    const a = document.createElement("a");
                    a.href = link;
                    a.download = message.filename;
                    a.click();
                    URL.revokeObjectURL(link);
                    break;
                case "import":
                    switchPlan(message.plan);
                    setPlanData(message.content);
                case "copy":
                case "add":
                    setTitles({...titles, [message.plan]: message.content.title});
                    break;
                case "delete":
                    let new_titles = {...titles};
                    delete new_titles[message.plan];
                    setTitles(new_titles);
                    if(plan === message.plan) syncer.postMessage({
                        type: "select",
                        plan: +Object.keys(new_titles)[0],
                        refresh: true
                    });
                    break;
                case "update":
                    const content = message.content;
                    update_bc.postMessage({
                        plan: message.plan,
                        props: Object.keys(content),
                        content: content
                    });
            }
        } else {
            let notif_msg;
            if(message.fail_message === undefined) {
                const e = message.error;
                if(e.name === "QuotaExceededError") {
                    notif_msg = "Storage limit exceeded. Please delete some other plans before proceeding.";
                } else {
                    switch(message.type) {
                        case "init":
                            notif_msg = "Failed to load previous plans due to an unknown reason."
                            break;
                        case "query":
                            notif_msg = "Failed to load plan due to an unknown reason."
                            break;
                        default:
                            notif_msg = "Failed to save plan due to an unknown reason.";
                    }
                }
                console.error(e);
            } else notif_msg = message.fail_message;
            addNotif({
                type: 2,
                message: notif_msg
            });
        }
    }
    useEffect(() => {
        loader.postMessage({target: catalog_url});
        syncer.postMessage({
            type: "init",
            plan: plan,
            content: default_plan
        });
    }, []);

    return <div className="wrapper" data-theme={theme}>
    <Notifs.Provider value={[notifs, addNotif, _window, setWindow]}>
    <Plan.Provider value={[plan, planData, titles]}>
    <Theme.Provider value={[theme, setTheme]}>
        <Main></Main>
        <NotifManager notifs={notifs}></NotifManager>
        <Window></Window>
        {ready ? undefined : <LoadingScreen></LoadingScreen>}
    </Theme.Provider>
    </Plan.Provider>
    </Notifs.Provider>
    </div>;
}
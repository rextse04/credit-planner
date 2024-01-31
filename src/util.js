import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { Plan, default_info, default_plan, syncer, update_bc } from "./App";

// Custom Hooks
export function getStorage(key) {
    try {
        const saved = localStorage.getItem(key);
        if(saved === null) throw false;
        else return JSON.parse(saved);
    } catch {
        return default_info[key];
    }
}
export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function useBC(
    key,
    defaultValue = null,
    plan = null,
    broadcast = true,
    getProp = (key, content) => content[key]
) {
    const [value, setValue] = useState(defaultValue);
    const bindedPlan = useRef();
    bindedPlan.current = plan;
    useEffect(() => {
        const onMessage = event => {
            const message = event.data;
            if(message.plan === bindedPlan.current && key in message.content) {
                setValue(getProp(key, message.content));
            }
        };
        update_bc.addEventListener("message", onMessage);
        return () => update_bc.removeEventListener("message", onMessage);
    }, []);
    return [value, (updater, bc = true, callback = () => {}) => setValue(prev_value => {
        const new_value = typeof updater === "function" ? updater(prev_value) : updater;
        if(broadcast && bc) update_bc.postMessage({
            plan: plan,
            content: {[key]: new_value}
        });
        callback(new_value);
        return new_value;
    })];
}
// Note: The hooks below gives the caller the ownership of the localStorage prop.
// Calling them more than once for the same prop in different components can lead to bugs.
export function usePlan(key) { //self-bind LS
    const [plan, setPlan] = useState(() => getStorage(key));
    const plan_ref = useRef();
    plan_ref.current = plan;
    useEffect(() => {
        const onMessage = event => {
            const message = event.data;
            if(message.plan === plan_ref.current && "plan" in message.content) setPlan(message.content.plan);
        };
        update_bc.addEventListener("message", onMessage);
        return () => update_bc.removeEventListener("message", onMessage);
    }, []);
    return [plan, setPlan];
}
export function useLS(key) {
    const [value, setValue] = useBC(key, () => getStorage(key));
    return [value, updater => setValue(updater, true, new_value => setStorage(key, new_value))];
}
function get_prop(key, plan_data) {
    let saved = plan_data[key];
    return saved === undefined ? default_plan[key] : saved;
}
export function useDB(key) {
    const [plan, planData] = useContext(Plan);
    const [value, setValue] = useBC(key, () => get_prop(key, planData), plan, true, get_prop);
    useEffect(() => setValue(get_prop(key, planData)), [plan, planData]);
    return [value, updater => setValue(updater, true, new_value => syncer.postMessage({
        type: "update",
        plan: plan,
        content: {[key]: new_value}
    }))];
}

export function useSync(ext) {
    const [local, setLocal] = useState(ext);
    useEffect(() => setLocal(ext), [ext]);
    return [local, setLocal];
}

export function useSyncReducer(reducer, ext, init = undefined) {
    const [local, setLocal] = useState(ext, init);
    useEffect(() => setLocal(ext), [ext]);
    return [local, action => setLocal(reducer(local, action))];
}

export function useForceUpdate() {
    return useReducer(x => x + 1, 0)[1];
}

// Other Functions
export function parseSeason(season) {
    switch(season) {
        case 10: return "Fall";
        case 20: return "Winter";
        case 30: return "Spring";
        case 40: return "Summer";
    }
}
export function parseSem(sem) {
    var year = +sem.slice(0, 2);
    return `20${year}-${year - (-1)} ${parseSeason(+sem.slice(2, 4))}`;
}
export function condense(str) {
    return str.replace(/\s/g, "");
}
export function to_int(value, min = 0) {
    return Math.max(parseInt(value) || min, min);
}
import { useContext, useEffect, useMemo, useReducer, useState } from "react";
import { Plan, default_plan, syncer, update_bc } from "./App";

// Custom Hooks
export function getStorage(key) {
    return JSON.parse(localStorage.getItem(key));
}
export function setStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

// Note: These two hooks gives the caller the ownership of the localStorage prop.
// Calling them more than once for the same prop in different components can lead to bugs.
export function useLS(key) {
    const [value, setValue] = useState(getStorage(key));
    useEffect(() => update_bc.addEventListener("message", event => {
        const message = event.data;
        if(message.plan === null && key in message.props) setValue(message.content[key]);
    }), []);
    return [value, value => {
        setValue(value);
        setStorage(key, value);
        update_bc.postMessage({
            plan: null,
            props: [key],
            content: {[key]: value}
        });
    }];
}
export function get_default(plan, key) {
    var raw_key = `${plan}_${key}`;
    var saved = getStorage(raw_key);
    if(saved === null) return default_plan[key];
    else return saved;
}
export function useDB(key) {
    const [plan, planData] = useContext(Plan);
    const [value, setValue] = useState(planData[key]);
    useEffect(() => setValue(planData[key]), [plan, planData]);
    useEffect(() => update_bc.addEventListener("message", event => {
        const message = event.data;
        if(message.plan === plan && (message.force || key in message.props)) {
            setValue(message.content);
        }
    }), []);
    return [value, updater => {
        if(typeof updater === "function") setValue(prev_value => {
            const new_value = updater(prev_value);
            syncer.postMessage({
                type: "update",
                plan: plan,
                content: {[key]: new_value}
            });
            return new_value;
        });
        else {
            setValue(updater);
            syncer.postMessage({
                type: "update",
                plan: plan,
                content: {[key]: updater}
            });
        }
    }];
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
    return `20${year}-${year - 1} ${parseSeason(+sem.slice(2, 4))}`;
}
export function condense(str) {
    return str.replace(/\s/g, "");
}
export function to_int(value, min = 0) {
    return Math.max(parseInt(value) || min, min);
}
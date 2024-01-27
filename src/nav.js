import { Children, cloneElement, useContext, useEffect, useRef, useState } from "react";
import { useForceUpdate, useDB, useSync } from "./util";
import { Courses, Notifs, Plan, default_plan, syncer } from "./App";
import { check_plan } from "./planner_util";

export function MenuButton({children}) {
    const [active, setActive] = useState(false);
    const main = useRef();
    return <div ref={main} className={"menu-group " + (active ? "active" : "")} tabIndex="0"
        onBlur={event => main.current.contains(event.relatedTarget) ? undefined : setActive(false)}>
        {Children.map(children, child => cloneElement(child, {
            active: active,
            setActive: setActive,
            main: main
        }))}
    </div>;
}
function Menus({active, setActive}) {
    const [,setCourses] = useContext(Courses);
    const [,,,setWindow] = useContext(Notifs);
    return <>
        <button title="Menu" className={"icon-btn " + (active ? "active" : "")}
            onClick={() => setActive(active => !active)}>
            <i className="fa-solid fa-bars"></i>
        </button>
        <div className="block left menu menu-menu">
            <button className="text-btn text-icon container" onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json";
                input.onchange = event => syncer.postMessage({
                    type: "import",
                    content: event.target.files[0]
                });
                input.click();
                setActive(false);
            }}>
                <i className="icon fa-solid fa-file-import"></i>
                <span className="text">Import from file</span>
            </button>
            <button className="text-btn text-icon container">
                <i className="icon fa-solid fa-file-excel"></i>
                <span className="text">Export as Excel file</span>
            </button>
            <button className="text-btn text-icon container" onClick={() => {
                setCourses(courses => check_plan(courses));
                setActive(false);
            }}>
                <i className="fa-solid fa-calendar-check"></i>
                <span className="text">Recheck plan</span>
            </button>
            <button className="text-btn text-icon container" onClick={() => {
                setWindow({
                    title: "About",
                    content: <div className="vertical container about">
                        <div className="app-title">
                            <h1>Credit planner</h1>
                            <i>by Rex Tse</i>
                        </div>
                        <p><a href="https://github.com/rextse04/credit-planner">Source code</a></p>
                        <p>To report a bug or make a suggestion, you can submit an issue to the Github project linked above
                            or use this form.</p>
                        <div className="hmid"></div>
                        <p>
                            Permission is hereby granted, free of charge, to any person obtaining a copy
                            of this software and associated documentation files (the "Software"), to deal
                            in the Software without restriction, including without limitation the rights
                            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                            copies of the Software, and to permit persons to whom the Software is
                            furnished to do so, subject to the following conditions:
                        </p>
                        <p>
                            The above copyright notice and this permission notice shall be included in all
                            copies or substantial portions of the Software.
                        </p>
                        <p>
                            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                            SOFTWARE.
                        </p>
                    </div>
                });
                setActive(false);
            }}>
                <i className="fa-solid fa-circle-info"></i>
                <span className="text">About</span>
            </button>
        </div>
    </>;
}

export function TitleInput({value, setValue}) {
    const [local, setLocal] = useSync(value);
    const helper = useRef();
    const [width, setWidth] = useState(value.length + "ch");
    useEffect(() => setWidth(helper.current.offsetWidth + 5), [local])
    const updater = useForceUpdate();
    useEffect(updater, []);
    return <div className="title">
        <span ref={helper} className="helper">{local}</span>
        <input className="natural text" value={local} style={{width: width + "px"}}
            onChange={event => setLocal(event.target.value)}
            onBlur={event => setValue(event.target.value)}>    
        </input>
        <span className="edit"><i className="fa-solid fa-pen"></i></span>
    </div>;
}

function Plans({current, active, setActive, main}) {
    const [plan,, titles] = useContext(Plan);
    return <>
        <button title="View saved plans"
            className={"icon-btn " + (active ? "active" : "")}
            onClick={() => setActive(active => !active)}>
            <i className="fa-solid fa-box-archive"></i>
        </button>
        <div className="container block right menu plans-menu">
            {Object.keys(titles).map(index => {
                index = +index;
                const title = plan === index ? current : titles[index];
                return <div key={index}
                    className={"container button frame-btn " + (plan === index ? "active" : "")}
                    onClick={() => {
                        syncer.postMessage({
                            type: "select",
                            plan: index
                        });
                        setActive(false);
                    }}>
                    <span>{title}</span>
                    <div className="btn-group">
                        <button title="Duplicate plan" className="icon-btn" onClick={event => {
                            syncer.postMessage({
                                type: "copy",
                                plan: index,
                                content: {title: title + " (Copy)"}
                            });
                            event.stopPropagation();
                        }}>
                            <i className="fa-solid fa-copy"></i>
                        </button>
                        <button className="icon-btn" onClick={event => {
                            syncer.postMessage({
                                type: "export",
                                plan: index,
                                filename: title + ".json"
                            });
                            event.stopPropagation();
                        }}>
                            <i className="fa-solid fa-download"></i>
                        </button>
                        <button className="icon-btn cancel" onClick={event => {
                            syncer.postMessage({
                                type: "delete",
                                plan: index
                            });
                            main.current.focus();
                            event.stopPropagation();
                        }} disabled={Object.keys(titles).length === 1}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>;
            })}
            <button className="icon-btn add" onClick={() => syncer.postMessage({
                type: "add",
                content: default_plan
            })}>
                <div className="main">
                    <i className="fa-solid fa-circle-plus"></i>
                </div>
            </button>
        </div>
    </>;
}

export default function Nav() {
    const [title, setTitle] = useDB("title");
    return <div className="container nav">
        <MenuButton><Menus></Menus></MenuButton>
        <TitleInput value={title} setValue={setTitle}></TitleInput>
        <MenuButton><Plans current={title}></Plans></MenuButton>
    </div>;
}
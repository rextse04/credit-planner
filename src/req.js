import { useContext, useEffect, useId, useRef, useState } from "react";
import { TitleInput } from "./nav";
import { CredRow, PlaceholderCredRow } from "./planner";
import { useBC, useCollapsable, useDB, useSync } from "./hooks";
import { to_int } from "./util";
import { Courses, Notifs, syncer } from "./App";
import * as logic from "./logic";
import { swapSubCourses as gen_swapSubCourses } from "./planner_util";

class req {
    cred = 0;
    s_cred = 0;
    constructor(name = "New Requirements", content = new logic.andGroup()) {
        this.name = name;
        this.content = content;
    }
}

function RestraintField({value, setValue, caption, error}) {
    const [local, setLocal] = useSync(value);
    var class_name = error === undefined ? undefined : (
        error ? "error" : "success"
    );
    return <div className="field">
        <b>{caption}</b>
        <input value={local} type="number" min="0" className={class_name}
            onChange={event => setLocal(event.target.value)}
            onBlur={event => setValue(to_int(event.target.value))}></input>
    </div>;
}

function ReqGroup({group, setGroup, allowDel = false}) {
    const id = useId();
    const rows = [];
    const setSubCourse = function(new_member) {
        const new_members = [...group.members];
        if(new_member === null) new_members.splice(this, 1);
        else new_members[this] = new_member;
        setGroup({
            ...group,
            members: new_members
        });
    };
    const insertSubCourse = function(p, course) {
        setGroup({
            ...group,
            members: group.members.toSpliced(this+p, 0, logic.course.from_entry(course))
        })
    };
    const swapSubCourses = gen_swapSubCourses.bind(
        members => setGroup({...group, members: members}),
        group.members
    );
    const pushMember = member => {
        const new_members = [...group.members];
        new_members.push(member);
        setGroup({...group, members: new_members});
    };
    for(let i = 0; i < group.members.length; ++i) {
        const member = group.members[i];
        if(member.type === "course") {
            rows.push(<CredRow key={i} block={id} i={i} hasToggle={true}
                subCourse={member} setSubCourse={setSubCourse.bind(i)}
                insertSubCourse={insertSubCourse.bind(i)} swapSubCourses={swapSubCourses}>
            </CredRow>);
        } else {
            rows.push(<tr key={i}>
                <td colSpan="5"><ReqGroup group={member} setGroup={setSubCourse}></ReqGroup></td>
            </tr>);
        }
    }
    return <div className={"vertical sec container " + logic.get_class(group.error)} data-type={group.type}>
        <div className="btn-group">
            <button className="block text-btn" title="Add course"
                onClick={() => pushMember(new logic.course())}>
                <i className="fa-solid fa-circle-plus"></i>
            </button>
            <button className="block text-btn" title="Add AND group"
                onClick={() => pushMember(new logic.andGroup())}>
                <i className="fa-solid fa-list-check"></i>
            </button>
            <button className="block text-btn" title="Add OR group"
                onClick={() => pushMember(new logic.orGroup())}>
                <i className="fa-solid fa-list-ol"></i>
            </button>
            <button className="block text-btn" title="Add XOR group"
                onClick={() => pushMember(new logic.xorGroup())}>
                <i className="fa-solid fa-list-ul"></i>
            </button>
            {allowDel || <button className="block text-btn" title="Delete group"
                onClick={() => setGroup(null)}>
                <i className="fa-solid fa-trash"></i>
            </button>}
        </div>
        <table className="cred-tb">
            <thead>
                <tr>
                    <th className="toggle"></th>
                    <th className="code">Code</th>
                    <th className="name">Name</th>
                    <th className="cred">Credit</th>
                    <th className="del"></th>
                </tr>
                <PlaceholderCredRow block={id} enableUpper={false}
                    insertSubCourse={insertSubCourse.bind(-1)}
                    swapSubCourses={swapSubCourses}></PlaceholderCredRow>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        {group.type === "or" && <div className="footer nav restraint">
            <RestraintField caption="Min. courses:" value={group.n} error={group.error_n}
                setValue={value => setGroup({...group, n: value})}></RestraintField>
            <RestraintField caption="Min. credits:" value={group.cred} error={group.error_cred}
                setValue={value => setGroup({...group, cred: value})}></RestraintField>
        </div>}
    </div>;
}

function ReqBlock({req, setReq, index}) {
    const [active, toggle, pkg] = useCollapsable();
    return <div className={"block " + (active ? "active" : "")}>
        <div className={"nav container " + logic.get_class(req.content.error)}>
            <TitleInput value={req.name} setValue={value => setReq({
                ...req,
                name: value
            })}></TitleInput>
            <div className="btn-group">
                <button className="icon-btn" title="Update from saved"
                    onClick={() => syncer.postMessage({
                        type: "req_select",
                        req: req.name,
                        index: index
                    })}>
                    <i className="fa-solid fa-arrows-rotate"></i>
                </button>
                <button className="icon-btn" title="Save as template"
                    onClick={() => syncer.postMessage({
                        type: "req_add",
                        req: req.name,
                        content: req.content
                    })}>
                    <i className="fa-solid fa-floppy-disk"></i>
                </button>
                <button className="icon-btn" title="Export requirement block as file"
                    onClick={() => syncer.postMessage({
                        type: "req_export",
                        req: req.name,
                        content: req.content,
                        filename: req.name + ".json"
                    })}>
                    <i className="fa-solid fa-download"></i>
                </button>
                <button className="icon-btn cancel" title="Delete group" onClick={() => setReq(null)}>
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
        <div {...pkg} className="main collapsable">
            <ReqGroup group={req.content}
                setGroup={group => setReq({...req, content: group})} allowDel={true}></ReqGroup>
        </div>
        <div className="container footer nav">
            <span>Single-counted Credit(s)/ Total Credit(s)</span>
            <span>{req.s_cred}/{req.cred}</span>
        </div>
        <div className="toggle">
            <button className="icon-btn" onClick={toggle}>
                <i className="fa-solid fa-angle-up"></i>
            </button>
        </div>
    </div>;
}

function ReqRenameWindow({name, content}) {
    const [choice, setChoice] = useState();
    const [newName, setNewName] = useState("");
    const group = useId();
    const first = useId();
    const second = useId();
    return <div className="setting">
        <div className="vertical start container">
            <p>The name of the imported template, <i>{name}</i>, already exists.</p>
            <fieldset onChange={event => {
                if(event.target.type === "radio") setChoice(event.target.value);
            }}>
                <legend>Choose an option:</legend>
                <div className="field center">
                    <input type="radio" id={first} name={group} required
                        value="0" checked={choice === "0"}></input>
                    <label htmlFor={first}>Replace existing template</label>
                </div>
                <div className="field center">
                    <input type="radio" id={second} name={group} required
                        value="1" checked={choice === "1"}></input>
                    <div className="field">
                        <label htmlFor={second}>Enter a new name for the imported template:</label>
                        <input className="req-title" value={newName}
                            onChange={event => setNewName(event.target.value)}
                            onFocus={() => setChoice("1")}></input>
                    </div>
                </div>
            </fieldset>
        </div>
        <div className="container actions footer nav">
            <button className="container block text-btn" onClick={() => syncer.postMessage({
                type: "req_add",
                req: newName,
                content: content,
                force: choice === "0"
            })}>Confirm</button>
        </div>
    </div>;
}
function ReqSelect({setReqNames_ref}) {
    const [reqTitles, setReqTitles] = useBC("req_names", []);
    const [title, setTitle] = useState("");
    const id = useId();
    useEffect(() => syncer.postMessage({type: "req_names"}), []);
    setReqNames_ref.current = setReqTitles;
    return <div className="setting req-select">
        <div className="container form">
            <span>Title:</span>
            <div className="field center">
                <input list={id} className="req-title" value={title}
                    onChange={event => setTitle(event.target.value)}></input>
                <datalist id={id}>
                    {reqTitles.map(title => <option key={title} value={title}></option>)}
                </datalist>
                <div className="btn-group">
                    <button className="icon-btn" title="Export requirement block as file"
                        onClick={() => syncer.postMessage({
                            type: "req_export",
                            filename: title + ".json",
                            req: title
                        })}>
                        <i className="fa-solid fa-download"></i>
                    </button>
                    <button className="icon-btn cancel" title="Delete requirement block"
                        onClick={() => {
                            syncer.postMessage({
                                type: "req_delete",
                                req: title
                            });
                            setTitle("");
                        }}>
                        <i className="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
        <div className="container actions footer nav">
            <button className="container block text-btn" onClick={() => syncer.postMessage({
                type: "req_select",
                req: title
            })}>Confirm</button>
        </div>
    </div>;
}
export function Req({setReqToggle}) {
    const [courses] = useContext(Courses);
    const [,addNotif,,setWindow] = useContext(Notifs);
    const [reqs, setReqs] = useDB("reqs");
    const setReqNames_ref = useRef(() => {});
    useEffect(() => {
        const onMessage = event => {
            const message = event.data;
            if(message.status) switch(message.type) {
                case "req_names":
                    setReqNames_ref.current(message.content, false);
                    break;
                case "req_select":
                    if(message.index === undefined) {
                        setReqs(reqs => [...reqs, new req(message.req, message.content)]);
                        setWindow(null);
                    } else setReqs(reqs => {
                        const new_reqs = [...reqs];
                        new_reqs[message.index] = new req(message.req, message.content);
                        return new_reqs;
                    });
                    break;
                case "req_add":
                case "req_import":
                    if(message.clash) setWindow({
                        title: "Save Template",
                        content: <ReqRenameWindow name={message.req} content={message.content}></ReqRenameWindow>
                    });
                    else {
                        setReqNames_ref.current(names => [...names, message.content.name]);
                        addNotif({
                            type: 1,
                            message: message.type === "req_add" ?
                                "Template saved successfully." :
                                "Template imported successfully."
                        });
                        setWindow(null);
                    }
                    break;
                case "req_delete":
                    setReqNames_ref.current(names => names.filter(title => title !== message.req));
            }
        };
        syncer.addEventListener("message", onMessage);
        return () => syncer.removeEventListener("message", onMessage);
    }, []);
    return <div className="block req">
        <div className="container nav">
            <b>Requirements</b>
            <div className="small btn-group">
                <a className="button icon-btn info" title="Guide" target="_blank"
                    href="https://github.com/rextse04/credit-planner/blob/main/GUIDE.md">
                    <i className="fa-solid fa-circle-question"></i>
                </a>
                <button className="icon-btn cancel" title="Close tab" onClick={() => setReqToggle(false)}>
                    <i className="fa-solid fa-circle-xmark"></i>
                </button>
            </div>
        </div>
        <div className="vertical container main">
            {reqs.map((req, i) => <ReqBlock key={i} index={i} req={req} setReq={req => {
                if(req === null) {
                    setReqs(reqs.toSpliced(i, 1));
                } else {
                    var new_reqs = [...reqs];
                    new_reqs[i] = req;
                    setReqs(new_reqs);
                }
            }}></ReqBlock>)}
            <div className="large btn-group">
                <button className="large vadd" title="Add requirements block"
                    onClick={() => setReqs([...reqs, new req()])}>
                    <i className="fa-solid fa-square-plus"></i>
                </button>
                <button className="large vadd" title="Use saved requirements block"
                    onClick={() => setWindow({
                        title: "Saved requirement blocks",
                        content: <ReqSelect setReqNames_ref={setReqNames_ref}></ReqSelect>
                    })}>
                    <i className="fa-solid fa-folder-open"></i>
                </button>
            </div>
        </div>
        <div className="container actions footer nav">
            <button className="container block text-btn" onClick={() => {
                var new_reqs = [];
                for(let req of reqs) new_reqs.push({
                    ...req,
                    content: logic.reset(req.content)
                });
                setReqs(new_reqs);
            }}>Reset</button>
            <button className="container block text-btn" onClick={() => {
                var new_reqs = [];
                var courses_flat = Object.values(courses).flat();
                var counter = {};
                for(let req of reqs) {
                    let new_req = {
                        ...req,
                        content: logic.test(req.content, courses_flat)
                    };
                    new_reqs.push(new_req);
                    logic.count(new_req.content, counter);
                }
                for(let req of new_reqs) {
                    req.cred = logic.cred(req.content);
                    req.s_cred = logic.cred(req.content, counter);
                }
                setReqs(new_reqs);
            }}>Check</button>
        </div>
    </div>;
}
import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { TitleInput } from "./nav";
import { CredRow } from "./planner";
import { to_int, useDB, useSync } from "./util";
import { Courses } from "./App";
import * as logic from "./logic";

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
    var rows = [];
    for(let i = 0; i < group.members.length; ++i) {
        let member = group.members[i];
        let setSubCourse = new_member => {
            var new_members = [...group.members];
            if(new_member === null) new_members.splice(i, 1);
            else new_members[i] = new_member;
            setGroup({
                ...group,
                members: new_members
            });
        }
        if(member.type === "course") {
            rows.push(<CredRow key={i} hasToggle={true} subCourse={member} setSubCourse={setSubCourse}>
            </CredRow>);
        } else {
            rows.push(<tr key={i}>
                <td colSpan="5"><ReqGroup group={member} setGroup={setSubCourse}></ReqGroup></td>
            </tr>);
        }
    }
    var pushMember = member => {
        var new_members = [...group.members];
        new_members.push(member);
        setGroup({
            ...group,
            members: new_members
        });
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
function ReqBlock(props) {
    const {req, setReq} = props;
    const main = useRef();
    const [maxHeight, toggleTransition] = useReducer((state, action) => {
        if(state === "auto") {
            return main.current.offsetHeight + "px";
        } else {
            return "auto";
        }
    }, "auto");
    const [collapsed, setCollapsed] = useState(false);
    useEffect(() => {
        if(maxHeight !== "auto") setCollapsed(true);
    }, [maxHeight]);
    useEffect(() => {
        if(!collapsed && maxHeight !== "auto") toggleTransition();
    }, Object.values(props))
    
    return <div className={"block " + (collapsed ? "collapsed" : "")}
        style={{"--main-height": maxHeight}}>
        <div className={"nav container " + logic.get_class(req.content.error)}>
            <TitleInput value={req.name} setValue={value => setReq({
                ...req,
                name: value
            })}></TitleInput>
            <button className="icon-btn cancel" title="Delete group" onClick={() => setReq(null)}>
                <i className="fa-solid fa-trash"></i>
            </button>
        </div>
        <div ref={main} className="main">
            <ReqGroup group={req.content}
                setGroup={group => setReq({...req, content: group})} allowDel={true}></ReqGroup>
        </div>
        <div className="container footer nav">
            <span>Single-counted Credit(s)/ Total Credit(s)</span>
            <span>{req.s_cred}/{req.cred}</span>
        </div>
        <div className="toggle">
            <button className="icon-btn" onClick={() => {
                if(collapsed) setCollapsed(false);
                else {
                    if(maxHeight === "auto") toggleTransition();
                    else setCollapsed(true);
                }
            }}>
                <i className="fa-solid fa-angle-up"></i>
            </button>
        </div>
    </div>;
}
export function Req({setReqToggle}) {
    const [courses] = useContext(Courses);
    const [reqs, setReqs] = useDB("reqs");
    return <div className="block req">
        <div className="container nav">
            <b>Requirements</b>
            <div className="btn-group">
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
            {reqs.map((req, i) => <ReqBlock key={i} req={req} setReq={req => {
                if(req === null) {
                    setReqs(reqs.toSpliced(i, 1))
                } else {
                    var new_reqs = [...reqs];
                    new_reqs[i] = req;
                    setReqs(new_reqs);
                }
            }}></ReqBlock>)}
            <button className="large vadd" title="Add requirements block"
                onClick={() => setReqs([...reqs, {
                name: "New Requirements",
                content: new logic.andGroup(),
                cred: 0,
                s_cred: 0
            }])}>
                <i className="fa-solid fa-square-plus"></i>
            </button>
        </div>
        <div className="container actions footer nav">
            <button className="container block text-btn" onClick={() => {
                var new_reqs = [];
                for(let req of reqs) new_reqs.push({
                    ...req,
                    content: logic.reset(req.content)
                })
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
                    }
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
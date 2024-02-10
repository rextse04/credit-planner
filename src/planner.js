import { Children, useContext, useId, useMemo, useRef, useState } from "react";
import { useDB, useSync, useSyncReducer } from "./hooks";
import { condense, parseSeason, parseSem, to_int } from "./util";
import { Courses, Notifs } from "./App";
import * as util from "./planner_util";

export function Message({children}) {
    return <div className="vertical container block message">
        {Children.map(children, line => <p>{line}</p>)}
    </div>;
}
function req_str(ref, prop) {
    return ref[prop].type === "empty" ? "—" : ref[prop].raw;
}
export function CourseWindow({code, _ref: ref}) {
    return <div className="vertical container">
        <table className="course-info">
            <tr>
                <th>Code</th>
                <tr>{code}</tr>
            </tr>
            <tr>
                <th>Name</th>
                <td>{ref.name}</td>
            </tr>
            <tr>
                <th>Credit</th>
                <td>{ref.cred}</td>
            </tr>
            <tr>
                <th>Pre-requisite(s)</th>
                <td>{req_str(ref, "prereq")}</td>
            </tr>
            <tr>
                <th>Co-requisite(s)</th>
                <td>{req_str(ref, "coreq")}</td>
            </tr>
            <tr>
                <th>Exclusion(s)</th>
                <td>{req_str(ref, "exclusion")}</td>
            </tr>
            <tr>
                <th>Offered in</th>
                <td>{ref.sems.map(parseSeason).join(", ")}</td>
            </tr>
        </table>
    </div>;
}
function get_class(message) {
    if(message === undefined || message.length === 0) return "";
    else return "has-message";
}
export function CredRow({block, i, subCourse, setSubCourse, insertSubCourse, swapSubCourses, setCode = undefined, hasToggle = false}) {
    const [,,,setWindow] = useContext(Notifs);
    const [course, setCourse] = useSyncReducer((state, action) => ({...state, ...action}), subCourse);

    const status = useMemo(() => {
        var out = "code ";
        if(course.error === undefined) out += course.warn_code ? "warn " : "";
        else out += course.error ? "error " : (course.warn_code ? "warn " : "success ");
        return out;
    }, [course]);

    return <tr {...util.useCRDnD(block, i, course, setSubCourse, insertSubCourse, swapSubCourses)}>
        {hasToggle && <td className="toggle">
            <div className="input-wrapper">
                <button title={course.disabled ? "Enable course" : "Disable course"}
                    className={"icon-btn explicit " + (course.disabled ? "cancel" : "success")}
                    onClick={() => setSubCourse({...course, disabled: !course.disabled})}>
                    {course.disabled
                    ? <i className="fa-solid fa-square-xmark"></i>
                    : <i className="fa-solid fa-square-check"></i>}
                </button>
            </div>
        </td>}
        <td className={
            status + (get_class(course.message) || get_class(course.message_code) || " ")
        }>
            <input value={course.code}
                onChange={event => setCourse({code: condense(event.target.value)})}
                onBlur={event => {
                    var code = condense(event.target.value).toUpperCase();
                    const ref = window.courses[code];
                    if(setCode === undefined) {
                        const update = {...course, code: code};
                        if(code === "" || ref !== undefined) {
                            update.warn_code = false;
                            update.message_code = "";
                        } else {
                            update.warn_code = true;
                            update.message_code = util.msgs.unknown_code;
                        }
                        if(ref !== undefined) {
                            update.name = ref.name;
                            update.cred = ref.cred;
                        }
                        setSubCourse(update);
                    } else setCode(code, ref);
                }}
                onDoubleClick={() => {
                    const code = course.code;
                    const ref = window.courses[code];
                    if(ref !== undefined) setWindow({
                        title: "Course information",
                        content: <CourseWindow code={code} _ref={ref}></CourseWindow>
                    });
                }}></input>
            <Message>
                {course.message}
                {course.message_code}
            </Message>
        </td>
        <td className={
            "name " + (course.warn_name ? "warn " : "") + get_class(course.message_name)
        }>
            <input value={course.name}
            onChange={event => setCourse({name: event.target.value})}
            onBlur={event => {
                const ref = window.courses[course.code];
                const name = event.target.value.trim();
                const new_course = {...course, name: name};
                if(ref && ref.name !== name) {
                    new_course.warn_name = true;
                    new_course.message_name = util.msgs.name_no_match;
                } else {
                    new_course.warn_name = false;
                    new_course.message_name = "";
                }
                setSubCourse(new_course);
            }}></input>
            <Message>{course.message_name}</Message>
        </td>
        <td className={
            "cred " + (course.warn_cred ? "warn " : "") + get_class(course.message_cred)
        }>
            <input type="number" min="0" value={course.cred}
            onChange={event => setCourse({cred: event.target.value})}
            onBlur={event => {
                var ref = window.courses[course.code];
                var cred = to_int(event.target.value);
                var new_course = {...course, cred: cred};
                if(ref && ref.cred !== cred) {
                    new_course.warn_cred = true;
                    new_course.message_cred = util.msgs.cred_no_match;
                } else {
                    new_course.warn_cred = false;
                    new_course.message_cred = "";
                }
                setSubCourse(new_course);
            }}></input>
            <Message>{course.message_cred}</Message>
        </td>
        <td>
            <div className="input-wrapper">
                <button className="icon-btn cancel" title="Delete course"
                    onClick={() => setSubCourse(null)}>
                    <i className="fa-solid fa-trash"></i>
                </button>
            </div>
        </td>
    </tr>;
}

function Setting({startSem, setStartSem, sems, setSems}) {
    const [,,,setWindow] = useContext(Notifs);
    const [local_startSem, local_setStartSem] = useSync(startSem);
    const [local_sems, local_setSems] = useSync(sems);
    return <div className="setting sem-setting">
        <div className="container form">
            <span>First semester</span>
            <div className="field">
                <input className="sem_year" value={local_startSem.slice(0, -2)}
                    onChange={event => {
                        local_setStartSem(startSem => event.target.value + startSem.slice(-2))
                    }}
                    onBlur={event => {
                        local_setStartSem(startSem => {
                            var start_sem = parseInt((event.target.value % 100 + 100) % 100)
                            if(start_sem) {
                                return start_sem.toLocaleString({minimumIntegerDigits: 2}) +
                                    startSem.slice(-2);
                            } else return startSem;
                        });
                    }}></input>
                <select className="sem_sem" value={local_startSem.slice(-2)} onChange={event => {
                    local_setStartSem(startSem => startSem.slice(0, -2) + event.target.value);
                }}>
                    <option value="10">Fall</option>
                    <option value="20">Winter</option>
                    <option value="30">Spring</option>
                    <option value="40">Summer</option>
                </select>
            </div>
            <span>No. of semesters</span>
            <input className="sems" type="number" min="0" value={local_sems}
                onChange={event => local_setSems(event.target.value)}
                onBlur={event => local_setSems(to_int(event.target.value, 1))}></input>
        </div>
        <div className="container actions footer nav">
            <button className="container block text-btn" onClick={() => {
                local_setStartSem(startSem);
                local_setSems(sems);
            }}>Reset</button>
            <button className="container block text-btn" onClick={() => {
                setStartSem(local_startSem);
                setSems(local_sems);
                setWindow(null);
            }}>Confirm</button>
        </div>
    </div>;
}
export function CredBlock({sem, start = false, settings = {}, subCourses, setSubCourses, subTotalCred}) {
    const id = useId();
    const [,setCourses] = useContext(Courses);
    const [,,,setWindow] = useContext(Notifs);
    const sem_name = useMemo(() => parseSem(sem), [sem]);
    var rows = [];
    if(subCourses !== undefined) for(let i = 0; i < subCourses.length; ++i) {
        rows.push(<CredRow key={i} block={id} i={i} subCourse={subCourses[i]}
            setSubCourse={course => {
                if(course === null) {
                    const code = subCourses[i].code;
                    if(code === "") {
                        setSubCourses(subCourses.toSpliced(i, 1));
                        return;
                    }
                    util.deleteCode.apply(setCourses, [sem, i, code]);
                } else {
                    let new_subCourses = [...subCourses];
                    new_subCourses[i] = course;
                    setSubCourses(new_subCourses);
                }
            }}
            setCode={util.setCode.bind(setCourses, sem, i)}
            insertSubCourse={util.insertSubCourse.bind(setCourses, sem, i)}
            swapSubCourses={util.swapSubCourses.bind(setSubCourses, subCourses)}>
        </CredRow>);
    }
    return <div className="block-wrapper">
        <div className="block">
            <div className="container nav">
                <span>{sem_name}</span>
                {start && <button className="icon-btn" onClick={() => setWindow({
                    title: "Plan Settings",
                    content: <Setting {...settings}></Setting>
                })}>
                    <i className="fa-solid fa-gear"></i>
                </button>}
            </div>
            <div className="vertical container">
                <table className="cred-tb">
                    <thead>
                        <tr>
                            <th className="code">Code</th>
                            <th className="name">Name</th>
                            <th className="cred">Credit</th>
                            <th className="del"></th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
                <button className="icon-btn add" title="Add course" onClick={() => {
                    var new_course = new util.entry();
                    if(subCourses === undefined) setSubCourses([new_course]);
                    else setSubCourses([...subCourses, new_course]);
                }}>
                    <div className="main">
                        <i className="fa-solid fa-circle-plus"></i>
                    </div>
                </button>
            </div>
            <div className="container footer nav">
                <span>Total credit(s)</span>
                <span>{subTotalCred}</span>
            </div>
        </div>
    </div>;
}

export default function Planner({setReqToggle}) {
    const [startSem, setStartSem] = useDB("startSem");
    const [sems, setSems] = useDB("sems");
    const [courses, setCourses] = useContext(Courses);
    var year = startSem.slice(0, 2);
    var sem = parseInt(startSem.slice(2, 4));
    var blocks = [];
    var total_cred = 0;
    for(let i = 0; i < sems; ++i) {
        let sem_name = `${year}${sem}`;
        let sem_courses = courses[sem_name];
        let subtotal_cred = 0;
        let extra_props = i === 0 ? {
            start: true,
            settings: {
                startSem: startSem,
                setStartSem: setStartSem,
                sems: sems,
                setSems: setSems
            }
        } : {};
        if(sem_courses !== undefined) for(let course of sem_courses) {
            subtotal_cred += course.cred;
        }
        blocks.push(<CredBlock key={sem_name} sem={sem_name} {...extra_props}
            subCourses={courses[sem_name]} setSubCourses={sub_courses => {
                var new_courses = {...courses};
                new_courses[sem_name] = sub_courses;
                setCourses(new_courses);
            }} subTotalCred={subtotal_cred}></CredBlock>);
        total_cred += subtotal_cred;
        // Next sem
        if(sem === 40) {
            ++year;
            sem = 10;
        } else {
            sem += 10;
        }
    }
    return <div className="planner">
        <div className="main">{blocks}</div>
        <div className="aux">
            <div className="horizontal block container cred">
                <span>Total credit(s)</span>
                <b>{total_cred}</b>
            </div>
            <button className="block container text-btn req-toggle"
                onClick={() => setReqToggle(req => !req)}>Requirements</button>
        </div>
    </div>;
}
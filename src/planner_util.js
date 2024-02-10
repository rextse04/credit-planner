import { useMemo, useRef, useState } from "react";
import * as logic from "./logic";

export const dnd_activate_time = 1000;
export const format = "application/x-credit-planner.credrow+json";

export class entry {
    code = "";
    name = "";
    cred = 0;
    // error = undefined;
    // duplicate = false;
    // message = [];
    // warn_code = false;
    // message_code = [];
    // warn_name = false;
    // message_name = [];
    // warn_cred = false;
    // message_cred = [];
}

export const msgs = {
    unknown_code: "Unknown course code.",
    name_no_match: "Course name does not match record.",
    cred_no_match: "Course credit does not match record.",
    sem_no_match: "Check semester.",
    prereq_err: "Prerequisite not met.",
    coreq_err: "Co-requisite not met.",
    exclusion_err: "Note exclusions.",
    duplicate: "Duplicate course."
}

export function gen_set_course(sem_name, i, update) {
    let subcourses = (this[sem_name] = [...this[sem_name]]);
    subcourses[i] = {...subcourses[i], ...update};
    return subcourses[i];
}
export function gen_check_course(ref, sem) {
    const update = {
        error: false,
        message: [],
        warn_code: false,
        message_code: ""
    };
    const taken = this.flat();
    const current = this.toSpliced(-1, 1).flat();
    if(!ref.sems.includes(sem % 100)) {
        update.error = undefined;
        update.warn_code = true;
        update.message_code = msgs.sem_no_match;
    }
    if(logic.test(ref.prereq, current).error) {
        update.error = true;
        update.message.push(msgs.prereq_err);
    }
    if(logic.test(ref.coreq, taken).error) {
        update.error = true;
        update.message.push(msgs.coreq_err);
    }
    if(ref.exclusion.type !== "empty" && !logic.test(ref.exclusion, taken).error) {
        update.error = true;
        update.message.push(msgs.exclusion_err);
    }
    return update;
}
export function gen_update_course(code, ref, sem) {
    const empty = code === "";
    var new_course = {
        code: code,
        duplicate: false,
        warn_name: false,
        message_name: "",
        warn_cred: false,
        message_cred: ""
    };
    if(ref === undefined) {
        new_course.name = "";
        new_course.cred = 0;
        new_course.error = undefined;
        new_course.message = "";
        new_course.warn_code = !empty;
        new_course.message_code = empty ? "" : msgs.unknown_code;
    } else new_course = {
        ...new_course,
        ...this(ref, sem),
        name: ref.name,
        cred: ref.cred
    };
    return new_course;
}
export function setCode(sem, i, code, ref, prev_code = undefined) {
    const auto = prev_code === undefined;
    this(courses => {
        const empty = code === "";
        if(auto) prev_code = courses[sem][i].code;
        const prev_empty = prev_code === "";
        const new_courses = {...courses};
        const past = [];
        const set_course = gen_set_course.bind(new_courses);
        const check_course = gen_check_course.bind(past);
        const update_course = gen_update_course.bind(check_course);
        var duplicate = false;
        var prev_duplicate = false;
        for(let sem_name in courses) {
            past.push(courses[sem_name]);
            if(sem_name === sem) {
                if(auto) past.at(-1)[i] = new_courses[sem][i] = update_course(code, ref, sem);
                else set_course(sem, i, check_course(ref, sem));
            }
            if(sem_name >= sem) {
                const subcourses = courses[sem_name];
                for(let j = 0; j < subcourses.length; ++j) {
                    const course = subcourses[j];
                    const course_code = course.code;
                    if(sem_name === sem) {
                        if(i === j) continue;
                        else if(!empty && course_code === code) {
                            if(!duplicate) {
                                duplicate = true;
                                set_course(sem, i, {message: msgs.duplicate});
                            }
                            set_course(sem, j, {
                                error: true,
                                duplicate: true,
                                message: msgs.duplicate
                            });
                            continue;
                        } else if(!prev_empty && course_code === prev_code) {
                            if(!prev_duplicate) {
                                set_course(sem, j, {
                                    error: window.courses[prev_code] === undefined ? undefined : false,
                                    duplicate: false
                                });
                                prev_duplicate = true;
                            }
                        }
                    }
                    const course_ref = window.courses[course_code];
                    if(!course.duplicate && course_ref !== undefined) {
                        let check = false;
                        if(!empty) {
                            check = (
                                (sem_name !== sem && logic.includes(course_ref.prereq, code)) ||
                                logic.includes(course_ref.coreq, code) ||
                                logic.includes(course_ref.exclusion, code)
                            );
                        }
                        if(!check && !prev_empty) {
                            check = (
                                (sem_name !== sem && logic.includes(course_ref.prereq, prev_code)) ||
                                logic.includes(course_ref.coreq, prev_code) ||
                                logic.includes(course_ref.exclusion, prev_code)
                            )
                        }
                        if(check) set_course(sem_name, j, check_course(course_ref, sem));
                    }
                }
            }
        }
        return new_courses;
    });
}
export function insertSubCourse(sem, i, p, subCourse) {
    this(courses => {
        const new_courses = {...courses};
        new_courses[sem] = new_courses[sem].toSpliced(i+p, 0, subCourse);
        var out;
        const code = subCourse.code;
        setCode.apply(
            updater => out = updater(new_courses),
            [sem, i+p, code, window.courses[code], ""]
        );
        return out;
    });
}
export function deleteCode(sem, i, code) {
    this(courses => {
        const new_courses = {...courses};
        const past = [];
        const set_course = gen_set_course.bind(new_courses);
        const check_course = gen_check_course.bind(past);
        let duplicate = false;
        new_courses[sem] = new_courses[sem].toSpliced(i, 1);
        for(let sem_name in new_courses) {
            past.push(new_courses[sem_name]);
            if(sem_name >= sem) {
                const sub_courses = new_courses[sem_name];
                for(let j = 0; j < sub_courses.length; ++j) {
                    const course = sub_courses[j];
                    const course_code = course.code;
                    if(sem_name === sem && course_code === code) {
                        if(duplicate) {
                            set_course(sem, j, {
                                error: true,
                                duplicate: true,
                                message: msgs.duplicate
                            });
                        } else {
                            const ref = window.courses[code];
                            let update = {
                                error: ref === undefined ? undefined : false,
                                duplicate: false
                            };
                            if(ref !== undefined) update = {...update, ...check_course(ref, sem)};
                            set_course(sem, j, update);
                            duplicate = true;
                        }
                        continue;
                    }
                    const course_ref = window.courses[course_code];
                    if(course_ref !== undefined)
                    if(!course.duplicate && (
                        (sem_name !== sem && logic.includes(course_ref.prereq, code)) ||
                        logic.includes(course_ref.coreq, code) ||
                        logic.includes(course_ref.exclusion, code)
                    )) set_course(sem_name, j, check_course(course_ref, sem));
                }
            }
        }
        return new_courses;
    });
}
export function swapSubCourses(subCourses, i, j, p) {
    if(i === j) return;
    this(subCourses
        .toSpliced(j+p, 0, subCourses[i])
        .toSpliced(j+p < i ? i+1 : i, 1)
    );
}

export function check_plan(courses) {
    const past = [];
    const check_course = gen_check_course.bind(past);
    const update_course = gen_update_course.bind(check_course);
    const new_courses = {...courses};
    for(let sem in courses) {
        const sub_courses = {...new_courses[sem]};
        past.push(sub_courses);
        const current = {};
        for(let i = 0; i < sub_courses.length; ++i) {
            const course = sub_courses[i];
            const code = course.code;
            let ri = current[code];
            if(ri === undefined) {
                sub_courses[i] = {
                    ...course,
                    error: true,
                    duplicate: true,
                    message: msgs.duplicate
                };
                sub_courses[ri] = {...course, duplicate: true};
            } else {
                current[code] = i;
                const ref = window.courses[code];
                sub_courses[i] = update_course(code, ref, sem);
            }
        }
    }
    return new_courses;
}

/** Use Credit Row Drag and Drop */
export function useCRDnD(block, i, course, setSubCourse, insertSubCourse, swapSubCourses, enableUpper = true) {
    const [pressed, setPressed] = useState(false);
    const timeout_id = useRef();
    const [drag, setDrag] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [offsetX, setOffsetX] = useState(null);
    const [offsetY, setOffsetY] = useState(null);
    const [overIndex, setOverIndex] = useState(null);
    const main = useRef();
    const cancel = () => {
        clearTimeout(timeout_id.current);
        setPressed(false);
        setDrag(false);
        setDragging(false);
        setOffsetX(null);
        setOffsetY(null);
    };

    const className = useMemo(() => {
        var out = "";
        if(drag) out += "block ";
        if(dragging) out += "drag ";
        switch(overIndex) {
            case 0: out += "drag-over before"; break;
            case 1: out += "drag-over after";
        }
        return out;
    }, [drag, dragging, overIndex]);

    const out = {
        ref: main,
        className: className,
        draggable: drag,
        tabIndex: 0,
        style: {left: offsetX, top: offsetY},
        onPointerDown: event => {
            setPressed(true);
            timeout_id.current = setTimeout(() => {
                setPressed(false);
                setDrag(true);
            }, dnd_activate_time);
            event.target.setPointerCapture(event.pointerId);
        },
        onDragStart: event => {
            event.dataTransfer.dropEffect = "move";
            event.dataTransfer.setData(format, JSON.stringify({
                ...course,
                block: block,
                i: i
            }));
            event.dataTransfer.setDragImage(event.target, window.outerWidth, window.outerHeight);
            window.drop_success_handler = () => setSubCourse(null);
            setDragging(true);
        },
        onDrag: event => {
            // Add 10 pixels between the pointer and the element to allow drag and drop
            setOffsetX(event.clientX + 10);
            setOffsetY(event.clientY + 10);
        },
        onDragEnd: cancel,
        onDragOver: event => {
            event.preventDefault();
            if(event.dataTransfer.types.includes(format)) {
                const rect = main.current.getBoundingClientRect();
                if((event.clientY - rect.y) * 2 < rect.height) {
                    if(enableUpper) setOverIndex(0);
                    else setOverIndex(null);
                } else setOverIndex(1);
            }
        },
        onDragLeave: () => setOverIndex(null),
        onDrop: event => {
            event.preventDefault();
            if(overIndex === null) return;
            const raw = event.dataTransfer.getData(format);
            if(raw) {
                const data = JSON.parse(raw);
                if(data.block === block) swapSubCourses(data.i, i, overIndex);
                else {
                    delete data.block;
                    delete data.i;
                    if(window.drop_success_handler) window.drop_success_handler();
                    insertSubCourse(overIndex, data);
                }
            }
            setOverIndex(null);
        }
    };
    if(pressed) {
        out.onPointerMove = cancel;
        out.onLostPointerCapture = cancel;
    }
    return out;
}
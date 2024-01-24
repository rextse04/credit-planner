import * as logic from "./logic";

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
export function gen_check_course(ref) {
    const update = {
        error: false,
        message: []
    };
    const taken = this.flat();
    const current = this.toSpliced(-1, 1).flat();
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
    let new_course = {
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
    } else {
        let sem_match = ref.sems.includes(sem % 100);
        new_course = {
            ...new_course,
            ...this(ref),
            name: ref.name,
            cred: ref.cred,
            warn_code: !sem_match,
            message_code: sem_match ? "" : msgs.sem_no_match
        };
        if(!new_course.error && !sem_match) new_course.error = undefined;
    }
    return new_course;
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
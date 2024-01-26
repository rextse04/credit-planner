class req_base {
    type = "base";
    error = undefined;
}
export class empty extends req_base {
    type = "empty";
    //disabled = false;
}
export class course extends req_base {
    type = "course";
    code = "";
    name = "";
    cred = 0;
}
export class group extends req_base {
    members = [];
}
export class andGroup extends group {
    type = "and";
}
export class orGroup extends group {
    type = "or";
    n = 0;
    cred = 0;
}
export class xorGroup extends group {
    type = "xor";
}

export function length(group) {
    var count = 0;
    for(let member of group.members) if(!member.disabled) ++count;
    return count;
}
export function n(group) {
    var count = 0;
    for(let member of group.members) if(member.error === false) ++count;
    return count;
}
export function cred(req, counter = {}) {
    switch(req.type) {
        case "empty": return 0;
        case "course": return !(req.error || req.disabled || counter[req.code]) ? req.cred : 0;
        case "and":
        case "or":
            let out = 0;
            for(let member of req.members) if(member.error === false) out += cred(member, counter);
            return out;
        case "xor":
            for(let member of req.members) if(member.error === false) return cred(member, counter);
    }
}
export function test(req, courses, past = new Set()) {
    if(req.type === "empty") return {...req, error: false};
    else if(req.type === "course") {
        if(req.disabled) return {...req, error: undefined};
        let pass = false;
        let regex;
        try {
            regex = new RegExp(`^${req.code}$`);
        } catch(e) {
            if(e instanceof SyntaxError) return {...req,
                error: true,
                message: "Invalid regex expression."
            };
            else throw e;
        }
        for(let course of courses) {
            let code = course.code;
            if(!past.has(code) && regex.test(code)) {
                pass = true;
                past.add(code);
                break;
            }
        }
        return {...req, error: !pass};
    } else {
        const len = length(req);
        let pass;
        let members = [];
        let process = (default_pass, subprocess) => {
            pass = default_pass || len === 0;
            for(let member of req.members) {
                let i = members.push(test(member, courses, past));
                let error = members[i-1].error;
                if(error === undefined) continue;
                else pass = subprocess(!error);
            }
        }
        switch(req.type) {
            case "and":
                process(true, subcase => subcase ? pass : false);
                break;
            case "or":
                process(false, subcase => subcase ? true : pass);
                let error_cred = req.error_cred = req.cred && cred(req) < req.cred;
                let error_n = req.error_n = req.n && n(req) < req.n;
                pass = pass && !error_cred && !error_n;
                break;
            case "xor":
                process(false, subcase => subcase ? !pass : false);
                break;
        }
        return {...req, error: !pass, members: members};
    }
}
export function reset(req) {
    if(req.type === "empty" || req.type === "course") {
        if(req.error === undefined) return req;
        else return {...req, error: undefined};
    } else {
        let members = [];
        for(let member of req.members) members.push(reset(member));
        return {
            ...req,
            members: members,
            error: undefined,
            error_cred: undefined,
            error_n: undefined
        };
    }
}
export function includes(req, code) {
    if(code === undefined) return false;
    else if(req.type === "empty") return false;
    else if(req.type === "course") return req.code === code;
    else {
        for(let member of req.members) {
            if(includes(member,code)) return true;
        }
        return false;
    }
}
export function count(req, counter) {
    switch(req.type) {
        case "empty": return;
        case "course":
            if(req.error === false) {
                if(counter[req.code] === undefined) counter[req.code] = 0;
                else ++counter[req.code];
            }
            return;
        default:
            for(let member of req.members) if(member.error === false) count(member, counter);
            return;
    }
}
export function stringify(req) {
    if(req.type === "empty") return "";
    else if(req.type === "course") return req.code;
    else {
        var out = "";
        for(let i = req.members.length - 1; i >= 0; --i) {
            let member = req.members[i];
            let subname = stringify(member);
            if(member.type !== "course") subname = `(${subname})`;
            if(i === 0) out = subname + out;
            else out = ` ${req.type} ${subname}${out}`;
        }
        return out;
    }
}
export function get_class(error) {
    switch(error) {
        case undefined: return "";
        case true: return "error";
        case false: return "success";
    }
}
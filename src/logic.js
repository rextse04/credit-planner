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
    static from_entry(entry) {
        const out = new course();
        out.code = entry.code;
        out.name = entry.name;
        out.cred = entry.cred;
        return out;
    }
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
    for(let member of group.members) {
        if(Array.isArray(member.members))
            count += n(member);
        else
            if(member.error === false) ++count;
    }
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
export function test(req, courses) {
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
            if(regex.test(code)) {
                pass = true;
                break;
            }
        }
        return {...req, error: !pass};
    } else {
        const len = length(req);
        const new_req = {...req,
            error: true,
            members: []
        };
        const members = new_req.members;
        let process = (default_error, subprocess) => {
            new_req.error = default_error && len !== 0;
            for(let member of req.members) {
                let i = members.push(test(member, courses));
                let error = members[i-1].error;
                if(error !== undefined) new_req.error = subprocess(error);
            }
        }
        switch(req.type) {
            case "and":
                process(false, subcase => subcase ? true : new_req.error);
                break;
            case "or":
                process(true, subcase => subcase ? new_req.error : false);
                let error_cred = new_req.error_cred = req.cred && cred(new_req) < req.cred;
                let error_n = new_req.error_n = req.n && n(new_req) < req.n;
                new_req.error ||= error_cred || error_n;
                break;
            case "xor":
                let matched = false;
                process(true, subcase => {
                    if(subcase) return new_req.error;
                    else {
                        if(matched) {
                            matched = true;
                            return false;
                        }
                        else return true;
                    }
                });
                break;
        }
        return new_req;
    }
}
export function reset(req) {
    const new_req = {...req};
    if(req.type === "empty" || req.type === "course") delete new_req.error;
    else {
        const members = [];
        for(let member of req.members) members.push(reset(member));
        new_req.members = members;
        delete new_req.error;
        delete new_req.error_cred;
        delete new_req.error_n;
    }
    return new_req;
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
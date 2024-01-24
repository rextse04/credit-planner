const fs = require("fs");
const { JSDOM } = require("jsdom");
const sleep = require("sleep-promise");
const parse = html =>(new JSDOM(html)).window.document;

const courses_url = "https://w5.ab.ust.hk/wcq/cgi-bin/";
const courses = {};
const code_exact_re = /^[A-Z]{4} [1-7][0-9]{3}[A-Z]?$/;
const code_re = /\b[A-Z]{4} [1-7][0-9]{3}[A-Z]?\b/;
const target = "courses.json";

function parse_req(restraint) {
    const out = {raw: restraint};
    // Match course codes
    if(code_exact_re.test(restraint)) {
        out.type = "course";
        out.code = restraint.replace(' ', "");
    } else {
        // Match logical operands
        const parsed = restraint.split(/( and | AND | or | OR | \/ |\/|\(|\)|\[|\]|;)/g);
        out.type = "and";
        out.members = [];
        let current = out;
        let prev = [];
        for(let token of parsed) {
            switch(token) {
                case '':
                case ";":
                    break;
                case " and ":
                    if(current.type !== undefined) break;
                case " AND ":
                    current.type = "and";
                    break;
                case " or ":
                    if(current.type !== undefined) break;
                case " OR ":
                case "/":
                case " / ":
                    current.type = "or";
                    break;
                case "(":
                case "[":
                    let group = {
                        type: "and",
                        members: []
                    };
                    current.members.push(group);
                    prev.push(current);
                    current = group;
                    break;
                case ")":
                case "]":
                    if(prev.length) {
                        let del = !current.members.length;
                        current = prev.pop();
                        if(del) current.members.pop();
                    }
                    else out.malformed = true;
                    break;
                default:
                    let match = code_re.exec(token);
                    if(match) {
                        current.members.push({
                            type: "course",
                            code: match[0].replace(' ', "")
                        });
                        if(!code_exact_re.test(token)) out.malformed = true;
                    } else {
                        out.malformed = true;
                    }
            }
        }
    }
    return out;
}

async function collect_dept(depts, dept, season) {
    const header = `\nDept: ${dept}, Season: ${season}`;
    try {
        await sleep(500);
        const response = await fetch(depts[dept]);
        const text = await response.text();
        console.log(header);
        const doc = parse(text);
        const classes = doc.getElementById("classes");
        for(let div of classes.getElementsByClassName("course")) {
            const info = div.getElementsByTagName("h2")[0].textContent;
            const code = info.match(code_re)[0].replace(' ', "");
            console.log("Course: " + info);
            if(code in courses) {
                courses[code].sems.push(season);
                console.log("Season updated");
            } else {
                const course = courses[code] = {
                    name: /- (.+?) \(/.exec(info)[1],
                    cred: parseInt(/\((\d+) unit[s]?\)/.exec(info)[1]),
                    prereq: { type: "empty" },
                    coreq: { type: "empty" },
                    exclusion: { type: "empty" },
                    sems: [season]
                };
                for(let th of div.children[1].getElementsByTagName("th")) {
                    const restraint = th.nextSibling.textContent;
                    switch(th.textContent) {
                        case "PRE-REQUISITE":
                            course.prereq = parse_req(restraint);
                            break;
                        case "CO-REQUISITE":
                            course.coreq = parse_req(restraint);
                            break;
                        case "EXCLUSION":
                            let excludes = [];
                            course.exclusion = {
                                type: "or",
                                members: excludes,
                                raw: restraint
                            };
                            for(let c of restraint.split(", ")) {
                                let match = code_re.exec(c);
                                if(match) {
                                    excludes.push({
                                        type: "course",
                                        code: match[0].replace(' ', "")
                                    });
                                    if(code_exact_re.test(c)) continue;
                                }
                                course.exclusion.malformed = true;
                            }
                    }
                }
            }
        }
    } catch(error) {
        console.log(header);
        console.log("\x1b[41m%s\x1b[0m", error);
    }
}

async function collect_season(sems, season) {
    const response = await fetch(sems[season]);
    const text = await response.text();
    const doc = parse(text);
    let depts = {};
    for(let a of doc.getElementsByClassName("depts")[0].children) {
        depts[a.textContent] = new URL(a.href, courses_url);
    }
    for(let dept in depts) {
        await collect_dept(depts, dept, season);
    }
}

async function collect() {
    const response = await fetch(courses_url);
    const text = await response.text();
    const doc = parse(text);
    var sems = {};
    for(let a of doc.getElementsByClassName("termselect")[0].children) {
        let season;
        let url = new URL(a.href, courses_url);
        switch(a.textContent.split(' ')[1]) {
            case "Fall": season = 10; break;
            case "Winter": season = 20; break;
            case "Spring": season = 30; break;
            case "Summer": season = 40; break;
        }
        sems[season] = url;
    }
    await collect_season(sems, 10);
    await collect_season(sems, 20);
    await collect_season(sems, 30);
    await collect_season(sems, 40);
}

async function main() {
    await collect();
    fs.writeFileSync(target, JSON.stringify(courses));
}

main();
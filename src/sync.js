import { Dexie } from "dexie";
import { read_import } from "./util";
import { to_workbook } from "./excel";
import * as logic from './logic';

const db = new Dexie("main");
db.version(2).stores({
    plans: "++index, title, startSem, sems",
    reqs: "name"
});

// eslint-disable-next-line no-restricted-globals
self.onmessage = async event => {
    const message = event.data;
    var response = {
        ...message,
        status: true
    };
    try {
        switch(message.type) {
            case "init":
                response.titles = {};
                await db.transaction("rw", db.plans, async () => {
                    response.content = await db.plans.get(message.plan);
                    if(response.content === undefined) {
                        await db.plans.add({
                            index: message.plan,
                            ...message.content
                        });
                        response.content = message.content;
                    }
                });
                await db.plans.each(plan => response.titles[plan.index] = plan.title);
                break;
            case "select":
                await db.transaction(message.force ? "rw" : "r", db.plans, async () => {
                    const content = await db.plans.get(message.plan);
                    if(content === undefined) {
                        if(message.force) await db.plans.add({
                            index: message.plan,
                            ...message.content
                        });
                        else {
                            response.status = false;
                            response.fail_message = "Plan does not exist."
                        }
                    }
                    else response.content = content;
                });
                break;
            case "export":
            {
                const raw = await db.plans.get(message.plan);
                delete raw.index;
                response.content = JSON.stringify(raw);
                break;
            }
            case "excel":
            {
                const raw = await db.plans.get(message.plan);
                const wb = to_workbook(raw);
                response.content = await wb.xlsx.writeBuffer();
                break;
            }
            case "add":
                response.plan = await db.plans.add(message.content);
                break;
            case "copy":
                response.plan = await db.transaction("rw", db.plans, async () => {
                    const source = await db.plans.get(message.plan);
                    const copied = {...source, ...message.content};
                    delete copied.index;
                    return await db.plans.add(copied);
                });
                break;
            case "import":
                try {
                    const content = await read_import(message.content);
                    response.plan = await db.plans.add(content);
                    response.content = content;
                } catch(e) {
                    response.status = false;
                    response.fail_message = e;
                }
                break;
            case "delete":
                await db.transaction("rw", db.plans, async () => {
                    if(await db.plans.count() === 1) {
                        response.status = false;
                        response.fail_message = "The only plan in your collection cannot be deleted.";
                    } else await db.plans.delete(message.plan);
                });
                break;
            case "update":
                await db.plans.update(message.plan, message.content);
                break;

            case "req_names":
                response.content = [];
                await db.reqs.each(req => response.content.push(req.name));
                break;
            case "req_select":
                const req = await db.reqs.get(message.req);
                if(req === undefined) {
                    response.status = false;
                    response.fail_message = "Requirement block does not exist.";
                } else response.content = req.content;
                break;
            case "req_export":
            {
                let raw = undefined;
                if("content" in message) raw = {
                    name: message.req,
                    content: logic.reset(message.content)
                };
                else if("req" in message) raw = await db.reqs.get(message.req);
                if(raw === undefined) {
                    response.status = false;
                    response.fail_message = "Requirement block does not exist.";
                } else response.content = JSON.stringify(raw);
                break;
            }
            case "req_import":
            {
                try {
                    const req = await read_import(message.content);
                    response.req = message.req = req.name;
                    try {
                        response.content = message.content = logic.reset(req.content);
                    } catch {
                        throw "The provided file seems to be corrupted.";
                    }
                } catch(e) {
                    response.status = false;
                    response.fail_message = e;
                    break;
                }
            }
            case "req_add":
                await db.transaction("rw", db.reqs, async () => {
                    if(!message.force && await db.reqs.where({name: message.req}).count()) {
                        response.clash = true;
                    } else {
                        await db.reqs.put({
                            name: message.req,
                            content: message.content
                        });
                        response.clash = false;
                    }
                });
                break;
            case "req_delete":
                const name = message.req;
                await db.transaction("rw", db.reqs, async () => {
                    if(await db.reqs.where({name: name}).count()) {
                        await db.reqs.delete(name);
                    } else {
                        response.status = false;
                        response.fail_message = "Requirement block does not exist.";
                    }
                });
                break;
            case "req_update":
                await db.reqs.update(message.req, message.content);
        }
    } catch(e) {
        response.status = false;
        response.error = e.inner;
    }
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(response);
};
import { Dexie } from "dexie";

const db = new Dexie("main");
db.version(1).stores({
    plans: "++index, title, startSem, sems"
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
                const raw = await db.plans.get(message.plan);
                delete raw.index;
                response.content = JSON.stringify(raw);
                break;
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
                const reader = new FileReader();
                reader.onload = async () => {
                    try {response.plan = await db.plans.add(JSON.parse(reader.result));}
                    catch(e) {
                        if(e instanceof SyntaxError) {
                            response.status = false;
                            response.fail_message = "The provided file failed to be parsed. Please check if it is corrupted.";
                        }
                        else throw e;
                    }
                };
                reader.onerror = () => {
                    response.status = false;
                    response.error = "File read failed.";
                }
                reader.readAsText(message.content);
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
        }
    } catch(e) {
        response.status = false;
        response.error = e.inner;
    }
    // eslint-disable-next-line no-restricted-globals
    self.postMessage(response);
};
import Dexie from "dexie";

const db = new Dexie("data");
db.version(1).stores({
    main: "name, fullname, version, target"
});

// eslint-disable-next-line no-restricted-globals
self.onmessage = async event => {
    const message = event.data;
    try {
        const response = await fetch(message.target);
        if(response.ok) {
            const catalog = await response.json();
            const names = Object.keys(catalog);
            const rel = await db.main.bulkGet(Object.keys(catalog));
            for(let i = 0; i < names.length; ++i) {
                const name = names[i];
                const ref = catalog[name];
                if(rel[i] === undefined || rel[i].version < ref.version) {
                    fetch(ref.target)
                    .then(response => {
                        if(response.ok) return response.json();
                        else throw response.statusText;
                    })
                    .then(data => {
                        db.main.put({
                            name: name,
                            ...ref,
                            content: data
                        // eslint-disable-next-line no-restricted-globals
                        }).catch(e => self.postMessage({
                            status: false,
                            error: e.inner,
                            fail_message: `Failed to save ${ref.fullname}.`
                        }));
                        // eslint-disable-next-line no-restricted-globals
                        self.postMessage({
                            status: true,
                            name: name,
                            content: data,
                            update: true
                        });
                    })
                    // eslint-disable-next-line no-restricted-globals
                    .catch(e => self.postMessage({
                        status: false,
                        error: e,
                        fail_message: `Failed to fetch ${ref.fullname}. Some functionalities may stop working.`
                    }));
                } else {
                    // eslint-disable-next-line no-restricted-globals
                    self.postMessage({
                        status: true,
                        name: name,
                        content: rel[i].content
                    });
                }
            }
        } else throw response.statusText;
    } catch(e) {
        // eslint-disable-next-line no-restricted-globals
        self.postMessage({
            status: false,
            error: e,
            fail_message: "Failed to connect to the data source. Offline data saved will be used."
        });
        try {
            // eslint-disable-next-line no-restricted-globals
            db.main.each(dataitem => self.postMessage({
                status: true,
                name: dataitem.name,
                content: dataitem.content
            }));
        } catch(e) {
            // eslint-disable-next-line no-restricted-globals
            self.postMessage({
                status: false,
                error: e,
                fail_message: "Failed to fetch offline data."
            })
        }
    }
}
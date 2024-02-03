// File functions
export function req_file(accept = ".json") {
    return new Promise(resolve => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = accept;
        input.onchange = event => resolve(event.target.files[0]);
        input.click(); 
    });
}
export function read_import(text) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            try {
                resolve(JSON.parse(reader.result));
            } catch {
                reject("The provided file failed to be parsed. Please check if it is corrupted.");
            }
        }
        reader.onerror = () => reject("File read failed.");
        reader.readAsText(text);
    });
}

// Other Functions
export function parseSeason(season) {
    switch(season) {
        case 10: return "Fall";
        case 20: return "Winter";
        case 30: return "Spring";
        case 40: return "Summer";
    }
}
export function parseSem(sem) {
    var year = +sem.slice(0, 2);
    return `20${year}-${year - (-1)} ${parseSeason(+sem.slice(2, 4))}`;
}
export function condense(str) {
    return str.replace(/\s/g, "");
}
export function to_int(value, min = 0) {
    return Math.max(parseInt(value) || min, min);
}
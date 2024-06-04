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
        default: return "";
    }
}
export class semester {
    constructor(str) {
        this.year = parseInt(str.slice(0, 2));
        this.season = parseInt(str.slice(2, 4));
    }
    name() {
        return `${this.year}${this.season}`;
    }
    to_str() {
        return `20${this.year}-${this.year - (-1)} ${parseSeason(this.season)}`;
    }
    is_last() {
        return this.season === 40;
    }
    next() {
        if(this.is_last()) {
            ++this.year;
            this.season = 10;
        } else {
            this.season += 10;
        }
    }
}
export function condense(str) {
    return str.replace(/\s/g, "");
}
export function to_int(value, min = 0) {
    return Math.max(parseInt(value) || min, min);
}
import { Workbook } from "exceljs";
import * as logic from "./logic";
import { semester } from "./util";

const course_table = {
    headerRow: true,
    totalsRow: true,
    columns: [
        {name: "Code", totalsRowLabel: "Total credit(s):"},
        {name: "Credit(s)", totalsRowFunction: "sum"}
    ],
};

function gen_rows(courses, include_name = false) {
    const rows = [];
    for(let course of courses)
        if(course.code !== "") {
            const row = [course.code, course.cred];
            if(include_name) row.splice(1, 0, course.name);
            rows.push(row);
        }
    if(rows.length) return rows;
    else return [[]];
}

export function to_workbook(plan) {
    const wb = new Workbook();
    const ws = wb.addWorksheet();
    const sem = new semester(plan.startSem);
    // Credit plan
    let row_i = 1;
    let col_i = 1;
    let rows_n = 1;
    for(let i = 0; i < plan.sems; ++i) {
        const sem_name = sem.name();
        const courses = plan.courses;
        const rows = sem_name in courses
            ? gen_rows(courses[sem_name])
            : [[]];
        ws.getCell(row_i, col_i).value = sem.to_str();
        ws.addTable({
            ...course_table,
            name: "plan_" + sem_name,
            ref: ws.getCell(row_i+1, col_i).$col$row,
            rows: rows
        });
        rows_n = Math.max(rows_n, rows.length);
        sem.next();
        if(sem.is_last()) {
            row_i += rows_n + 4;
            col_i = 1;
            rows_n = 1;
        } else {
            col_i += 3;
        }
    }
    // Requirements
    row_i = 1;
    col_i = 13;
    for(let i = 0; i < plan.reqs.length; ++i) {
        const req = plan.reqs[i];
        const rows = gen_rows(logic.flatten(req.content));
        ws.getCell(row_i, col_i).value = req.name;
        ws.addTable({
            ...course_table,
            name: `req_${i}`,
            ref: ws.getCell(row_i+1, col_i).$col$row,
            rows: rows
        });
        row_i += rows.length + 4;
    }
    // Course list
    row_i = 1;
    col_i = 16;
    const courses = Object.values(plan.courses).flat();
    ws.getCell(row_i, col_i).value = "All courses";
    ws.addTable({
        name: "all_courses",
        ref: ws.getCell(row_i+1, col_i).$col$row,
        headerRow: true,
        totalsRow: true,
        columns: [
            {name: "Code", totalsRowLabel: "Total credit(s):"},
            {name: "Name"},
            {name: "Credit(s)", totalsRowFunction: "sum"}
        ],
        rows: gen_rows(courses, true)
    });
    return wb;
}
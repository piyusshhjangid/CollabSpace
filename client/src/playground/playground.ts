import { projects } from "../data/projects.ts";

function firstItem<T>(items: T[]): T | undefined {
    return items[0];
}

const firstProject = firstItem(projects);

const numbers = firstItem([10,20,30]);

const names = firstItem(["A","B","C"]);

const bools = firstItem([true,false]);

console.log(firstProject);
console.log(names);
console.log(numbers);
console.log(bools);
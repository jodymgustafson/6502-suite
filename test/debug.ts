import { Emulator, assemble, disassemble, util } from "../index";
import { dasmToString } from "../util";
import * as fs from "fs";

const code = fs.readFileSync("./test/test.asm", "utf8");

// const data = "$0A, $1A, $2A, $3A, $4A".split(",").map(n => parseNumber(n.trim()) & 0xFF);
// data.toString();

const emu = new Emulator();
let bytes = assemble(code);
console.log(util.byteArrayToHexString(bytes));

const dasm = disassemble(bytes);
console.log(dasmToString(...dasm));

emu.load(bytes);
//emu.onStep(state => console.log(emu.totalCycles,emu.registers.x));
emu.onStop(reason => {
    console.log(reason);
    console.log(emu.totalCycles)
    const elapsed = Date.now() - start;
    console.log("time", elapsed, emu.totalCycles / elapsed * 1000);
});
const start = Date.now();
console.log("start");
emu.run();
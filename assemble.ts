import {assemble} from "./assembler/asm6502";
import * as util from "./util";
import * as fs from "fs";

///////////////////////////////////////////////////////////
// Assembles assembly code in a file to hex bytes
// Parameters:
//  0: file path
//  1: base address
//
// Example: node assemble test.asm '$0100'
///////////////////////////////////////////////////////////

const args = process.argv.slice(2);
const path = args[0];
const baseAddr = (args[1] || "$0000");
const bytes = assembleFile(path, baseAddr);
console.log(baseAddr + ": " + util.byteArrayToHexString(bytes));

function assembleFile(path: string, baseAddr: string): number[] {
    const code = fs.readFileSync(path, "utf8");
    const address = baseAddr ? util.parseNumber(baseAddr) : undefined;
    return assemble(code, address);
}
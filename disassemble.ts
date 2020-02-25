import * as util from "./util";
import * as fs from "fs";
import { disassemble, DisassembledInstruction } from "./disassembler/dasm6502";
import { hexStringToByteArray } from "./util";

///////////////////////////////////////////////////////////
// Disassembles the hex bytes in a file to assembly code
// Parameters:
//  0: file path
//  1: base address
//
// Example: node disassemble test.bin '$0100'
///////////////////////////////////////////////////////////

const args = process.argv.slice(2);
const path = args[0];
const baseAddr = args[1];
const dasm = disassembleFile(path, baseAddr);
console.log(util.dasmToString(...dasm));

function disassembleFile(path: string, baseAddr: string): DisassembledInstruction[] {
    const bytes = fs.readFileSync(path, "utf8");
    const address = baseAddr ? util.parseNumber(baseAddr) : undefined;
    return disassemble(hexStringToByteArray(bytes), address);
}
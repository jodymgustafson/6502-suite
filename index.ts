const code1 = `
  LDY #$00
start:
  LDX #$00
start_x:
  INX
  CPX #$FF
  BNE start_x
  INY
  CPY #$FF
  BNE start_x
  BRK
`;

import {parseCode, assemble} from "./src/assembler/asm6502";
import { byteArrayToHexString, parseNumber, hexStringToByteArray } from "./src/util";
import { disassemble } from "./src/disassembler/dasm6502";
import { Emulator } from "./src/emulator/emu6502";

//disassemble(hexStringToByteArray("A9 03 4C 08 06 00 00 00 8D 00 02"), 0x0600);

// const bytes = parseCode(code1);
// console.log(byteArrayToHexString(bytes));

// const data = "$0A, $1A, $2A, $3A, $4A".split(",").map(n => parseNumber(n.trim()) & 0xFF);
// data.toString();

const emu = new Emulator();
const bytes = assemble(code1);
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
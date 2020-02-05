const code1 = `
LDA #$01
STA $0200
LDX #$05
STX $0201
LDY #$08
STY $0202`
;

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
emu.load(bytes, 0x0100);
console.log(emu.getWordAt(0x0103));
emu.onStep(state => console.log(state));
emu.onStop(reason => console.log(reason));
emu.run();
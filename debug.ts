import { Emulator, assemble, disassemble, util } from "./index";
import { dasmToString } from "./util";

const code1 = `
define max_x $FF;
define max_y $AA;
  LDY #$00
start:
  LDX #$00
start_x:
  INX
  CPX #max_x
  BNE start_x
  INY
  CPY #max_y
  BNE start
  BRK
`;

const dasm = disassemble(util.hexStringToByteArray("A9 03 4C 08 06 00 00 00 8D 00 02"), 0x0600);
console.log(dasmToString(...dasm));

// const data = "$0A, $1A, $2A, $3A, $4A".split(",").map(n => parseNumber(n.trim()) & 0xFF);
// data.toString();

const emu = new Emulator();
const bytes = assemble(code1);
console.log(util.byteArrayToHexString(bytes));
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
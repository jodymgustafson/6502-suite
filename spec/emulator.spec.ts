import { assemble } from "../src/assembler/asm6502";
import { Emulator } from "../src/emulator/emu6502";
import { DisassembledInstruction } from "../src/disassembler/dasm6502";

const code2 = `
LDA #$01
STA $0200
LDX #$05
STX $0201
LDY #$08
STY $0202`;

describe("When load bytes", () => {
    it("should put the bytes in memory at default location", () => {
        const bytes = assemble(code2);
        const em = new Emulator();
        em.load(bytes);
        expect(em.getByteAt(0)).toBe(0xA9);
        expect(em.getByteAt(1)).toBe(0x01);
    });
    it("should put the bytes in memory at specific location", () => {
        const bytes = assemble(code2);
        const em = new Emulator();
        em.load(bytes, 0x0100);
        expect(em.getWordAt(0x0103)).toBe(0x0200);
    });
});

describe("When emulating code with step", () => {
    it("should step through instructions", () => {
        const bytes = assemble(code2);
        const em = new Emulator();
        em.load(bytes);

        checkNextInstruction(em.getNextInstruction(), 0, [0xA9, 0x01], "LDA #$01");

        let result = em.step();
        expect(result.cycles).toBe(2);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(2);
        checkRegisters(em, 1, 0, 0, 2, 0xff, 0x20);

        checkNextInstruction(em.getNextInstruction(), 2, [0x8D, 0x00, 0x02], "STA $0200");

        result = em.step();
        expect(result.cycles).toBe(4);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(6);
        checkRegisters(em, 1, 0, 0, 5, 0xff, 0x20);

        checkNextInstruction(em.getNextInstruction(), 5, [0xA2, 0x05], "LDX #$05");

        result = em.step();
        expect(result.cycles).toBe(2);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(8);
        checkRegisters(em, 1, 5, 0, 7, 0xff, 0x20);

        result = em.step();
        expect(result.cycles).toBe(4);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(12);
        checkRegisters(em, 1, 5, 0, 10, 0xff, 0x20);

        result = em.step();
        expect(result.cycles).toBe(2);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(14);
        checkRegisters(em, 1, 5, 8, 12, 0xff, 0x20);

        result = em.step();
        expect(result.cycles).toBe(4);
        expect(result.isBreak).toBeFalse();
        expect(em.totalCycles).toBe(18);
        checkRegisters(em, 1, 5, 8, 15, 0xff, 0x20);

        result = em.step();
        expect(result.cycles).toBe(7);
        expect(result.isBreak).toBeTrue();
        expect(em.totalCycles).toBe(25);
        checkRegisters(em, 1, 5, 8, 0, 0xfc, 0x34);

        expect(em.memory[0x0200]).toBe(1);
        expect(em.memory[0x0201]).toBe(5);
        expect(em.memory[0x0202]).toBe(8);
    });
});

// describe("When emulating code with run", () => {
//     it("should run through instructions", () => {
//         const bytes = assemble(code2);
//         const em = new Emulator();
//         em.memory.push(...bytes);

//         let stepCount = 0;
//         em.onStep(state => {
//             console.log(state.isBreak);
//             stepCount++;
//         });
//         em.onStop(reason => {
//             console.log("Stopped");
//             expect(reason).toBe("break");
//             expect(em.totalCycles).toBe(25);
//             checkRegisters(em, 1, 5, 8, 0, 0xfc, 0x34);
//             expect(stepCount).toBe(7);
//             expect(em.memory[0x0200]).toBe(1);
//             expect(em.memory[0x0201]).toBe(5);
//             expect(em.memory[0x0202]).toBe(8);
//         });
//         em.run();
//     });
// });

function checkNextInstruction(next: DisassembledInstruction, addr: number, bytes: number[], assm: string) {
    expect(next.address).toEqual(addr);
    expect(next.bytes).toEqual(bytes);
    expect(next.assembly).toEqual(assm);
}

function checkRegisters(em: Emulator, a: number, x: number, y: number, pc: number, sp: number, flags: number): void {
    expect(em.registers.a).toBe(a);
    expect(em.registers.x).toBe(x);
    expect(em.registers.y).toBe(y);
    expect(em.registers.pc).toBe(pc);
    expect(em.registers.sp).toBe(sp);
    expect(em.registers.flags).toBe(flags);
}
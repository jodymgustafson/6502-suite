import { disassemble, DisassembledInstruction } from "../src/disassembler/dasm6502";
import { hexStringToByteArray, byteArrayToHexString, toHexString } from "../src/util";


function toTable(dasm: DisassembledInstruction[]): string[] {
    return dasm.map(d => `${toHexString(d.address, 2)} ${byteArrayToHexString(d.bytes)} ${" ".repeat(9-3*d.bytes.length)}${d.assembly}`)
}

describe("When disassembling code", () => {
    it("should parse code2", () => {
        const result = disassemble(hexStringToByteArray("A9 01 8D 00 02 A9 05 8D 01 02 A9 08 8D 02 02"));
        expect(toTable(result)).toEqual([
            '0000 A9 01    LDA #$01',
            '0002 8D 00 02 STA $0200',
            '0005 A9 05    LDA #$05',
            '0007 8D 01 02 STA $0201',
            '000A A9 08    LDA #$08',
            '000C 8D 02 02 STA $0202'
        ]);
    });
    it("should parse code4", () => {
        const result = disassemble(hexStringToByteArray("A2 08 CA 8E 00 02 E0 03 D0 F8 8E 01 02 00"));
        expect(toTable(result)).toEqual([
            '0000 A2 08    LDX #$08',
            '0002 CA       DEX',
            '0003 8E 00 02 STX $0200',
            '0006 E0 03    CPX #$03',
            '0008 D0 F8    BNE $0002',
            '000A 8E 01 02 STX $0201',
            '000D 00       BRK' 
        ]);
    });
    it("should parse code5", () => {
        const result = disassemble(hexStringToByteArray("A9 01 C9 02 D0 02 85 22 00"));
        expect(toTable(result)).toEqual([
            '0000 A9 01    LDA #$01',
            '0002 C9 02    CMP #$02',
            '0004 D0 02    BNE $0008',
            '0006 85 22    STA $22',
            '0008 00       BRK'
        ]);
    });
    it("should parse code7", () => {
        const result = disassemble(hexStringToByteArray("A2 01 A9 05 85 01 A9 07 85 02 A0 0A 8C 05 07 A1 00"));
        expect(toTable(result)).toEqual([
            '0000 A2 01    LDX #$01',
            '0002 A9 05    LDA #$05',
            '0004 85 01    STA $01',
            '0006 A9 07    LDA #$07',
            '0008 85 02    STA $02',
            '000A A0 0A    LDY #$0A',
            '000C 8C 05 07 STY $0705',
            '000F A1 00    LDA ($00,X)'
        ]);
    });
    it("should parse code9", () => {
        const result = disassemble(hexStringToByteArray("A2 00 A0 00 8A 99 00 02 48 E8 C8 C0 10 D0 F5 68 99 00 02 C8 C0 20 D0 F7"));
        expect(toTable(result)).toEqual([
            '0000 A2 00    LDX #$00',
            '0002 A0 00    LDY #$00',
            '0004 8A       TXA',
            '0005 99 00 02 STA $0200,Y',
            '0008 48       PHA',
            '0009 E8       INX',
            '000A C8       INY',
            '000B C0 10    CPY #$10',
            '000D D0 F5    BNE $0004',
            '000F 68       PLA',
            '0010 99 00 02 STA $0200,Y',
            '0013 C8       INY',
            '0014 C0 20    CPY #$20',
            '0016 D0 F7    BNE $000F'
        ]);
    });
    it("should parse code10", () => {
        const result = disassemble(hexStringToByteArray("A9 03 4C 08 06 00 00 00 8D 00 02"), 0x0600);
        //console.log(toTable(result));
        expect(toTable(result)).toEqual([
            '0600 A9 03    LDA #$03',
            '0602 4C 08 06 JMP $0608',
            '0605 00       BRK',
            '0606 00       BRK',
            '0607 00       BRK',
            '0608 8D 00 02 STA $0200'
        ]);
    });
    it("should parse code12", () => {
        const result = disassemble(hexStringToByteArray("A0 00 A2 00 E8 E0 FF D0 FB C8 C0 AA D0 F6 00"));
        //console.log(toTable(result));
        expect(toTable(result)).toEqual([
            '0000 A0 00    LDY #$00',
            '0002 A2 00    LDX #$00',
            '0004 E8       INX',
            '0005 E0 FF    CPX #$FF',
            '0007 D0 FB    BNE $0004',
            '0009 C8       INY',
            '000A C0 AA    CPY #$AA',
            '000C D0 F6    BNE $0004',
            '000E 00       BRK'
        ]);
    });
});
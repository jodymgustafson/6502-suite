import { assemble } from "../assembler/asm6502";
import { toHexString, byteArrayToHexString } from "../util";

const code1 = `
    LDX #$01
    LDA data, X
    BRK
data:
    DCB $0a, $1a, $2a, $3a, $4a
    BRK
`;

const code2 = `
LDA #$01
STA $0200
LDA #$05
STA $0201
LDA #$08
STA $0202`;

const code3 = `
LDA #$c0  ;Load the hex value $c0 into the A register
TAX       ;Transfer the value in the A register to X
INX       ;Increment the value in the X register
ADC #$c4  ;Add the hex value $c4 to the A register
BRK       ;Break - we're done`;

const code4 = `
  LDX #$08
decrement:
  DEX
  STX $0200
  CPX #$03
  BNE decrement
  STX $0201
  BRK`;

const code5 = `
    LDA #$01
    CMP #$02
    BNE notequal
    STA $22
    notequal:
    BRK`;

const code6 = `
    LDA #$01
    STA $f0
    LDA #$cc
    STA $f1
    JMP ($00f0) ;dereferences to $cc01`;

const code7 = `
    LDX #$01
    LDA #$05
    STA $01
    LDA #$07
    STA $02
    LDY #$0a
    STY $0705
    LDA ($00,X)`;

const code8 = `
    LDY #$01
    LDA #$03
    STA $01
    LDA #$07
    STA $02
    LDX #$0a
    STX $0704
    LDA ($01),Y`;

const code9 = `
    LDX #$00
    LDY #$00
    firstloop:
    TXA
    STA $0200,Y
    PHA
    INX
    INY
    CPY #$10
    BNE firstloop ;loop until Y is $10
    secondloop:
    PLA
    STA $0200,Y
    INY
    CPY #$20      ;loop until Y is $20
    BNE secondloop`;

const code10 = `
    *=$0600
    LDA #$03
    JMP there
    BRK
    BRK
    BRK
    there:
    STA $0200`;

const code11 = `
*=$0600
    JSR init
    JSR loop
    JSR end

init:
    LDX #$00
    RTS

loop:
    INX
    CPX #$05
    BNE loop
    RTS

end:
    BRK`;

const code12 = `
define max_x $FF
define max_y $AA
  LDY #$00
start:
  LDX #$00
start_x:
  INX
  CPX #max_x
  BNE start_x
  INY
  CPY #max_y
  BNE start_x
  BRK
`;

const code13 = 
    `DCB "Hello World!", $AA,'"foo"'`
;

describe("When assembling code", () => {
    it("should parse code1", () => {
        const result = assemble(code1);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A2 01 BD 06 00 00 0A 1A 2A 3A 4A 00");
    });
    it("should parse code2", () => {
        const result = assemble(code2);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A9 01 8D 00 02 A9 05 8D 01 02 A9 08 8D 02 02");
    });
    it("should parse code3", () => {
        const result = assemble(code3);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A9 C0 AA E8 69 C4 00");
    });
    it("should parse code4", () => {
        const result = assemble(code4);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A2 08 CA 8E 00 02 E0 03 D0 F8 8E 01 02 00");
    });
    it("should parse code5", () => {
        const result = assemble(code5);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A9 01 C9 02 D0 02 85 22 00");
    });
    it("should parse code6", () => {
        const result = assemble(code6);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A9 01 85 F0 A9 CC 85 F1 6C F0 00");
    });
    it("should parse indexed indirect", () => {
        const result = assemble(code7);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A2 01 A9 05 85 01 A9 07 85 02 A0 0A 8C 05 07 A1 00");
    });
    it("should parse indirect indexed", () => {
        const result = assemble(code8);
        const hex = byteArrayToHexString(result);
        expect(hex).toBe("A0 01 A9 03 85 01 A9 07 85 02 A2 0A 8E 04 07 B1 01");
    });
    it("should parse stack ops", () => {
        const result = assemble(code9);
        const hex = byteArrayToHexString(result)
        expect(hex).toBe("A2 00 A0 00 8A 99 00 02 48 E8 C8 C0 10 D0 F5 68 99 00 02 C8 C0 20 D0 F7");
    });
    it("should parse jump", () => {
        const result = assemble(code10);
        const hex = byteArrayToHexString(result)
        expect(hex).toBe("A9 03 4C 08 06 00 00 00 8D 00 02");
    });
    it("should parse jsr/rts", () => {
        const result = assemble(code11);
        const hex = byteArrayToHexString(result)
        expect(hex).toBe("20 09 06 20 0C 06 20 12 06 A2 00 60 E8 E0 05 D0 FB 60 00");
    });
    it("should parse defines", () => {
        const result = assemble(code12);
        const hex = byteArrayToHexString(result)
        expect(hex).toBe("A0 00 A2 00 E8 E0 FF D0 FB C8 C0 AA D0 F6 00");
    });
    it("should parse declared bytes", () => {
        const result = assemble(code13);
        const hex = byteArrayToHexString(result)
        expect(hex).toBe("48 45 4C 4C 4F 20 57 4F 52 4C 44 21 AA 22 46 4F 4F 22");
    });
});

export enum OpCodeIndex {
    IMM=0, ZP, ZPX, ZPY, ABS, ABSX, ABSY, IND, INDX, INDY, SNGL, BRA
}

export const OPCODES = {
      /*  Imm, ZP,  ZPX, ZPY, ABS, ABSX,ABSY,IND,INDX, INDY,SNGL, BRA */
    ADC: [0x69,0x65,0x75,null,0x6D,0x7D,0x79,null,0x61,0x71,null,null],
    AND: [0x29,0x25,0x35,null,0x2D,0x3D,0x39,null,0x21,0x31,null,null],
    ASL: [null,0x6,0x16,null,0xE,0x1E,null,null,null,null,0xA,null],
    BIT: [null,0x24,null,null,0x2C,null,null,null,null,null,null,null],
    BPL: [null,null,null,null,null,null,null,null,null,null,null,0x10],
    BMI: [null,null,null,null,null,null,null,null,null,null,null,0x30],
    BVC: [null,null,null,null,null,null,null,null,null,null,null,0x50],
    BVS: [null,null,null,null,null,null,null,null,null,null,null,0x70],
    BCC: [null,null,null,null,null,null,null,null,null,null,null,0x90],
    BCS: [null,null,null,null,null,null,null,null,null,null,null,0xB0],
    BNE: [null,null,null,null,null,null,null,null,null,null,null,0xD0],
    BEQ: [null,null,null,null,null,null,null,null,null,null,null,0xF0],
    BRK: [null,null,null,null,null,null,null,null,null,null,0x0,null],
    CMP: [0xC9,0xC5,0xD5,null,0xCD,0xDD,0xD9,null,0xC1,0xD1,null,null],
    CPX: [0xE0,0xE4,null,null,0xEC,null,null,null,null,null,null,null],
    CPY: [0xC0,0xC4,null,null,0xCC,null,null,null,null,null,null,null],
    DEC: [null,0xC6,0xD6,null,0xCE,0xDE,null,null,null,null,null,null],
    EOR: [0x49,0x45,0x55,null,0x4D,0x5D,0x59,null,0x41,0x51,null,null],
    CLC: [null,null,null,null,null,null,null,null,null,null,0x18,null],
    SEC: [null,null,null,null,null,null,null,null,null,null,0x38,null],
    CLI: [null,null,null,null,null,null,null,null,null,null,0x58,null],
    SEI: [null,null,null,null,null,null,null,null,null,null,0x78,null],
    CLV: [null,null,null,null,null,null,null,null,null,null,0xB8,null],
    CLD: [null,null,null,null,null,null,null,null,null,null,0xD8,null],
    SED: [null,null,null,null,null,null,null,null,null,null,0xF8,null],
    INC: [null,0xE6,0xF6,null,0xEE,0xFE,null,null,null,null,null,null],
    JMP: [null,null,null,null,0x4C,null,null,0x6C,null,null,null,null],
    JSR: [null,null,null,null,0x20,null,null,null,null,null,null,null],
    LDA: [0xA9,0xA5,0xB5,null,0xAD,0xBD,0xB9,null,0xA1,0xB1,null,null],
    LDX: [0xA2,0xA6,null,0xB6,0xAE,null,0xBE,null,null,null,null,null],
    LDY: [0xA0,0xA4,0xB4,null,0xAC,0xBC,null,null,null,null,null,null],
    LSR: [null,0x46,0x56,null,0x4E,0x5E,null,null,null,null,0x4A,null],
    NOP: [null,null,null,null,null,null,null,null,null,null,0xEA,null],
    ORA: [0x9,0x5,0x15,null,0xD,0x1D,0x19,null,0x1,0x11,null,null],
    TAX: [null,null,null,null,null,null,null,null,null,null,0xAA,null],
    TXA: [null,null,null,null,null,null,null,null,null,null,0x8A,null],
    DEX: [null,null,null,null,null,null,null,null,null,null,0xCA,null],
    INX: [null,null,null,null,null,null,null,null,null,null,0xE8,null],
    TAY: [null,null,null,null,null,null,null,null,null,null,0xA8,null],
    TYA: [null,null,null,null,null,null,null,null,null,null,0x98,null],
    DEY: [null,null,null,null,null,null,null,null,null,null,0x88,null],
    INY: [null,null,null,null,null,null,null,null,null,null,0xC8,null],
    ROR: [null,0x66,0x76,null,0x6E,0x7E,null,null,null,null,0x6A,null],
    ROL: [null,0x26,0x36,null,0x2E,0x3E,null,null,null,null,0x2A,null],
    RTI: [null,null,null,null,null,null,null,null,null,null,0x40,null],
    RTS: [null,null,null,null,null,null,null,null,null,null,0x60,null],
    SBC: [0xE9,0xE5,0xF5,null,0xED,0xFD,0xF9,null,0xE1,0xF1,null,null],
    STA: [null,0x85,0x95,null,0x8D,0x9D,0x99,null,0x81,0x91,null,null],
    TXS: [null,null,null,null,null,null,null,null,null,null,0x9A,null],
    TSX: [null,null,null,null,null,null,null,null,null,null,0xBA,null],
    PHA: [null,null,null,null,null,null,null,null,null,null,0x48,null],
    PLA: [null,null,null,null,null,null,null,null,null,null,0x68,null],
    PHP: [null,null,null,null,null,null,null,null,null,null,0x8,null],
    PLP: [null,null,null,null,null,null,null,null,null,null,0x28,null],
    STX: [null,0x86,null,0x96,0x8E,null,null,null,null,null,null,null],
    STY: [null,0x84,0x94,null,0x8C,null,null,null,null,null,null,null],
} as any;

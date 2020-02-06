import { toHexString, fromSignedByte, isWord } from "../util";

/** 
 * Array of tuples indexed by 6502 op code.
 * t[0] = instruction
 * t[1] = address mode
 */
const OP_CODE_ADDR_MODE = [
	['BRK', 'imp'], ['ORA', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ORA', 'zpg'], ['ASL', 'zpg'], ['???', 'imp'],
	['PHP', 'imp'], ['ORA', 'imm'], ['ASL', 'acc'], ['???', 'imp'],
	['???', 'imp'], ['ORA', 'abs'], ['ASL', 'abs'], ['???', 'imp'],
	['BPL', 'rel'], ['ORA', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ORA', 'zpx'], ['ASL', 'zpx'], ['???', 'imp'],
	['CLC', 'imp'], ['ORA', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ORA', 'abx'], ['ASL', 'abx'], ['???', 'imp'],
	['JSR', 'abs'], ['AND', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['BIT', 'zpg'], ['AND', 'zpg'], ['ROL', 'zpg'], ['???', 'imp'],
	['PLP', 'imp'], ['AND', 'imm'], ['ROL', 'acc'], ['???', 'imp'],
	['BIT', 'abs'], ['AND', 'abs'], ['ROL', 'abs'], ['???', 'imp'],
	['BMI', 'rel'], ['AND', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['AND', 'zpx'], ['ROL', 'zpx'], ['???', 'imp'],
	['SEC', 'imp'], ['AND', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['AND', 'abx'], ['ROL', 'abx'], ['???', 'imp'],
	['RTI', 'imp'], ['EOR', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['EOR', 'zpg'], ['LSR', 'zpg'], ['???', 'imp'],
	['PHA', 'imp'], ['EOR', 'imm'], ['LSR', 'acc'], ['???', 'imp'],
	['JMP', 'abs'], ['EOR', 'abs'], ['LSR', 'abs'], ['???', 'imp'],
	['BVC', 'rel'], ['EOR', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['EOR', 'zpx'], ['LSR', 'zpx'], ['???', 'imp'],
	['CLI', 'imp'], ['EOR', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['EOR', 'abx'], ['LSR', 'abx'], ['???', 'imp'],
	['RTS', 'imp'], ['ADC', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ADC', 'zpg'], ['ROR', 'zpg'], ['???', 'imp'],
	['PLA', 'imp'], ['ADC', 'imm'], ['ROR', 'acc'], ['???', 'imp'],
	['JMP', 'ind'], ['ADC', 'abs'], ['ROR', 'abs'], ['???', 'imp'],
	['BVS', 'rel'], ['ADC', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ADC', 'zpx'], ['ROR', 'zpx'], ['???', 'imp'],
	['SEI', 'imp'], ['ADC', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['ADC', 'abx'], ['ROR', 'abx'], ['???', 'imp'],
	['???', 'imp'], ['STA', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['STY', 'zpg'], ['STA', 'zpg'], ['STX', 'zpg'], ['???', 'imp'],
	['DEY', 'imp'], ['???', 'imp'], ['TXA', 'imp'], ['???', 'imp'],
	['STY', 'abs'], ['STA', 'abs'], ['STX', 'abs'], ['???', 'imp'],
	['BCC', 'rel'], ['STA', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['STY', 'zpx'], ['STA', 'zpx'], ['STX', 'zpy'], ['???', 'imp'],
	['TYA', 'imp'], ['STA', 'aby'], ['TXS', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['STA', 'abx'], ['???', 'imp'], ['???', 'imp'],
	['LDY', 'imm'], ['LDA', 'inx'], ['LDX', 'imm'], ['???', 'imp'],
	['LDY', 'zpg'], ['LDA', 'zpg'], ['LDX', 'zpg'], ['???', 'imp'],
	['TAY', 'imp'], ['LDA', 'imm'], ['TAX', 'imp'], ['???', 'imp'],
	['LDY', 'abs'], ['LDA', 'abs'], ['LDX', 'abs'], ['???', 'imp'],
	['BCS', 'rel'], ['LDA', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['LDY', 'zpx'], ['LDA', 'zpx'], ['LDX', 'zpy'], ['???', 'imp'],
	['CLV', 'imp'], ['LDA', 'aby'], ['TSX', 'imp'], ['???', 'imp'],
	['LDY', 'abx'], ['LDA', 'abx'], ['LDX', 'aby'], ['???', 'imp'],
	['CPY', 'imm'], ['CMP', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['CPY', 'zpg'], ['CMP', 'zpg'], ['DEC', 'zpg'], ['???', 'imp'],
	['INY', 'imp'], ['CMP', 'imm'], ['DEX', 'imp'], ['???', 'imp'],
	['CPY', 'abs'], ['CMP', 'abs'], ['DEC', 'abs'], ['???', 'imp'],
	['BNE', 'rel'], ['CMP', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['CMP', 'zpx'], ['DEC', 'zpx'], ['???', 'imp'],
	['CLD', 'imp'], ['CMP', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['CMP', 'abx'], ['DEC', 'abx'], ['???', 'imp'],
	['CPX', 'imm'], ['SBC', 'inx'], ['???', 'imp'], ['???', 'imp'],
	['CPX', 'zpg'], ['SBC', 'zpg'], ['INC', 'zpg'], ['???', 'imp'],
	['INX', 'imp'], ['SBC', 'imm'], ['NOP', 'imp'], ['???', 'imp'],
	['CPX', 'abs'], ['SBC', 'abs'], ['INC', 'abs'], ['???', 'imp'],
	['BEQ', 'rel'], ['SBC', 'iny'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['SBC', 'zpx'], ['INC', 'zpx'], ['???', 'imp'],
	['SED', 'imp'], ['SBC', 'aby'], ['???', 'imp'], ['???', 'imp'],
	['???', 'imp'], ['SBC', 'abx'], ['INC', 'abx'], ['???', 'imp']
];

const BYTES_PER_ADDR_MODE: any = {
	imp: 1,
	acc: 1,
	imm: 2,
	abs: 3,
	abx: 3,
	aby: 3,
	zpg: 2,
	zpx: 2,
	zpy: 2,
	ind: 3,
	inx: 2,
	iny: 2,
	rel: 2
};

export type DisassembledInstruction = {
    /** Address the instruction starts */
    address: number,
    /** Number of bytes for the instruction */
    bytes: number[],
    /** The assembly instruction */
    assembly: string;
}

/**
 * 
 * @param bytes Bytes to disassemble
 * @param baseAddr (optional) Address that the bytes start at in memory
 * @param startAddr (optional) Address to start at
 * @param stopAddr (optional) Address to stop at
 */
export function disassemble(bytes: number[], baseAddr = 0, startAddr = baseAddr, stopAddr = 0): DisassembledInstruction[] {
    const endAddr = baseAddr + bytes.length;

    if (!isWord(baseAddr)) {
        throw new Error("Invalid base address");
    }
    
    if (!isWord(startAddr) || startAddr < baseAddr || startAddr > endAddr) {
        throw new Error("Invalid start address");
    }

	if (stopAddr <= startAddr) {
        stopAddr = startAddr + bytes.length;
    }
    if (!isWord(stopAddr) || stopAddr < startAddr || stopAddr > endAddr) {
        throw new Error("Invalid stop address");
    }


    const result: DisassembledInstruction[] = [];

    let pc = startAddr;
	while (pc < stopAddr) {
        const next = disassembleNext(bytes, pc, baseAddr);
        result.push(next);
        pc += next.bytes.length;
    }

    return result;
}

function disassembleNext(bytes: number[], pc: number, baseAddr: number): DisassembledInstruction {
    const addr = pc - baseAddr;
	const instr = bytes[addr];
    
	const opCodeAddrMode = OP_CODE_ADDR_MODE[instr];
	const addrMode = opCodeAddrMode[1];

    const opBytes = [instr];
    let byte1 = "";
    let byte2 = "";

    const byteCount = BYTES_PER_ADDR_MODE[addrMode];
	if (byteCount > 1) {
        opBytes.push(bytes[addr + 1]);
        byte1 = getHexByte(opBytes[1])
    }
	if (byteCount > 2) {
        opBytes.push(bytes[addr + 2]);
        byte2 = getHexByte(opBytes[2])
    }

    let addrValue = "";
    
	switch (addrMode) {
		case 'imm':
			addrValue = '#$' + byte1;
			break;
		case 'zpg':
			addrValue = '$' + byte1;
			break;
		case 'acc':
			addrValue = 'A';
			break;
		case 'abs':
			addrValue = '$' + byte2 + byte1;
			break;
		case 'zpx':
			addrValue = '$' + byte1 + ',X';
			break;
		case 'zpy':
			addrValue = '$' + byte1 + ',Y';
			break;
		case 'abx':
			addrValue = '$' + byte2 + byte1 + ',X';
			break;
		case 'aby':
			addrValue = '$' + byte2 + byte1 + ',Y';
			break;
		case 'iny':
			addrValue = '($' + byte1 + '),Y';
			break;
		case 'inx':
			addrValue = '($' + byte1 + ',X)';
			break;
		case 'rel':
			const relAddr = getRelativeAddress(opBytes[1], pc + 2);
			addrValue = '$' + getHexWord(relAddr);
			break;
		case 'ind':
			addrValue = '($' + byte2 + byte1 + ')';
			break;
		default:
    }
    
    return {
        address: pc,
        assembly: opCodeAddrMode[0] + (addrValue ? " " + addrValue : ""),
        bytes: opBytes
    };
}

function getRelativeAddress(byte: number, baseAddr: number) {
    const relative = baseAddr + fromSignedByte(byte);
    return relative & 0xffff;
}

function getHexByte(v: number): string {
	return toHexString(v, 1);
}

function getHexWord(v: number): string {
	return toHexString(v, 2);
}

// eof